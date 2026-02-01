/**
 * Vercel Integration - Wait for preview deployment to be ready
 */

import type { VercelDeployment } from './types.js';

const VERCEL_API = 'https://api.vercel.com';
const MAX_WAIT_TIME = 10 * 60 * 1000; // 10 minutes
const POLL_INTERVAL = 5000; // 5 seconds

export async function waitForVercelDeployment(): Promise<string> {
  const token = process.env.VERCEL_TOKEN;
  const commitSha = process.env.GITHUB_SHA;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token) {
    throw new Error('VERCEL_TOKEN environment variable is required');
  }
  if (!commitSha) {
    throw new Error('GITHUB_SHA environment variable is required');
  }

  console.log(`Waiting for Vercel deployment for commit: ${commitSha.slice(0, 7)}`);

  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_TIME) {
    const deployment = await findDeployment(token, commitSha, projectId);

    if (deployment) {
      if (deployment.readyState === 'READY') {
        const url = `https://${deployment.url}`;
        console.log(`Deployment ready: ${url}`);
        return url;
      }

      if (deployment.readyState === 'ERROR' || deployment.readyState === 'CANCELED') {
        throw new Error(`Deployment failed with state: ${deployment.readyState}`);
      }

      console.log(`Deployment state: ${deployment.readyState}, waiting...`);
    } else {
      console.log('No deployment found yet, waiting...');
    }

    await sleep(POLL_INTERVAL);
  }

  throw new Error(`Timeout waiting for Vercel deployment after ${MAX_WAIT_TIME / 1000}s`);
}

async function findDeployment(
  token: string,
  commitSha: string,
  projectId?: string
): Promise<VercelDeployment | null> {
  const params = new URLSearchParams({
    target: 'preview',
    limit: '10',
  });

  if (projectId) {
    params.set('projectId', projectId);
  }

  const response = await fetch(`${VERCEL_API}/v6/deployments?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as { deployments: VercelDeployment[] };

  // Find deployment matching our commit SHA
  const deployment = data.deployments.find(
    (d) => d.meta?.githubCommitSha === commitSha
  );

  return deployment || null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Allow running as standalone script for GitHub Action output
if (process.argv[1]?.endsWith('vercel-integration.js')) {
  waitForVercelDeployment()
    .then(async (url) => {
      // Output for GitHub Actions
      console.log(`::set-output name=preview_url::${url}`);
      // Also write to GITHUB_OUTPUT if available
      if (process.env.GITHUB_OUTPUT) {
        const fs = await import('fs');
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `preview_url=${url}\n`);
      }
    })
    .catch((err) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
