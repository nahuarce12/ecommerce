import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCategoryInput } from "@/lib/validators";

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
    const validation = validateCategoryInput(body);

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
    };

    const query = validation.data.id
      ? supabase.from("categories").update(payload).eq("id", validation.data.id)
      : supabase.from("categories").insert([payload]);

    const { error } = await query;

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "YA EXISTE UNA CATEGORÍA CON ESE SLUG", fields: { slug: "Slug en uso" } },
          { status: 409 },
        );
      }

      return NextResponse.json({ error: "ERROR AL GUARDAR CATEGORÍA" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving category:", error);
    return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
  }
}
