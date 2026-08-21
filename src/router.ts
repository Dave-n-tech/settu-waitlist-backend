import { Router } from 'express';
import { signup, getEntries, exportEntries } from './controller.js';

export const router: Router = Router();

router.post('/waitlist', signup);
router.get('/waitlist', getEntries);
router.get('/waitlist/export', exportEntries);