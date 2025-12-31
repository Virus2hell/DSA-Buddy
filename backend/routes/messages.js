import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// ✅ Supabase client (shared across requests)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ✅ Get Pusher from app.locals (server.js)
router.use((req, res, next) => {
  req.pusher = req.app.locals.pusher;
  next();
});

router.post('/send', async (req, res) => {
  console.log('📨 BACKEND RECEIVED:', req.body);
  
  const { 
    chat_id, 
    sender_id, 
    message, 
    channel 
  } = req.body;

  if (!chat_id || !sender_id || !message || !channel) {
    console.log('❌ BACKEND: Missing data');
    return res.status(400).json({ error: 'Missing chat_id, sender_id, message, or channel' });
  }

  try {
    // 1. ✅ SAVE TO SUPABASE (persistent storage)
    const { data: newMessage, error: dbError } = await supabase
      .from('messages')
      .insert({
        chat_id,
        sender_id,
        message: message.trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) throw dbError;
    
    console.log('✅ DB Saved:', newMessage.id);

    // 2. ✅ BROADCAST VIA PUSHER (real-time)
    const pusherData = {
      id: newMessage.id,
      chat_id: newMessage.chat_id,
      sender_id: newMessage.sender_id,
      sender_name: 'Someone', // Frontend overrides this
      message: newMessage.message,
      created_at: newMessage.created_at
    };

    // ✅ EXCLUDE SENDER using socket_id (most reliable)
    const socketId = req.headers['x-pusher-socket-id'];
    await req.pusher.trigger(channel, 'new-message', pusherData, {
      socket_id: socketId // Sender won't receive own message
    });

    console.log(`✅ SENT TO: ${channel} (excluded: ${socketId?.slice(0,8)})`);
    res.json(newMessage); // Return real message for optimistic replace

  } catch (error) {
    console.error('❌ BACKEND ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/test', async (req, res) => {
  try {
    await req.pusher.trigger('test-channel', 'test', { message: '✅ Backend works!' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;