'use client'
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import React, { useReducer, useRef } from 'react'
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { ArrowRight } from 'lucide-react';
import useRefetch from '@/hooks/use-refetch';


type FormInput = {
    repoUrl: string
    projcetName: string
}

const CreateProjectPage = () => {
    const { register, handleSubmit, reset } = useForm<FormInput>();
    const linkRepo = api.project.create.useMutation();
    const refetch = useRefetch()

    const router = useRouter()
    const onSubmit = async (data: FormInput) => {
        linkRepo.mutate({
            githubUrl: data.repoUrl,
            name: data.projcetName,
        }, {
            onSuccess: () => {
                toast.success("Project created successfully");
                router.push(`/dashboard`)
                refetch()
                reset()
            },
            onError: () => {
                toast.error("Failed to create project");
            },
        });
    };

    return (
        <div className='flex items-center gap-12 h-full justify-center'>
            {/* TODO: add github api search */}
            <img src='/undraw_github.svg' className='h-56 w-auto' />
            <div>
                <div>
                    <h1 className='font-semibold text-2xl'>Link your GitHub Repository</h1>
                    <p className='text-sm text-muted-foreground'>
                        Enter the URL of your GitHub repository to link it to Dionysus.
                    </p>
                </div>
                <div className="h-4"></div>
                <div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Input
                            {...register("repoUrl", { required: true })}
                            required
                            type='url'
                            placeholder="https://github.com/username/repo"
                        />
                        <div className="h-2"></div>
                        <Input
                            required
                            {...register("projcetName", { required: true })}
                            placeholder="Project Name"
                        />
                        <Button type="submit" isLoading={linkRepo.isPending} className="mt-4">
                            Create Project <ArrowRight className='size-4' />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateProjectPage