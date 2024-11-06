// Start by making sure the `assemblyai` package is installed.
// If not, you can install it by running the following command:
// npm install assemblyai

import { AssemblyAI } from 'assemblyai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getEmbeddings } from './gemini';
import pLimit from 'p-limit';
import { db } from '@/server/db';
const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

const FILE_URL =
    'https://assembly.ai/sports_injuries.mp3';

// You can also transcribe a local file by passing in a file path
// const FILE_URL = './path/to/file.mp3';

function msToTime(ms: number): string {
    const seconds = ms / 1000;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}


export const processMeeting = async (audio_url: string) => {
    const transcript = await client.transcripts.transcribe({
        audio: audio_url,
        auto_chapters: true
    });
    const summaries = transcript.chapters?.map(chapter => ({
        start: msToTime(chapter.start),
        end: msToTime(chapter.end),
        gist: chapter.gist,
        headline: chapter.headline,
        summary: chapter.summary
    })) || [];
    if (!transcript.text) {
        throw new Error('No transcript text')
    }
    return {
        transcript, summaries
    }

};

// processMeeting(FILE_URL);