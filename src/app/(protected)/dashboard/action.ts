'use server'

import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getEmbeddings } from '@/lib/gemini';
import { db } from '@/server/db';

// Validate environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables');
    throw new Error('GEMINI_API_KEY environment variable is required');
}

const google = createGoogleGenerativeAI({
    apiKey: GEMINI_API_KEY,
});

export async function generate(input: string, projectId: string) {
    console.log('🚀 Starting generate function with:', { input: input.substring(0, 100) + '...', projectId });
    console.log('🔑 API Key status:', GEMINI_API_KEY ? 'Present' : 'Missing');
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    try {
        // Validate database connection first
        try {
            console.log('🔍 Testing database connection...');
            await db.$queryRaw`SELECT 1 as test`;
            console.log('✅ Database connection successful');
        } catch (dbTestError) {
            console.error('❌ Database connection test failed:', dbTestError);
            throw new Error(`Database connection failed: ${dbTestError instanceof Error ? dbTestError.message : 'Unknown error'}`);
        }
        
        const stream = createStreamableValue('');
        console.log('✅ Stream created successfully');

        // Step 1: Get embeddings
        console.log('📊 Getting embeddings...');
        let embedding;
        try {
            embedding = await getEmbeddings(input);
            console.log('✅ Embeddings generated successfully, length:', embedding.length);
        } catch (embeddingError) {
            console.error('❌ Error getting embeddings:', embeddingError);
            throw new Error(`Failed to generate embeddings: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`);
        }

        const vectorQuery = `[${embedding.join(',')}]`;
        console.log('✅ Vector query created');

        // Step 2: Query database
        console.log('🗄️ Querying database...');
        let result;
        try {
            result = await db.$queryRaw`
              SELECT
            "fileName",
            "sourceCode",
                summary,
                1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) as similarity
              FROM "SourceCodeEmbedding"
              WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > .5
              AND "projectId" = ${projectId}
              ORDER BY  similarity DESC
              LIMIT 10;
            ` as { fileName: string, sourceCode: string, summary: string }[];
            console.log('✅ Database query successful, found', result.length, 'results');
        } catch (dbError) {
            console.error('❌ Database query error:', dbError);
            throw new Error(`Database query failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        }

        let context = '';
        for (const r of result) {
            context += `source:${r.fileName}\ncode content:${r.sourceCode}\nsummary of file:${r.summary}\n\n`;
        }
        console.log('✅ Context built, length:', context.length);

        // Step 3: Stream AI response
        console.log('🤖 Starting AI streaming...');
        (async () => {
            try {
                console.log('🔧 Creating AI stream with model: gemini-2.5-flash');
                
                // Add timeout for the AI request
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('AI request timed out after 30 seconds')), 30000);
                });
                
                const streamPromise = streamText({
                    model: google('gemini-2.5-flash'),
                    prompt: `
                    You are a ai code assistant who answers questions about the codebase. Your target audience is a technical intern who is looking to understand the codebase.
                            AI assistant is a brand new, powerful, human-like artificial intelligence.
              The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
              AI is a well-behaved and well-mannered individual.
              AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
              AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
              If the question is asking about code or a specific file, AI will provide the detailed answer, giving step by step instructions, including code snippets.
              START CONTEXT BLOCK
              ${context}
              END OF CONTEXT BLOCK

              START QUESTION
              ${input}
              END OF QUESTION
              AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
              If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
              AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
              AI assistant will not invent anything that is not drawn directly from the context.
              Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering, make sure there is no ambiguity and include any and all relevant information to give context to the intern.
                    `,
                });
                
                const { textStream } = await Promise.race([streamPromise, timeoutPromise]) as any;
                console.log('✅ AI stream created successfully');

                let deltaCount = 0;
                for await (const delta of textStream) {
                    stream.update(delta);
                    deltaCount++;
                    if (deltaCount % 10 === 0) {
                        console.log(`📝 Processed ${deltaCount} deltas`);
                    }
                }
                console.log('✅ AI streaming completed, total deltas:', deltaCount);
                stream.done();
            } catch (streamError) {
                console.error('❌ AI streaming error:', streamError);
                console.error('❌ Stream error details:', {
                    name: streamError instanceof Error ? streamError.name : 'Unknown',
                    message: streamError instanceof Error ? streamError.message : 'Unknown error',
                    stack: streamError instanceof Error ? streamError.stack : 'No stack trace'
                });
                
                // Try fallback non-streaming approach
                try {
                    console.log('🔄 Attempting fallback non-streaming approach...');
                    const { GoogleGenerativeAI } = await import('@google/generative-ai');
                    const fallbackGenAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
                    const fallbackModel = fallbackGenAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                    
                    const fallbackResponse = await fallbackModel.generateContent([
                        `You are a ai code assistant who answers questions about the codebase. Your target audience is a technical intern who is looking to understand the codebase.
                        
                        START CONTEXT BLOCK
                        ${context}
                        END OF CONTEXT BLOCK

                        START QUESTION
                        ${input}
                        END OF QUESTION
                        
                        Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering, make sure there is no ambiguity and include any and all relevant information to give context to the intern.`
                    ]);
                    
                    const fallbackText = fallbackResponse.response.text();
                    console.log('✅ Fallback approach successful, content length:', fallbackText.length);
                    stream.update(fallbackText);
                    stream.done();
                } catch (fallbackError) {
                    console.error('❌ Fallback approach also failed:', fallbackError);
                    stream.error(`AI request failed: ${streamError instanceof Error ? streamError.message : 'Unknown error'}. Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
                }
            }
        })();

        console.log('✅ Generate function completed successfully');
        return { output: stream.value, filesReferenced: result };
    } catch (error) {
        console.error('❌ Generate function failed:', error);
        console.error('❌ Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw error;
    }
}