/**
 * Shared types for the PR Test Agent
 */

// Test manifest structure
export interface TestManifest {
  version: number;
  appDescription?: string;
  flows: Record<string, FlowDefinition>;
}

export interface FlowDefinition {
  description: string;
  testFile?: string;
  coveredPaths?: string[];
  coveredElements?: string[];
  baselineDir?: string;
}

// Test definitions
export interface TestDefinition {
  id: string;
  name: string;
  description: string;
  code: string;
  flow: string;
  viewport?: Viewport;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface TestModification {
  testId: string;
  reason: string;
  original: TestDefinition;
  updated: TestDefinition;
}

// Analysis results from Claude
export interface AnalysisResult {
  changedFlows: string[];
  testsToAdd: TestDefinition[];
  testsToModify: TestModification[];
  testsToRun: string[];
  summary: string;
}

// Test execution results
export interface TestResult {
  testId: string;
  success: boolean;
  error?: string;
  duration: number;
  sessionId: string;
  sessionUrl: string;
  finalScreenshot?: string;
}

// Browserbase deployment
export interface DeploymentResult {
  buildId: string;
  functionIds: Map<string, string>; // testId -> functionId
}

export interface BrowserbaseFunctionInfo {
  id: string;
  name: string;
  status: string;
}

// Vercel deployment
export interface VercelDeployment {
  id: string;
  url: string;
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  meta?: {
    githubCommitSha?: string;
    githubCommitRef?: string;
  };
}

// Environment configuration
export interface Config {
  anthropicApiKey: string;
  browserbaseApiKey: string;
  browserbaseProjectId: string;
  vercelToken: string;
  vercelProjectId?: string;
  githubToken: string;
  prNumber: number;
  commitSha: string;
  repoOwner: string;
  repoName: string;
}

// PR Reporter types
export interface ReportData {
  results: TestResult[];
  analysis: AnalysisResult;
  previewUrl: string;
  duration: number;
}
