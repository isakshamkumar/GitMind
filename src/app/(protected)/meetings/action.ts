'use server'

import { createStreamableValue } from 'ai/rsc';
import { getEmbeddings } from '@/lib/gemini';
import { db } from '@/server/db';
import { openRouter } from '@/lib/ai';
import { AIModel } from '@/lib/constants';
import { EMBEDDING_DIM } from '@/lib/ai';

export async function askMeeting(input: string, quote: string, meetingId: string) {
    const stream = createStreamableValue('');

    const embedding = await getEmbeddings(input);
    const finalEmbedding = embedding.slice(0, EMBEDDING_DIM);
    const vectorQuery = `[${finalEmbedding.join(',')}]`;

    const result = await db.$queryRaw`
      SELECT
    "content",
        1 - ("embedding" <=> ${vectorQuery}::vector) as similarity
      FROM "MeetingEmbedding"
      WHERE 1 - ("embedding" <=> ${vectorQuery}::vector) > .45
      AND "meetingId" = ${meetingId}
      ORDER BY similarity DESC
      LIMIT 10;
    ` as { content: string }[];
    let context = '';

    for (const r of result) {
        context += `content:${r.content}\n\n`;
    };

    (async () => {
        const response = await openRouter.chat.completions.create({
            model: AIModel.OPENROUTER_QWEN_2_5_CODER,
            messages: [
                {
                    role: "user",
                    content: `AI assistant is a brand new, powerful, human-like artificial intelligence. AI will always answer in markdown syntax, with code snippets if needed.
                    The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
                    AI is a well-behaved and well-mannered individual.
                    AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
                    AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
                    START CONTEXT BLOCK
                    ${context}
                    END OF CONTEXT BLOCK
                    AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
                    If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
                    AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
                    AI assistant will not invent anything that is not drawn directly from the context.

                    I am asking a question in regards to this quote in the meeting: ${quote}\n here is the question:

                    START QUESTION
                    ${input}
                    END OF QUESTION

                    AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
                    If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
                    AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
                    AI assistant will not invent anything that is not drawn directly from the context.
                    Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering, make sure there is no ambiguity and include any and all relevant information to give context to the intern.`
                }
            ],
            stream: true,
        });

        for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                stream.update(content);
            }
        }

        stream.done();
    })();

    return { output: stream.value };
}
