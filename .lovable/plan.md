# SAGE — Smart AI for Green Energy (Frontend)

Frontend-only build of the SAGE campus energy intelligence platform, piloted on Varendra University. All data comes from an in-browser simulator (no backend, no Firebase, no Gemini calls) so the dashboard feels alive during a demo.

## Look and feel

Enterprise energy-ops console: dark slate surfaces, green/teal energy accents, amber for waste and red for critical alerts. Compact data-dense cards, tabular readouts, sparklines and charts. Sidebar navigation with a fixed top bar showing live campus load, efficiency score and alert count.

## Pages (each its own route with unique SEO metadata)

- `/` Dashboard — campus KPIs, live load chart, top wasteful rooms, active alerts feed
- `/buildings` — building cards with load, efficiency, occupancy; drill-in detail
- `/classrooms` — room table with occupancy, lights, fans, live watts, waste flag
- `/devices` — device inventory with status (online/offline/failing)
- `/analytics` — daily/weekly/monthly usage, peak vs idle, waste %, cost breakdown
- `/ai-insights` — AI Energy Guardian chat with canned/templated answers over the live simulated context, plus recommendation cards (priority, reason, estimated savings, CO2 impact, confidence, action)
- `/predictions` — next hour / today / tomorrow / weekly / monthly / annual forecasts with confidence bands
- `/alerts` — alert list with severity filters and "Explain with AI" panel
- `/reports` — daily/weekly/monthly report generator with printable/exportable layout
- `/executive` — management view: KPIs, cost analysis, building comparison, sustainability score, annual savings projection
- `/settings` — simulation speed, tariff rate, thresholds, campus profile (client-side state only)

## Simulation layer

A single client-side engine (React context + interval tick) models 4 buildings, ~24 classrooms and their devices. Each tick updates occupancy, light/fan state, watts, temperature; it also injects scripted scenarios: empty room with lights on, power spike, device failure, unexpected occupancy. Derived selectors compute current/daily/weekly/monthly usage, peak, idle, waste %, efficiency score, cost and CO2. Alerts are generated from rule checks each tick.

Charts use Recharts. Numbers are deterministic-ish (seeded) so the demo reads consistently.

## AI behaviour without a backend

The Energy Guardian answers from a local template engine that reads the same summarized context object the real backend would send (campus summary, worst rooms, alerts). Suggested prompts are provided. A note in the UI marks it as demo intelligence; wiring real Gemini later is a drop-in swap of one function.

## Technical notes

- TanStack Start routes under `src/routes`, one file per page, shared app shell (sidebar + topbar) rendered in a layout route.
- Design tokens added to `src/styles.css`; no hardcoded color utilities in components.
- Shared types in `src/lib/sage/types.ts`, engine in `src/lib/sage/simulator.ts`, derived metrics in `src/lib/sage/analytics.ts`, AI templates in `src/lib/sage/guardian.ts`.
- Report export via `window.print()` with a print stylesheet plus CSV download of tabular data.
- No Lovable Cloud needed; everything runs in the browser.
