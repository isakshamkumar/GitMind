import { api } from '@/trpc/react'
import { useLocalStorage } from 'usehooks-ts'
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const useProject = () => {
    const { data: projects, isLoading } = api.project.getAll.useQuery()
    const [projectId, setProjectId] = useLocalStorage('d-projectId', '')
    const searchParams = useSearchParams()
    const router = useRouter()
    
    // Get project ID from URL params
    const urlProjectId = searchParams.get('project')
    
    // Use URL project ID if available, otherwise fall back to localStorage
    const currentProjectId = urlProjectId || projectId
    const project = projects?.find(project => project.id === currentProjectId)

    // Sync URL with localStorage when project changes
    React.useEffect(() => {
        if (urlProjectId && urlProjectId !== projectId) {
            setProjectId(urlProjectId)
        }
    }, [urlProjectId, projectId, setProjectId])

    React.useEffect(() => {
        if (project) return
        const timeout = setTimeout(() => {
            router.push(`/create`)
        }, 1000)
        return () => clearTimeout(timeout)
    }, [project, router])

    return {
        projects,
        projectId: currentProjectId,
        isLoading,
        setProjectId,
        project,
    }
}

export default useProject