import { object, z } from "zod";
import { FastifyInstance } from "fastify";
import { voting } from "../../utils/voting-pub-sub";

export async function pollResult(app: FastifyInstance) {
  app.get(
    "/polls/:pollId/result",
    { websocket: true },
    (connection, request) => {
      connection.socket.on("message", (message: string) => {
        const getPollParams = z.object({ pollId: z.string().uuid() });

        const { pollId } = getPollParams.parse(request.params);
        voting.subscribe(pollId, (message) => {
          connection.socket.send(JSON.stringify(message));
        });
      });
    }
  );
}
