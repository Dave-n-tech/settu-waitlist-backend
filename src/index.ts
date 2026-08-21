import express, { type Express } from 'express';
import cors from 'cors';
import { router } from './router.js';
import { config } from './config.js';
import { healthCheck } from './controller.js';

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', router);
  return app;
}

const app = createApp();

app.get("/health", healthCheck);

app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`Settu waitlist server running on port ${config.PORT}`);
});