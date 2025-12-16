"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
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
  const isOutOfStock = selectedProduct ? selectedProduct.stock <= 0 : false;

  // Reset size, color and image index when product changes
  useEffect(() => {
    setSelectedSize(null);
    setSelectedColor(null);
    setCurrentImageIndex(0);
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
          className="fixed inset-0 z-50 bg-background flex flex-col md:flex-row"
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedProduct(null)}
            className="absolute top-2 right-2 md:top-4 md:right-4 z-50 p-2 hover:bg-accent"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          {/* Image Section */}
          <div className="relative flex-1 h-[40vh] md:h-[50vh] lg:h-full bg-secondary/10">
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
          <div className="flex-1 flex flex-col justify-start md:justify-center p-4 md:p-8 lg:p-24 bg-background overflow-y-auto">
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
                <span className="text-xs md:text-sm font-medium uppercase">Select Color</span>
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
                  <span className="text-xs md:text-sm font-medium uppercase">Select Size</span>
                  <button className="text-[10px] md:text-xs underline uppercase text-muted-foreground">
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedProduct.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`
                        h-9 md:h-10 border text-xs md:text-sm font-medium transition-colors
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
                  {!selectedColor ? "Select a Color" : !selectedSize ? "Select a Size" : "Add to Cart"}
                </Button>
              )}

              {/* Information Accordion */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="description">
                  <AccordionTrigger className="uppercase text-xs md:text-sm">Description</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs md:text-sm">
                    {selectedProduct.description}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="details">
                  <AccordionTrigger className="uppercase text-xs md:text-sm">Details</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs md:text-sm">
                    <ul className="list-disc list-inside space-y-1">
                      <li>100% Cotton</li>
                      <li>Made in China</li>
                      <li>Brand: {selectedProduct.brand}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="shipping">
                  <AccordionTrigger className="uppercase text-xs md:text-sm">Shipping & Returns</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs md:text-sm">
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
