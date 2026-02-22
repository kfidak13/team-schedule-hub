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
    <div className="relative -mx-4 -mt-6 flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center md:-mt-10">

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

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/55" aria-hidden="true" />

      {/* Bottom fade — blends into page background */}
      <div
        className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 100%)' }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center pb-24">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-gold/60 shadow-xl shadow-black/60 backdrop-blur-sm p-3">
          <img src="/images/webb-logo.png" alt="Webb" className="h-full w-full object-contain drop-shadow-sm" />
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl">
          Webb Sports Hub
        </h1>
        <p className="mt-4 max-w-sm text-base text-white/75 sm:text-lg">
          Your home for Webb athletics — schedules, rosters, and results.
        </p>

        <div className="mt-10">
          <Button
            size="lg"
            className="gap-2 border border-gold/50 bg-primary px-10 py-6 text-base font-semibold shadow-lg shadow-black/40 hover:bg-primary/90 hover:border-gold/80"
            onClick={() => navigate('/get-started')}
          >
            Get started
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
              i === current ? 'w-6 bg-gold' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
