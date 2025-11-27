import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes
registerRoutes(app);

// Vercel serverless handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  // @ts-ignore - Express can handle Vercel request/response
  app(req, res);
}
