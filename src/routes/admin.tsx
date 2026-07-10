import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { FloatingActions } from "@/components/floating-actions";
import { AnalyticsPanel } from "@/components/admin-analytics";
import { supabase } from "@/integrations/supabase/client";
import { fetchProducts, formatKES, slugify, ALL_CATEGORIES, CATEGORIES, type Product, type ProductInsert } from "@/lib/products";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Nyals (K) Ltd" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

function AdminPage() {
  const [session, setSession] = useState<Session>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="page-shell">
          <div className="admin-login"><div className="login-card"><p>Loading…</p></div></div>
        </main>
      </>
    );
  }

  if (!session) return <><SiteHeader /><main className="page-shell"><LoginCard /></main><FloatingActions /></>;
  if (isAdmin === false) return <><SiteHeader /><main className="page-shell"><NotAdminCard /></main><FloatingActions /></>;
  if (isAdmin === null) {
    return <><SiteHeader /><main className="page-shell"><div className="admin-login"><div className="login-card"><p>Checking access…</p></div></div></main></>;
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <Dashboard email={session.user.email ?? ""} />
      </main>
      <FloatingActions />
    </>
  );
}

function SiteSettings() {
  const { data: products = [] } = useQuery({ queryKey: ["products", "All"], queryFn: () => fetchProducts("All") });
  const cats = CATEGORIES as any;
  const [hero, setHero] = useState<string[]>(() => {
    try { const raw = localStorage.getItem("nyals_site_data"); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p.heroImages)) return p.heroImages; } } catch {};
    return [] as string[];
  });
  const [about, setAbout] = useState<string[]>(() => {
    try { const raw = localStorage.getItem("nyals_site_data"); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p.aboutImages)) return p.aboutImages; } } catch {};
    return [] as string[];
  });
  const [catMap, setCatMap] = useState<Record<string, string[]>>(() => {
    try { const raw = localStorage.getItem("nyals_site_data"); if (raw) { const p = JSON.parse(raw); if (p.categories) return p.categories; } } catch {};
    return {};
  });

  const save = () => {
    const payload = { heroImages: hero, aboutImages: about, categories: catMap };
    localStorage.setItem("nyals_site_data", JSON.stringify(payload));
    window.dispatchEvent(new Event("nyals:site:update"));
    toast.success("Site images saved (local preview)");
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h3>Site Images</h3>
      <div style={{ background: "var(--bg2)", padding: 16, border: "1px solid var(--border2)" }}>
        <div style={{ marginBottom: 8 }}><strong>Hero Images</strong></div>
        <div style={{ display: "grid", gap: 8 }}>
          {hero.map((h, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={h} onChange={(e) => setHero((p) => p.map((v, idx) => idx === i ? e.target.value : v))} />
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn-outline" type="button" onClick={() => setHero((p) => { const nxt = [...p]; if (i > 0) { [nxt[i-1], nxt[i]] = [nxt[i], nxt[i-1]]; } return nxt; })}>↑</button>
                <button className="btn-outline" type="button" onClick={() => setHero((p) => { const nxt = [...p]; if (i < nxt.length - 1) { [nxt[i+1], nxt[i]] = [nxt[i], nxt[i+1]]; } return nxt; })}>↓</button>
                <button className="btn-del" type="button" onClick={() => setHero((p) => p.filter((_, idx) => idx !== i))}>Remove</button>
              </div>
            </div>
          ))}
          <div>
            <button className="btn-outline" type="button" onClick={() => setHero((p) => [...p, ""]) }>Add Image</button>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg2)", padding: 16, border: "1px solid var(--border2)" }}>
        <div style={{ marginBottom: 8 }}><strong>About Images</strong></div>
        <div style={{ display: "grid", gap: 8 }}>
          {about.map((h, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={h} onChange={(e) => setAbout((p) => p.map((v, idx) => idx === i ? e.target.value : v))} />
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn-outline" type="button" onClick={() => setAbout((p) => { const nxt = [...p]; if (i > 0) { [nxt[i-1], nxt[i]] = [nxt[i], nxt[i-1]]; } return nxt; })}>↑</button>
                <button className="btn-outline" type="button" onClick={() => setAbout((p) => { const nxt = [...p]; if (i < nxt.length - 1) { [nxt[i+1], nxt[i]] = [nxt[i], nxt[i+1]]; } return nxt; })}>↓</button>
                <button className="btn-del" type="button" onClick={() => setAbout((p) => p.filter((_, idx) => idx !== i))}>Remove</button>
              </div>
            </div>
          ))}
          <div>
            <button className="btn-outline" type="button" onClick={() => setAbout((p) => [...p, ""]) }>Add Image</button>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg2)", padding: 16, border: "1px solid var(--border2)" }}>
        <div style={{ marginBottom: 8 }}><strong>Category Images</strong></div>
        <div style={{ display: "grid", gap: 10 }}>
          {cats.map((c: any) => {
            const list = catMap[c.slug] ?? c.images ?? [];
            return (
              <div key={c.slug} style={{ borderTop: "1px dashed var(--border2)", paddingTop: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{c.name}</div>
                {(list || []).map((u: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input value={u} onChange={(e) => setCatMap((p) => ({ ...p, [c.slug]: (p[c.slug] ?? c.images ?? []).map((v: string, idx: number) => idx === i ? e.target.value : v) }))} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-outline" type="button" onClick={() => setCatMap((p) => { const cur = p[c.slug] ?? c.images ?? []; const nxt = [...cur]; const idx = i; if (idx > 0) { [nxt[idx-1], nxt[idx]] = [nxt[idx], nxt[idx-1]]; } return { ...p, [c.slug]: nxt }; })}>↑</button>
                      <button className="btn-outline" type="button" onClick={() => setCatMap((p) => { const cur = p[c.slug] ?? c.images ?? []; const nxt = [...cur]; const idx = i; if (idx < nxt.length - 1) { [nxt[idx+1], nxt[idx]] = [nxt[idx], nxt[idx+1]]; } return { ...p, [c.slug]: nxt }; })}>↓</button>
                      <button className="btn-del" type="button" onClick={() => setCatMap((p) => { const cur = p[c.slug] ?? c.images ?? []; return { ...p, [c.slug]: cur.filter((_: any, idx: number) => idx !== i) }; })}>Remove</button>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 6 }}>
                  <button className="btn-outline" type="button" onClick={() => setCatMap((p) => ({ ...p, [c.slug]: [...(p[c.slug] ?? c.images ?? []), ""] }))}>Add Image</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-gold" type="button" onClick={save}>Save Site Images</button>
        <button className="btn-outline" type="button" onClick={() => { localStorage.removeItem("nyals_site_data"); window.dispatchEvent(new Event("nyals:site:update")); toast.success("Reset site images to defaults"); }}>Reset</button>
      </div>
    </div>
  );
}


function LoginCard() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Account created — check your email if confirmation is required.");
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container admin-page">
      <div className="admin-login">
        <form className="login-card" onSubmit={submit}>
          <div className="logo"><em>Nyals</em> (K) Ltd</div>
          <div className="login-subtitle">Admin Portal — Staff Access Only</div>
          {err && <div className="login-error">{err}</div>}
          <div className="form-group">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@nyals.co.ke" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <button className="btn-gold" style={{ width: "100%", padding: "0.9rem" }} disabled={busy} type="submit">
            {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
          <p style={{ fontSize: "0.72rem", color: "var(--text3)", marginTop: "1.5rem" }}>
            {mode === "signin" ? "First time? " : "Have an account? "}
            <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); }}
              style={{ background: "none", border: "none", color: "var(--gold)", textDecoration: "underline", padding: 0, cursor: "pointer", font: "inherit" }}>
              {mode === "signin" ? "Create admin account" : "Sign in instead"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

function NotAdminCard() {
  return (
    <div className="container admin-page">
      <div className="admin-login">
        <div className="login-card">
          <div className="logo"><em>Nyals</em> (K) Ltd</div>
          <div className="login-subtitle">Not Authorised</div>
          <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginBottom: "1.5rem" }}>
            Your account is signed in but is not an admin. Contact the store owner to request access.
          </p>
          <button className="btn-outline" onClick={() => supabase.auth.signOut()} style={{ width: "100%" }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ email }: { email: string }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview" | "add" | "manage" | "site" | "analytics">("overview");
  const [manageFilter, setManageFilter] = useState("All");
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: products = [] } = useQuery({ queryKey: ["products", "All"], queryFn: () => fetchProducts("All") });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Product deleted."); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="container admin-page">
      <div className="admin-header">
        <div>
          <div className="sec-label">Admin Dashboard</div>
          <h2 className="sec-head"><em>Nyals</em> Store Manager</h2>
          <p style={{ fontSize: "0.72rem", color: "var(--text3)", marginTop: "0.4rem" }}>Signed in as {email}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <a href="/" className="btn-exit-admin">← Exit to Store</a>
          <div className="admin-tabs">
              <button className={`admin-tab ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>Overview</button>
              <button className={`admin-tab ${tab === "analytics" ? "active" : ""}`} onClick={() => setTab("analytics")}>Analytics</button>
              <button className={`admin-tab ${tab === "add" ? "active" : ""}`} onClick={() => { setTab("add"); setEditing(null); }}>Add Product</button>
              <button className={`admin-tab ${tab === "manage" ? "active" : ""}`} onClick={() => setTab("manage")}>Manage</button>
              <button className={`admin-tab ${tab === "site" ? "active" : ""}`} onClick={() => setTab("site")}>Site</button>

          </div>
          <button className="btn-admin" onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>
      </div>

      {tab === "overview" && <Overview products={products} />}
      {tab === "add" && (
        <ProductForm
          key={editing?.id ?? "new"}
          initial={editing}
          onDone={() => { invalidate(); setEditing(null); setTab("manage"); }}
        />
      )}
      {tab === "manage" && (
        <ManageProducts
          products={products}
          filter={manageFilter}
          setFilter={setManageFilter}
          onEdit={(p) => { setEditing(p); setTab("add"); }}
          onDelete={(id) => { if (confirm("Delete this product?")) del.mutate(id); }}
        />
      )}
      {tab === "site" && <SiteSettings />}
    </div>
  );
}

function Overview({ products }: { products: Product[] }) {
  const cats = new Set(products.map((p) => p.category)).size;
  const newCount = products.filter((p) => p.badge === "new").length;
  const saleCount = products.filter((p) => p.badge === "sale").length;

  return (
    <>
      <div className="admin-stats">
        <div className="a-stat"><strong>{products.length}</strong><span>Total Products</span></div>
        <div className="a-stat"><strong>{cats}</strong><span>Categories</span></div>
        <div className="a-stat"><strong>{newCount}</strong><span>New Arrivals</span></div>
        <div className="a-stat"><strong>{saleCount}</strong><span>On Sale</span></div>
      </div>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 3, padding: "2rem" }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", fontWeight: 400, marginBottom: "1.5rem" }}>
          Recent Products
        </h3>
        <div className="product-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {products.slice(0, 8).map((p) => <MiniCard key={p.id} p={p} />)}
          {products.length === 0 && <div className="empty-state"><p>No products yet — add your first.</p></div>}
        </div>
      </div>
    </>
  );
}

function MiniCard({ p }: { p: Product }) {
  const img = p.images?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400";
  return (
    <div className="prod-card">
      <div className="prod-img"><img src={img} alt={p.name} loading="lazy" /></div>
      <div className="prod-info">
        <div className="prod-cat-tag">{p.category}</div>
        <div className="prod-name">{p.name}</div>
        <div className="prod-price"><span className="price-now">{formatKES(p.price)}</span></div>
      </div>
    </div>
  );
}

function ManageProducts({
  products, filter, setFilter, onEdit, onDelete,
}: {
  products: Product[]; filter: string; setFilter: (s: string) => void;
  onEdit: (p: Product) => void; onDelete: (id: string) => void;
}) {
  const filtered = filter === "All" ? products : products.filter((p) => p.category === filter);
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div className="sec-label" style={{ margin: 0 }}>All Products ({filtered.length})</div>
        <div className="filter-row" style={{ margin: 0 }}>
          {["All", ...ALL_CATEGORIES].map((c) => (
            <button key={c} className={`filter-pill ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
      </div>
      <div className="admin-product-list">
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1", padding: "3rem", textAlign: "center", color: "var(--text3)", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem" }}>
            No products here yet.
          </div>
        ) : filtered.map((p) => (
          <div className="admin-prod-card" key={p.id}>
            <div className="prod-img">
              <img src={p.images?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400"} alt={p.name} loading="lazy" />
              {p.badge === "new" && <div className="prod-badge badge-new">New</div>}
              {p.badge === "sale" && <div className="prod-badge badge-sale">Sale</div>}
              {!p.in_stock && <div className="prod-badge badge-out">Out</div>}
            </div>
            <div className="admin-prod-info">
              <div className="prod-cat-tag">{p.category}</div>
              <div className="prod-name" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}>{p.name}</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--gold)", marginTop: "0.3rem" }}>{formatKES(p.price)}</div>
            </div>
            <div className="admin-prod-actions">
              <button className="btn-edit" onClick={() => onEdit(p)}>Edit</button>
              <button className="btn-del" onClick={() => onDelete(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const BRAND_OPTIONS = [
  "Gauche","Sergio Vitti","Beymearn","Carlo Palazzi","Mavilex","Bellus","Daniel Richards","Manio",
  "Alessio Marchetti","Vittorio Conte","Renard & Cole","Marchetti Bianchi","Corsini Roma",
  "Leon Falchetti","Bastiani","Étienne Roux","Corvatti",
  "Domenico Ferra","Lucca & Sons","Palmiro Reggio","Estevan Cruz",
  "Rinaldi Milano","Ferro & Vane","Castellano","Argento",
  "Ambrosio & Co","Silvano Reyes","Corsetti","Vellano",
];

function ProductForm({ initial, onDone }: { initial: Product | null; onDone: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [brand, setBrand] = useState<string>((initial as any)?.brand ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [price, setPrice] = useState<string>(initial?.price ? String(initial.price) : "");
  const [priceWas, setPriceWas] = useState<string>(initial?.price_was ? String(initial.price_was) : "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [material, setMaterial] = useState(initial?.material ?? "");
  const [sizesStr, setSizesStr] = useState((initial?.sizes ?? []).join(", "));
  const [tagsStr, setTagsStr] = useState<string>((((initial as any)?.tags ?? []) as string[]).join(", "));
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [inStock, setInStock] = useState(initial?.in_stock ?? true);
  const [featured, setFeatured] = useState<boolean>((initial as any)?.featured ?? false);
  const [badge, setBadge] = useState<string>(initial?.badge ?? "");
  const [busy, setBusy] = useState(false);

  const previewImg = images.map((s: string) => s?.trim()).find((s: string) => s && s.startsWith("http"));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !category || !price) {
      toast.error("Name, Category and Price are required.");
      return;
    }
    setBusy(true);
    const payload: ProductInsert = {
      name,
      brand: brand || null,
      category,
      price: Number(price),
      price_was: priceWas ? Number(priceWas) : null,
      sku: sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
      slug: slug || slugify(name) || `product-${Date.now()}`,
      description: description || null,
      material: material || null,
      sizes: sizesStr.split(",").map((s) => s.trim()).filter(Boolean),
      tags: tagsStr.split(",").map((s) => s.trim()).filter(Boolean),
      images: images.map((s) => s.trim()).filter(Boolean),
      in_stock: inStock,
      featured,
      badge: badge || null,
    };
    try {
      if (initial) {
        const { error } = await supabase.from("products").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Product updated.");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Product added.");
      }
      onDone();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="add-product-form" onSubmit={submit}>
      <h3>{initial ? "Edit Product" : "Add New Product"}</h3>
      <div className="form-row">
        <div className="form-group"><label>Product Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Navy Slim-Fit Suit" required />
        </div>
        <div className="form-group"><label>Brand</label>
          <input list="brand-options" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Sergio Vitti" />
          <datalist id="brand-options">
            {BRAND_OPTIONS.map((b) => <option key={b} value={b} />)}
          </datalist>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Category *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select category</option>
            {ALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Material</label>
          <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. 100% Merino Wool" />
        </div>
      </div>
      <div className="form-row-3">
        <div className="form-group"><label>Price (KES) *</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="form-group"><label>Original Price (KES)</label>
          <input type="number" value={priceWas} onChange={(e) => setPriceWas(e.target.value)} placeholder="Blank if no sale" />
        </div>
        <div className="form-group"><label>Badge</label>
          <select value={badge} onChange={(e) => setBadge(e.target.value)}>
            <option value="">None</option>
            <option value="new">New Arrival</option>
            <option value="sale">Sale</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>SKU</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Auto-generated if blank" />
        </div>
        <div className="form-group"><label>URL Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. navy-slim-fit-suit" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Sizes (comma-separated)</label>
          <input value={sizesStr} onChange={(e) => setSizesStr(e.target.value)} placeholder="e.g. S, M, L, XL" />
        </div>
        <div className="form-group"><label>Tags (comma-separated)</label>
          <input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="e.g. wedding, new-arrival" />
        </div>
      </div>
      <div className="form-group"><label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short product description" />
      </div>
      <div className="form-group"><label>Images</label>
        <div style={{ display: "grid", gap: 8 }}>
          {images.map((img, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={img} onChange={(e) => setImages((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))} placeholder="https://images.unsplash.com/..." />
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className="btn-outline" onClick={() => setImages((p) => { const nxt = [...p]; if (i > 0) { [nxt[i-1], nxt[i]] = [nxt[i], nxt[i-1]]; } return nxt; })}>↑</button>
                <button type="button" className="btn-outline" onClick={() => setImages((p) => { const nxt = [...p]; if (i < nxt.length - 1) { [nxt[i+1], nxt[i]] = [nxt[i], nxt[i+1]]; } return nxt; })}>↓</button>
                <button type="button" className="btn-del" onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}>Remove</button>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" className="btn-outline" onClick={() => setImages((p) => [...p, ""]) }>Add Image</button>
            {previewImg && <div style={{ marginLeft: 12 }}>
              <img src={previewImg} alt="preview" style={{ width: 120, aspectRatio: "3/4", objectFit: "cover", borderRadius: 3, border: "1px solid var(--border2)" }} />
            </div>}
          </div>
        </div>
      </div>
      <div className="form-row" style={{ marginTop: "0.5rem" }}>
        <div className="form-group">
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)}
              style={{ width: "auto", accentColor: "var(--gold)" }} />
            <span>In stock</span>
          </label>
        </div>
        <div className="form-group">
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)}
              style={{ width: "auto", accentColor: "var(--gold)" }} />
            <span>Featured on homepage</span>
          </label>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.7rem", marginTop: "1rem" }}>
        <button className="btn-gold" type="submit" disabled={busy}>
          {busy ? "Saving…" : initial ? "Save Changes" : "Add Product"}
        </button>
        <button className="btn-outline" type="button" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

