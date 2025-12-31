import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import Pusher from 'pusher';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load ROOT .env
config({ path: path.join(__dirname, '../.env') });

const app = express();

// ✅ Middleware FIRST
app.use(cors({ 
  origin: ['http://localhost:8081', 'http://localhost:5173'], 
  credentials: true 
}));
app.use(express.json());

// ✅ PUSHER - ap2 cluster (TRIGGER instance)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,  // ap2
  useTLS: true
});

// ✅ GLOBAL PUSHER via app.locals (for messages.js)
app.locals.pusher = pusher;

// ✅ VALIDATE Pusher
console.log('🔍 PUSHER CHECK:', {
  appId: process.env.PUSHER_APP_ID ? '✅' : '❌',
  key: process.env.PUSHER_KEY ? '✅' : '❌',
  secret: process.env.PUSHER_SECRET ? '✅' : '❌',
  cluster: process.env.PUSHER_CLUSTER || '❌'
});

if (!process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
  console.error('🚫 Fix .env PUSHER_* first!');
  process.exit(1);
}

// ✅ IMPORT ROUTES (ES modules)
let messagesRouter, pusherRouter;
try {
  messagesRouter = await import('./routes/messages.js');
  pusherRouter = await import('./routes/pusher.js');
} catch (error) {
  console.error('❌ Route import failed:', error.message);
  process.exit(1);
}

// ✅ MOUNT ROUTES
app.use('/api/messages', messagesRouter.default);
app.use('/api/pusher', pusherRouter.default);

// ✅ HEALTH CHECK - Test Pusher + Supabase
app.get('/health', async (req, res) => {
  try {
    await pusher.trigger('health-test', 'test', { message: 'Backend Pusher works!' });
    res.json({ 
      status: 'OK', 
      pusher: '✅ WORKING',
      routes: ['✅ /api/messages', '✅ /api/pusher'],
      env: {
        appId: !!process.env.PUSHER_APP_ID,
        key: !!process.env.PUSHER_KEY,
        secret: !!process.env.SUPABASE_SERVICE_KEY, // Hide real secret
        cluster: process.env.PUSHER_CLUSTER
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Pusher failed', details: error.message });
  }
});

// ✅ Test endpoint (messages.js uses this)
app.get('/api/messages/test', async (req, res) => {
  try {
    await pusher.trigger('test-channel', 'test', { message: '✅ Backend works!' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.BACKEND_PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend: http://localhost:${PORT} ✅`);
  console.log(`🌐 Frontend: http://localhost:8081`);
  console.log('🧪 Test: http://localhost:5000/health');
  console.log('🧪 Messages: http://localhost:5000/api/messages/test');
});
