"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getEnabledPaymentMethods, WHATSAPP_NUMBER } from "@/lib/payment-methods";
import { Building2, Wallet, CreditCard } from "lucide-react";
import { SecureBankTransferDetails } from "@/components/checkout/secure-bank-transfer-details";

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelectMethod: (method: string) => void;
}

export function PaymentMethodSelector({ selectedMethod, onSelectMethod }: PaymentMethodSelectorProps) {
  const paymentMethods = getEnabledPaymentMethods();

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

  return (
    <Card className="border-2 border">
      <CardHeader>
        <CardTitle className="uppercase">MÉTODO DE PAGO</CardTitle>
      </CardHeader>

      <CardContent>
        <RadioGroup value={selectedMethod} onValueChange={onSelectMethod}>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id}>
                <div className="flex items-start space-x-3 border-2 border p-4">
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
                  <SecureBankTransferDetails mode="checkout" />
                )}

                {/* Cash Details */}
                {selectedMethod === "cash" && method.id === "cash" && (
                  <Alert className="mt-3 border">
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
          <Alert className="mt-4 border">
            <AlertDescription className="text-xs uppercase">
              SELECCIONA UN MÉTODO DE PAGO PARA CONTINUAR
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
