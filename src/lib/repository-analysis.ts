import { db } from "@/server/db";

export interface RepositoryStats {
    totalFiles: number;
    totalLines: number;
    fileTypes: { [extension: string]: number };
    directoryStructure: DirectoryNode;
    languages: { [language: string]: { files: number; lines: number } };
    codeQuality: {
        avgFileSize: number;
        complexity: 'Low' | 'Medium' | 'High';
        documentation: number; // percentage of documented files
    };
}

export interface DirectoryNode {
    name: string;
    type: 'file' | 'directory';
    children?: DirectoryNode[];
    size?: number;
    extension?: string;
}

const getLanguageFromExtension = (extension: string): string => {
    const languageMap: { [key: string]: string } = {
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.py': 'Python',
        '.java': 'Java',
        '.cpp': 'C++',
        '.c': 'C',
        '.cs': 'C#',
        '.go': 'Go',
        '.rs': 'Rust',
        '.php': 'PHP',
        '.rb': 'Ruby',
        '.swift': 'Swift',
        '.kt': 'Kotlin',
        '.scala': 'Scala',
        '.sh': 'Shell',
        '.bat': 'Batch',
        '.ps1': 'PowerShell',
        '.html': 'HTML',
        '.css': 'CSS',
        '.scss': 'SCSS',
        '.sass': 'SASS',
        '.less': 'LESS',
        '.vue': 'Vue',
        '.svelte': 'Svelte',
        '.json': 'JSON',
        '.xml': 'XML',
        '.yaml': 'YAML',
        '.yml': 'YAML',
        '.md': 'Markdown',
        '.txt': 'Text',
    };
    return languageMap[extension.toLowerCase()] || 'Other';
};

const countLines = (content: string): number => {
    return content.split('\n').length;
};

const buildDirectoryStructure = (files: { fileName: string; sourceCode: string }[]): DirectoryNode => {
    const root: DirectoryNode = { name: 'root', type: 'directory', children: [] };
    
    files.forEach(file => {
        const pathParts = file.fileName.split('/');
        let currentNode = root;
        
        pathParts.forEach((part, index) => {
            const isFile = index === pathParts.length - 1;
            const existingChild = currentNode.children?.find(child => child.name === part);
            
            if (existingChild) {
                currentNode = existingChild;
            } else {
                const newNode: DirectoryNode = {
                    name: part,
                    type: isFile ? 'file' : 'directory',
                    children: isFile ? undefined : [],
                };
                
                if (isFile) {
                    newNode.size = file.sourceCode.length;
                    newNode.extension = '.' + part.split('.').pop();
                }
                
                currentNode.children = currentNode.children || [];
                currentNode.children.push(newNode);
                currentNode = newNode;
            }
        });
    });
    
    return root;
};

const calculateComplexity = (files: { fileName: string; sourceCode: string }[]): 'Low' | 'Medium' | 'High' => {
    const totalFiles = files.length;
    
    // Count files with complex patterns
    let complexFiles = 0;
    files.forEach(file => {
        const content = file.sourceCode;
        const hasClasses = /class\s+\w+/.test(content);
        const hasInterfaces = /interface\s+\w+/.test(content);
        const hasFunctions = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length > 5;
        const hasComplexLogic = /if|switch|for|while|try|catch/.test(content);
        
        if ((hasClasses || hasInterfaces) && hasFunctions && hasComplexLogic) {
            complexFiles++;
        }
    });
    
    const complexityRatio = complexFiles / totalFiles;
    
    if (complexityRatio < 0.3) return 'Low';
    if (complexityRatio < 0.7) return 'Medium';
    return 'High';
};

const calculateDocumentation = (files: { fileName: string; sourceCode: string }[]): number => {
    let documentedFiles = 0;
    
    files.forEach(file => {
        const content = file.sourceCode;
        const hasComments = /\/\*[\s\S]*?\*\/|\/\/.*$/m.test(content);
        const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(content);
        const hasTypeAnnotations = /:.*?=>|:\s*(string|number|boolean|object)/.test(content);
        
        if (hasComments || hasJSDoc || hasTypeAnnotations) {
            documentedFiles++;
        }
    });
    
    return Math.round((documentedFiles / files.length) * 100);
};

export const analyzeRepository = async (projectId: string): Promise<RepositoryStats> => {
    const files = await db.sourceCodeEmbedding.findMany({
        where: { projectId },
        select: {
            fileName: true,
            sourceCode: true,
        },
    });
    
    const stats: RepositoryStats = {
        totalFiles: files.length,
        totalLines: 0,
        fileTypes: {},
        directoryStructure: { name: 'root', type: 'directory', children: [] },
        languages: {},
        codeQuality: {
            avgFileSize: 0,
            complexity: 'Low',
            documentation: 0,
        },
    };
    
    let totalSize = 0;
    
    files.forEach(file => {
        const lines = countLines(file.sourceCode);
        const extension = '.' + file.fileName.split('.').pop();
        const language = getLanguageFromExtension(extension);
        const size = file.sourceCode.length;
        
        stats.totalLines += lines;
        totalSize += size;
        
        // Count file types
        stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1;
        
        // Count languages
        if (!stats.languages[language]) {
            stats.languages[language] = { files: 0, lines: 0 };
        }
        stats.languages[language].files++;
        stats.languages[language].lines += lines;
    });
    
    // Build directory structure
    stats.directoryStructure = buildDirectoryStructure(files);
    
    // Calculate code quality metrics
    stats.codeQuality.avgFileSize = Math.round(totalSize / files.length);
    stats.codeQuality.complexity = calculateComplexity(files);
    stats.codeQuality.documentation = calculateDocumentation(files);
    
    return stats;
}; 