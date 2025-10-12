"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "~/lib/supabase/server";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

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
  redirect("/signup/success");
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

  // Get user data from our custom users table
  const [userData] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  // If user doesn't exist in our users table, create them
  if (!userData) {
    await db.insert(users).values({
      id: user.id,
      email: user.email!,
    });
  }

  return user;
}

export async function getUserProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

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
  const [profile] = await db
    .update(users)
    .set({
      ...profileData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return profile;
}
