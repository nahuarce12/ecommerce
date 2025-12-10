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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

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
    } else {
      resetForm();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*, products(count)")
      .order("name");

    if (data) setCategories(data as any);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
    });
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

    const supabase = createClient();
    const categoryData = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
    };

    let error;
    if (selectedCategory) {
      ({ error } = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", selectedCategory.id));
    } else {
      ({ error } = await supabase.from("categories").insert([categoryData]));
    }

    setSaving(false);

    if (error) {
      alert("Failed to save category: " + error.message);
      console.error(error);
    } else {
      setDialogOpen(false);
      setSelectedCategory(null);
      resetForm();
      fetchCategories();
    }
  };

  const handleDelete = async (category: Category) => {
    // Check if category has products
    const productCount = (category as any).products?.[0]?.count || 0;
    
    if (productCount > 0) {
      alert(`Cannot delete category with ${productCount} product(s). Remove products first.`);
      return;
    }

    if (!confirm(`Delete category "${category.name}"?`)) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

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
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground uppercase mt-1">
            Organize your products
          </p>
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

      {/* Categories Table */}
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
              const productCount = (category as any).products?.[0]?.count || 0;
              return (
                <TableRow key={category.id}>
                  <TableCell className="font-medium uppercase text-xs">
                    {category.name}
                  </TableCell>
                  <TableCell className="text-xs">{category.slug}</TableCell>
                  <TableCell className="text-xs max-w-md truncate">
                    {category.description || "-"}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category)}
                      >
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

      {/* Category Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="uppercase">
              {selectedCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription className="uppercase text-xs">
              {selectedCategory ? "Update category details" : "Create a new category"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase font-medium block mb-2">
                Category Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Remeras"
                className="uppercase"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-medium block mb-2">
                Slug
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                placeholder="remeras"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-medium block mb-2">
                Description
              </label>
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
