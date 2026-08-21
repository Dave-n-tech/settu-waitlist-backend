import express, { type Express } from 'express';
import cors from 'cors';
import { router } from './router.js';
import { config } from './config.js';

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', router);
  return app;
}

const app = createApp();
app.listen(config.PORT, () => {
  console.log(`Settu waitlist server running on port ${config.PORT}`);
});