import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SLIDES = [
  { src: '/images/water-polo.jpg',      alt: 'Water polo' },
  { src: '/images/football-action.jpg', alt: 'Football' },
  { src: '/images/football-helmet.jpg', alt: 'Football' },
  { src: '/images/basketball-boys.jpg', alt: 'Boys basketball' },
  { src: '/images/basketball-girls.jpg', alt: 'Girls basketball' },
];

const INTERVAL_MS = 3000;
const FADE_MS = 600;

export default function Home() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % SLIDES.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative -mx-3 -mt-4 flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 text-center sm:-mx-6 sm:-mt-8 md:-mt-12">

      {/* Background image — full bleed, crossfade */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${SLIDES[current].src})`,
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
        }}
        aria-hidden="true"
      />

      {/* Navy overlay */}
      <div className="absolute inset-0 bg-[#002855]/70" aria-hidden="true" />

      {/* Bottom fade — blends into page background */}
      <div
        className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 100%)' }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center pb-24 stagger-list">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-lg bg-white/10 ring-2 ring-[#D4AF37]/60 shadow-xl shadow-black/30 backdrop-blur-sm p-3">
          <img src="/images/webb-logo.png" alt="Webb" className="h-full w-full object-contain brightness-0 invert drop-shadow-sm" loading="lazy" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
          Webb Sports Hub
        </h1>
        <p className="mt-4 max-w-sm text-base text-white/75 sm:text-lg">
          Your home for Webb athletics — schedules, rosters, and results.
        </p>

        <div className="mt-10">
          <Button
            size="lg"
            className="gap-2 bg-[#D4AF37] text-[#002855] px-10 py-6 text-base font-bold uppercase tracking-wider shadow-lg hover:bg-[#C5A551] hover-lift rounded"
            onClick={() => navigate('/get-started')}
          >
            Get Started
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-6 bg-[#D4AF37]' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
