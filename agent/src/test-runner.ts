/**
 * Test Runner - Invoke Browser Functions in parallel and collect results
 */

import type { TestResult } from './types.js';

const BB_API = 'https://api.browserbase.com/v1';
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_WAIT_TIME = 3 * 60 * 1000; // 3 minutes max per test
const MAX_CONCURRENCY = parseInt(process.env.TEST_CONCURRENCY || '25', 10);

interface InvocationResponse {
  id: string;
}

interface InvocationStatus {
  id: string;
  functionId: string;
  sessionId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  params: Record<string, unknown>;
  results?: {
    success: boolean;
    testId: string;
    testName?: string;
    error?: string;
    sessionId: string;
    sessionUrl: string;
    finalScreenshot?: string;
  };
  createdAt: string;
  endedAt?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Invoke a single function and return the invocation ID
 */
async function invokeFunction(
  functionId: string,
  params: Record<string, unknown>,
  apiKey: string
): Promise<string> {
  console.log(`Invoking function ${functionId} with params:`, params);

  const response = await fetch(`${BB_API}/functions/${functionId}/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bb-api-key': apiKey
    },
    body: JSON.stringify({ params })  // Wrap user params in 'params' field
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to invoke function ${functionId}: ${response.status} - ${error}`);
  }

  const data = await response.json() as InvocationResponse;
  return data.id;
}

/**
 * Poll for invocation completion
 */
async function waitForInvocation(
  invocationId: string,
  apiKey: string
): Promise<InvocationStatus> {
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_TIME) {
    const response = await fetch(`${BB_API}/functions/invocations/${invocationId}`, {
      headers: {
        'x-bb-api-key': apiKey
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get invocation status: ${response.status} - ${error}`);
    }

    const status = await response.json() as InvocationStatus;

    if (status.status === 'COMPLETED' || status.status === 'FAILED') {
      return status;
    }

    await sleep(POLL_INTERVAL);
  }

  throw new Error(`Timeout waiting for invocation ${invocationId}`);
}

/**
 * Run tasks with limited concurrency
 */
async function runWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = fn(item).then((result) => {
      results.push(result);
    });

    executing.push(promise as unknown as Promise<void>);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises
      for (let i = executing.length - 1; i >= 0; i--) {
        const p = executing[i];
        // Check if promise is settled by racing with an immediate resolve
        const settled = await Promise.race([
          p.then(() => true).catch(() => true),
          Promise.resolve(false)
        ]);
        if (settled) {
          executing.splice(i, 1);
        }
      }
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Run all tests with configurable concurrency and collect results
 */
export async function runTests(
  functionIds: Map<string, string>,
  previewUrl: string
): Promise<TestResult[]> {
  const apiKey = process.env.BROWSERBASE_API_KEY;

  if (!apiKey) {
    throw new Error('BROWSERBASE_API_KEY is required');
  }

  if (functionIds.size === 0) {
    console.log('No functions to run');
    return [];
  }

  console.log(`Invoking ${functionIds.size} test functions (max concurrency: ${MAX_CONCURRENCY})...`);
  console.log(`Max wait time per test: ${MAX_WAIT_TIME / 1000}s`);

  // Invoke all functions with concurrency limit
  const entries = Array.from(functionIds.entries());

  const invocations = await runWithConcurrency(
    entries,
    async ([testId, functionId]) => {
      try {
        const bypassSecret = process.env.VERCEL_BYPASS_SECRET;
        const invocationId = await invokeFunction(
          functionId,
          { previewUrl, bypassSecret },
          apiKey
        );
        console.log(`✓ Invoked test ${testId}: ${invocationId}`);
        return { testId, functionId, invocationId, error: null };
      } catch (error) {
        console.error(`✗ Failed to invoke test ${testId}: ${error}`);
        return { testId, functionId, invocationId: null, error: String(error) };
      }
    },
    MAX_CONCURRENCY
  );

  // Wait for all invocations to complete with concurrency limit
  console.log('\nWaiting for test completion...');

  const results = await runWithConcurrency(
    invocations,
    async (inv): Promise<TestResult> => {
    const startTime = Date.now();

    if (inv.error || !inv.invocationId) {
      return {
        testId: inv.testId,
        success: false,
        error: inv.error || 'Failed to invoke function',
        duration: 0,
        sessionId: '',
        sessionUrl: ''
      };
    }

    try {
      const status = await waitForInvocation(inv.invocationId, apiKey);
      const duration = Date.now() - startTime;

      // Log status for debugging (exclude large fields like screenshots)
      const { results, ...statusWithoutResults } = status;
      console.log(`[${inv.testId}] Invocation status:`, JSON.stringify(statusWithoutResults, null, 2));
      if (results) {
        const { finalScreenshot, ...resultsWithoutScreenshot } = results;
        console.log(`[${inv.testId}] Results:`, JSON.stringify(resultsWithoutScreenshot, null, 2));
      }

      // Check if function execution failed
      if (status.status === 'FAILED') {
        console.log(`✗ ${inv.testId}: Function execution failed (${(duration/1000).toFixed(1)}s)`);
        return {
          testId: inv.testId,
          success: false,
          error: 'Function execution failed',
          duration,
          sessionId: status.sessionId || '',
          sessionUrl: `https://www.browserbase.com/sessions/${status.sessionId || ''}`
        };
      }

      // If status is COMPLETED, treat as success even if results are empty
      // (the function ran without throwing, which means tests passed)
      const hasResults = results && Object.keys(results).length > 0;

      // If we have explicit results, use them; otherwise assume success for COMPLETED status
      const success = hasResults ? results.success === true : status.status === 'COMPLETED';

      console.log(`${success ? '✓' : '✗'} ${inv.testId}: ${success ? 'passed' : 'failed'} (${(duration/1000).toFixed(1)}s)${!hasResults ? ' [no results returned]' : ''}`);

      return {
        testId: inv.testId,
        success,
        error: results?.error,
        duration,
        sessionId: results?.sessionId || status.sessionId,
        sessionUrl: results?.sessionUrl || `https://www.browserbase.com/sessions/${status.sessionId}`
      };
    } catch (error) {
      const result: TestResult = {
        testId: inv.testId,
        success: false,
        error: String(error),
        duration: Date.now() - startTime,
        sessionId: '',
        sessionUrl: ''
      };
      console.log(`✗ ${inv.testId}: ${error}`);
      return result;
    }
  },
  MAX_CONCURRENCY
  );

  // Log summary
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`Test results: ${passed} passed, ${failed} failed`);

  return results;
}

/**
 * Run a single test (useful for debugging)
 */
export async function runSingleTest(
  functionId: string,
  previewUrl: string
): Promise<TestResult> {
  const results = await runTests(
    new Map([['single-test', functionId]]),
    previewUrl
  );
  return results[0];
}
