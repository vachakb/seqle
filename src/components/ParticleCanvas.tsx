import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  char: string;
  vx: number;
  vy: number;
  color: string;
}

const SYMBOLS = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "π", "e", "φ", "Σ", "√", "∫", "∞",
  "Δ", "θ", "λ", "∂", "±",
];

const COLORS = [
  "rgba(139, 92, 246, OPACITY)",
  "rgba(167, 139, 250, OPACITY)",
  "rgba(124, 58, 237, OPACITY)",
  "rgba(109, 89, 176, OPACITY)",
];

function createParticle(w: number, h: number): Particle {
  const opacity = 0.03 + Math.random() * 0.05;
  const colorTemplate = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: 12 + Math.random() * 10,
    opacity,
    char: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.2,
    color: colorTemplate.replace("OPACITY", String(opacity)),
  };
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    // Initialize particles
    particlesRef.current = Array.from({ length: 25 }, () =>
      createParticle(canvas.width, canvas.height)
    );

    function animate() {
      if (!visibleRef.current || !canvas || !ctx) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.y > canvas.height + 20) p.y = -20;

        ctx.font = `${p.size}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = p.color;
        ctx.fillText(p.char, p.x, p.y);
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    function handleVisibility() {
      visibleRef.current = !document.hidden;
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
