'use client'
import MDEditor from '@uiw/react-md-editor';
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { generate } from './action'
import { readStreamableValue } from 'ai/rsc'
import { Badge } from '@/components/ui/badge';

type Props = {}

const AskQuestionCard = (props: Props) => {
    const [open, setOpen] = React.useState(false)
    const [question, setQuestion] = React.useState('')
    const [answer, setAnswer] = React.useState('')
    const [filesReferenced, setFilesReferenced] = React.useState<string[]>([])
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setAnswer('')
        e.preventDefault()
        setOpen(true)
        const { output, filesReferenced } = await generate(question)
        setFilesReferenced(filesReferenced)
        for await (const delta of readStreamableValue(output)) {
            if (delta) {
                setAnswer(prev => prev + delta);
            }
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='sm:max-w-[80vw]'>
                    <MDEditor.Markdown source={answer} className='flex-1 w-full !h-full' />
                    {filesReferenced.length > 0 && <div>
                        {filesReferenced.map(file => <Badge key={file}>{file}</Badge>)}
                    </div>}
                    {/* <Button className="mt-2" onClick={() => setOpen(false)}>
                        Thank you Dionysus!
                    </Button> */}
                </DialogContent>
            </Dialog>
            <Card className="relative col-span-3">
                <CardHeader>
                    <CardTitle>Ask a question</CardTitle>
                    <CardDescription>
                        Dionysus has knowledge of the codebase
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <Textarea
                            placeholder="Which file should I edit to change the home page?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                        <Button isLoading={false} className="mt-4">
                            Ask Dionysus!
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    )
}

export default AskQuestionCard