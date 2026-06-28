import express from 'express';
import bcrypt from 'bcrypt';
import { userDb } from '../modules/database/index.js';
import {
  authenticateToken,
  generateToken,
  DISABLE_AUTH,
} from '../middleware/auth.js';

const router = express.Router();

router.get('/status', (_req, res) => {
  if (DISABLE_AUTH) {
    res.json({
      needsSetup: false,
      isAuthenticated: true,
      authRequired: false,
    });
    return;
  }

  const hasUsers = userDb.hasUsers();
  res.json({
    needsSetup: !hasUsers,
    isAuthenticated: false,
    authRequired: true,
  });
});

router.post('/register', async (req, res) => {
  if (DISABLE_AUTH) {
    return res.status(400).json({ error: 'Registration is disabled when auth bypass is enabled' });
  }

  if (userDb.hasUsers()) {
    return res.status(400).json({ error: 'An account already exists' });
  }

  const { username, password } = req.body ?? {};
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const created = userDb.createUser(username.trim(), passwordHash);
    const user = userDb.getUserById(Number(created.id));
    const token = generateToken(user);
    userDb.updateLastLogin(Number(created.id));

    res.json({
      success: true,
      token,
      user: { id: user?.id, username: user?.username },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.post('/login', async (req, res) => {
  if (DISABLE_AUTH) {
    const user = userDb.getFirstUser();
    return res.json({
      success: true,
      token: null,
      user: user ? { id: user.id, username: user.username } : null,
      authRequired: false,
    });
  }

  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const userRow = userDb.getUserByUsername(username);
  if (!userRow || !bcrypt.compareSync(password, userRow.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const user = userDb.getUserById(userRow.id);
  const token = generateToken(user);
  userDb.updateLastLogin(userRow.id);

  res.json({
    success: true,
    token,
    user: { id: user?.id, username: user?.username },
    authRequired: true,
  });
});

router.get('/user', authenticateToken, (req, res) => {
  res.json({
    user: req.user,
    authRequired: !DISABLE_AUTH,
  });
});

export default router;
