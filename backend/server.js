const express        = require('express');
const mongoose       = require('mongoose');
const cookieParser   = require('cookie-parser');
const cors           = require('cors');
const helmet         = require('helmet');
const rateLimit      = require('express-rate-limit');
const mongoSanitize  = require('express-mongo-sanitize');
require('dotenv').config();

// ── Route Imports ──────────────────────────────────────
const authRoutes     = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const userRoutes     = require('./routes/userRoutes');
const pdfRoutes      = require('./routes/pdfRoutes');


const app = express();

// ════════════════════════════════════════════════════
//  SECURITY MIDDLEWARE
// ════════════════════════════════════════════════════

// ── HTTP Security Headers (Helmet) ────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,            // Allow cookies cross-origin
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});
app.use('/api', limiter);

// ── Stricter rate limit for public submission ──────────
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max:      10,                // Max 10 submissions per hour per IP
  message: {
    success: false,
    message: 'Too many question submissions. Please wait before submitting again.',
  },
});
app.use('/api/questions/submit', submitLimiter);

// ── MongoDB Query Injection Sanitizer ─────────────────
app.use(mongoSanitize());

// ════════════════════════════════════════════════════
//  BODY PARSING MIDDLEWARE
// ════════════════════════════════════════════════════
app.use(express.json({ limit: '10kb' }));           // Body size limit
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());                            // Parse HTTP-only cookies

// ════════════════════════════════════════════════════
//  REQUEST LOGGER (Development only)
// ════════════════════════════════════════════════════
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ════════════════════════════════════════════════════
//  HEALTH CHECK
// ════════════════════════════════════════════════════
app.get('/health', (_req, res) => {
  res.status(200).json({
    success:   true,
    status:    'healthy',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV,
    uptime:    `${Math.floor(process.uptime())}s`,
  });
});

// ════════════════════════════════════════════════════
//  API ROUTES
// ════════════════════════════════════════════════════
app.use('/api/auth',      authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/pdf', pdfRoutes);

// ════════════════════════════════════════════════════
//  404 HANDLER — Unknown routes
// ════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ════════════════════════════════════════════════════
//  GLOBAL ERROR HANDLER
// ════════════════════════════════════════════════════
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err.stack || err.message);

  // ── Mongoose CastError (invalid ObjectId) ─────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: ${err.value}`,
    });
  }

  // ── Mongoose ValidationError ───────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. '),
    });
  }

  // ── Duplicate key error (E11000) ───────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}. Please use a different value.`,
    });
  }

  // ── JWT Errors ─────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
  }

  // ── Generic fallback ───────────────────────────────
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ════════════════════════════════════════════════════
//  DATABASE CONNECTION & SERVER START
// ════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // ── Connect MongoDB ────────────────────────────
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('\n✅ MongoDB connected:', mongoose.connection.host);

    // ── Start Express ──────────────────────────────
    app.listen(PORT, () => {
      console.log(`\n🚀 FatwaMS Server running on port ${PORT}`);
      console.log(`📡 Environment:  ${process.env.NODE_ENV}`);
      console.log(`🌐 Client URL:   ${process.env.CLIENT_URL}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

// ── Graceful Shutdown ──────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

// ── Uncaught exceptions ────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});

startServer();
