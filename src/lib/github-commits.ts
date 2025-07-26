import { Octokit } from "octokit";
import { db } from "@/server/db";
import { aiSummariseCommit } from "./gemini";

interface CommitInfo {
    commitHash: string;
    commitMessage: string;
    commitAuthorName: string;
    commitAuthorAvatar: string;
    commitDate: string;
}

interface CommitWithDiff extends CommitInfo {
    diff?: string;
}

// Get commits without requiring GitHub tokens for public repos
export const getCommitsOptional = async (
    githubUrl: string, 
    githubToken?: string
): Promise<CommitInfo[]> => {
    const [owner, repo] = githubUrl.split("/").slice(3, 5);
    
    if (!owner || !repo) {
        throw new Error("Invalid github url");
    }
    
    if (githubToken) {
        // Use GitHub API with token for full commit details
        return await getCommitsWithToken(owner, repo, githubToken);
    } else {
        // Use alternative approach for public repos without token
        return await getCommitsWithoutToken(owner, repo);
    }
};

// Full-featured commit fetching with GitHub token
const getCommitsWithToken = async (
    owner: string, 
    repo: string, 
    githubToken: string
): Promise<CommitInfo[]> => {
    try {
        const client = new Octokit({ auth: githubToken });
        
        // Check rate limit
        const { data: rateLimit } = await client.rest.rateLimit.get();
        if (rateLimit.resources.core.remaining < 10) {
            console.log(`Rate limit low (${rateLimit.resources.core.remaining}), waiting...`);
            const resetTime = rateLimit.resources.core.reset * 1000;
            const waitTime = resetTime - Date.now();
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
            }
        }
        
        const { data } = await client.rest.repos.listCommits({
            owner,
            repo,
            per_page: 10, // Get more commits with token
            page: 1
        });
        
        return data.map((commit: any) => ({
            commitHash: commit.sha,
            commitMessage: commit.commit.message ?? "",
            commitAuthorName: commit.commit?.author?.name ?? commit.author?.login ?? "",
            commitAuthorAvatar: commit.author?.avatar_url ?? "",
            commitDate: commit.commit?.author?.date ?? "",
        }));
    } catch (error: any) {
        console.error("Error fetching commits with token:", error.message);
        
        // Fallback to no-token approach if API fails
        console.log("Falling back to no-token approach");
        return await getCommitsWithoutToken(owner, repo);
    }
};

// Lightweight commit fetching without GitHub token
const getCommitsWithoutToken = async (
    owner: string, 
    repo: string
): Promise<CommitInfo[]> => {
    try {
        // Use GitHub's public commits API (limited but doesn't require auth)
        const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`;
        
        const response = await fetch(commitsUrl);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Repository not found or private");
            }
            if (response.status === 403) {
                console.log("GitHub API rate limited, returning minimal commit info");
                return await getMinimalCommitInfo(owner, repo);
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const commits = await response.json();
        
        return commits.map((commit: any) => ({
            commitHash: commit.sha,
            commitMessage: commit.commit.message ?? "",
            commitAuthorName: commit.commit?.author?.name ?? commit.author?.login ?? "",
            commitAuthorAvatar: commit.author?.avatar_url ?? (`https://github.com/${commit.author?.login}.png` || ""),
            commitDate: commit.commit?.author?.date ?? "",
        }));
    } catch (error) {
        console.error("Error fetching commits without token:", error);
        
        // Final fallback: return minimal info
        return await getMinimalCommitInfo(owner, repo);
    }
};

// Minimal fallback when all API calls fail
const getMinimalCommitInfo = async (
    owner: string, 
    repo: string
): Promise<CommitInfo[]> => {
    const now = new Date().toISOString();
    
    return [{
        commitHash: "latest",
        commitMessage: "Latest repository state",
        commitAuthorName: owner,
        commitAuthorAvatar: `https://github.com/${owner}.png`,
        commitDate: now,
    }];
};

// Enhanced commit diff fetching with fallbacks
export const getCommitDiff = async (
    githubUrl: string,
    commitHash: string,
    githubToken?: string
): Promise<string> => {
    const [owner, repo] = githubUrl.split("/").slice(3, 5);
    
    if (!owner || !repo) {
        throw new Error("Invalid github url");
    }
    
    if (githubToken) {
        // Use GitHub API for detailed diff
        return await getCommitDiffWithToken(owner, repo, commitHash, githubToken);
    } else {
        // Generate summary without detailed diff
        return await getCommitSummaryWithoutDiff(githubUrl, commitHash);
    }
};

const getCommitDiffWithToken = async (
    owner: string,
    repo: string, 
    commitHash: string,
    githubToken: string
): Promise<string> => {
    try {
        const client = new Octokit({ auth: githubToken });
        
        const { data } = await client.rest.repos.getCommit({
            owner,
            repo,
            ref: commitHash,
        });
        
        return data.files?.map(file => 
            `diff --git a/${file.filename} b/${file.filename}\n${file.patch || ''}`
        ).join('\n\n') || 'No diff available';
    } catch (error) {
        console.error("Error fetching commit diff:", error);
        return "Unable to fetch detailed diff";
    }
};

const getCommitSummaryWithoutDiff = async (
    githubUrl: string,
    commitHash: string
): Promise<string> => {
    // For repos without tokens, return a basic summary
    return `Changes in commit ${commitHash.slice(0, 7)} from ${githubUrl}`;
};

// Filter unprocessed commits (same as before but with new types)
const filterUnprocessedCommits = async (
    projectId: string,
    commits: CommitInfo[]
): Promise<CommitInfo[]> => {
    const existingCommits = await db.commit.findMany({
        where: { projectId },
        select: { commitHash: true }
    });
    
    const existingHashes = new Set(existingCommits.map(c => c.commitHash));
    
    return commits.filter(commit => !existingHashes.has(commit.commitHash));
};

// Enhanced pollRepo function that works with or without tokens
export const pollRepoOptional = async (
    projectId: string,
    githubToken?: string
): Promise<any[]> => {
    try {
        const project = await db.project.findUnique({
            where: { id: projectId }
        });
        
        if (!project?.githubUrl) {
            throw new Error("Project not found or missing GitHub URL");
        }
        
        console.log(`Starting repository polling for ${project.githubUrl}...`);
        console.log(githubToken ? "Using GitHub token" : "Using token-free approach");
        
        const commits = await getCommitsOptional(project.githubUrl, githubToken);
        console.log(`Found ${commits.length} commits`);
        
        // Get only unprocessed commits
        const unprocessedCommits = await filterUnprocessedCommits(projectId, commits);
        console.log(`Processing ${unprocessedCommits.length} new commits`);
        
        if (unprocessedCommits.length === 0) {
            console.log("No new commits to process");
            return [];
        }
        
        // Process commits one at a time with delay
        const results = [];
        for (const commit of unprocessedCommits) {
            try {
                console.log(`Processing commit: ${commit.commitHash.slice(0, 7)}`);
                
                // Get diff and summarize
                const diff = await getCommitDiff(project.githubUrl, commit.commitHash, githubToken);
                const summary = await aiSummariseCommit(diff);
                
                // Save to database
                const savedCommit = await db.commit.create({
                    data: {
                        projectId,
                        commitHash: commit.commitHash,
                        commitMessage: commit.commitMessage,
                        commitAuthorName: commit.commitAuthorName,
                        commitAuthorAvatar: commit.commitAuthorAvatar,
                        commitDate: new Date(commit.commitDate),
                        summary: summary || commit.commitMessage,
                    }
                });
                
                results.push(savedCommit);
                
                // Add delay between commits to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error processing commit ${commit.commitHash}:`, error);
                
                // Save commit without summary if processing fails
                const savedCommit = await db.commit.create({
                    data: {
                        projectId,
                        commitHash: commit.commitHash,
                        commitMessage: commit.commitMessage,
                        commitAuthorName: commit.commitAuthorName,
                        commitAuthorAvatar: commit.commitAuthorAvatar,
                        commitDate: new Date(commit.commitDate),
                        summary: commit.commitMessage, // Fallback to commit message
                    }
                });
                
                results.push(savedCommit);
            }
        }
        
        console.log(`Successfully processed ${results.length} commits`);
        return results;
        
    } catch (error: any) {
        console.error("Error in pollRepoOptional:", error.message);
        throw error;
    }
}; 