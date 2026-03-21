import { welcomeTemplate } from './templates/welcome.ts'
import { orderConfirmationTemplate } from './templates/order-confirmation.ts'
import { paymentApprovedTemplate } from './templates/payment-approved.ts'
import { orderShippedTemplate } from './templates/order-shipped.ts'

const RESEND_API_URL = 'https://api.resend.com/emails'
const RESEND_MAX_RETRIES = 2

type ResendAttemptResult = {
  ok: boolean
  status: number
  data: unknown
}

interface EmailRequest {
  type: 'welcome' | 'order_confirmation' | 'payment_approved' | 'order_shipped'
  to: string
  data: Record<string, unknown>
}

type OrderConfirmationItem = {
  product_name: string
  size: string
  color: string
  quantity: number
  price_at_purchase: number
}

type WelcomePayload = {
  fullName: string
  appUrl: string
}

type OrderConfirmationPayload = {
  orderId: string
  items: OrderConfirmationItem[]
  total: number
  shippingCost: number
  shippingAddress: string
  paymentMethod: string
  appUrl: string
}

type PaymentApprovedPayload = {
  orderId: string
  total: number
  paymentMethod: string
  appUrl: string
}

type OrderShippedPayload = {
  orderId: string
  trackingNumber: string | null
  appUrl: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function parseWelcomePayload(data: Record<string, unknown>): WelcomePayload {
  return {
    fullName: asString(data.fullName, 'Usuario'),
    appUrl: asString(data.appUrl, ''),
  }
}

function parseOrderConfirmationPayload(data: Record<string, unknown>): OrderConfirmationPayload {
  const itemsInput = Array.isArray(data.items) ? data.items : []
  const items = itemsInput.map((rawItem) => {
    const item = asRecord(rawItem)
    return {
      product_name: asString(item.product_name, 'Producto'),
      size: asString(item.size, 'ÚNICO'),
      color: asString(item.color, 'DEFAULT'),
      quantity: asNumber(item.quantity, 1),
      price_at_purchase: asNumber(item.price_at_purchase, 0),
    }
  })

  return {
    orderId: asString(data.orderId, ''),
    items,
    total: asNumber(data.total, 0),
    shippingCost: asNumber(data.shippingCost, 0),
    shippingAddress: asString(data.shippingAddress, ''),
    paymentMethod: asString(data.paymentMethod, ''),
    appUrl: asString(data.appUrl, ''),
  }
}

function parsePaymentApprovedPayload(data: Record<string, unknown>): PaymentApprovedPayload {
  return {
    orderId: asString(data.orderId, ''),
    total: asNumber(data.total, 0),
    paymentMethod: asString(data.paymentMethod, ''),
    appUrl: asString(data.appUrl, ''),
  }
}

function parseOrderShippedPayload(data: Record<string, unknown>): OrderShippedPayload {
  return {
    orderId: asString(data.orderId, ''),
    trackingNumber: typeof data.trackingNumber === 'string' ? data.trackingNumber : null,
    appUrl: asString(data.appUrl, ''),
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function safeReadResponseBody(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

async function sendEmailWithRetry(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
): Promise<ResendAttemptResult> {
  let lastResult: ResendAttemptResult = { ok: false, status: 500, data: { error: 'Unknown error' } }

  for (let attempt = 0; attempt <= RESEND_MAX_RETRIES; attempt += 1) {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    })

    const resData = await safeReadResponseBody(res)
    lastResult = { ok: res.ok, status: res.status, data: resData }

    if (res.ok) {
      return lastResult
    }

    const shouldRetry = res.status >= 500 && attempt < RESEND_MAX_RETRIES
    if (!shouldRetry) {
      return lastResult
    }

    // Small exponential backoff for transient upstream errors.
    const backoffMs = 300 * (attempt + 1)
    await delay(backoffMs)
  }

  return lastResult
}

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY not configured' }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 },
      )
    }

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'SUPPLY WORLD <onboarding@resend.dev>'

    const { type, to, data } = (await req.json()) as EmailRequest
    const safeData = asRecord(data)

    if (!type || !to) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing type or to' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    let subject: string
    let html: string

    switch (type) {
      case 'welcome': {
        const result = welcomeTemplate(parseWelcomePayload(safeData))
        subject = result.subject
        html = result.html
        break
      }
      case 'order_confirmation': {
        const result = orderConfirmationTemplate(parseOrderConfirmationPayload(safeData))
        subject = result.subject
        html = result.html
        break
      }
      case 'payment_approved': {
        const result = paymentApprovedTemplate(parsePaymentApprovedPayload(safeData))
        subject = result.subject
        html = result.html
        break
      }
      case 'order_shipped': {
        const result = orderShippedTemplate(parseOrderShippedPayload(safeData))
        subject = result.subject
        html = result.html
        break
      }
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown email type: ${type}` }),
          { headers: { 'Content-Type': 'application/json' }, status: 400 },
        )
    }

    const resendResult = await sendEmailWithRetry(apiKey, fromEmail, to, subject, html)

    if (!resendResult.ok) {
      console.error('Resend API error:', {
        type,
        to,
        status: resendResult.status,
        fromEmail,
        error: resendResult.data,
      })
      return new Response(
        JSON.stringify({ success: false, error: resendResult.data }),
        { headers: { 'Content-Type': 'application/json' }, status: resendResult.status },
      )
    }

    const responseRecord = asRecord(resendResult.data)
    const emailId = asString(responseRecord.id, '')

    console.log(`Email sent: type=${type}, to=${to}, id=${emailId || 'unknown'}`)

    return new Response(
      JSON.stringify({ success: true, id: emailId || null }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (err) {
    console.error('Unexpected error in send-email:', err)
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
