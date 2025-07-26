'use client'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import useProject from '@/hooks/use-project'
import { api } from '@/trpc/react'
import MDEditor from "@uiw/react-md-editor"
import React from 'react'
import CodeReferences from "../dashboard/code-references"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Bot, Code2, MessageCircle, Calendar } from "lucide-react"
import AskQuestionCard from "../dashboard/ask-question-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'

const QuestionList = () => {
  const { projectId } = useProject()
  const { data: questions, isLoading } = api.question.getAllQuestions.useQuery({ projectId })
  const [questionIdx, setQuestionIdx] = React.useState(0)
  const question = questions?.[questionIdx]
  if (isLoading) {
    return <div>
      <Loader2 className="animate-spin" />
    </div>
  }
  return (
    <div className="space-y-6">
      <AskQuestionCard />
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved Q&A</h1>
        <p className="text-muted-foreground">
          Your saved questions and answers with GitMind AI assistant
        </p>
      </div>

      {!questions || questions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-semibold text-muted-foreground">No questions yet</h3>
                <p className="text-sm text-muted-foreground">
                  Ask a question in the chat above and save it to see it here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {questions.map((question, idx) => {
            const referencedFiles = (question.filesReferenced as any[]) || []
            
            return (
              <Sheet key={question.id}>
                <SheetTrigger onClick={() => setQuestionIdx(idx)}>
                  <Card className="group hover:shadow-md transition-all duration-200 text-left w-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Image 
                            src={question.user.imageUrl ?? '/default-avatar.png'} 
                            alt="Avatar" 
                            width={40} 
                            height={40} 
                            className="rounded-full" 
                          />
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2">
                              {question.question}
                            </CardTitle>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDistanceToNow(question.createdAt, { addSuffix: true })}
                              </div>
                              {referencedFiles.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Code2 className="h-3 w-3" />
                                  {referencedFiles.length} files referenced
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Answer:</p>
                        <p className="text-sm text-muted-foreground line-clamp-3">{question.answer}</p>
                      </div>
                    </CardContent>
                  </Card>
                </SheetTrigger>
                
                {question && (
                  <SheetContent className="sm:max-w-[95vw] max-w-[95vw] h-[95vh] overflow-hidden flex flex-col">
                    <SheetHeader className="flex-shrink-0 pb-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <SheetTitle className="text-lg font-semibold text-left">{question.question}</SheetTitle>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(question.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </SheetHeader>
                    
                    <div className="flex-1 min-h-0">
                      <ResizablePanelGroup direction="horizontal" className="h-full">
                        {/* Answer Area */}
                        <ResizablePanel defaultSize={65} minSize={40}>
                          <div className="flex flex-col h-full min-h-0 pr-3">
                            <ScrollArea className="flex-1 p-4 bg-muted/20 rounded-lg border min-h-0">
                              <div className="space-y-4">
                                <div className="bg-primary/10 rounded-lg p-4 border-l-4 border-l-primary">
                                  <p className="text-sm font-medium text-muted-foreground mb-2">Question:</p>
                                  <p className="text-sm">{question.question}</p>
                                </div>
                                
                                <div className="bg-card rounded-lg p-4 border">
                                  <p className="text-sm font-medium text-muted-foreground mb-2">Answer:</p>
                                  <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <MDEditor.Markdown 
                                      source={question.answer} 
                                      style={{ 
                                        backgroundColor: 'transparent',
                                        fontSize: '0.875rem'
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </ScrollArea>
                          </div>
                        </ResizablePanel>
                        
                        <ResizableHandle withHandle />
                        
                        {/* Referenced Files */}
                        <ResizablePanel defaultSize={35} minSize={25}>
                          <div className="flex flex-col h-full min-h-0 pl-3">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b flex-shrink-0">
                              <div className="flex items-center gap-2">
                                <Code2 className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-sm font-medium">Referenced Files</h3>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {referencedFiles.length}
                              </Badge>
                            </div>
                            <div className="flex-1 border rounded-lg bg-card overflow-hidden min-h-0">
                              <CodeReferences filesReferenced={referencedFiles} />
                            </div>
                          </div>
                        </ResizablePanel>
                      </ResizablePanelGroup>
                    </div>
                  </SheetContent>
                )}
              </Sheet>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default QuestionList