import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), githubUrl: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      console.log('user', ctx.user.userId)
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

      return project;
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      where: {
        userToProjects: { some: { userId: ctx.user.userId! } },
      },
    });
  }),
});
