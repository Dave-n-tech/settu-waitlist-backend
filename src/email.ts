import nodemailer from 'nodemailer';
import type { SignupData } from './service.js';
import { config } from './config.js';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: config.GMAIL_USER,
    pass: config.GMAIL_APP_PASSWORD
  }
});

export async function sendSignupNotification(entry: SignupData) {
  try {
    await transporter.sendMail({
      from: config.GMAIL_USER,
      to: config.NOTIFY_EMAIL,
      subject: `New Settu waitlist signup - ${entry.name}`,
      text: [
        `Name: ${entry.name}`,
        `Business: ${entry.businessName}`,
        `Type: ${entry.businessType}`,
        `WhatsApp: ${entry.whatsapp}`,
        `Email: ${entry.email || 'Not provided'}`
      ].join('\n')
    });
  } catch (error) {
    // Email failure should never block a signup
    console.error('Email notification failed:', error);
  }
}