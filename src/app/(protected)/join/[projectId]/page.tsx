import { db } from '@/server/db';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';

type Props = { params: Promise<{ projectId: string }> }

const JoinPage = async ({ params }: Props) => {
    const { projectId } = await params
    const { userId } = await auth();
    const user = await db.user.findUnique({
        where: {
            id: userId ?? "",
        },
    });
    if (!user) {
        return redirect("/sync-user");
    }

    const project = await db.project.findUnique({
        where: {
            id: projectId,
        },
    });
    if (!project) {
        return notFound();
    }

    try {
        await db.userToProject.create({
            data: {
                projectId,
                userId: user.id,
            },
        });
    } catch (error) {
        console.log('user already in project')
    }
    return redirect(`/dashboard`);
}

export default JoinPage