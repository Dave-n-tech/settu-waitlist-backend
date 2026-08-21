import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  checkDatabaseConnection,
  createEntry,
  getAllEntries
} from './service.js';
import { sendSignupNotification } from './email.js';
import { waitlistEntriesToCsv } from './csv.js';
import { config } from './config.js';

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  businessName: z.string().trim().min(1, 'Business name is required'),
  businessType: z.string().trim().min(1, 'Business type is required'),
  whatsapp: z.string().trim().min(1, 'WhatsApp number is required'),
  email: z.email().trim().optional()
});

function hasValidAdminKey(req: Request) {
  const apiKey = req.get('x-api-key');
  return apiKey !== undefined && apiKey === config.ADMIN_API_KEY;
}

export async function healthCheck(_req: Request, res: Response) {
  try {
    await checkDatabaseConnection();
    return res.status(200).json({ status: 'ok', database: 'up' });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(503).json({ status: 'error', database: 'down' });
  }
}

export async function signup(req: Request, res: Response) {
  const result = signupSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid data',
      details: z.treeifyError(result.error)
    });
  }

  try {
    const entry = await createEntry(result.data);

    // Fire and forget — email failure never blocks the signup response
    sendSignupNotification(result.data);

    return res.status(201).json({
      message: "You're on the list!",
      id: entry.id
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
}

export async function getEntries(req: Request, res: Response) {
  if (!hasValidAdminKey(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const entries = await getAllEntries();
    return res.json({ count: entries.length, entries });
  } catch (error) {
    console.error('Get entries error:', error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

export async function exportEntries(req: Request, res: Response) {
  if (!hasValidAdminKey(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const entries = await getAllEntries();

    const csv = waitlistEntriesToCsv(entries);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=settu-waitlist.csv'
    );
    return res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}