#!/usr/bin/env node

/**
 * T3 Updater Enhanced - Playwright Test Runner
 *
 * This script provides five main actions for comprehensive website testing:
 * 1. get-urls: Fetch URLs from sitemaps and combine with golden path URLs
 * 2. take-screenshots: Capture screenshots on multiple device viewports (Chromium)
 * 3. compare-screenshots: Compare before/after screenshots and generate diffs
 * 4. smoke-test: Perform functional testing with random link clicking
 * 5. lighthouse-test: Run Lighthouse against the homepage plus random sitemap pages
 *
 * Usage:
 *   node run-tests.cjs --action=get-urls --domain="https://example.com" --output="urls.txt"
 *   node run-tests.cjs --action=take-screenshots --url-file="urls.txt" --output="screenshots/"
 *   node run-tests.cjs --action=compare-screenshots --before-dir="before/" --after-dir="after/" --output-dir="diff/" --json-output="comparison.json"
 *   node run-tests.cjs --action=smoke-test --domain="https://example.com" --json-output="smoke-test.json"
 *   node run-tests.cjs --action=lighthouse-test --domain="https://example.com" --json-output="lighthouse.json"
 */

const { chromium, devices } = require('@playwright/test');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');
const axios = require('axios');
const cheerio = require('cheerio');
const dotenv = require('dotenv');
// pixelmatch v7+ is ESM, loaded dynamically below
let pixelmatch;
const { PNG } = require('pngjs');
const { program } = require('commander');
const { execFile } = require('child_process');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Load ESM modules dynamically
async function loadESMModules() {
    const pixelmatchModule = await import('pixelmatch');
    pixelmatch = pixelmatchModule.default;
}

// Configuration
// Documented as a "(built-in list)" default but previously absent, so the smoke test
// detected nothing at all unless the caller knew to set BROKEN_PAGE_STRINGS.
const DEFAULT_BROKEN_PAGE_STRINGS = [
    'Oops, an error occurred',
    'Uncaught TYPO3 Exception',
    'Fatal error:',
    'Parse error:',
    'Call to undefined',
    'An exception occurred',
    'Whoops, looks like something went wrong',
    'Service Unavailable',
    'Internal Server Error',
];

const CONFIG = {
    timeout: 45000, // Increased timeout for better reliability
    viewports: {
        desktop: { width: 1920, height: 1080 },
        ipad: { width: 820, height: 1180 },
        iphone: { width: 390, height: 844 }
    },
    devices: {
        desktop: 'Desktop Chrome',
        ipad: 'iPad (9th generation)',
        iphone: 'iPhone 15'
    },
    maxUrls: 100,
    maxLinksToClick: 10,
    screenshotQuality: 90,
    randomUrlsPerSitemap: 10,
    // Browser launch options for better stability
    browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
    ]
};

/**
 * Chromium launch options.
 * Playwright uses chromium-headless-shell when headless:true, which SIGSEGVs on macOS 26+.
 * On Darwin, use full Chromium with --headless=new (or PLAYWRIGHT_CHANNEL=chrome).
 */
function getChromiumLaunchOptions() {
    const base = { args: CONFIG.browserArgs };
    const channel = process.env.PLAYWRIGHT_CHANNEL;

    if (channel) {
        return { ...base, channel, headless: true };
    }

    if (process.platform === 'darwin') {
        return {
            ...base,
            headless: false,
            args: [...CONFIG.browserArgs, '--headless=new'],
        };
    }

    return { ...base, headless: true };
}

// Load configuration from .env/.env.local one level above this script,
// independent of the caller cwd. Real environment variables win.
function loadUpdaterEnvironment() {
    const updaterRoot = path.resolve(__dirname, '..');
    const mergedEnv = {};

    for (const filename of ['.env', '.env.local']) {
        const envPath = path.join(updaterRoot, filename);
        if (fs.existsSync(envPath)) {
            Object.assign(mergedEnv, dotenv.parse(fs.readFileSync(envPath)));
        }
    }

    for (const [key, value] of Object.entries(mergedEnv)) {
        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

if (isMainThread || !workerData?.role) {
    loadUpdaterEnvironment();
}

function normalizeVisitedUrl(value) {
    try {
        const url = new URL(value);
        url.hash = '';
        return url.href;
    } catch {
        return value;
    }
}

function getPositiveIntEnv(name, fallback, min = 1) {
    const parsed = Number.parseInt(process.env[name] || '', 10);

    if (Number.isFinite(parsed) && parsed >= min) {
        return parsed;
    }

    return fallback;
}

function getFloatEnv(name, fallback, min, max) {
    const parsed = Number.parseFloat(process.env[name] || '');

    if (Number.isFinite(parsed) && parsed >= min && parsed <= max) {
        return parsed;
    }

    return fallback;
}

function getVisualCompareEngine() {
    const engine = (process.env.VISUAL_COMPARE_ENGINE || 'odiff').trim().toLowerCase();

    if (engine === 'odiff' || engine === 'pixelmatch') {
        return engine;
    }

    logger.warning(`Unsupported VISUAL_COMPARE_ENGINE=${engine}; using odiff`);
    return 'odiff';
}

function getOdiffBinaryPath() {
    if (process.env.ODIFF_BIN) {
        return process.env.ODIFF_BIN;
    }

    const binaryName = process.platform === 'win32' ? 'odiff.cmd' : 'odiff';
    const candidates = [
        path.join(__dirname, 'node_modules', '.bin', binaryName),
        path.join(path.resolve(__dirname, '..'), 'node_modules', '.bin', binaryName),
    ];
    for (const localBinary of candidates) {
        if (fs.existsSync(localBinary)) {
            return localBinary;
        }
    }

    try {
        const packageDir = path.dirname(require.resolve('odiff-bin/package.json'));
        const platformBinary = path.join(
            packageDir,
            'bin',
            process.platform === 'win32' ? 'odiff.exe' : 'odiff'
        );
        if (fs.existsSync(platformBinary)) {
            return platformBinary;
        }
        return 'odiff';
    } catch {
        return 'odiff';
    }
}

function getAvailableParallelism() {
    if (typeof os.availableParallelism === 'function') {
        return os.availableParallelism();
    }

    return os.cpus()?.length || 4;
}

function getDefaultScreenshotConcurrency() {
    return Math.max(4, Math.min(6, getAvailableParallelism() * 2));
}

function getDefaultCompareConcurrency() {
    return Math.max(2, Math.min(4, getAvailableParallelism()));
}

function getVisualTestMaxWorkers() {
    return getPositiveIntEnv(
        'VISUAL_TEST_MAX_WORKERS',
        Math.max(4, getAvailableParallelism() * 2)
    );
}

function getBoundedConcurrencyEnv(name, fallback, itemCount) {
    const requested = getPositiveIntEnv(name, fallback);
    const bounded = Math.max(1, Math.min(requested, getVisualTestMaxWorkers(), Math.max(1, itemCount)));

    if (requested > bounded) {
        logger.warning(`${name}=${requested} reduced to ${bounded} for this run`);
    }

    return bounded;
}

async function runWithConcurrency(items, concurrency, worker) {
    if (items.length === 0) {
        return [];
    }

    const workerCount = Math.max(1, Math.min(concurrency, items.length));
    const results = new Array(items.length);
    let nextIndex = 0;

    async function runWorker() {
        while (nextIndex < items.length) {
            const index = nextIndex;
            nextIndex += 1;
            results[index] = await worker(items[index], index);
        }
    }

    await Promise.all(Array.from({ length: workerCount }, runWorker));
    return results;
}

function getSitemapTargets(domain) {
    const cleanDomain = domain.replace(/^https?:\/\//, '');
    const languages = process.env.LANGUAGE_LIST ? process.env.LANGUAGE_LIST.split(',') : ['en', 'de'];
    const targets = [
        {
            url: `https://${cleanDomain}/sitemap.xml`,
            label: 'main sitemap'
        }
    ];

    for (const lang of languages) {
        const langPrefix = lang.trim();

        if (!langPrefix || langPrefix === '/') {
            continue;
        }

        targets.push({
            url: `https://${cleanDomain}/${langPrefix}/sitemap.xml`,
            label: `${langPrefix} sitemap`
        });
    }

    return targets;
}

function getDeviceUserAgent(device) {
    const deviceName = device === 'desktop'
        ? 'Desktop Chrome'
        : device === 'ipad'
            ? 'iPad (9th generation)'
            : 'iPhone 15';

    return devices[deviceName]?.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
}

function getScreenshotContextOptions(device) {
    return {
        viewport: CONFIG.viewports[device],
        userAgent: getDeviceUserAgent(device),
        ignoreHTTPSErrors: true,
        acceptDownloads: false
    };
}

function getSafeScreenshotPath(outputDir, url, device, suffix) {
    const urlObj = new URL(url);
    const queryPart = urlObj.search
        ? `_q${crypto.createHash('md5').update(urlObj.search).digest('hex').substring(0, 8)}`
        : '';
    const extensionReserve = suffix === '.error.json' ? 25 : 20;
    const maxPathLength = Math.max(16, 200 - urlObj.hostname.length - device.length - queryPart.length - extensionReserve);
    let pathPart = urlObj.pathname.replace(/\//g, '_');

    if (pathPart.length > maxPathLength) {
        const hash = crypto.createHash('md5').update(`${urlObj.pathname}${urlObj.search}`).digest('hex').substring(0, 8);
        const keepLength = Math.max(1, maxPathLength - 9);
        pathPart = `${pathPart.substring(0, keepLength)}_${hash}`;
    }

    return path.join(outputDir, `${urlObj.hostname}${pathPart}${queryPart}_${device}${suffix}`);
}

/**
 * Parse command line arguments
 */
function parseArguments() {
    program
        .option('--action <action>', 'Action to perform: get-urls, take-screenshots, compare-screenshots, smoke-test, lighthouse-test')
        .option('--domain <domain>', 'Base domain URL')
        .option('--output <output>', 'Output file or directory path')
        .option('--url-file <urlFile>', 'File containing URLs to test')
        .option('--before-dir <beforeDir>', 'Directory containing before screenshots')
        .option('--after-dir <afterDir>', 'Directory containing after screenshots')
        .option('--output-dir <outputDir>', 'Directory for diff output')
        .option('--json-output <jsonOutput>', 'JSON output file path')
        .parse();

    const options = program.opts();

    if (!options.action) {
        console.error('Error: --action is required');
        process.exit(1);
    }

    return options;
}

/**
 * Logging utilities with colors
 */
const colors = {
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    PURPLE: '\x1b[35m',
    CYAN: '\x1b[36m',
    NC: '\x1b[0m' // No Color
};

const logger = {
    info: (msg) => console.log(`${colors.BLUE}[INFO]${colors.NC} ${msg}`),
    success: (msg) => console.log(`${colors.GREEN}[SUCCESS]${colors.NC} ${msg}`),
    warning: (msg) => console.log(`${colors.YELLOW}[WARNING]${colors.NC} ${msg}`),
    error: (msg) => console.error(`${colors.RED}[ERROR]${colors.NC} ${msg}`),
    step: (msg) => console.log(`${colors.PURPLE}[STEP]${colors.NC} ${msg}`),
    debug: (msg) => console.log(`${colors.CYAN}[DEBUG]${colors.NC} ${msg}`)
};

/**
 * Get URLs from sitemaps and combine with golden path URLs
 */
async function getUrls(domain, outputFile) {
    logger.info(`Fetching URLs from sitemaps for domain: ${domain}`);

    const urls = new Set();
    const normalizedDomain = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;

    try {
        // Add golden path URLs
        if (process.env.GOLDEN_PATH_URLS) {
            const goldenUrls = process.env.GOLDEN_PATH_URLS.split(',').map(url => url.trim());
            goldenUrls.forEach(url => {
                if (!url) {
                    return;
                }

                try {
                    if (/^https?:\/\//i.test(url)) {
                        urls.add(url);
                    } else if (url.startsWith('/')) {
                        urls.add(new URL(url, normalizedDomain).href);
                    } else {
                        urls.add(new URL(`/${url}`, normalizedDomain).href);
                    }
                } catch (error) {
                    logger.warning(`Skipping invalid golden path URL '${url}': ${error.message}`);
                }
            });
        }

        const sitemapTargets = getSitemapTargets(domain);
        const sitemapConcurrency = getPositiveIntEnv('SITEMAP_CONCURRENCY', 4);
        const randomCount = getPositiveIntEnv('RANDOM_URLS_PER_SITEMAP', CONFIG.randomUrlsPerSitemap);

        logger.info(`Fetching ${sitemapTargets.length} sitemap(s) with concurrency ${Math.min(sitemapConcurrency, sitemapTargets.length)}`);

        await runWithConcurrency(sitemapTargets, sitemapConcurrency, async (target) => {
            logger.info(`Fetching ${target.label}: ${target.url}`);
            const sitemapUrls = await fetchSitemapUrls(target.url);
            const randomUrls = getRandomUrls(sitemapUrls, randomCount);
            randomUrls.forEach(url => urls.add(url));
            logger.info(`Added ${randomUrls.length} random URLs from ${target.url}`);
        });

        // Convert to array and limit
        const urlArray = Array.from(urls).slice(0, getPositiveIntEnv('MAX_URLS', CONFIG.maxUrls));

        if (urlArray.length === 0) {
            throw new Error('No URLs discovered from sitemaps and GOLDEN_PATH_URLS');
        }

        // Write to output file
        const absoluteOutputFile = path.resolve(outputFile);
        await fs.writeFile(outputFile, urlArray.join('\n'));

        logger.success(`Found ${urlArray.length} URLs and saved to ${absoluteOutputFile}`);

    } catch (error) {
        logger.error(`Failed to get URLs: ${error.message}`);
        throw error;
    }
}

/**
 * Get random URLs from a list
 */
function getRandomUrls(urls, count) {
    if (urls.length <= count) {
        return urls;
    }

    // Shuffle array and take first 'count' elements
    const shuffled = [...urls].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Fetch URLs from a sitemap
 */
async function fetchSitemapUrls(sitemapUrl) {
    const urls = [];

    try {
        const response = await axios.get(sitemapUrl, { timeout: 10000 });
        const $ = cheerio.load(response.data, { xmlMode: true });

        // Handle sitemap index
        const sitemapIndexes = [];
        $('sitemap > loc').each((i, elem) => {
            const subSitemapUrl = $(elem).text();
            if (subSitemapUrl) {
                sitemapIndexes.push(subSitemapUrl);
            }
        });

        // If this is a sitemap index, fetch all sub-sitemaps
        if (sitemapIndexes.length > 0) {
            logger.info(`Found sitemap index with ${sitemapIndexes.length} sub-sitemaps`);
            const sitemapConcurrency = getPositiveIntEnv('SITEMAP_CONCURRENCY', 4);
            await runWithConcurrency(sitemapIndexes, sitemapConcurrency, async (subSitemapUrl) => {
                const subUrls = await fetchSitemapUrls(subSitemapUrl);
                urls.push(...subUrls);
                logger.info(`Fetched ${subUrls.length} URLs from sub-sitemap: ${subSitemapUrl}`);
            });
        } else {
            // Handle regular sitemap
            $('url > loc').each((i, elem) => {
                const url = $(elem).text();
                if (url) {
                    urls.push(url);
                }
            });
        }

    } catch (error) {
        logger.warning(`Failed to parse sitemap ${sitemapUrl}: ${error.message}`);
    }

    return urls;
}

/**
 * Take screenshots for URLs on multiple devices
 */
async function captureScreenshot({ context, outputDir, url, device, stabilizeMs }) {
    let page = null;

    try {
        page = await context.newPage();
        page.setDefaultTimeout(CONFIG.timeout);
        page.setDefaultNavigationTimeout(CONFIG.timeout);

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: CONFIG.timeout
        });

        if (stabilizeMs > 0) {
            await page.waitForTimeout(stabilizeMs);
        }

        const [titleResult, languageResult] = await Promise.allSettled([
            page.title(),
            page.evaluate(() => {
                const htmlElement = document.documentElement;
                return htmlElement.getAttribute('lang') || 'unknown';
            })
        ]);

        const pageTitle = titleResult.status === 'fulfilled' ? titleResult.value : 'Unknown';
        const pageLanguage = languageResult.status === 'fulfilled' ? languageResult.value : 'unknown';
        const filepath = getSafeScreenshotPath(outputDir, url, device, '.png');

        await page.screenshot({
            path: filepath,
            fullPage: true,
            animations: 'disabled'
        });

        const metadataFile = filepath.replace('.png', '.metadata.json');
        await fs.writeFile(metadataFile, JSON.stringify({
            url: url,
            title: pageTitle,
            language: pageLanguage,
            device: device,
            timestamp: new Date().toISOString()
        }, null, 2));

        logger.info(`Screenshot saved: ${path.resolve(filepath)}`);
        return { success: true, url, device };
    } catch (error) {
        logger.warning(`Failed to screenshot ${url} on ${device}: ${error.message}`);

        try {
            const errorMetadataFile = getSafeScreenshotPath(outputDir, url, device, '.error.json');
            await fs.writeFile(errorMetadataFile, JSON.stringify({
                url: url,
                device: device,
                error: error.message,
                timestamp: new Date().toISOString(),
                stack: error.stack
            }, null, 2));
        } catch (metadataError) {
            logger.warning(`Failed to write error metadata for ${url}: ${metadataError.message}`);
        }

        return { success: false, url, device, error: error.message };
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (closeError) {
                logger.warning(`Failed to close page for ${url} on ${device}: ${closeError.message}`);
            }
        }
    }
}

async function takeScreenshots(urlFile, outputDir) {
    logger.info(`Taking screenshots for URLs in ${urlFile}`);

    let browser = null;
    let contexts = {};

    try {
        // Read URLs from file
        const urls = Array.from(new Set((await fs.readFile(urlFile, 'utf8'))
            .split('\n')
            .map(url => url.trim())
            .filter(url => url.length > 0)));

        if (urls.length === 0) {
            throw new Error('No URLs found in file');
        }

        // Create output directory
        await fs.ensureDir(outputDir);

        // Use one Chromium process with isolated per-device contexts. This starts faster
        // and is less fragile when multiple updater runs execute in parallel.
        logger.info('Initializing browser...');
        const launchOptions = getChromiumLaunchOptions();
        const deviceKeys = Object.keys(CONFIG.viewports);
        browser = await chromium.launch(launchOptions);

        // Create contexts with better configuration
        logger.info('Creating browser contexts...');
        const contextEntries = await Promise.all(deviceKeys.map(async (device) => [
            device,
            await browser.newContext(getScreenshotContextOptions(device))
        ]));
        contexts = Object.fromEntries(contextEntries);

        const screenshotJobs = urls.flatMap(url => deviceKeys.map(device => ({ url, device })));
        const screenshotConcurrency = getBoundedConcurrencyEnv('SCREENSHOT_CONCURRENCY', getDefaultScreenshotConcurrency(), screenshotJobs.length);
        const stabilizeMs = getPositiveIntEnv('SCREENSHOT_STABILIZE_MS', 2000, 0);
        const retries = getPositiveIntEnv('SCREENSHOT_RETRIES', 1, 0);

        logger.info(`Taking ${screenshotJobs.length} screenshots with concurrency ${screenshotConcurrency} and ${retries} ${retries === 1 ? 'retry' : 'retries'}`);

        const results = await runWithConcurrency(screenshotJobs, screenshotConcurrency, async (job) => {
            let lastResult = null;

            for (let attempt = 0; attempt <= retries; attempt++) {
                lastResult = await captureScreenshot({
                    context: contexts[job.device],
                    outputDir,
                    url: job.url,
                    device: job.device,
                    stabilizeMs
                });

                if (lastResult.success || attempt === retries) {
                    return lastResult;
                }

                logger.warning(`Retrying screenshot for ${job.url} on ${job.device} (${attempt + 1}/${retries})`);
            }

            return lastResult;
        });

        const failedCount = results.filter(result => !result.success).length;
        if (failedCount > 0) {
            logger.warning(`${failedCount} screenshot(s) failed; error metadata was written where possible`);
        }

        logger.success(`Screenshots completed and saved to ${path.resolve(outputDir)}`);

    } catch (error) {
        logger.error(`Failed to take screenshots: ${error.message}`);
        throw error;
    } finally {
        // Always clean up browsers and contexts
        logger.info('Cleaning up browsers and contexts...');

        // Close all contexts first
        for (const [device, context] of Object.entries(contexts)) {
            try {
                if (context) {
                    await context.close();
                }
            } catch (error) {
                logger.warning(`Failed to close context for ${device}: ${error.message}`);
            }
        }

        try {
            if (browser && browser.isConnected()) {
                await browser.close();
            }
        } catch (error) {
            logger.warning(`Failed to close browser: ${error.message}`);
        }
    }
}

/**
 * Compare screenshots and generate diffs
 */
function buildComparisonResult(beforeFile, status, message, metadata = {}, extra = {}) {
    return {
        file: beforeFile,
        status,
        message,
        title: metadata?.title || 'Unknown',
        language: metadata?.language || 'unknown',
        url: metadata?.url || 'Unknown',
        ...extra
    };
}

async function readScreenshotMetadata(beforePath, beforeFile) {
    const metadataPath = beforePath.replace('.png', '.metadata.json');

    if (!(await fs.pathExists(metadataPath))) {
        return null;
    }

    try {
        return await fs.readJson(metadataPath);
    } catch (error) {
        logger.warning(`Failed to read metadata for ${beforeFile}: ${error.message}`);
        return null;
    }
}

async function readPngDimensions(filePath) {
    const img = PNG.sync.read(await fs.readFile(filePath));
    return `${img.width}x${img.height}`;
}

function parseOdiffOutput(stdout) {
    const output = String(stdout || '').trim();
    const [diffPixelsRaw, diffPercentageRaw] = output.split(';');
    const diffPixels = Number.parseInt(diffPixelsRaw || '0', 10);
    const diffPercentage = Number.parseFloat(diffPercentageRaw || '0');

    return {
        diffPixels: Number.isFinite(diffPixels) ? diffPixels : 0,
        diffPercentage: Number.isFinite(diffPercentage) ? diffPercentage : 0
    };
}

function getMinorDiffPercent() {
    return getFloatEnv('VISUAL_MINOR_DIFF_PERCENT', 1, 0, 100);
}

function normalizeDiffPercentage(value) {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Number(value.toFixed(2));
}

function getDiffStatus(diffPixels, diffPercentage) {
    if (diffPixels === 0) {
        return 'match';
    }

    return diffPercentage <= getMinorDiffPercent() ? 'minor' : 'different';
}

function getDiffMessage(status, diffPixels, diffPercentage) {
    if (status === 'minor') {
        return `Minor visual difference: ${diffPixels} pixels (${diffPercentage}%)`;
    }

    return `${diffPixels} different pixels`;
}

function runOdiff(beforePath, afterPath, diffPath, threshold, timeoutMs) {
    return new Promise((resolve) => {
        const args = [
            beforePath,
            afterPath,
            diffPath,
            '--threshold',
            String(threshold),
            '--aa',
            '--fail-on-layout',
            '--parsable-stdout'
        ];

        execFile(getOdiffBinaryPath(), args, {
            timeout: timeoutMs,
            maxBuffer: 1024 * 1024
        }, (error, stdout, stderr) => {
            if (!error) {
                resolve({ type: 'match', stdout });
                return;
            }

            if (error.killed || error.signal) {
                resolve({
                    type: 'fallback',
                    reason: `odiff timed out or was killed${error.signal ? ` (${error.signal})` : ''}`
                });
                return;
            }

            if (error.code === 22) {
                resolve({ type: 'different', stdout });
                return;
            }

            if (error.code === 21) {
                resolve({ type: 'layout', stdout });
                return;
            }

            const message = [error.message, stderr].filter(Boolean).join(': ');
            resolve({
                type: 'fallback',
                reason: message || `odiff exited with code ${error.code}`
            });
        });
    });
}

async function compareScreenshotPairWithOdiff({ beforeDir, afterDir, outputDir, beforeFile, threshold, timeoutMs, metadata: existingMetadata }) {
    const beforePath = path.join(beforeDir, beforeFile);
    const afterPath = path.join(afterDir, beforeFile);
    const metadata = existingMetadata || await readScreenshotMetadata(beforePath, beforeFile);

    if (!(await fs.pathExists(afterPath))) {
        return buildComparisonResult(beforeFile, 'error', 'After screenshot not found', metadata);
    }

    const diffPath = path.join(outputDir, `diff_${beforeFile}`);
    const odiffResult = await runOdiff(beforePath, afterPath, diffPath, threshold, timeoutMs);

    if (odiffResult.type === 'match') {
        return buildComparisonResult(beforeFile, 'match', 'No differences found', metadata, {
            engine: 'odiff'
        });
    }

    if (odiffResult.type === 'different') {
        const parsedDiff = parseOdiffOutput(odiffResult.stdout);
        const diffPixels = parsedDiff.diffPixels;
        const diffPercentage = normalizeDiffPercentage(parsedDiff.diffPercentage);
        const diffStatus = getDiffStatus(diffPixels, diffPercentage);
        logger.info(`Diff image saved: ${path.resolve(diffPath)}`);

        return buildComparisonResult(beforeFile, diffStatus, getDiffMessage(diffStatus, diffPixels, diffPercentage), metadata, {
            diffPixels,
            diffPercentage,
            diffImage: diffPath,
            engine: 'odiff'
        });
    }

    if (odiffResult.type === 'layout') {
        const [beforeSize, afterSize] = await Promise.allSettled([
            readPngDimensions(beforePath),
            readPngDimensions(afterPath)
        ]);

        return buildComparisonResult(beforeFile, 'different', 'Different dimensions', metadata, {
            beforeSize: beforeSize.status === 'fulfilled' ? beforeSize.value : 'unknown',
            afterSize: afterSize.status === 'fulfilled' ? afterSize.value : 'unknown',
            engine: 'odiff'
        });
    }

    return {
        fallback: true,
        reason: odiffResult.reason || 'odiff failed',
        metadata
    };
}

async function compareScreenshotPairWithPixelmatch({ beforeDir, afterDir, outputDir, beforeFile, threshold, metadata: existingMetadata }) {
    if (!pixelmatch) {
        await loadESMModules();
    }

    const beforePath = path.join(beforeDir, beforeFile);
    const afterPath = path.join(afterDir, beforeFile);
    const metadata = existingMetadata || await readScreenshotMetadata(beforePath, beforeFile);

    if (!(await fs.pathExists(afterPath))) {
        return buildComparisonResult(beforeFile, 'error', 'After screenshot not found', metadata);
    }

    let beforeImg;
    try {
        beforeImg = PNG.sync.read(await fs.readFile(beforePath));
    } catch (error) {
        return buildComparisonResult(beforeFile, 'error', `Failed to read before image: ${error.message}`, metadata);
    }

    let afterImg;
    try {
        afterImg = PNG.sync.read(await fs.readFile(afterPath));
    } catch (error) {
        return buildComparisonResult(beforeFile, 'error', `Failed to read after image: ${error.message}`, metadata);
    }

    if (beforeImg.width !== afterImg.width || beforeImg.height !== afterImg.height) {
        return buildComparisonResult(beforeFile, 'different', 'Different dimensions', metadata, {
            beforeSize: `${beforeImg.width}x${beforeImg.height}`,
            afterSize: `${afterImg.width}x${afterImg.height}`,
            engine: 'pixelmatch'
        });
    }

    const diff = new PNG({ width: beforeImg.width, height: beforeImg.height });
    const numDiffPixels = pixelmatch(
        beforeImg.data,
        afterImg.data,
        diff.data,
        beforeImg.width,
        beforeImg.height,
        { threshold }
    );

    if (numDiffPixels === 0) {
        return buildComparisonResult(beforeFile, 'match', 'No differences found', metadata, {
            engine: 'pixelmatch'
        });
    }

    const diffPath = path.join(outputDir, `diff_${beforeFile}`);
    await fs.writeFile(diffPath, PNG.sync.write(diff));
    logger.info(`Diff image saved: ${path.resolve(diffPath)}`);
    const diffPercentage = normalizeDiffPercentage((numDiffPixels / (beforeImg.width * beforeImg.height)) * 100);
    const diffStatus = getDiffStatus(numDiffPixels, diffPercentage);

    return buildComparisonResult(beforeFile, diffStatus, getDiffMessage(diffStatus, numDiffPixels, diffPercentage), metadata, {
        diffPixels: numDiffPixels,
        diffPercentage,
        diffImage: diffPath,
        engine: 'pixelmatch'
    });
}

function compareScreenshotInWorker(job, timeoutMs) {
    return new Promise((resolve) => {
        let settled = false;
        const worker = new Worker(__filename, {
            workerData: {
                role: 'compare-screenshot',
                job
            }
        });

        const finish = (result) => {
            if (settled) {
                return;
            }

            settled = true;
            clearTimeout(timer);
            resolve(result);
        };

        const timer = setTimeout(() => {
            if (settled) {
                return;
            }

            settled = true;
            worker.terminate().catch(() => {});
            resolve(buildComparisonResult(job.beforeFile, 'error', `Comparison worker timed out after ${timeoutMs}ms`, job.metadata));
        }, timeoutMs);

        worker.once('message', (message) => {
            finish(message?.result || buildComparisonResult(job.beforeFile, 'error', 'Comparison worker returned no result', job.metadata));
        });

        worker.once('error', (error) => {
            finish(buildComparisonResult(job.beforeFile, 'error', `Comparison worker failed: ${error.message}`, job.metadata));
        });

        worker.once('exit', (code) => {
            if (code !== 0) {
                finish(buildComparisonResult(job.beforeFile, 'error', `Comparison worker exited with code ${code}`, job.metadata));
            }
        });
    });
}

async function runCompareScreenshotWorker() {
    try {
        const result = await compareScreenshotPairWithPixelmatch(workerData.job);
        parentPort.postMessage({ result });
    } catch (error) {
        parentPort.postMessage({
            result: buildComparisonResult(
                workerData?.job?.beforeFile || 'unknown',
                'error',
                error.message,
                workerData?.job?.metadata
            )
        });
    }
}

async function compareScreenshots(beforeDir, afterDir, outputDir, jsonOutput) {
    logger.info(`Comparing screenshots between ${beforeDir} and ${afterDir}`);

    try {
        // Ensure output directory exists
        await fs.ensureDir(outputDir);

        const results = {
            total: 0,
            matches: 0,
            minorDifferences: 0,
            differences: 0,
            errors: 0,
            comparisons: []
        };

        // Get all before screenshots
        const beforeFiles = await fs.readdir(beforeDir);
        const beforeScreenshots = beforeFiles.filter(file => file.endsWith('.png')).sort();
        const compareConcurrency = getBoundedConcurrencyEnv('COMPARE_CONCURRENCY', getDefaultCompareConcurrency(), beforeScreenshots.length);
        const workerTimeoutMs = getPositiveIntEnv('COMPARE_WORKER_TIMEOUT_MS', 120000, 1000);
        const threshold = getFloatEnv('VISUAL_THRESHOLD', 0.1, 0, 1);
        const compareEngine = getVisualCompareEngine();
        const usePixelmatchWorkers = compareEngine === 'pixelmatch' && isMainThread && compareConcurrency > 1;

        logger.info(`Comparing ${beforeScreenshots.length} screenshots with ${compareEngine} at concurrency ${compareConcurrency}${usePixelmatchWorkers ? ' worker threads' : ''}`);

        const comparisons = await runWithConcurrency(beforeScreenshots, compareConcurrency, async (beforeFile) => {
            const metadata = await readScreenshotMetadata(path.join(beforeDir, beforeFile), beforeFile);
            const job = {
                beforeDir,
                afterDir,
                outputDir,
                beforeFile,
                threshold,
                timeoutMs: workerTimeoutMs,
                metadata
            };

            if (compareEngine === 'odiff') {
                const odiffResult = await compareScreenshotPairWithOdiff(job);

                if (!odiffResult.fallback) {
                    return odiffResult;
                }

                logger.warning(`odiff failed for ${beforeFile}: ${odiffResult.reason}; falling back to pixelmatch`);
                return compareScreenshotInWorker(job, workerTimeoutMs);
            }

            if (usePixelmatchWorkers) {
                return compareScreenshotInWorker(job, workerTimeoutMs);
            }

            try {
                return await compareScreenshotPairWithPixelmatch(job);
            } catch (error) {
                return buildComparisonResult(beforeFile, 'error', error.message);
            }
        });

        for (const comparison of comparisons) {
            results.total++;
            results.comparisons.push(comparison);

            if (comparison.status === 'match') {
                results.matches++;
            } else if (comparison.status === 'minor') {
                results.minorDifferences++;
            } else if (comparison.status === 'different') {
                results.differences++;
            } else {
                results.errors++;
            }
        }

        // Files present only in the "after" directory are invisible to a beforeDir-only walk:
        // a page that started rendering MORE content would never be reported. Detect them.
        try {
            const afterFiles = (await fs.readdir(afterDir)).filter(f => f.endsWith('.png') && !f.startsWith('diff_'));
            const beforeSet = new Set(files);
            results.onlyInAfter = afterFiles.filter(f => !beforeSet.has(f));
        } catch {
            results.onlyInAfter = [];
        }

        // Zero-tolerance policy: "minor" is not a passing verdict. On a long full-page
        // screenshot a percentage covers many pixels, so a missing button can hide inside it.
        results.findings = results.differences + results.minorDifferences + results.errors
            + (results.onlyInAfter?.length || 0);

        // Write JSON results
        await fs.writeFile(jsonOutput, JSON.stringify(results, null, 2));

        logger.success(`Comparison completed: ${results.matches} matches, ${results.minorDifferences} minor differences, ${results.differences} differences, ${results.errors} errors, ${results.onlyInAfter.length} only-in-after`);
        logger.info(`Results saved to ${path.resolve(jsonOutput)}`);

        return results;

    } catch (error) {
        logger.error(`Failed to compare screenshots: ${error.message}`);
        throw error;
    }
}

/**
 * Perform smoke test with random link clicking
 */
async function smokeTest(domain, jsonOutput) {
    logger.info(`Running smoke test for domain: ${domain}`);

    try {
        const results = {
            domain: domain,
            startTime: new Date().toISOString(),
            visitedUrls: [],
            errors: [],
            brokenPageStrings: process.env.BROKEN_PAGE_STRINGS ? process.env.BROKEN_PAGE_STRINGS.split('|') : DEFAULT_BROKEN_PAGE_STRINGS
        };

        const browser = await chromium.launch(getChromiumLaunchOptions());
        const context = await browser.newContext({
            viewport: CONFIG.viewports.desktop,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        const page = await context.newPage();

        // Start at homepage with more lenient wait conditions
        logger.info(`Starting smoke test at homepage: ${domain}`);
        try {
            await page.goto(domain, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
        } catch (error) {
            logger.warning(`Failed to load homepage with domcontentloaded, trying load: ${error.message}`);
            await page.goto(domain, { waitUntil: 'load', timeout: CONFIG.timeout });
        }

        // Check homepage for broken page strings
        const homepageContent = await page.content();
        const homepageErrors = checkForBrokenStrings(homepageContent, results.brokenPageStrings);
        if (homepageErrors.length > 0) {
            results.errors.push({
                url: domain,
                type: 'broken_page_strings',
                errors: homepageErrors
            });
        }

        const visitedUrlKeys = new Set([
            normalizeVisitedUrl(domain),
            normalizeVisitedUrl(page.url())
        ]);

        results.visitedUrls.push({
            url: page.url(),
            status: 'visited',
            timestamp: new Date().toISOString()
        });

        // Randomly click internal links
        let linksClicked = 0;
        const maxLinks = Math.min(CONFIG.maxLinksToClick, 10);

        while (linksClicked < maxLinks) {
            try {
                // Get all internal links
                const allowedOrigins = Array.from(new Set([
                    new URL(domain).origin,
                    new URL(page.url()).origin
                ]));

                const links = await page.$$eval('a[href]', (anchors, origins) => {
                    return Array.from(new Set(anchors
                        .map(a => a.href)
                        .filter(href => {
                            try {
                                const url = new URL(href);
                                // Only follow HTML pages, not file downloads
                                const isHtmlPage = !href.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz|mp4|mp3|avi|mov|jpg|jpeg|png|gif|svg|ico|css|js|xml|txt)$/i);
                                return origins.includes(url.origin) &&
                                       !href.includes('#') &&
                                       !href.includes('mailto:') &&
                                       !href.includes('tel:') &&
                                       isHtmlPage;
                            } catch {
                                return false;
                            }
                        })));
                }, allowedOrigins);

                const unvisitedLinks = links.filter(link => !visitedUrlKeys.has(normalizeVisitedUrl(link)));

                if (unvisitedLinks.length === 0) {
                    logger.info('No more internal links found');
                    break;
                }

                // Pick a random link
                const randomLink = unvisitedLinks[Math.floor(Math.random() * unvisitedLinks.length)];

                logger.info(`Clicking link: ${randomLink}`);

                // Navigate to the link with more lenient wait conditions
                try {
                    await page.goto(randomLink, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
                } catch (error) {
                    logger.warning(`Failed to load ${randomLink} with domcontentloaded, trying load: ${error.message}`);
                    try {
                        await page.goto(randomLink, { waitUntil: 'load', timeout: CONFIG.timeout });
                    } catch (loadError) {
                        logger.error(`Failed to load ${randomLink}: ${loadError.message}`);
                        results.errors.push({
                            url: randomLink,
                            type: 'navigation_error',
                            error: loadError.message
                        });
                        continue;
                    }
                }

                // Check for broken page strings
                const pageContent = await page.content();
                const pageErrors = checkForBrokenStrings(pageContent, results.brokenPageStrings);
                if (pageErrors.length > 0) {
                    results.errors.push({
                        url: randomLink,
                        type: 'broken_page_strings',
                        errors: pageErrors
                    });
                }

                results.visitedUrls.push({
                    url: randomLink,
                    status: 'visited',
                    timestamp: new Date().toISOString()
                });
                visitedUrlKeys.add(normalizeVisitedUrl(randomLink));
                visitedUrlKeys.add(normalizeVisitedUrl(page.url()));

                linksClicked++;

                // Wait a bit before next click
                await page.waitForTimeout(1000);

            } catch (error) {
                logger.warning(`Error during smoke test: ${error.message}`);
                results.errors.push({
                    url: page.url(),
                    type: 'navigation_error',
                    error: error.message
                });
                break;
            }
        }

        await browser.close();

        results.endTime = new Date().toISOString();
        results.totalVisited = results.visitedUrls.length;
        results.totalErrors = results.errors.length;

        // Write JSON results
        await fs.writeFile(jsonOutput, JSON.stringify(results, null, 2));

        logger.success(`Smoke test completed: visited ${results.totalVisited} URLs, found ${results.totalErrors} errors`);
        logger.info(`Results saved to ${path.resolve(jsonOutput)}`);

        results.findings = results.totalErrors;
        return results;

    } catch (error) {
        logger.error(`Failed to run smoke test: ${error.message}`);
        throw error;
    }
}

/**
 * Check for broken page strings in content
 */
function checkForBrokenStrings(content, brokenStrings) {
    const errors = [];

    for (const brokenString of brokenStrings) {
        if (content.includes(brokenString)) {
            errors.push(brokenString);
        }
    }

    return errors;
}

/**
 * Run Lighthouse performance tests
 */
async function lighthouseTest(domain, jsonOutput) {
    logger.info(`Running Lighthouse tests for domain: ${domain}`);

    // Import Lighthouse modules at the top level
    const { default: lighthouse } = require('lighthouse');
    const chromeLauncher = require('chrome-launcher');

    try {
        const results = {
            domain: domain,
            startTime: new Date().toISOString(),
            tests: [],
            summary: {
                totalTests: 0,
                averagePerformance: 0,
                averageAccessibility: 0,
                averageBestPractices: 0,
                averageSEO: 0
            }
        };

        // Get URLs to test (homepage + 3 random pages from sitemap)
        const urlsToTest = await getLighthouseUrls(domain);

        logger.info(`Testing ${urlsToTest.length} URLs with Lighthouse`);

        for (const url of urlsToTest) {
            try {
                logger.info(`Running Lighthouse test for: ${url}`);

                // Launch Chrome
                const chrome = await chromeLauncher.launch({
                    chromeFlags: ['--headless', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--disable-web-security']
                });

                // Run Lighthouse
                const result = await lighthouse(url, {
                    port: chrome.port,
                    output: 'json',
                    logLevel: 'error',
                    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
                });

                const lhr = result.lhr;

                // Close Chrome
                await chrome.kill();

                // Extract top 5 action points from opportunities and diagnostics
                const actionPoints = extractTopActionPoints(lhr);

                const testResult = {
                    url: url,
                    timestamp: new Date().toISOString(),
                    performance: {
                        score: Math.round((lhr.categories.performance?.score || 0) * 100),
                        firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue || 0,
                        largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue || 0,
                        speedIndex: lhr.audits['speed-index']?.numericValue || 0,
                        cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue || 0,
                        totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue || 0
                    },
                    accessibility: {
                        score: Math.round((lhr.categories.accessibility?.score || 0) * 100)
                    },
                    bestPractices: {
                        score: Math.round((lhr.categories['best-practices']?.score || 0) * 100)
                    },
                    seo: {
                        score: Math.round((lhr.categories.seo?.score || 0) * 100)
                    },
                    actionPoints: actionPoints
                };

                results.tests.push(testResult);
                results.summary.totalTests++;

                logger.info(`Lighthouse test completed for ${url}: Performance ${testResult.performance.score}, Accessibility ${testResult.accessibility.score}, Best Practices ${testResult.bestPractices.score}, SEO ${testResult.seo.score}`);

            } catch (error) {
                logger.warning(`Failed to run Lighthouse test for ${url}: ${error.message}`);
                results.tests.push({
                    url: url,
                    timestamp: new Date().toISOString(),
                    error: error.message
                });
            }
        }

        // Calculate summary statistics
        results.summary.totalTests = results.tests.length;
        const successfulTests = results.tests.filter(test => !test.error);
        if (successfulTests.length > 0) {
            results.summary.averagePerformance = Math.round(
                successfulTests.reduce((sum, test) => sum + test.performance.score, 0) / successfulTests.length
            );
            results.summary.averageAccessibility = Math.round(
                successfulTests.reduce((sum, test) => sum + test.accessibility.score, 0) / successfulTests.length
            );
            results.summary.averageBestPractices = Math.round(
                successfulTests.reduce((sum, test) => sum + test.bestPractices.score, 0) / successfulTests.length
            );
            results.summary.averageSEO = Math.round(
                successfulTests.reduce((sum, test) => sum + test.seo.score, 0) / successfulTests.length
            );
        }

        results.endTime = new Date().toISOString();

        // Write JSON results
        await fs.writeFile(jsonOutput, JSON.stringify(results, null, 2));

        logger.success(`Lighthouse tests completed: ${successfulTests.length}/${results.summary.totalTests} successful`);
        logger.info(`Average scores - Performance: ${results.summary.averagePerformance}, Accessibility: ${results.summary.averageAccessibility}, Best Practices: ${results.summary.averageBestPractices}, SEO: ${results.summary.averageSEO}`);
        logger.info(`Results saved to ${path.resolve(jsonOutput)}`);

        results.findings = results.summary.totalTests - successfulTests.length;
        return results;

    } catch (error) {
        logger.error(`Failed to run Lighthouse tests: ${error.message}`);
        throw error;
    }
}

/**
 * Get URLs for Lighthouse testing (homepage + 3 random pages)
 */
async function getLighthouseUrls(domain) {
    const fullDomain = domain.startsWith('http') ? domain : `https://${domain}`;
    const urls = [fullDomain]; // Always include homepage

    try {
        // Get random URLs from sitemap
        const sitemapUrls = await getUrlsFromSitemap(domain);

        // Get 3 random URLs (excluding homepage)
        const filteredUrls = sitemapUrls.filter(url => url !== fullDomain && url !== fullDomain + '/');
        const randomUrls = getRandomUrls(filteredUrls, 3);

        urls.push(...randomUrls);

        logger.info(`Selected ${urls.length} URLs for Lighthouse testing: ${urls.join(', ')}`);

    } catch (error) {
        logger.warning(`Failed to get sitemap URLs, using only homepage: ${error.message}`);
    }

    return urls;
}

/**
 * Extract top 5 action points from Lighthouse results
 */
function extractTopActionPoints(lhr) {
    const actionPoints = [];

    // Get opportunities (performance improvements)
    const opportunities = lhr.categories.performance.auditRefs
        .filter(ref => ref.group === 'load-opportunities' && lhr.audits[ref.id])
        .map(ref => lhr.audits[ref.id])
        .filter(audit => audit.score !== null && audit.score < 0.9 && audit.details && audit.details.overallSavingsMs)
        .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
        .slice(0, 3);

    // Get diagnostics (additional insights)
    const diagnostics = lhr.categories.performance.auditRefs
        .filter(ref => ref.group === 'diagnostics' && lhr.audits[ref.id])
        .map(ref => lhr.audits[ref.id])
        .filter(audit => audit.score !== null && audit.score < 0.9)
        .sort((a, b) => (a.score || 0) - (b.score || 0))
        .slice(0, 2);

    // Combine and format action points
    [...opportunities, ...diagnostics].forEach(audit => {
        if (actionPoints.length < 5) {
            actionPoints.push({
                title: audit.title,
                description: audit.description,
                score: audit.score ? Math.round(audit.score * 100) : null,
                savings: audit.details?.overallSavingsMs ? Math.round(audit.details.overallSavingsMs) : null,
                category: audit.group || 'performance'
            });
        }
    });

    // If we don't have enough action points, add some general recommendations
    if (actionPoints.length < 5) {
        const generalRecommendations = [
            {
                title: 'Optimize Images',
                description: 'Use modern image formats (WebP, AVIF) and proper compression to reduce file sizes.',
                score: null,
                savings: null,
                category: 'general'
            },
            {
                title: 'Minify CSS and JavaScript',
                description: 'Remove unnecessary whitespace and comments from CSS and JavaScript files.',
                score: null,
                savings: null,
                category: 'general'
            },
            {
                title: 'Enable Compression',
                description: 'Use gzip or brotli compression to reduce the size of text-based resources.',
                score: null,
                savings: null,
                category: 'general'
            },
            {
                title: 'Optimize Third-Party Scripts',
                description: 'Review and optimize third-party scripts that may be impacting performance.',
                score: null,
                savings: null,
                category: 'general'
            },
            {
                title: 'Implement Caching',
                description: 'Set appropriate cache headers for static resources to improve repeat visits.',
                score: null,
                savings: null,
                category: 'general'
            }
        ];

        // Add general recommendations to fill up to 5
        while (actionPoints.length < 5 && generalRecommendations.length > 0) {
            actionPoints.push(generalRecommendations.shift());
        }
    }

    return actionPoints.slice(0, 5);
}

/**
 * Get URLs from sitemap (simplified version for Lighthouse)
 */
async function getUrlsFromSitemap(domain) {
    const urls = new Set();

    try {
        const sitemapTargets = getSitemapTargets(domain);
        const sitemapConcurrency = getPositiveIntEnv('SITEMAP_CONCURRENCY', 4);

        await runWithConcurrency(sitemapTargets, sitemapConcurrency, async (target) => {
            const sitemapUrls = await fetchSitemapUrls(target.url);
            sitemapUrls.forEach(url => urls.add(url));
        });

    } catch (error) {
        logger.warning(`Failed to get URLs from sitemap: ${error.message}`);
    }

    return Array.from(urls);
}

/**
 * Main function
 */
async function main() {
    let result = null;
    try {
        const options = parseArguments();

        switch (options.action) {
            case 'get-urls':
                if (!options.domain || !options.output) {
                    throw new Error('--domain and --output are required for get-urls action');
                }
                await getUrls(options.domain, options.output);
                break;

            case 'take-screenshots':
                if (!options.urlFile || !options.output) {
                    throw new Error('--url-file and --output are required for take-screenshots action');
                }
                await takeScreenshots(options.urlFile, options.output);
                break;

            case 'compare-screenshots':
                if (!options.beforeDir || !options.afterDir || !options.outputDir || !options.jsonOutput) {
                    throw new Error('--before-dir, --after-dir, --output-dir, and --json-output are required for compare-screenshots action');
                }
                result = await compareScreenshots(options.beforeDir, options.afterDir, options.outputDir, options.jsonOutput);
                break;

            case 'smoke-test':
                if (!options.domain || !options.jsonOutput) {
                    throw new Error('--domain and --json-output are required for smoke-test action');
                }
                result = await smokeTest(options.domain, options.jsonOutput);
                break;

            case 'lighthouse-test':
                if (!options.domain || !options.jsonOutput) {
                    throw new Error('--domain and --json-output are required for lighthouse-test action');
                }
                result = await lighthouseTest(options.domain, options.jsonOutput);
                break;

            default:
                throw new Error(`Unknown action: ${options.action}`);
        }

        // Exit-code contract. Previously every action exited 0 regardless of outcome, so a
        // run with 40 differing screenshots looked successful and nothing could gate on it.
        //   0 = pass, 1 = findings, 2 = harness error
        const findings = result && typeof result.findings === 'number' ? result.findings : 0;
        if (findings > 0) {
            logger.error(`Action completed with ${findings} finding(s) - exiting 1`);
            process.exitCode = 1;
            return;
        }

        logger.success('Action completed successfully');

    } catch (error) {
        logger.error(`Action failed: ${error.message}`);
        process.exitCode = 2;
    }
}

// Run main function if this script is executed directly
if (!isMainThread && workerData?.role === 'compare-screenshot') {
    runCompareScreenshotWorker();
} else if (require.main === module) {
    main();
}

module.exports = {
    getUrls,
    takeScreenshots,
    compareScreenshots,
    smokeTest
};
