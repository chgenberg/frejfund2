/**
 * GitHub Organization Analyzer
 * Analyzes public GitHub repos for technical execution signals
 * Server-side only
 */

// Ensure this only runs on server
if (typeof window !== 'undefined') {
  throw new Error('github-analyzer must only be used server-side');
}

export interface GitHubOrgData {
  orgName: string;
  publicRepos: number;
  totalStars: number;
  totalForks: number;

  // Team metrics
  contributors: number;
  activeContributors: number; // Active in last 3 months

  // Activity metrics
  commitActivity: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };

  // Tech stack
  languages: Array<{
    name: string;
    percentage: number;
  }>;

  // Code quality signals
  hasTests: boolean;
  hasCI: boolean;
  hasDocs: boolean;
  avgIssueResolutionTime?: number; // in days
  openIssues: number;
  closedIssues: number;

  // Recent activity
  recentCommits: Array<{
    message: string;
    date: string;
    author: string;
  }>;

  recentReleases: Array<{
    name: string;
    date: string;
    description?: string;
  }>;

  // Development velocity
  developmentVelocity: 'high' | 'medium' | 'low';
  codeQuality: 'excellent' | 'good' | 'average' | 'poor';

  // Metadata
  scrapedAt: Date;
}

/**
 * Analyze GitHub organization using GitHub API
 * Free tier: 60 requests/hour (unauthenticated), 5000/hour (authenticated)
 */
export async function analyzeGitHubOrg(orgNameOrUrl: string): Promise<GitHubOrgData | null> {
  try {
    // Extract org name from URL if needed
    const orgName = orgNameOrUrl.includes('github.com')
      ? orgNameOrUrl.split('github.com/')[1]?.split('/')[0]
      : orgNameOrUrl;

    if (!orgName) {
      console.error('Invalid GitHub org name or URL');
      return null;
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'FrejFund-Analyzer',
    };

    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    // Fetch organization data
    const orgResponse = await fetch(`https://api.github.com/orgs/${orgName}`, { headers });

    if (!orgResponse.ok) {
      // Try as user instead of org
      const userResponse = await fetch(`https://api.github.com/users/${orgName}`, { headers });
      if (!userResponse.ok) {
        console.error('GitHub org/user not found:', orgName);
        return null;
      }
    }

    const orgData = await orgResponse.json();

    // Fetch repositories
    const reposResponse = await fetch(
      `https://api.github.com/orgs/${orgName}/repos?sort=updated&per_page=100`,
      { headers },
    );

    if (!reposResponse.ok) {
      console.error('Failed to fetch repos');
      return null;
    }

    const repos = await reposResponse.json();

    // Analyze repositories
    const repoAnalysis = await Promise.all(
      repos.slice(0, 10).map((repo: any) => analyzeRepository(repo.full_name, headers)),
    );

    // Aggregate languages
    const languageMap: Record<string, number> = {};
    let totalLanguageBytes = 0;

    for (const repo of repos) {
      if (repo.language) {
        languageMap[repo.language] = (languageMap[repo.language] || 0) + (repo.size || 0);
        totalLanguageBytes += repo.size || 0;
      }
    }

    const languages = Object.entries(languageMap)
      .map(([name, bytes]) => ({
        name,
        percentage: Math.round((bytes / totalLanguageBytes) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Calculate metrics
    const totalStars = repos.reduce(
      (sum: number, repo: any) => sum + (repo.stargazers_count || 0),
      0,
    );
    const totalForks = repos.reduce((sum: number, repo: any) => sum + (repo.forks_count || 0), 0);
    const openIssues = repos.reduce(
      (sum: number, repo: any) => sum + (repo.open_issues_count || 0),
      0,
    );

    // Aggregate commit activity
    const totalCommits7d = repoAnalysis.reduce((sum, r) => sum + (r?.commits7d || 0), 0);
    const totalCommits30d = repoAnalysis.reduce((sum, r) => sum + (r?.commits30d || 0), 0);

    // Determine velocity
    let developmentVelocity: 'high' | 'medium' | 'low' = 'low';
    if (totalCommits7d > 20) developmentVelocity = 'high';
    else if (totalCommits7d > 5) developmentVelocity = 'medium';

    // Determine code quality
    const hasTests = repoAnalysis.some((r) => r?.hasTests);
    const hasCI = repoAnalysis.some((r) => r?.hasCI);
    const hasDocs = repoAnalysis.some((r) => r?.hasDocs);

    let codeQuality: 'excellent' | 'good' | 'average' | 'poor' = 'average';
    const qualityScore = (hasTests ? 1 : 0) + (hasCI ? 1 : 0) + (hasDocs ? 1 : 0);
    if (qualityScore === 3) codeQuality = 'excellent';
    else if (qualityScore === 2) codeQuality = 'good';
    else if (qualityScore === 0) codeQuality = 'poor';

    // Get recent commits from main repo
    const mainRepo = repos[0];
    const recentCommits = await getRecentCommits(mainRepo.full_name, headers);
    const recentReleases = await getRecentReleases(mainRepo.full_name, headers);

    return {
      orgName,
      publicRepos: repos.length,
      totalStars,
      totalForks,
      contributors: 0, // Would need to aggregate from all repos
      activeContributors: 0, // Would need detailed analysis
      commitActivity: {
        last7Days: totalCommits7d,
        last30Days: totalCommits30d,
        last90Days: totalCommits30d * 3, // Estimate
      },
      languages,
      hasTests,
      hasCI,
      hasDocs,
      openIssues,
      closedIssues: 0, // Would need GraphQL API
      recentCommits,
      recentReleases,
      developmentVelocity,
      codeQuality,
      scrapedAt: new Date(),
    };
  } catch (error) {
    console.error('GitHub analysis error:', error);
    return null;
  }
}

/**
 * Analyze individual repository
 */
async function analyzeRepository(
  repoFullName: string,
  headers: HeadersInit,
): Promise<{
  commits7d: number;
  commits30d: number;
  hasTests: boolean;
  hasCI: boolean;
  hasDocs: boolean;
} | null> {
  try {
    // Check for test files
    const contentsResponse = await fetch(`https://api.github.com/repos/${repoFullName}/contents`, {
      headers,
    });

    let hasTests = false;
    let hasCI = false;
    let hasDocs = false;

    if (contentsResponse.ok) {
      const contents = await contentsResponse.json();
      hasTests = contents.some(
        (file: any) =>
          file.name === 'test' ||
          file.name === 'tests' ||
          file.name === '__tests__' ||
          file.name.includes('test'),
      );
      hasCI = contents.some(
        (file: any) =>
          file.name === '.github' || file.name === '.gitlab-ci.yml' || file.name === '.circleci',
      );
      hasDocs = contents.some((file: any) => file.name === 'docs' || file.name === 'README.md');
    }

    // Get commit activity (last 30 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const commits7dResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/commits?since=${weekAgo}&per_page=100`,
      { headers },
    );

    const commits30dResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/commits?since=${monthAgo}&per_page=100`,
      { headers },
    );

    const commits7d = commits7dResponse.ok ? (await commits7dResponse.json()).length : 0;
    const commits30d = commits30dResponse.ok ? (await commits30dResponse.json()).length : 0;

    return {
      commits7d,
      commits30d,
      hasTests,
      hasCI,
      hasDocs,
    };
  } catch (error) {
    console.error('Repository analysis error:', error);
    return null;
  }
}

/**
 * Get recent commits from a repository
 */
async function getRecentCommits(
  repoFullName: string,
  headers: HeadersInit,
): Promise<Array<{ message: string; date: string; author: string }>> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/commits?per_page=10`,
      { headers },
    );

    if (!response.ok) return [];

    const commits = await response.json();
    return commits.map((commit: any) => ({
      message: commit.commit.message.split('\n')[0], // First line only
      date: commit.commit.author.date,
      author: commit.commit.author.name,
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Get recent releases
 */
async function getRecentReleases(
  repoFullName: string,
  headers: HeadersInit,
): Promise<Array<{ name: string; date: string; description?: string }>> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/releases?per_page=5`,
      { headers },
    );

    if (!response.ok) return [];

    const releases = await response.json();
    return releases.map((release: any) => ({
      name: release.name || release.tag_name,
      date: release.published_at,
      description: release.body?.substring(0, 200),
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Get tech stack summary from GitHub org
 */
export async function getGitHubTechStack(orgName: string): Promise<string[]> {
  const data = await analyzeGitHubOrg(orgName);
  if (!data) return [];

  return data.languages.map((lang) => lang.name);
}

/**
 * Check if GitHub shows signs of active development
 */
export async function isActivelyDeveloping(orgName: string): Promise<boolean> {
  const data = await analyzeGitHubOrg(orgName);
  if (!data) return false;

  return data.commitActivity.last7Days > 0;
}
