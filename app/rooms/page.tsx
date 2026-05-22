import Link from "next/link";
import { redirect } from "next/navigation";
import { ConfigurationEmpty } from "@/components/configuration-empty";
import { AppShell } from "@/components/app-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function RoomsPage() {
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

  const { data: memberships } = await supabase
    .from("room_members")
    .select("room_id, rooms(id, display_name, status, created_at)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  return (
    <AppShell name={profile.selected_name}>
      <header className="page-header">
        <span className="eyebrow">Chats</span>
        <h1>Your anonymous rooms.</h1>
        <p>Continue conversations that only know your chosen name.</p>
      </header>

      <section className="room-list">
        {memberships?.length ? (
          memberships.map((membership) => {
            const room = Array.isArray(membership.rooms) ? membership.rooms[0] : membership.rooms;
            if (!room) return null;
            return (
              <Link className="room-row" href={`/rooms/${room.id}`} key={membership.room_id}>
                <span>{room.display_name}</span>
                <strong>{room.status === "waiting" ? "Waiting for namesake" : "Active chat"}</strong>
                <small>{new Date(room.created_at).toLocaleDateString()}</small>
              </Link>
            );
          })
        ) : (
          <div className="empty-state">
            <h2>No rooms yet.</h2>
            <p>Start matching to open your first namesake chat.</p>
            <Link className="primary-link" href="/matches">Go to matching</Link>
          </div>
        )}
      </section>
    </AppShell>
  );
}
