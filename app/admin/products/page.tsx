"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Search, Pencil, Trash2, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Product, Category } from "@/types";
import { useAdminStore } from "@/store/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const {
    searchQuery,
    categoryFilter,
    bulkSelectedIds,
    setSearchQuery,
    setCategoryFilter,
    toggleBulkSelect,
    clearBulkSelect,
    setSelectedProduct,
    setProductDialogOpen,
  } = useAdminStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);

    if (productsRes.data) setProducts(productsRes.data as any);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert("Failed to delete product");
      console.error(error);
    } else {
      fetchData();
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${bulkSelectedIds.length} products?`)) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .delete()
      .in("id", bulkSelectedIds);

    if (error) {
      alert("Failed to delete products");
      console.error(error);
    } else {
      clearBulkSelect();
      fetchData();
    }
  };

  const handleDuplicate = (product: Product) => {
    const duplicate = {
      ...product,
      id: undefined,
      name: `${product.name} (Copy)`,
      slug: `${product.slug}-copy`,
    };
    setSelectedProduct(duplicate as Product);
    setProductDialogOpen(true);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !categoryFilter || product.category_id === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="text-center py-12 uppercase">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground uppercase mt-1">
            Manage your product inventory
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedProduct(null);
            setProductDialogOpen(true);
          }}
          className="uppercase"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 uppercase placeholder:uppercase"
          />
        </div>
        <Select value={categoryFilter || "all"} onValueChange={(val) => setCategoryFilter(val === "all" ? null : val)}>
          <SelectTrigger className="w-full md:w-[200px] uppercase">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="uppercase">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id} className="uppercase">
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {bulkSelectedIds.length > 0 && (
        <div className="flex items-center gap-4 p-4 border bg-muted">
          <span className="text-sm uppercase font-medium">
            {bulkSelectedIds.length} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="uppercase"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearBulkSelect}
            className="uppercase"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Products Table */}
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={bulkSelectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      filteredProducts.forEach(p => toggleBulkSelect(p.id));
                    } else {
                      clearBulkSelect();
                    }
                  }}
                  className="cursor-pointer"
                />
              </TableHead>
              <TableHead className="uppercase">Image</TableHead>
              <TableHead className="uppercase">Name</TableHead>
              <TableHead className="uppercase">Brand</TableHead>
              <TableHead className="uppercase">Price</TableHead>
              <TableHead className="uppercase">Stock</TableHead>
              <TableHead className="uppercase">Category</TableHead>
              <TableHead className="uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={bulkSelectedIds.includes(product.id)}
                    onChange={() => toggleBulkSelect(product.id)}
                    className="cursor-pointer"
                  />
                </TableCell>
                <TableCell>
                  <div className="relative w-12 h-12 bg-secondary/10">
                    {product.images[0] && (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium uppercase text-xs">
                  {product.name}
                </TableCell>
                <TableCell className="uppercase text-xs">{product.brand}</TableCell>
                <TableCell className="text-xs">${product.price}</TableCell>
                <TableCell className="text-xs">
                  <span className={product.stock < 5 ? "text-destructive font-bold" : ""}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell className="uppercase text-xs">
                  {(product as any).categories?.name || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setProductDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(product)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground uppercase text-sm">
            No products found
          </div>
        )}
      </div>

      <ProductFormDialog onSuccess={fetchData} categories={categories} />
    </div>
  );
}
