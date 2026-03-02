import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AccountClient } from "./account-client";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/account");
  }

  const serviceClient = createServiceClient();

  const { data: existingProfile, error: profileError } = await serviceClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError?.message) {
    console.error("Error fetching profile:", profileError.message);
  }

  let profile = existingProfile;

  if (!profile && !profileError) {
    const baseProfile = {
      id: user.id,
      full_name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      phone: null,
      address_line1: null,
      address_line2: null,
      city: null,
      state_province: null,
      postal_code: null,
      country: "Argentina",
    };

    const { data: createdProfile, error: createProfileError } = await serviceClient
      .from("profiles")
      .insert(baseProfile)
      .select("*")
      .single();

    if (!createProfileError && createdProfile) {
      profile = createdProfile;
    } else if (createProfileError?.message && createProfileError.code !== "23505") {
      console.error("Error creating fallback profile:", createProfileError.message);
    } else {
      const { data: retriedProfile } = await serviceClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      profile = retriedProfile;
    }
  }

  return <AccountClient user={user} profile={profile} />;
}
