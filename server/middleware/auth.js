import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userDb, appConfigDb } from '../modules/database/index.js';
import { AUTH_BYPASS, DISABLE_AUTH, IS_PLATFORM } from '../constants/config.js';

// Use env var if set, otherwise auto-generate a unique secret per installation
const JWT_SECRET = process.env.JWT_SECRET || appConfigDb.getOrCreateJwtSecret();

// Optional API key middleware
const validateApiKey = (req, res, next) => {
  // Skip API key validation if not configured
  if (!process.env.API_KEY) {
    return next();
  }
  
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

const ensureLocalAuthUser = () => {
  let user = userDb.getFirstUser();
  if (user) {
    return user;
  }

  const passwordHash = bcrypt.hashSync('__auth_disabled__', 4);
  const created = userDb.createUser('local', passwordHash);
  const userId = Number(created.id);
  userDb.completeOnboarding(userId);
  return userDb.getUserById(userId);
};

const resolveBypassUser = () => {
  if (DISABLE_AUTH) {
    return ensureLocalAuthUser();
  }

  return userDb.getFirstUser();
};

// JWT authentication middleware
const authenticateToken = async (req, res, next) => {
  // Platform mode or local no-login mode: use the single database user
  if (AUTH_BYPASS) {
    try {
      const user = resolveBypassUser();
      if (!user) {
        const message = IS_PLATFORM
          ? 'Platform mode: No user found in database'
          : 'Auth bypass: Failed to resolve local user';
        return res.status(500).json({ error: message });
      }
      req.user = user;
      return next();
    } catch (error) {
      console.error('Auth bypass error:', error);
      return res.status(500).json({ error: 'Failed to resolve authenticated user' });
    }
  }

  // Normal OSS JWT validation
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Also check query param for SSE endpoints (EventSource can't set headers)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists and is active
    const user = userDb.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    // Auto-refresh: if token is past halfway through its lifetime, issue a new one
    if (decoded.exp && decoded.iat) {
      const now = Math.floor(Date.now() / 1000);
      const halfLife = (decoded.exp - decoded.iat) / 2;
      if (now > decoded.iat + halfLife) {
        const newToken = generateToken(user);
        res.setHeader('X-Refreshed-Token', newToken);
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// WebSocket authentication function
const authenticateWebSocket = (token) => {
  // Platform mode or local no-login mode: bypass token validation
  if (AUTH_BYPASS) {
    try {
      const user = resolveBypassUser();
      if (user) {
        return { id: user.id, userId: user.id, username: user.username };
      }
      return null;
    } catch (error) {
      console.error('Auth bypass WebSocket error:', error);
      return null;
    }
  }

  // Normal OSS JWT validation
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Verify user actually exists in database (matches REST authenticateToken behavior)
    const user = userDb.getUserById(decoded.userId);
    if (!user) {
      return null;
    }
    return { userId: user.id, username: user.username };
  } catch (error) {
    console.error('WebSocket token verification error:', error);
    return null;
  }
};

export {
  validateApiKey,
  authenticateToken,
  generateToken,
  authenticateWebSocket,
  JWT_SECRET
};
