// Alternative: Use Resend instead of SMTP
// Install: npm install resend
// Much easier than SendGrid, no SMTP needed!

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationCode(email: string, code: string) {
  const { data, error } = await resend.emails.send({
    from: 'HarvestHub <onboarding@resend.dev>', // Use their free domain
    to: email,
    subject: 'Your HarvestHub Verification Code',
    html: `<h1>Your code is: ${code}</h1>`,
  });

  if (error) {
    console.error('Email error:', error);
    return false;
  }
  
  console.log('Email sent:', data);
  return true;
}

// In .env.local add:
// RESEND_API_KEY=re_xxxxxxxxxxxx
