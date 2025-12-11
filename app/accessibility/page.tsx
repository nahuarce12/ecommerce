import Link from "next/link";
import { Eye } from "lucide-react";

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-6">
            Accesibilidad
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Comprometidos con hacer que nuestro sitio sea accesible para todos
          </p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto space-y-8 mb-16">
          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">Nuestro Compromiso</h2>
            <p className="text-muted-foreground">
              En SUPPLY estamos comprometidos a garantizar la accesibilidad digital para personas con discapacidades. 
              Mejoramos continuamente la experiencia de usuario para todos y aplicamos los estándares de accesibilidad 
              relevantes.
            </p>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">Medidas de Accesibilidad</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Hemos implementado las siguientes medidas para mejorar la accesibilidad:</p>
              <ul className="space-y-2 ml-4">
                <li>• Diseño responsive que funciona en múltiples dispositivos y tamaños de pantalla</li>
                <li>• Contraste de colores adecuado para facilitar la lectura</li>
                <li>• Textos alternativos (alt text) para todas las imágenes</li>
                <li>• Navegación por teclado disponible en todo el sitio</li>
                <li>• Tipografía clara y legible</li>
                <li>• Estructura semántica HTML para lectores de pantalla</li>
                <li>• Etiquetas ARIA cuando es necesario</li>
              </ul>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">Estándares de Conformidad</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Nos esforzamos por cumplir con las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 
                nivel AA. Estas pautas explican cómo hacer el contenido web más accesible para personas con 
                discapacidades.
              </p>
              <p>
                Si bien trabajamos para alcanzar el cumplimiento total, reconocemos que algunas áreas pueden 
                necesitar mejoras continuas.
              </p>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">Navegación y Funcionalidad</h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="font-medium">Navegación por Teclado:</p>
              <ul className="space-y-2 ml-4">
                <li>• <strong>Tab:</strong> Navegar hacia adelante entre elementos interactivos</li>
                <li>• <strong>Shift + Tab:</strong> Navegar hacia atrás</li>
                <li>• <strong>Enter:</strong> Activar enlaces y botones</li>
                <li>• <strong>Escape:</strong> Cerrar modales y overlays</li>
              </ul>
              
              <p className="font-medium mt-4">Zoom del Navegador:</p>
              <p>
                Nuestro sitio soporta zoom del navegador hasta 200% sin pérdida de funcionalidad o contenido.
              </p>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">Tecnologías Compatibles</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Nuestro sitio está diseñado para ser compatible con:</p>
              <ul className="space-y-2 ml-4">
                <li>• Navegadores modernos (Chrome, Firefox, Safari, Edge)</li>
                <li>• Lectores de pantalla (NVDA, JAWS, VoiceOver)</li>
                <li>• Software de reconocimiento de voz</li>
                <li>• Navegación por teclado</li>
                <li>• Ampliadores de pantalla</li>
              </ul>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">Limitaciones Conocidas</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                A pesar de nuestros mejores esfuerzos, algunas limitaciones pueden existir:
              </p>
              <ul className="space-y-2 ml-4">
                <li>• Algunas imágenes de productos pueden carecer de descripciones detalladas</li>
                <li>• Contenido de terceros (videos, widgets) puede no estar completamente accesible</li>
                <li>• Algunas animaciones pueden no ser pausables</li>
              </ul>
              <p className="mt-4">
                Estamos trabajando activamente para mejorar estas áreas.
              </p>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">Evaluación y Pruebas</h2>
            <p className="text-muted-foreground">
              Evaluamos regularmente la accesibilidad de nuestro sitio utilizando:
            </p>
            <ul className="space-y-2 ml-4 mt-4 text-muted-foreground">
              <li>• Herramientas automatizadas de prueba de accesibilidad</li>
              <li>• Pruebas manuales con lectores de pantalla</li>
              <li>• Navegación exclusiva por teclado</li>
              <li>• Pruebas con diferentes dispositivos y tamaños de pantalla</li>
            </ul>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">Feedback y Contacto</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Valoramos tus comentarios sobre la accesibilidad de nuestro sitio. Si encontrás alguna barrera 
                de accesibilidad o tenés sugerencias de mejora, por favor contactanos:
              </p>
              <ul className="space-y-2 mt-4">
                <li>• Email: accessibility@supply.com</li>
                <li>• WhatsApp: +54 341 210 1416</li>
              </ul>
              <p className="mt-4">
                Intentamos responder a consultas de accesibilidad dentro de 2-3 días hábiles.
              </p>
            </div>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">Mejora Continua</h2>
            <p className="text-muted-foreground">
              La accesibilidad es un proceso continuo. Regularmente revisamos nuestro sitio y trabajamos en mejoras. 
              Esta página se actualiza cuando implementamos nuevas características de accesibilidad.
            </p>
          </div>

          <div className="border p-8 bg-card">
            <h2 className="text-2xl font-bold uppercase mb-4">Recursos Adicionales</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Para obtener más información sobre accesibilidad web, visitá:</p>
              <ul className="space-y-2 ml-4 mt-4">
                <li>• W3C Web Accessibility Initiative (WAI)</li>
                <li>• WebAIM (Web Accessibility in Mind)</li>
                <li>• WCAG 2.1 Guidelines</li>
              </ul>
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
