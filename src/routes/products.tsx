import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { SiteHeader } from "@/components/site-header";
import { FloatingActions } from "@/components/floating-actions";
import { SiteFooter } from "@/components/site-footer";
import Carousel from "@/components/carousel";
import { fetchProducts, formatKES, type Product } from "@/lib/products";

const PILLS = ["All", "Suits", "Shirts", "Trousers", "Footwear", "Accessories", "Casual", "Blazers"];

const searchSchema = z.object({
  cat: z.string().optional().default("All"),
});

const productsQO = (cat: string) =>
  queryOptions({
    queryKey: ["products", cat],
    queryFn: () => fetchProducts(cat),
  });

export const Route = createFileRoute("/products")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ cat: search.cat }),
  loader: ({ context, deps }) => {
    context.queryClient.ensureQueryData(productsQO(deps.cat));
  },
  head: ({ match }) => {
    const cat = (match.search as { cat?: string }).cat || "All";
    const title = cat === "All" ? "Shop All — Nyals (K) Ltd" : `${cat} — Nyals (K) Ltd`;
    return {
      meta: [
        { title },
        { name: "description", content: `Browse ${cat === "All" ? "the full collection" : cat.toLowerCase()} at Nyals (K) Ltd, Moi Avenue, Nairobi.` },
      ],
    };
  },
  component: ProductsPage,
});

function ProductsPage() {
  const { cat } = Route.useSearch();
  const { data: products } = useSuspenseQuery(productsQO(cat));

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <div className="container products-page">
          <div className="products-page-header">
            <div className="page-title-row">
              <div>
                <div className="sec-label">{cat === "All" ? "All Products" : cat}</div>
                <h1 className="sec-head">
                  {cat === "All" ? (
                    <>Our <em>Collection</em></>
                  ) : (
                    <em>{cat}</em>
                  )}
                </h1>
              </div>
              <Link to="/" className="page-back">← Back to Home</Link>
            </div>
            <div className="filter-row">
              {PILLS.map((p) => (
                <Link
                  key={p}
                  to="/products"
                  search={{ cat: p }}
                  className={`filter-pill ${cat === p ? "active" : ""}`}
                >
                  {p}
                </Link>
              ))}
            </div>
          </div>

          <div className="product-grid">
            {products.length === 0 ? (
              <div className="empty-state">
                <p>No products in this category yet.</p>
              </div>
            ) : (
              products.map((p: Product) => <ProductCard key={p.id} p={p} />)
            )}
          </div>
        </div>
        <SiteFooter />
      </main>
      <FloatingActions />
    </>
  );
}

function ProductCard({ p }: { p: Product }) {
  const fallback = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop";
  const imgs = (p.images && p.images.length > 0) ? p.images : [fallback];
  const badge = !p.in_stock
    ? <div className="prod-badge badge-out">Out</div>
    : p.badge === "new"
    ? <div className="prod-badge badge-new">New</div>
    : p.badge === "sale"
    ? <div className="prod-badge badge-sale">Sale</div>
    : null;

  const handleView = () => {
    import("@/lib/analytics").then(({ trackEvent }) =>
      trackEvent("product_view", { product_id: p.id }),
    );
  };

  return (
    <div className="prod-card" onClick={handleView} style={{ cursor: "pointer" }}>
      <div className="prod-img">
        {imgs.length > 1 ? (
          <Carousel images={imgs} interval={3500} transitionMs={500} showDots={false} showArrows={false} pauseOnHover loadFirstEager={false} />
        ) : (
          <img src={imgs[0]} alt={p.name} loading="lazy" />
        )}
        {badge}
      </div>
      <div className="prod-info">
        <div className="prod-cat-tag">{p.category}</div>
        <div className="prod-name">{p.name}</div>
        {(p.material || (p.sizes && p.sizes.length > 0)) && (
          <div className="prod-meta">
            {p.material}
            {p.material && p.sizes?.length ? " · " : ""}
            {p.sizes?.join(" / ")}
          </div>
        )}
        <div className="prod-price">
          <span className="price-now">{formatKES(p.price)}</span>
          {p.price_was && <span className="price-was">{formatKES(p.price_was)}</span>}
        </div>
        <div style={{ fontSize: "0.6rem", color: "var(--text3)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          SKU {p.sku}
        </div>
      </div>
    </div>
  );
}

