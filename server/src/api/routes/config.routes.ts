import { Router } from 'express';

const router = Router();

router.get('/config/ice-servers', (req, res) => {
  // Use free Google STUN servers for development
  // In production, you'd use your own TURN server
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];
  
  res.json({ success: true, data: { iceServers } });
});

export default router;
