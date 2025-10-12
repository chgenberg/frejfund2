/**
 * Minimal mailer with SendGrid or Resend; falls back to console when not configured.
 */

type EmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; provider?: string; error?: string }> {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@frejfund.com';

  try {
    if (sendgridKey) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: fromEmail, name: 'FrejFund' },
          subject: payload.subject,
          content: [
            payload.html ? { type: 'text/html', value: payload.html } : { type: 'text/plain', value: payload.text || '' }
          ]
        })
      });
      if (!res.ok) {
        const msg = await res.text().catch(()=>res.statusText);
        return { ok: false, provider: 'sendgrid', error: msg };
      }
      return { ok: true, provider: 'sendgrid' };
    }

    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text
        })
      });
      if (!res.ok) {
        const msg = await res.text().catch(()=>res.statusText);
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


