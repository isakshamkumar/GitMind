import { getEmbeddings as getEmbeddingsAI, generateCompletion } from "./ai";

export const getEmbeddings = getEmbeddingsAI;

export interface GitMindDocument {
    pageContent: string;
    metadata: {
        source: string;
    };
}

export const getSummary = async (doc: GitMindDocument): Promise<string | null> => {
    console.log("getting summary for", doc.metadata.source);
    const code = doc.pageContent.slice(0, 10000);
    const prompt = `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects.
    You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file
    
Here is the code:
---
${code}
---
###CRITICAL SUMMARY COMMENTS:
    Give a summary no more than 250-300 words of the code above, make sure u highlight all the important parts/pieces of code. That can include function/class names, methods, their uses, input / output. Their flow and what it does, and all the keypoints of the code.`;

    const summary = await generateCompletion(prompt);
    return summary;
}

export const aiSummariseCommit = async (diff: string) => {
    console.log("getting commit summary");
    const prompt = `You are an expert programmer summarizing git diffs. Provide ONLY a concise bullet-point summary without any prefixes or explanations.

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
${diff}`;

    return await generateCompletion(prompt) || "Could not generate commit summary";
};
