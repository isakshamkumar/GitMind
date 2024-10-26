import { OpenAI } from 'openai'
import { loadGithubRepo } from './github-loader'

export const openAI = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export const getSummary = async (doc: Awaited<ReturnType<typeof loadGithubRepo>>[number]) => {
    console.log("getting summary for", doc.metadata.source);
    const code = doc.pageContent.slice(0, 10000); // Limit to 10000 characters

    const response = await openAI.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects",
            },
            {
                role: "user",
                content: `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file
Here is the code:
---
${code}
---
Give a summary no more than 100 words of the code above`,
            },
        ],
    });

    console.log("got back summary", doc.metadata.source);
    return response.choices[0]?.message.content;
}

export const getEmbeddings = async (text: string) => {
    const payload = text.replaceAll("\n", " ");
    const response = await openAI.embeddings.create({
        model: "text-embedding-ada-002",
        input: payload,
    });
    return response.data[0]?.embedding;
}

