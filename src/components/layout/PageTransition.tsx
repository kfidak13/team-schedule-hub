import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('fade-in');
    // Force reflow so the browser re-triggers the animation
    void el.offsetHeight;
    el.classList.add('fade-in');
  }, [location.pathname]);

  return (
    <div ref={ref} className="fade-in">
      {children}
    </div>
  );
}
