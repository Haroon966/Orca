import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/status', (_req, res) => {
  res.json({
    needsSetup: false,
    isAuthenticated: true,
  });
});

router.get('/user', authenticateToken, (req, res) => {
  res.json({
    user: req.user,
  });
});

export default router;
