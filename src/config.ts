import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  GMAIL_USER: z.email(),
  GMAIL_APP_PASSWORD: z.string().min(1),
  NOTIFY_EMAIL: z.email(),
  ADMIN_API_KEY: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000)
});

export const config = environmentSchema.parse(process.env);