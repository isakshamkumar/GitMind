import { SignIn } from '@clerk/nextjs'

export default function Page() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <SignIn />
            </div>
        </div>
    )
}