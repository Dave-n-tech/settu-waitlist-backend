import { Router } from 'express';
import { healthCheck, signup, getEntries, exportEntries } from './controller.js';

export const router: Router = Router();

router.get('/health', healthCheck);
router.post('/waitlist', signup);
router.get('/waitlist', getEntries);
router.get('/waitlist/export', exportEntries);