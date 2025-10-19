import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('🔍 DEBUG: All cookies received:');
  console.log(req.cookies);
  console.log('🔍 DEBUG: Cookie header:');
  console.log(req.headers.cookie);
  console.log('🔍 DEBUG: All headers:');
  console.log(req.headers);

  const authToken = req.cookies['auth-token'];
  const userToken = req.cookies['userToken'];
  const hhToken = req.cookies['hh_token'];

  return res.status(200).json({
    success: true,
    message: 'Debug endpoint for cookie inspection',
    cookies: {
      'auth-token': authToken ? 'EXISTS' : 'MISSING',
      'userToken': userToken ? 'EXISTS' : 'MISSING', 
      'hh_token': hhToken ? 'EXISTS' : 'MISSING',
    },
    rawCookies: req.cookies,
    cookieHeader: req.headers.cookie
  });
}