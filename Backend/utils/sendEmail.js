import nodemailer from 'nodemailer';
import configService from '../services/configService.js';
import logger from './logger.js';

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
    },
    // Reuse warm SMTP connections instead of re-handshaking (TCP+TLS+AUTH) on
    // every send — that handshake is the main per-email latency to Gmail.
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    // Don't let a stuck SMTP socket hang a request indefinitely.
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 20000
  });

  // A pooled transporter is an EventEmitter — an unhandled 'error' event (e.g. a
  // dropped/refused SMTP connection) would otherwise crash the whole process.
  _transporter.on('error', (err) => {
    logger.error('[sendEmail] SMTP transporter pool error', new Error(err?.message || String(err)));
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
