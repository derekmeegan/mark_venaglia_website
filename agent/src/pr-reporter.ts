/**
 * PR Reporter - Format and post test results as GitHub PR comment
 */

import { Octokit } from '@octokit/rest';
import type { TestResult, AnalysisResult, ReportData } from './types.js';

const COMMENT_MARKER = '<!-- pr-test-agent-report -->';

/**
 * Interpret error messages and provide actionable feedback
 */
function interpretError(error: string): { summary: string; explanation: string; suggestion: string } {
  // 401 errors - authentication/protection issues
  if (error.includes('401') || error.includes('Unauthorized')) {
    if (error.includes('manifest.webmanifest') || error.includes('favicon') || error.includes('.png') || error.includes('.jpg')) {
      return {
        summary: '🔒 Vercel Deployment Protection blocking static assets',
        explanation: 'The preview deployment has protection enabled, and static resources (images, manifest, favicon) are returning 401 Unauthorized errors.',
        suggestion: 'Ensure VERCEL_BYPASS_SECRET is correctly set in GitHub secrets and matches your Vercel project settings. The bypass needs to be applied to all requests, not just page navigations.'
      };
    }
    return {
      summary: '🔒 Authentication required',
      explanation: 'The preview deployment requires authentication to access.',
      suggestion: 'Check that VERCEL_BYPASS_SECRET is configured correctly in both Vercel and GitHub secrets.'
    };
  }

  // Console errors
  if (error.includes('Console errors found')) {
    const errorCount = (error.match(/Failed to load resource/g) || []).length;
    return {
      summary: `🔴 ${errorCount} console error(s) detected`,
      explanation: 'The page is generating JavaScript console errors during load, which may indicate broken resources or runtime errors.',
      suggestion: 'Check the browser console in the Browserbase session replay to see the full error details.'
    };
  }

  // Timeout errors
  if (error.includes('timeout') || error.includes('Timeout')) {
    return {
      summary: '⏱️ Test timeout',
      explanation: 'The test timed out waiting for a page or element to load.',
      suggestion: 'Check if the page is loading slowly or if there are network issues. Consider increasing timeout values or optimizing page performance.'
    };
  }

  // Element not found
  if (error.includes('not found') || error.includes('No element') || error.includes('selector')) {
    return {
      summary: '🔍 Element not found',
      explanation: 'The test could not find an expected element on the page.',
      suggestion: 'The page structure may have changed. Check if the selectors in the test match the current HTML structure.'
    };
  }

  // Navigation errors
  if (error.includes('net::ERR') || error.includes('navigation')) {
    return {
      summary: '🌐 Navigation error',
      explanation: 'The browser failed to navigate to the page.',
      suggestion: 'Check if the URL is correct and the deployment is accessible.'
    };
  }

  // Performance issues
  if (error.includes('Performance') || error.includes('load too slow') || error.includes('LCP') || error.includes('CLS')) {
    return {
      summary: '🐢 Performance issue',
      explanation: 'The page did not meet performance thresholds (load time, LCP, CLS).',
      suggestion: 'Review the Core Web Vitals in the test output and optimize slow-loading resources.'
    };
  }

  // Accessibility issues
  if (error.includes('Accessibility') || error.includes('a11y') || error.includes('alt text') || error.includes('ARIA')) {
    return {
      summary: '♿ Accessibility issue',
      explanation: 'The page has accessibility problems that may affect users with disabilities.',
      suggestion: 'Review the accessibility findings and ensure proper alt text, ARIA labels, and heading structure.'
    };
  }

  // Default interpretation
  return {
    summary: '❌ Test failed',
    explanation: error.slice(0, 200) + (error.length > 200 ? '...' : ''),
    suggestion: 'Review the full error in the Browserbase session replay for more context.'
  };
}

/**
 * Format test results as a markdown report
 */
function formatReport(data: ReportData): string {
  const { results, analysis, previewUrl, duration } = data;

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const total = results.length;

  const statusEmoji = failed > 0 ? '❌' : '✅';
  const statusText = failed > 0 ? 'Some tests failed' : 'All tests passed';

  let report = `${COMMENT_MARKER}
## ${statusEmoji} PR Test Agent Report

**Status:** ${statusText}
**Preview URL:** ${previewUrl}
**Duration:** ${(duration / 1000).toFixed(1)}s

### Summary
| Passed | Failed | Total |
|--------|--------|-------|
| ✅ ${passed} | ❌ ${failed} | ${total} |

### Changed Flows Detected
${analysis.changedFlows.length > 0 ? analysis.changedFlows.map((f) => `- ${f}`).join('\n') : '_No flow changes detected_'}

### Test Results

| Test | Status | Duration | Session |
|------|--------|----------|---------|
${results.map((r) => `| ${r.testId} | ${r.success ? '✅' : '❌'} | ${r.duration}ms | [View](${r.sessionUrl}) |`).join('\n')}
`;

  // Add failure details with interpreted errors
  const failures = results.filter((r) => !r.success);
  if (failures.length > 0) {
    // Group failures by error type for summary
    const errorGroups = new Map<string, typeof failures>();
    failures.forEach((f) => {
      const interpreted = interpretError(f.error || 'Unknown error');
      const key = interpreted.summary;
      if (!errorGroups.has(key)) {
        errorGroups.set(key, []);
      }
      errorGroups.get(key)!.push(f);
    });

    report += `
### Failure Summary

`;
    // Show grouped error summary
    for (const [errorType, failedTests] of errorGroups) {
      const interpreted = interpretError(failedTests[0].error || '');
      report += `
#### ${errorType} (${failedTests.length} test${failedTests.length > 1 ? 's' : ''})

> **What happened:** ${interpreted.explanation}
>
> **Suggested fix:** ${interpreted.suggestion}

Affected tests: ${failedTests.map(t => `\`${t.testId}\``).join(', ')}

`;
    }

    report += `
### Failure Details

${failures.map((r) => {
  const interpreted = interpretError(r.error || 'Unknown error');
  return `
<details>
<summary>${interpreted.summary} - <strong>${r.testId}</strong></summary>

**Test:** ${r.testId}

**Issue:** ${interpreted.explanation}

**Raw Error:**
\`\`\`
${r.error || 'Unknown error'}
\`\`\`

**🎬 Session Replay:** [View in Browserbase](${r.sessionUrl})

</details>
`;
}).join('\n')}
`;
  }

  // Add visual regression section
  const withScreenshots = results.filter((r) => r.finalScreenshot);
  if (withScreenshots.length > 0) {
    report += `
### Visual Regression Screenshots

<details>
<summary>📸 View ${withScreenshots.length} screenshots</summary>

${withScreenshots.map((r) => `
#### ${r.success ? '✅' : '❌'} ${r.testId}

<img src="data:image/png;base64,${r.finalScreenshot}" width="600" />

`).join('\n')}

</details>
`;
  }

  // Add analysis summary
  if (analysis.summary) {
    report += `
### Analysis Summary

${analysis.summary}
`;
  }

  // Add new tests info
  if (analysis.testsToAdd.length > 0) {
    report += `
### New Tests Added

${analysis.testsToAdd.map((t) => `- **${t.id}**: ${t.description}`).join('\n')}
`;
  }

  // Add modified tests info
  if (analysis.testsToModify.length > 0) {
    report += `
### Tests Modified

${analysis.testsToModify.map((m) => `- **${m.testId}**: ${m.reason}`).join('\n')}
`;
  }

  report += `
---
*Generated by [PR Test Agent](https://github.com/your-org/pr-test-agent) using Claude + Browserbase*
`;

  return report;
}

/**
 * Post or update the test report comment on a PR
 */
export async function reportResults(
  results: TestResult[],
  analysis: AnalysisResult,
  previewUrl: string,
  duration: number
): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const prNumber = parseInt(process.env.PR_NUMBER || '0', 10);
  const [owner, repo] = (process.env.GITHUB_REPOSITORY || '/').split('/');

  if (!token) {
    console.warn('GITHUB_TOKEN not set, skipping PR comment');
    console.log('\n--- Test Report ---\n');
    console.log(formatReport({ results, analysis, previewUrl, duration }));
    return;
  }

  if (!prNumber || !owner || !repo) {
    console.warn('PR context not available, skipping PR comment');
    console.log('\n--- Test Report ---\n');
    console.log(formatReport({ results, analysis, previewUrl, duration }));
    return;
  }

  const octokit = new Octokit({ auth: token });
  const body = formatReport({ results, analysis, previewUrl, duration });

  try {
    // Find existing comment
    const { data: comments } = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
      per_page: 100
    });

    const existingComment = comments.find((c) =>
      c.body?.includes(COMMENT_MARKER)
    );

    if (existingComment) {
      // Update existing comment
      await octokit.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body
      });
      console.log(`Updated PR comment: ${existingComment.html_url}`);
    } else {
      // Create new comment
      const { data: newComment } = await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body
      });
      console.log(`Created PR comment: ${newComment.html_url}`);
    }
  } catch (error) {
    console.error('Failed to post PR comment:', error);
    // Still output the report to console
    console.log('\n--- Test Report ---\n');
    console.log(body);
  }
}

/**
 * Post a simple status comment (for errors or early exits)
 */
export async function reportError(
  errorMessage: string,
  previewUrl?: string
): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const prNumber = parseInt(process.env.PR_NUMBER || '0', 10);
  const [owner, repo] = (process.env.GITHUB_REPOSITORY || '/').split('/');

  const body = `${COMMENT_MARKER}
## ❌ PR Test Agent Error

An error occurred while running tests:

\`\`\`
${errorMessage}
\`\`\`

${previewUrl ? `**Preview URL:** ${previewUrl}` : ''}

---
*Generated by [PR Test Agent](https://github.com/your-org/pr-test-agent)*
`;

  if (!token || !prNumber || !owner || !repo) {
    console.error('Cannot post error to PR:', errorMessage);
    return;
  }

  const octokit = new Octokit({ auth: token });

  try {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body
    });
  } catch (error) {
    console.error('Failed to post error comment:', error);
  }
}
