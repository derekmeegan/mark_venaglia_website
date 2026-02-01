/**
 * Claude Analyzer - Uses Anthropic API to analyze PR changes and generate tests
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisResult, TestManifest, TestDefinition } from './types.js';

const anthropic = new Anthropic();

const ANALYSIS_PROMPT = `You are a senior QA engineer analyzing a PR for a website.
Your job is to:
1. Analyze what user-facing flows/pages were affected by the changes
2. Generate test steps for affected functionality
3. Decide which tests should be run

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
      "steps": [/* array of test steps - see below */],
      "flow": "which flow this tests",
      "viewport": { "width": 1920, "height": 1080 }
    }
  ],
  "testsToModify": [],
  "testsToRun": ["list of test IDs to execute"],
  "summary": "Brief summary of the analysis"
}

## Available Test Steps

Instead of writing code, define tests as an array of structured steps:

| Action | Parameters | Example |
|--------|------------|---------|
| navigate | path: string | {"action":"navigate","path":"/"} |
| waitForLoad | state?: "networkidle" | {"action":"waitForLoad","state":"networkidle"} |
| waitForSelector | selector, state? | {"action":"waitForSelector","selector":"main"} |
| waitForUrl | pattern: string | {"action":"waitForUrl","pattern":"**/about"} |
| click | selector: string | {"action":"click","selector":"nav a[href='/about']"} |
| fill | selector, value | {"action":"fill","selector":"input[name='email']","value":"test@test.com"} |
| hover | selector: string | {"action":"hover","selector":".menu-item"} |
| screenshot | name?, fullPage? | {"action":"screenshot","fullPage":true} |
| assertVisible | selector: string | {"action":"assertVisible","selector":"main"} |
| assertHidden | selector: string | {"action":"assertHidden","selector":".loading"} |
| assertText | selector, text, exact? | {"action":"assertText","selector":"h1","text":"Welcome"} |
| assertTitle | pattern: string | {"action":"assertTitle","pattern":"/.+/"} |
| assertUrl | pattern: string | {"action":"assertUrl","pattern":"**/about"} |
| assertCount | selector, count | {"action":"assertCount","selector":".item","count":5} |
| scroll | selector?, direction? | {"action":"scroll","direction":"down"} |
| press | key: string | {"action":"press","key":"Enter"} |
| wait | ms: number | {"action":"wait","ms":1000} |

## Example Test

{
  "id": "homepage-hero-visible",
  "name": "Homepage hero section loads",
  "description": "Verify the homepage loads and displays the hero section",
  "steps": [
    {"action": "navigate", "path": "/"},
    {"action": "waitForLoad", "state": "networkidle"},
    {"action": "assertVisible", "selector": "main"},
    {"action": "assertTitle", "pattern": "/.+/"},
    {"action": "screenshot", "fullPage": true}
  ],
  "flow": "homepage",
  "viewport": {"width": 1920, "height": 1080}
}

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

  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';

  // Log the full payload for visibility
  console.log('\n' + '='.repeat(60));
  console.log('📤 CLAUDE ANALYSIS REQUEST');
  console.log('='.repeat(60));
  console.log(`Model: ${model}`);
  console.log(`Max tokens: 8192`);
  console.log(`Prompt length: ${prompt.length} characters`);
  console.log('\n--- FULL PROMPT START ---');
  console.log(prompt);
  console.log('--- FULL PROMPT END ---\n');
  console.log('='.repeat(60));
  console.log('Sending analysis request to Claude...\n');

  const response = await anthropic.messages.create({
    model,
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  // Extract text from response
  let resultText = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      resultText += block.text;
    }
  }

  // Log the raw response
  console.log('\n' + '='.repeat(60));
  console.log('📥 CLAUDE ANALYSIS RESPONSE');
  console.log('='.repeat(60));
  console.log(`Stop reason: ${response.stop_reason}`);
  console.log(`Input tokens: ${response.usage.input_tokens}`);
  console.log(`Output tokens: ${response.usage.output_tokens}`);
  console.log('\n--- RAW RESPONSE START ---');
  console.log(resultText);
  console.log('--- RAW RESPONSE END ---\n');
  console.log('='.repeat(60));

  // Clean up any markdown code blocks if present
  resultText = resultText.trim();
  if (resultText.startsWith('```json')) {
    resultText = resultText.slice(7);
  } else if (resultText.startsWith('```')) {
    resultText = resultText.slice(3);
  }
  if (resultText.endsWith('```')) {
    resultText = resultText.slice(0, -3);
  }
  resultText = resultText.trim();

  // Parse the JSON result
  try {
    const result = JSON.parse(resultText) as AnalysisResult;
    console.log(`\n✅ Analysis complete: ${result.summary}`);
    return result;
  } catch (error) {
    console.error('Failed to parse Claude response:', resultText.slice(0, 500));
    throw new Error(`Failed to parse analysis result: ${error}`);
  }
}

/**
 * Generate a simple initial test suite for first run
 */
export function generateInitialTests(manifest: TestManifest): TestDefinition[] {
  const tests: TestDefinition[] = [];

  // Generate homepage test
  tests.push({
    id: 'nav-homepage-load',
    name: 'Homepage loads successfully',
    description: 'Verify the homepage loads and displays main content',
    flow: 'navigation',
    steps: [
      { action: 'navigate', path: '/' },
      { action: 'waitForLoad', state: 'networkidle' },
      { action: 'assertTitle', pattern: '/.+/' },
      { action: 'assertVisible', selector: 'main' },
      { action: 'screenshot', fullPage: true }
    ],
    viewport: { width: 1920, height: 1080 }
  });

  // Generate test for each known path
  const seenPaths = new Set<string>(['/']);

  for (const [flowName, flow] of Object.entries(manifest.flows || {})) {
    if (flow.coveredPaths) {
      for (const path of flow.coveredPaths) {
        if (seenPaths.has(path)) continue;
        seenPaths.add(path);

        const pathSlug = path.replace(/\//g, '-').slice(1) || 'home';

        tests.push({
          id: `page-${pathSlug}`,
          name: `Page ${path} loads successfully`,
          description: `Verify ${path} page loads correctly`,
          flow: flowName,
          steps: [
            { action: 'navigate', path },
            { action: 'waitForLoad', state: 'networkidle' },
            { action: 'assertVisible', selector: 'main' },
            { action: 'assertVisible', selector: 'h1' },
            { action: 'screenshot', fullPage: true }
          ],
          viewport: { width: 1920, height: 1080 }
        });
      }
    }
  }

  return tests;
}
