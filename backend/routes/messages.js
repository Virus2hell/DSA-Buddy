import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// ✅ Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
);

router.use((req, res, next) => {
  req.pusher = req.app.locals.pusher;
  next();
});

router.post('/send', async (req, res) => {
  console.log('📨 BACKEND RECEIVED:', req.body);
  
  const { chat_id, sender_id, message, channel } = req.body;

  if (!chat_id || !sender_id || !message || !channel) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    // 1. ✅ SAVE TO SUPABASE (persistent!)
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

    // 2. ✅ PUSHER broadcast
    const pusherData = {
      id: newMessage.id,
      chat_id: newMessage.chat_id,
      sender_id: newMessage.sender_id,
      sender_name: 'Someone',
      message: newMessage.message,
      created_at: newMessage.created_at
    };

    const socketId = req.headers['x-pusher-socket-id'];
    await req.pusher.trigger(channel, 'new-message', pusherData, {
      socket_id: socketId
    });

    console.log(`✅ SENT TO: ${channel}`);
    res.json(newMessage);
  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
