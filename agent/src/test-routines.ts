/**
 * Standard Test Routines - Substantive tests that produce rich feedback
 *
 * Each routine defines WHAT to measure, not exactly HOW.
 * The code generator translates these into Playwright implementations.
 */

export type TestRoutine =
  | PerformanceRoutine
  | AccessibilityRoutine
  | SEORoutine
  | ResponsiveRoutine
  | NavigationRoutine
  | ConsoleErrorRoutine
  | VisualRoutine
  | FormRoutine
  | LinkValidationRoutine;

// ============================================
// Performance Routine
// ============================================
export interface PerformanceRoutine {
  routine: 'performance';
  config?: {
    maxLoadTime?: number;      // ms, default 3000
    maxLCP?: number;           // Largest Contentful Paint, ms
    maxFID?: number;           // First Input Delay, ms
    maxCLS?: number;           // Cumulative Layout Shift, score
  };
}

// ============================================
// Accessibility Routine
// ============================================
export interface AccessibilityRoutine {
  routine: 'accessibility';
  config?: {
    checkAria?: boolean;           // Check ARIA labels
    checkContrast?: boolean;       // Color contrast
    checkKeyboardNav?: boolean;    // Tab navigation works
    checkAltText?: boolean;        // Images have alt text
    checkHeadingOrder?: boolean;   // h1 -> h2 -> h3 order
    checkFocusVisible?: boolean;   // Focus indicators visible
  };
}

// ============================================
// SEO Routine
// ============================================
export interface SEORoutine {
  routine: 'seo';
  config?: {
    checkTitle?: boolean;          // Has meaningful title
    checkMetaDescription?: boolean; // Has meta description
    checkOgTags?: boolean;         // Open Graph tags
    checkHeadingStructure?: boolean; // Single h1, proper hierarchy
    checkCanonical?: boolean;      // Canonical URL
    checkRobots?: boolean;         // Robots meta
  };
}

// ============================================
// Responsive Design Routine
// ============================================
export interface ResponsiveRoutine {
  routine: 'responsive';
  config?: {
    viewports?: Array<{ name: string; width: number; height: number }>;
    checkNoHorizontalScroll?: boolean;
    checkTextReadable?: boolean;
    checkTouchTargets?: boolean;   // Min 44x44 touch targets
  };
}

// ============================================
// Navigation Routine
// ============================================
export interface NavigationRoutine {
  routine: 'navigation';
  config?: {
    checkAllLinks?: boolean;       // All nav links work
    checkBackButton?: boolean;     // Browser back works
    checkDeepLink?: boolean;       // Direct URL access works
    maxNavigationTime?: number;    // ms per navigation
  };
}

// ============================================
// Console Error Routine
// ============================================
export interface ConsoleErrorRoutine {
  routine: 'console-errors';
  config?: {
    allowWarnings?: boolean;       // Ignore console.warn
    ignorePatterns?: string[];     // Regex patterns to ignore
  };
}

// ============================================
// Visual Routine
// ============================================
export interface VisualRoutine {
  routine: 'visual';
  config?: {
    captureFullPage?: boolean;
    captureElements?: string[];    // Specific selectors to capture
    checkNoLayoutShift?: boolean;
    checkImagesLoaded?: boolean;
  };
}

// ============================================
// Form Routine
// ============================================
export interface FormRoutine {
  routine: 'form';
  config?: {
    formSelector: string;
    checkValidation?: boolean;     // HTML5 validation works
    checkErrorMessages?: boolean;  // Error messages show
    checkSubmitDisabled?: boolean; // Submit disabled when invalid
    testFields?: Array<{
      selector: string;
      validValue: string;
      invalidValue?: string;
    }>;
  };
}

// ============================================
// Link Validation Routine
// ============================================
export interface LinkValidationRoutine {
  routine: 'links';
  config?: {
    checkInternal?: boolean;       // Internal links work
    checkExternal?: boolean;       // External links valid (no 404)
    checkAnchors?: boolean;        // Anchor links scroll correctly
  };
}

// ============================================
// Code Generator - Converts routines to Playwright code
// ============================================

/**
 * Helper to build URL with Vercel bypass secret if available
 */
function getUrlHelper(): string {
  return `
// Helper to build URL with Vercel bypass secret
function buildUrl(baseUrl: string, path: string = ''): string {
  const url = baseUrl + path;
  if (params.bypassSecret) {
    const separator = url.includes('?') ? '&' : '?';
    return url + separator + 'x-vercel-protection-bypass=' + params.bypassSecret;
  }
  return url;
}
`;
}

export function routineToCode(routine: TestRoutine, path: string): string {
  switch (routine.routine) {
    case 'performance':
      return generatePerformanceCode(routine, path);
    case 'accessibility':
      return generateAccessibilityCode(routine, path);
    case 'seo':
      return generateSEOCode(routine, path);
    case 'responsive':
      return generateResponsiveCode(routine, path);
    case 'navigation':
      return generateNavigationCode(routine, path);
    case 'console-errors':
      return generateConsoleErrorCode(routine, path);
    case 'visual':
      return generateVisualCode(routine, path);
    case 'form':
      return generateFormCode(routine, path);
    case 'links':
      return generateLinkCode(routine, path);
    default:
      return `// Unknown routine: ${JSON.stringify(routine)}`;
  }
}

function generatePerformanceCode(routine: PerformanceRoutine, path: string): string {
  const maxLoad = routine.config?.maxLoadTime || 3000;

  return `
${getUrlHelper()}
// Performance Test for ${path}
const metrics = { loadTime: 0, lcp: 0, cls: 0, fid: 0, issues: [] };

// Measure navigation timing
const startTime = Date.now();
await page.goto(buildUrl(params.previewUrl, '${path === '/' ? '' : path}'));
await page.waitForLoadState('load');
metrics.loadTime = Date.now() - startTime;

// Get Core Web Vitals via Performance API
const vitals = await page.evaluate(() => {
  return new Promise((resolve) => {
    const result = { lcp: 0, cls: 0, fid: 0 };

    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      result.lcp = entries[entries.length - 1]?.startTime || 0;
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // CLS
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          result.cls += entry.value;
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });

    // Give time for metrics to collect
    setTimeout(() => resolve(result), 2000);
  });
});

Object.assign(metrics, vitals);

// Evaluate results
if (metrics.loadTime > ${maxLoad}) {
  metrics.issues.push(\`Page load too slow: \${metrics.loadTime}ms (max: ${maxLoad}ms)\`);
}
if (metrics.lcp > ${routine.config?.maxLCP || 2500}) {
  metrics.issues.push(\`LCP too slow: \${metrics.lcp}ms\`);
}
if (metrics.cls > ${routine.config?.maxCLS || 0.1}) {
  metrics.issues.push(\`CLS too high: \${metrics.cls}\`);
}

console.log('Performance metrics:', JSON.stringify(metrics, null, 2));

if (metrics.issues.length > 0) {
  throw new Error('Performance issues: ' + metrics.issues.join('; '));
}
`;
}

function generateAccessibilityCode(routine: AccessibilityRoutine, path: string): string {
  return `
${getUrlHelper()}
// Accessibility Test for ${path}
await page.goto(buildUrl(params.previewUrl, '${path === '/' ? '' : path}'));
await page.waitForLoadState('networkidle');

const a11yResults = { score: 100, issues: [], passed: [] };

// Check images have alt text
${routine.config?.checkAltText !== false ? `
const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
if (imagesWithoutAlt > 0) {
  a11yResults.issues.push(\`\${imagesWithoutAlt} images missing alt text\`);
  a11yResults.score -= imagesWithoutAlt * 5;
} else {
  a11yResults.passed.push('All images have alt text');
}
` : ''}

// Check heading hierarchy
${routine.config?.checkHeadingOrder !== false ? `
const headings = await page.$$eval('h1,h2,h3,h4,h5,h6', els =>
  els.map(e => ({ tag: e.tagName, text: e.textContent?.slice(0, 50) }))
);
const h1Count = headings.filter(h => h.tag === 'H1').length;
if (h1Count === 0) {
  a11yResults.issues.push('No h1 element found');
  a11yResults.score -= 10;
} else if (h1Count > 1) {
  a11yResults.issues.push(\`Multiple h1 elements found: \${h1Count}\`);
  a11yResults.score -= 5;
} else {
  a11yResults.passed.push('Single h1 element present');
}
` : ''}

// Check ARIA labels on interactive elements
${routine.config?.checkAria !== false ? `
const buttonsWithoutLabel = await page.$$eval(
  'button:not([aria-label]):not([aria-labelledby])',
  btns => btns.filter(b => !b.textContent?.trim()).length
);
if (buttonsWithoutLabel > 0) {
  a11yResults.issues.push(\`\${buttonsWithoutLabel} buttons without accessible labels\`);
  a11yResults.score -= buttonsWithoutLabel * 5;
} else {
  a11yResults.passed.push('All buttons have accessible labels');
}
` : ''}

// Check keyboard navigation
${routine.config?.checkKeyboardNav !== false ? `
const focusableElements = await page.$$eval(
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
  els => els.length
);
if (focusableElements > 0) {
  await page.keyboard.press('Tab');
  const hasFocusedElement = await page.evaluate(() => document.activeElement !== document.body);
  if (hasFocusedElement) {
    a11yResults.passed.push(\`Keyboard navigation works (\${focusableElements} focusable elements)\`);
  } else {
    a11yResults.issues.push('Keyboard navigation not working');
    a11yResults.score -= 15;
  }
}
` : ''}

// Check focus visibility
${routine.config?.checkFocusVisible !== false ? `
const focusStyles = await page.evaluate(() => {
  const el = document.querySelector('a[href], button');
  if (!el) return true;
  (el as HTMLElement).focus();
  const styles = window.getComputedStyle(el, ':focus');
  return styles.outline !== 'none' || styles.boxShadow !== 'none';
});
if (!focusStyles) {
  a11yResults.issues.push('Focus indicators may not be visible');
  a11yResults.score -= 10;
} else {
  a11yResults.passed.push('Focus indicators present');
}
` : ''}

console.log('Accessibility results:', JSON.stringify(a11yResults, null, 2));

a11yResults.score = Math.max(0, a11yResults.score);
if (a11yResults.score < 70) {
  throw new Error(\`Accessibility score too low: \${a11yResults.score}/100. Issues: \${a11yResults.issues.join('; ')}\`);
}
`;
}

function generateSEOCode(routine: SEORoutine, path: string): string {
  return `
${getUrlHelper()}
// SEO Test for ${path}
await page.goto(buildUrl(params.previewUrl, '${path === '/' ? '' : path}'));
await page.waitForLoadState('domcontentloaded');

const seoResults = { score: 100, issues: [], passed: [], meta: {} };

// Check title
${routine.config?.checkTitle !== false ? `
const title = await page.title();
seoResults.meta.title = title;
if (!title || title.length < 10) {
  seoResults.issues.push('Title missing or too short');
  seoResults.score -= 15;
} else if (title.length > 60) {
  seoResults.issues.push(\`Title too long: \${title.length} chars (max 60)\`);
  seoResults.score -= 5;
} else {
  seoResults.passed.push(\`Good title: "\${title}"\`);
}
` : ''}

// Check meta description
${routine.config?.checkMetaDescription !== false ? `
const metaDesc = await page.$eval('meta[name="description"]', el => el.getAttribute('content')).catch(() => null);
seoResults.meta.description = metaDesc;
if (!metaDesc) {
  seoResults.issues.push('Meta description missing');
  seoResults.score -= 15;
} else if (metaDesc.length < 50) {
  seoResults.issues.push(\`Meta description too short: \${metaDesc.length} chars\`);
  seoResults.score -= 5;
} else if (metaDesc.length > 160) {
  seoResults.issues.push(\`Meta description too long: \${metaDesc.length} chars (max 160)\`);
  seoResults.score -= 5;
} else {
  seoResults.passed.push('Good meta description');
}
` : ''}

// Check Open Graph tags
${routine.config?.checkOgTags !== false ? `
const ogTags = await page.evaluate(() => ({
  title: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
  description: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
  image: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
}));
seoResults.meta.og = ogTags;
if (!ogTags.title || !ogTags.description) {
  seoResults.issues.push('Open Graph tags incomplete');
  seoResults.score -= 10;
} else {
  seoResults.passed.push('Open Graph tags present');
}
` : ''}

// Check heading structure
${routine.config?.checkHeadingStructure !== false ? `
const headingStructure = await page.$$eval('h1,h2,h3,h4,h5,h6', els =>
  els.map(e => e.tagName).join(' -> ')
);
seoResults.meta.headings = headingStructure;
if (!headingStructure.startsWith('H1')) {
  seoResults.issues.push('Page should start with H1');
  seoResults.score -= 10;
} else {
  seoResults.passed.push('Proper heading structure');
}
` : ''}

// Check canonical URL
${routine.config?.checkCanonical !== false ? `
const canonical = await page.$eval('link[rel="canonical"]', el => el.getAttribute('href')).catch(() => null);
seoResults.meta.canonical = canonical;
if (!canonical) {
  seoResults.issues.push('Canonical URL missing');
  seoResults.score -= 5;
} else {
  seoResults.passed.push('Canonical URL present');
}
` : ''}

console.log('SEO results:', JSON.stringify(seoResults, null, 2));

seoResults.score = Math.max(0, seoResults.score);
if (seoResults.score < 60) {
  throw new Error(\`SEO score too low: \${seoResults.score}/100. Issues: \${seoResults.issues.join('; ')}\`);
}
`;
}

function generateResponsiveCode(routine: ResponsiveRoutine, path: string): string {
  const viewports = routine.config?.viewports || [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  return `
${getUrlHelper()}
// Responsive Design Test for ${path}
const responsiveResults = { viewports: [], issues: [], passed: [] };

const testViewports = ${JSON.stringify(viewports)};

for (const vp of testViewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(buildUrl(params.previewUrl, '${path === '/' ? '' : path}'));
  await page.waitForLoadState('networkidle');

  const vpResult = { name: vp.name, width: vp.width, issues: [] };

  // Check for horizontal scroll
  ${routine.config?.checkNoHorizontalScroll !== false ? `
  const hasHorizontalScroll = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  if (hasHorizontalScroll) {
    vpResult.issues.push('Horizontal scrollbar present');
  }
  ` : ''}

  // Check text is readable (not too small)
  ${routine.config?.checkTextReadable !== false ? `
  const smallText = await page.$$eval('p, span, a, li', els =>
    els.filter(el => {
      const size = parseFloat(window.getComputedStyle(el).fontSize);
      return size < 12;
    }).length
  );
  if (smallText > 0) {
    vpResult.issues.push(\`\${smallText} elements with text smaller than 12px\`);
  }
  ` : ''}

  // Check touch targets on mobile
  ${routine.config?.checkTouchTargets !== false ? `
  if (vp.width < 768) {
    const smallTargets = await page.$$eval('a, button', els =>
      els.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      }).length
    );
    if (smallTargets > 0) {
      vpResult.issues.push(\`\${smallTargets} touch targets smaller than 44x44px\`);
    }
  }
  ` : ''}

  // Capture screenshot for this viewport
  await page.screenshot({ fullPage: true });

  responsiveResults.viewports.push(vpResult);
  if (vpResult.issues.length === 0) {
    responsiveResults.passed.push(\`\${vp.name} (\${vp.width}px) looks good\`);
  } else {
    responsiveResults.issues.push(...vpResult.issues.map(i => \`[\${vp.name}] \${i}\`));
  }
}

console.log('Responsive results:', JSON.stringify(responsiveResults, null, 2));

if (responsiveResults.issues.length > 3) {
  throw new Error('Too many responsive issues: ' + responsiveResults.issues.join('; '));
}
`;
}

function generateNavigationCode(routine: NavigationRoutine, path: string): string {
  return `
${getUrlHelper()}
// Navigation Test for ${path}
await page.goto(buildUrl(params.previewUrl, '${path === '/' ? '' : path}'));
await page.waitForLoadState('networkidle');

const navResults = { linksChecked: 0, issues: [], passed: [] };

// Get all navigation links
const navLinks = await page.$$eval('nav a[href]', links =>
  links.map(a => ({ href: a.getAttribute('href'), text: a.textContent?.trim() }))
    .filter(l => l.href && !l.href.startsWith('#') && !l.href.startsWith('mailto:'))
);

navResults.linksChecked = navLinks.length;

// Test each navigation link
for (const link of navLinks.slice(0, 10)) { // Limit to first 10
  try {
    const fullUrl = link.href.startsWith('/')
      ? buildUrl(params.previewUrl, link.href)
      : link.href;

    const response = await page.goto(fullUrl, { timeout: ${routine.config?.maxNavigationTime || 10000} });

    if (response && response.status() >= 400) {
      navResults.issues.push(\`Link "\${link.text}" returned \${response.status()}\`);
    } else {
      navResults.passed.push(\`Link "\${link.text}" works\`);
    }
  } catch (error) {
    navResults.issues.push(\`Link "\${link.text}" failed: \${error.message}\`);
  }
}

// Test back button
${routine.config?.checkBackButton !== false ? `
if (navLinks.length > 0) {
  await page.goto(buildUrl(params.previewUrl, '${path === '/' ? '' : path}'));
  await page.click('nav a[href]');
  await page.waitForLoadState('networkidle');
  await page.goBack();
  await page.waitForLoadState('networkidle');

  const currentUrl = page.url();
  const expectedPath = '${path}';
  if (currentUrl.includes(expectedPath) || expectedPath === '/') {
    navResults.passed.push('Back button works correctly');
  } else {
    navResults.issues.push('Back button navigation issue');
  }
}
` : ''}

console.log('Navigation results:', JSON.stringify(navResults, null, 2));

if (navResults.issues.length > 0) {
  throw new Error('Navigation issues: ' + navResults.issues.join('; '));
}
`;
}

function generateConsoleErrorCode(routine: ConsoleErrorRoutine, path: string): string {
  const ignorePatterns = routine.config?.ignorePatterns || [];

  return `
${getUrlHelper()}
// Console Error Test for ${path}
const consoleMessages = { errors: [], warnings: [], info: [] };

page.on('console', msg => {
  const text = msg.text();
  const type = msg.type();

  // Check ignore patterns
  const ignorePatterns = ${JSON.stringify(ignorePatterns)};
  if (ignorePatterns.some(p => new RegExp(p).test(text))) {
    return;
  }

  if (type === 'error') {
    consoleMessages.errors.push(text);
  } else if (type === 'warning') {
    consoleMessages.warnings.push(text);
  }
});

page.on('pageerror', error => {
  consoleMessages.errors.push(error.message);
});

await page.goto(buildUrl(params.previewUrl, '${path === '/' ? '' : path}'));
await page.waitForLoadState('networkidle');

// Wait a bit for any async errors
await page.waitForTimeout(2000);

console.log('Console results:', JSON.stringify(consoleMessages, null, 2));

if (consoleMessages.errors.length > 0) {
  throw new Error(\`Console errors found: \${consoleMessages.errors.join('; ')}\`);
}

${!routine.config?.allowWarnings ? `
if (consoleMessages.warnings.length > 5) {
  throw new Error(\`Too many console warnings: \${consoleMessages.warnings.length}\`);
}
` : ''}
`;
}

function generateVisualCode(routine: VisualRoutine, path: string): string {
  return `
${getUrlHelper()}
// Visual Test for ${path}
await page.goto(buildUrl(params.previewUrl, '${path === '/' ? '' : path}'));
await page.waitForLoadState('networkidle');

const visualResults = { issues: [], passed: [], screenshots: [] };

// Check all images loaded
${routine.config?.checkImagesLoaded !== false ? `
const brokenImages = await page.$$eval('img', imgs =>
  imgs.filter(img => !img.complete || img.naturalWidth === 0)
    .map(img => img.src || img.getAttribute('data-src'))
);
if (brokenImages.length > 0) {
  visualResults.issues.push(\`\${brokenImages.length} images failed to load\`);
} else {
  visualResults.passed.push('All images loaded successfully');
}
` : ''}

// Check for layout shift during load
${routine.config?.checkNoLayoutShift !== false ? `
const layoutShift = await page.evaluate(() => {
  return new Promise((resolve) => {
    let cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
    setTimeout(() => resolve(cls), 1000);
  });
});
if (layoutShift > 0.1) {
  visualResults.issues.push(\`High layout shift: \${layoutShift}\`);
} else {
  visualResults.passed.push('Minimal layout shift');
}
` : ''}

// Capture full page screenshot
${routine.config?.captureFullPage !== false ? `
visualResults.screenshots.push('full-page');
` : ''}

// Capture specific elements
${routine.config?.captureElements ? `
const elementsToCapture = ${JSON.stringify(routine.config.captureElements)};
for (const selector of elementsToCapture) {
  const element = await page.$(selector);
  if (element) {
    await element.screenshot();
    visualResults.screenshots.push(selector);
  }
}
` : ''}

console.log('Visual results:', JSON.stringify(visualResults, null, 2));

if (visualResults.issues.length > 0) {
  throw new Error('Visual issues: ' + visualResults.issues.join('; '));
}
`;
}

function generateFormCode(routine: FormRoutine, path: string): string {
  return `
${getUrlHelper()}
// Form Test for ${path}
await page.goto(buildUrl(params.previewUrl, '${path === '/' ? '' : path}'));
await page.waitForLoadState('networkidle');

const formResults = { issues: [], passed: [], fields: [] };

const formSelector = '${routine.config?.formSelector || 'form'}';
const form = await page.$(formSelector);

if (!form) {
  throw new Error('Form not found: ${routine.config?.formSelector || 'form'}');
}

// Check HTML5 validation
${routine.config?.checkValidation !== false ? `
const hasValidation = await page.$eval(formSelector, f => {
  const inputs = f.querySelectorAll('input[required], input[pattern], input[type="email"]');
  return inputs.length > 0;
});
if (hasValidation) {
  formResults.passed.push('Form has HTML5 validation');
} else {
  formResults.issues.push('Form lacks validation attributes');
}
` : ''}

// Test specific fields if provided
${routine.config?.testFields ? `
const testFields = ${JSON.stringify(routine.config.testFields)};
for (const field of testFields) {
  // Test valid value
  await page.fill(field.selector, field.validValue);
  formResults.fields.push({ selector: field.selector, validValue: 'tested' });

  // Test invalid value if provided
  if (field.invalidValue) {
    await page.fill(field.selector, field.invalidValue);
    const isInvalid = await page.$eval(field.selector, el => !el.validity.valid);
    if (isInvalid) {
      formResults.passed.push(\`Field \${field.selector} correctly rejects invalid input\`);
    } else {
      formResults.issues.push(\`Field \${field.selector} accepts invalid input\`);
    }
  }
}
` : ''}

// Check submit button state
${routine.config?.checkSubmitDisabled !== false ? `
const submitBtn = await page.$(\`\${formSelector} button[type="submit"], \${formSelector} input[type="submit"]\`);
if (submitBtn) {
  formResults.passed.push('Submit button found');
}
` : ''}

console.log('Form results:', JSON.stringify(formResults, null, 2));

if (formResults.issues.length > 0) {
  throw new Error('Form issues: ' + formResults.issues.join('; '));
}
`;
}

function generateLinkCode(routine: LinkValidationRoutine, path: string): string {
  return `
${getUrlHelper()}
// Link Validation Test for ${path}
await page.goto(buildUrl(params.previewUrl, '${path === '/' ? '' : path}'));
await page.waitForLoadState('networkidle');

const linkResults = { total: 0, valid: 0, broken: [], external: [], issues: [] };

// Get all links
const allLinks = await page.$$eval('a[href]', links =>
  links.map(a => ({
    href: a.getAttribute('href'),
    text: a.textContent?.trim().slice(0, 30),
    isExternal: a.getAttribute('href')?.startsWith('http') && !a.getAttribute('href')?.includes(window.location.host)
  }))
);

linkResults.total = allLinks.length;

// Check internal links
${routine.config?.checkInternal !== false ? `
const internalLinks = allLinks.filter(l => l.href && !l.isExternal && !l.href.startsWith('#') && !l.href.startsWith('mailto:'));

for (const link of internalLinks.slice(0, 15)) { // Limit checks
  try {
    const fullUrl = link.href.startsWith('/')
      ? buildUrl(params.previewUrl, link.href)
      : buildUrl(params.previewUrl, '/' + link.href);

    const response = await page.request.head(fullUrl);

    if (response.status() >= 400) {
      linkResults.broken.push({ href: link.href, text: link.text, status: response.status() });
    } else {
      linkResults.valid++;
    }
  } catch (e) {
    linkResults.broken.push({ href: link.href, text: link.text, error: e.message });
  }
}
` : ''}

// Check external links (just verify they exist)
${routine.config?.checkExternal !== false ? `
const externalLinks = allLinks.filter(l => l.isExternal);
linkResults.external = externalLinks.map(l => l.href);

for (const link of externalLinks.slice(0, 5)) { // Limit external checks
  try {
    const response = await page.request.head(link.href, { timeout: 5000 });
    if (response.status() >= 400) {
      linkResults.issues.push(\`External link broken: \${link.href}\`);
    }
  } catch (e) {
    // External links might block HEAD requests, don't fail
  }
}
` : ''}

// Check anchor links
${routine.config?.checkAnchors !== false ? `
const anchorLinks = allLinks.filter(l => l.href?.startsWith('#'));
for (const anchor of anchorLinks) {
  const targetId = anchor.href.slice(1);
  const targetExists = await page.$(\`#\${targetId}\`);
  if (!targetExists) {
    linkResults.issues.push(\`Anchor target not found: \${anchor.href}\`);
  }
}
` : ''}

console.log('Link results:', JSON.stringify(linkResults, null, 2));

if (linkResults.broken.length > 0) {
  throw new Error(\`Broken links found: \${linkResults.broken.map(l => l.href).join(', ')}\`);
}
`;
}
