

## Add Back Button to Connect Dashboard

A simple addition: a back arrow/link at the top of the Connect Dashboard that returns the user to the Settings/Controls view.

### What will change

**File: `src/pages/ConnectDashboard.tsx`**

- Add an `ArrowLeft` icon import from `lucide-react` (already installed)
- Insert a back link just above the existing header, using `react-router-dom`'s `Link` (already imported)
- The link navigates to `/` (the index route where Settings/Controls lives) 
- Styled to match the page's ethereal aesthetic: lowercase, `font-thought`, muted text, wide tracking, with a subtle hover transition
- Wrapped in a `motion.div` for a smooth entrance animation consistent with the rest of the page

### Visual placement

```text
+----------------------------------+
|  <- back to controls             |   <-- new back link
|                                  |
|  CONNECT                         |
|  manage accounts, products...    |
|                                  |
|  [glass cards...]                |
+----------------------------------+
```

### Technical details

- Import `ArrowLeft` from `lucide-react`
- Add a `<Link to="/">` wrapped in a `<motion.div>` placed before the existing `<motion.header>` block (around line 302)
- Use classes: `flex items-center gap-2 text-xs font-thought text-muted-foreground/40 tracking-wider hover:text-muted-foreground/60 transition-all duration-500 italic mb-4`
- The `ArrowLeft` icon sized at `w-3 h-3` to stay subtle
- Animation: `initial={{ opacity: 0, x: -8 }}` / `animate={{ opacity: 1, x: 0 }}` with the same `smoothEase` timing

No other files need changes. No new dependencies required.

