"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@odis-ai/data-access/db/server";
import type { Database } from "~/database.types";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  // Type-casting here for convenience
  // In practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/signup");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  // Type-casting here for convenience
  // In practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user data from our custom users table using Supabase client
  const { error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // If user doesn't exist in our users table, create them
  if (userError?.code === "PGRST116") {
    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      email: user.email!,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error creating user profile:", insertError);
    }
  }

  return user;
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single<Database["public"]["Tables"]["users"]["Row"]>();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return profile;
}

export async function updateUserProfile(
  userId: string,
  profileData: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    role?: "veterinarian" | "vet_tech" | "admin" | "practice_owner" | "client";
    clinicName?: string;
    licenseNumber?: string;
    onboardingCompleted?: boolean;
  },
) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("users")
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single<Database["public"]["Tables"]["users"]["Row"]>();

  if (error) {
    console.error("Error updating user profile:", error);
    return null;
  }

  return profile;
}
