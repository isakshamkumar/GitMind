import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const conversationRouter = createTRPCRouter({
    // Save a full conversation
    saveConversation: protectedProcedure
        .input(z.object({ 
            projectId: z.string(), 
            title: z.string().min(1),
            messages: z.array(z.object({
                role: z.enum(['user', 'assistant']),
                content: z.string().min(1),
                filesReferenced: z.array(z.object({ 
                    fileName: z.string().min(1), 
                    sourceCode: z.string().min(1) 
                })).optional()
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            const conversation = await ctx.db.conversation.create({
                data: {
                    title: input.title,
                    projectId: input.projectId,
                    userId: ctx.user.userId!,
                    messages: {
                        create: input.messages.map((msg, index) => ({
                            role: msg.role,
                            content: msg.content,
                            filesReferenced: msg.filesReferenced,
                        }))
                    }
                },
                include: {
                    messages: true
                }
            });
            return conversation;
        }),

    // Get all conversations for a project
    getAllConversations: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.db.conversation.findMany({ 
                where: { projectId: input.projectId }, 
                include: { 
                    user: true,
                    messages: {
                        orderBy: { createdAt: 'asc' }
                    }
                }, 
                orderBy: { updatedAt: 'desc' } 
            });
        }),

    // Get a single conversation with messages
    getConversation: protectedProcedure
        .input(z.object({ conversationId: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.db.conversation.findUnique({
                where: { id: input.conversationId },
                include: {
                    user: true,
                    messages: {
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });
        }),

    // Add a message to existing conversation
    addMessage: protectedProcedure
        .input(z.object({
            conversationId: z.string(),
            role: z.enum(['user', 'assistant']),
            content: z.string().min(1),
            filesReferenced: z.array(z.object({ 
                fileName: z.string().min(1), 
                sourceCode: z.string().min(1) 
            })).optional()
        }))
        .mutation(async ({ ctx, input }) => {
            const message = await ctx.db.message.create({
                data: {
                    conversationId: input.conversationId,
                    role: input.role,
                    content: input.content,
                    filesReferenced: input.filesReferenced,
                }
            });

            // Update conversation's updatedAt
            await ctx.db.conversation.update({
                where: { id: input.conversationId },
                data: { updatedAt: new Date() }
            });

            return message;
        }),

    // Delete a conversation
    deleteConversation: protectedProcedure
        .input(z.object({ conversationId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.conversation.delete({
                where: { id: input.conversationId }
            });
        }),

    // Update conversation title
    updateConversationTitle: protectedProcedure
        .input(z.object({ 
            conversationId: z.string(),
            title: z.string().min(1)
        }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.db.conversation.update({
                where: { id: input.conversationId },
                data: { 
                    title: input.title,
                    updatedAt: new Date()
                }
            });
        }),
}); 