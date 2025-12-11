import { MessageCircle, Mail, MapPin, Clock } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-6">
            Contacto
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Estamos para ayudarte con cualquier consulta
          </p>
        </div>

        {/* Contact Methods */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-16">
          {/* WhatsApp */}
          <div className="border p-8 bg-card">
            <div className="flex items-center justify-center w-12 h-12 bg-foreground text-background mb-4">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold uppercase mb-2">WhatsApp</h2>
            <p className="text-muted-foreground mb-4">
              La forma más rápida de contactarnos
            </p>
            <a
              href="https://wa.me/543412101416?text=Hola,%20tengo%20una%20consulta"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline underline-offset-4"
            >
              +54 341 210 1416
            </a>
          </div>

          {/* Email */}
          <div className="border p-8 bg-card">
            <div className="flex items-center justify-center w-12 h-12 bg-foreground text-background mb-4">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold uppercase mb-2">Email</h2>
            <p className="text-muted-foreground mb-4">
              Escribinos y te respondemos en 24hs
            </p>
            <a
              href="mailto:info@supply.com"
              className="text-sm hover:underline underline-offset-4"
            >
              info@supply.com
            </a>
          </div>
        </div>

        {/* Info Sections */}
        <div className="max-w-3xl mx-auto space-y-8 mb-16">
          <div className="border p-8 bg-card">
            <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios de Atención
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex justify-between">
                <span>Lunes a Viernes:</span>
                <span className="font-medium">9:00 - 18:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sábados:</span>
                <span className="font-medium">9:00 - 13:00</span>
              </li>
              <li className="flex justify-between">
                <span>Domingos:</span>
                <span className="font-medium">Cerrado</span>
              </li>
            </ul>
          </div>

          <div className="border p-8 bg-card">
            <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicación
            </h3>
            <p className="text-muted-foreground mb-2">
              Rosario, Santa Fe, Argentina
            </p>
            <p className="text-sm text-muted-foreground">
              *Actualmente operamos solo de forma online
            </p>
          </div>

          <div className="border p-8 bg-card">
            <h3 className="text-xl font-bold uppercase mb-4">
              Preguntas Frecuentes
            </h3>
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-1">¿Cuánto tardan los envíos?</p>
                <p className="text-sm text-muted-foreground">
                  Los productos en stock se envían en 24-48hs. Los encargos desde China demoran 25-35 días.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">¿Hacen envíos a todo el país?</p>
                <p className="text-sm text-muted-foreground">
                  Sí, enviamos a toda Argentina a través de correo argentino y transportes privados.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">¿Puedo cambiar o devolver un producto?</p>
                <p className="text-sm text-muted-foreground">
                  Solo aceptamos cambios y devoluciones en productos con defectos de fábrica. Contactanos para más información. 
                </p>
              </div>
            </div>
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
