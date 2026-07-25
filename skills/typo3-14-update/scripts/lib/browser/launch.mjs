/**
 * Browser launch and context construction.
 *
 * --disable-web-security is gone: it was never needed for same-origin screenshots and it
 * switches off the browser's own boundary while we are deliberately loading untrusted
 * customer content.
 *
 * --no-sandbox requires an explicit opt-in AND is recorded in the environment fingerprint,
 * so every report shows the run used a weakened browser rather than hiding it.
 */

import { PolicyError } from '../cli/exit-codes.mjs';
import { STABILIZE_CSS, initScript, settleScript } from './stabilize.mjs';

export const SAFE_BROWSER_ARGS = Object.freeze([
  '--disable-dev-shm-usage',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--force-device-scale-factor=1',
  '--hide-scrollbars',
]);

export const UNSAFE_ARGS = Object.freeze(['--no-sandbox', '--disable-setuid-sandbox']);

export function browserArgs(env = process.env) {
  const args = [...SAFE_BROWSER_ARGS];
  if (env.T3U_ALLOW_NO_SANDBOX === '1') args.push(...UNSAFE_ARGS);
  // Playwright's chromium-headless-shell SIGSEGVs on recent macOS. Hard-won; keep it.
  if (process.platform === 'darwin' && !env.PLAYWRIGHT_CHANNEL) args.push('--headless=new');
  return args;
}

export function launchOptions(env = process.env) {
  const args = browserArgs(env);
  const weakened = args.some((a) => UNSAFE_ARGS.includes(a));
  if (env.PLAYWRIGHT_CHANNEL) {
    return { options: { channel: env.PLAYWRIGHT_CHANNEL, headless: true, args }, weakened };
  }
  if (process.platform === 'darwin') {
    return { options: { headless: false, args }, weakened };
  }
  return { options: { headless: true, args }, weakened };
}

export async function launchBrowser({ env = process.env, log } = {}) {
  const { chromium } = await import('playwright');
  const { options, weakened } = launchOptions(env);
  if (weakened) {
    log?.warn('T3U_ALLOW_NO_SANDBOX=1: running a weakened browser. This is recorded in the fingerprint.');
  }
  const browser = await chromium.launch(options);
  return { browser, weakened, version: browser.version() };
}

export const VIEWPORTS = Object.freeze({
  desktop: { width: 1920, height: 1080, isMobile: false },
  tablet: { width: 820, height: 1180, isMobile: false },
  mobile: { width: 390, height: 844, isMobile: true },
});

export async function newContext(browser, {
  viewport = 'desktop',
  locale = 'de-AT',
  timezoneId = 'Europe/Vienna',
  colorScheme = 'light',
  storageState,
  stabilize = {},
} = {}) {
  const vp = VIEWPORTS[viewport];
  if (!vp) throw new PolicyError(`Unknown viewport: ${viewport}`);

  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
    locale,
    timezoneId,
    colorScheme,
    reducedMotion: 'reduce',
    forcedColors: 'none',
    storageState,
  });

  await context.addInitScript(initScript(stabilize));
  return context;
}

/** Apply CSS, settle, and return the settle report. Identical before and after by construction. */
export async function stabilizePage(page) {
  await page.addStyleTag({ content: STABILIZE_CSS }).catch(() => {});
  try {
    return await page.evaluate(settleScript());
  } catch {
    return { fonts: false, lazy: 0, videos: 0, height: 0, settleFailed: true };
  }
}
