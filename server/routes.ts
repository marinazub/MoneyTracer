import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Define API endpoints if needed for future expansion
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // This is a client-side application with no server-side persistence needed
  // The server just serves the static files

  const httpServer = createServer(app);
  return httpServer;
}
