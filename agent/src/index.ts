/**
 * PR Test Agent - Main Orchestrator
 *
 * This is the main entry point that coordinates:
 * 1. Getting PR diff and context
 * 2. Analyzing changes with Claude
 * 3. Waiting for Vercel preview deployment
 * 4. Deploying tests to Browserbase
 * 5. Running tests in parallel
 * 6. Reporting results to the PR
 */

import { waitForVercelDeployment } from './vercel-integration.js';
import { analyzeChanges, generateInitialTests } from './claude-analyzer.js';
import { deployTests } from './browserbase-deployer.js';
import { runTests } from './test-runner.js';
import { reportResults, reportError } from './pr-reporter.js';
import {
  getGitDiff,
  getCodebaseContext,
  readTestManifest,
  updateTestManifest,
  ensureDirectories,
  validateConfig
} from './utils.js';

// Check for --init flag
const INIT_MODE = process.argv.includes('--init');

async function main() {
  const startTime = Date.now();

  console.log('🤖 PR Test Agent starting...\n');

  if (INIT_MODE) {
    console.log('🚀 Running in INIT MODE - generating baseline tests for all pages\n');
  }

  // Validate configuration
  const configErrors = validateConfig();
  if (configErrors.length > 0) {
    console.error('Configuration errors:');
    configErrors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  // Ensure directories exist
  await ensureDirectories();

  let previewUrl = process.env.PREVIEW_URL || '';

  try {
    // Step 1: Get PR diff and context
    console.log('📋 Step 1: Getting PR diff and codebase context...');
    const [diff, context, manifest] = await Promise.all([
      getGitDiff(),
      getCodebaseContext(),
      readTestManifest()
    ]);

    console.log(`   Diff size: ${diff.length} characters`);
    console.log(`   Existing flows: ${Object.keys(manifest.flows).length}`);

    // Step 2: Wait for Vercel preview (if not provided)
    if (!previewUrl) {
      console.log('\n⏳ Step 2: Waiting for Vercel preview deployment...');
      previewUrl = await waitForVercelDeployment();
    } else {
      console.log('\n⏳ Step 2: Using provided preview URL...');
    }
    console.log(`   Preview ready: ${previewUrl}`);

    // Step 3: Analyze changes with Claude (or use init mode)
    let analysis;

    if (INIT_MODE) {
      // In init mode, generate tests for all pages in manifest
      console.log('\n🧠 Step 3: Generating baseline tests for all pages...');
      const initialTests = generateInitialTests(manifest);
      analysis = {
        changedFlows: Object.keys(manifest.flows),
        testsToAdd: initialTests,
        testsToModify: [],
        testsToRun: initialTests.map((t) => t.id),
        summary: 'Baseline test suite generated for all pages (init mode)'
      };
    } else {
      console.log('\n🧠 Step 3: Analyzing changes with Claude...');
      try {
        analysis = await analyzeChanges(diff, manifest, context);
      } catch (error) {
        console.warn('Claude analysis failed, using initial tests:', error);
        // Fall back to generating basic tests
        const initialTests = generateInitialTests(manifest);
        analysis = {
          changedFlows: ['initial-setup'],
          testsToAdd: initialTests,
          testsToModify: [],
          testsToRun: initialTests.map((t) => t.id),
          summary: 'Initial test suite generated (Claude analysis unavailable)'
        };
      }
    }

    console.log(`   Changed flows: ${analysis.changedFlows.length}`);
    console.log(`   Tests to add: ${analysis.testsToAdd.length}`);
    console.log(`   Tests to modify: ${analysis.testsToModify.length}`);
    console.log(`   Tests to run: ${analysis.testsToRun.length}`);

    // Print test definitions for visibility
    if (analysis.testsToAdd.length > 0) {
      console.log('\n📄 Generated Tests:');
      console.log('─'.repeat(60));
      for (const test of analysis.testsToAdd) {
        console.log(`\n🧪 Test: ${test.name} (${test.id})`);
        console.log(`   Flow: ${test.flow}`);
        console.log(`   Path: ${test.path || '/'}`);
        console.log(`   Viewport: ${test.viewport?.width}x${test.viewport?.height}`);
        console.log(`   Description: ${test.description}`);
        if (test.steps && test.steps.length > 0) {
          console.log('\n   Steps:');
          test.steps.forEach((step, i) => {
            console.log(`   ${i + 1}. ${JSON.stringify(step)}`);
          });
        }
        if (test.routines && test.routines.length > 0) {
          console.log('\n   Routines:');
          test.routines.forEach((routine, i) => {
            console.log(`   ${i + 1}. ${routine.routine}`);
          });
        }
        console.log('─'.repeat(60));
      }
    }

    // If no tests to run, report success and exit
    if (analysis.testsToRun.length === 0 && analysis.testsToAdd.length === 0) {
      console.log('\n✅ No tests to run for this PR');
      await reportResults([], analysis, previewUrl, Date.now() - startTime);
      return;
    }

    // Step 4: Deploy tests to Browserbase
    console.log('\n🚀 Step 4: Deploying tests to Browserbase...');
    const allTests = [
      ...analysis.testsToAdd,
      ...analysis.testsToModify.map((m) => m.updated)
    ];

    if (allTests.length === 0) {
      console.log('   No tests to deploy');
      await reportResults([], analysis, previewUrl, Date.now() - startTime);
      return;
    }

    const deployment = await deployTests(allTests);
    console.log(`   Deployed ${deployment.functionIds.size} functions`);
    console.log(`   Build ID: ${deployment.buildId}`);

    // Step 5: Run tests in parallel
    console.log('\n🧪 Step 5: Running tests in parallel...');
    const results = await runTests(deployment.functionIds, previewUrl);

    // Step 6: Update manifest
    console.log('\n📝 Step 6: Updating test manifest...');
    await updateTestManifest(manifest, analysis);

    // Step 7: Report results
    console.log('\n💬 Step 7: Posting results to PR...');
    const duration = Date.now() - startTime;
    await reportResults(results, analysis, previewUrl, duration);

    // Final summary
    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log('='.repeat(50));

    // Report results but don't fail CI - test failures are informational
    if (failed > 0) {
      console.log(`\n⚠️ ${failed} test(s) failed - see report above for details`);
    } else {
      console.log('\n✅ All tests passed!');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('\n❌ Fatal error:', errorMessage);

    // Try to report error to PR
    await reportError(errorMessage, previewUrl).catch(() => {});

    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
