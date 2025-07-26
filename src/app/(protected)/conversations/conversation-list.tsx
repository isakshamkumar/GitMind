'use client'
import React from 'react'
import { api } from '@/trpc/react'
import useProject from '@/hooks/use-project'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import MDEditor from '@uiw/react-md-editor'
import { Bot, User, MessageCircle, Calendar, Trash2, Code2, FileIcon, Copy, CheckCircle, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import CodeReferences from '../dashboard/code-references'

const ConversationList = () => {
    const { projectId } = useProject()
    const { data: conversations, isLoading } = api.conversation.getAllConversations.useQuery(
        { projectId },
        { enabled: !!projectId }
    )
    const deleteConversation = api.conversation.deleteConversation.useMutation()
    const [selectedConversation, setSelectedConversation] = React.useState<typeof conversations[0] | null>(null)
    const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null)
    const [open, setOpen] = React.useState(false)

    const copyMessage = async (content: string, messageId: string) => {
        await navigator.clipboard.writeText(content)
        setCopiedMessageId(messageId)
        setTimeout(() => setCopiedMessageId(null), 2000)
        toast.success('Message copied to clipboard')
    }

    const handleDeleteConversation = (conversationId: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this conversation?')
        if (!confirmed) return

        deleteConversation.mutate({ conversationId }, {
            onSuccess: () => {
                toast.success('Conversation deleted successfully')
                if (selectedConversation?.id === conversationId) {
                    setSelectedConversation(null)
                    setOpen(false)
                }
            },
            onError: () => toast.error('Failed to delete conversation')
        })
    }

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date)
    }

    const getConversationPreview = (conversation: typeof conversations[0]) => {
        const firstUserMessage = conversation.messages.find(msg => msg.role === 'user')
        const firstAssistantMessage = conversation.messages.find(msg => msg.role === 'assistant')
        
        return {
            question: firstUserMessage?.content || 'No question',
            answer: firstAssistantMessage?.content || 'No response'
        }
    }

    const getReferencedFiles = (conversation: typeof conversations[0]) => {
        const allFiles: any[] = []
        conversation.messages.forEach(msg => {
            if (msg.filesReferenced && Array.isArray(msg.filesReferenced)) {
                allFiles.push(...msg.filesReferenced)
            }
        })
        
        // Remove duplicates based on fileName
        const uniqueFiles = allFiles.filter((file, index, self) => 
            index === self.findIndex(f => f.fileName === file.fileName)
        )
        
        return uniqueFiles
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Saved Conversations</h1>
                    <p className="text-muted-foreground">
                        Your saved conversations with GitMind AI assistant
                    </p>
                </div>

                {!conversations || conversations.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center space-y-4">
                                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                <div>
                                    <h3 className="text-lg font-semibold text-muted-foreground">No conversations yet</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Start a conversation in the dashboard and save it to see it here
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {conversations.map((conversation) => {
                            const preview = getConversationPreview(conversation)
                            const referencedFiles = getReferencedFiles(conversation)
                            
                            return (
                                <Card key={conversation.id} className="group hover:shadow-md transition-all duration-200">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg line-clamp-1">
                                                    {conversation.title}
                                                </CardTitle>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDistanceToNow(conversation.createdAt, { addSuffix: true })}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MessageCircle className="h-3 w-3" />
                                                        {conversation.messages.length} messages
                                                    </div>
                                                    {referencedFiles.length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <Code2 className="h-3 w-3" />
                                                            {referencedFiles.length} files
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteConversation(conversation.id)
                                                    }}
                                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-1">Question:</p>
                                                <p className="text-sm line-clamp-2">{preview.question}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-1">Response:</p>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{preview.answer}</p>
                                            </div>
                                            <div className="pt-2">
                                                <Dialog open={open && selectedConversation?.id === conversation.id} onOpenChange={(isOpen) => {
                                                    setOpen(isOpen)
                                                    if (!isOpen) setSelectedConversation(null)
                                                }}>
                                                    <DialogTrigger asChild>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => setSelectedConversation(conversation)}
                                                        >
                                                            View Full Conversation
                                                        </Button>
                                                    </DialogTrigger>
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
                                                                    <DialogTitle className="text-lg font-semibold">{conversation.title}</DialogTitle>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {formatDistanceToNow(conversation.createdAt, { addSuffix: true })} • {conversation.messages.length} messages
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </DialogHeader>
                                                        
                                                        <div className="flex-1 min-h-0">
                                                            <ResizablePanelGroup direction="horizontal" className="h-full">
                                                                {/* Messages Area */}
                                                                <ResizablePanel defaultSize={65} minSize={40}>
                                                                    <div className="flex flex-col h-full min-h-0 pr-3">
                                                                        <ScrollArea className="flex-1 p-4 space-y-6 bg-muted/20 rounded-lg border min-h-0">
                                                                            <div className="space-y-6">
                                                                                <AnimatePresence>
                                                                                    {conversation.messages.map((msg, index) => (
                                                                                        <motion.div 
                                                                                            key={`${msg.id}-${index}`}
                                                                                            initial={{ opacity: 0, y: 20 }}
                                                                                            animate={{ opacity: 1, y: 0 }}
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
                                                                                                                <span>{formatTime(new Date(msg.createdAt))}</span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <div className="space-y-3">
                                                                                                            <div className="flex items-center justify-between">
                                                                                                                <div className="flex items-center gap-2">
                                                                                                                    <span className="text-sm font-medium">GitMind Assistant</span>
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
                                                                                                                </div>
                                                                                                                <span className="text-xs text-muted-foreground">{formatTime(new Date(msg.createdAt))}</span>
                                                                                                            </div>
                                                                                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                                                                                <MDEditor.Markdown 
                                                                                                                    source={msg.content} 
                                                                                                                    style={{ 
                                                                                                                        backgroundColor: 'transparent',
                                                                                                                        fontSize: '0.875rem'
                                                                                                                    }}
                                                                                                                />
                                                                                                            </div>
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
                                                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                                                                {referencedFiles.length}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex-1 border rounded-lg bg-card overflow-hidden min-h-0">
                                                                            <CodeReferences filesReferenced={referencedFiles} />
                                                                        </div>
                                                                    </div>
                                                                </ResizablePanel>
                                                            </ResizablePanelGroup>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}

export default ConversationList 