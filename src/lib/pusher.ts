// src/lib/pusher.ts
import Pusher from 'pusher-js';

export const pusherClient = new Pusher(
  import.meta.env.VITE_PUSHER_KEY as string,
  {
    cluster: import.meta.env.VITE_PUSHER_CLUSTER as string,
    forceTLS: true
  }
);
