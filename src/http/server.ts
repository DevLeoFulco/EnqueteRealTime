import { parse } from "./../../node_modules/secure-json-parse/types/index.d";
import fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import cookie from "@fastify/cookie";
import { createPoll } from "./routes/create-poll";
import { getPoll } from "./routes/get-poll";
import { voteOnPoll } from "./routes/vote-on-poll";
import fastifyWebsocket from "@fastify/websocket";
import { pollResult } from "./ws/poll-results";

const app = fastify();

app.register(cookie, {
  secret: "poll-app-secret",
  hook: "onRequest",
});
app.register(fastifyWebsocket);
app.register(createPoll);
app.register(getPoll);
app.register(voteOnPoll);
app.register(pollResult)

app.listen({ port: 3333 }).then(() => {
  console.log("HTTP Server running!");
});
