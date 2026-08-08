/**
 * Blood Connect GraphQL API — Server entry point.
 *
 * Express + Apollo Server 4 + WebSocket subscriptions.
 * Connects to Supabase PostgreSQL via Prisma.
 */

import { createServer } from "http";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import depthLimit from "graphql-depth-limit";

import { typeDefs } from "./schema/typeDefs.js";
import { resolvers, type GqlContext } from "./resolvers/index.js";
import { prisma } from "./db/client.js";
import { extractAuthFromHeader } from "./middleware/auth.js";

const PORT = parseInt(process.env.PORT ?? "4000", 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

async function main() {
  // ── Express app ──────────────────────────────────
  const app = express();
  const httpServer = createServer(app);

  // ── Executable schema ────────────────────────────
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // ── WebSocket server for subscriptions ───────────
  const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });
  const wsCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        // Extract auth from connection params
        const token = (ctx.connectionParams?.Authorization as string) ??
                      (ctx.connectionParams?.authorization as string) ?? "";
        const auth = extractAuthFromHeader(token.startsWith("Bearer ") ? token : `Bearer ${token}`);
        return { ...auth, prisma };
      },
    },
    wsServer,
  );

  // ── Apollo Server ────────────────────────────────
  const apollo = new ApolloServer<GqlContext>({
    schema,
    validationRules: [depthLimit(7)],
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wsCleanup.dispose();
            },
          };
        },
      },
    ],
    formatError: (formattedError) => {
      // Never leak internal stack traces in production
      if (process.env.NODE_ENV === "production") {
        return { message: formattedError.message, locations: formattedError.locations, path: formattedError.path };
      }
      return formattedError;
    },
  });

  await apollo.start();

  // ── Middleware ────────────────────────────────────

  // CORS
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

  // Rate limiting
  app.use(
    "/graphql",
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // generous for development; tighten in production
      standardHeaders: true,
      legacyHeaders: false,
      message: "Too many requests, please try again later.",
    }),
  );

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // GraphQL endpoint
  app.use(
    "/graphql",
    express.json({ limit: "1mb" }),
    expressMiddleware(apollo, {
      context: async ({ req }) => {
        const auth = extractAuthFromHeader(req.headers.authorization);
        return { ...auth, prisma };
      },
    }),
  );

  // ── Start ────────────────────────────────────────
  httpServer.listen(PORT, () => {
    console.log(`\n🩸 Blood Connect GraphQL API`);
    console.log(`   Server:        http://localhost:${PORT}/graphql`);
    console.log(`   Subscriptions: ws://localhost:${PORT}/graphql`);
    console.log(`   Health:        http://localhost:${PORT}/health`);
    console.log(`   Environment:   ${process.env.NODE_ENV ?? "development"}\n`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
