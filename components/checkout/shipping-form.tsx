"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { validateArgentinePhone, formatArgentinePhone, validateArgentinePostalCode, formatArgentinePostalCode } from "@/lib/validators";
import { hasCompleteShippingInfo } from "@/lib/shipping-helpers";
import { ARGENTINA_PROVINCES, type Profile } from "@/types";
import { CheckCircle, Edit2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ShippingFormProps {
  profile: Profile | null;
  onComplete: (city: string, province: string) => void;
  onProfileUpdate?: (profile: Profile) => void;
}

export function ShippingForm({ profile, onComplete, onProfileUpdate }: ShippingFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state_province: "",
    postal_code: "",
  });

  const [errors, setErrors] = useState({
    phone: "",
    postal_code: "",
  });

  useEffect(() => {
    if (profile) {
      const hasComplete = hasCompleteShippingInfo(profile);
      setIsEditing(!hasComplete);
      
      setFormData({
        phone: profile.phone || "",
        address_line1: profile.address_line1 || "",
        address_line2: profile.address_line2 || "",
        city: profile.city || "",
        state_province: profile.state_province || "",
        postal_code: profile.postal_code || "",
      });

      if (hasComplete) {
        onComplete(profile.city!, profile.state_province!);
      }
    } else {
      setIsEditing(true);
    }
  }, [profile, onComplete]);

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: value });
    if (errors.phone) {
      setErrors({ ...errors, phone: "" });
    }
  };

  const handlePhoneBlur = () => {
    if (formData.phone) {
      const formatted = formatArgentinePhone(formData.phone);
      setFormData({ ...formData, phone: formatted });
      
      const validation = validateArgentinePhone(formatted);
      if (!validation.valid) {
        setErrors({ ...errors, phone: validation.error || "" });
      }
    }
  };

  const handlePostalCodeChange = (value: string) => {
    const formatted = formatArgentinePostalCode(value);
    setFormData({ ...formData, postal_code: formatted });
    if (errors.postal_code) {
      setErrors({ ...errors, postal_code: "" });
    }
  };

  const handlePostalCodeBlur = () => {
    if (formData.postal_code) {
      const validation = validateArgentinePostalCode(formData.postal_code);
      if (!validation.valid) {
        setErrors({ ...errors, postal_code: validation.error || "" });
      }
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.phone || !formData.address_line1 || !formData.city || !formData.state_province || !formData.postal_code) {
      toast.error("COMPLETA TODOS LOS CAMPOS REQUERIDOS");
      return;
    }

    // Validate phone
    const phoneValidation = validateArgentinePhone(formData.phone);
    if (!phoneValidation.valid) {
      setErrors({ ...errors, phone: phoneValidation.error || "" });
      return;
    }

    // Validate postal code
    const postalValidation = validateArgentinePostalCode(formData.postal_code);
    if (!postalValidation.valid) {
      setErrors({ ...errors, postal_code: postalValidation.error || "" });
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("DEBES INICIAR SESIÓN");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          phone: formData.phone,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          city: formData.city,
          state_province: formData.state_province,
          postal_code: formData.postal_code,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update local profile state
      if (profile && onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          phone: formData.phone,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          city: formData.city,
          state_province: formData.state_province,
          postal_code: formData.postal_code,
        });
      }

      toast.success("DIRECCIÓN GUARDADA");
      setIsEditing(false);
      onComplete(formData.city, formData.state_province);
    } catch (error) {
      console.error("Error saving shipping:", error);
      toast.error("ERROR AL GUARDAR LA DIRECCIÓN");
    } finally {
      setSaving(false);
    }
  };

  const isComplete = formData.phone && formData.address_line1 && formData.city && formData.state_province && formData.postal_code;

  return (
    <Card className="border-2 border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="uppercase">DIRECCIÓN DE ENVÍO</CardTitle>
          {!isEditing && isComplete && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
        </div>
        {!isEditing && isComplete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="uppercase"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            EDITAR
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {!isEditing && isComplete ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{formData.address_line1}</p>
            {formData.address_line2 && <p>{formData.address_line2}</p>}
            <p>{formData.city}, {formData.state_province}</p>
            <p>CP: {formData.postal_code}</p>
            <p>TEL: {formData.phone}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {!profile && (
              <Alert className="border">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs uppercase">
                  ESTA DIRECCIÓN SE GUARDARÁ EN TU PERFIL
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="phone" className="uppercase text-xs">TELÉFONO *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={handlePhoneBlur}
                placeholder="+54 341 234 5678"
                className={`uppercase ${errors.phone ? "border-red-500" : ""}`}
              />
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address_line1" className="uppercase text-xs">DIRECCIÓN *</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                placeholder="CALLE 1234"
                className="uppercase"
              />
            </div>

            <div>
              <Label htmlFor="address_line2" className="uppercase text-xs">PISO / DEPTO (OPCIONAL)</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                placeholder="PISO 2 DEPTO A"
                className="uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="uppercase text-xs">CIUDAD *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="ROSARIO"
                  className="uppercase"
                />
              </div>

              <div>
                <Label htmlFor="postal_code" className="uppercase text-xs">CÓDIGO POSTAL *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handlePostalCodeChange(e.target.value)}
                  onBlur={handlePostalCodeBlur}
                  placeholder="2000"
                  maxLength={4}
                  className={`uppercase ${errors.postal_code ? "border-red-500" : ""}`}
                />
                {errors.postal_code && (
                  <p className="text-xs text-red-600 mt-1">{errors.postal_code}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="state_province" className="uppercase text-xs">PROVINCIA *</Label>
              <Select
                value={formData.state_province}
                onValueChange={(value) => setFormData({ ...formData, state_province: value })}
              >
                <SelectTrigger className="uppercase">
                  <SelectValue placeholder="SELECCIONA UNA PROVINCIA" />
                </SelectTrigger>
                <SelectContent>
                  {ARGENTINA_PROVINCES.map((province) => (
                    <SelectItem key={province} value={province} className="uppercase">
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !!errors.phone || !!errors.postal_code}
              className="w-full bg-black text-white hover:bg-gray-800 uppercase"
            >
              {saving ? "GUARDANDO..." : "GUARDAR DIRECCIÓN"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
