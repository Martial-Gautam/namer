import { redirect } from "next/navigation";
import { ConfigurationEmpty } from "@/components/configuration-empty";
import { NameChoiceForm } from "@/components/name-choice-form";
import { isSupabaseConfigured } from "@/lib/env";
import { nameFromMetadata, splitName } from "@/lib/name";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  if (!isSupabaseConfigured()) return <ConfigurationEmpty />;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const fullName = nameFromMetadata(user.user_metadata);
  const parts = splitName(fullName);

  return (
    <main className="auth-screen">
      <section className="onboarding-panel">
        <div>
          <span className="eyebrow">Name selection</span>
          <h1>Choose what Namer may use.</h1>
          <p>
            We pulled this name from your social login. First name is selected by
            default, but you can choose middle or last name if that is the name you
            want to match on.
          </p>
        </div>
        <NameChoiceForm fullName={fullName} parts={parts} />
      </section>
    </main>
  );
}
