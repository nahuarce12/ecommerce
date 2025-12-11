import { MessageCircle, Package, Clock, Shield, Truck } from "lucide-react";
import Link from "next/link";

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-6">
            Encargos Personalizados
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            ¿No encontraste lo que buscabas? Hacemos encargos directos desde China
          </p>
        </div>

        {/* How it Works */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight mb-8 text-center">
            Cómo Funciona
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="border p-6 bg-card">
              <div className="flex items-center justify-center w-12 h-12 bg-foreground text-background mb-4 mx-auto">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold uppercase mb-2 text-center">1. Contacto</h3>
              <p className="text-sm text-muted-foreground text-center">
                Envíanos el link del producto que querés por WhatsApp
              </p>
            </div>

            {/* Step 2 */}
            <div className="border p-6 bg-card">
              <div className="flex items-center justify-center w-12 h-12 bg-foreground text-background mb-4 mx-auto">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold uppercase mb-2 text-center">2. Cotización</h3>
              <p className="text-sm text-muted-foreground text-center">
                Te enviamos el precio final con envío incluido
              </p>
            </div>

            {/* Step 3 */}
            <div className="border p-6 bg-card">
              <div className="flex items-center justify-center w-12 h-12 bg-foreground text-background mb-4 mx-auto">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold uppercase mb-2 text-center">3. Confirmación</h3>
              <p className="text-sm text-muted-foreground text-center">
                Confirmás el pedido y realizás el pago
              </p>
            </div>

            {/* Step 4 */}
            <div className="border p-6 bg-card">
              <div className="flex items-center justify-center w-12 h-12 bg-foreground text-background mb-4 mx-auto">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold uppercase mb-2 text-center">4. Envío</h3>
              <p className="text-sm text-muted-foreground text-center">
                Recibís tu producto en la puerta de tu casa
              </p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="max-w-3xl mx-auto mb-16 space-y-8">
          <div className="border p-8 bg-card">
            <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tiempos de Entrega
            </h3>
            <p className="text-muted-foreground mb-4">
              Los encargos desde China demoran aproximadamente:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 bg-foreground flex-shrink-0" />
                <span><strong>25-35 días:</strong> Envío estándar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 bg-foreground flex-shrink-0" />
                <span><strong>15-25 días:</strong> Envío express (costo adicional)</span>
              </li>
            </ul>
          </div>

          <div className="border p-8 bg-card">
            <h3 className="text-xl font-bold uppercase mb-4">
              ¿Qué Podés Encargar?
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 bg-foreground flex-shrink-0" />
                <span>Zapatillas de cualquier marca</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 bg-foreground flex-shrink-0" />
                <span>Ropa streetwear y deportiva</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 bg-foreground flex-shrink-0" />
                <span>Accesorios (gorras, mochilas, relojes, etc)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 bg-foreground flex-shrink-0" />
                <span>Y mucho más - consultanos por cualquier producto</span>
              </li>
            </ul>
          </div>

          <div className="border p-8 bg-card">
            <h3 className="text-xl font-bold uppercase mb-4">
              Beneficios
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 bg-foreground flex-shrink-0" />
                <span>Precios directos desde China sin intermediarios</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 bg-foreground flex-shrink-0" />
                <span>Control de calidad antes del envío</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 bg-foreground flex-shrink-0" />
                <span>Seguimiento del pedido en todo momento</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 bg-foreground flex-shrink-0" />
                <span>Atención personalizada via WhatsApp</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="border p-12 bg-card">
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight mb-4">
              ¿Listo Para Hacer Tu Encargo?
            </h2>
            <p className="text-muted-foreground mb-8">
              Contactanos por WhatsApp y te cotizamos tu pedido en minutos
            </p>
            <a
              className="w-full md:w-auto bg-foreground text-background px-8 py-4 uppercase font-medium tracking-wide hover:bg-foreground/90 transition-colors flex items-center justify-center gap-3 mx-auto"
              href="https://wa.me/543412101416?text=Hola,%20quiero%20hacer%20un%20encargo"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-5 w-5" />
              Contactar por WhatsApp
            </a>
          </div>
        </div>

        {/* Back Link */}
        <div className="max-w-2xl mx-auto text-center mt-12">
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
