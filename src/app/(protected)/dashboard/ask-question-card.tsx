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
import { DownloadIcon, MessageCircle, Send, User, Bot, Sparkles, Code2, Copy, CheckCircle } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { api } from '@/trpc/react';
import useProject from '@/hooks/use-project';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';

type Props = {}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    filesReferenced?: Awaited<ReturnType<typeof generate>>['filesReferenced'];
}

const ChatCard = (props: Props) => {
    const [open, setOpen] = React.useState(false)
    const [message, setMessage] = React.useState('')
    const [isLoading, setIsLoading] = React.useState(false)
    const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([])
    const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null)
    const saveAnswer = api.question.saveAnswer.useMutation()
    const saveConversation = api.conversation.saveConversation.useMutation()
    const { projectId } = useProject()

    const chatContainerRef = React.useRef<HTMLDivElement>(null)
    const [filesReferenced, setFilesReferenced] = React.useState<Awaited<ReturnType<typeof generate>>['filesReferenced']>([])

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }

    // Get all unique files referenced in the conversation
    const getAllReferencedFiles = () => {
        const allFiles: any[] = []
        chatHistory.forEach(msg => {
            if (msg.role === 'assistant' && msg.filesReferenced) {
                allFiles.push(...msg.filesReferenced)
            }
        })
        
        // Remove duplicates based on fileName
        const uniqueFiles = allFiles.filter((file, index, self) => 
            index === self.findIndex(f => f.fileName === file.fileName)
        )
        
        return uniqueFiles
    }

    React.useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isLoading]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        if (!projectId || !message.trim()) return
        
        e.preventDefault()
        
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: message,
            timestamp: new Date()
        };

        setChatHistory(prev => [...prev, userMessage]);
        setMessage('');
        setIsLoading(true);

        // Add placeholder for assistant response
        const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            timestamp: new Date()
        };
        setChatHistory(prev => [...prev, assistantMessage]);

        try {
            const { output, filesReferenced } = await generate(userMessage.content, projectId);
            
            let accumulatedContent = '';
            for await (const delta of readStreamableValue(output)) {
                if (delta) {
                    accumulatedContent += delta;
                    setChatHistory(prev => 
                        prev.map(msg => 
                            msg.id === assistantMessage.id 
                                ? { ...msg, content: accumulatedContent, filesReferenced }
                                : msg
                        )
                    );
                }
            }
            
            // Files are now stored per message in chatHistory
        } catch (error) {
            setChatHistory(prev => 
                prev.map(msg => 
                    msg.id === assistantMessage.id 
                        ? { ...msg, content: '❌ Sorry, I encountered an error processing your message. Please try again.' }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    }

    const clearChat = () => {
        setChatHistory([]);
        // Files are now part of chatHistory, so no need to clear separately
    }

    const copyMessage = async (content: string, messageId: string) => {
        await navigator.clipboard.writeText(content);
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
        toast.success('Message copied to clipboard');
    }

    const saveCurrentChat = () => {
        if (chatHistory.length === 0) return;
        
        // Generate a title from the first user message
        const firstUserMessage = chatHistory.find(msg => msg.role === 'user');
        const title = firstUserMessage?.content ? 
            firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') : 
            'Untitled Conversation';
        
        // Save as full conversation
        saveConversation.mutate({
            projectId,
            title,
            messages: chatHistory.filter(msg => msg.content.trim()).map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                filesReferenced: msg.role === 'assistant' ? (msg.filesReferenced || []) : []
            }))
        }, {
            onSuccess: () => {
                toast.success('Conversation saved successfully');
                // Still save the last Q&A pair for backward compatibility
        const lastUserMessage = chatHistory.filter(msg => msg.role === 'user').slice(-1)[0];
        const lastAssistantMessage = chatHistory.filter(msg => msg.role === 'assistant').slice(-1)[0];
        
        if (lastUserMessage && lastAssistantMessage) {
            saveAnswer.mutate({
                projectId,
                question: lastUserMessage.content,
                answer: lastAssistantMessage.content,
                filesReferenced: lastAssistantMessage.filesReferenced || []
            });
        }
            },
            onError: () => toast.error('Failed to save conversation')
        });
    }

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(open) => {
                setOpen(open)
                if (!open) {
                    // Don't clear chat when closing
                }
            }}>
                <DialogContent className='sm:max-w-[95vw] max-w-[95vw] h-[95vh] overflow-hidden flex flex-col'>
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold">GitMind Assistant</DialogTitle>
                                <p className="text-sm text-muted-foreground">AI-powered code analysis</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={clearChat}
                                disabled={chatHistory.length === 0}
                                className="h-8"
                            >
                                Clear
                            </Button>
                            <Button 
                                isLoading={saveConversation.isPending || saveAnswer.isPending} 
                                variant="outline" 
                                size="sm"
                                onClick={saveCurrentChat}
                                disabled={chatHistory.length === 0}
                                className="h-8"
                            >
                                <DownloadIcon className="w-3 h-3 mr-1.5" />
                                Save Conversation
                            </Button>
                        </div>
                    </DialogHeader>
                    
                    <div className="flex-1 min-h-0">
                        <ResizablePanelGroup direction="horizontal" className="h-full">
                        {/* Chat Area */}
                            <ResizablePanel defaultSize={65} minSize={40}>
                                <div className="flex flex-col h-full min-h-0 pr-3">
                            <div 
                                ref={chatContainerRef}
                                        className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/20 rounded-lg border min-h-0"
                            >
                                {chatHistory.length === 0 && (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center space-y-4">
                                            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center">
                                                <Sparkles className="h-8 w-8 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2">Welcome to GitMind Chat</h3>
                                                <p className="text-muted-foreground text-sm max-w-sm">
                                                    Ask me anything about your codebase. I can help you understand functions, 
                                                    debug issues, or explain complex code patterns.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setMessage("What are the main components in this project?")}
                                                    className="text-xs"
                                                >
                                                    Project overview
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => setMessage("How does authentication work?")}
                                                    className="text-xs"
                                                >
                                                    Authentication
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => setMessage("Show me the API endpoints")}
                                                    className="text-xs"
                                                >
                                                    API endpoints
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <AnimatePresence>
                                    {chatHistory.map((msg, index) => (
                                        <motion.div 
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {msg.role === 'assistant' && (
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                            <div className={`group max-w-[80%] ${
                                                msg.role === 'user' 
                                                    ? 'bg-primary text-primary-foreground ml-12' 
                                                    : 'bg-card border border-border'
                                            } rounded-2xl overflow-hidden`}>
                                                <div className="p-4">
                                                    {msg.role === 'user' ? (
                                                        <div className="space-y-1">
                                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                                            <div className="flex items-center justify-between text-xs opacity-70">
                                                                <span>You</span>
                                                                <span>{formatTime(msg.timestamp)}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium">GitMind Assistant</span>
                                                                    {msg.content && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => copyMessage(msg.content, msg.id)}
                                                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            {copiedMessageId === msg.id ? (
                                                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                                            ) : (
                                                                                <Copy className="w-3 h-3" />
                                                                            )}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                                                            </div>
                                                            {msg.content ? (
                                                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                                                <MDEditor.Markdown 
                                                                    source={msg.content} 
                                                                    style={{ 
                                                                        backgroundColor: 'transparent',
                                                                        fontSize: '0.875rem'
                                                                    }}
                                                                />
                                                                        </div>
                                                            ) : (
                                                                isLoading && msg.id === chatHistory[chatHistory.length - 1]?.id && (
                                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                                        <div className="flex space-x-1">
                                                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                                                                        </div>
                                                                        <span className="text-sm">Thinking...</span>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {msg.role === 'user' && (
                                                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            
                                    {/* Chat Input - Fixed at bottom */}
                                    <div className="mt-4 flex-shrink-0">
                                        <form onSubmit={handleSubmit} className="w-full">
                                            <div className="flex gap-3 p-3 bg-muted/50 rounded-lg border w-full">
                                                <textarea
                                        placeholder="Ask anything about your codebase..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        disabled={isLoading}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSubmit(e as any);
                                                        }
                                                    }}
                                                    className="flex-1 min-w-0 border-0 bg-transparent focus-visible:outline-none focus-visible:ring-0 text-sm resize-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                                    rows={1}
                                                    style={{ 
                                                        minHeight: '36px',
                                                        maxHeight: '120px',
                                                        lineHeight: '1.5'
                                                    }}
                                    />
                                    <Button 
                                        type="submit" 
                                        disabled={isLoading || !message.trim()}
                                        size="sm"
                                                    className="h-9 w-9 p-0 flex-shrink-0"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </form>
                        </div>
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
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                            {getAllReferencedFiles().length}
                                </span>
                            </div>
                                    <div className="flex-1 border rounded-lg bg-card overflow-hidden min-h-0">
                                        <CodeReferences filesReferenced={getAllReferencedFiles()} />
                            </div>
                        </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </DialogContent>
            </Dialog>
            
            <Card className="relative group hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="text-lg">Start a Conversation</span>
                            <div className="flex items-center gap-1 mt-1">
                                <Sparkles className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs text-muted-foreground">AI-Powered</span>
                            </div>
                        </div>
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                        Chat with GitMind about your codebase. Get explanations, debug help, and insights 
                        from your repository&apos;s AI analysis.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={() => setOpen(true)} 
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        size="lg"
                    >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Open Chat Assistant
                        <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                </CardContent>
            </Card>
        </>
    )
}

export default ChatCard