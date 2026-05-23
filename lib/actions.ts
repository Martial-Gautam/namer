"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isDemoBypassEnabled } from "@/lib/demo";
import { nameFromMetadata, normalizeName, splitName } from "@/lib/name";

export async function enterDemoMode() {
  if (!isDemoBypassEnabled()) redirect("/login");

  (await cookies()).set("namer_demo", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  redirect("/home");
}

export async function signInWithProvider(provider: string) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=/onboarding`
    }
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  if (data.url) redirect(data.url);
}

export async function signOut() {
  if (isDemoBypassEnabled()) {
    (await cookies()).delete("namer_demo");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function saveSelectedName(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [selectedPart = "First name", selectedNameValue = ""] = String(
    formData.get("selectedChoice") || ""
  ).split("::");
  const selectedName = selectedNameValue.trim();
  const fullName = nameFromMetadata(user.user_metadata);

  if (!selectedName) redirect("/onboarding");

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    selected_name: selectedName,
    selected_part: selectedPart,
    name_key: normalizeName(selectedName),
    avatar_url: typeof user.user_metadata.avatar_url === "string" ? user.user_metadata.avatar_url : null,
    provider: user.app_metadata.provider || "social",
    updated_at: new Date().toISOString()
  });

  if (error) redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/home");
  revalidatePath("/profile");
  redirect("/home");
}

export async function matchMe() {
  if (isDemoBypassEnabled() && (await cookies()).get("namer_demo")?.value === "1") {
    redirect("/rooms/demo-ranveer-room");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("selected_name, name_key")
    .eq("id", user.id)
    .single();

  if (!profile?.name_key) redirect("/onboarding");

  const { data: existingMemberships } = await supabase
    .from("room_members")
    .select("room_id, rooms(id, status, name_key)")
    .eq("user_id", user.id);

  const existingRoom = existingMemberships?.find(
    (membership) => {
      const room = membership.rooms as { name_key?: string; status?: string } | { name_key?: string; status?: string }[] | null;
      return Array.isArray(room)
        ? false
        : room?.name_key === profile.name_key && room?.status === "active";
    }
  );

  if (existingRoom?.room_id) redirect(`/rooms/${existingRoom.room_id}`);

  const { data: waitingRooms } = await supabase
    .from("rooms")
    .select("id, name_key, status, room_members(user_id)")
    .eq("name_key", profile.name_key)
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .limit(8);

  const roomToJoin = waitingRooms?.find((room) => {
    const members = room.room_members || [];
    return members.length === 1 && members[0]?.user_id !== user.id;
  });

  if (roomToJoin) {
    await supabase.from("room_members").insert({ room_id: roomToJoin.id, user_id: user.id });
    await supabase.from("rooms").update({ status: "active" }).eq("id", roomToJoin.id);
    revalidatePath("/rooms");
    redirect(`/rooms/${roomToJoin.id}`);
  }

  const { data: createdRoom, error } = await supabase
    .from("rooms")
    .insert({
      name_key: profile.name_key,
      display_name: profile.selected_name,
      status: "waiting"
    })
    .select("id")
    .single();

  if (error || !createdRoom) redirect(`/matches?error=${encodeURIComponent(error?.message || "Could not create room")}`);

  await supabase.from("room_members").insert({ room_id: createdRoom.id, user_id: user.id });
  revalidatePath("/rooms");
  redirect(`/rooms/${createdRoom.id}`);
}

export async function sendMessage(roomId: string, formData: FormData) {
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  if (isDemoBypassEnabled() && (await cookies()).get("namer_demo")?.value === "1") {
    revalidatePath(`/rooms/${roomId}`);
    return;
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.from("messages").insert({
    room_id: roomId,
    sender_id: user.id,
    body
  });

  revalidatePath(`/rooms/${roomId}`);
}

export async function resetNameToFirstPart() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const fullName = nameFromMetadata(user.user_metadata);
  const [first] = splitName(fullName);
  if (!first) redirect("/profile");

  await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    selected_name: first.value,
    selected_part: first.label,
    name_key: normalizeName(first.value),
    updated_at: new Date().toISOString()
  });

  revalidatePath("/profile");
  redirect("/profile");
}
