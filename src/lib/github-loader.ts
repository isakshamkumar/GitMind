import pLimit from 'p-limit'
import { getEmbeddings, getSummary } from "./gemini";
import { db } from "@/server/db";
import { Octokit } from "octokit";
import AdmZip from 'adm-zip';

// Vercel-optimized GitHub repository analysis
// Uses ZIP download and Git Trees API to avoid rate limits

interface RepositoryInfo {
    owner: string;
    repo: string;
}

interface ProcessingResult {
    success: boolean;
    files?: any[];
    totalFiles?: number;
    error?: string;
    status: 'completed' | 'queued' | 'failed';
    method: string;
    sizeMB?: number;
}

interface GitMindDocument {
    pageContent: string;
    metadata: {
        source: string;
    };
}

const parseGithubUrl = (githubUrl: string): RepositoryInfo => {
    const cleanUrl = githubUrl.replace('.git', '');
    const urlParts = cleanUrl.split('/');
    return {
        owner: urlParts[3] || '',
        repo: urlParts[4] || ''
    };
};

const isCodeFile = (filePath: string): boolean => {
    const codeExtensions = [
        '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go',
        '.rs', '.php', '.rb', '.swift', '.kt', '.scala', '.sh', '.bat', '.ps1',
        '.html', '.css', '.scss', '.sass', '.less', '.vue', '.svelte', '.astro',
        '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.env', '.md', '.txt'
    ];
    return codeExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
};

const cleanPath = (entryName: string): string => {
    // Remove repository prefix from ZIP entries (first directory)
    const parts = entryName.split('/');
    return parts.slice(1).join('/');
};

const shouldIgnoreFile = (filePath: string): boolean => {
    const ignorePatterns = [
        'package-lock.json', 'bun.lockb', 'pnpm-lock.yaml', 'yarn.lock',
        'node_modules/', '.git/', 'dist/', 'build/', '.next/', '.vercel/',
        '.env', '.env.local', '.env.development', '.env.production', '.env.test',
        '.DS_Store', 'Thumbs.db', '.idea/', '.vscode/', 'coverage/', 'tmp/',
        '*.log', '*.tmp', '*.swp', '*.swo'
    ];
    
    return ignorePatterns.some(pattern => {
        if (pattern.endsWith('/')) {
            return filePath.includes(pattern);
        }
        return filePath.endsWith(pattern) || filePath.includes(`/${pattern}`);
    });
};

// Fast estimation using HEAD request (no API calls, no rate limits)
const estimateViaZipHeaders = async (owner: string, repo: string, branch = 'main'): Promise<{
    estimatedFiles: number;
    estimatedSizeMB: number;
    shouldUseBackground: boolean;
}> => {
    try {
        const zipUrl = `https://github.com/${owner}/${repo}/archive/${branch}.zip`;
        
        // HEAD request to get size without downloading
        const response = await fetch(zipUrl, { method: 'HEAD' });
        
        if (!response.ok) {
            // Try default branch if main fails
            if (branch === 'main') {
                return estimateViaZipHeaders(owner, repo, 'master');
            }
            throw new Error(`Repository not accessible: ${response.status}`);
        }
        
        const sizeMB = parseInt(response.headers.get('content-length') || '0') / (1024 * 1024);
        
        // Estimate file count based on ZIP size (empirically derived)
        let estimatedFiles = Math.round(sizeMB * 60); // ~60 files per MB for typical repos
        
        // Adjust based on size patterns
        if (sizeMB < 0.5) estimatedFiles = Math.max(estimatedFiles, 20);
        if (sizeMB > 50) estimatedFiles = Math.min(estimatedFiles, 2000);
        
        return {
            estimatedFiles,
            estimatedSizeMB: sizeMB,
            shouldUseBackground: sizeMB > 15 // Background processing for repos > 15MB
        };
    } catch (error) {
        console.error('ZIP estimation failed:', error);
        return {
            estimatedFiles: 150,
            estimatedSizeMB: 2,
            shouldUseBackground: false
        };
    }
};

// Precise count using Git Trees API (2 API calls only)
const getFileCountViaGitTrees = async (octokit: Octokit, owner: string, repo: string, branch = 'main'): Promise<number> => {
    try {
        // Get latest commit SHA (1 API call)
        const { data: commitData } = await octokit.rest.repos.getCommit({
            owner,
            repo,
            ref: branch
        });
        
        // Get complete file tree (1 API call)
        const { data: treeData } = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: commitData.commit.tree.sha,
            recursive: 'true'
        });
        
        // Count only files (blobs), not directories
        const fileCount = treeData.tree.filter(item => item.type === 'blob').length;
        
        console.log(`Git Trees API: Found ${fileCount} files (truncated: ${treeData.truncated})`);
        
        return fileCount;
    } catch (error: any) {
        console.error('Git Trees API failed:', error.message);
        if (error.status === 404) {
            throw new Error('Repository not found or private');
        }
        throw error;
    }
};

// Process ZIP file in memory (Vercel-compatible)
const processZipInMemory = async (zipBuffer: ArrayBuffer, maxFiles = 1000): Promise<GitMindDocument[]> => {
    const zip = new AdmZip(Buffer.from(zipBuffer));
    const entries = zip.getEntries();
    
    const documents: GitMindDocument[] = [];
    
    // Process entries in chunks to manage memory
    const chunkSize = 100;
    for (let i = 0; i < entries.length && documents.length < maxFiles; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        
        for (const entry of chunk) {
            if (documents.length >= maxFiles) break;
            
            const cleanedPath = cleanPath(entry.entryName);
            
            // Skip if not a file, is ignored, or not a code file
            if (entry.isDirectory || 
                shouldIgnoreFile(cleanedPath) || 
                !isCodeFile(cleanedPath) ||
                !cleanedPath) {
                continue;
            }
            
            try {
                const content = entry.getData().toString('utf8');
                
                // Skip very large files or empty files
                if (content.length === 0 || content.length > 100000) {
                    continue;
                }
                
                documents.push({
                    pageContent: content,
                    metadata: {
                        source: cleanedPath
                    }
                });
            } catch (error) {
                console.warn(`Failed to process file: ${cleanedPath}`, error);
            }
        }
    }
    
    console.log(`Processed ${documents.length} files from ZIP`);
    return documents;
};

export const checkCredits = async (githubUrl: string, githubToken?: string): Promise<number> => {
    console.log("Checking credits for", githubUrl, githubToken ? "with token" : "without token");
    
    const { owner, repo } = parseGithubUrl(githubUrl);
    if (!owner || !repo) return 0;
    
    try {
        if (githubToken) {
            // Use precise Git Trees API for authenticated users
            const octokit = new Octokit({ auth: githubToken });
            return await getFileCountViaGitTrees(octokit, owner, repo);
        } else {
            // Use fast ZIP estimation for unauthenticated users
            const estimation = await estimateViaZipHeaders(owner, repo);
            return estimation.estimatedFiles;
        }
    } catch (error: any) {
        console.error('Error in checkCredits:', error.message);
        
        if (error.message.includes('not found') || error.message.includes('private')) {
            return 0; // Indicates repository is private or doesn't exist
        }
        
        // Fallback to conservative estimate
        console.log("Using fallback estimation");
        return 200;
    }
};

export const loadGithubRepo = async (githubUrl: string, githubToken?: string): Promise<GitMindDocument[]> => {
    console.log("Loading GitHub repository:", githubUrl);
    
    const { owner, repo } = parseGithubUrl(githubUrl);
    if (!owner || !repo) {
        throw new Error('Invalid GitHub URL');
    }
    
    // Check repository size first
    const estimation = await estimateViaZipHeaders(owner, repo);
    
    if (estimation.shouldUseBackground) {
        throw new Error(`Repository too large (${estimation.estimatedSizeMB.toFixed(1)}MB) for direct processing. Please use a smaller repository or contact support.`);
    }
    
    try {
        // Download ZIP file
        const zipUrl = `https://github.com/${owner}/${repo}/archive/main.zip`;
        console.log(`Downloading repository ZIP: ${zipUrl}`);
        
        const response = await fetch(zipUrl);
        if (!response.ok) {
            // Try master branch if main fails
            const masterUrl = `https://github.com/${owner}/${repo}/archive/master.zip`;
            const masterResponse = await fetch(masterUrl);
            if (!masterResponse.ok) {
                throw new Error(`Failed to download repository: ${response.status}`);
            }
            const zipBuffer = await masterResponse.arrayBuffer();
            return await processZipInMemory(zipBuffer);
        }
        
        const zipBuffer = await response.arrayBuffer();
        const sizeMB = zipBuffer.byteLength / (1024 * 1024);
        
        console.log(`Downloaded ZIP: ${sizeMB.toFixed(2)}MB`);
        
        // Process files in memory
        const documents = await processZipInMemory(zipBuffer);
        
        console.log(`Successfully loaded ${documents.length} files from ${owner}/${repo}`);
        return documents;
        
    } catch (error: any) {
        console.error('Error loading GitHub repository:', error.message);
        throw new Error(`Failed to load repository: ${error.message}`);
    }
};

export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string): Promise<void> => {
    const docs = await loadGithubRepo(githubUrl, githubToken);
    const allEmbeddings = await generateEmbeddings(docs);
    
    const limit = pLimit(3); // Further reduce concurrency to avoid hitting AI API rate limits
    await Promise.allSettled(
        allEmbeddings.map((embedding, index) =>
            limit(async () => {
                console.log(`Processing ${index + 1} of ${allEmbeddings.length}`);
                if (!embedding) {
                    console.warn(`Skipping null embedding at index ${index}`);
                    return;
                }

                // First, upsert the basic data
                const sourceCodeEmbedding = await db.sourceCodeEmbedding.upsert({
                    where: {
                        projectId_fileName: {
                            projectId,
                            fileName: embedding.fileName
                        }
                    },
                    update: {
                        summary: embedding.summary,
                        sourceCode: embedding.sourceCode,
                    },
                    create: {
                        summary: embedding.summary,
                        sourceCode: embedding.sourceCode,
                        fileName: embedding.fileName,
                        projectId,
                    }
                });

                // Then, update the summaryEmbedding using raw SQL
                await db.$executeRaw`
                UPDATE "SourceCodeEmbedding"
                SET "summaryEmbedding" = ${embedding.embeddings}::vector
                WHERE id = ${sourceCodeEmbedding.id}
            `;
            })
        )
    );

    console.log(`Successfully indexed ${allEmbeddings.filter(e => e !== null).length} files for project ${projectId}`);
};

async function generateEmbeddings(docs: GitMindDocument[]) {
    return await Promise.all(docs.map(async (doc) => {
        try {
        const summary = await getSummary(doc);
        if (!summary) return null;
            
        const embeddings = await getEmbeddings(summary);
        return {
            summary,
            embeddings,
                sourceCode: doc.pageContent,
            fileName: doc.metadata.source,
        };
        } catch (error) {
            console.error(`Failed to generate embedding for ${doc.metadata.source}:`, error);
            return null;
        }
    }));
}