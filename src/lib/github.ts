import { db } from "@/server/db";
import axios from "axios";
import { Octokit } from "octokit";
import { aiSummariseCommit } from "./gemini";

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});
// id                 String   @id @default(cuid())
// commitMessage      String
// commitHash         String
// commitAuthorName   String
// commitAuthorAvatar String
// commitDate         DateTime
// summary            String

type response = {
    commitHash: string;
    commitMessage: string;
    commitAuthorName: string;
    commitAuthorAvatar: string;
    commitDate: string;
};

export const getCommitHashes = async (
    githubUrl: string,
    githubToken?: string // Add token parameter
): Promise<response[]> => {
    const [owner, repo] = githubUrl.split("/").slice(3, 5);
    console.log("owner", owner, "repo", repo);
    
    if (!owner || !repo) {
        throw new Error("Invalid github url")
    }

    try {
        // Use provided token or fallback to env token
        const client = new Octokit({
            auth: githubToken || process.env.GITHUB_TOKEN,
        });

        // Check rate limit before making request
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
            per_page: 5,
            page: 1
        });

        return data.map((commit: any) => ({
            commitHash: commit.sha as string,
            commitMessage: commit.commit.message ?? "",
            commitAuthorName: commit.commit?.author?.name ?? "",
            commitAuthorAvatar: commit.author?.avatar_url ?? "",
            commitDate: commit.commit?.author?.date ?? "",
        }));
    } catch (error: any) {
        if (error.status === 403 && error.message.includes('rate limit')) {
            console.log('Rate limit hit, waiting 60s before retry...');
            await new Promise(resolve => setTimeout(resolve, 60000));
            return getCommitHashes(githubUrl, githubToken);
        }
        throw error;
    }
};

export const pollRepo = async (projectId: string, githubToken?: string) => {
    try {
        const { project, githubUrl } = await fetchProjectGitHubUrl(projectId);
        
        console.log("Starting repository polling...");
        const commitHashes = await getCommitHashes(project?.githubUrl ?? "", githubToken);
        console.log(`Found ${commitHashes.length} commits`);
        
        // Get only unprocessed commits
        const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes);
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
                const summary = await summariseCommit(githubUrl, commit.commitHash, githubToken);
                
                const savedCommit = await db.commit.create({
                    data: {
                        projectId,
                        commitHash: commit.commitHash,
                        summary: summary || commit.commitMessage,
                        commitAuthorName: commit.commitAuthorName,
                        commitDate: commit.commitDate,
                        commitMessage: commit.commitMessage,
                        commitAuthorAvatar: commit.commitAuthorAvatar,
                    }
                });
                results.push(savedCommit);
                
                // Add longer delay between commits (5 seconds)
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                console.error(`Failed to process commit ${commit.commitHash.slice(0, 7)}:`, error);
                continue; // Skip failed commit and continue with others
            }
        }

        return results;
    } catch (error) {
        console.error('Error in pollRepo:', error);
        throw error;
    }
};

async function fetchProjectGitHubUrl(projectId: string) {
    const project = await db.project.findUnique({
        where: {
            id: projectId
        }, select: {
            githubUrl: true
        }
    });
    const githubUrl = project?.githubUrl ?? "";
    return { project, githubUrl };
}

async function summariseCommit(githubUrl: string, commitHash: string, githubToken?: string) {
    try {
        console.log("summarising commit", githubUrl, commitHash);
        
        githubUrl = githubUrl.replace('.git', '');
        const [owner, repo] = githubUrl.split("/").slice(3, 5);
        
        if (!owner || !repo) {
            throw new Error(`Invalid GitHub URL: ${githubUrl}`);
        }

        // Use the GitHub API endpoint for commit comparison with proper auth
        const { data } = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/commits/${commitHash}`,
            {
                headers: {
                    Accept: "application/vnd.github.v3+json",
                    Authorization: `Bearer ${githubToken || process.env.GITHUB_TOKEN}`,
                }
            }
        );
        
        // Extract the diff from the files array
        const diffs = data.files?.map((file: any) => 
            `diff --git a/${file.filename} b/${file.filename}\n${file.patch || ''}`
        ).join('\n') || '';

        console.log('Successfully fetched diff for commit:', commitHash.slice(0, 7));
        return await aiSummariseCommit(diffs) || "";
    } catch (error: any) {
        if (error.response?.status === 403) {
            console.error('Rate limit or authentication error:', error.response.data.message);
            return "";
        }
        console.error('Error fetching commit diff:', error);
        return "";
    }
}
async function filterUnprocessedCommits(projectId: string, commitHases: response[]) {
    const processedCommits = await db.commit.findMany({
        where: {
            projectId: projectId,
        },
    });
    const unprocessedCommits = commitHases.filter(
        (hash) => !processedCommits.some((commit) => commit.commitHash === hash.commitHash)
    );
    return unprocessedCommits;
}


// const githubUrl = "https://github.com/elliott-chong/normalhuman"
// const commitHases = await getCommitHashes(githubUrl);
// const summaries = await Promise.allSettled(
//     commitHases.map((hash) => summariseCommit(githubUrl, hash.commitHash))
// )
// console.log(summaries)