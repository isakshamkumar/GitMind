import { loadGithubRepo } from "./github-loader";
import { getSummaryWithGroq, aiSummariseCommitWithGroq } from "./groq";
import { GoogleGenerativeAI } from "@google/generative-ai";


// Access your API key as an environment variable (see our Getting Started tutorial)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


export const getEmbeddings = async (text: string) => {
    // For embeddings, use the Text Embeddings model
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    const result = await model.embedContent(text);
    const embedding = result.embedding;
    return embedding.values as number[];
}


export const getSummary = async (doc: Awaited<ReturnType<typeof loadGithubRepo>>[number]): Promise<string | null> => {
    try {
        console.log("getting summary for", doc.metadata.source, "using Gemini");
        const code = doc.pageContent.slice(0, 10000); // Limit to 10000 characters
        const response = await model.generateContent([
            `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects`,
            `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file
Here is the code:
---
${code}
---
###CRITICAL SUMMARY COMMENTS:
Give a summary no more than 250-300 words of the code above, make sure u highlight all the important parts/pieces of code. That can include function/class names, methods, their uses, input / output. Their flow and what it does, and all the keypoints of the code.`,
        ]);

        console.log("got back summary", doc.metadata.source, "from Gemini");
        return response.response.text();
    } catch (error: any) {
        console.warn("Gemini failed for", doc.metadata.source, "- falling back to Groq:", error.message);
        
        // Check if it's a rate limit error (429) or quota exceeded
        if (error.status === 429 || error.message.includes("quota") || error.message.includes("rate limit")) {
            console.log("🔄 Falling back to Groq due to Gemini rate limits");
            return await getSummaryWithGroq(doc);
        }
        
        // For other errors, also try Groq as fallback
        console.log("🔄 Falling back to Groq due to Gemini error");
        return await getSummaryWithGroq(doc);
    }
}

export const aiSummariseCommit = async (diff: string) => {
    try {
        console.log("getting commit summary using Gemini");
        const response = await model.generateContent([
            `You are an expert programmer summarizing git diffs. Provide ONLY a concise bullet-point summary without any prefixes or explanations.

Rules:
- Start directly with bullet points using * 
- Each point should be: action + brief description + [affected files]
- If more than 2 files affected, omit file names
- Be concise and technical
- NO introductory text like "Here's a summary" or thinking process

Example format:
* Added error handling for API requests [lib/api.ts]
* Updated database schema for user table [migrations/001.sql]
* Fixed typo in configuration file

Git diff to summarize:
${diff}`
        ]);
        
        const summary = response.response.text().trim();
        console.log("got back commit summary from Gemini");
        return summary;
    } catch (error: any) {
        console.warn("Gemini commit summary failed - falling back to Groq:", error.message);
        if (error.status === 429 || error.message.includes("quota") || error.message.includes("rate limit")) {
            console.log("🔄 Falling back to Groq for commit summary due to Gemini rate limits");
            return await aiSummariseCommitWithGroq(diff);
        }
        console.log("🔄 Falling back to Groq for commit summary due to Gemini error");
        return await aiSummariseCommitWithGroq(diff);
    }
};


// const result = await getEmbeddings("The quick brown fox jumps over the lazy dog.");
// console.log(result.length);
// const summary = await getSummary({
//     metadata: { source: "test.ts" }, pageContent: `
//     import { useState } from "react";
//     const [count, setCount] = useState(0);
//     function handleClick() {
//         setCount(count + 1);
//     }
//     ` });
// console.log(summary);
