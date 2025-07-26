"use client";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Commit, Project } from "@prisma/client";
import { ExternalLink, GitGraph, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import useProject from "@/hooks/use-project";
import useRefetch from "@/hooks/use-refetch";
import { formatDistanceToNow } from "date-fns";

export default function CommitLog() {
    const { projectId, project } = useProject();
    const { data: commits } = api.project.getCommits.useQuery({ projectId });
    
    if (!commits || commits.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <GitGraph className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No commits yet</h3>
                <p className="text-sm text-muted-foreground">
                    Commits will appear here once your repository is analyzed
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {commits.map((commit, commitIdx) => (
                <div key={commit.id} className="relative flex gap-x-4">
                    <div
                        className={cn(
                            commitIdx === commits.length - 1 ? "h-6" : "-bottom-6",
                            "absolute left-0 top-0 flex w-6 justify-center",
                        )}
                    >
                        <div className="w-px translate-x-1 bg-border" />
                    </div>
                    <div className="relative mt-3 h-8 w-8 flex-none rounded-full overflow-hidden ring-2 ring-background">
                        <img
                            src={commit.commitAuthorAvatar}
                            alt={commit.commitAuthorName}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="flex-auto rounded-lg border bg-card p-4">
                        <div className="flex justify-between items-start gap-x-4 mb-3">
                            <div className="flex-1">
                                <h4 className="font-semibold text-card-foreground mb-1">
                                    {commit.commitMessage}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-medium">{commit.commitAuthorName}</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <time dateTime={commit.commitDate.toString()}>
                                            {formatDistanceToNow(commit.commitDate, {
                                                addSuffix: true,
                                            })}
                                        </time>
                                    </div>
                                </div>
                            </div>
                            <Link
                                target="_blank"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                href={`${project?.githubUrl}/commits/${commit.commitHash}`}
                            >
                                View on GitHub
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                        {commit.summary && (
                            <div className="prose prose-sm text-muted-foreground max-w-none">
                                <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                                    {commit.summary}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
