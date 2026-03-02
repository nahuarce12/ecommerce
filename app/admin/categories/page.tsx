"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Category } from "@/types";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

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
      .select("id, name, slug, description, created_at, products(count)")
      .order("name");

    if (data) setCategories(data as CategoryWithProductsCount[]);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
    });
    setFormErrors({});
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
        <DialogContent>
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
