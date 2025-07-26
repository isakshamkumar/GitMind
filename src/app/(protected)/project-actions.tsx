'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2, Edit3, AlertTriangle } from 'lucide-react'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import useRefetch from '@/hooks/use-refetch'
import { useRouter } from 'next/navigation'
import useProject from '@/hooks/use-project'

interface ProjectActionsProps {
    projectId: string
    projectName: string
    onProjectDeleted?: () => void
}

const ProjectActions = ({ projectId, projectName, onProjectDeleted }: ProjectActionsProps) => {
    const [renameOpen, setRenameOpen] = React.useState(false)
    const [deleteOpen, setDeleteOpen] = React.useState(false)
    const [newName, setNewName] = React.useState(projectName)
    const [confirmText, setConfirmText] = React.useState('')
    
    // Note: We'll use archiveProject for both rename and delete for now
    const archiveProject = api.project.archiveProject.useMutation()
    const refetch = useRefetch()
    const router = useRouter()
    const { setProjectId } = useProject()

    const handleRename = async () => {
        if (!newName.trim()) {
            toast.error('Project name cannot be empty')
            return
        }

        // For now, we'll just show a message since renameProject doesn't exist yet
        toast.info('Rename functionality will be implemented soon')
        setRenameOpen(false)
    }

    const handleDelete = async () => {
        if (confirmText !== projectName) {
            toast.error('Please type the project name exactly to confirm deletion')
            return
        }

        archiveProject.mutate(
            { projectId },
            {
                onSuccess: () => {
                    toast.success('Project deleted successfully')
                    setDeleteOpen(false)
                    onProjectDeleted?.()
                    // Redirect to dashboard with no project selected
                    setProjectId('')
                    router.push('/dashboard')
                    refetch()
                },
                onError: (error: any) => {
                    toast.error('Failed to delete project: ' + error.message)
                }
            }
        )
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => setDeleteOpen(true)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Rename Dialog */}
            <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Rename Project</DialogTitle>
                        <DialogDescription>
                            Enter a new name for your project.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="col-span-3"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleRename()
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleRename} 
                            disabled={!newName.trim()}
                        >
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Project
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the project
                            <span className="font-semibold"> &ldquo;{projectName}&rdquo;</span> and all of its data.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="confirm">
                                Type <span className="font-mono font-bold">{projectName}</span> to confirm:
                            </Label>
                            <Input
                                id="confirm"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder={projectName}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleDelete()
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleDelete} 
                            isLoading={archiveProject.isPending}
                            disabled={confirmText !== projectName}
                        >
                            Delete Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ProjectActions 