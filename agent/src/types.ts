/**
 * Shared types for the PR Test Agent
 */

// Test manifest structure
export interface TestManifest {
  version: number;
  appDescription?: string;
  flows: Record<string, FlowDefinition>;
}

export interface FlowDefinition {
  description: string;
  testFile?: string;
  coveredPaths?: string[];
  coveredElements?: string[];
  baselineDir?: string;
}

// Test step types - structured actions instead of raw code
export type TestStep =
  | { action: 'navigate'; path: string }
  | { action: 'waitForLoad'; state?: 'load' | 'domcontentloaded' | 'networkidle' }
  | { action: 'waitForSelector'; selector: string; state?: 'visible' | 'hidden' | 'attached' }
  | { action: 'waitForUrl'; pattern: string }
  | { action: 'click'; selector: string }
  | { action: 'fill'; selector: string; value: string }
  | { action: 'hover'; selector: string }
  | { action: 'screenshot'; name?: string; fullPage?: boolean }
  | { action: 'assertVisible'; selector: string }
  | { action: 'assertHidden'; selector: string }
  | { action: 'assertText'; selector: string; text: string; exact?: boolean }
  | { action: 'assertTitle'; pattern: string }
  | { action: 'assertUrl'; pattern: string }
  | { action: 'assertCount'; selector: string; count: number }
  | { action: 'scroll'; selector?: string; direction?: 'up' | 'down' }
  | { action: 'press'; key: string }
  | { action: 'wait'; ms: number };

// Import routine types
import type { TestRoutine } from './test-routines.js';

// Test definitions - can use either steps OR routines
export interface TestDefinition {
  id: string;
  name: string;
  description: string;
  steps?: TestStep[];       // Simple structured steps
  routines?: TestRoutine[]; // Substantive test routines
  flow: string;
  path?: string;            // Page path for routines
  viewport?: Viewport;
}

// Legacy support - tests with raw code
export interface LegacyTestDefinition {
  id: string;
  name: string;
  description: string;
  code: string;
  flow: string;
  viewport?: Viewport;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface TestModification {
  testId: string;
  reason: string;
  original: TestDefinition;
  updated: TestDefinition;
}

/**
 * Convert structured test steps to Playwright code
 */
export function stepsToCode(steps: TestStep[]): string {
  return steps.map(step => {
    switch (step.action) {
      case 'navigate':
        return `await page.goto(params.previewUrl + '${step.path === '/' ? '' : step.path}');`;
      case 'waitForLoad':
        return `await page.waitForLoadState('${step.state || 'networkidle'}');`;
      case 'waitForSelector':
        return `await page.waitForSelector('${step.selector}'${step.state ? `, { state: '${step.state}' }` : ''});`;
      case 'waitForUrl':
        return `await page.waitForURL('${step.pattern}');`;
      case 'click':
        return `await page.click('${step.selector}');`;
      case 'fill':
        return `await page.fill('${step.selector}', '${step.value}');`;
      case 'hover':
        return `await page.hover('${step.selector}');`;
      case 'screenshot':
        return `await page.screenshot({ fullPage: ${step.fullPage !== false} });`;
      case 'assertVisible':
        return `await expect(page.locator('${step.selector}')).toBeVisible();`;
      case 'assertHidden':
        return `await expect(page.locator('${step.selector}')).toBeHidden();`;
      case 'assertText':
        return step.exact
          ? `await expect(page.locator('${step.selector}')).toHaveText('${step.text}');`
          : `await expect(page.locator('${step.selector}')).toContainText('${step.text}');`;
      case 'assertTitle':
        return `await expect(page).toHaveTitle(${step.pattern.startsWith('/') ? step.pattern : `'${step.pattern}'`});`;
      case 'assertUrl':
        return `await expect(page).toHaveURL(${step.pattern.startsWith('/') ? step.pattern : `'${step.pattern}'`});`;
      case 'assertCount':
        return `await expect(page.locator('${step.selector}')).toHaveCount(${step.count});`;
      case 'scroll':
        return step.selector
          ? `await page.locator('${step.selector}').scrollIntoViewIfNeeded();`
          : `await page.evaluate(() => window.scrollBy(0, ${step.direction === 'up' ? -500 : 500}));`;
      case 'press':
        return `await page.keyboard.press('${step.key}');`;
      case 'wait':
        return `await page.waitForTimeout(${step.ms});`;
      default:
        return `// Unknown action: ${JSON.stringify(step)}`;
    }
  }).join('\n');
}

// Analysis results from Claude
export interface AnalysisResult {
  changedFlows: string[];
  testsToAdd: TestDefinition[];
  testsToModify: TestModification[];
  testsToRun: string[];
  summary: string;
}

// Test execution results
export interface TestResult {
  testId: string;
  success: boolean;
  error?: string;
  duration: number;
  sessionId: string;
  sessionUrl: string;
  finalScreenshot?: string;
}

// Browserbase deployment
export interface DeploymentResult {
  buildId: string;
  functionIds: Map<string, string>; // testId -> functionId
}

export interface BrowserbaseFunctionInfo {
  id: string;
  name: string;
  status: string;
}

// Vercel deployment
export interface VercelDeployment {
  id: string;
  url: string;
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  meta?: {
    githubCommitSha?: string;
    githubCommitRef?: string;
  };
}

// Environment configuration
export interface Config {
  anthropicApiKey: string;
  browserbaseApiKey: string;
  browserbaseProjectId: string;
  vercelToken: string;
  vercelProjectId?: string;
  githubToken: string;
  prNumber: number;
  commitSha: string;
  repoOwner: string;
  repoName: string;
}

// PR Reporter types
export interface ReportData {
  results: TestResult[];
  analysis: AnalysisResult;
  previewUrl: string;
  duration: number;
}
