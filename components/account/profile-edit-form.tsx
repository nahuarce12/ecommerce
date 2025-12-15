"use client";

import { useState, useEffect } from "react";
import { Profile, ARGENTINA_PROVINCES } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  validateArgentinePhone,
  formatArgentinePhone,
  validateArgentinePostalCode,
  formatArgentinePostalCode,
} from "@/lib/validators";

interface ProfileEditFormProps {
  profile: Profile;
  onUpdate: (updatedProfile: Profile) => void;
}

export function ProfileEditForm({ profile, onUpdate }: ProfileEditFormProps) {
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    phone: profile.phone || "",
    address_line1: profile.address_line1 || "",
    address_line2: profile.address_line2 || "",
    city: profile.city || "",
    state_province: profile.state_province || "",
    postal_code: profile.postal_code || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Check if profile is empty (no shipping data)
  const isProfileEmpty = !profile.phone && !profile.address_line1 && !profile.city;

  const handlePhoneChange = (value: string) => {
    const formatted = formatArgentinePhone(value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    // Clear error when user types
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: "" }));
    }
  };

  const handlePhoneBlur = () => {
    if (formData.phone) {
      const validation = validateArgentinePhone(formData.phone);
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, phone: validation.error || "" }));
      }
    }
  };

  const handlePostalCodeChange = (value: string) => {
    const formatted = formatArgentinePostalCode(value);
    setFormData(prev => ({ ...prev, postal_code: formatted }));
    // Clear error when user types
    if (errors.postal_code) {
      setErrors(prev => ({ ...prev, postal_code: "" }));
    }
  };

  const handlePostalCodeBlur = () => {
    if (formData.postal_code) {
      const validation = validateArgentinePostalCode(formData.postal_code);
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, postal_code: validation.error || "" }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone if provided
    if (formData.phone) {
      const phoneValidation = validateArgentinePhone(formData.phone);
      if (!phoneValidation.valid) {
        setErrors(prev => ({ ...prev, phone: phoneValidation.error || "" }));
        return;
      }
    }

    // Validate postal code if provided
    if (formData.postal_code) {
      const postalValidation = validateArgentinePostalCode(formData.postal_code);
      if (!postalValidation.valid) {
        setErrors(prev => ({ ...prev, postal_code: postalValidation.error || "" }));
        return;
      }
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          address_line1: formData.address_line1 || null,
          address_line2: formData.address_line2 || null,
          city: formData.city || null,
          state_province: formData.state_province || null,
          postal_code: formData.postal_code || null,
        })
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;

      toast.success("PERFIL ACTUALIZADO", {
        description: "Tus datos se guardaron correctamente",
      });

      onUpdate(data);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("ERROR AL GUARDAR", {
        description: "No se pudo actualizar tu perfil",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Empty State Message */}
      {isProfileEmpty && (
        <div className="border p-6 bg-card">
          <p className="text-sm uppercase tracking-wide text-center">
            Completá tus datos de envío para acelerar futuras compras
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold uppercase tracking-tight">
            Información Personal
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="text-xs uppercase font-medium block mb-2">
                Nombre Completo
              </label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="JUAN PÉREZ"
                className="uppercase"
              />
            </div>

            <div>
              <label htmlFor="phone" className="text-xs uppercase font-medium block mb-2">
                Teléfono
              </label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={handlePhoneBlur}
                placeholder="+54 9 11 1234-5678"
              />
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1 uppercase">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Shipping Address Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold uppercase tracking-tight">
            Dirección de Envío
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="address_line1" className="text-xs uppercase font-medium block mb-2">
                Dirección
              </label>
              <Input
                id="address_line1"
                type="text"
                value={formData.address_line1}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                placeholder="AV. BELGRANO 1234"
                className="uppercase"
              />
            </div>

            <div>
              <label htmlFor="address_line2" className="text-xs uppercase font-medium block mb-2">
                Piso / Departamento / Oficina
              </label>
              <Input
                id="address_line2"
                type="text"
                value={formData.address_line2}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                placeholder="PISO 2, DEPTO A"
                className="uppercase"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="text-xs uppercase font-medium block mb-2">
                  Ciudad
                </label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="ROSARIO"
                  className="uppercase"
                />
              </div>

              <div>
                <label htmlFor="postal_code" className="text-xs uppercase font-medium block mb-2">
                  Código Postal
                </label>
                <Input
                  id="postal_code"
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handlePostalCodeChange(e.target.value)}
                  onBlur={handlePostalCodeBlur}
                  placeholder="2000"
                  maxLength={4}
                />
                {errors.postal_code && (
                  <p className="text-xs text-red-600 mt-1 uppercase">{errors.postal_code}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="state_province" className="text-xs uppercase font-medium block mb-2">
                Provincia
              </label>
              <Select
                value={formData.state_province}
                onValueChange={(value) => setFormData(prev => ({ ...prev, state_province: value }))}
              >
                <SelectTrigger className="uppercase">
                  <SelectValue placeholder="SELECCIONAR PROVINCIA" />
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

            <div>
              <label htmlFor="country" className="text-xs uppercase font-medium block mb-2">
                País
              </label>
              <Input
                id="country"
                type="text"
                value="ARGENTINA"
                disabled
                className="uppercase bg-muted"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          type="submit"
          className="w-full uppercase tracking-wide"
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>
    </div>
  );
}
