import Link from "next/link";
import { redirect } from "next/navigation";
import { ConfigurationEmpty } from "@/components/configuration-empty";
import { AppShell } from "@/components/app-shell";
import { demoProfile, isDemoSession } from "@/lib/demo";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  if (await isDemoSession()) {
    const profile = demoProfile;

    return (
      <AppShell name={profile.selected_name}>
        <header className="page-header">
          <span className="eyebrow">Demo Home</span>
          <h1>{profile.selected_name} meets {profile.selected_name}.</h1>
          <p>Your public identity inside Namer is only your chosen {profile.selected_part.toLowerCase()}.</p>
        </header>

        <section className="dashboard-grid">
          <Link className="action-card primary-card" href="/matches">
            <span>Start matching</span>
            <strong>Find a namesake</strong>
            <p>Preview the matching flow with demo data.</p>
          </Link>
          <Link className="action-card" href="/rooms">
            <span>Chats</span>
            <strong>2 rooms</strong>
            <p>Continue a demo conversation without OAuth.</p>
          </Link>
          <Link className="action-card" href="/profile">
            <span>Profile</span>
            <strong>{profile.full_name}</strong>
            <p>Review the selected name part used for matching.</p>
          </Link>
        </section>

        <section className="feed-panel">
          <h2>Today on Namer</h2>
          <div className="feed-list">
            <article>
              <span>Demo rule</span>
              <p>This bypass is controlled by `NAMER_DEV_BYPASS` and a local cookie.</p>
            </article>
            <article>
              <span>Matching rule</span>
              <p>Rooms are formed by normalized names, such as ranveer, sakshi, or aarav.</p>
            </article>
            <article>
              <span>Chat rule</span>
              <p>Real mode stores messages in Supabase and streams them with Realtime.</p>
            </article>
          </div>
        </section>
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
    .select("selected_name, selected_part, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const { count: roomCount } = await supabase
    .from("room_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <AppShell name={profile.selected_name}>
      <header className="page-header">
        <span className="eyebrow">Home</span>
        <h1>{profile.selected_name} meets {profile.selected_name}.</h1>
        <p>
          Your public identity inside Namer is only your chosen {profile.selected_part.toLowerCase()}.
        </p>
      </header>

      <section className="dashboard-grid">
        <Link className="action-card primary-card" href="/matches">
          <span>Start matching</span>
          <strong>Find a namesake</strong>
          <p>Join the waiting room for people using the same chosen name.</p>
        </Link>
        <Link className="action-card" href="/rooms">
          <span>Chats</span>
          <strong>{roomCount || 0} rooms</strong>
          <p>Continue a conversation without revealing anything else.</p>
        </Link>
        <Link className="action-card" href="/profile">
          <span>Profile</span>
          <strong>{profile.full_name}</strong>
          <p>Review your social name and the selected part used for matching.</p>
        </Link>
      </section>

      <section className="feed-panel">
        <h2>Today on Namer</h2>
        <div className="feed-list">
          <article>
            <span>Privacy rule</span>
            <p>Only your selected name part is visible to matches.</p>
          </article>
          <article>
            <span>Matching rule</span>
            <p>Rooms are formed by normalized names, such as ranveer, sakshi, or aarav.</p>
          </article>
          <article>
            <span>Chat rule</span>
            <p>Messages are stored per anonymous room and delivered live with Supabase Realtime.</p>
          </article>
        </div>
      </section>
    </AppShell>
  );
}
