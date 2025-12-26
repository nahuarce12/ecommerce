"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

interface RetryPaymentButtonProps {
  orderId: string;
}

export function RetryPaymentButton({ orderId }: RetryPaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/mercadopago/retry-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al reintentar el pago");
      }

      // Redirect to MercadoPago checkout
      const initPoint = result.sandboxInitPoint || result.initPoint;
      window.location.href = initPoint;

    } catch (error) {
      console.error("Error retrying payment:", error);
      alert(error instanceof Error ? error.message : "Error al reintentar el pago");
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white uppercase mb-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          PROCESANDO...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 mr-2" />
          REINTENTAR PAGO CON MERCADOPAGO
        </>
      )}
    </Button>
  );
}
