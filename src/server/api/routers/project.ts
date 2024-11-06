import { z } from "zod";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { pollRepo } from "@/lib/github";
import { indexGithubRepo } from "@/lib/github-loader";
import { processMeeting } from "@/lib/assembly";
import { getEmbeddings } from "@/lib/gemini";
import pLimit from "p-limit";

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), githubUrl: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.$transaction(async (tx) => {
        const createdProject = await tx.project.create({
          data: {
            name: input.name,
            githubUrl: input.githubUrl,
          },
        });

        await tx.userToProject.create({
          data: {
            userId: ctx.user.userId!,
            projectId: createdProject.id,
          },
        });

        return createdProject;
      });
      await indexGithubRepo(project.id, input.githubUrl);
      return project;
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      where: {
        userToProjects: { some: { userId: ctx.user.userId! } },
      },
    });
  }),
  getCommits: protectedProcedure.input(z.object({ projectId: z.string() })).query(async ({ ctx, input }) => {
    pollRepo(input.projectId).then((commits) => {
      console.log(`polled ${commits.count} commits`)
    }).catch(console.error)
    return await ctx.db.commit.findMany({
      where: { projectId: input.projectId },
    });
  }),
  getAllMeetings: protectedProcedure.input(z.object({ projectId: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db.meeting.findMany({
      where: { projectId: input.projectId },
      include: {
        issues: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }),
  uploadMeeting: protectedProcedure.input(z.object({ projectId: z.string(), audio_url: z.string(), name: z.string() })).mutation(async ({ ctx, input }) => {
    const meeting = await ctx.db.meeting.create({
      data: {
        projectId: input.projectId,
        url: input.audio_url,
        name: input.name,
        createdById: ctx.user.userId!,
      },
    });
    return meeting;
  }),
  deleteMeeting: protectedProcedure.input(z.object({ meetingId: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.meeting.delete({ where: { id: input.meetingId } });
  }),
});
