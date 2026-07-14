import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { NYALS_LOGO_URL } from "@/lib/products";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Shop All", search: { cat: "All" as string } },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="site-header">
      <Link to="/" className="logo" aria-label="Nyals (K) Ltd home">
        <img className="logo-mark" src={NYALS_LOGO_URL} alt="Nyals logo" />
        <div className="logo-text">
          <em>Nyals</em> <span className="logo-suffix">(K) Ltd</span>
        </div>
      </Link>

      <nav className="site-nav">
        <Link to="/" className={pathname === "/" ? "active" : ""}>
          Home
        </Link>
        <Link to="/products" search={{ cat: "All" }} className={pathname === "/products" ? "active" : ""}>
          Shop All
        </Link>
        <a href="/#cats">Collections</a>
        <a href="/#about">About</a>
        <a href="/#location">Find Us</a>
      </nav>

      <div className="header-right">
        <Link to="/admin" className="btn-admin-icon" aria-label="Admin panel" title="Admin">⚙</Link>
        <a href="/#location" className="btn-visit-sm">Visit Store</a>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="hamburger" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            <SheetHeader>
              <SheetTitle style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--gold2)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <img src={NYALS_LOGO_URL} alt="Nyals logo" style={{ height: 32, width: "auto" }} />
                <em>Nyals</em> (K) Ltd
              </SheetTitle>
            </SheetHeader>
            <div className="mobile-menu" onClick={() => setOpen(false)}>
              <Link to="/" className={pathname === "/" ? "active" : ""}>
                Home
              </Link>
              <Link to="/products" search={{ cat: "All" }} className={pathname === "/products" ? "active" : ""}>
                Shop All
              </Link>
              <a href="/#cats">Collections</a>
              <a href="/#about">About</a>
              <a href="/#location">Find Us</a>
              <Link to="/admin" className={pathname === "/admin" ? "active" : ""}>
                Admin
              </Link>
            </div>
            <div className="mobile-menu-actions">
              <a href="/#location" className="btn-gold" style={{ textAlign: "center" }}>
                Visit Store
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("nyals_theme") as "dark" | "light") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("nyals_theme", next); } catch { /* ignore */ }
  };

  return (
    <button className="theme-toggle-fab" onClick={toggle} aria-label="Toggle theme">
      <span>{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
