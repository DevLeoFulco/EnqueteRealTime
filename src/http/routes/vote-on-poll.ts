import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

export async function voteOnPoll(app: FastifyInstance) {
  app.post("/polls/:pollId/votes", async (request, reply) => {
    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid(),
    });

    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    });

    const { pollId } = voteOnPollParams.parse(request.params);
    const { pollOptionId } = voteOnPollBody.parse(request.body);

    let { sectionId } = request.cookies;

    if (sectionId) {
      const verificarVotoAnteriorDoUsuario = await prisma.vote.findUnique({
        where: {
          sectionId_pollId: { sectionId, pollId },
        },
      });
      if (verificarVotoAnteriorDoUsuario && verificarVotoAnteriorDoUsuario.pollOptionId != pollOptionId) {
        await prisma.vote.delete({
          where: {
            id: verificarVotoAnteriorDoUsuario.id,
          }
        })
          
      }else if (verificarVotoAnteriorDoUsuario) {
        return reply.status(400).send({
          message: "Você já votou nesta enquete!",
        });
      }
    }

    if (!sectionId) {
      sectionId = randomUUID();

      reply.setCookie("sectionId", sectionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        signed: true,
        httpOnly: true,
      });
    }

    await prisma.vote.create({
      data: {
        sectionId,
        pollId,
        pollOptionId,
      },
    });

    return reply.status(201).send();
  });
}
