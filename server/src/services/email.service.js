import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

export const sendVerificationEmail = async (userEmail, userName, token) => {
  const apiUrl = process.env.API_URL || 'http://localhost:5000';
  const verificationLink = `${apiUrl}/api/auth/verify-email?token=${token}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - Smart Recipe Hub</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #fff7ed;
            color: #1c1917;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(28, 25, 23, 0.05);
            border: 1px solid #fed7aa;
          }
          .header {
            background-color: #d2493a;
            padding: 30px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
          }
          .content h2 {
            font-size: 20px;
            font-weight: 700;
            margin-top: 0;
          }
          .btn {
            display: inline-block;
            background-color: #d2493a;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: bold;
            margin: 24px 0;
            text-align: center;
            box-shadow: 0 4px 6px rgba(210, 73, 58, 0.2);
          }
          .btn:hover {
            background-color: #b83629;
          }
          .footer {
            background-color: #fafaf9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #78716c;
            border-top: 1px solid #e7e5e4;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ Smart Recipe Hub</h1>
          </div>
          <div class="content">
            <h2>Welcome to the kitchen, ${userName}!</h2>
            <p>Thank you for signing up for Smart Recipe Hub. We're excited to help you turn your ingredients into mouth-watering meals, use our AI picture identifier, and spin our culinary decision wheel.</p>
            <p>To finalize setting up your account and activate your profile, please click the button below to verify your email address:</p>
            
            <div style="text-align: center;">
              <a href="${verificationLink}" class="btn" target="_blank">Verify Email Address</a>
            </div>
            
            <p style="font-size: 13px; color: #78716c;">If the button above does not work, copy and paste this URL into your web browser:</p>
            <p style="font-size: 13px; color: #d2493a; word-break: break-all;">${verificationLink}</p>
            
            <p>This verification link will expire in 24 hours.</p>
            <p>Happy cooking,<br>The Smart Recipe Hub Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${userEmail} because you registered at Smart Recipe Hub.</p>
            <p>&copy; 2026 Smart Recipe Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (process.env.RESEND_API_KEY) {
    // Send via Resend API
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    console.log(`Sending verification email via Resend API to ${userEmail}`);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Smart Recipe Hub <${fromEmail}>`,
        to: [userEmail],
        subject: 'Activate Your Smart Recipe Hub Account',
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API failed: ${errorText}`);
    }
    console.log('Verification email sent via Resend.');
  } else {
    // Fall back to Nodemailer (Mailtrap SMTP)
    console.log(`Sending verification email via Nodemailer/Mailtrap to ${userEmail}`);
    const host = process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io';
    const port = Number(process.env.MAILTRAP_PORT || 2525);
    const user = process.env.MAILTRAP_USER;
    const pass = process.env.MAILTRAP_PASS;

    const transporter = nodemailer.createTransport({
      host,
      port,
      auth: {
        user,
        pass
      }
    });

    await transporter.sendMail({
      from: '"Smart Recipe Hub" <onboarding@smartrecipehub.local>',
      to: userEmail,
      subject: 'Activate Your Smart Recipe Hub Account',
      html: htmlContent
    });
    console.log('Verification email sent via Mailtrap SMTP.');
  }
};
