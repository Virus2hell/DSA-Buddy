import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import Pusher from 'pusher';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load ROOT .env (works on Render too)
config({ path: path.join(__dirname, '../.env') });

const app = express();

// ✅ FIXED CORS for production - dynamic origins
const allowedOrigins = [
  'http://localhost:8081', 
  'http://localhost:5173',
  process.env.FRONTEND_URL || 'https://your-vercel-app.vercel.app' // set in Render env
];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}));
app.use(express.json());

// ✅ PUSHER - ap2 cluster
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

// ✅ ONLY PUSHER validation (NO SUPABASE)
if (!process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
  console.error('🚫 Missing env: PUSHER_KEY or PUSHER_SECRET');
  process.exit(1);
}

// ✅ IMPORT ROUTES
let messagesRouter, pusherRouter;
try {
  messagesRouter = await import('./routes/messages.js');
  pusherRouter = await import('./routes/pusher.js');
  console.log('✅ Routes loaded');
} catch (error) {
  console.error('❌ Route import failed:', error.message);
  process.exit(1);
}

// ✅ MOUNT ROUTES
app.use('/api/messages', messagesRouter.default);
app.use('/api/pusher', pusherRouter.default);

// ✅ HEALTH CHECK (Pusher only)
app.get('/health', async (req, res) => {
  try {
    await pusher.trigger('health-test', 'test', { message: '✅ Backend works!' });
    res.json({ 
      status: 'OK', 
      pusher: '✅ WORKING',
      routes: '✅'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ CRITICAL: Use Render's PORT (overrides BACKEND_PORT)
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log('🧪 Health: http://localhost:${PORT}/health');
});

export default app;
