'use server'

import { createStreamableValue } from 'ai/rsc';
import { getEmbeddings, EMBEDDING_DIM, openRouter } from '@/lib/ai';
import { db } from '@/server/db';
import { AIModel } from '@/lib/constants';

export async function generate(input: string, projectId: string) {
    console.log('🚀 Starting generate function with:', { input: input.substring(0, 100) + '...', projectId });
    
    try {
        const stream = createStreamableValue('');
        
        // 1. Get Embeddings
        const embedding = await getEmbeddings(input);
        const finalEmbedding = embedding.slice(0, EMBEDDING_DIM);
        const vectorQuery = `[${finalEmbedding.join(',')}]`;

        // 2. Use AI to determine if the question is broad or specific
        const classificationPrompt = `
        You are a strict classifier. Determine if this question is "broad" (high-level/architecture/overview) or "specific" (particular file/function/error).
        User Question: "${input}"
        Respond with exactly one word: broad or specific.`;

        const classification = await openRouter.chat.completions.create({
            // Use a non-thinking, fast classifier model
            model: AIModel.OPENROUTER_GEMINI_3_FLASH_PREVIEW,
            messages: [{ role: "user", content: classificationPrompt }],
            max_tokens: 5,
            temperature: 0,
        });

        const rawClassification = classification.choices[0]?.message?.content?.trim().toLowerCase() || "";
        const queryType = rawClassification.replace(/<[^>]+>/g, '').trim(); // strip any stray tags like <think>
        const heuristicBroad = /codebase|project|overview|about|summary|explain|architecture|docs/i.test(input);
        const isBroadQuestion = queryType.includes("broad") || (!queryType && heuristicBroad) || (queryType !== "specific" && heuristicBroad);

        console.log("🔍 Classification detail", {
            rawClassification,
            queryType,
            heuristicBroad,
            isBroadQuestion,
            inputPreview: input.substring(0, 80)
        });

        // Fetch project structure for smarter context
        const allFiles = await db.sourceCodeEmbedding.findMany({
            where: { projectId },
            select: { fileName: true }
        });
        
        const fileList = allFiles.map(f => f.fileName).join('\n');
        const fileContext = `
        PROJECT FILE STRUCTURE:
        ---
        ${fileList.slice(0, 5000)} ${fileList.length > 5000 ? '...(truncated)' : ''}
        ---
        `;

        // 3. Query DB
        let result = await db.$queryRaw`
          SELECT
            "fileName",
            "sourceCode",
            "summary",
            1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) as similarity
          FROM "SourceCodeEmbedding"
          WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > .3
          AND "projectId" = ${projectId}
          ORDER BY similarity DESC
          LIMIT 10;
        ` as { fileName: string; sourceCode: string; summary: string; similarity: number }[];
        console.log("🧠 Vector search results", { count: result.length, topFiles: result.map(r => r.fileName) });
        
        // If broad question, ensure we include high-level files if missed
        if (isBroadQuestion) {
            const importantFiles = await db.sourceCodeEmbedding.findMany({
                where: {
                    projectId,
                    fileName: {
                        in: ['README.md', 'package.json', 'src/app/page.tsx', 'index.ts', 'main.ts', 'src/index.ts', 'app.py', 'main.py', 'requirements.txt']
                    }
                },
                take: 5
            });
            
            // Merge unique files
            const existingFiles = new Set(result.map(r => r.fileName));
            for (const file of importantFiles) {
                if (!existingFiles.has(file.fileName)) {
                    result.push({
                        fileName: file.fileName,
                        sourceCode: file.sourceCode,
                        summary: file.summary,
                        similarity: 1
                    });
                }
            }
            console.log("🧭 Added broad-context files", { added: importantFiles.length, totalAfter: result.length });
        }

        // --- FIX: Populate filesReferenced correctly ---
        // If no vector results but we found files via broad search, make sure they are included.
        // Also, if results are empty, fallback to ALL broad files found.
        if (result.length === 0 && isBroadQuestion) {
             const fallbackFiles = await db.sourceCodeEmbedding.findMany({
                where: { projectId },
                take: 10
            });
             result = fallbackFiles.map(f => ({
                 fileName: f.fileName,
                 sourceCode: f.sourceCode,
                 summary: f.summary,
                 similarity: 0.5 
             }));
             console.log("🛟 Broad fallback triggered", { count: result.length, files: result.map(f => f.fileName) });
        }

        console.log("📑 Final filesReferenced", { count: result.length, files: result.map(r => r.fileName) });

        let context = '';
        for (const r of result) {
            context += `source:${r.fileName}\ncode content:${r.sourceCode}\nsummary of file:${r.summary}\n\n`;
        }
        
        // 4. Stream AI response
        (async () => {
             try {
                const streamPromise = openRouter.chat.completions.create({
                    model: AIModel.OPENROUTER_GROK_4_1_FAST, 
                    messages: [
                        {
                            role: "user",
                            content: `You are an AI code assistant answering questions about a codebase. 
                            Your target audience is a technical intern.

                            ${fileContext}
                            
                            START CONTEXT BLOCK
                            ${context}
                            END OF CONTEXT BLOCK

                            START QUESTION
                            ${input}
                            END OF QUESTION
                            
                            Instructions:
                            1. **Thinking Process**: Start your response with a <thinking> tag. Inside it, analyze the user's request, the provided context, and the file structure. Plan your answer step-by-step.
                            2. **Conciseness**: If the question is broad (like "explain the codebase"), keep the summary CONCISE (under 300 words). Use bullet points. Do not regurgitate entire file contents.
                            3. **Context Awareness**: Use the "PROJECT FILE STRUCTURE" to understand where files fit in the larger picture, even if their content isn't in the context block.
                            4. **Answer**: After the </thinking> tag, provide the final markdown answer.
                            `
                        }
                    ],
                    stream: true,
                });
                
                const response = await streamPromise;

                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        stream.update(content);
                    }
                }
                stream.done();
             } catch (e) {
                 console.error("Stream error", e);
                 stream.error(e);
             }
        })();

        return { output: stream.value, filesReferenced: result };

    } catch (error) {
        console.error("Generate error", error);
        throw error;
    }
}
