/**
 * Interaction states as first-class captures.
 *
 * A focus indicator, an open menu and a form with validation errors are separate renderings
 * of the same URL. Comparing only the default state means an accessibility fix that changes
 * the focus ring is invisible — and so is a migration that breaks the mobile menu.
 *
 * Each state declares `applies`, so a page without an accordion is not counted as a missing
 * capture. That distinction matters: "not applicable" and "failed to capture" must never
 * look the same in the coverage numbers.
 */

export const STATES = Object.freeze([
  {
    name: 'default',
    applies: () => true,
    apply: async () => ({ applied: true }),
  },
  {
    name: 'keyboard-focus',
    selector: 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    async apply(page) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? { tag: el.tagName.toLowerCase(), untrustedLabel: (el.textContent ?? '').slice(0, 80) } : null;
      });
      return { applied: Boolean(focused), focused };
    },
  },
  {
    name: 'nav-open',
    selector: '[aria-controls][aria-expanded], .navbar-toggler, button[data-bs-toggle="collapse"]',
    async apply(page, sel) {
      const el = await page.$(sel);
      if (!el) return { applied: false };
      await el.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(250);
      return { applied: true };
    },
  },
  {
    name: 'dropdown-open',
    selector: '[data-bs-toggle="dropdown"], .dropdown-toggle',
    async apply(page, sel) {
      const el = await page.$(sel);
      if (!el) return { applied: false };
      await el.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(250);
      return { applied: true };
    },
  },
  {
    name: 'accordion-open',
    selector: '[data-bs-toggle="collapse"]:not(.navbar-toggler), details:not([open]) summary',
    async apply(page, sel) {
      const el = await page.$(sel);
      if (!el) return { applied: false };
      await el.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(250);
      return { applied: true };
    },
  },
  {
    name: 'form-validation-error',
    selector: 'form',
    async apply(page) {
      // Submit an empty required form to render the browser's own validation state.
      const did = await page.evaluate(() => {
        const form = [...document.querySelectorAll('form')]
          .find((f) => f.querySelector('[required]'));
        if (!form) return false;
        form.reportValidity?.();
        return true;
      });
      await page.waitForTimeout(200);
      return { applied: did };
    },
  },
  {
    name: 'modal-open',
    selector: '[data-bs-toggle="modal"]',
    async apply(page, sel) {
      const el = await page.$(sel);
      if (!el) return { applied: false };
      await el.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(300);
      return { applied: true };
    },
  },
]);

export const DEFAULT_STATES = Object.freeze(['default']);

export function stateByName(name) {
  return STATES.find((s) => s.name === name) ?? null;
}

/** Does the page contain the trigger this state needs? Cheap DOM presence check. */
export async function stateApplies(page, state) {
  if (!state.selector) return true;
  try { return (await page.$(state.selector)) !== null; }
  catch { return false; }
}

/**
 * @returns {{name:string, applied:boolean, skipped:boolean, reason:string|null}}
 * `skipped` with reason 'not-applicable' is NOT a coverage gap; a failed apply is.
 */
export async function applyState(page, name) {
  const state = stateByName(name);
  if (!state) return { name, applied: false, skipped: true, reason: 'unknown-state' };

  if (!(await stateApplies(page, state))) {
    return { name, applied: false, skipped: true, reason: 'not-applicable' };
  }
  try {
    const res = await state.apply(page, state.selector);
    return {
      name,
      applied: Boolean(res.applied),
      skipped: false,
      reason: res.applied ? null : 'trigger-present-but-not-actionable',
      detail: res,
    };
  } catch (err) {
    return { name, applied: false, skipped: false, reason: `apply-failed: ${err.message}` };
  }
}
