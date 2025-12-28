import { Groq } from 'groq-sdk';
import { env } from '@/env';

// Initialize Groq client
const groq = new Groq({
    apiKey: env.GROQ_API_KEY
});

export interface GitMindDocument {
    pageContent: string;
    metadata: {
        source: string;
    };
}

export const getSummaryWithGroq = async (doc: GitMindDocument): Promise<string | null> => {
    try {
        console.log("getting summary for", doc.metadata.source, "using Groq");
        
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const code = doc.pageContent.slice(0, 10000); // Limit to 10000 characters
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an intelligent senior software engineer who specializes in onboarding junior software engineers onto projects."
                },
                {
                    role: "user",
                    content: `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
                    
Here is the code:
---
${code}
---

###CRITICAL SUMMARY COMMENTS:
Give a summary no more than 250-300 words of the code above. Make sure you highlight all the important parts/pieces of code. That can include function/class names, methods, their uses, input/output, their flow and what it does, and all the key points of the code.`
                }
            ],
            model: "openai/gpt-oss-120b", // Fast and capable model based on web search results
            temperature: 0.3, // Lower temperature for more consistent summaries
            max_completion_tokens: 400, // Slightly more than 300 words to be safe
            top_p: 0.95,
            stream: false, // Disable streaming for simpler handling
            stop: null
        });

        const summary = chatCompletion.choices[0]?.message?.content;
        
        if (!summary) {
            console.warn("Groq returned empty summary for", doc.metadata.source);
            return null;
        }

        console.log("got back summary", doc.metadata.source, "from Groq");
        return summary.trim();
        
    } catch (error: any) {
        console.error("Error getting summary from Groq:", error);
        
        // Log specific error types for debugging
        if (error.status === 429) {
            console.error("Groq rate limit exceeded");
        } else if (error.status === 401) {
            console.error("Groq API key invalid");
        } else if (error.status >= 500) {
            console.error("Groq server error");
        }
        
        return null;
    }
};

// Commit diff summarization with Groq
export const aiSummariseCommitWithGroq = async (diff: string): Promise<string> => {
    try {
        console.log("getting commit summary using Groq");
        
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert programmer summarizing git diffs. Provide ONLY concise bullet points without any prefixes, explanations, or thinking process."
                },
                {
                    role: "user",
                    content: `Summarize this git diff with bullet points starting with *.

Rules:
- Start directly with * (no "Here's a summary" or introductory text)
- Format: * action + description + [files] 
- If more than 2 files, omit file names
- Be concise and technical
- NO thinking process or explanations

Examples:
* Added error handling for API requests [lib/api.ts]
* Updated database schema [migrations/001.sql] 
* Fixed typo in configuration

Git diff:
${diff}`
                }
            ],
            model: "openai/gpt-oss-120b",
            temperature: 0.1, // Lower temperature for more consistent output
            max_completion_tokens: 200, // Shorter to avoid verbose responses
            top_p: 0.95,
            stream: false,
            stop: null
        });

        const summary = chatCompletion.choices[0]?.message?.content;
        
        if (!summary) {
            console.warn("Groq returned empty commit summary");
            return "Could not generate commit summary";
        }

        console.log("got back commit summary from Groq");
        
        // Clean up any unwanted prefixes that might still appear
        let cleanSummary = summary.trim();
        if (cleanSummary.toLowerCase().startsWith("here's a summary")) {
            cleanSummary = cleanSummary.split('\n').slice(1).join('\n').trim();
        }
        
        return cleanSummary;
        
    } catch (error: any) {
        console.error("Error getting commit summary from Groq:", error);
        return "Could not generate commit summary";
    }
};

// Alternative models available on Groq (based on web search results)
export const GROQ_MODELS = {
    GPT_OSS_120B: "openai/gpt-oss-120b", // Fast and multilingual
    LLAMA_4_SCOUT: "llama4-scout", // Function calling and vision
    LLAMA_3_3_70B: "llama-3.3-70b-versatile", // Large model
    GEMMA_2: "gemma2-9b-it" // Google's efficient model
} as const;

// Smart model selection based on file type
export const selectBestGroqModel = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
        case 'ts':
        case 'tsx':
        case 'js':
        case 'jsx':
            return GROQ_MODELS.GPT_OSS_120B; // Great for JavaScript/TypeScript
        case 'py':
            return GROQ_MODELS.LLAMA_3_3_70B; // Good for Python
        case 'md':
        case 'txt':
            return GROQ_MODELS.GEMMA_2; // Efficient for documentation
        default:
            return GROQ_MODELS.GPT_OSS_120B; // Default to Qwen for general use
    }
}; 