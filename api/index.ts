import { createApp } from "../server/app";

// Vercel Node.js Functions accept a plain Express app as the default export — it's
// invoked with the same (req, res) signature Express itself expects. All /api/* paths
// are rewritten to this single function (see vercel.json), and Express routes them
// internally exactly as it does in the local dev server (server/index.ts).
export default createApp();
