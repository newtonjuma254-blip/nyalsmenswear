import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="page-shell">
      <div className="container" style={{ padding: "6rem 3rem", textAlign: "center" }}>
        <div className="sec-label" style={{ justifyContent: "center" }}>404</div>
        <h1 className="sec-head">
          Page <em>not found</em>
        </h1>
        <p style={{ color: "var(--text2)", marginTop: "1rem" }}>
          The page you're looking for doesn't exist.
        </p>
        <div style={{ marginTop: "2rem" }}>
          <Link to="/" className="btn-gold" style={{ display: "inline-block" }}>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="page-shell">
      <div className="container" style={{ padding: "6rem 3rem", textAlign: "center" }}>
        <h1 className="sec-head">Something <em>went wrong</em></h1>
        <p style={{ color: "var(--text2)", marginTop: "1rem" }}>
          Please try again or return home.
        </p>
        <div style={{ marginTop: "2rem", display: "flex", gap: "0.7rem", justifyContent: "center" }}>
          <button
            className="btn-gold"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a href="/" className="btn-outline">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nyals (K) Ltd — Exclusive Menswear on Moi Avenue, Nairobi" },
      {
        name: "description",
        content:
          "Nairobi's premier destination for exclusive menswear and accessories. Visit Nyals (K) Ltd on Moi Avenue for tailored suits, dress shirts, footwear and more.",
      },
      { name: "author", content: "Nyals (K) Ltd" },
      { property: "og:title", content: "Nyals (K) Ltd — Exclusive Menswear on Moi Avenue, Nairobi" },
      {
        property: "og:description",
        content: "Curated menswear on Moi Avenue, Nairobi. Suits, shirts, footwear, accessories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Nyals (K) Ltd — Exclusive Menswear on Moi Avenue, Nairobi" },
      { name: "description", content: "Tailored suits, dress shirts, footwear and accessories for the discerning Nairobi gentleman. Visit us at the Nyals K Building, Moi Avenue." },
      { property: "og:description", content: "Tailored suits, dress shirts, footwear and accessories for the discerning Nairobi gentleman. Visit us at the Nyals K Building, Moi Avenue." },
      { name: "twitter:description", content: "Tailored suits, dress shirts, footwear and accessories for the discerning Nairobi gentleman. Visit us at the Nyals K Building, Moi Avenue." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0e749b93-07e4-44af-b92b-e45b761121f0/id-preview-549ff5f1--f401e90f-76b1-405e-8f64-9bf4c2522ca0.lovable.app-1783116747582.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0e749b93-07e4-44af-b92b-e45b761121f0/id-preview-549ff5f1--f401e90f-76b1-405e-8f64-9bf4c2522ca0.lovable.app-1783116747582.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('nyals_theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
