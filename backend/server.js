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

// ✅ Production-ready CORS
const allowedOrigins = [
  'http://localhost:8081', 
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [])
];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}));
app.use(express.json({ limit: '10mb' })); // reasonable limit

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
      env: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ API base path
app.get('/api', (req, res) => {
  res.json({
    status: 'DSA Buddy Backend API',
    endpoints: ['/health', '/api/messages', '/api/pusher'],
    pusher: process.env.PUSHER_CLUSTER || 'ap2'
  });
});

// ✅ CRITICAL: Render PORT priority
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {  // ✅ Bind to all interfaces
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`🧪 Health: http://localhost:${PORT}/health`);
  console.log(`📋 API: http://localhost:${PORT}/api`);
});

export default app;
