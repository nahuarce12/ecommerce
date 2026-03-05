"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { SizeMeasurementField } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ProductOverlay() {
  const { selectedProduct, setSelectedProduct, toggleCart } = useUIStore();
  const { addItem } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const isOutOfStock = selectedProduct ? selectedProduct.stock <= 0 : false;

  const normalizeMeasurementKey = (key: string) => key.trim().toLowerCase();

  const parseSizeSchema = (): SizeMeasurementField[] => {
    if (!selectedProduct?.categories) return [];

    const categoryData = Array.isArray(selectedProduct.categories)
      ? selectedProduct.categories[0]
      : selectedProduct.categories;

    if (!categoryData?.size_measure_schema || !Array.isArray(categoryData.size_measure_schema)) {
      return [];
    }

    return categoryData.size_measure_schema
      .filter((field): field is SizeMeasurementField => {
        return (
          !!field &&
          typeof field === "object" &&
          typeof field.key === "string" &&
          field.key.trim().length > 0 &&
          typeof field.label === "string" &&
          field.label.trim().length > 0
        );
      })
      .map((field, index) => ({
        ...field,
        key: normalizeMeasurementKey(field.key),
        unit: field.unit?.trim() || "cm",
        order: typeof field.order === "number" ? field.order : index,
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  const sizeSchema = parseSizeSchema();
  const categoryData = selectedProduct?.categories
    ? Array.isArray(selectedProduct.categories)
      ? selectedProduct.categories[0]
      : selectedProduct.categories
    : null;
  const sizeGuideImageUrl = categoryData?.size_guide_image_url || null;
  const sizeGuideRows = (selectedProduct?.product_sizes ?? [])
    .filter((productSize) => {
      if (!productSize.measurements || sizeSchema.length === 0) return false;
      return sizeSchema.some((field) => {
        const value = productSize.measurements?.[normalizeMeasurementKey(field.key)];
        return typeof value === "number" && Number.isFinite(value);
      });
    })
    .map((productSize) => {
      const rowMeasurements = sizeSchema.reduce<Record<string, number | null>>((acc, field) => {
        const value = productSize.measurements?.[normalizeMeasurementKey(field.key)];
        acc[field.key] = typeof value === "number" && Number.isFinite(value) ? value : null;
        return acc;
      }, {});

      return {
        size: productSize.size_label,
        measurements: rowMeasurements,
      };
    });

  const getSizeStock = (size: string): number => {
    if (!selectedProduct?.product_sizes || selectedProduct.product_sizes.length === 0) {
      return selectedProduct?.stock ?? 0;
    }
    const ps = selectedProduct.product_sizes.find((s) => s.size_label === size);
    return ps?.stock ?? 0;
  };

  // Reset size, color and image index when product changes
  useEffect(() => {
    setSelectedSize(null);
    setSelectedColor(null);
    setCurrentImageIndex(0);
    setIsSizeGuideOpen(false);
  }, [selectedProduct]);

  const handlePrevImage = () => {
    if (!selectedProduct) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? selectedProduct.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!selectedProduct) return;
    setCurrentImageIndex((prev) => 
      prev === selectedProduct.images.length - 1 ? 0 : prev + 1
    );
  };

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedProduct]);

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor || !selectedProduct) return;
    addItem(selectedProduct, selectedSize, selectedColor);
    toggleCart();
    setSelectedProduct(null);
  };

  return (
    <AnimatePresence mode="wait">
      {selectedProduct && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ 
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="fixed inset-0 z-50 bg-background overflow-y-auto md:overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedProduct(null)}
            className="fixed top-2 right-2 z-50 p-2 hover:bg-accent md:absolute md:top-4 md:right-4"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          <div className="flex min-h-full flex-col md:h-full md:flex-row">
          {/* Image Section */}
          <div className="sticky top-0 z-0 h-[42vh] flex-none bg-secondary/10 md:relative md:flex-1 md:h-[50vh] lg:h-full">
            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
              <div className="relative w-full h-full max-w-2xl max-h-[80vh]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ 
                      duration: 0.3,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    className="relative w-full h-full"
                  >
                    <Image
                      src={selectedProduct.images[currentImageIndex] || selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      fill
                      className="object-contain"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            
            {/* Navigation Arrows - Show only if multiple images */}
            {selectedProduct.images.length > 1 && (
              <>
                <button 
                  onClick={handlePrevImage}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2"
                >
                  <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
                </button>
                <button 
                  onClick={handleNextImage}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2"
                >
                  <ChevronRight className="h-4 w-4 md:h-6 md:w-6" />
                </button>
                {/* Image indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {selectedProduct.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 w-2 transition-colors ${
                        index === currentImageIndex ? 'bg-foreground' : 'bg-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Details Section */}
          <div className="relative z-10 -mt-8 flex-1 rounded-t-2xl bg-background p-4 md:mt-0 md:rounded-none md:p-8 lg:p-24 md:overflow-y-auto">
            <div className="max-w-md mx-auto w-full space-y-4 md:space-y-8">
              <div className="text-center space-y-1 md:space-y-2">
                <h2 className="text-lg md:text-2xl font-bold uppercase tracking-tight">
                  {selectedProduct.name}
                </h2>
                <p className="text-base md:text-xl text-muted-foreground">
                  ${selectedProduct.price}
                </p>
              </div>

              {/* Color Selector */}
              <div className="space-y-3 md:space-y-4">
                <span className="text-xs md:text-sm font-medium uppercase">Seleccionar color</span>
                <div className="flex gap-2 flex-wrap">
                  {selectedProduct.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`
                        px-4 h-9 md:h-10 border text-xs md:text-sm font-medium transition-colors uppercase
                        ${selectedColor === color 
                          ? "bg-foreground text-background border-foreground" 
                          : "hover:bg-accent border-input"}
                      `}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm font-medium uppercase">Seleccionar talle</span>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-[10px] md:text-xs underline uppercase text-muted-foreground"
                  >
                    Guía de talles
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedProduct.sizes.map((size) => {
                    const sizeStock = getSizeStock(size);
                    const sizeOutOfStock = sizeStock <= 0;
                    return (
                      <button
                        key={size}
                        onClick={() => !sizeOutOfStock && setSelectedSize(size)}
                        disabled={sizeOutOfStock}
                        className={`
                          h-9 md:h-10 border text-xs md:text-sm font-medium transition-colors relative
                          ${sizeOutOfStock
                            ? "opacity-40 cursor-not-allowed line-through border-input"
                            : selectedSize === size 
                              ? "bg-foreground text-background border-foreground" 
                              : "hover:bg-accent border-input"}
                        `}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add to Cart / Make Order */}
              {isOutOfStock ? (
                <Button 
                  className="w-full h-10 md:h-12 text-sm md:text-base uppercase tracking-wide bg-gray-800 hover:bg-gray-900"
                  onClick={() => {
                    setSelectedProduct(null);
                    window.location.href = '/orders';
                  }}
                >
                  HACER ENCARGO - SIN STOCK
                </Button>
              ) : (
                <Button 
                  className="w-full h-10 md:h-12 text-sm md:text-base uppercase tracking-wide"
                  disabled={!selectedSize || !selectedColor}
                  onClick={handleAddToCart}
                >
                  {!selectedColor ? "Seleccioná un color" : !selectedSize ? "Seleccioná un talle" : "Agregar al carrito"}
                </Button>
              )}

              {/* Information Accordion */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="description">
                  <AccordionTrigger className="uppercase text-xs md:text-sm">Descripción</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs md:text-sm">
                    {selectedProduct.description}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="details">
                  <AccordionTrigger className="uppercase text-xs md:text-sm">Detalles</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs md:text-sm">
                    <ul className="list-disc list-inside space-y-1">
                      <li>100% algodón</li>
                      <li>Hecho en China</li>
                      <li>Marca: {selectedProduct.brand}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="shipping">
                  <AccordionTrigger className="uppercase text-xs md:text-sm">Envíos y devoluciones</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs md:text-sm">
                    Envío gratis en pedidos mayores a $200. Devoluciones aceptadas dentro de los 14 días.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
          </div>

          {isSizeGuideOpen && (
            <div className="fixed inset-0 z-[60] bg-black/50 px-4 py-8 md:p-10">
              <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden border bg-background">
                <div className="flex items-center justify-between border-b px-4 py-3 md:px-6">
                  <h3 className="text-xs font-semibold uppercase md:text-sm">Guía de talles</h3>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(false)}
                    className="p-2 hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-2 md:p-6">
                  <div className="relative min-h-[220px] border bg-secondary/10 p-4">
                    {sizeGuideImageUrl ? (
                      <Image
                        src={sizeGuideImageUrl}
                        alt="Guía de medidas"
                        fill
                        className="object-contain p-3"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-center">
                        <p className="text-xs uppercase text-muted-foreground md:text-sm">
                          Esta categoría no tiene imagen guía configurada
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border">
                    {sizeSchema.length === 0 ? (
                      <div className="p-4 text-xs uppercase text-muted-foreground md:text-sm">
                        Esta categoría todavía no tiene campos de medidas configurados.
                      </div>
                    ) : sizeGuideRows.length === 0 ? (
                      <div className="p-4 text-xs uppercase text-muted-foreground md:text-sm">
                        Este producto no tiene medidas cargadas por talle.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="uppercase text-[10px] md:text-xs">Talle</TableHead>
                            {sizeSchema.map((field, index) => (
                              <TableHead key={field.key} className="uppercase text-[10px] md:text-xs text-center">
                                {String.fromCharCode(65 + index)}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sizeGuideRows.map((row) => (
                            <TableRow key={row.size}>
                              <TableCell className="text-xs uppercase md:text-sm font-medium">{row.size}</TableCell>
                              {sizeSchema.map((field) => (
                                <TableCell key={`${row.size}-${field.key}`} className="text-xs text-center md:text-sm">
                                  {row.measurements[field.key] !== null ? `${row.measurements[field.key]} ${field.unit ?? "cm"}` : "-"}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
