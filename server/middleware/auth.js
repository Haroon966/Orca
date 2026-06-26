import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userDb, appConfigDb } from '../modules/database/index.js';
import { IS_PLATFORM } from '../constants/config.js';

const JWT_SECRET = process.env.JWT_SECRET || appConfigDb.getOrCreateJwtSecret();

const validateApiKey = (req, res, next) => {
  if (!process.env.API_KEY) {
    return next();
  }

  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

const ensureLocalUser = () => {
  let user = userDb.getFirstUser();
  if (user) {
    return user;
  }

  const passwordHash = bcrypt.hashSync('__orca_local__', 4);
  const created = userDb.createUser('local', passwordHash);
  const userId = Number(created.id);
  userDb.completeOnboarding(userId);
  return userDb.getUserById(userId);
};

/** ClaudeUI: no app login — attach the local database user for prefs/onboarding routes. */
const authenticateToken = async (req, res, next) => {
  try {
    const user = ensureLocalUser();
    req.user = user;
    next();
  } catch (error) {
    console.error('Local user resolution error:', error);
    const message = IS_PLATFORM
      ? 'Platform mode: No user found in database'
      : 'Failed to resolve local user';
    res.status(500).json({ error: message });
  }
};

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
};

const authenticateWebSocket = () => {
  try {
    const user = ensureLocalUser();
    if (user) {
      return { id: user.id, userId: user.id, username: user.username };
    }
    return null;
  } catch (error) {
    console.error('WebSocket local user error:', error);
    return null;
  }
};

export {
  validateApiKey,
  authenticateToken,
  generateToken,
  authenticateWebSocket,
  JWT_SECRET,
};
