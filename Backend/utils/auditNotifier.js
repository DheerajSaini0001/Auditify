import sendEmail from './sendEmail.js';
import configService from './../services/configService.js';
import logger from './logger.js';

/**
 * "Your audit is ready" mail for runs the visitor was told to walk away from.
 *
 * A multi-page audit takes minutes, so the report page asks for an email and
 * tells the user to leave. That promise is only kept here — if this is skipped
 * or throws, the user is left waiting for a mail that never arrives, which is
 * why every call site fires it defensively and logs failures loudly.
 *
 * Never throws: a broken SMTP config must not take down the audit pipeline, and
 * the report itself is already saved by the time this runs.
 */
const appUrl = () =>
  (configService.getConfig('FRONTEND_URL', 'http://localhost:5173') || '').replace(/\/$/, '');

const shell = (
  title,
  body,
  note = 'You are getting this because you asked us to email you when your website audit finished.'
) => `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#16213E;">
    <div style="font-size:17px;font-weight:800;letter-spacing:-0.4px;color:#101C2C;margin:0 0 3px;">DealerSiteAudit</div>
    <div style="font-size:9px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#F26419;margin:0 0 24px;">Dealership Website Intelligence</div>
    <h1 style="font-size:20px;font-weight:800;margin:0 0 16px;">${title}</h1>
    ${body}
    <p style="font-size:12px;color:#8A94A6;margin-top:32px;border-top:1px solid #E8EAEF;padding-top:16px;">
      ${note}<br>
      <span style="color:#101C2C;font-weight:700;">DealerSiteAudit</span>
    </p>
  </div>
`;

const button = (href, label) => `
  <p style="margin:24px 0;">
    <a href="${href}" style="background:#C2571F;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;display:inline-block;">${label}</a>
  </p>
`;

export const sendAuditCompleteEmail = async ({ to, url, reportId, score }) => {
  if (!to) return false;
  try {
    const link = `${appUrl()}/report/${reportId}`;
    await sendEmail({
      to,
      subject: `Your audit for ${url} is ready`,
      html: shell('Your audit is ready', `
        <p style="font-size:15px;line-height:1.6;margin:0;">
          We finished checking <strong>${url}</strong> across every page you selected.
          ${score != null ? `Overall score: <strong>${score}</strong>.` : ''}
        </p>
        ${button(link, 'Open your report')}
        <p style="font-size:13px;color:#5A6474;margin:0;">
          Or paste this into your browser:<br>
          <span style="color:#3F6A99;">${link}</span>
        </p>
      `),
    });
    logger.info(`[auditNotifier] completion mail sent to ${to} for ${reportId}`);
    return true;
  } catch (err) {
    logger.error(`[auditNotifier] completion mail FAILED for ${reportId} → ${to}`, err);
    return false;
  }
};

/**
 * Deliver the audit PDF itself to a visitor who asked for it by name and address.
 *
 * Unlike the two notifications above, this one is the product: a signed-out
 * visitor gave us contact details specifically to receive this file, so a silent
 * failure here is a broken promise AND a lost lead. It therefore throws rather
 * than swallowing — the caller records the delivery failure against the lead and
 * tells the visitor, instead of showing a success screen for a mail that bounced.
 */
export const sendReportPdfEmail = async ({ to, name, url, reportId, score, grade, filename, pdf }) => {
  const link = `${appUrl()}/report/${reportId}`;
  const firstName = String(name || '').trim().split(/\s+/)[0] || 'there';

  await sendEmail({
    to,
    subject: `Your website audit report for ${url}`,
    html: shell(
      `Here's your audit report`,
      `
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
          Hi ${firstName}, your full audit of <strong>${url}</strong> is attached as a PDF.
          ${score != null ? `It scored <strong>${score}</strong>${grade ? ` (grade ${grade})` : ''} overall.` : ''}
        </p>
        <p style="font-size:15px;line-height:1.6;margin:0 0 4px;">Inside the report:</p>
        <ul style="font-size:14px;line-height:1.7;color:#5A6474;margin:0 0 8px;padding-left:20px;">
          <li>A one-page summary — score, failing checks and every pillar's rating</li>
          <li>Your issues ranked by what each one costs this page</li>
          <li>A numbered fix list, and the detail behind all eight pillars</li>
        </ul>
        ${button(link, 'Open the live report')}
        <p style="font-size:13px;color:#5A6474;margin:0;">
          Or paste this into your browser:<br>
          <span style="color:#3F6A99;">${link}</span>
        </p>
      `,
      'You are getting this because you asked us to email you this website audit report.'
    ),
    attachments: [{ filename, content: pdf, contentType: 'application/pdf' }],
  });

  logger.info(`[auditNotifier] report PDF mailed to ${to} for ${reportId}`);
  return true;
};

export const sendAuditFailedEmail = async ({ to, url, reportId }) => {
  if (!to) return false;
  try {
    await sendEmail({
      to,
      subject: `We could not finish the audit for ${url}`,
      html: shell('That audit did not finish', `
        <p style="font-size:15px;line-height:1.6;margin:0;">
          Something went wrong while checking <strong>${url}</strong>, so there is no report to open.
          Sorry about that — running it again usually works.
        </p>
        ${button(appUrl(), 'Try again')}
      `),
    });
    logger.info(`[auditNotifier] failure mail sent to ${to} for ${reportId}`);
    return true;
  } catch (err) {
    logger.error(`[auditNotifier] failure mail FAILED for ${reportId} → ${to}`, err);
    return false;
  }
};
