import { baseLayout } from './base.ts'

interface WelcomeData {
  fullName: string
  appUrl: string
}

export function welcomeTemplate(data: WelcomeData): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:1px;">
      &iexcl;Bienvenido/a!
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:#333333;line-height:1.6;">
      Hola <strong>${data.fullName}</strong>, gracias por crear tu cuenta en <strong>SUPPLY WORLD</strong>.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#333333;line-height:1.6;">
      Ya pod&eacute;s explorar nuestro cat&aacute;logo de ropa exclusiva: Supreme, Corteiz, Bape, Nike, Hellstar y m&aacute;s.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:#000000;padding:12px 32px;">
          <a href="${data.appUrl}" style="color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:2px;">
            Explorar tienda
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:#999999;line-height:1.5;">
      Si ten&eacute;s alguna consulta, no dudes en contactarnos.
    </p>`

  return {
    subject: '¡Bienvenido/a a SUPPLY WORLD!',
    html: baseLayout('Bienvenido/a a SUPPLY WORLD', content),
  }
}
