import { redirect } from "next/navigation";
import { matchMe } from "@/lib/actions";
import { ConfigurationEmpty } from "@/components/configuration-empty";
import { AppShell } from "@/components/app-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { normalizeName } from "@/lib/name";
import { createClient } from "@/lib/supabase/server";

export default async function MatchesPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isSupabaseConfigured()) return <ConfigurationEmpty />;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("selected_name, selected_part")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const { count: waitingCount } = await supabase
    .from("rooms")
    .select("*", { count: "exact", head: true })
    .eq("name_key", normalizeName(profile.selected_name))
    .eq("status", "waiting");

  const params = await searchParams;

  return (
    <AppShell name={profile.selected_name}>
      <header className="page-header">
        <span className="eyebrow">Matching</span>
        <h1>Find another {profile.selected_name}.</h1>
        <p>
          Namer will place you with someone using the same selected name. If no
          one is waiting, your room stays open.
        </p>
      </header>

      {params.error ? <div className="error-box">{params.error}</div> : null}

      <section className="match-stage">
        <div className="cinema-ring">
          <span>{profile.selected_name.slice(0, 1).toUpperCase()}</span>
        </div>
        <div>
          <h2>{waitingCount || 0} possible waiting rooms</h2>
          <p>Matched on {profile.selected_part.toLowerCase()} only.</p>
          <form action={matchMe}>
            <button className="primary-button" type="submit">
              Match me now
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
