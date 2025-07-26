'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileIcon, FolderIcon } from 'lucide-react'

type Props = {
    filesReferenced: {
        fileName: string
        sourceCode: string
    }[]
}

const CodeReferences = ({ filesReferenced }: Props) => {
    const [tab, setTab] = React.useState(filesReferenced[0]?.fileName)
    
    React.useEffect(() => {
        if (filesReferenced.length > 0 && !filesReferenced.find(f => f.fileName === tab)) {
            setTab(filesReferenced[0]?.fileName || '')
        }
    }, [filesReferenced, tab])

    if (!filesReferenced.length) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="text-center space-y-3">
                    <FolderIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground">No files referenced</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Referenced files will appear here when the AI responds
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const getFileExtension = (fileName: string) => {
        return fileName.split('.').pop()?.toLowerCase() || 'text'
    }

    const getLanguageFromExtension = (extension: string) => {
        const languageMap: { [key: string]: string } = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'rb': 'ruby',
            'php': 'php',
            'go': 'go',
            'rs': 'rust',
            'java': 'java',
            'kt': 'kotlin',
            'swift': 'swift',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'sh': 'bash',
            'sql': 'sql'
        }
        return languageMap[extension] || 'text'
    }

    return (
        <div className="h-full flex flex-col">
            <Tabs defaultValue={tab} value={tab} onValueChange={(value) => setTab(value)} className="h-full flex flex-col">
                {/* Tab Headers */}
                <div className="flex-shrink-0 border-b bg-muted/30 max-h-32 overflow-hidden">
                    <ScrollArea className="w-full h-full">
                        <div className="flex flex-wrap gap-1 p-2">
                            {filesReferenced.map((file) => (
                                <button
                                    key={file.fileName}
                                    onClick={() => setTab(file.fileName)}
                                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 min-w-0 flex-shrink-0
                                        ${tab === file.fileName
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    <FileIcon className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate max-w-[100px]" title={file.fileName}>
                                        {file.fileName.split('/').pop()}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                    {filesReferenced.map((file) => (
                        <TabsContent 
                            key={file.fileName} 
                            value={file.fileName} 
                            className="h-full m-0 data-[state=active]:flex-1 overflow-hidden"
                        >
                            <div className="h-full flex flex-col overflow-hidden">
                                <div className="flex-shrink-0 p-3 pb-2 border-b">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <FileIcon className="h-4 w-4" />
                                        <span className="truncate" title={file.fileName}>
                                            {file.fileName}
                                        </span>
                                    </h4>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <ScrollArea className="h-full">
                                        <div className="p-3">
                                            <div className="rounded-md overflow-hidden border">
                                                <SyntaxHighlighter 
                                                    language={getLanguageFromExtension(getFileExtension(file.fileName))}
                                                    style={atomDark}
                                                    customStyle={{
                                                        margin: 0,
                                                        fontSize: '0.8rem',
                                                        lineHeight: '1.4',
                                                        background: 'transparent'
                                                    }}
                                                    wrapLines={true}
                                                    wrapLongLines={true}
                                                    showLineNumbers={true}
                                                    lineNumberStyle={{
                                                        minWidth: '3em',
                                                        paddingRight: '1em',
                                                        color: 'rgba(255,255,255,0.3)',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    {file.sourceCode}
                                                </SyntaxHighlighter>
                                            </div>
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        </div>
    )
}

export default CodeReferences