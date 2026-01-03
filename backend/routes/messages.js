import express from 'express';

const router = express.Router();

// ✅ Dynamic Supabase import (lazy, handles missing package)
let supabase;
async function getSupabase() {
  if (!supabase) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY
      );
    } catch (error) {
      console.warn('⚠️ Supabase not available:', error.message);
      supabase = null;
    }
  }
  return supabase;
}

router.use((req, res, next) => {
  req.pusher = req.app.locals.pusher;
  next();
});

router.post('/send', async (req, res) => {
  
  const { chat_id, sender_id, message, channel } = req.body;

  if (!chat_id || !sender_id || !message || !channel) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    // 1. Try to save to Supabase
    const supabaseClient = await getSupabase();
    let newMessage = null;

    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('messages')
        .insert({
          chat_id,
          sender_id,
          message: message.trim(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      newMessage = data;
    } else {
      // Fallback: generate ID for Pusher
      newMessage = {
        id: Date.now().toString(),
        chat_id,
        sender_id,
        message: message.trim(),
        created_at: new Date().toISOString()
      };
    }

    // 2. ✅ PUSHER broadcast (always works)
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
    res.json(newMessage);
  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
