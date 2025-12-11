import Link from "next/link";
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-6">
            Términos y Condiciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: Diciembre 2025
          </p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto space-y-8 mb-16">
          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">1. Aceptación de Términos</h2>
            <p className="text-muted-foreground">
              Al acceder y utilizar este sitio web, aceptás estar sujeto a estos términos y condiciones de uso. 
              Si no estás de acuerdo con alguno de estos términos, te solicitamos que no uses nuestro sitio.
            </p>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">2. Productos y Precios</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Los precios de los productos están sujetos a cambios sin previo aviso. Nos reservamos el derecho 
                de modificar o discontinuar productos en cualquier momento.
              </p>
              <p>
                Todos los precios están expresados en pesos argentinos (ARS) e incluyen IVA cuando corresponda.
              </p>
              <p>
                Las imágenes de los productos son referenciales y pueden variar ligeramente del producto real.
              </p>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">3. Compra y Pago</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Al realizar un pedido, declarás que tenés capacidad legal para realizar transacciones vinculantes.
              </p>
              <p>
                Nos reservamos el derecho de rechazar o cancelar cualquier pedido por cualquier motivo, incluyendo 
                disponibilidad de productos, errores en precios o información, o problemas identificados por nuestro 
                departamento de fraude.
              </p>
              <p>
                El pago debe realizarse al momento de confirmar el pedido a través de los métodos habilitados.
              </p>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">4. Envíos</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Los tiempos de envío son estimados y no están garantizados. No nos hacemos responsables por demoras 
                causadas por servicios de mensajería o aduana.
              </p>
              <p>
                Para encargos internacionales, los tiempos pueden variar entre 25-35 días según disponibilidad y 
                procesos aduaneros.
              </p>
              <p>
                El riesgo de pérdida o daño pasa al comprador una vez que el paquete es entregado al servicio de mensajería.
              </p>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">5. Devoluciones y Cambios</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Aceptamos devoluciones únicamente en caso de productos defectuosos o error en el envío.
              </p>
              <p>
                Tenés 10 días corridos desde la recepción del producto para notificarnos sobre cualquier defecto.
              </p>
              <p>
                Los productos personalizados o encargos especiales no admiten cambios ni devoluciones.
              </p>
              <p>
                El costo de envío de la devolución corre por cuenta del vendedor solo en caso de error de nuestra parte 
                o defecto de fábrica.
              </p>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">6. Propiedad Intelectual</h2>
            <p className="text-muted-foreground">
              Todo el contenido de este sitio, incluyendo textos, gráficos, logos e imágenes, es propiedad de SUPPLY 
              o sus proveedores de contenido y está protegido por leyes de propiedad intelectual.
            </p>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">7. Limitación de Responsabilidad</h2>
            <p className="text-muted-foreground">
              No seremos responsables por daños indirectos, incidentales o consecuentes que resulten del uso o 
              imposibilidad de uso de nuestros productos o sitio web.
            </p>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">8. Modificaciones</h2>
            <p className="text-muted-foreground">
              Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. 
              Los cambios entrarán en vigencia inmediatamente después de su publicación en el sitio.
            </p>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">9. Contacto</h2>
            <p className="text-muted-foreground mb-4">
              Si tenés preguntas sobre estos Términos y Condiciones, podés contactarnos:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Email: info@supply.com</li>
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
