'use client'
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import React, { useReducer, useRef } from 'react'
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { AlertTriangle, ArrowRight, FileText, Github, Info, Key } from 'lucide-react';
import useRefetch from '@/hooks/use-refetch';
import { createCheckoutSession } from '@/lib/stripe';
import { useLocalStorage } from 'usehooks-ts';
import { MultiStepLoader } from '@/components/ui/multi-step-loader';
import { IconSquareRoundedX } from '@tabler/icons-react';

type FormInput = {
    repoUrl: string
    projcetName: string
    githubToken?: string
}

const loadingStates = [
    { text: "Analyzing repository structure..." },
    { text: "Downloading repository files..." },
    { text: "Processing code files..." },
    { text: "Generating AI summaries..." },
    { text: "Creating embeddings..." },
    { text: "Analyzing commit history..." },
    { text: "Indexing repository..." },
    { text: "Finalizing project setup..." },
];

const CreateProjectPage = () => {
    const { register, handleSubmit, reset, watch } = useForm<FormInput>();
    const linkRepo = api.project.create.useMutation();
    const checkCredits = api.project.checkCredits.useMutation()
    const refetch = useRefetch()
    const currentGithubToken = watch("githubToken");
    const [, setProjectId] = useLocalStorage('d-projectId', '');
    const [isCreating, setIsCreating] = React.useState(false);

    const router = useRouter()
    const onSubmit = async (data: FormInput) => {
        console.log('onSubmit', data);
        
        if (!data.repoUrl.startsWith('https://github.com/')) {
            toast.error("Please enter a valid GitHub repository URL");
            return;
        }
        if (!!!checkCredits.data) {
            checkCredits.mutate({
                githubUrl: data.repoUrl,
                githubToken: data.githubToken,
            }, {
                onError: (error) => {
                    if (error.message.includes("Bad credentials")) {
                        toast.error("Invalid GitHub token. Please check your token has correct permissions.");
                    } else if (error.message.includes("Not Found")) {
                        toast.error("Repository not found or no access. Please check the URL and token permissions.");
                    } else if (error.message.includes("rate limit") || error.message.includes("quota exhausted")) {
                        toast.error("GitHub rate limit reached. Please provide a GitHub token for higher limits or try again later.");
                    } else if (error.message.includes("Unable to access repository")) {
                        toast.error("Repository may be private. Please provide a GitHub token to access it.");
                    } else {
                        toast.error("Failed to check repository access. Please try again.");
                    }
                },
            })
        } else {
            setIsCreating(true);
            linkRepo.mutate({
                githubUrl: data.repoUrl,
                name: data.projcetName,
                githubToken: data.githubToken,
            }, {
                onSuccess: (createdProject) => {
                    setIsCreating(false);
                    toast.success("Project created successfully");
                    setProjectId(createdProject.id); // Set the project ID in localStorage
                    router.push(`/dashboard?project=${createdProject.id}`)
                    refetch()
                    reset()
                },
                onError: (error) => {
                    setIsCreating(false);
                    if (error.message.includes("Unable to access repository")) {
                        toast.error("Repository may be private and requires a GitHub token.");
                    } else if (error.message.includes("Not enough credits")) {
                        toast.error("Not enough credits to create this project.");
                    } else if (error.message.includes("Repository too large")) {
                        toast.error("Repository is too large for processing. Please use a smaller repository or contact support.");
                    } else if (error.message.includes("Failed to download repository")) {
                        toast.error("Failed to access repository. Please check the URL and try again.");
                    } else {
                        toast.error("Failed to create project. Please try again.");
                    }
                },
            });
        }
    };

    const hasEnoughCredits = checkCredits.data?.credits ? checkCredits.data?.credits >= checkCredits.data?.fileCount : true

    return (
        <>
            <MultiStepLoader 
                loadingStates={loadingStates} 
                loading={isCreating} 
                duration={3000}
                loop={false}
            />
            
            {isCreating && (
                <button
                    className="fixed top-4 right-4 text-black dark:text-white z-[120]"
                    onClick={() => setIsCreating(false)}
                >
                    <IconSquareRoundedX className="h-10 w-10" />
                </button>
            )}

            <div className='flex items-center gap-12 h-full justify-center'>
                {/* TODO: add github api search */}
                <img src='/undraw_github.svg' className='h-56 w-auto' />
                <div>
                    <div>
                        <h1 className='font-semibold text-2xl'>Link your GitHub Repository</h1>
                        <p className='text-sm text-muted-foreground'>
                            Enter the URL of your GitHub repository to link it to GitMind.
                        </p>
                    </div>  
                    <div className="h-4"></div>
                    <div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Input
                                icon={FileText}
                                required
                                {...register("projcetName", { required: true })}
                                placeholder="Project Name"
                            />
                            <div className="h-2"></div>
                            <Input
                                icon={Github}
                                {...register("repoUrl", { required: true })}
                                required
                                type='url'
                                placeholder="Github Repository URL"
                            />
                            <div className="h-2"></div>
                            <Input
                                icon={Key}
                                {...register("githubToken")}
                                placeholder="GitHub Token (Optional - for private repos and higher rate limits)"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                💡 Public repositories work without a token. Provide a token for private repos or to avoid rate limits.
                            </p>

                            {!!checkCredits.data &&
                                <>
                                    <div className="mt-4 bg-orange-50 px-4 py-2 rounded-md border border-orange-200 text-orange-700">
                                        <div className="flex items-center gap-2">
                                            <Info className='size-4' />
                                            <p className='text-sm'>
                                                {checkCredits.data?.fileCount === 150 && !currentGithubToken ? (
                                                    <>You will be charged an <strong>estimated {checkCredits.data?.fileCount}</strong> credits for this repository (actual count determined during indexing).</>
                                                ) : (
                                                    <>You will be charged <strong>{checkCredits.data?.fileCount}</strong> credits for this repository.</>
                                                )}
                                            </p>
                                        </div>
                                        <p className='text-sm text-blue-600 ml-6'>You have <strong>{checkCredits.data?.credits}</strong> credits remaining.</p>
                                        {checkCredits.data?.fileCount === 150 && !currentGithubToken && (
                                            <p className='text-xs text-gray-600 ml-6 mt-1'>
                                                💡 Provide a GitHub token for exact file count and access to private repositories.
                                            </p>
                                        )}
                                    </div>
                                    {!hasEnoughCredits &&
                                        <div className="mt-4 bg-red-50 px-4 py-2 rounded-md border border-red-200 text-red-700">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className='size-4' />
                                                <p className='text-sm text-red-500'>You do not have enough credits to create this project.</p>
                                            </div>
                                            <div className="h-2"></div>
                                            <Button type='button' variant='outline' onClick={() => createCheckoutSession(checkCredits.data?.fileCount - checkCredits.data?.credits)}>Buy {checkCredits.data?.fileCount - checkCredits.data?.credits} Credits</Button>
                                        </div>
                                    }
                                </>
                            }

                            <div className="h-4"></div>
                            <Button type="submit" disabled={!hasEnoughCredits || isCreating} isLoading={linkRepo.isPending || checkCredits.isPending}>
                                {checkCredits.data ? 'Create Project' : 'Check Credits'} <ArrowRight className='size-4' />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateProjectPage