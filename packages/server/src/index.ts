import { serve } from "@hono/node-server";
import app from "./app.js";
import { config } from "./config.js";
import { getDb } from "./db.js";
import { generationQueue } from "./services/queue.js";

// Initialize DB
getDb();
console.log("Database initialized");

// Restore any pending generations from before restart
generationQueue.restorePending();

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  }
);
