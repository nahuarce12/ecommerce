export function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#000000;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">
                ECOMMERCE CHINA
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:24px 32px;border-top:1px solid #e5e5e5;">
              <p style="margin:0 0 8px;color:#999999;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:center;">
                Ecommerce China &mdash; Ropa exclusiva
              </p>
              <p style="margin:0;color:#cccccc;font-size:10px;text-align:center;">
                Este email fue enviado autom&aacute;ticamente. No respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
