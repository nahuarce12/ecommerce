"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { createClient } from "@/lib/supabase/client";
import { ShippingForm } from "@/components/checkout/shipping-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import type { Profile } from "@/types";
import Link from "next/link";

interface StockIssue {
  productId: string;
  productName: string;
  requestedQty: number;
  availableStock: number;
  size: string;
  color: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stockIssues, setStockIssues] = useState<StockIssue[]>([]);
  const [checkingStock, setCheckingStock] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [shippingComplete, setShippingComplete] = useState(false);
  const [shippingCity, setShippingCity] = useState("");
  const [shippingProvince, setShippingProvince] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasInvalidItems, setHasInvalidItems] = useState(false);

  // Check for invalid items (without color or size)
  useEffect(() => {
    const invalidItems = items.filter(item => !item.color || !item.size);
    setHasInvalidItems(invalidItems.length > 0);
  }, [items]);

  const handleClearCartAndReturn = () => {
    clearCart();
    router.push("/");
  };

  useEffect(() => {
    const supabase = createClient();
    
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login?redirect=/checkout");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }
      
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  useEffect(() => {
    if (items.length === 0 && !loading) {
      router.push("/");
    }
  }, [items, loading, router]);

  useEffect(() => {
    const validateStock = async () => {
      if (items.length === 0) return;
      
      setCheckingStock(true);
      const supabase = createClient();
      const issues: StockIssue[] = [];

      for (const item of items) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product.id)
          .single();

        if (product && product.stock < item.quantity) {
          issues.push({
            productId: item.product.id,
            productName: item.product.name,
            requestedQty: item.quantity,
            availableStock: product.stock,
            size: item.size,
            color: item.color,
          });
        }
      }

      setStockIssues(issues);
      setCheckingStock(false);
    };

    if (!loading) {
      validateStock();
    }
  }, [items, loading]);

  const handleFixStock = (productId: string, size: string, color: string, availableStock: number) => {
    if (availableStock === 0) {
      removeItem(productId, size, color);
    } else {
      updateQuantity(productId, size, color, availableStock);
    }
  };

  const handleSubmitOrder = async () => {
    if (!shippingComplete || !selectedPaymentMethod || stockIssues.length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          paymentMethod: selectedPaymentMethod,
          shippingCity,
          shippingProvince,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error response from API:", result);
        setSubmitting(false);
        throw new Error(result.error || "Error al crear la orden");
      }

      console.log("Order created successfully:", result.orderId);
      clearCart();
      setSubmitting(false);
      
      // Navigate to success page
      router.push(`/checkout/success/${result.orderId}`);
    } catch (error) {
      console.error("Error submitting order:", error);
      alert(error instanceof Error ? error.message : "Error al procesar el pedido");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-20">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="space-y-8">
            <Skeleton className="h-12 w-48" />
            <div className="grid lg:grid-cols-[1fr_400px] gap-8">
              <div className="space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold uppercase">CHECKOUT</h1>
          <Link href="/">
            <Button variant="outline" className="border-2 border-black uppercase">
              <ArrowLeft className="h-4 w-4 mr-2" />
              VOLVER A LA TIENDA
            </Button>
          </Link>
        </div>

        {hasInvalidItems && (
          <Alert variant="destructive" className="mb-6 border-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-3">
              <p className="font-semibold uppercase">PRODUCTOS CON DATOS INCOMPLETOS</p>
              <p className="text-sm">
                Tu carrito contiene productos agregados antes de la actualización que no tienen color o talla seleccionados. 
                Por favor, limpia el carrito y vuelve a agregar los productos.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleClearCartAndReturn}
                  className="bg-red-600 text-white hover:bg-red-700 uppercase text-xs"
                >
                  LIMPIAR CARRITO Y VOLVER
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {checkingStock && (
          <Alert className="mb-6 border-black">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription className="uppercase">
              VERIFICANDO STOCK...
            </AlertDescription>
          </Alert>
        )}

        {stockIssues.length > 0 && (
          <Alert variant="destructive" className="mb-6 border-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-3">
              <p className="font-semibold uppercase">PROBLEMAS DE STOCK:</p>
              {stockIssues.map((issue) => (
                <div key={`${issue.productId}-${issue.size}-${issue.color}`} className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium">{issue.productName}</p>
                    <p className="text-xs">
                      {issue.color} / TALLE: {issue.size} - Solicitado: {issue.requestedQty}, Disponible: {issue.availableStock}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFixStock(issue.productId, issue.size, issue.color, issue.availableStock)}
                    className="uppercase text-xs"
                  >
                    {issue.availableStock === 0 ? "ELIMINAR" : "AJUSTAR"}
                  </Button>
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          <div className="space-y-8">
            <ShippingForm
              profile={profile}
              onComplete={(city, province) => {
                setShippingComplete(true);
                setShippingCity(city);
                setShippingProvince(province);
              }}
              onProfileUpdate={(updatedProfile) => {
                setProfile(updatedProfile);
              }}
            />

            <PaymentMethodSelector
              selectedMethod={selectedPaymentMethod}
              onSelectMethod={setSelectedPaymentMethod}
            />
          </div>

          <div className="lg:sticky lg:top-32 h-fit">
            <OrderSummary
              city={shippingCity}
              province={shippingProvince}
            />

            <Button
              onClick={handleSubmitOrder}
              disabled={!shippingComplete || !selectedPaymentMethod || stockIssues.length > 0 || submitting || hasInvalidItems}
              className="w-full mt-6 bg-black text-white hover:bg-gray-800 uppercase h-14 text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  PROCESANDO...
                </>
              ) : (
                "CONFIRMAR PEDIDO"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
