import express from 'express';
const router = express.Router();

// ✅ Get Pusher from app.locals
router.use((req, res, next) => {
  req.pusher = req.app.locals.pusher;
  next();
});

router.post('/send', async (req, res) => {
  console.log('📨 BACKEND RECEIVED:', req.body);
  
  const { channel, message, sender_id, chat_id } = req.body;

  if (!channel || !message) {
    return res.status(400).json({ error: 'Missing channel or message' });
  }

  try {
    // ✅ BROADCAST (fake ID for demo)
    const fakeMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const data = {
      id: fakeMessageId,
      chat_id,
      sender_id,
      sender_name: 'Someone',
      message: message.trim(),
      created_at: new Date().toISOString()
    };

    // ✅ EXCLUDE SENDER
    const socketId = req.headers['x-pusher-socket-id'];
    await req.pusher.trigger(channel, 'new-message', data, {
      socket_id: socketId
    });

    console.log(`✅ SENT TO: ${channel}`);
    res.json(data);
  } catch (error) {
    console.error('❌ PUSHER ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/test', async (req, res) => {
  await req.pusher.trigger('test-channel', 'test', { message: '✅ Works!' });
  res.json({ success: true });
});

export default router;
