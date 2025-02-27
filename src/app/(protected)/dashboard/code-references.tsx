'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import React from 'react'

type Props = {
    filesReferenced: {
        fileName: string
        sourceCode: string
    }[]
}

const CodeReferences = ({ filesReferenced }: Props) => {
    const [tab, setTab] = React.useState(filesReferenced[0]?.fileName)
    if (!filesReferenced.length) return null
    return (
        <div className="h-full flex flex-col">
            <Tabs defaultValue={tab} value={tab} onValueChange={(value) => setTab(value)} className="h-full flex flex-col">
                <div className="overflow-x-auto scrollbar-hide flex gap-2 bg-muted/50 p-2 rounded-t-lg">
                    {filesReferenced.map((file) => (
                        <button
                            key={file.fileName}
                            onClick={() => setTab(file.fileName)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap
                                ${tab === file.fileName
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            {file.fileName}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-hidden">
                    {filesReferenced.map((file) => (
                        <TabsContent 
                            key={file.fileName} 
                            value={file.fileName} 
                            className="h-full m-0 rounded-b-lg data-[state=active]:flex-1"
                        >
                            <div className="h-full relative">
                                <div className="absolute inset-0 overflow-y-auto">
                                    <SyntaxHighlighter 
                                        language="javascript" 
                                        style={atomDark}
                                        className="!m-0 !rounded-t-none"
                                        customStyle={{
                                            margin: 0,
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        {file.sourceCode}
                                    </SyntaxHighlighter>
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