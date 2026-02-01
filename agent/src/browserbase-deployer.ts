/**
 * Browserbase Deployer - Deploy tests as Browser Functions
 */

import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { stepsToCode } from './types.js';
import { routineToCode } from './test-routines.js';
import type { TestDefinition, DeploymentResult } from './types.js';

const execAsync = promisify(exec);

const BB_API = 'https://api.browserbase.com/v1';

/**
 * Convert a test definition into a Browser Function code string
 */
function generateFunctionCode(test: TestDefinition): string {
  const viewport = test.viewport || { width: 1920, height: 1080 };

  // Convert steps or routines to Playwright code
  let testCode = '';

  if (test.routines && test.routines.length > 0) {
    // Use routines (substantive tests)
    testCode = test.routines
      .map(routine => routineToCode(routine, test.path || '/'))
      .join('\n\n');
  } else if (test.steps && test.steps.length > 0) {
    // Use simple steps
    testCode = stepsToCode(test.steps);
  } else {
    testCode = '// No test steps or routines defined';
  }

  return `import { defineFn } from "@browserbasehq/sdk-functions";
import { chromium } from "playwright-core";
import { expect } from "@playwright/test";

defineFn("${test.id}", async (ctx, params) => {
  const browser = await chromium.connectOverCDP(ctx.session.connectUrl);
  const context = browser.contexts()[0];
  const page = context?.pages()[0];

  if (!page) {
    await releaseSession(ctx.session.id);
    return {
      success: false,
      testId: "${test.id}",
      error: "No page available"
    };
  }

  const sessionUrl = \`https://www.browserbase.com/sessions/\${ctx.session.id}\`;

  // Set Vercel bypass secret as cookie so it applies to all sub-resource requests
  if (params.bypassSecret) {
    const url = new URL(params.previewUrl);
    await context.addCookies([{
      name: 'x-vercel-protection-bypass',
      value: params.bypassSecret,
      domain: url.hostname,
      path: '/',
      sameSite: 'None',
      secure: true
    }]);
  }

  // Helper to build URL with bypass secret query param for main navigations
  function buildUrl(baseUrl: string, path: string = ''): string {
    const url = baseUrl + path;
    if (params.bypassSecret) {
      const separator = url.includes('?') ? '&' : '?';
      return url + separator + 'x-vercel-protection-bypass=' + params.bypassSecret;
    }
    return url;
  }

  try {
    // Test steps (auto-generated from structured definition)
    ${testCode}

    // Close browser and release session
    await browser.close();
    await releaseSession(ctx.session.id);

    return {
      success: true,
      testId: "${test.id}",
      testName: "${test.name}",
      sessionId: ctx.session.id,
      sessionUrl
    };
  } catch (error) {
    // Close browser and release session
    await browser.close().catch(() => {});
    await releaseSession(ctx.session.id);

    return {
      success: false,
      testId: "${test.id}",
      testName: "${test.name}",
      error: String(error),
      sessionId: ctx.session.id,
      sessionUrl
    };
  }
}, {
  sessionConfig: {
    viewport: { width: ${viewport.width}, height: ${viewport.height} }
  }
});

// Helper to release the session
async function releaseSession(sessionId: string) {
  try {
    await fetch(\`https://api.browserbase.com/v1/sessions/\${sessionId}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BB-API-Key': process.env.BROWSERBASE_API_KEY || ''
      },
      body: JSON.stringify({
        projectId: process.env.BROWSERBASE_PROJECT_ID,
        status: 'REQUEST_RELEASE'
      })
    });
  } catch (e) {
    console.warn('Failed to release session:', e);
  }
}
`;
}

/**
 * Generate an index file that imports all function files
 */
function generateIndexFile(tests: TestDefinition[]): string {
  // Use .ts extension since we're using TypeScript
  const imports = tests.map((_, i) => `import './fn_${i}.ts';`).join('\n');
  return imports;
}

// Max functions per batch to avoid TOO_MANY_MANIFESTS error
const MAX_FUNCTIONS_PER_BATCH = parseInt(process.env.BB_BATCH_SIZE || '5', 10);

/**
 * Deploy a single batch of tests
 */
async function deployBatch(
  tests: TestDefinition[],
  batchIndex: number,
  apiKey: string,
  projectId: string
): Promise<Map<string, string>> {
  const functionIds = new Map<string, string>();

  // Create temp directory for this batch
  const tempDir = join(process.cwd(), `.bb-functions-temp-${batchIndex}`);
  await mkdir(tempDir, { recursive: true });

  try {
    // Write function files
    for (let i = 0; i < tests.length; i++) {
      const code = generateFunctionCode(tests[i]);
      await writeFile(join(tempDir, `fn_${i}.ts`), code);
    }

    // Write index file
    const indexCode = generateIndexFile(tests);
    await writeFile(join(tempDir, 'index.ts'), indexCode);

    // Write package.json
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({
      name: 'pr-test-functions',
      type: 'module',
      dependencies: {
        '@browserbasehq/sdk-functions': '^0.0.5',
        '@playwright/test': '^1.50.0',
        'playwright-core': '^1.50.0'
      }
    }, null, 2));

    // Write tsconfig.json for TypeScript support
    await writeFile(join(tempDir, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true
      },
      include: ['*.ts']
    }, null, 2));

    // Write .env file for CLI
    await writeFile(join(tempDir, '.env'), `
BROWSERBASE_API_KEY=${apiKey}
BROWSERBASE_PROJECT_ID=${projectId}
`.trim());

    console.log(`[Batch ${batchIndex + 1}] Generated ${tests.length} function files`);

    // Install dependencies and publish
    console.log(`[Batch ${batchIndex + 1}] Installing dependencies...`);
    await execAsync('npm install', { cwd: tempDir });

    console.log(`[Batch ${batchIndex + 1}] Publishing functions to Browserbase...`);
    const { stdout, stderr } = await execAsync('npx bb publish index.ts', {
      cwd: tempDir,
      env: {
        ...process.env,
        BROWSERBASE_API_KEY: apiKey,
        BROWSERBASE_PROJECT_ID: projectId
      }
    });

    console.log(`[Batch ${batchIndex + 1}] Publish output:`, stdout);
    if (stderr) {
      console.error(`[Batch ${batchIndex + 1}] Publish stderr:`, stderr);
    }

    // Parse build ID from output
    const buildIdMatch = stdout.match(/Build ID:\s*(\S+)/i) || stdout.match(/build[_-]?id[:\s]+(\S+)/i);
    const buildId = buildIdMatch?.[1] || `build-${Date.now()}`;

    // Parse function IDs directly from CLI output
    const functionPattern = /^\d+\.\s+(\S+)\s*\n\s*Function ID:\s*(\S+)/gm;
    let match;
    while ((match = functionPattern.exec(stdout)) !== null) {
      const [, name, id] = match;
      functionIds.set(name, id);
      console.log(`[Batch ${batchIndex + 1}] Parsed function: ${name} -> ${id}`);
    }

    // Fallback: try API if we didn't parse any functions
    if (functionIds.size === 0) {
      console.log(`[Batch ${batchIndex + 1}] No functions parsed from CLI output, trying API...`);
      const apiFunctions = await getFunctionIdsFromBuild(buildId, apiKey);
      for (const [name, id] of apiFunctions) {
        functionIds.set(name, id);
      }
    }

    console.log(`[Batch ${batchIndex + 1}] Deployed ${functionIds.size} functions`);
    return functionIds;
  } finally {
    // Clean up temp directory
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Deploy tests as Browser Functions to Browserbase
 * Deploys in batches to avoid TOO_MANY_MANIFESTS error
 */
export async function deployTests(tests: TestDefinition[]): Promise<DeploymentResult> {
  if (tests.length === 0) {
    return {
      buildId: '',
      functionIds: new Map()
    };
  }

  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    throw new Error('BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are required');
  }

  // Split tests into batches
  const batches: TestDefinition[][] = [];
  for (let i = 0; i < tests.length; i += MAX_FUNCTIONS_PER_BATCH) {
    batches.push(tests.slice(i, i + MAX_FUNCTIONS_PER_BATCH));
  }

  console.log(`Deploying ${tests.length} functions in ${batches.length} batch(es) (max ${MAX_FUNCTIONS_PER_BATCH} per batch)`);

  // Deploy each batch sequentially
  const allFunctionIds = new Map<string, string>();
  const buildIds: string[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n--- Deploying batch ${i + 1}/${batches.length} (${batch.length} functions) ---`);

    const batchFunctionIds = await deployBatch(batch, i, apiKey, projectId);

    // Merge function IDs
    for (const [name, id] of batchFunctionIds) {
      allFunctionIds.set(name, id);
    }

    // Add small delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      console.log('Waiting 2s before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\nTotal functions deployed across all batches: ${allFunctionIds.size}`);

  return {
    buildId: buildIds.join(',') || `multi-batch-${Date.now()}`,
    functionIds: allFunctionIds
  };
}

/**
 * Get function IDs from a completed build
 */
async function getFunctionIdsFromBuild(
  buildId: string,
  apiKey: string
): Promise<Map<string, string>> {
  const functionIds = new Map<string, string>();

  try {
    // Get build info
    const response = await fetch(`${BB_API}/functions/builds/${buildId}`, {
      headers: {
        'x-bb-api-key': apiKey
      }
    });

    if (!response.ok) {
      console.warn(`Failed to get build info: ${response.status}`);
      return functionIds;
    }

    const build = await response.json() as {
      builtFunctions?: Array<{ id: string; name: string }>;
    };

    console.log('Build API response:', JSON.stringify(build, null, 2));

    if (build.builtFunctions) {
      for (const fn of build.builtFunctions) {
        functionIds.set(fn.name, fn.id);
        console.log(`Found function from API: ${fn.name} -> ${fn.id}`);
      }
    }
  } catch (error) {
    console.warn('Failed to get function IDs from build:', error);
  }

  return functionIds;
}

/**
 * Alternative: Deploy using direct API instead of CLI
 * This could be used if the CLI approach doesn't work in GHA
 */
export async function deployTestsViaAPI(tests: TestDefinition[]): Promise<DeploymentResult> {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    throw new Error('BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are required');
  }

  // For now, this is a placeholder - the actual API for deploying functions
  // may differ. The CLI approach is more reliable for bundling dependencies.

  console.warn('API-based deployment not yet implemented, falling back to CLI');
  return deployTests(tests);
}
