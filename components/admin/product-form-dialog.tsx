"use client";

import { useState, useEffect } from "react";
import { Product, Category } from "@/types";
import { useAdminStore } from "@/store/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/image-upload";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SizeStock {
  label: string;
  stock: string;
}

interface ProductFormDialogProps {
  onSuccess: () => void;
  categories: Category[];
}

export function ProductFormDialog({ onSuccess, categories }: ProductFormDialogProps) {
  const { productDialogOpen, selectedProduct, setProductDialogOpen, setSelectedProduct } = useAdminStore();
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    brand: "",
    stock: "",
    category_id: "",
    images: [] as string[],
    colors: "",
  });
  const [hasSizes, setHasSizes] = useState(false);
  const [sizeStocks, setSizeStocks] = useState<SizeStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.name || "",
        slug: selectedProduct.slug || "",
        description: selectedProduct.description || "",
        price: selectedProduct.price?.toString() || "",
        brand: selectedProduct.brand || "",
        stock: selectedProduct.stock?.toString() || "",
        category_id: selectedProduct.category_id || "",
        images: selectedProduct.images || [],
        colors: selectedProduct.colors?.join(", ") || "",
      });

      if (selectedProduct.product_sizes && selectedProduct.product_sizes.length > 0) {
        setHasSizes(true);
        setSizeStocks(
          selectedProduct.product_sizes.map((ps) => ({
            label: ps.size_label,
            stock: ps.stock.toString(),
          }))
        );
      } else {
        setHasSizes(false);
        setSizeStocks([]);
      }
    } else {
      resetForm();
    }
  }, [selectedProduct]);

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: "",
      brand: "",
      stock: "",
      category_id: "",
      images: [],
      colors: "",
    });
    setHasSizes(false);
    setSizeStocks([]);
    setFormErrors({});
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const addSizeRow = () => {
    setSizeStocks((prev) => [...prev, { label: "", stock: "0" }]);
  };

  const removeSizeRow = (index: number) => {
    setSizeStocks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSizeRow = (index: number, field: keyof SizeStock, value: string) => {
    setSizeStocks((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const getTotalSizeStock = () => {
    return sizeStocks.reduce((sum, s) => sum + (parseInt(s.stock) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormErrors({});

    const payload = {
      id: selectedProduct?.id,
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      price: formData.price,
      brand: formData.brand,
      stock: hasSizes ? getTotalSizeStock() : formData.stock,
      category_id: formData.category_id || null,
      images: formData.images,
      colors: formData.colors.split(",").map((c) => c.trim()).filter(Boolean),
      sizeStocks: hasSizes
        ? sizeStocks
            .filter((s) => s.label.trim())
            .map((s) => ({ label: s.label.trim(), stock: s.stock }))
        : [],
    };

    const response = await fetch("/api/admin/products/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      setLoading(false);
      if (result?.fields) {
        setFormErrors(result.fields);
      }
      toast.error(result?.error || "ERROR AL GUARDAR PRODUCTO");
      return;
    }

    setLoading(false);
    toast.success(selectedProduct ? "PRODUCTO ACTUALIZADO" : "PRODUCTO CREADO");
    setProductDialogOpen(false);
    setSelectedProduct(null);
    resetForm();
    onSuccess();
  };

  const handleClose = () => {
    setProductDialogOpen(false);
    setSelectedProduct(null);
    resetForm();
  };

  return (
    <Dialog open={productDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {selectedProduct ? "Edit Product" : "Add Product"}
          </DialogTitle>
          <DialogDescription className="uppercase text-xs">
            {selectedProduct ? "Update product details" : "Create a new product"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs uppercase font-medium block mb-2">
                Product Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Supreme Box Logo Hoodie"
                className={`uppercase ${formErrors.name ? "border-red-500" : ""}`}
              />
              {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
            </div>

            <div className="col-span-2">
              <label className="text-xs uppercase font-medium block mb-2">
                Slug
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                placeholder="supreme-box-logo-hoodie"
                className={formErrors.slug ? "border-red-500" : ""}
              />
              {formErrors.slug && <p className="text-xs text-red-600 mt-1">{formErrors.slug}</p>}
            </div>

            <div className="col-span-2">
              <label className="text-xs uppercase font-medium block mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
                rows={3}
                className="uppercase placeholder:uppercase"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-medium block mb-2">
                Brand *
              </label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
                placeholder="Supreme"
                className={`uppercase ${formErrors.brand ? "border-red-500" : ""}`}
              />
              {formErrors.brand && <p className="text-xs text-red-600 mt-1">{formErrors.brand}</p>}
            </div>

            <div>
              <label className="text-xs uppercase font-medium block mb-2">
                Category
              </label>
              <Select
                value={formData.category_id}
                onValueChange={(val) => setFormData({ ...formData, category_id: val })}
              >
                <SelectTrigger className="uppercase">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="uppercase">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs uppercase font-medium block mb-2">
                Price *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                placeholder="299.99"
                className={formErrors.price ? "border-red-500" : ""}
              />
              {formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
            </div>

            {/* Sizes toggle */}
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSizes}
                  onChange={(e) => {
                    setHasSizes(e.target.checked);
                    if (e.target.checked && sizeStocks.length === 0) {
                      setSizeStocks([{ label: "", stock: "0" }]);
                    }
                  }}
                  className="cursor-pointer"
                />
                <span className="text-xs uppercase font-medium">
                  Este producto tiene talles
                </span>
              </label>
            </div>

            {/* Stock input (only when no sizes) */}
            {!hasSizes && (
              <div className="col-span-2">
                <label className="text-xs uppercase font-medium block mb-2">
                  Stock *
                </label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  placeholder="10"
                  className={formErrors.stock ? "border-red-500" : ""}
                />
                {formErrors.stock && <p className="text-xs text-red-600 mt-1">{formErrors.stock}</p>}
              </div>
            )}

            {/* Per-size stock (when sizes enabled) */}
            {hasSizes && (
              <div className="col-span-2 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase font-medium">
                    Talles y Stock
                  </label>
                  <span className="text-xs text-muted-foreground uppercase">
                    Stock total: {getTotalSizeStock()}
                  </span>
                </div>
                {sizeStocks.map((sizeRow, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={sizeRow.label}
                      onChange={(e) => updateSizeRow(index, "label", e.target.value)}
                      placeholder="Ej: S, M, L, XL"
                      className="uppercase flex-1"
                    />
                    <Input
                      type="number"
                      value={sizeRow.stock}
                      onChange={(e) => updateSizeRow(index, "stock", e.target.value)}
                      placeholder="Stock"
                      className="w-24"
                      min="0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSizeRow(index)}
                      disabled={sizeStocks.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formErrors.sizeStocks && <p className="text-xs text-red-600 mt-1">{formErrors.sizeStocks}</p>}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSizeRow}
                  className="uppercase w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Talle
                </Button>
              </div>
            )}

            <div className="col-span-2">
              <label className="text-xs uppercase font-medium block mb-2">
                Colors (comma separated)
              </label>
              <Input
                value={formData.colors}
                onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                placeholder="Black, White, Grey"
                className={`uppercase ${formErrors.colors ? "border-red-500" : ""}`}
              />
              {formErrors.colors && <p className="text-xs text-red-600 mt-1">{formErrors.colors}</p>}
            </div>

            <div className="col-span-2">
              <label className="text-xs uppercase font-medium block mb-2">
                Product Images
              </label>
              <ImageUpload
                images={formData.images}
                onChange={(images) => setFormData({ ...formData, images })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} className="uppercase">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="uppercase">
              {loading ? "Saving..." : selectedProduct ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
