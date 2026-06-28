import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userDb, appConfigDb } from '../modules/database/index.js';
import { IS_PLATFORM } from '../constants/config.js';

const JWT_SECRET = process.env.JWT_SECRET || appConfigDb.getOrCreateJwtSecret();

/** When true (default), skip login and attach the local user. Set DISABLE_AUTH=false for LAN deployments. */
export const DISABLE_AUTH = process.env.DISABLE_AUTH !== 'false';

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

const authenticateToken = async (req, res, next) => {
  try {
    if (DISABLE_AUTH) {
      const user = ensureLocalUser();
      req.user = user;
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = userDb.getUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    const message = IS_PLATFORM
      ? 'Platform mode: No user found in database'
      : 'Failed to resolve user';
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

const authenticateWebSocket = (token) => {
  try {
    if (DISABLE_AUTH) {
      const user = ensureLocalUser();
      if (user) {
        return { id: user.id, userId: user.id, username: user.username };
      }
      return null;
    }

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = userDb.getUserById(decoded.userId);
    if (!user) {
      return null;
    }
    return { id: user.id, userId: user.id, username: user.username };
  } catch (error) {
    console.error('WebSocket auth error:', error);
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
