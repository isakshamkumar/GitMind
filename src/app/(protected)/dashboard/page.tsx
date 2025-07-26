'use client'
import useProject from '@/hooks/use-project'
import { ExternalLink, Github, GitBranch, Calendar, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import ChatCard from './ask-question-card'
import CommitLog from './commit-log'
import ArchiveButton from './archive-button'
import InviteButton from './invite-button'
import TeamMembers from './team-members'
import RepositoryAnalysis from './repository-analysis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const DashboardPage = () => {
    const { project } = useProject()

    if (!project) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-4">
                    <Github className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <div>
                        <h2 className="text-xl font-semibold text-muted-foreground">No Project Selected</h2>
                        <p className="text-sm text-muted-foreground">Select a project from the sidebar or create a new one</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Project Header */}
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                        <p className="text-muted-foreground">
                            AI-powered analysis of your GitHub repository with comprehensive insights
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <TeamMembers />
                        <InviteButton />
                        <ArchiveButton />
                    </div>
                </div>

                {/* Repository Info Card */}
                <Card className="border-l-4 border-l-primary/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-primary/10 p-3">
                                <Github className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">Connected Repository</h3>
                                    <Badge variant="outline" className="text-xs border-primary/20">
                                        <GitBranch className="w-3 h-3 mr-1" />
                                        main
                                    </Badge>
                                </div>
                                <Link
                                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                                    href={project.githubUrl ?? ''}
                                    target="_blank"
                                >
                                    {project.githubUrl}
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content with Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                        Chat
                    </TabsTrigger>
                    <TabsTrigger value="commits" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Commits
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Analysis
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Chat Interface */}
                        <ChatCard />

                        {/* Quick Stats Card */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    Quick Overview
                                </CardTitle>
                                <CardDescription>
                                    Repository statistics at a glance
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center">
                                    <p className="text-muted-foreground">Repository analysis loading...</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Switch to the Analysis tab for detailed insights
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Commits Preview */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <CardTitle>Recent Activity</CardTitle>
                                </div>
                                <Link 
                                    href="#" 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        // Switch to commits tab
                                        const commitsTab = document.querySelector('[value="commits"]') as HTMLButtonElement;
                                        commitsTab?.click();
                                    }}
                                    className="text-sm text-primary hover:underline"
                                >
                                    View all commits →
                                </Link>
                            </div>
                            <CardDescription>
                                Latest changes to your repository
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CommitLog />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="chat">
                    <ChatCard />
                </TabsContent>

                <TabsContent value="commits">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                <CardTitle>Commit History</CardTitle>
                            </div>
                            <CardDescription>
                                Complete commit history with AI-generated summaries
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CommitLog />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analysis">
                    <RepositoryAnalysis />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default DashboardPage