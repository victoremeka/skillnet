import express, { Express } from "express";
import { registerRoutes } from "./routes";

const app: Express = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes
registerRoutes(app);

// Export for Vercel serverless
export default app;
