import Link from "next/link";

export function ConfigurationEmpty() {
  return (
    <main className="auth-screen">
      <section className="config-panel">
        <div className="mark">N</div>
        <h1>Connect Supabase to run Namer.</h1>
        <p>
          Add your Supabase URL and anon key to `.env.local`, run the SQL schema,
          then restart the dev server.
        </p>
        <Link className="primary-link" href="/supabase/schema.sql">
          View setup file
        </Link>
      </section>
    </main>
  );
}
