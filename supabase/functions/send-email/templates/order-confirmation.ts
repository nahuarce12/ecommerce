import { baseLayout } from './base.ts'

interface OrderItem {
  product_name: string
  size: string
  color: string
  quantity: number
  price_at_purchase: number
}

interface OrderConfirmationData {
  orderId: string
  items: OrderItem[]
  total: number
  shippingCost: number
  shippingAddress: string
  paymentMethod: string
  appUrl: string
}

export function orderConfirmationTemplate(data: OrderConfirmationData): { subject: string; html: string } {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333333;text-transform:uppercase;">
          ${item.product_name}
          <br><span style="font-size:11px;color:#999999;">Talle: ${item.size} | Color: ${item.color}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333333;text-align:center;">
          ${item.quantity}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333333;text-align:right;">
          $${(item.price_at_purchase * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join('')

  const subtotal = data.total - data.shippingCost

  const paymentLabel =
    data.paymentMethod === 'mercadopago'
      ? 'MercadoPago'
      : data.paymentMethod === 'bank_transfer'
        ? 'Transferencia bancaria'
        : data.paymentMethod === 'cash'
          ? 'Efectivo'
          : data.paymentMethod

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:1px;">
      Pedido confirmado
    </h2>
    <p style="margin:0 0 24px;font-size:12px;color:#999999;font-family:monospace;">
      Orden #${data.orderId.substring(0, 8)}
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#333333;line-height:1.6;">
      Recibimos tu pedido y estamos prepar&aacute;ndolo. Te avisaremos cuando se despache.
    </p>

    <!-- Items table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:2px solid #000000;font-size:11px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:1px;">
          Producto
        </td>
        <td style="padding:8px 0;border-bottom:2px solid #000000;font-size:11px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:1px;text-align:center;">
          Cant.
        </td>
        <td style="padding:8px 0;border-bottom:2px solid #000000;font-size:11px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:1px;text-align:right;">
          Precio
        </td>
      </tr>
      ${itemsHtml}
    </table>

    <!-- Totals -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;font-size:13px;color:#666666;">Subtotal</td>
        <td style="padding:4px 0;font-size:13px;color:#666666;text-align:right;">$${subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:13px;color:#666666;">Env&iacute;o</td>
        <td style="padding:4px 0;font-size:13px;color:#666666;text-align:right;">$${data.shippingCost.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:2px solid #000000;font-size:15px;font-weight:700;color:#000000;text-transform:uppercase;">Total</td>
        <td style="padding:8px 0;border-top:2px solid #000000;font-size:15px;font-weight:700;color:#000000;text-align:right;">$${data.total.toFixed(2)}</td>
      </tr>
    </table>

    <!-- Details -->
    <div style="background-color:#fafafa;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#000000;">
        Direcci&oacute;n de env&iacute;o
      </p>
      <p style="margin:0 0 16px;font-size:13px;color:#333333;line-height:1.5;">
        ${data.shippingAddress}
      </p>
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#000000;">
        M&eacute;todo de pago
      </p>
      <p style="margin:0;font-size:13px;color:#333333;">
        ${paymentLabel}
      </p>
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background-color:#000000;padding:12px 32px;">
          <a href="${data.appUrl}/orders" style="color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:2px;">
            Ver mis pedidos
          </a>
        </td>
      </tr>
    </table>`

  return {
    subject: `Pedido confirmado #${data.orderId.substring(0, 8)}`,
    html: baseLayout('Pedido confirmado', content),
  }
}
