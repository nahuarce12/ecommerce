"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Building2, Eye, EyeOff, MessageCircle, ShieldCheck, Timer } from "lucide-react";

type BankInfo = {
  cbu: string;
  alias: string;
  holder: string;
  bank: string;
  accountType: string;
};

type BankInfoResponse = {
  bankInfo: BankInfo;
  whatsappNumber: string;
  revealWindowSeconds: number;
};

interface SecureBankTransferDetailsProps {
  mode: "checkout" | "success";
  whatsappLink?: string;
  orderReference?: string;
}

const DEFAULT_REVEAL_WINDOW_SECONDS = 600;

function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function sanitizePhone(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function SecureBankTransferDetails({ mode, whatsappLink, orderReference }: SecureBankTransferDetailsProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isRevealed = bankInfo !== null && remainingSeconds > 0;

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const tick = () => {
      const nextRemaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemainingSeconds(nextRemaining);

      if (nextRemaining === 0) {
        setBankInfo(null);
        setExpiresAt(null);
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  const whatsappHref = useMemo(() => {
    if (whatsappLink) {
      return whatsappLink;
    }

    if (!whatsappNumber) {
      return undefined;
    }

    return `https://wa.me/${sanitizePhone(whatsappNumber)}`;
  }, [whatsappLink, whatsappNumber]);

  const hideDetails = () => {
    setBankInfo(null);
    setExpiresAt(null);
    setRemainingSeconds(0);
  };

  const handleReveal = async () => {
    if (!acceptedTerms || isLoading) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/payment/bank-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const payload = (await response.json()) as Partial<BankInfoResponse> & { error?: string };

      if (!response.ok || !payload.bankInfo) {
        throw new Error(payload.error || "NO SE PUDIERON OBTENER LOS DATOS BANCARIOS");
      }

      const revealWindowSeconds = payload.revealWindowSeconds || DEFAULT_REVEAL_WINDOW_SECONDS;

      setBankInfo(payload.bankInfo);
      setWhatsappNumber(payload.whatsappNumber || "");
      setExpiresAt(Date.now() + revealWindowSeconds * 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ERROR AL CARGAR DATOS BANCARIOS";
      setErrorMessage(message.toUpperCase());
      hideDetails();
    } finally {
      setIsLoading(false);
    }
  };

  const showHeader = mode === "success";

  return (
    <Alert className={mode === "checkout" ? "mt-3 border" : "border-2 border"}>
      <ShieldCheck className="h-4 w-4" />
      <AlertDescription className="space-y-4">
        {showHeader && (
          <p className="font-semibold uppercase text-sm">INSTRUCCIONES DE PAGO</p>
        )}

        <div className="space-y-2">
          <p className="font-semibold uppercase text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            TRANSFERENCIA BANCARIA SEGURA
          </p>
          <p className="text-xs uppercase leading-relaxed text-gray-700">
            LOS DATOS BANCARIOS SE MUESTRAN TEMPORALMENTE POR SEGURIDAD. CONFIRMA Y REVELA PARA VERLOS.
          </p>
        </div>

        {!isRevealed && (
          <div className="space-y-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span className="text-xs uppercase text-gray-700 leading-relaxed">
                ENTIENDO QUE ESTA INFORMACIÓN ES CONFIDENCIAL Y SOLO LA USARÉ PARA REALIZAR ESTE PAGO.
              </span>
            </label>

            <Button
              type="button"
              onClick={handleReveal}
              disabled={!acceptedTerms || isLoading}
              className="w-full uppercase"
            >
              <Eye className="h-4 w-4 mr-2" />
              {isLoading ? "CARGANDO DATOS BANCARIOS" : "REVELAR DATOS BANCARIOS"}
            </Button>

            {errorMessage && (
              <Alert className="border-red-600 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-xs uppercase text-red-700">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {isRevealed && bankInfo && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-yellow-600 bg-yellow-50 p-2">
              <p className="text-xs uppercase font-semibold flex items-center gap-2 text-yellow-700">
                <Timer className="h-3.5 w-3.5" />
                EXPIRA EN {formatCountdown(remainingSeconds)}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={hideDetails} className="uppercase">
                <EyeOff className="h-3.5 w-3.5 mr-1" />
                OCULTAR
              </Button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-gray-200 gap-1">
                <span className="text-gray-600 uppercase">CBU</span>
                <span className="font-mono font-semibold text-[10px] sm:text-xs break-all">{bankInfo.cbu}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-gray-200 gap-1">
                <span className="text-gray-600 uppercase">ALIAS</span>
                <span className="font-mono font-semibold break-all">{bankInfo.alias}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200 gap-2">
                <span className="text-gray-600 uppercase">TITULAR</span>
                <span className="font-semibold uppercase text-right">{bankInfo.holder}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200 gap-2">
                <span className="text-gray-600 uppercase">BANCO</span>
                <span className="font-semibold uppercase text-right">{bankInfo.bank}</span>
              </div>
              <div className="flex justify-between items-center py-1 gap-2">
                <span className="text-gray-600 uppercase">TIPO DE CUENTA</span>
                <span className="font-semibold uppercase text-right">{bankInfo.accountType}</span>
              </div>
            </div>
          </div>
        )}

        <Alert className="border-green-600 bg-green-50">
          <MessageCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="space-y-3">
            <p className="font-semibold uppercase text-sm">ENVÍA EL COMPROBANTE POR WHATSAPP</p>
            <p className="text-xs uppercase leading-relaxed">
              AL COMPLETAR LA TRANSFERENCIA, ENVÍA EL COMPROBANTE{orderReference ? ` DE LA ORDEN ${orderReference}` : ""} PARA VALIDAR EL PAGO.
            </p>
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button type="button" className="w-full bg-green-600 hover:bg-green-700 text-white uppercase">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  IR A WHATSAPP
                </Button>
              </a>
            )}
          </AlertDescription>
        </Alert>
      </AlertDescription>
    </Alert>
  );
}