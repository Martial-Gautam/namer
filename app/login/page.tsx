import Link from "next/link";
import { redirect } from "next/navigation";
import { ConfigurationEmpty } from "@/components/configuration-empty";
import { OAuthButtons } from "@/components/oauth-buttons";
import { enterDemoMode } from "@/lib/actions";
import { isDemoBypassEnabled, isDemoSession } from "@/lib/demo";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isDemoSession()) redirect("/home");
  if (!isSupabaseConfigured()) return <ConfigurationEmpty />;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) redirect("/home");

  const params = await searchParams;

  return (
    <main className="auth-screen">
      <section className="login-panel">
        <div className="login-copy">
          <Link className="product-brand" href="/">
            <span className="mark">N</span>
            <span>Namer</span>
          </Link>
          <h1>Meet people who share your name, not your details.</h1>
          <p>
            Namer uses social login only to verify the display name. The user chooses
            first, middle, or last name before matching.
          </p>
          {params.error ? <div className="error-box">{params.error}</div> : null}
        </div>
        <div className="login-actions-panel">
          <OAuthButtons />
          {isDemoBypassEnabled() ? (
            <form action={enterDemoMode} className="demo-bypass-form">
              <button className="demo-button" type="submit">
                Continue in demo mode
              </button>
              <span>Temporary bypass for testing pages before Google OAuth is enabled.</span>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}
