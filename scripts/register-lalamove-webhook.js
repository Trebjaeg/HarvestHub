const crypto = require('crypto');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const LALAMOVE_API_URL = process.env.LALAMOVE_API_URL || 'https://rest.sandbox.lalamove.com';
const LALAMOVE_API_KEY = process.env.LALAMOVE_API_KEY;
const LALAMOVE_API_SECRET = process.env.LALAMOVE_API_SECRET;
const WEBHOOK_URL = 'https://harvesthubph.app/api/webhooks/lalamove';

if (!LALAMOVE_API_KEY || !LALAMOVE_API_SECRET) {
  console.error('❌ Missing Lalamove API credentials in .env.local');
  process.exit(1);
}

function generateSignature(timestamp, method, path, body = '') {
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n`;
  const bodyString = body ? JSON.stringify(body) : '';
  const message = rawSignature + bodyString;
  
  return crypto
    .createHmac('sha256', LALAMOVE_API_SECRET)
    .update(message)
    .digest('hex');
}

async function registerWebhook() {
  console.log('🔧 Registering Lalamove Webhook...\n');
  
  const timestamp = Date.now().toString();
  const method = 'POST';
  const path = '/v3/webhooks';
  const body = {
    url: WEBHOOK_URL,
    events: [
      'ORDER_STATUS_CHANGED',
      'DRIVER_ASSIGNED',
      'ORDER_AMOUNT_CHANGED'
    ]
  };

  const signature = generateSignature(timestamp, method, path, body);

  console.log('📋 Request Details:');
  console.log('  URL:', LALAMOVE_API_URL + path);
  console.log('  Webhook URL:', WEBHOOK_URL);
  console.log('  Timestamp:', timestamp);
  console.log('  Signature:', signature.substring(0, 20) + '...\n');

  try {
    const response = await fetch(LALAMOVE_API_URL + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `hmac ${LALAMOVE_API_KEY}:${timestamp}:${signature}`,
        'Market': 'PH',
        'Request-ID': crypto.randomUUID(),
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to register webhook');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('✅ Webhook registered successfully!');
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('\n📝 Next Steps:');
    console.log('1. Verify webhook in Lalamove Partner Portal');
    console.log('2. Send a test event from Lalamove dashboard');
    console.log('3. Check logs: pm2 logs harvesthub');
    
  } catch (error) {
    console.error('❌ Error registering webhook:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
registerWebhook();
