import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateProductInput } from "@/lib/validators";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "NO AUTORIZADO" }, { status: 403 });
    }

    const body = await request.json();
    const validation = validateProductInput(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, fields: validation.fields },
        { status: 400 },
      );
    }

    const payload = {
      name: validation.data.name,
      slug: validation.data.slug,
      description: validation.data.description,
      price: validation.data.price,
      brand: validation.data.brand,
      stock: validation.data.stock,
      category_id: validation.data.category_id,
      images: validation.data.images,
      sizes: validation.data.sizes,
      colors: validation.data.colors,
    };

    if (validation.data.category_id) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("id", validation.data.category_id)
        .single();

      if (!category) {
        return NextResponse.json(
          { error: "CATEGORÍA INVÁLIDA", fields: { category_id: "Categoría inexistente" } },
          { status: 400 },
        );
      }
    }

    let productId = validation.data.id;

    if (productId) {
      const { error } = await supabase.from("products").update(payload).eq("id", productId);
      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { error: "YA EXISTE UN PRODUCTO CON ESE SLUG", fields: { slug: "Slug en uso" } },
            { status: 409 },
          );
        }
        return NextResponse.json({ error: "ERROR AL ACTUALIZAR PRODUCTO" }, { status: 500 });
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert([payload])
        .select("id")
        .single();

      if (error || !data?.id) {
        if (error?.code === "23505") {
          return NextResponse.json(
            { error: "YA EXISTE UN PRODUCTO CON ESE SLUG", fields: { slug: "Slug en uso" } },
            { status: 409 },
          );
        }
        return NextResponse.json({ error: "ERROR AL CREAR PRODUCTO" }, { status: 500 });
      }

      productId = data.id;
    }

    if (!productId) {
      return NextResponse.json({ error: "PRODUCTO INVÁLIDO" }, { status: 400 });
    }

    const { error: deleteSizesError } = await supabase
      .from("product_sizes")
      .delete()
      .eq("product_id", productId);

    if (deleteSizesError) {
      return NextResponse.json({ error: "ERROR AL ACTUALIZAR TALLES" }, { status: 500 });
    }

    if (validation.data.sizeStocks.length > 0) {
      const sizeRows = validation.data.sizeStocks.map((size) => ({
        product_id: productId,
        size_label: size.label,
        stock: size.stock,
      }));

      const { error: insertSizesError } = await supabase.from("product_sizes").insert(sizeRows);

      if (insertSizesError) {
        return NextResponse.json({ error: "ERROR AL GUARDAR TALLES" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, productId });
  } catch (error) {
    console.error("Error saving product:", error);
    return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
  }
}
