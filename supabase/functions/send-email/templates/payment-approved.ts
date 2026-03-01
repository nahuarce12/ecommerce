import { baseLayout } from './base.ts'

interface PaymentApprovedData {
  orderId: string
  total: number
  paymentMethod: string
  appUrl: string
}

export function paymentApprovedTemplate(data: PaymentApprovedData): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:1px;">
      Pago aprobado
    </h2>
    <p style="margin:0 0 24px;font-size:12px;color:#999999;font-family:monospace;">
      Orden #${data.orderId.substring(0, 8)}
    </p>

    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:28px;">&#10003;</p>
      <p style="margin:0;font-size:14px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
        Tu pago fue acreditado
      </p>
    </div>

    <p style="margin:0 0 24px;font-size:14px;color:#333333;line-height:1.6;">
      El pago de <strong>$${data.total.toFixed(2)}</strong> fue procesado correctamente. Tu pedido est&aacute; confirmado y en preparaci&oacute;n.
    </p>

    <p style="margin:0 0 24px;font-size:14px;color:#333333;line-height:1.6;">
      Te notificaremos cuando tu pedido sea despachado.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background-color:#000000;padding:12px 32px;">
          <a href="${data.appUrl}/orders" style="color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:2px;">
            Ver mi pedido
          </a>
        </td>
      </tr>
    </table>`

  return {
    subject: `Pago aprobado - Orden #${data.orderId.substring(0, 8)}`,
    html: baseLayout('Pago aprobado', content),
  }
}
