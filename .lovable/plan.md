

# Sports Team Management App

A modern, polished app for managing your team across multiple sports with schedule imports, roster management, and performance tracking.

---

## Phase 1: Core Foundation (Starting Simple)

### Dashboard
- **At-a-glance view** showing upcoming games/events for the next 7 days
- **Quick stats panel** with season record (W-L) and next game countdown
- **Sport selector** to switch between different sports (Tennis, Basketball, etc.)

### Schedule Management
- **HTML Import Tool** - Upload or paste your school's HTML schedule to automatically extract:
  - Game dates and times
  - Opponents
  - Home/Away/Neutral locations
  - League vs non-league games
  - Venue details
- **Interactive calendar view** with month/week/list options
- **Game detail cards** showing all event information
- **Add/edit events manually** for practices, meetings, or custom events
- **Filter by** sport, home/away, league games

### Roster Management
- **Players list** with name, jersey number, position, and contact info
- **Coaches section** with role (Head Coach, Assistant) and contact
- **Simple player profiles** with photo upload capability

---

## Phase 2: Future Enhancements (When Ready to Expand)

### Stats & Performance
- Match results entry (scores, individual stats)
- Season statistics tracking
- Player performance metrics
- Win/loss record by sport

### Team Access & Notifications
- Login for coaches, players, and parents
- Email/text reminders for upcoming games
- RSVP tracking for events

### Advanced Features
- Directions integration for away games
- Photo galleries for events
- Team announcements board

---

## Design Approach

- **Modern & polished** with clean card-based layouts
- **Mobile-friendly** so team members can check on the go
- **Color-coded** events (league games, home/away, different sports)
- **Easy navigation** between sports and schedule views

---

## Technical Notes

- Starting **without a backend** (data stored locally in browser)
- When ready to add user accounts and persistent storage, we'll connect **Lovable Cloud** (built-in database)
- The HTML parser will work with your school's schedule format

---

# UI Overhaul Plan — `ui/overhaul-smooth-fades`

> Sharp, modern, cohesive Webb-branded sports hub with smooth fade/slide transitions.

---

## 0 — Audit Findings (Current State)

| Item | Current Value | Action |
|---|---|---|
| **Framework** | React 18 + Vite + TypeScript + Tailwind 3 + shadcn/ui (Radix) | Keep as-is |
| **Font** | **Lora** (Google Fonts, loaded in `index.html`, set in `tailwind.config.ts`) | **Keep Lora** — it is already embedded and branded |
| **Primary (navy)** | `--primary: 220 68% 26%` → `hsl(220, 68%, 26%)` ≈ `#153574` | Refine to true Webb navy `#0b2340` = `hsl(215, 72%, 15%)` |
| **Gold accent** | `--gold: 45 92% 52%` → `hsl(45, 92%, 52%)` ≈ `#f0c025` | Keep — close to `#d4af37`, vibrant on dark backgrounds |
| **Dark mode** | Default (`<html class="dark">`). Dark vars defined in `index.css` | Keep dark-first; polish light mode later |
| **Animations** | Only accordion keyframes + manual carousel fade in `Home.tsx` | **Add global motion system** |
| **Layout** | Sticky top nav in `AppLayout.tsx`, no footer | Add footer; polish nav; add page transitions |
| **App.css** | Vite boilerplate (logo-spin, .card padding, .read-the-docs) | **Delete contents** — unused |
| **Images** | 5 large JPGs (7–24 MB each!) in `/public/images/` | Note: compress later (out of scope for this plan, but flag it) |
| **Components** | `AppLayout`, `QuickStats`, `UpcomingGames`, `SportSelector`, `ScheduleList`, `HtmlImporter`, `RosterImporter`, `AddPersonDialog`, `PlayerCard`, `CoachCard`, 49 shadcn/ui primitives | Wrap pages with fade-in; add hover-lift to cards |

---

## 1 — Design Tokens (Single Source of Truth)

Add CSS custom properties to `src/index.css` `:root` / `.dark` blocks and mirror in `tailwind.config.ts`.

### New variables to add

```css
/* Transitions */
--transition-fast: 180ms cubic-bezier(.2,.9,.2,1);
--transition-medium: 320ms cubic-bezier(.2,.9,.2,1);
--transition-slow: 500ms cubic-bezier(.2,.9,.2,1);

/* Elevation */
--elevation-soft: 0 6px 20px rgba(11, 35, 64, 0.12);
--elevation-lifted: 0 12px 32px rgba(11, 35, 64, 0.18);

/* Motion distance */
--motion-distance: 6px;
```

### Color refinements

- Tighten `--primary` in dark mode toward `hsl(215, 72%, 15%)` for deeper navy.
- No changes to `--gold`.

### Tailwind config additions

```ts
// tailwind.config.ts → theme.extend
transitionTimingFunction: {
  smooth: 'cubic-bezier(.2,.9,.2,1)',
},
transitionDuration: {
  fast: '180ms',
  medium: '320ms',
},
boxShadow: {
  soft: 'var(--elevation-soft)',
  lifted: 'var(--elevation-lifted)',
},
keyframes: {
  'fade-in': {
    from: { opacity: '0', transform: 'translateY(var(--motion-distance, 6px))' },
    to:   { opacity: '1', transform: 'translateY(0)' },
  },
},
animation: {
  'fade-in': 'fade-in var(--transition-medium) ease-smooth both',
},
```

### Files touched
- `src/index.css`
- `tailwind.config.ts`

### Commit
`chore(ui): add design tokens — transitions, elevation, motion variables`

---

## 2 — Global Motion Utilities

Create `src/styles/motion.css` (imported in `main.tsx`) with utility classes:

| Class | Effect |
|---|---|
| `.fade-in` | `opacity 0→1` + `translateY(6px→0)`, 320ms smooth |
| `.fade-slide-up` | Same but with 12px travel for hero-level entrances |
| `.stagger-list > *` | Each child gets `animation-delay: calc(var(--stagger-i, 0) * 50ms)` via CSS `nth-child` (1–12) |
| `.hover-lift` | On hover: `translateY(-4px)` + `box-shadow: var(--elevation-lifted)` |
| `.btn-gold` | Gold border/text, hover fills gold bg + navy text |
| `@media (prefers-reduced-motion: reduce)` | All animation durations → `0ms`, transforms → `none` |

### `will-change` policy
- Only apply `will-change: transform, opacity` on elements actively animating; remove after animation completes via JS or `animation-fill-mode`.

### Files touched
- **New:** `src/styles/motion.css`
- `src/main.tsx` (add `import './styles/motion.css'`)

### Commit
`feat(ui): add global motion utilities — fade-in, stagger, hover-lift, reduced-motion`

---

## 3 — Layout Shell (AppLayout + Footer + Page Transition)

### 3a — AppLayout polish
- Add subtle bottom gold border line on the sticky header (`border-b-gold/20`).
- Wrap desktop nav links with `transition-all duration-fast ease-smooth`.
- Active link: solid gold underline instead of bg-accent fill.

### 3b — Footer component
- **New file:** `src/components/layout/Footer.tsx`
- Navy background (`bg-primary`), white text, gold accent links.
- Three columns: Brand + tagline | Quick links (Schedule, Roster, Stats) | "Built for Webb Athletics".
- Semantic `<footer>` element.
- Rendered in `AppLayout` below `<main>`.
- **Hidden on Home page** (full-bleed hero).

### 3c — Page transition wrapper
- **New file:** `src/components/layout/PageTransition.tsx`
- Simple React component that wraps `{children}` and applies `.fade-in` on mount via a `useEffect` + class toggle (or via `key={location.pathname}` to re-trigger).
- Applied in `AppLayout` around `{children}`.

### Files touched
- `src/components/layout/AppLayout.tsx`
- **New:** `src/components/layout/Footer.tsx`
- **New:** `src/components/layout/PageTransition.tsx`

### Commits
- `refactor(layout): polish sticky nav with gold accent and smooth transitions`
- `feat(layout): add Footer component — navy bg, gold accents, semantic HTML`
- `feat(layout): add PageTransition wrapper for route-level fade-in`

---

## 4 — Home Page Refinements

- Apply `.fade-slide-up` to the hero content block (logo, title, subtitle, CTA) with stagger.
- Add `hover-lift` to the "Get Started" CTA button.
- Keep existing carousel logic (it already cross-fades nicely).
- Tighten overlay gradient to match refined navy.

### Files touched
- `src/pages/Home.tsx`

### Commit
`feat(home): apply fade-slide-up entrance and hover-lift to hero CTA`

---

## 5 — GetStarted Page Animations

- Wrap sport card grid in `.stagger-list` so cards fade in with 50ms stagger.
- Add `.hover-lift` to each sport card.
- Animate the level picker panel with a quick `.fade-in` when it appears.

### Files touched
- `src/pages/GetStarted.tsx`

### Commit
`feat(get-started): stagger sport cards on mount, animate level picker`

---

## 6 — Dashboard, Schedule, Roster, Stats Pages

Apply a consistent pattern to every interior page:

1. **Page wrapper** gets `.fade-in` via `PageTransition`.
2. **Cards** (stat cards, game cards, player/coach cards) get `.hover-lift`.
3. **Lists** (schedule list, roster list, recent results) get `.stagger-list`.
4. **Gold accent touches**: section headers get a small gold left border or underline.

### Files touched
- `src/pages/Dashboard.tsx`
- `src/pages/Schedule.tsx`
- `src/pages/Roster.tsx`
- `src/pages/TeamStats.tsx`
- `src/components/dashboard/QuickStats.tsx`
- `src/components/dashboard/UpcomingGames.tsx`
- `src/components/schedule/ScheduleList.tsx`
- `src/components/roster/PlayerCard.tsx`
- `src/components/roster/CoachCard.tsx`

### Commits
- `feat(dashboard): add fade-in, hover-lift cards, stagger recent results`
- `feat(schedule): apply motion utilities to game list and cards`
- `feat(roster): apply motion utilities to player/coach cards`
- `feat(stats): apply motion utilities to stat cards and trend list`

---

## 7 — Accessibility & Performance

### Accessibility
- Verify navy-on-white and white-on-navy meet WCAG AA (4.5:1 ratio). Gold on navy is **accent only** — never used for body text.
- Add `aria-label` to icon-only buttons that don't already have one.
- Focus outlines: gold ring (`ring-gold/60`) for keyboard navigation (already partially done via `--ring: gold`).
- Footer links and nav links get visible `:focus-visible` styling.

### Performance
- Add `loading="lazy"` to carousel images in `Home.tsx`.
- `will-change` only during active animations.
- Font is already preconnected (`index.html` lines 7-9) ✓.
- **Flag for later:** compress the 5 hero images (currently 7–24 MB each — should be ≤500 KB).

### Commit
`perf(a11y): lazy-load images, verify contrast, add focus outlines`

---

## 8 — Cleanup

- **Delete contents of `src/App.css`** (Vite boilerplate, unused).
- Final `npm run build` + `npm run lint` pass.
- Fix any lint errors introduced by new code.

### Commit
`chore: remove Vite boilerplate CSS, lint/build pass`

---

## 9 — Git Strategy

### Branch
```
ui/overhaul-smooth-fades
```

### Commit sequence (in order)
1. `chore(ui): add design tokens — transitions, elevation, motion variables`
2. `feat(ui): add global motion utilities — fade-in, stagger, hover-lift, reduced-motion`
3. `refactor(layout): polish sticky nav with gold accent and smooth transitions`
4. `feat(layout): add Footer component — navy bg, gold accents, semantic HTML`
5. `feat(layout): add PageTransition wrapper for route-level fade-in`
6. `feat(home): apply fade-slide-up entrance and hover-lift to hero CTA`
7. `feat(get-started): stagger sport cards on mount, animate level picker`
8. `feat(dashboard): add fade-in, hover-lift cards, stagger recent results`
9. `feat(schedule): apply motion utilities to game list and cards`
10. `feat(roster): apply motion utilities to player/coach cards`
11. `feat(stats): apply motion utilities to stat cards and trend list`
12. `perf(a11y): lazy-load images, verify contrast, add focus outlines`
13. `chore: remove Vite boilerplate CSS, lint/build pass`

---

## 10 — QA Checklist

- [ ] **Desktop (1440px+):** Layout is centered, cards have hover-lift, nav dropdowns work.
- [ ] **Tablet (768px):** Grid collapses gracefully, mobile menu hamburger appears.
- [ ] **Mobile (375px):** Full-width cards, readable text, no horizontal overflow.
- [ ] **Reduced motion:** Open `chrome://flags` or System Settings → turn on "reduce motion" → confirm no animations play.
- [ ] **Keyboard nav:** Tab through the entire site. Every interactive element has a visible focus ring.
- [ ] **Color contrast:** Use browser DevTools or axe to verify AA compliance for all text.
- [ ] **Page transitions:** Navigate between pages — content should fade in smoothly on each route.
- [ ] **Stagger lists:** GetStarted sport grid, schedule game list, roster cards should stagger on mount.
- [ ] **Footer:** Visible on all pages except Home. Links work. Proper semantic `<footer>`.
- [ ] **Build:** `npm run build` completes with zero errors.
- [ ] **Lint:** `npm run lint` — no new errors introduced (existing pre-existing warnings are OK).

---

## Assumptions & Fallback Choices

| Decision | Rationale |
|---|---|
| **Keep Lora font** | Already embedded via Google Fonts and configured in Tailwind. It gives Webb a distinctive, slightly editorial feel that suits a school athletics brand. |
| **Dark-mode first** | The `<html>` tag has `class="dark"` by default. All new styles target dark mode; light mode polish is a separate task. |
| **No new dependencies** | `tailwindcss-animate` is already installed and provides keyframe utilities. No need for Framer Motion or other animation libs — CSS is sufficient for these subtle transitions. |
| **Images not compressed** | The 5 hero JPGs are 7–24 MB each. Compressing them would dramatically improve load time but is flagged as a separate task to avoid scope creep. |
| **Gold on navy for accents only** | `hsl(45, 92%, 52%)` on `hsl(215, 72%, 15%)` passes AA for large text but not small text. Gold is used for borders, icons, badges — never as small body text color. |

---

## Preview Instructions

```bash
cd team-schedule-hub
npm install
npm run dev
# Open http://localhost:5173 (or the port Vite assigns)
# Navigate between pages to see fade-in transitions
# Hover over cards to see lift effect
# Toggle "prefers-reduced-motion" in OS settings to verify fallback
```


