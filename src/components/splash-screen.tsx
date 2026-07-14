import { useEffect, useState } from "react";
import { NYALS_LOGO_URL } from "@/lib/products";

const KEY = "nyals_splash_shown";

export function SplashScreen() {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, "1");
    } catch { /* ignore */ }
    setShow(true);
    const fadeT = setTimeout(() => setFading(true), 2200);
    const doneT = setTimeout(() => setShow(false), 3000);
    return () => { clearTimeout(fadeT); clearTimeout(doneT); };
  }, []);

  if (!show) return null;

  return (
    <div className={`splash-screen${fading ? " splash-fade-out" : ""}`} aria-hidden="true">
      <div className="splash-inner">
        <img src={NYALS_LOGO_URL} alt="Nyals (K) Ltd" className="splash-logo" />
        <div className="splash-progress"><span /></div>
      </div>
    </div>
  );
}
