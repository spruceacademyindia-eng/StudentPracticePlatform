require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ── Connect Database ──
connectDB();

const app = express();

// ── Security Headers ──
app.use(helmet());

// ── CORS Configuration ──
const rawAllowedOrigins = [
  process.env.CLIENT_URL,
  'https://student-practice-platform-pi.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

// Normalize (strip trailing slashes)
const allowedOrigins = rawAllowedOrigins.map((url) => url.replace(/\/+$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, '');

      // Check explicit allowed origins
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Automatically allow all Vercel deployment URLs for this app (including previews)
      if (
        normalizedOrigin.endsWith('.vercel.app') &&
        normalizedOrigin.includes('student-practice-platform')
      ) {
        return callback(null, true);
      }

      // In non-production, allow all
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ── Rate Limiter ──
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', apiLimiter);

// Auth rate limiter (stricter against brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin-login', authLimiter);

// ── Body Parsers ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🌲 Spruce Academia Assessment Server is healthy and running',
    timestamp: new Date().toISOString(),
  });
});

// ── Route Mounts ──
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/users',      require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/content',    require('./routes/contentRoutes'));
app.use('/api/typing',     require('./routes/typingRoutes'));
app.use('/api/attempts',   require('./routes/attemptRoutes'));
app.use('/api/analytics',  require('./routes/analyticsRoutes'));
app.use('/api/settings',   require('./routes/settingRoutes'));
app.use('/api/reports',    require('./routes/reportRoutes'));
app.use('/api/admin-logs', require('./routes/adminLogRoutes'));

// ── 404 Route Handler ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found.`,
  });
});

// ── Centralized Error Handler ──
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🌲 Spruce Academia API Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
