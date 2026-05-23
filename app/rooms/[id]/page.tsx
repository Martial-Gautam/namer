import { notFound, redirect } from "next/navigation";
import { ChatRoom } from "@/components/chat-room";
import { ConfigurationEmpty } from "@/components/configuration-empty";
import { AppShell } from "@/components/app-shell";
import { demoMessages, demoProfile, demoRooms, isDemoSession } from "@/lib/demo";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function RoomPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (await isDemoSession()) {
    const room = demoRooms.find((item) => item.id === id);
    if (!room) notFound();

    return (
      <AppShell name={demoProfile.selected_name}>
        <header className="page-header chat-page-header">
          <span className="eyebrow">Demo chat</span>
          <h1>{room.display_name} room</h1>
          <p>{room.status === "waiting" ? "Waiting for another namesake to arrive." : "You are connected by name only."}</p>
        </header>
        <ChatRoom
          demoMode
          initialMessages={demoMessages.filter((message) => message.room_id === id)}
          roomId={id}
          userId={demoProfile.id}
        />
      </AppShell>
    );
  }

  if (!isSupabaseConfigured()) return <ConfigurationEmpty />;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("selected_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const { data: membership } = await supabase
    .from("room_members")
    .select("room_id, rooms(id, display_name, status)")
    .eq("room_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  const room = Array.isArray(membership.rooms) ? membership.rooms[0] : membership.rooms;

  const { data: messages } = await supabase
    .from("messages")
    .select("id, room_id, sender_id, body, created_at")
    .eq("room_id", id)
    .order("created_at", { ascending: true });

  return (
    <AppShell name={profile.selected_name}>
      <header className="page-header chat-page-header">
        <span className="eyebrow">Anonymous chat</span>
        <h1>{room?.display_name || profile.selected_name} room</h1>
        <p>{room?.status === "waiting" ? "Waiting for another namesake to arrive." : "You are connected by name only."}</p>
      </header>
      <ChatRoom
        initialMessages={(messages || []) as never}
        roomId={id}
        userId={user.id}
      />
    </AppShell>
  );
}
