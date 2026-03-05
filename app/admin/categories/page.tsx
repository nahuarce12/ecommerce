"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/image-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface CategoryMeasurementFieldForm {
  key: string;
  label: string;
  unit: string;
}

type CategoryWithProductsCount = Category & {
  products: Array<{ count: number }>;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithProductsCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    size_measure_schema: [] as CategoryMeasurementFieldForm[],
    size_guide_image_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setFormData({
        name: selectedCategory.name,
        slug: selectedCategory.slug,
        description: selectedCategory.description || "",
        size_measure_schema: Array.isArray(selectedCategory.size_measure_schema)
          ? selectedCategory.size_measure_schema.map((field) => ({
              key: field.key,
              label: field.label,
              unit: field.unit?.toLowerCase() || "cm",
            }))
          : [],
        size_guide_image_url: selectedCategory.size_guide_image_url || "",
      });
      setFormErrors({});
    } else {
      resetForm();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, description, size_measure_schema, size_guide_image_url, created_at, products(count)")
      .order("name");

    if (data) setCategories(data as CategoryWithProductsCount[]);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      size_measure_schema: [],
      size_guide_image_url: "",
    });
    setFormErrors({});
  };

  const addMeasurementField = () => {
    setFormData((prev) => ({
      ...prev,
      size_measure_schema: [...prev.size_measure_schema, { key: "", label: "", unit: "cm" }],
    }));
  };

  const removeMeasurementField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      size_measure_schema: prev.size_measure_schema.filter((_, i) => i !== index),
    }));
  };

  const updateMeasurementField = (
    index: number,
    field: keyof CategoryMeasurementFieldForm,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      size_measure_schema: prev.size_measure_schema.map((measurement, i) => {
        if (i !== index) return measurement;
        const nextValue = field === "key" ? value.toLowerCase() : value;
        return { ...measurement, [field]: nextValue };
      }),
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});

    const response = await fetch("/api/admin/categories/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedCategory?.id,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        size_measure_schema: formData.size_measure_schema
          .filter((field) => field.key.trim() || field.label.trim())
          .map((field) => ({
            key: field.key.trim(),
            label: field.label.trim(),
            unit: field.unit.trim() || "cm",
          })),
        size_guide_image_url: formData.size_guide_image_url || null,
      }),
    });

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      if (result?.fields) {
        setFormErrors(result.fields);
      }
      toast.error(result?.error || "ERROR AL GUARDAR CATEGORÍA");
      return;
    }

    toast.success(selectedCategory ? "CATEGORÍA ACTUALIZADA" : "CATEGORÍA CREADA");
    setDialogOpen(false);
    setSelectedCategory(null);
    resetForm();
    fetchCategories();
  };

  const handleDelete = async (category: CategoryWithProductsCount) => {
    const productCount = category.products?.[0]?.count || 0;

    if (productCount > 0) {
      alert(`Cannot delete category with ${productCount} product(s). Remove products first.`);
      return;
    }

    if (!confirm(`Delete category "${category.name}"?`)) return;

    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", category.id);

    if (error) {
      alert("Failed to delete category");
      console.error(error);
    } else {
      fetchCategories();
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    resetForm();
  };

  if (loading) {
    return <div className="text-center py-12 uppercase">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground uppercase mt-1">Organize your products</p>
        </div>
        <Button
          onClick={() => {
            setSelectedCategory(null);
            setDialogOpen(true);
          }}
          className="uppercase"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase">Name</TableHead>
              <TableHead className="uppercase">Slug</TableHead>
              <TableHead className="uppercase">Description</TableHead>
              <TableHead className="uppercase">Sizing</TableHead>
              <TableHead className="uppercase">Imagen guía</TableHead>
              <TableHead className="uppercase">Products</TableHead>
              <TableHead className="uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => {
              const productCount = category.products?.[0]?.count || 0;
              return (
                <TableRow key={category.id}>
                  <TableCell className="font-medium uppercase text-xs">{category.name}</TableCell>
                  <TableCell className="text-xs">{category.slug}</TableCell>
                  <TableCell className="text-xs max-w-md truncate">{category.description || "-"}</TableCell>
                  <TableCell className="text-xs">
                    {Array.isArray(category.size_measure_schema) && category.size_measure_schema.length > 0
                      ? `${category.size_measure_schema.length} campos`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {category.size_guide_image_url ? "Sí" : "-"}
                  </TableCell>
                  <TableCell className="text-xs">{productCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(category);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(category)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase">{selectedCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription className="uppercase text-xs">
              {selectedCategory ? "Update category details" : "Create a new category"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase font-medium block mb-2">Category Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Remeras"
                className={`uppercase ${formErrors.name ? "border-red-500" : ""}`}
              />
              {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="text-xs uppercase font-medium block mb-2">Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                placeholder="remeras"
                className={formErrors.slug ? "border-red-500" : ""}
              />
              {formErrors.slug && <p className="text-xs text-red-600 mt-1">{formErrors.slug}</p>}
            </div>

            <div>
              <label className="text-xs uppercase font-medium block mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category description..."
                rows={3}
                className="uppercase placeholder:uppercase"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-medium block mb-2">Imagen guía de medidas</label>
              <ImageUpload
                images={formData.size_guide_image_url ? [formData.size_guide_image_url] : []}
                maxImages={1}
                onChange={(images) =>
                  setFormData((prev) => ({
                    ...prev,
                    size_guide_image_url: images[0] || "",
                  }))
                }
              />
              {formErrors.size_guide_image_url && (
                <p className="text-xs text-red-600 mt-1">{formErrors.size_guide_image_url}</p>
              )}
            </div>

            <div className="space-y-3 border p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase font-medium">Campos de medidas por talle</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMeasurementField}
                  className="uppercase"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar campo
                </Button>
              </div>

              {formData.size_measure_schema.length === 0 ? (
                <p className="text-xs text-muted-foreground uppercase">
                  Sin campos configurados. Ejemplo buzo: ancho, largo, manga.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.size_measure_schema.map((field, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <label className="text-[10px] uppercase text-muted-foreground block mb-1">Clave</label>
                        <Input
                          value={field.key}
                          onChange={(e) => updateMeasurementField(index, "key", e.target.value)}
                          placeholder="ancho"
                          className="lowercase"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="text-[10px] uppercase text-muted-foreground block mb-1">Etiqueta</label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateMeasurementField(index, "label", e.target.value)}
                          placeholder="Ancho"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] uppercase text-muted-foreground block mb-1">Unidad</label>
                        <Input
                          value={field.unit}
                          onChange={(e) => updateMeasurementField(index, "unit", e.target.value)}
                          placeholder="cm"
                          className="lowercase"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMeasurementField(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formErrors.size_measure_schema && (
                <p className="text-xs text-red-600">{formErrors.size_measure_schema}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} className="uppercase">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="uppercase">
                {saving ? "Saving..." : selectedCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
