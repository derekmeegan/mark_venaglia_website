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
 * Generate a comprehensive initial test suite using substantive routines
 */
export function generateInitialTests(manifest: TestManifest): TestDefinition[] {
  const tests: TestDefinition[] = [];

  // Collect all unique paths from manifest
  const allPaths = new Set<string>();
  for (const flow of Object.values(manifest.flows || {})) {
    if (flow.coveredPaths) {
      flow.coveredPaths.forEach(p => allPaths.add(p));
    }
  }

  // If no paths defined, at least test homepage
  if (allPaths.size === 0) {
    allPaths.add('/');
  }

  // Generate comprehensive tests for each page
  for (const path of allPaths) {
    const pathSlug = path === '/' ? 'homepage' : path.replace(/\//g, '-').slice(1);

    // 1. Performance test
    tests.push({
      id: `perf-${pathSlug}`,
      name: `Performance: ${path}`,
      description: `Measure page load performance and Core Web Vitals for ${path}`,
      flow: 'performance',
      path,
      routines: [
        { routine: 'performance', config: { maxLoadTime: 3000, maxLCP: 2500, maxCLS: 0.1 } }
      ],
      viewport: { width: 1920, height: 1080 }
    });

    // 2. Accessibility test
    tests.push({
      id: `a11y-${pathSlug}`,
      name: `Accessibility: ${path}`,
      description: `Check accessibility compliance for ${path}`,
      flow: 'accessibility',
      path,
      routines: [
        { routine: 'accessibility', config: { checkAria: true, checkAltText: true, checkHeadingOrder: true, checkKeyboardNav: true } }
      ],
      viewport: { width: 1920, height: 1080 }
    });

    // 3. SEO test (only for main pages)
    if (['/', '/about', '/contact'].includes(path) || allPaths.size <= 6) {
      tests.push({
        id: `seo-${pathSlug}`,
        name: `SEO: ${path}`,
        description: `Check SEO fundamentals for ${path}`,
        flow: 'seo',
        path,
        routines: [
          { routine: 'seo', config: { checkTitle: true, checkMetaDescription: true, checkOgTags: true, checkHeadingStructure: true } }
        ],
        viewport: { width: 1920, height: 1080 }
      });
    }

    // 4. Console errors test
    tests.push({
      id: `console-${pathSlug}`,
      name: `Console Errors: ${path}`,
      description: `Check for JavaScript errors on ${path}`,
      flow: 'console-errors',
      path,
      routines: [
        { routine: 'console-errors', config: { allowWarnings: true } }
      ],
      viewport: { width: 1920, height: 1080 }
    });

    // 5. Visual test
    tests.push({
      id: `visual-${pathSlug}`,
      name: `Visual: ${path}`,
      description: `Visual regression check for ${path}`,
      flow: 'visual',
      path,
      routines: [
        { routine: 'visual', config: { captureFullPage: true, checkImagesLoaded: true } }
      ],
      viewport: { width: 1920, height: 1080 }
    });
  }

  // 6. Responsive test (just for homepage to keep run time reasonable)
  tests.push({
    id: 'responsive-homepage',
    name: 'Responsive: Homepage',
    description: 'Check responsive design across viewport sizes',
    flow: 'responsive',
    path: '/',
    routines: [
      {
        routine: 'responsive',
        config: {
          viewports: [
            { name: 'mobile', width: 375, height: 667 },
            { name: 'tablet', width: 768, height: 1024 },
            { name: 'desktop', width: 1920, height: 1080 }
          ],
          checkNoHorizontalScroll: true,
          checkTextReadable: true
        }
      }
    ],
    viewport: { width: 1920, height: 1080 }
  });

  // 7. Navigation test
  tests.push({
    id: 'navigation-site',
    name: 'Navigation: Site-wide',
    description: 'Verify all navigation links work correctly',
    flow: 'navigation',
    path: '/',
    routines: [
      { routine: 'navigation', config: { checkAllLinks: true, checkBackButton: true, maxNavigationTime: 10000 } }
    ],
    viewport: { width: 1920, height: 1080 }
  });

  // 8. Link validation
  tests.push({
    id: 'links-homepage',
    name: 'Links: Homepage',
    description: 'Validate all links on homepage',
    flow: 'links',
    path: '/',
    routines: [
      { routine: 'links', config: { checkInternal: true, checkExternal: false, checkAnchors: true } }
    ],
    viewport: { width: 1920, height: 1080 }
  });

  return tests;
}
