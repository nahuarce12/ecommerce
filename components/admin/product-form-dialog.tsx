"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
    sizes: "",
    colors: "",
  });
  const [loading, setLoading] = useState(false);

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
        sizes: selectedProduct.sizes?.join(", ") || "",
        colors: selectedProduct.colors?.join(", ") || "",
      });
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
      sizes: "",
      colors: "",
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const productData = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      price: parseFloat(formData.price),
      brand: formData.brand,
      stock: parseInt(formData.stock),
      category_id: formData.category_id || null,
      images: formData.images,
      sizes: formData.sizes.split(",").map(s => s.trim()).filter(Boolean),
      colors: formData.colors.split(",").map(c => c.trim()).filter(Boolean),
    };

    let error;
    if (selectedProduct?.id) {
      // Update
      ({ error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", selectedProduct.id));
    } else {
      // Insert
      ({ error } = await supabase.from("products").insert([productData]));
    }

    setLoading(false);

    if (error) {
      alert("Failed to save product: " + error.message);
      console.error(error);
    } else {
      setProductDialogOpen(false);
      setSelectedProduct(null);
      resetForm();
      onSuccess();
    }
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
                className="uppercase"
              />
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
              />
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
                className="uppercase"
              />
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
              />
            </div>

            <div>
              <label className="text-xs uppercase font-medium block mb-2">
                Stock *
              </label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
                placeholder="10"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs uppercase font-medium block mb-2">
                Sizes (comma separated)
              </label>
              <Input
                value={formData.sizes}
                onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                placeholder="S, M, L, XL"
                className="uppercase"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs uppercase font-medium block mb-2">
                Colors (comma separated)
              </label>
              <Input
                value={formData.colors}
                onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                placeholder="Black, White, Grey"
                className="uppercase"
              />
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
