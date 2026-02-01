/**
 * Utility functions for the PR Test Agent
 */

import { readFile, writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import type { TestManifest, AnalysisResult } from './types.js';

const execAsync = promisify(exec);

/**
 * Get the git diff for the current PR
 */
export async function getGitDiff(): Promise<string> {
  const baseBranch = process.env.GITHUB_BASE_REF || 'main';

  try {
    // Fetch the base branch to compare against
    await execAsync(`git fetch origin ${baseBranch} --depth=1`).catch(() => {});

    // Get the diff
    const { stdout } = await execAsync(
      `git diff origin/${baseBranch}...HEAD --no-color`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for large diffs
    );

    return stdout;
  } catch (error) {
    console.warn('Failed to get git diff, falling back to staged changes:', error);

    // Fallback: just show what files changed
    const { stdout } = await execAsync('git diff --name-only HEAD~1').catch(() => ({
      stdout: ''
    }));

    return `Changed files:\n${stdout}`;
  }
}

/**
 * Get codebase context for Claude analysis
 */
export async function getCodebaseContext(): Promise<string> {
  const context: string[] = [];

  // Get package.json info
  try {
    const pkg = await readFile('package.json', 'utf-8');
    const pkgJson = JSON.parse(pkg);
    context.push(`## Project Info
Name: ${pkgJson.name || 'unknown'}
Framework: ${pkgJson.dependencies?.next ? 'Next.js' : pkgJson.dependencies?.react ? 'React' : 'unknown'}
`);
  } catch {
    context.push('## Project Info\nUnable to read package.json\n');
  }

  // Get file structure
  try {
    const { stdout } = await execAsync(
      'find . -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | grep -v node_modules | grep -v .next | head -50'
    );
    context.push(`## Key Files\n${stdout}`);
  } catch {
    context.push('## Key Files\nUnable to list files\n');
  }

  // Get pages/routes
  try {
    const { stdout: pagesStdout } = await execAsync(
      'find ./pages ./app ./src/pages ./src/app -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \\) 2>/dev/null | head -30'
    ).catch(() => ({ stdout: '' }));

    if (pagesStdout) {
      context.push(`## Pages/Routes\n${pagesStdout}`);
    }
  } catch {
    // Ignore errors
  }

  return context.join('\n');
}

/**
 * Read the test manifest file
 */
export async function readTestManifest(): Promise<TestManifest> {
  const manifestPath = join(process.cwd(), 'tests', 'manifest.json');

  try {
    const content = await readFile(manifestPath, 'utf-8');
    return JSON.parse(content) as TestManifest;
  } catch {
    // Return default manifest if file doesn't exist
    return {
      version: 1,
      flows: {}
    };
  }
}

/**
 * Update the test manifest with new/modified tests
 */
export async function updateTestManifest(
  manifest: TestManifest,
  analysis: AnalysisResult
): Promise<void> {
  const manifestPath = join(process.cwd(), 'tests', 'manifest.json');

  // Add new flows from tests
  for (const test of analysis.testsToAdd) {
    if (test.flow && !manifest.flows[test.flow]) {
      manifest.flows[test.flow] = {
        description: `Auto-generated flow for ${test.flow}`,
        testFile: `e2e/${test.flow}.spec.ts`
      };
    }
  }

  // Increment version
  manifest.version = (manifest.version || 0) + 1;

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Updated test manifest (version ${manifest.version})`);
}

/**
 * Ensure required directories exist
 */
export async function ensureDirectories(): Promise<void> {
  const { mkdir } = await import('fs/promises');

  await mkdir(join(process.cwd(), 'tests', 'e2e'), { recursive: true });
  await mkdir(join(process.cwd(), 'tests', 'baselines'), { recursive: true });
}

/**
 * Parse environment variables into config
 */
export function parseConfig() {
  return {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    browserbaseApiKey: process.env.BROWSERBASE_API_KEY || '',
    browserbaseProjectId: process.env.BROWSERBASE_PROJECT_ID || '',
    vercelToken: process.env.VERCEL_TOKEN || '',
    vercelProjectId: process.env.VERCEL_PROJECT_ID,
    githubToken: process.env.GITHUB_TOKEN || '',
    prNumber: parseInt(process.env.PR_NUMBER || '0', 10),
    commitSha: process.env.GITHUB_SHA || '',
    repoOwner: (process.env.GITHUB_REPOSITORY || '/').split('/')[0],
    repoName: (process.env.GITHUB_REPOSITORY || '/').split('/')[1],
    previewUrl: process.env.PREVIEW_URL
  };
}

/**
 * Validate required environment variables
 */
export function validateConfig(): string[] {
  const errors: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    errors.push('ANTHROPIC_API_KEY is required');
  }

  if (!process.env.BROWSERBASE_API_KEY) {
    errors.push('BROWSERBASE_API_KEY is required');
  }

  if (!process.env.BROWSERBASE_PROJECT_ID) {
    errors.push('BROWSERBASE_PROJECT_ID is required');
  }

  return errors;
}
