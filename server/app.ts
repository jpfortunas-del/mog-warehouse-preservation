import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./trpc";

// Express app with just the API mounted — no dev/static serving here, so this same
// instance can be reused both by the local Node server (server/index.ts) and by the
// Vercel serverless entrypoint (api/index.ts).
export function createApp() {
  const app = express();

  app.use(express.json());

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
