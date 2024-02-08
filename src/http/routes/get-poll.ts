import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { object, z } from "zod";
import { redis } from "../../lib/redis";

export async function getPoll(app: FastifyInstance) {
  app.get("/polls/:pollId", async (request, reply) => {
    const getPollParams = z.object({ pollId: z.string().uuid() });

    const { pollId } = getPollParams.parse(request.params);

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          select: { id: true, title: true },
        },
      },
    });

    if (!poll) {
      return reply.status(404).send({ message: "Enquete não encontrada!" });
    }

    const resultado = await redis.zrange(pollId, 0, -1, "WITHSCORES");
    const votes = resultado.reduce((obj, line, index) => {
      if (index % 2 === 0) {
        const score = resultado[index + 1];
        Object.assign(obj, { [line]: Number(score) });
      }
      return obj;
    }, {} as Record<string, number>);
    return reply.send({
      poll: {
        id: poll.id,
        title: poll.title,
        options: poll.options.map((option) => {
          return { id: poll.id, title: poll.title, score: (option.id in votes)? votes[option.id]:0 };
        }),
      },
    });
  });
}
