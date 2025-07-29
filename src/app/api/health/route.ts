import { NextResponse } from 'next/server';
import { db } from '@/server/db';

export async function GET() {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        checks: {
            database: 'unknown',
            geminiApiKey: 'unknown',
            vectorExtension: 'unknown'
        }
    };

    try {
        // Test database connection
        await db.$queryRaw`SELECT 1 as test`;
        health.checks.database = 'ok';
    } catch (error) {
        health.checks.database = `error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        health.status = 'error';
    }

    // Check Gemini API key
    if (process.env.GEMINI_API_KEY) {
        health.checks.geminiApiKey = 'present';
    } else {
        health.checks.geminiApiKey = 'missing';
        health.status = 'error';
    }

    // Test vector extension
    try {
        await db.$queryRaw`SELECT '[1,2,3]'::vector as test`;
        health.checks.vectorExtension = 'ok';
    } catch (error) {
        health.checks.vectorExtension = `error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        health.status = 'error';
    }

    return NextResponse.json(health, {
        status: health.status === 'ok' ? 200 : 500
    });
} 