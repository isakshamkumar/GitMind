import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import pLimit from 'p-limit'
import { getEmbeddings } from "./gemini";
import { getSummary } from "./openai";
import { exit } from "process";
import { db } from "@/server/db";

export const loadGithubRepo = async (githubUrl: string) => {
    const loader = new GithubRepoLoader(
        githubUrl,
        {
            branch: "main",
            ignoreFiles: ['package-lock.json', 'bun.lockb'],
            recursive: true,
            // recursive: false,
            accessToken: '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',
            unknown: "warn",
            maxConcurrency: 5, // Defaults to 2
        }
    );
    const docs = await loader.load();
    return docs
};

export const indexGithubRepo = async (projectId: string, githubUrl: string) => {
    const docs = await loadGithubRepo(githubUrl);
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