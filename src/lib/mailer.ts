/**
 * Minimal mailer with SendGrid or Resend; falls back to console when not configured.
 */

type EmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmail(
  payload: EmailPayload,
): Promise<{ ok: boolean; provider?: string; error?: string }> {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@frejfund.com';

  try {
    if (sendgridKey) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: fromEmail, name: 'FrejFund' },
          subject: payload.subject,
          content: [
            payload.html
              ? { type: 'text/html', value: payload.html }
              : { type: 'text/plain', value: payload.text || '' },
          ],
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        return { ok: false, provider: 'sendgrid', error: msg };
      }
      return { ok: true, provider: 'sendgrid' };
    }

    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        return { ok: false, provider: 'resend', error: msg };
      }
      return { ok: true, provider: 'resend' };
    }

    // Fallback: no provider configured
    console.log('MAIL Fallback →', payload.subject, '→', payload.to);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'unknown error' };
  }
}

/**
 * Send magic link email for passwordless authentication
 */
export async function sendMagicLinkEmail(
  to: string,
  magicLinkUrl: string,
): Promise<{ ok: boolean }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to FrejFund</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #000000 0%, #333333 100%);">
              <div style="width: 48px; height: 48px; background-color: #ffffff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <div style="width: 8px; height: 8px; background-color: #000000; border-radius: 50%;"></div>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Welcome to FrejFund</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #333333; font-size: 16px; line-height: 1.6;">
                Click the button below to sign in to your FrejFund account:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${magicLinkUrl}" style="display: inline-block; padding: 16px 48px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; transition: background-color 0.3s;">
                      Sign In to FrejFund →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                This link will expire in <strong>15 minutes</strong> and can only be used once.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">
              
              <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                If you didn't request this email, you can safely ignore it.
              </p>
              
              <p style="margin: 16px 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
                Or copy and paste this URL into your browser:<br>
                <a href="${magicLinkUrl}" style="color: #666666; word-break: break-all;">${magicLinkUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; text-align: center;">
              <p style="margin: 0 0 12px; color: #999999; font-size: 12px;">
                <strong>FrejFund</strong> – Because great ideas deserve a chance
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                Stockholm, Sweden
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer Text -->
        <p style="margin: 20px 0 0; color: #999999; font-size: 12px; text-align: center;">
          © 2024 FrejFund. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Welcome to FrejFund!

Click the link below to sign in to your account:
${magicLinkUrl}

This link will expire in 15 minutes and can only be used once.

If you didn't request this email, you can safely ignore it.

---
FrejFund – Because great ideas deserve a chance
Stockholm, Sweden
  `;

  const result = await sendEmail({
    to,
    subject: 'Sign in to FrejFund',
    html,
    text,
  });

  return { ok: result.ok };
}
