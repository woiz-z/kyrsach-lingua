# LinguaAI — WOW Full-Site Redesign Spec
Date: 2026-05-02

## Goal
Apply unique "hero moment" WOW design to every page of LinguaAI. The aurora background and Layout.tsx effects already apply globally. Each page gets its own distinct visual identity while sharing the same design system (glass-premium, spin-border, gradient text, particles, glow).

## Design System (already in index.css)
- `glass-spin-border` — card with animated conic-gradient spinning border via CSS @property
- `glass-premium` — glass with gradient border via mask trick
- `bento-grid` + `.bento-*` — explicit grid placement classes
- `particle-dot` — floating particle animation via --dur/--delay CSS vars
- `gradient-text-animated` — 5s indigo→purple→pink text cycle
- `xp-bar-fill` — XP bar with gradient + glow
- `btn-shine` — light sweep on hover
- Aurora in Layout.tsx dark mode (mix-blend-mode: screen)

## Pages — Unique Treatment

### 1. Login / Register
**Layout:** Split-screen (50/50). Left: dark hero panel with ParticleField, logo, tagline. Right: centered glass form card with `glass-spin-border`.
**Key elements:** Remove plain centered card → full viewport split. Left panel has animated gradient blobs. Password strength bar stays, gains color glow.

### 2. Dashboard
**Layout:** Cockpit. Top greeting with avatar. 4 stat cards → glass-premium with unique color per stat (XP=indigo, streak=amber, lessons=emerald, accuracy=pink). Main bento area: large AI plan card with spin border + XP progress + today's languages. Side column: mission cards.
**Key elements:** Stat cards get `card-accent-top` + icon glow. Quick actions as neon-bordered buttons.

### 3. Languages
**Layout:** Grid of language gem-cards. Each card: flag emoji, language name, level badge, glow orb below.
**Key elements:** Selected language card gets `glass-spin-border`. Unselected cards get subtle hover glow. Course generator section gets glass-premium card with gradient header.

### 4. AI Chat
**Layout:** Two-column: slim icon sidebar (icons only, no text), main chat area.
**Key elements:** Message bubbles → glass morphic (AI: indigo tint, user: gradient). Sidebar icons with glow on active. Header gets gradient-text-animated model name. Input gets glass-strong with spin border on focus.

### 5. Progress
**Layout:** Full data-viz dashboard. Stats row → big glowing numbers with gradient labels. Bar chart section → animated gradient bars with hover tooltip dots. Leaderboard → podium gold/silver/bronze rank badges with glow.
**Key elements:** Chart bars animate on mount (height from 0). Top 3 leaderboard rows get special glow.

### 6. Achievements
**Layout:** Two sections: earned (normal opacity) and locked (fog/blur overlay).
**Key elements:** Earned cards → amber glow bottom + checkmark. Locked cards → `filter: blur(1px) grayscale(70%)` + lock icon overlay. Trophy count header with gold gradient text.

### 7. Vocabulary
**Layout:** Review mode: large centered flashcard that 3D-flips on "Show translation". List mode: word rows with flag badges.
**Key elements:** Flashcard → `glass-spin-border` + word in `gradient-text-animated` + pronunciation button with sound-wave bars. Quality rating buttons (1-5) colored red→green with hover glow.

### 8. Profile
**Layout:** Luxury card. Gradient hero header (indigo→pink), large avatar with pulsing aurora ring, level badge. Stats row. Fields as glass rows with icons.
**Key elements:** Avatar ring = CSS `box-shadow` + animated `aurora-1`. Edit mode animates field borders to spin-border style.

### 9. My Courses
**Layout:** Summary stats row. Filter chips (level badges). Course cards with color-coded gradient header per language.
**Key elements:** Card header background = language-specific gradient (EN=indigo, DE=amber, FR=pink, JP=red, etc.). Progress bar = `xp-bar-fill`. Hover → card lifts + reveal delete button.

### 10. Lesson
**Layout:** Fullscreen immersive. Top: gradient glow progress bar (with current/total). Center: question card with `glass-spin-border`. Answer options grid.
**Key elements:** Progress bar uses `xp-bar-fill`. Correct answer → green glow + checkmark. Wrong → red shake animation. Card has ambient glow top-right.

### 11. Course (course detail page)
**Layout:** Course hero header with language flag + gradient. Chapter/lesson list as timeline with progress dots.
**Key elements:** Completed lessons → green gradient dot. Current → spinning border dot. Future → dim.

## Files to touch
- `src/pages/LoginPage.tsx`
- `src/pages/RegisterPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/LanguagesPage.tsx`
- `src/pages/ChatPage.tsx`
- `src/pages/ProgressPage.tsx`
- `src/pages/AchievementsPage.tsx`
- `src/pages/VocabularyPage.tsx`
- `src/pages/ProfilePage.tsx`
- `src/pages/MyCoursesPage.tsx`
- `src/pages/LessonPage.tsx`
- `src/pages/CoursePage.tsx`
- `src/index.css` — add shake animation, 3D flip, aurora-ring, fog/blur classes

## Constraints
- Do NOT break any API calls, form submissions, state logic, routing
- Keep all existing TypeScript types and store imports
- Only change JSX structure and CSS classes — logic stays identical
- Mobile responsive — all new layouts must work on small screens
