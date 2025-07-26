'use client'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { api } from '@/trpc/react'
import useProject from '@/hooks/use-project'
import { 
    BarChart3, 
    FileText, 
    Code2, 
    FolderTree, 
    Target, 
    BookOpen,
    TrendingUp,
    GitBranch
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const RepositoryAnalysis = () => {
    const { projectId } = useProject()
    const { data: stats, isLoading } = api.project.getRepositoryStats.useQuery(
        { projectId },
        { enabled: !!projectId }
    )

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-20" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!stats) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Repository analysis not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const topLanguages = Object.entries(stats.languages)
        .sort((a, b) => b[1].lines - a[1].lines)
        .slice(0, 5)

    const topFileTypes = Object.entries(stats.fileTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

    const getComplexityColor = (complexity: string) => {
        switch (complexity) {
            case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
            case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300'
            case 'High': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
        }
    }

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
        return num.toString()
    }

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(stats.totalFiles)}</div>
                        <p className="text-xs text-muted-foreground">
                            Indexed files
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lines of Code</CardTitle>
                        <Code2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(stats.totalLines)}</div>
                        <p className="text-xs text-muted-foreground">
                            Avg {Math.round(stats.totalLines / stats.totalFiles)} per file
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Complexity</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={getComplexityColor(stats.codeQuality.complexity)}>
                                {stats.codeQuality.complexity}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Code complexity level
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documentation</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.codeQuality.documentation}%</div>
                        <div className="mt-2">
                            <Progress value={stats.codeQuality.documentation} className="h-2" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Files with documentation
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Languages and File Types */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Top Languages
                        </CardTitle>
                        <CardDescription>Distribution by lines of code</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {topLanguages.map(([language, data], index) => {
                            const percentage = Math.round((data.lines / stats.totalLines) * 100)
                            return (
                                <div key={language} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full`} 
                                                 style={{backgroundColor: `hsl(${index * 60}, 70%, 50%)`}} />
                                            <span className="font-medium">{language}</span>
                                        </div>
                                        <div className="text-muted-foreground">
                                            {formatNumber(data.lines)} lines ({percentage}%)
                                        </div>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            File Types
                        </CardTitle>
                        <CardDescription>Most common file extensions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {topFileTypes.map(([extension, count], index) => {
                            const percentage = Math.round((count / stats.totalFiles) * 100)
                            return (
                                <div key={extension} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full`} 
                                                 style={{backgroundColor: `hsl(${index * 72}, 60%, 50%)`}} />
                                            <span className="font-mono font-medium">{extension}</span>
                                        </div>
                                        <div className="text-muted-foreground">
                                            {count} files ({percentage}%)
                                        </div>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>

            {/* Code Quality Insights */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        Code Quality Insights
                    </CardTitle>
                    <CardDescription>Analysis of code structure and maintainability</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center space-x-4 p-4 border rounded-lg">
                            <div className="text-2xl">📊</div>
                            <div>
                                <p className="text-sm font-medium">Average File Size</p>
                                <p className="text-2xl font-bold">{formatNumber(stats.codeQuality.avgFileSize)}</p>
                                <p className="text-xs text-muted-foreground">bytes per file</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 p-4 border rounded-lg">
                            <div className="text-2xl">🎯</div>
                            <div>
                                <p className="text-sm font-medium">Code Complexity</p>
                                <p className="text-2xl font-bold">{stats.codeQuality.complexity}</p>
                                <p className="text-xs text-muted-foreground">maintainability</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 p-4 border rounded-lg">
                            <div className="text-2xl">📚</div>
                            <div>
                                <p className="text-sm font-medium">Documentation</p>
                                <p className="text-2xl font-bold">{stats.codeQuality.documentation}%</p>
                                <p className="text-xs text-muted-foreground">coverage</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default RepositoryAnalysis 