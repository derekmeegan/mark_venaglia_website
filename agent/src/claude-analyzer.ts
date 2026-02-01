/**
 * Claude Analyzer - Uses Claude Agent SDK to analyze PR changes and generate tests
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AnalysisResult, TestManifest, TestDefinition } from './types.js';

const ANALYSIS_PROMPT = `You are a senior QA engineer analyzing a PR for a Next.js website.
Your job is to:
1. Analyze what user-facing flows/pages were affected by the changes
2. Determine if existing tests need to be modified
3. Generate new Playwright tests for any new functionality
4. Decide which tests should be run

## Current Test Suite
{manifest}

## Codebase Context
{context}

## PR Diff
{diff}

## Instructions

Analyze this PR and return a JSON response with the following structure:

{
  "changedFlows": ["list of user flows affected by this PR"],
  "testsToAdd": [
    {
      "id": "unique-test-id",
      "name": "Human readable test name",
      "description": "What this test verifies",
      "code": "// Playwright code - assume 'page' is available and PREVIEW_URL is passed as params.previewUrl",
      "flow": "which flow this tests",
      "viewport": { "width": 1920, "height": 1080 }
    }
  ],
  "testsToModify": [
    {
      "testId": "existing-test-id",
      "reason": "why this test needs modification",
      "original": { /* original test definition */ },
      "updated": { /* updated test definition */ }
    }
  ],
  "testsToRun": ["list of test IDs to execute"],
  "summary": "Brief summary of the analysis"
}

## Test Code Guidelines

When writing test code:
- Use \`params.previewUrl\` for the base URL (passed to the browser function)
- Use Playwright best practices (locators, waiting, assertions)
- Include visual screenshots with \`await page.screenshot({ fullPage: true })\`
- Test responsive viewports when relevant (mobile: 375x667, tablet: 768x1024, desktop: 1920x1080)
- Add meaningful assertions that verify functionality
- Handle async operations properly with appropriate waits

Example test code:
\`\`\`
await page.goto(params.previewUrl);
await page.waitForLoadState('networkidle');

// Verify hero section
const hero = page.locator('[data-testid="hero"]');
await expect(hero).toBeVisible();

// Test navigation
await page.click('nav a[href="/about"]');
await page.waitForURL('**/about');
await expect(page.locator('h1')).toContainText('About');
\`\`\`

Return ONLY valid JSON, no markdown code blocks or other text.`;

export async function analyzeChanges(
  diff: string,
  manifest: TestManifest,
  codebaseContext: string
): Promise<AnalysisResult> {
  const prompt = ANALYSIS_PROMPT
    .replace('{manifest}', JSON.stringify(manifest, null, 2))
    .replace('{context}', codebaseContext)
    .replace('{diff}', diff);

  console.log('Sending analysis request to Claude...');

  const q = query({
    prompt,
    options: {
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
      maxTurns: 1,
      outputFormat: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            changedFlows: { type: 'array', items: { type: 'string' } },
            testsToAdd: { type: 'array' },
            testsToModify: { type: 'array' },
            testsToRun: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' }
          },
          required: ['changedFlows', 'testsToAdd', 'testsToModify', 'testsToRun', 'summary']
        }
      },
      // Don't persist this session
      persistSession: false,
      // Only use read tools if needed
      tools: ['Read', 'Glob', 'Grep'],
    }
  });

  let resultText = '';

  for await (const message of q) {
    if (message.type === 'assistant') {
      // Extract text content from assistant message
      for (const block of message.message.content) {
        if (block.type === 'text') {
          resultText += block.text;
        }
      }
    }

    if (message.type === 'result') {
      // Check for errors
      if (message.subtype === 'error_max_turns') {
        throw new Error('Analysis exceeded maximum turns');
      }
    }
  }

  // Parse the JSON result
  try {
    const result = JSON.parse(resultText) as AnalysisResult;
    return result;
  } catch (error) {
    console.error('Failed to parse Claude response:', resultText);
    throw new Error(`Failed to parse analysis result: ${error}`);
  }
}

/**
 * Generate a simple initial test suite for first run
 */
export function generateInitialTests(manifest: TestManifest): TestDefinition[] {
  const tests: TestDefinition[] = [];

  // Generate navigation test
  tests.push({
    id: 'nav-homepage-load',
    name: 'Homepage loads successfully',
    description: 'Verify the homepage loads and displays main content',
    flow: 'navigation',
    code: `
await page.goto(params.previewUrl);
await page.waitForLoadState('networkidle');

// Verify page loaded
await expect(page).toHaveTitle(/.+/);

// Check for main content
const main = page.locator('main');
await expect(main).toBeVisible();
`,
    viewport: { width: 1920, height: 1080 }
  });

  // Generate test for each known path
  for (const [flowName, flow] of Object.entries(manifest.flows || {})) {
    if (flow.coveredPaths) {
      for (const path of flow.coveredPaths) {
        if (path === '/') continue; // Skip homepage, already covered

        tests.push({
          id: `nav-${path.replace(/\//g, '-').slice(1) || 'home'}`,
          name: `Page ${path} loads successfully`,
          description: `Verify ${path} page loads correctly`,
          flow: flowName,
          code: `
await page.goto(params.previewUrl + '${path}');
await page.waitForLoadState('networkidle');

// Verify page loaded
const main = page.locator('main');
await expect(main).toBeVisible();

// Check for page heading
const heading = page.locator('h1').first();
await expect(heading).toBeVisible();
`,
          viewport: { width: 1920, height: 1080 }
        });
      }
    }
  }

  return tests;
}
