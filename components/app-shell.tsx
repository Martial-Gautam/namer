import Link from "next/link";
import { signOut } from "@/lib/actions";

const links = [
  { href: "/home", label: "Home" },
  { href: "/matches", label: "Match" },
  { href: "/rooms", label: "Chats" },
  { href: "/profile", label: "Profile" }
];

export function AppShell({
  children,
  name
}: {
  children: React.ReactNode;
  name: string;
}) {
  return (
    <main className="product-shell">
      <aside className="product-sidebar">
        <Link className="product-brand" href="/home">
          <span className="mark">N</span>
          <span>Namer</span>
        </Link>
        <nav className="product-nav">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="sidebar-footer">
          <span>{name}</span>
          <button type="submit">Sign out</button>
        </form>
      </aside>
      <section className="product-main">{children}</section>
    </main>
  );
}
