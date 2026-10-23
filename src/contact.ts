type Field = 'service' | 'name' | 'email' | 'phone' | 'message'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9\s\-().]{7,25}$/

const MESSAGES = {
  en: {
    service: 'Please choose a service.',
    name: 'Please enter your name.',
    email: 'Please enter a valid email address.',
    phone: 'Please enter a valid mobile number.',
    message: 'Please tell us a little more (at least 10 characters).',
    sending: 'Sending…',
    submit: 'Send Request',
    success: "Thanks! Your request has been submitted. We'll be in touch soon.",
    failed: "We couldn't send your request right now.",
    fallback: 'You can also email us at info@jxtechstudio.com.',
  },
  ar: {
    service: 'يرجى اختيار الخدمة.',
    name: 'يرجى إدخال اسمك.',
    email: 'يرجى إدخال بريد إلكتروني صحيح.',
    phone: 'يرجى إدخال رقم جوال صحيح.',
    message: 'يرجى إخبارنا بمزيد من التفاصيل (10 أحرف على الأقل).',
    sending: 'جارٍ الإرسال…',
    submit: 'إرسال الطلب',
    success: 'شكرًا لك! تم إرسال طلبك بنجاح، وسنتواصل معك قريبًا.',
    failed: 'تعذّر إرسال طلبك حاليًا.',
    fallback: 'يمكنك أيضًا مراسلتنا على info@jxtechstudio.com.',
  },
}

const t = document.documentElement.lang === 'ar' ? MESSAGES.ar : MESSAGES.en

const form = document.querySelector<HTMLFormElement>('#contact-form')
if (form) setupContactForm(form)

function setupContactForm(form: HTMLFormElement) {
  const submitBtn = form.querySelector<HTMLButtonElement>('#submit-btn')!
  const status = form.querySelector<HTMLDivElement>('#form-status')!

  // Pre-select a service when linked as /contact.html?service=Consulting
  const preset = new URLSearchParams(location.search).get('service')
  if (preset) {
    const radio = [...form.querySelectorAll<HTMLInputElement>('input[name="service"]')].find(r => r.value === preset)
    if (radio) radio.checked = true
  }

  const validate = (data: Record<Field, string>) => {
    const errors: Partial<Record<Field, string>> = {}
    if (!data.service) errors.service = t.service
    if (data.name.length < 2) errors.name = t.name
    if (!EMAIL_RE.test(data.email)) errors.email = t.email
    if (!PHONE_RE.test(data.phone) || data.phone.replace(/\D/g, '').length < 7) errors.phone = t.phone
    if (data.message.length < 10) errors.message = t.message
    return errors
  }

  const showErrors = (errors: Partial<Record<Field, string>>) => {
    form.querySelectorAll<HTMLParagraphElement>('[data-error-for]').forEach(el => {
      const msg = errors[el.dataset.errorFor as Field]
      el.textContent = msg ?? ''
      el.classList.toggle('hidden', !msg)
    })
    const first = Object.keys(errors)[0]
    if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
  }

  const showStatus = (kind: 'success' | 'error', text: string) => {
    status.textContent = text
    status.classList.remove('hidden', 'bg-green-500/15', 'text-green-300', 'bg-red-500/15', 'text-red-300')
    status.classList.add(...(kind === 'success' ? ['bg-green-500/15', 'text-green-300'] : ['bg-red-500/15', 'text-red-300']))
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const get = (k: string) => String(fd.get(k) ?? '').trim()
    const data: Record<Field, string> = {
      service: get('service'),
      name: get('name'),
      email: get('email'),
      phone: get('phone'),
      message: get('message'),
    }

    const errors = validate(data)
    showErrors(errors)
    if (Object.keys(errors).length) return

    submitBtn.disabled = true
    submitBtn.textContent = t.sending
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, website: get('website') }),
      })
      if (!res.ok) {
        // The server's field errors are English-only, so re-run our own checks for display
        if (res.status === 422) showErrors(validate(data))
        throw new Error()
      }
      form.reset()
      showStatus('success', t.success)
    } catch {
      showStatus('error', `${t.failed} ${t.fallback}`)
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = t.submit
    }
  })
}
