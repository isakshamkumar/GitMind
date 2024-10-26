import { loadGithubRepo } from "./github-loader";

import { GoogleGenerativeAI } from "@google/generative-ai";


// Access your API key as an environment variable (see our Getting Started tutorial)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


export const getEmbeddings = async (text: string) => {
    // For embeddings, use the Text Embeddings model
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    const result = await model.embedContent(text);
    const embedding = result.embedding;
    return embedding.values as number[];
}


export const getSummary = async (doc: Awaited<ReturnType<typeof loadGithubRepo>>[number]) => {
    console.log("getting summary for", doc.metadata.source);
    const code = doc.pageContent.slice(0, 10000); // Limit to 10000 characters
    const response = await model.generateContent([
        `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects`,
        `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file
Here is the code:
---
${code}
---
            Give a summary no more than 100 words of the code above`,
    ]);


    return response.response.text()
}

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
