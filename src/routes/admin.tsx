import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SiteHeader, ThemeToggle } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { fetchProducts, formatKES, slugify, ALL_CATEGORIES, type Product, type ProductInsert } from "@/lib/products";

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

  if (!session) return <><SiteHeader /><main className="page-shell"><LoginCard /></main><ThemeToggle /></>;
  if (isAdmin === false) return <><SiteHeader /><main className="page-shell"><NotAdminCard /></main><ThemeToggle /></>;
  if (isAdmin === null) {
    return <><SiteHeader /><main className="page-shell"><div className="admin-login"><div className="login-card"><p>Checking access…</p></div></div></main></>;
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <Dashboard email={session.user.email ?? ""} />
      </main>
      <ThemeToggle />
    </>
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
  const [tab, setTab] = useState<"overview" | "add" | "manage">("overview");
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
            <button className={`admin-tab ${tab === "add" ? "active" : ""}`} onClick={() => { setTab("add"); setEditing(null); }}>Add Product</button>
            <button className={`admin-tab ${tab === "manage" ? "active" : ""}`} onClick={() => setTab("manage")}>Manage</button>
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

function ProductForm({ initial, onDone }: { initial: Product | null; onDone: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [price, setPrice] = useState<string>(initial?.price ? String(initial.price) : "");
  const [priceWas, setPriceWas] = useState<string>(initial?.price_was ? String(initial.price_was) : "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [material, setMaterial] = useState(initial?.material ?? "");
  const [sizesStr, setSizesStr] = useState((initial?.sizes ?? []).join(", "));
  const [imagesStr, setImagesStr] = useState((initial?.images ?? []).join("\n"));
  const [inStock, setInStock] = useState(initial?.in_stock ?? true);
  const [badge, setBadge] = useState<string>(initial?.badge ?? "");
  const [busy, setBusy] = useState(false);

  const previewImg = imagesStr.split("\n").map((s) => s.trim()).find((s) => s.startsWith("http"));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !category || !price) {
      toast.error("Please fill all required fields.");
      return;
    }
    setBusy(true);
    const payload: ProductInsert = {
      name,
      category,
      price: Number(price),
      price_was: priceWas ? Number(priceWas) : null,
      sku: sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
      slug: slug || slugify(name) || `product-${Date.now()}`,
      description: description || null,
      material: material || null,
      sizes: sizesStr.split(",").map((s) => s.trim()).filter(Boolean),
      images: imagesStr.split("\n").map((s) => s.trim()).filter(Boolean),
      in_stock: inStock,
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
        <div className="form-group"><label>Category *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select category</option>
            {ALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
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
        <div className="form-group"><label>Material</label>
          <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. 100% Merino Wool" />
        </div>
        <div className="form-group"><label>Sizes (comma-separated)</label>
          <input value={sizesStr} onChange={(e) => setSizesStr(e.target.value)} placeholder="e.g. S, M, L, XL" />
        </div>
      </div>
      <div className="form-group"><label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short product description" />
      </div>
      <div className="form-group"><label>Image URLs (one per line) *</label>
        <textarea value={imagesStr} onChange={(e) => setImagesStr(e.target.value)}
          placeholder="https://images.unsplash.com/..." style={{ minHeight: 120 }} required />
      </div>
      {previewImg && (
        <div style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text3)", marginBottom: "0.5rem" }}>Preview</p>
          <img src={previewImg} alt="preview" style={{ width: 180, aspectRatio: "3/4", objectFit: "cover", borderRadius: 3, border: "1px solid var(--border2)" }} />
        </div>
      )}
      <div className="form-group" style={{ marginTop: "0.5rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)}
            style={{ width: "auto", accentColor: "var(--gold)" }} />
          <span>In stock</span>
        </label>
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
