import http from 'node:http'
import { appendFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'

const PORT = Number(process.env.PORT ?? 3001)
const MAIL_TO = process.env.MAIL_TO || 'info@jxtechstudio.com'
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER
const DATA_DIR = process.env.DATA_DIR || fileURLToPath(new URL('./data', import.meta.url))
const REQUESTS_FILE = `${DATA_DIR}/requests.jsonl`

// Must match the radio values in contact.html and ar/contact.html
const SERVICES = [
  'Web Development',
  'SaaS & Products',
  'Brand & UI Design',
  'MVP Development',
  'Consulting',
  'Other',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9\s\-().]{7,25}$/
const MAX_BODY_BYTES = 16 * 1024

// Without SMTP settings, requests are still saved to disk and printed to the console, just not emailed
let transport = null
if (process.env.SMTP_HOST) {
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })
} else {
  console.warn('SMTP_HOST is not set: contact requests will be saved and logged, but NOT emailed.')
}

await mkdir(DATA_DIR, { recursive: true })

// One JSON object per line, so the file can be appended to safely and read with any tool
async function saveRequest(data, ip) {
  const record = { receivedAt: new Date().toISOString(), ip, ...data }
  await appendFile(REQUESTS_FILE, JSON.stringify(record) + '\n', 'utf8')
}

// Simple in-memory rate limit: 5 requests per IP per 15 minutes
const WINDOW_MS = 15 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map()

function rateLimited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > MAX_PER_WINDOW
}

setInterval(() => {
  const now = Date.now()
  for (const [ip, times] of hits) {
    if (times.every(t => now - t >= WINDOW_MS)) hits.delete(ip)
  }
}, WINDOW_MS).unref()

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function validate(body) {
  const data = {
    service: clean(body.service, 50),
    name: clean(body.name, 100),
    email: clean(body.email, 200),
    phone: clean(body.phone, 25),
    message: clean(body.message, 5000),
  }
  const errors = {}
  if (!SERVICES.includes(data.service)) errors.service = 'Please choose a service.'
  if (data.name.length < 2) errors.name = 'Please enter your name.'
  if (!EMAIL_RE.test(data.email)) errors.email = 'Please enter a valid email address.'
  if (!PHONE_RE.test(data.phone) || data.phone.replace(/\D/g, '').length < 7) errors.phone = 'Please enter a valid mobile number.'
  if (data.message.length < 10) errors.message = 'Please tell us a little more (at least 10 characters).'
  return { data, errors }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

async function sendRequest(data, ip) {
  const subject = `New service request: ${data.service} from ${data.name}`
  const text = [
    `Service: ${data.service}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Mobile: ${data.phone}`,
    '',
    'Request:',
    data.message,
    '',
    `Sent from the jxtechstudio.com contact form (IP ${ip})`,
  ].join('\n')

  if (!transport) {
    console.log(`--- ${subject} ---\n${text}\n---`)
    return
  }

  const row = (label, value) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${label}</td><td style="padding:4px 0"><strong>${escapeHtml(value)}</strong></td></tr>`
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#0f172a">
      <h2 style="margin:0 0 16px">New service request</h2>
      <table style="border-collapse:collapse">
        ${row('Service', data.service)}
        ${row('Name', data.name)}
        ${row('Email', data.email)}
        ${row('Mobile', data.phone)}
      </table>
      <h3 style="margin:24px 0 8px">Request</h3>
      <p style="white-space:pre-wrap;margin:0">${escapeHtml(data.message)}</p>
      <p style="margin-top:24px;color:#94a3b8;font-size:12px">Sent from the jxtechstudio.com contact form (IP ${escapeHtml(ip)})</p>
    </div>`

  await transport.sendMail({
    from: `"JXTech Studio Website" <${MAIL_FROM}>`,
    to: MAIL_TO,
    replyTo: `"${data.name.replace(/["\\]/g, '')}" <${data.email}>`,
    subject,
    text,
    html,
  })
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', chunk => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/health') {
    return sendJson(res, 200, { ok: true })
  }
  if (req.url !== '/api/contact') {
    return sendJson(res, 404, { error: 'Not found.' })
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }

  // nginx sets X-Real-IP; fall back to the socket address when running locally
  const ip = String(req.headers['x-real-ip'] ?? req.socket.remoteAddress ?? 'unknown')
  if (rateLimited(ip)) {
    return sendJson(res, 429, { error: 'Too many requests. Please try again in a few minutes.' })
  }

  let body
  try {
    body = JSON.parse(await readBody(req))
  } catch {
    return sendJson(res, 400, { error: 'Invalid request.' })
  }

  // Honeypot filled in: pretend it worked so bots don't retry
  if (body.website) {
    return sendJson(res, 200, { ok: true })
  }

  const { data, errors } = validate(body)
  if (Object.keys(errors).length) {
    return sendJson(res, 422, { error: 'Please check the highlighted fields.', errors })
  }

  let saved = false
  try {
    await saveRequest(data, ip)
    saved = true
  } catch (err) {
    console.error('Failed to save contact request:', err)
  }

  try {
    await sendRequest(data, ip)
  } catch (err) {
    console.error('Failed to send contact email:', err)
    // The request is safe on disk, so the visitor doesn't need to resend it
    if (!saved) return sendJson(res, 502, { error: "We couldn't send your request right now." })
  }
  sendJson(res, 200, { ok: true })
})

server.listen(PORT, () => console.log(`Contact API listening on port ${PORT}`))
