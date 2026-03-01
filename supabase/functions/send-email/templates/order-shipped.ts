import { baseLayout } from './base.ts'

interface OrderShippedData {
  orderId: string
  trackingNumber: string | null
  appUrl: string
}

export function orderShippedTemplate(data: OrderShippedData): { subject: string; html: string } {
  const trackingSection = data.trackingNumber
    ? `
      <div style="background-color:#fafafa;padding:16px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#000000;">
          N&uacute;mero de seguimiento
        </p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#000000;font-family:monospace;letter-spacing:2px;">
          ${data.trackingNumber}
        </p>
      </div>`
    : ''

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:1px;">
      Pedido enviado
    </h2>
    <p style="margin:0 0 24px;font-size:12px;color:#999999;font-family:monospace;">
      Orden #${data.orderId.substring(0, 8)}
    </p>

    <div style="background-color:#eff6ff;border:1px solid #bfdbfe;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:28px;">&#128230;</p>
      <p style="margin:0;font-size:14px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
        Tu pedido est&aacute; en camino
      </p>
    </div>

    <p style="margin:0 0 24px;font-size:14px;color:#333333;line-height:1.6;">
      Tu pedido fue despachado y est&aacute; en camino a tu direcci&oacute;n. 
      ${data.trackingNumber ? 'Pod&eacute;s hacer seguimiento con el c&oacute;digo que te dejamos abajo.' : ''}
    </p>

    ${trackingSection}

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
    subject: `Tu pedido fue enviado - Orden #${data.orderId.substring(0, 8)}`,
    html: baseLayout('Pedido enviado', content),
  }
}
