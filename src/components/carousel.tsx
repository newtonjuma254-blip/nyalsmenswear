import { useEffect, useRef, useState } from "react";

type Props = {
  images: string[];
  interval?: number;
  transitionMs?: number;
  showDots?: boolean;
  showArrows?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  imgClassName?: string;
  loadFirstEager?: boolean;
};

export default function Carousel({
  images = [],
  interval = 5000,
  transitionMs = 700,
  showDots = true,
  showArrows = true,
  pauseOnHover = true,
  className,
  imgClassName,
  loadFirstEager = true,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [validImgs, setValidImgs] = useState<string[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setValidImgs(images.filter(Boolean));
    setIdx(0);
  }, [images]);

  useEffect(() => {
    if (!playing || validImgs.length <= 1) return;
    timerRef.current = window.setTimeout(() => setIdx((i) => (i + 1) % validImgs.length), interval);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, idx, interval, validImgs.length]);

  const go = (n: number) => setIdx((i) => (n + validImgs.length) % validImgs.length);

  const onImgError = (url: string) => {
    setValidImgs((prev) => prev.filter((u) => u !== url));
    setIdx((i) => Math.min(i, Math.max(0, validImgs.length - 2)));
  };

  const onMouseEnter = () => { if (pauseOnHover) setPlaying(false); };
  const onMouseLeave = () => { if (pauseOnHover) setPlaying(true); };

  if (!validImgs || validImgs.length === 0) return null;

  return (
    <div className={`carousel ${className ?? ""}`} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="carousel-track" style={{ position: "relative", width: "100%", height: "100%" }}>
        {validImgs.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt=""
            className={`carousel-slide ${imgClassName ?? ""} ${i === idx ? "active" : ""}`}
            style={{
              transition: `opacity ${transitionMs}ms ease`,
              opacity: i === idx ? 1 : 0,
              position: i === idx ? "relative" : "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            loading={loadFirstEager && i === 0 ? "eager" : "lazy"}
            onError={() => onImgError(src)}
          />
        ))}
      </div>

      {showArrows && validImgs.length > 1 && (
        <>
          <button type="button" className="carousel-arrow carousel-prev" aria-label="Previous" onClick={() => go(idx - 1)}>
            ‹
          </button>
          <button type="button" className="carousel-arrow carousel-next" aria-label="Next" onClick={() => go(idx + 1)}>
            ›
          </button>
        </>
      )}

      {showDots && validImgs.length > 1 && (
        <div className="carousel-dots">
          {validImgs.map((_, i) => (
            <button key={i} type="button" className={`dot ${i === idx ? "active" : ""}`} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}
