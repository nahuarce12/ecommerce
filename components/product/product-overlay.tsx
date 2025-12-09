"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ProductOverlay() {
  const { selectedProduct, setSelectedProduct, toggleCart } = useUIStore();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Reset size when product changes
  useEffect(() => {
    setSelectedSize(null);
  }, [selectedProduct]);

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

  if (!selectedProduct) return null;

  const handleAddToCart = () => {
    if (!selectedSize) return;
    // Add to cart logic here (we'll implement cart store later)
    toggleCart();
    setSelectedProduct(null);
  };

  return (
    <AnimatePresence>
      {selectedProduct && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 bg-background flex flex-col md:flex-row"
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedProduct(null)}
            className="absolute top-4 right-4 z-50 p-2 hover:bg-accent"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image Section */}
          <div className="relative flex-1 h-[50vh] md:h-full bg-secondary/10">
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="relative w-full h-full max-w-2xl max-h-[80vh]">
                <Image
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            
            {/* Navigation Arrows (Mock) */}
            <button className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/50">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/50">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Details Section */}
          <div className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-24 bg-background overflow-y-auto">
            <div className="max-w-md mx-auto w-full space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold uppercase tracking-tight">
                  {selectedProduct.name}
                </h2>
                <p className="text-xl text-muted-foreground">
                  ${selectedProduct.price}
                </p>
              </div>

              {/* Size Selector */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium uppercase">Select Size</span>
                  <button className="text-xs underline uppercase text-muted-foreground">
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedProduct.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`
                        h-10 border text-sm font-medium transition-colors
                        ${selectedSize === size 
                          ? "bg-foreground text-background border-foreground" 
                          : "hover:bg-accent border-input"}
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Cart */}
              <Button 
                className="w-full h-12 text-base uppercase tracking-wide"
                disabled={!selectedSize}
                onClick={handleAddToCart}
              >
                {selectedSize ? "Add to Cart" : "Select a Size"}
              </Button>

              {/* Information Accordion */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="description">
                  <AccordionTrigger className="uppercase text-sm">Description</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {selectedProduct.description}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="details">
                  <AccordionTrigger className="uppercase text-sm">Details</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <ul className="list-disc list-inside space-y-1">
                      <li>100% Cotton</li>
                      <li>Made in China</li>
                      <li>Brand: {selectedProduct.brand}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="shipping">
                  <AccordionTrigger className="uppercase text-sm">Shipping & Returns</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Free shipping on orders over $200. Returns accepted within 14 days.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
