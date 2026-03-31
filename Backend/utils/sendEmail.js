import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Ensure variables are loaded before createTransport

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Sends an email using Nodemailer.
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Auditify <noreply@auditify.app>',
    to,
    subject,
    html
  });
};

export default sendEmail;
