import Link from "next/link";
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-6">
            Política de Privacidad
          </h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: Diciembre 2025
          </p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto space-y-8 mb-16">
          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">1. Información que Recopilamos</h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="font-medium">Información Personal:</p>
              <ul className="space-y-2 ml-4">
                <li>• Nombre y apellido</li>
                <li>• Dirección de email</li>
                <li>• Dirección de envío</li>
                <li>• Número de teléfono</li>
                <li>• Información de pago (procesada de forma segura)</li>
              </ul>
              <p className="font-medium mt-4">Información Automática:</p>
              <ul className="space-y-2 ml-4">
                <li>• Dirección IP</li>
                <li>• Tipo de navegador</li>
                <li>• Páginas visitadas</li>
                <li>• Tiempo de navegación</li>
              </ul>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">2. Cómo Usamos Tu Información</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Utilizamos la información recopilada para:</p>
              <ul className="space-y-2 ml-4 mt-4">
                <li>• Procesar y completar tus pedidos</li>
                <li>• Comunicarnos contigo sobre tu pedido</li>
                <li>• Enviarte actualizaciones sobre el estado de tu envío</li>
                <li>• Mejorar nuestro sitio web y servicios</li>
                <li>• Prevenir fraude y garantizar la seguridad</li>
                <li>• Enviarte información promocional (solo si aceptaste recibirla)</li>
              </ul>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">3. Compartir Información</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                No vendemos, intercambiamos ni transferimos tu información personal a terceros, excepto:
              </p>
              <ul className="space-y-2 ml-4 mt-4">
                <li>• Proveedores de servicios de envío necesarios para entregar tu pedido</li>
                <li>• Procesadores de pago para completar transacciones</li>
                <li>• Cuando sea requerido por ley</li>
                <li>• Para proteger nuestros derechos o propiedad</li>
              </ul>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">4. Cookies</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Utilizamos cookies para mejorar tu experiencia en nuestro sitio. Las cookies son pequeños archivos 
                que el sitio transfiere a tu disco duro a través de tu navegador.
              </p>
              <p>
                Las cookies nos permiten recordar tus preferencias y entender cómo usás nuestro sitio. 
                Podés elegir configurar tu navegador para rechazar cookies, pero esto puede afectar 
                algunas funcionalidades del sitio.
              </p>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">5. Seguridad de Datos</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Implementamos medidas de seguridad para proteger tu información personal:
              </p>
              <ul className="space-y-2 ml-4 mt-4">
                <li>• Conexión SSL/TLS encriptada</li>
                <li>• Servidores seguros</li>
                <li>• Acceso restringido a información personal</li>
                <li>• Procesadores de pago certificados PCI-DSS</li>
              </ul>
              <p className="mt-4">
                Sin embargo, ningún método de transmisión por Internet es 100% seguro. No podemos garantizar 
                la seguridad absoluta de tu información.
              </p>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">6. Tus Derechos</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Tenés derecho a:</p>
              <ul className="space-y-2 ml-4 mt-4">
                <li>• Acceder a tu información personal</li>
                <li>• Solicitar la corrección de datos incorrectos</li>
                <li>• Solicitar la eliminación de tu información</li>
                <li>• Oponerte al procesamiento de tus datos</li>
                <li>• Retirar tu consentimiento en cualquier momento</li>
                <li>• Cancelar suscripción a emails promocionales</li>
              </ul>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">7. Menores de Edad</h2>
            <p className="text-muted-foreground">
              Nuestro sitio no está dirigido a menores de 18 años. No recopilamos conscientemente información 
              personal de menores. Si descubrimos que hemos recopilado información de un menor, la eliminaremos 
              inmediatamente.
            </p>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">8. Enlaces a Terceros</h2>
            <p className="text-muted-foreground">
              Nuestro sitio puede contener enlaces a sitios de terceros. No somos responsables de las prácticas 
              de privacidad de estos sitios. Te recomendamos leer sus políticas de privacidad.
            </p>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">9. Cambios a Esta Política</h2>
            <p className="text-muted-foreground">
              Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre cambios 
              significativos publicando la nueva política en esta página y actualizando la fecha de "última 
              actualización".
            </p>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">10. Contacto</h2>
            <p className="text-muted-foreground mb-4">
              Si tenés preguntas sobre esta Política de Privacidad, podés contactarnos:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Email: privacy@supply.com</li>
              <li>• WhatsApp: +54 341 210 1416</li>
            </ul>
          </div>
        </div>

        {/* Back Link */}
        <div className="max-w-2xl mx-auto text-center">
          <Link
            href="/"
            className="text-sm uppercase tracking-wide hover:underline underline-offset-4"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
