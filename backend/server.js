import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import Pusher from 'pusher';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load ROOT .env (Render injects env vars directly, but this handles local)
config({ path: path.join(__dirname, '../.env') });

const app = express();

// ✅ FIXED CORS - Exact matching + trailing slash handling
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:8081', 
    'http://localhost:5173'
  ];
  
  // FRONTEND_URL (single)
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL.trim().replace(/\/+$/, '')); // Remove trailing /
  }
  
  // FRONTEND_URLS (comma-separated)
  if (process.env.FRONTEND_URLS) {
    const urlList = process.env.FRONTEND_URLS
      .split(',')
      .map(url => url.trim().replace(/\/+$/, '')) // Remove trailing /
      .filter(url => url.length > 0);
    origins.push(...urlList);
  }
  
  console.log('🔒 Allowed CORS origins:', origins);
  return origins;
};

// ✅ Apply CORS middleware
app.use(cors({ 
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins();
    if (!origin || allowed.some(allowedOrigin => 
      origin.replace(/\/+$/, '') === allowedOrigin.replace(/\/+$/, '')
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors()); // Handle preflight for all routes

app.use(express.json({ limit: '10mb' }));

// ✅ PUSHER initialization
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

app.locals.pusher = pusher;

console.log('🔍 PUSHER CHECK:', {
  appId: process.env.PUSHER_APP_ID ? '✅' : '❌',
  key: process.env.PUSHER_KEY ? '✅' : '❌',
  secret: process.env.PUSHER_SECRET ? '✅' : '❌',
  cluster: process.env.PUSHER_CLUSTER || '❌'
});

// ✅ Validation
if (!process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
  console.error('🚫 Missing env: PUSHER_KEY or PUSHER_SECRET');
  process.exit(1);
}

// ✅ Dynamic route imports
let messagesRouter, pusherRouter;
try {
  messagesRouter = await import('./routes/messages.js');
  pusherRouter = await import('./routes/pusher.js');
  console.log('✅ Routes loaded');
} catch (error) {
  console.error('❌ Route import failed:', error.message);
  process.exit(1);
}

// ✅ Mount routes
app.use('/api/messages', messagesRouter.default);
app.use('/api/pusher', pusherRouter.default);

// ✅ No TS hassle
app.get('/debug-cors', function(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = !origin || allowedOrigins.some(allowedOrigin => 
    origin.replace(/\/+$/, '') === allowedOrigin.replace(/\/+$/, '')
  );
  
  res.json({
    origin,
    allowed: isAllowed,
    allOrigins: allowedOrigins,
    frontendUrls: process.env.FRONTEND_URLS,
    envLoaded: !!process.env.FRONTEND_URLS
  });
});


// ✅ Production health check
app.get('/health', async (req, res) => {
  try {
    await pusher.trigger('health-test', 'test', { 
      message: '✅ Backend works!',
      timestamp: new Date().toISOString()
    });
    res.json({ 
      status: 'OK', 
      pusher: '✅ WORKING',
      routes: '✅',
      env: process.env.NODE_ENV || 'development',
      corsOrigins: getAllowedOrigins()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ API base path
app.get('/api', (req, res) => {
  res.json({
    status: 'DSA Socio Backend API',
    endpoints: ['/health', '/debug-cors', '/api/messages', '/api/pusher'],
    pusher: process.env.PUSHER_CLUSTER || 'ap2',
    corsOrigins: getAllowedOrigins()
  });
});

// ✅ CRITICAL: Render PORT priority
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`🧪 Health: http://localhost:${PORT}/health`);
  console.log(`🔍 CORS Debug: http://localhost:${PORT}/debug-cors`);
  console.log(`📋 API: http://localhost:${PORT}/api`);
  console.log(`🔒 Origins:`, getAllowedOrigins());
});

export default app;
