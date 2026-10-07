# mono-date — fully theme the flatpickr calendar (mono + Material)

## Context
The `mono-date` field already matched mono-input, but the flatpickr calendar popup still showed
flatpickr's defaults (blue selection, grey arrows/hover, square cells, default time inputs). Made
the calendar match the library: **mono by default, Material in the material flavor**, overriding
flatpickr's base entirely. Only flatpickr's **base** stylesheet is imported — no flatpickr theme
(no dark) is ever used.

## Changes

### `src/components/date/mono-date.ts`
Added `onReady` to `_buildConfig()`:
- tags the calendar `instance.calendarContainer.classList.add('mono-flatpickr')` so every override
  is scoped to our pickers only.
- copies the host's resolved accent onto the calendar (it lives in `<body>`, can't inherit):
  `getComputedStyle(this)` → `--date-primary`/`--date-primary-rgb` → set `--cal-accent` /
  `--cal-accent-rgb` on the calendar, so it follows the `color` prop.

### `src/components/date/date.css`
Replaced the partial calendar section with a comprehensive override, all scoped to
`.flatpickr-calendar.mono-flatpickr` and keyed off `--cal-accent` (theme fallback): shell + pointer
arrow, months/nav arrows (rounded accent hover), month dropdown + year/number steppers (incl. the
`arrowUp/arrowDown::after` triangles), weekdays, days (hover/focus/today/selected/range/inRange/
prev-next-month/disabled), week numbers, and the time inputs/separator/am-pm (accent hover replacing
flatpickr's grey). Day cells use `--theme-radius-sm` in mono.

### `src/data/theme/index.css`
Expanded `.theme-flavor-material .flatpickr-calendar.mono-flatpickr`: 4px Paper radius +
`--theme-elev-3`, **circular day cells** (`border-radius: 50%`) for the MUI date-picker look, with
`inRange` squared so the range band stays continuous between the circular endpoints.

## Verification
- `npm run build` (package) — passes; `grep flatpickr-calendar.mono-flatpickr dist/ui/index.css` > 0;
  no `flatpickr/dist/themes/*` import anywhere.
- `demo/vitepress` build clean.
- Dev `/ui/date`: every calendar part uses mono tokens (no flatpickr blue/grey); a non-primary
  `color` tints the calendar; material flavor → 4px + elevation + circular primary/today days. No
  flatpickr dark/theme styles appear.
