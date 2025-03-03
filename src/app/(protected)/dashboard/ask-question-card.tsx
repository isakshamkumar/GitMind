'use client'
import MDEditor from '@uiw/react-md-editor';
import { MarkdownPreviewRef } from '@uiw/react-markdown-preview'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { generate } from './action'
import { readStreamableValue } from 'ai/rsc'
import CodeReferences from './code-references';
import Image from 'next/image';
import { DownloadIcon } from 'lucide-react';
import { api } from '@/trpc/react';
import useProject from '@/hooks/use-project';
import { toast } from 'sonner';

type Props = {}

const AskQuestionCard = (props: Props) => {
    const [open, setOpen] = React.useState(false)
    const [question, setQuestion] = React.useState('')
    const [isLoading, setIsLoading] = React.useState(false)
    const [answer, setAnswer] = React.useState('')
    const saveAnswer = api.question.saveAnswer.useMutation()
    const { projectId } = useProject()

    const answerRef = React.useRef<MarkdownPreviewRef>(null)
    const [filesReferenced, setFilesReferenced] = React.useState<Awaited<ReturnType<typeof generate>>['filesReferenced']>([])
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        if (!projectId) return
        setAnswer('')
        e.preventDefault()
        setIsLoading(true)
        const { output, filesReferenced } = await generate(question, projectId)
        setOpen(true)
        setFilesReferenced(filesReferenced)
        for await (const delta of readStreamableValue(output)) {
            if (delta) {
                setAnswer(prev => prev + delta);
                const el = document.querySelector('.custom-ref')
                if (el) {
                    el.scrollTop = el.scrollHeight;
                }
            }
        }
        setIsLoading(false)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(open) => {
                setOpen(open)
                if (!open) {
                    setQuestion('')
                }
            }}>
                <DialogContent className='sm:max-w-[90vw] h-[85vh] overflow-hidden'>
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                            <DialogTitle>
                                <Image src="/logo.png" alt="Logo" width={40} height={40} />
                            </DialogTitle>
                            <Button 
                                isLoading={saveAnswer.isPending || isLoading} 
                                variant="outline" 
                                onClick={() => {
                                    saveAnswer.mutate({
                                        projectId,
                                        question,
                                        answer,
                                        filesReferenced
                                    }, {
                                        onSuccess: () => toast.success('Answer saved'),
                                        onError: () => toast.error('Failed to save answer')
                                    })
                                }}
                            >
                                <DownloadIcon className="w-4 h-4 mr-2" />
                                Save Answer
                            </Button>
                        </div>
                        <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
                    </div>
                    <div className="mb-1 bg-muted/50 p-2 rounded-lg">
                        <h4 className="text-sm font-medium text-foreground mb-2">Question</h4>
                        <p className="text-sm text-foreground/90">{question}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 h-[calc(85vh-100px)]">
                        {/* Left side - Answer */}
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-foreground">Answer</h3>
                                <span className="text-xs text-muted-foreground">AI Generated Response</span>
                            </div>
                            <div className="flex-1 border rounded-lg bg-card relative">
                                <div className="absolute inset-0 p-6 overflow-y-auto">
                                    <MDEditor.Markdown 
                                        source={answer} 
                                        className='w-full prose prose-sm dark:prose-invert max-w-none custom-ref'
                                        style={{ 
                                            backgroundColor: 'transparent',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.75',
                                            color: 'hsl(var(--foreground))',
                                        }}
                                        components={{
                                            code({ children }) {
                                                return <code className="bg-muted px-1 py-0.5 rounded-sm">{children}</code>
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right side - Referenced Files */}
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-foreground">Referenced Files</h3>
                                <span className="text-xs text-muted-foreground">{filesReferenced.length} files</span>
                            </div>
                            <div className="flex-1 border rounded-lg bg-card">
                                <CodeReferences filesReferenced={filesReferenced} />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Card className="relative col-span-3">
                <CardHeader>
                    <CardTitle>Ask a question</CardTitle>
                    <CardDescription>
                        GitMind has knowledge of the codebase
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <Textarea
                            placeholder="Which file should I edit to change the home page?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                        <Button isLoading={isLoading} className="mt-4">
                            Ask GitMind!
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    )
}

export default AskQuestionCard