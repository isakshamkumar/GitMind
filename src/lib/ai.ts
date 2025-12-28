import OpenAI from 'openai';
import { Groq } from 'groq-sdk';
import { AIModel } from './constants';

export const EMBEDDING_DIM = 768; // Truncate embeddings to match pgvector column

// Initialize OpenRouter client
export const openRouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
        "X-Title": "GitMind",
    },
});

// Initialize Groq client
export const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export const getEmbeddings = async (text: string): Promise<number[]> => {
    try {
        const response = await openRouter.embeddings.create({
            model: AIModel.QWEN_EMBEDDING,
            input: text,
            encoding_format: "float",
        });
        const vector = response.data[0].embedding;
        // Truncate to EMBEDDING_DIM to avoid pgvector dimension mismatches
        return vector.slice(0, EMBEDDING_DIM);
    } catch (error) {
        console.error("Error generating embeddings:", error);
        throw error;
    }
};

export const generateCompletion = async (
    prompt: string, 
    systemPrompt: string = "You are a helpful AI assistant."
): Promise<string | null> => {
    // Try Groq first for speed
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
            ],
            model: AIModel.GROQ_LLAMA_3_3_70B,
        });
        return completion.choices[0]?.message?.content || null;
    } catch (groqError) {
        console.warn("Groq failed, falling back to OpenRouter:", groqError);
        
        // Fallback to OpenRouter
        try {
            const completion = await openRouter.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                model: AIModel.OPENROUTER_QWEN_2_5_CODER,
            });
            return completion.choices[0]?.message?.content || null;
        } catch (orError) {
            console.error("OpenRouter also failed:", orError);
            return null;
        }
    }
};

