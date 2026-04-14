import nodemailer from 'nodemailer';
import configService from '../services/configService.js';

// Lazy transporter — created on first email send, after ConfigService is ready
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: configService.getConfig('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(configService.getConfig('SMTP_PORT', '587')),
    secure: configService.getConfig('SMTP_PORT', '587') === '465',
    auth: {
      user: configService.getConfig('SMTP_USER'),
      pass: configService.getConfig('SMTP_PASS')
    }
  });

  return _transporter;
}

/**
 * Sends an email using Nodemailer.
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: configService.getConfig('EMAIL_FROM', 'Dealerpulse <noreply@dealerpulse.app>'),
    to,
    subject,
    html
  });
};

export default sendEmail;
