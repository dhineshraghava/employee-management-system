import express from 'express';
import { getAIWorkforceInsights } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Allow authenticated users (Admin and Employee) to query AI workforce insights
router.use(authenticateToken);
router.get('/insights', getAIWorkforceInsights);

export default router;
