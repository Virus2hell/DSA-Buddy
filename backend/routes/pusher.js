import express from 'express';
import Pusher from 'pusher';

const router = express.Router();

// ✅ Pusher for AUTH (separate from trigger instance)
const pusherAuth = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

// ✅ PUSHER AUTH ENDPOINT (private channels)
router.post('/auth', (req, res) => {
  const { socket_id, channel_name } = req.body;
  const userId = req.headers.authorization?.split(' ')[1];
  
  console.log('🔐 PUSHER AUTH:', {
    socket_id: socket_id?.slice(0,8),
    channel: channel_name,
    user: userId?.slice(0,8)
  });
  
  const authResponse = pusherAuth.authenticate(socket_id, {
    user_id: userId || 'anonymous'
  });
  
  console.log('✅ Pusher auth SUCCESS');
  res.send(authResponse);
});

export default router;
