import { Link } from 'react-router-dom';
import { Calendar, Users, BarChart3 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#002855] text-white">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-10 sm:grid-cols-3">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
              <img src="/images/webb-logo.png" alt="Webb" className="h-6 w-6 object-contain brightness-0 invert" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Webb Sports Hub</span>
          </div>
          <p className="text-xs leading-relaxed text-white/60">
            Your home for Webb athletics — schedules, rosters, and results.
          </p>
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Quick Links</h3>
          <nav className="flex flex-col gap-2">
            <Link to="/schedule" className="flex items-center gap-2 text-sm text-white/70 transition-colors duration-300 hover:text-[#D4AF37]">
              <Calendar className="h-3.5 w-3.5" /> Schedule
            </Link>
            <Link to="/roster/players" className="flex items-center gap-2 text-sm text-white/70 transition-colors duration-300 hover:text-[#D4AF37]">
              <Users className="h-3.5 w-3.5" /> Roster
            </Link>
            <Link to="/stats/team" className="flex items-center gap-2 text-sm text-white/70 transition-colors duration-300 hover:text-[#D4AF37]">
              <BarChart3 className="h-3.5 w-3.5" /> Stats
            </Link>
          </nav>
        </div>

        {/* Attribution */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">About</h3>
          <p className="text-xs leading-relaxed text-white/60">
            Built for Webb Athletics. Keeping athletes, coaches, and families connected.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        &copy; {new Date().getFullYear()} Webb Sports Hub
      </div>
    </footer>
  );
}
