# Device Config Portal

A web-based device management portal for fleet operators. It lets you browse
and bulk-manage a large device fleet, configure firmware policies, schedule
over-the-air (OTA) updates, and watch device status change in real time across
multiple locations.

Built with **React 18**, **TypeScript**, **TanStack Query (React Query)** and a
**GraphQL** API. A mock GraphQL server (graphql-yoga) with an in-memory fleet
simulator is included so the whole thing runs locally with one command.

## Features

- **Device list** – virtualized grid (`@tanstack/react-virtual`) over 1,200
  seeded devices; only visible rows are mounted. Search and filter by status
  or location, select rows (or all filtered rows) and apply **bulk actions**:
  reboot or edit settings (telemetry interval, log level, auto-update).
- **Firmware policies** – create, edit and delete policies per device model:
  target version and release channel, maintenance window, max concurrent
  rollout %, locations and auto-approve.
- **OTA updates** – schedule a rollout now or later, preview how many devices it
  will target, then pause / resume / cancel it while a progress bar tracks it.
- **GraphQL + React Query** – every query and mutation goes through React
  Query. Mutations update the cache **optimistically** (snapshot → apply →
  roll back on error → reconcile with the server response).
- **Real-time status** – a GraphQL **subscription** (`deviceStatusChanged`,
  over Server-Sent Events) streams status batches straight into the React
  Query cache, so the device grid and header counters update live. Active OTA
  rollouts are additionally **polled** for progress.
- **Accessible, responsive design system** – labelled form fields with
  `aria-describedby` hints/errors and `aria-invalid`, focus moved to the first
  invalid field on submit, modal dialogs with focus trap / Escape / focus
  restore, `role="switch"` toggles, a shared polite live region for action
  results, a skip link, and visible focus rings. Layouts collapse to stacked
  forms and card-style tables on small screens.

### Keyboard support in the device grid

| Key | Action |
| --- | --- |
| `↑` / `↓` | Move between rows |
| `PageUp` / `PageDown` | Move a page at a time |
| `Home` / `End` | First / last row |
| `Space` | Toggle selection of the focused row |
| `Enter` | Open the device's settings dialog |

## Architecture

```
┌──────────────────────────── Browser (Vite, :5173) ────────────────────────────┐
│                                                                               │
│  pages/ (Devices, Firmware policies, OTA updates)                             │
│      │  uses                                                                  │
│      ▼                                                                        │
│  hooks/ ── useQuery / useOptimisticListMutation ──► React Query cache         │
│      │                                                 ▲                      │
│      │ gqlRequest (POST)              gqlSubscribe (SSE) │ setQueryData        │
│      ▼                                                 │                      │
│  api/client.ts ────────────────────────────────────────┘                      │
│                                                                               │
│  components/ui/ – Button, Field, Select, Checkbox(Group), Switch, Dialog,     │
│                   StatusBadge, ProgressBar, Announcer (live region)           │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │ /graphql (proxied by Vite)
┌───────────────────────────────▼──────────── Node (:4000) ─────────────────────┐
│  graphql-yoga: schema.ts + resolvers.ts  ◄──  data.ts (in-memory fleet)       │
│                      ▲ pubsub 'device:status'                                 │
│  simulator.ts ───────┘ every 2s: connectivity churn, reboots, OTA batches     │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Project layout

```
server/               mock GraphQL API
  data.ts             seed data (1,200 devices, 6 locations, releases, policies)
  schema.ts           GraphQL type definitions
  resolvers.ts        queries, mutations, subscription
  simulator.ts        fleet activity + OTA rollout progression
src/
  api/                GraphQL client, documents, types, query keys
  hooks/              React Query hooks (devices, firmware, OTA, optimistic helper)
  components/ui/      accessible design system components (CSS Modules)
  components/layout/  app shell, nav, live fleet status summary
  pages/devices/      virtualized device grid, bulk actions, settings dialog
  pages/firmware/     firmware policy list + form dialog
  pages/ota/          rollout scheduling form + progress table
```

## Running locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

This starts the mock GraphQL API on <http://localhost:4000/graphql> and the
web app on <http://localhost:5173>. Vite proxies `/graphql` to the API.

Other scripts:

```bash
npm run typecheck   # type-check client and server
npm run build       # type-check and build the client into dist/
```

Data lives in memory, so restarting the API resets the fleet.
