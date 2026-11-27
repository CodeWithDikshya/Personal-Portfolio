/**
 * Contact form handler (Netlify Function) — sends messages through Brevo.
 *
 * Required environment variable (set it in Netlify, never in code):
 *   BREVO_API_KEY        Brevo API key (Brevo → SMTP & API → API keys)
 * Optional (default to the public portfolio email):
 *   BREVO_SENDER_EMAIL   A sender address verified in Brevo (Brevo → Senders)
 *   CONTACT_TO_EMAIL     Inbox that receives the messages
 *   BREVO_SENDER_NAME    Display name for the sender (default "Portfolio Contact Form")
 */

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Public address already shown on the site; not a secret
const DEFAULT_EMAIL = 'thapa.dikshya2003@gmail.com';
const ALLOWED_ORIGINS = [
    'https://dikshya-thapa.com.np',
    'https://www.dikshya-thapa.com.np',
];

const json = (status, body) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const escapeHtml = (value) =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

// Allow the live domain, Netlify preview/deploy URLs, and local development
const isAllowedOrigin = (origin) => {
    if (!origin) return true; // some clients omit Origin on same-origin requests
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    if (/^https:\/\/[a-z0-9-]+(--[a-z0-9-]+)?\.netlify\.app$/i.test(origin)) return true;
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
    return false;
};

export default async (req) => {
    if (req.method !== 'POST') {
        return json(405, { ok: false, error: 'Method not allowed.' });
    }

    if (!isAllowedOrigin(req.headers.get('origin'))) {
        return json(403, { ok: false, error: 'Forbidden.' });
    }

    let data;
    try {
        data = await req.json();
    } catch {
        return json(400, { ok: false, error: 'Invalid request.' });
    }

    const name = String(data?.name ?? '').trim();
    const email = String(data?.email ?? '').trim();
    const message = String(data?.message ?? '').trim();
    const honeypot = String(data?.website ?? '').trim();

    // Bots fill the hidden "website" field; pretend success so they move on
    if (honeypot) {
        return json(200, { ok: true });
    }

    const errors = {};
    if (!name || name.length > 100) errors.name = 'Please enter your name (max 100 characters).';
    if (!EMAIL_RE.test(email) || email.length > 200) errors.email = 'Please enter a valid email address.';
    if (message.length < 10 || message.length > 5000) errors.message = 'Message must be between 10 and 5000 characters.';
    if (Object.keys(errors).length) {
        return json(422, { ok: false, error: 'Please check the form and try again.', fields: errors });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || DEFAULT_EMAIL;
    const toEmail = process.env.CONTACT_TO_EMAIL || DEFAULT_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || 'Portfolio Contact Form';

    if (!apiKey) {
        console.error('Contact form is missing BREVO_API_KEY.');
        return json(500, { ok: false, error: 'The contact form is not configured yet. Please email me directly.' });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
    // Keep the subject on one line so it can't inject headers or look broken
    const subjectName = name.replace(/[\r\n]+/g, ' ').slice(0, 80);

    const payload = {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail }],
        replyTo: { email, name: subjectName },
        subject: `New portfolio message from ${subjectName}`,
        htmlContent: `
            <div style="font-family:Arial,sans-serif;font-size:15px;color:#0F172A;line-height:1.6">
                <h2 style="margin:0 0 12px;color:#0891B2">New message from your portfolio</h2>
                <p style="margin:0 0 4px"><strong>Name:</strong> ${safeName}</p>
                <p style="margin:0 0 16px"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
                <div style="padding:14px 16px;border-left:3px solid #0891B2;background:#F1F5F9;border-radius:6px">${safeMessage}</div>
                <p style="margin:16px 0 0;font-size:13px;color:#64748B">Reply to this email to answer ${safeName} directly.</p>
            </div>`,
        textContent: `New message from your portfolio\n\nName: ${name}\nEmail: ${email}\n\n${message}`,
    };

    try {
        const res = await fetch(BREVO_URL, {
            method: 'POST',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const detail = await res.text().catch(() => '');
            // Brevo's reason goes to the Netlify function log only, never to visitors
            console.error(`Brevo responded ${res.status}: ${detail}`);
            return json(502, { ok: false, error: 'Sorry, your message could not be sent. Please try again or email me directly.' });
        }

        return json(200, { ok: true });
    } catch (err) {
        console.error('Brevo request failed:', err);
        return json(502, { ok: false, error: 'Sorry, your message could not be sent. Please try again or email me directly.' });
    }
};

export const config = {
    path: '/api/contact',
};
