/**
 * Test Runner - Invoke Browser Functions in parallel and collect results
 */

import type { TestResult } from './types.js';

const BB_API = 'https://api.browserbase.com/v1';
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_WAIT_TIME = 5 * 60 * 1000; // 5 minutes per test

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
  const response = await fetch(`${BB_API}/functions/${functionId}/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bb-api-key': apiKey
    },
    body: JSON.stringify(params)
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
 * Run all tests in parallel and collect results
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

  console.log(`Invoking ${functionIds.size} test functions...`);

  // Invoke all functions in parallel
  const invocationPromises = Array.from(functionIds.entries()).map(
    async ([testId, functionId]) => {
      try {
        const invocationId = await invokeFunction(
          functionId,
          { previewUrl },
          apiKey
        );
        return { testId, functionId, invocationId, error: null };
      } catch (error) {
        return { testId, functionId, invocationId: null, error: String(error) };
      }
    }
  );

  const invocations = await Promise.all(invocationPromises);

  // Log any invocation failures
  for (const inv of invocations) {
    if (inv.error) {
      console.error(`Failed to invoke test ${inv.testId}: ${inv.error}`);
    } else {
      console.log(`Invoked test ${inv.testId}: ${inv.invocationId}`);
    }
  }

  // Wait for all invocations to complete
  console.log('Waiting for test completion...');

  const resultPromises = invocations.map(async (inv): Promise<TestResult> => {
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

      if (status.status === 'FAILED' || !status.results) {
        return {
          testId: inv.testId,
          success: false,
          error: 'Function execution failed',
          duration,
          sessionId: status.sessionId || '',
          sessionUrl: `https://www.browserbase.com/sessions/${status.sessionId || ''}`
        };
      }

      return {
        testId: inv.testId,
        success: status.results.success,
        error: status.results.error,
        duration,
        sessionId: status.results.sessionId || status.sessionId,
        sessionUrl: status.results.sessionUrl || `https://www.browserbase.com/sessions/${status.sessionId}`,
        finalScreenshot: status.results.finalScreenshot
      };
    } catch (error) {
      return {
        testId: inv.testId,
        success: false,
        error: String(error),
        duration: Date.now() - startTime,
        sessionId: '',
        sessionUrl: ''
      };
    }
  });

  const results = await Promise.all(resultPromises);

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
