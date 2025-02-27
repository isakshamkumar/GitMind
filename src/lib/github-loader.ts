import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import pLimit from 'p-limit'
import { getEmbeddings } from "./gemini";
import { getSummary } from "./openai";
import { db } from "@/server/db";
import { Octokit } from "octokit";
const getFileCount = async (path: string, octokit: Octokit, githubOwner: string, githubRepo: string, acc: number = 0) => {
    try {
        // Add delay between requests to respect rate limits
        const { data, headers } = await octokit.rest.repos.getContent({
            owner: githubOwner,
            repo: githubRepo,
            path: path
        });

        // Check remaining rate limit
        const remaining = parseInt(headers['x-ratelimit-remaining'] || '0');
        if (remaining < 10) {
            const resetTime = parseInt(headers['x-ratelimit-reset'] || '0') * 1000;
            const waitTime = resetTime - Date.now();
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        if (!Array.isArray(data) && data.type === 'file') {
            return acc + 1;
        }

        if (Array.isArray(data)) {
            let fileCount = 0;
            // Process in smaller batches to avoid rate limits
            const directories = data.filter(item => item.type === 'dir').map(item => item.path);
            const files = data.filter(item => item.type === 'file').length;

            fileCount += files;

            // Process directories in smaller batches
            const batchSize = 5;
            for (let i = 0; i < directories.length; i += batchSize) {
                const batch = directories.slice(i, i + batchSize);
                const counts = await Promise.all(
                    batch.map(dirPath => getFileCount(dirPath, octokit, githubOwner, githubRepo, 0))
                );
                fileCount += counts.reduce((sum, count) => sum + count, 0);
                
                // Add delay between batches
                if (i + batchSize < directories.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            return acc + fileCount;
        }

        return acc;
    } catch (error: any) {
        if (error.status === 403 && error.message.includes('rate limit')) {
            console.log('Rate limit hit, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
            return getFileCount(path, octokit, githubOwner, githubRepo, acc);
        }
        throw error;
    }
}

export const checkCredits = async (githubUrl: string, githubToken?: string) => {
    console.log("checking credits for", githubToken);
    if (!githubToken){
        console.log("no token")
        return 0
        
    }
    const octokit = new Octokit({
        auth: githubToken
    });
    console.log("checking credits for", githubUrl);
    githubUrl = githubUrl.replace('.git', '');
    const githubOwner = githubUrl.split('/')[3]
    const githubRepo = githubUrl.split('/')[4]?.replace('.git', '')
    console.log("owner", githubOwner, "repo", githubRepo);
    if (!githubOwner || !githubRepo) return 0
    const fileCount = await getFileCount('', octokit, githubOwner, githubRepo, 0)
    return fileCount
}

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
    const loader = new GithubRepoLoader(
        githubUrl,
        {
            branch: "main",
            ignoreFiles: ['package-lock.json', 'bun.lockb', 'pnpm-lock.yaml', 'yarn.lock','node_modules', '.git', 'dist', 'build', '.next', '.vercel', '.env', '.env.local', '.env.development', '.env.production', '.env.test', '.env.production.local', '.env.local.local'],
            recursive: true,
            // recursive: false,
            accessToken: githubToken,
            unknown: "warn",
            maxConcurrency: 5, // Defaults to 2
        }
    );
    const docs = await loader.load();
    console.log("loaded", docs.length, "docs");
    console.log("loaded", docs.map(doc => doc.metadata.source).join(", "));
    
    return docs
};

export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
    const docs = await loadGithubRepo(githubUrl, githubToken);
    const allEmbeddings = await generateEmbeddings(docs)
    const limit = pLimit(10);
    await Promise.allSettled(
        allEmbeddings.map((embedding, index) =>
            limit(async () => {
                console.log(`processing ${index} of ${allEmbeddings.length}`);
                if (!embedding) throw new Error("embedding is null");

                // First, upsert the basic data
                const sourceCodeEmbedding = await db.sourceCodeEmbedding.upsert({
                    where: {
                        projectId_fileName: {
                            projectId,
                            fileName: embedding.fileName
                        }
                    },
                    update: {
                        summary: embedding.summary,
                        sourceCode: embedding.sourceCode,
                    },
                    create: {
                        summary: embedding.summary,
                        sourceCode: embedding.sourceCode,
                        fileName: embedding.fileName,
                        projectId,
                    }
                });

                // Then, update the summaryEmbedding using raw SQL
                await db.$executeRaw`
                UPDATE "SourceCodeEmbedding"
                SET "summaryEmbedding" = ${embedding.embeddings}::vector
                WHERE id = ${sourceCodeEmbedding.id}
            `;
            })
        )
    )
}



async function generateEmbeddings(docs: Awaited<ReturnType<typeof loadGithubRepo>>) {
    return await Promise.all(docs.map(async (doc) => {
        const summary = await getSummary(doc);
        if (!summary) return null;
        const embeddings = await getEmbeddings(summary);
        return {
            summary,
            embeddings,
            sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
            fileName: doc.metadata.source,
        };
    }));
}
// console.log("done")

// const query = 'what env is needed for this project?'


// const embedding = await getEmbeddings(query)
// const vectorQuery = `[${embedding.join(',')}]`

// const result = await db.$queryRaw`
//   SELECT
//     id,
//     summary,
//     1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) as similarity
//   FROM "SourceCodeEmbedding"
//   where 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > .5
//   ORDER BY  similarity DESC
//   LIMIT 10;
// `
// console.log(result)