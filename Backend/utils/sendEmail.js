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
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {Array}  [options.attachments] Nodemailer attachment descriptors, e.g.
 *   `[{ filename, content: <Buffer>, contentType }]` — used to deliver the audit
 *   PDF itself rather than a link to it.
 */
const sendEmail = async ({ to, subject, html, attachments }) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: configService.getConfig('EMAIL_FROM', 'DealerSiteAudit <noreply@dealersiteaudit.com>'),
    to,
    subject,
    html,
    ...(attachments?.length ? { attachments } : {})
  });
};

export default sendEmail;
