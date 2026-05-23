import { redirect } from "next/navigation";
import { ConfigurationEmpty } from "@/components/configuration-empty";
import { AppShell } from "@/components/app-shell";
import { NameChoiceForm } from "@/components/name-choice-form";
import { demoProfile, isDemoSession } from "@/lib/demo";
import { isSupabaseConfigured } from "@/lib/env";
import { nameFromMetadata, splitName } from "@/lib/name";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  if (await isDemoSession()) {
    const profile = demoProfile;

    return (
      <AppShell name={profile.selected_name}>
        <header className="page-header">
          <span className="eyebrow">Demo Profile</span>
          <h1>Your visible name is {profile.selected_name}.</h1>
          <p>This preview uses a local demo session. Real OAuth will use the social display name.</p>
        </header>

        <section className="settings-grid">
          <div className="settings-panel">
            <h2>Current setting</h2>
            <dl>
              <div>
                <dt>Social name</dt>
                <dd>{profile.full_name}</dd>
              </div>
              <div>
                <dt>Selected part</dt>
                <dd>{profile.selected_part}</dd>
              </div>
              <div>
                <dt>Provider</dt>
                <dd>{profile.provider}</dd>
              </div>
            </dl>
          </div>
          <div className="settings-panel">
            <h2>Change name part</h2>
            <NameChoiceForm fullName={profile.full_name} parts={splitName(profile.full_name)} />
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
    .select("selected_name, selected_part, full_name, provider")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const fullName = profile.full_name || nameFromMetadata(user.user_metadata);

  return (
    <AppShell name={profile.selected_name}>
      <header className="page-header">
        <span className="eyebrow">Profile</span>
        <h1>Your visible name is {profile.selected_name}.</h1>
        <p>
          Namer stores your social display name so you can choose which part is
          used for matching. Your profile URL, email, and social graph stay hidden.
        </p>
      </header>

      <section className="settings-grid">
        <div className="settings-panel">
          <h2>Current setting</h2>
          <dl>
            <div>
              <dt>Social name</dt>
              <dd>{fullName}</dd>
            </div>
            <div>
              <dt>Selected part</dt>
              <dd>{profile.selected_part}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{profile.provider || "social"}</dd>
            </div>
          </dl>
        </div>
        <div className="settings-panel">
          <h2>Change name part</h2>
          <NameChoiceForm fullName={fullName} parts={splitName(fullName)} />
        </div>
      </section>
    </AppShell>
  );
}
