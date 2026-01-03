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

// ✅ FIXED CORS - Express 5 compatible
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:8081', 
    'http://localhost:5173'
  ];
  
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL.trim().replace(/\/+$/, ''));
  }
  
  if (process.env.FRONTEND_URLS) {
    const urlList = process.env.FRONTEND_URLS
      .split(',')
      .map(url => url.trim().replace(/\/+$/, ''))
      .filter(url => url.length > 0);
    origins.push(...urlList);
  }
  return origins;
};

app.use(cors({ 
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// ✅ PUSHER
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

app.locals.pusher = pusher;

if (!process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
  console.error('🚫 Missing env: PUSHER_KEY or PUSHER_SECRET');
  process.exit(1);
}

// ✅ Routes
let messagesRouter, pusherRouter;
try {
  messagesRouter = await import('./routes/messages.js');
  pusherRouter = await import('./routes/pusher.js');
} catch (error) {
  console.error('❌ Route import failed:', error.message);
  process.exit(1);
}

app.use('/api/messages', messagesRouter.default);
app.use('/api/pusher', pusherRouter.default);

// ✅ Debug endpoints
app.get('/debug-cors', function(req, res) {  // No TS
  const origin = req.headers.origin || '';
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = !origin || allowedOrigins.some(allowedOrigin => 
    origin.replace(/\/+$/, '') === allowedOrigin.replace(/\/+$/, '')
  );
  
  res.json({
    origin,
    allowed: isAllowed,
    allOrigins: allowedOrigins,
    frontendUrls: process.env.FRONTEND_URLS
  });
});

app.get('/health', async (req, res) => {
  try {
    await pusher.trigger('health-test', 'test', { 
      message: '✅ Backend works!',
      timestamp: new Date().toISOString()
    });
    res.json({ 
      status: 'OK', 
      pusher: '✅ WORKING',
      corsOrigins: getAllowedOrigins()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api', (req, res) => {
  res.json({
    status: 'DSA Socio Backend API',
    endpoints: ['/health', '/debug-cors', '/api/messages', '/api/pusher']
  });
});

const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend on port ${PORT}`);
  console.log(`🔒 Origins:`, getAllowedOrigins());
});

export default app;
