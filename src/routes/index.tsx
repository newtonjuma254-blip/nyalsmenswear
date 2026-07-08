import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";

import { SiteHeader } from "@/components/site-header";
import { FloatingActions } from "@/components/floating-actions";
import Carousel from "@/components/carousel";
import { HERO_IMAGES as DEFAULT_HERO, ABOUT_IMAGES as DEFAULT_ABOUT } from "@/lib/site";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { CATEGORIES, fetchProducts, type Product } from "@/lib/products";

const productsQO = queryOptions({
  queryKey: ["products", "All"],
  queryFn: () => fetchProducts("All"),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nyals (K) Ltd — Exclusive Menswear on Moi Avenue, Nairobi" },
      {
        name: "description",
        content:
          "Tailored suits, dress shirts, footwear and accessories for the discerning Nairobi gentleman. Visit us at the Nyals K Building, Moi Avenue.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(productsQO);
  },
  component: HomePage,
});

function HomePage() {
  const { data: products } = useSuspenseQuery(productsQO);

  const totalCount = products.length;

  const [heroImgs, setHeroImgs] = useState<string[]>(DEFAULT_HERO);
  const [aboutImgs, setAboutImgs] = useState<string[]>(DEFAULT_ABOUT);
  const [catImgsMap, setCatImgsMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("nyals_site_data");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.heroImages)) setHeroImgs(parsed.heroImages.filter(Boolean));
        if (Array.isArray(parsed.aboutImages)) setAboutImgs(parsed.aboutImages.filter(Boolean));
        if (parsed.categories && typeof parsed.categories === "object") setCatImgsMap(parsed.categories);
      }
    } catch (_) {}

    const onUpdate = () => {
      try {
        const raw = localStorage.getItem("nyals_site_data");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.heroImages)) setHeroImgs(parsed.heroImages.filter(Boolean));
          if (Array.isArray(parsed.aboutImages)) setAboutImgs(parsed.aboutImages.filter(Boolean));
          if (parsed.categories && typeof parsed.categories === "object") setCatImgsMap(parsed.categories);
        }
      } catch (_) {}
    };
    window.addEventListener("nyals:site:update", onUpdate as EventListener);
    return () => window.removeEventListener("nyals:site:update", onUpdate as EventListener);
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        {/* HERO */}
        <section className="hero">
          <div className="hero-left">
            <div className="hero-eyebrow">Nairobi's Premier Menswear</div>
            <h1 className="hero-headline">
              Dressed for<br />
              <em>Every</em>
              <br />
              Occasion.
            </h1>
            <p className="hero-body">
              Exclusive menswear and accessories for Nairobi's discerning gentleman. Curated with care,
              stocked with style — on Moi Avenue.
            </p>
            <div className="hero-btns">
              <Link to="/products" search={{ cat: "All" }} className="btn-gold">
                Explore Collection
              </Link>
              <a href="#about" className="btn-outline">Our Story</a>
            </div>
          </div>
          <div className="hero-right">
            <Carousel images={heroImgs.length ? heroImgs : DEFAULT_HERO} interval={5000} transitionMs={700} showDots={true} showArrows={true} pauseOnHover={true} loadFirstEager />
            <div className="hero-right-overlay" />
            <div className="hero-tag">
              <p>New In</p>
              <strong>SS 2026 Collection</strong>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="marquee-strip" aria-hidden="true">
          <div className="marquee-track">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i}>
                Suits &amp; Blazers <span className="mdot">◆</span> Dress Shirts <span className="mdot">◆</span>{" "}
                Trousers <span className="mdot">◆</span> Footwear <span className="mdot">◆</span> Accessories{" "}
                <span className="mdot">◆</span> Casual Wear <span className="mdot">◆</span> Nyals (K) Ltd · Moi
                Avenue, Nairobi <span className="mdot">◆</span>{" "}
              </span>
            ))}
          </div>
        </div>

        {/* CATEGORIES */}
        <section className="cats-section" id="cats">
          <div className="container">
            <div className="sec-label">Collections</div>
            <h2 className="sec-head">
              Shop by <em>Category</em>
            </h2>
            <div className="cats-grid">
              {CATEGORIES.map((c) => {
                const count = products.filter((p: Product) => p.category === c.slug).length;
                return (
                  <Link
                    key={c.slug}
                    to="/products"
                    search={{ cat: c.slug }}
                    className="cat-card"
                    style={{ display: "block" }}
                  >
                      <div style={{ width: "100%", height: "100%" }}>
                        <Carousel images={(catImgsMap[c.slug] && catImgsMap[c.slug].length) ? catImgsMap[c.slug] : c.images} interval={3500} transitionMs={500} showDots={false} showArrows={false} pauseOnHover={true} loadFirstEager={false} />
                      </div>
                    <div className="cat-overlay">
                      <div className="cat-pill">{c.desc}</div>
                      <h3 className="cat-name">{c.name}</h3>
                      <div className="cat-count">
                        {count} item{count !== 1 ? "s" : ""}
                      </div>
                      <span className="cat-arrow">Shop Category →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="about-section" id="about">
          <div className="container">
            <div className="about-grid">
              <div className="about-visual">
                <div style={{ position: "relative", width: "100%" }}>
                  <Carousel images={aboutImgs.length ? aboutImgs : DEFAULT_ABOUT} interval={5000} transitionMs={700} showDots={true} showArrows={false} pauseOnHover={true} loadFirstEager />
                  <div className="about-badge">
                    <strong>№1</strong>
                    <small>Moi Ave</small>
                  </div>
                </div>
              </div>
              <div>
                <div className="sec-label">Our Story</div>
                <h2 className="sec-head">
                  Nairobi's <em>Trusted</em>
                  <br />
                  Menswear Destination
                </h2>
                <div className="about-text">
                  <p>
                    Nyals (K) Ltd — officially Nyals Kenya Limited — has long been a fixture of Nairobi's retail
                    landscape. Situated at the Nyals K Building on Moi Avenue, we have built our reputation on
                    quality, service, and selection for the modern man.
                  </p>
                  <p>
                    Our store specialises in exclusive menswear and clothing accessories — from sharp formal
                    suits to refined casual pieces, all carefully curated for the discerning Nairobi gentleman.
                  </p>
                </div>
                <div className="stat-row">
                  <div className="stat">
                    <strong>{totalCount}</strong>
                    <span>Products In-Store</span>
                  </div>
                  <div className="stat">
                    <strong>CBD</strong>
                    <span>Central Location</span>
                  </div>
                  <div className="stat">
                    <strong>GCN</strong>
                    <span>Ethics Signatory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="testi-section">
          <div className="container">
            <div className="sec-label" style={{ justifyContent: "center" }}>Reviews</div>
            <h2 className="sec-head">
              What Our <em>Clients</em> Say
            </h2>
            <div className="testi-grid">
              {[
                { s: "★★★★★", t: "Found the perfect suit for my wedding here. The staff helped me choose a cut that actually fits. Quality you don't usually find at this price point.", a: "James M.", l: "Nairobi CBD" },
                { s: "★★★★★", t: "Nyals has been my go-to for business attire since I started my career. Selection is consistently fresh and they always have something that stands out.", a: "Peter O.", l: "Westlands, Nairobi" },
                { s: "★★★★☆", t: "Great central location and excellent variety. The accessories section especially — ties and pocket squares you won't find anywhere else on Moi Avenue.", a: "Samuel K.", l: "Upper Hill, Nairobi" },
              ].map((tst, i) => (
                <div className="testi-card" key={i}>
                  <div className="stars">{tst.s}</div>
                  <p className="testi-text">{tst.t}</p>
                  <div className="testi-author">
                    <strong>{tst.a}</strong>
                    <span>{tst.l}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LOCATION */}
        <section className="location-section" id="location">
          <div className="container">
            <div className="location-grid">
              <div>
                <div className="sec-label">Find Us</div>
                <h2 className="sec-head">
                  Visit the <em>Store</em>
                </h2>
                <div style={{ marginTop: "2.5rem" }}>
                  <div className="loc-item">
                    <div className="loc-icon">📍</div>
                    <div>
                      <span className="loc-label">Address</span>
                      <div className="loc-val">
                        Nyals K Building, Moi Avenue
                        <br />
                        Nairobi Central, Kenya
                      </div>
                    </div>
                  </div>
                  <div className="loc-item">
                    <div className="loc-icon">📮</div>
                    <div>
                      <span className="loc-label">Postal</span>
                      <div className="loc-val">P.O. Box 49742, 00100 Nairobi GPO</div>
                    </div>
                  </div>
                  <div className="loc-item">
                    <div className="loc-icon">🕙</div>
                    <div>
                      <span className="loc-label">Hours</span>
                      <div className="loc-val">
                        Mon–Sat: 9:00 AM – 7:00 PM
                        <br />
                        Sun: 11:00 AM – 5:00 PM
                      </div>
                    </div>
                  </div>
                  <div className="loc-item">
                    <div className="loc-icon">💬</div>
                    <div>
                      <span className="loc-label">Enquiries</span>
                      <div className="loc-val">
                        Visit in-store or find us
                        <br />
                        on Yellow Pages Kenya
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="loc-map">
                <iframe
                  title="Nyals (K) Ltd on Google Maps"
                  src="https://www.google.com/maps?q=-1.2844161,36.824948&z=17&hl=en&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

        {/* ETHICS */}
        <section className="ethics-section">
          <div className="container">
            <div className="sec-label" style={{ justifyContent: "center" }}>Commitment</div>
            <h2 className="sec-head">
              Business with <em>Integrity</em>
            </h2>
            <p>
              Nyals (K) Ltd is a proud signatory of the Code of Ethics for Business in Kenya through the Global
              Compact Network Kenya. We believe how we do business matters as much as what we sell.
            </p>
            <div className="ethics-badge">
              <i>✦</i> Global Compact Network Kenya — Ethics Signatory <i>✦</i>
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>
      <FloatingActions />
    </>
  );
}
