"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getEnabledPaymentMethods, BANK_INFO, WHATSAPP_NUMBER } from "@/lib/payment-methods";
import { Building2, Wallet, CreditCard, MessageCircle, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelectMethod: (method: string) => void;
}

export function PaymentMethodSelector({ selectedMethod, onSelectMethod }: PaymentMethodSelectorProps) {
  const paymentMethods = getEnabledPaymentMethods();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const getIcon = (id: string) => {
    switch (id) {
      case "bank_transfer":
        return <Building2 className="h-5 w-5" />;
      case "cash":
        return <Wallet className="h-5 w-5" />;
      case "mercadopago":
        return <CreditCard className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field.toUpperCase()} COPIADO`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("ERROR AL COPIAR");
    }
  };

  return (
    <Card className="border-2 border-black">
      <CardHeader>
        <CardTitle className="uppercase">MÉTODO DE PAGO</CardTitle>
      </CardHeader>

      <CardContent>
        <RadioGroup value={selectedMethod} onValueChange={onSelectMethod}>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id}>
                <div className="flex items-start space-x-3 border-2 border-black p-4">
                  <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                  <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      {getIcon(method.id)}
                      <span className="font-semibold uppercase">{method.name}</span>
                      {!method.enabled && (
                        <Badge variant="secondary" className="uppercase text-xs">
                          PRÓXIMAMENTE
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 uppercase leading-relaxed">
                      {method.description}
                    </p>
                  </Label>
                </div>

                {/* Bank Transfer Details */}
                {selectedMethod === "bank_transfer" && method.id === "bank_transfer" && (
                  <Alert className="mt-3 border-black">
                    <Building2 className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold uppercase mb-3 text-sm">DATOS BANCARIOS</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-gray-200">
                          <span className="text-gray-600 uppercase">CBU</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{BANK_INFO.cbu}</span>
                            <button
                              onClick={() => copyToClipboard(BANK_INFO.cbu, "CBU")}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {copiedField === "CBU" ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-200">
                          <span className="text-gray-600 uppercase">ALIAS</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{BANK_INFO.alias}</span>
                            <button
                              onClick={() => copyToClipboard(BANK_INFO.alias, "ALIAS")}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {copiedField === "ALIAS" ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-200">
                          <span className="text-gray-600 uppercase">TITULAR</span>
                          <span className="font-semibold uppercase">{BANK_INFO.holder}</span>
                        </div>

                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600 uppercase">BANCO</span>
                          <span className="font-semibold uppercase">{BANK_INFO.bank}</span>
                        </div>
                      </div>

                      <Alert className="mt-4 border-green-600 bg-green-50">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-xs uppercase">
                          ENVÍA EL COMPROBANTE POR WHATSAPP AL <span className="font-semibold">{WHATSAPP_NUMBER}</span> CON TU NÚMERO DE PEDIDO
                        </AlertDescription>
                      </Alert>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Cash Details */}
                {selectedMethod === "cash" && method.id === "cash" && (
                  <Alert className="mt-3 border-black">
                    <Wallet className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold uppercase mb-2 text-sm">PAGO EN EFECTIVO</p>
                      <p className="text-xs uppercase leading-relaxed">
                        UNA VEZ CONFIRMADO EL PEDIDO, TE CONTACTAREMOS POR WHATSAPP AL <span className="font-semibold">{WHATSAPP_NUMBER}</span> PARA COORDINAR LA ENTREGA Y EL PAGO.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        </RadioGroup>

        {!selectedMethod && (
          <Alert className="mt-4 border-black">
            <AlertDescription className="text-xs uppercase">
              SELECCIONA UN MÉTODO DE PAGO PARA CONTINUAR
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
