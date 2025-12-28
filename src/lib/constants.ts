export enum AIModel {
    // Embeddings
    QWEN_EMBEDDING = "qwen/qwen3-embedding-8b",
    
    // Chat Models (Groq)
    GROQ_LLAMA_3_3_70B = "llama-3.3-70b-versatile",
    GROQ_LLAMA_3_1_8B = "llama-3.1-8b-instant",
    OPENROUTER_GEMINI_3_FLASH_PREVIEW = "google/gemini-3-flash-preview",
    OPENROUTER_GROK_4_1_FAST = "x-ai/grok-4.1-fast",
    // Chat Models (OpenRouter)
    OPENROUTER_QWEN_2_5_CODER = "qwen/qwen-2.5-coder-32b-instruct",
}

export enum AIProvider {
    GROQ = "groq",
    OPENROUTER = "openrouter",
}

