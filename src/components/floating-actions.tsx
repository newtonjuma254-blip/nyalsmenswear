import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Moon, Sun } from "lucide-react";
import { WHATSAPP_NUMBER, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/site";

const EDGE_MARGIN = 8;
const DRAG_THRESHOLD = 5; // px before we treat a pointer move as a drag
const FAB_SIZE = 54;

type Pos = { x: number; y: number };

type Corner = "br" | "bl" | "tr" | "tl";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function defaultPos(corner: Corner): Pos {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const right = vw - FAB_SIZE - EDGE_MARGIN;
  const bottom = vh - FAB_SIZE - EDGE_MARGIN;
  switch (corner) {
    case "br": return { x: right, y: bottom };
    case "bl": return { x: EDGE_MARGIN, y: bottom };
    case "tr": return { x: right, y: EDGE_MARGIN };
    case "tl": return { x: EDGE_MARGIN, y: EDGE_MARGIN };
  }
}

function useDraggableFab(storageKey: string, corner: Corner) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragMovedRef = useRef(false);
  const startRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  // Load persisted position
  useEffect(() => {
    let next: Pos | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          next = parsed;
        }
      }
    } catch { /* ignore */ }
    if (!next) next = defaultPos(corner);
    // clamp into viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    next = {
      x: clamp(next.x, EDGE_MARGIN, vw - FAB_SIZE - EDGE_MARGIN),
      y: clamp(next.y, EDGE_MARGIN, vh - FAB_SIZE - EDGE_MARGIN),
    };
    setPos(next);
  }, [storageKey, corner]);

  // Re-clamp on resize
  useEffect(() => {
    const onResize = () => {
      setPos((p) => {
        if (!p) return p;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        return {
          x: clamp(p.x, EDGE_MARGIN, vw - FAB_SIZE - EDGE_MARGIN),
          y: clamp(p.y, EDGE_MARGIN, vh - FAB_SIZE - EDGE_MARGIN),
        };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!pos) return;
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    startRef.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
    dragMovedRef.current = false;
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.px;
    const dy = e.clientY - startRef.current.py;
    if (!dragMovedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    dragMovedRef.current = true;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const nx = clamp(startRef.current.ox + dx, EDGE_MARGIN, vw - FAB_SIZE - EDGE_MARGIN);
    const ny = clamp(startRef.current.oy + dy, EDGE_MARGIN, vh - FAB_SIZE - EDGE_MARGIN);
    setPos({ x: nx, y: ny });
  };

  const endDrag = (e: ReactPointerEvent<HTMLButtonElement>, onClick?: () => void) => {
    if (!startRef.current) return;
    try { (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    const moved = dragMovedRef.current;
    startRef.current = null;
    setDragging(false);
    if (moved && pos) {
      try { localStorage.setItem(storageKey, JSON.stringify(pos)); } catch { /* ignore */ }
    } else if (!moved && onClick) {
      onClick();
    }
  };

  return { pos, dragging, onPointerDown, onPointerMove, endDrag };
}

function Fab({
  storageKey,
  corner,
  onClick,
  ariaLabel,
  style,
  children,
}: {
  storageKey: string;
  corner: Corner;
  onClick: () => void;
  ariaLabel: string;
  style?: CSSProperties;
  children: React.ReactNode;
}) {
  const { pos, dragging, onPointerDown, onPointerMove, endDrag } = useDraggableFab(storageKey, corner);
  if (!pos) return null;
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e, onClick)}
      onPointerCancel={(e) => endDrag(e)}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
        zIndex: 2147483000,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        transition: dragging ? "none" : "box-shadow 0.2s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        fill="#fff"
        d="M16.02 3C9.4 3 4.03 8.37 4.03 15c0 2.36.69 4.56 1.87 6.42L4 29l7.79-1.86A11.95 11.95 0 0 0 16.02 27C22.65 27 28 21.63 28 15S22.65 3 16.02 3Zm0 21.8c-1.94 0-3.75-.55-5.29-1.5l-.38-.22-4.62 1.1 1.13-4.5-.25-.4A9.78 9.78 0 0 1 6.22 15c0-5.4 4.4-9.8 9.8-9.8s9.8 4.4 9.8 9.8-4.4 9.8-9.8 9.8Zm5.6-7.35c-.3-.15-1.8-.9-2.08-1s-.48-.15-.68.15-.78 1-.95 1.2-.35.23-.65.08a8.06 8.06 0 0 1-2.38-1.47 8.9 8.9 0 0 1-1.65-2.05c-.17-.3 0-.46.13-.6.13-.13.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.5h-.58c-.2 0-.53.08-.8.38s-1.05 1.03-1.05 2.5 1.08 2.9 1.23 3.1 2.13 3.25 5.15 4.55c.72.3 1.28.5 1.72.63.72.23 1.38.2 1.9.13.58-.09 1.8-.74 2.05-1.45s.25-1.33.18-1.45c-.08-.13-.28-.2-.58-.35Z"
      />
    </svg>
  );
}

export function FloatingActions() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (typeof window !== "undefined"
      ? (localStorage.getItem("nyals_theme") as "dark" | "light" | null)
      : null) || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("nyals_theme", next); } catch { /* ignore */ }
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Fab
        storageKey="nyals_fab_theme"
        corner="bl"
        onClick={toggleTheme}
        ariaLabel="Toggle color theme"
        style={{
          background: "var(--bg2)",
          border: "1.5px solid var(--gold2, var(--border))",
          color: "var(--gold2, var(--text))",
        }}
      >
        {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
      </Fab>
      <Fab
        storageKey="nyals_fab_whatsapp"
        corner="br"
        onClick={openWhatsApp}
        ariaLabel="Chat on WhatsApp"
        style={{
          background: "#25D366",
          border: "none",
          color: "#fff",
        }}
      >
        <WhatsAppIcon />
      </Fab>
    </>
  );
}
