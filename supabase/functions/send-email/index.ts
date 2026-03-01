import { welcomeTemplate } from './templates/welcome.ts'
import { orderConfirmationTemplate } from './templates/order-confirmation.ts'
import { paymentApprovedTemplate } from './templates/payment-approved.ts'
import { orderShippedTemplate } from './templates/order-shipped.ts'

const RESEND_API_URL = 'https://api.resend.com/emails'

interface EmailRequest {
  type: 'welcome' | 'order_confirmation' | 'payment_approved' | 'order_shipped'
  to: string
  data: Record<string, unknown>
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

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Ecommerce China <onboarding@resend.dev>'

    const { type, to, data } = (await req.json()) as EmailRequest

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
        const result = welcomeTemplate(data as any)
        subject = result.subject
        html = result.html
        break
      }
      case 'order_confirmation': {
        const result = orderConfirmationTemplate(data as any)
        subject = result.subject
        html = result.html
        break
      }
      case 'payment_approved': {
        const result = paymentApprovedTemplate(data as any)
        subject = result.subject
        html = result.html
        break
      }
      case 'order_shipped': {
        const result = orderShippedTemplate(data as any)
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

    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from: fromEmail, to: [to], subject, html }),
    })

    const resData = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', resData)
      return new Response(
        JSON.stringify({ success: false, error: resData }),
        { headers: { 'Content-Type': 'application/json' }, status: res.status },
      )
    }

    console.log(`Email sent: type=${type}, to=${to}, id=${resData.id}`)

    return new Response(
      JSON.stringify({ success: true, id: resData.id }),
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
