import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid, sanitizeText } from "@/lib/validators";

type ValidateStockItemPayload = {
  product?: {
    id?: string;
    name?: string;
  };
  size?: string;
  color?: string;
  quantity?: number;
};

type StockIssue = {
  productId: string;
  productName: string;
  requestedQty: number;
  availableStock: number;
  size: string;
  color: string;
};

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "NO AUTENTICADO" }, { status: 401 });
    }

    const body = await request.json();
    const items = Array.isArray(body?.items) ? (body.items as ValidateStockItemPayload[]) : [];

    if (items.length === 0) {
      return NextResponse.json({ success: true, issues: [] as StockIssue[] });
    }

    const normalizedItems = items.map((item) => {
      const productId = typeof item?.product?.id === "string" ? item.product.id : "";
      const productName = typeof item?.product?.name === "string" ? sanitizeText(item.product.name, 160) : "";
      const size = typeof item?.size === "string" ? sanitizeText(item.size, 50) : "";
      const color = typeof item?.color === "string" ? sanitizeText(item.color, 50) : "";
      const quantity = item?.quantity;

      return {
        productId,
        productName,
        size: size || "ÚNICO",
        color,
        quantity,
      };
    });

    const validItems: Array<{
      productId: string;
      productName: string;
      size: string;
      color: string;
      quantity: number;
    }> = [];

    for (const item of normalizedItems) {
      if (!item.productId || !item.productName || !item.size || !item.color || !isPositiveInteger(item.quantity)) {
        return NextResponse.json({ error: "ITEMS INVÁLIDOS EN EL CARRITO" }, { status: 400 });
      }

      if (!isUuid(item.productId) || item.quantity > 50) {
        return NextResponse.json({ error: "ITEMS INVÁLIDOS EN EL CARRITO" }, { status: 400 });
      }

      validItems.push({
        productId: item.productId,
        productName: item.productName,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      });
    }

    const productIds = [...new Set(validItems.map((item) => item.productId))];
    const requestedSizes = [...new Set(validItems.map((item) => item.size).filter((size) => size !== "ÚNICO"))];

    const productsQuery = supabase
      .from("products")
      .select("id, stock")
      .in("id", productIds);

    const sizesQuery = requestedSizes.length
      ? supabase
          .from("product_sizes")
          .select("product_id, size_label, stock")
          .in("product_id", productIds)
          .in("size_label", requestedSizes)
      : Promise.resolve({ data: [], error: null } as const);

    const [{ data: products, error: productsError }, { data: sizeRows, error: sizesError }] = await Promise.all([
      productsQuery,
      sizesQuery,
    ]);

    if (productsError) {
      return NextResponse.json({ error: "ERROR VALIDANDO STOCK" }, { status: 500 });
    }

    if (sizesError) {
      return NextResponse.json({ error: "ERROR VALIDANDO STOCK" }, { status: 500 });
    }

    const productStockMap = new Map<string, number>();
    (products || []).forEach((product) => {
      productStockMap.set(product.id, product.stock ?? 0);
    });

    const sizeStockMap = new Map<string, number>();
    (sizeRows || []).forEach((row) => {
      sizeStockMap.set(`${row.product_id}::${row.size_label}`, row.stock ?? 0);
    });

    const issues: StockIssue[] = [];

    for (const item of validItems) {
      const hasSizeVariant = item.size !== "ÚNICO";
      const sizeKey = `${item.productId}::${item.size}`;

      const availableStock = hasSizeVariant
        ? sizeStockMap.has(sizeKey)
          ? sizeStockMap.get(sizeKey) ?? 0
          : productStockMap.get(item.productId) ?? 0
        : productStockMap.get(item.productId) ?? 0;

      if (availableStock < item.quantity) {
        issues.push({
          productId: item.productId,
          productName: item.productName,
          requestedQty: item.quantity,
          availableStock,
          size: item.size,
          color: item.color,
        });
      }
    }

    return NextResponse.json({
      success: true,
      issues,
    });
  } catch (error) {
    console.error("Error validating stock:", error);
    return NextResponse.json({ error: "ERROR INTERNO DEL SERVIDOR" }, { status: 500 });
  }
}
