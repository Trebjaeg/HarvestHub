import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Accept both GET and POST for testing
  return res.status(200).json({ 
    success: true, 
    message: 'Webhook endpoint is reachable',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
