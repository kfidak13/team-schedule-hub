

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

