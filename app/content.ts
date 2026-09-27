// Placeholder copy. Replace projects, roles, links and the email with real details before publishing.

export const profile = {
  name: "Sayef",
  role: "Software engineer",
  email: "sayef@example.com",
  status: "Open to full-time roles and select contracts",
  links: [
    { label: "GitHub", href: "https://github.com/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
    // Set to your PDF path (for example "/resume.pdf") to show this link.
    { label: "Résumé (PDF)", href: "#" },
  ],
};

export type Project = {
  id: string;
  title: string;
  kind: string;
  year: string;
  summary: string;
  outcome: string;
  stack: string[];
  image: string;
};

export const projects: Project[] = [
  {
    id: "relay",
    title: "Relay",
    kind: "Concurrent job runtime",
    year: "2025",
    summary:
      "A work-stealing scheduler for a logistics platform, replacing a single-queue worker pool that stalled under burst traffic.",
    outcome: "p95 queue latency went from 1.8 s to 240 ms at the same hardware cost.",
    stack: ["Go", "Postgres", "Redis Streams"],
    image: "https://picsum.photos/seed/sayef-relay-runtime/1400/1000?grayscale",
  },
  {
    id: "ledgerline",
    title: "Ledgerline",
    kind: "Modular payments console",
    year: "2024",
    summary:
      "An operator console split into independently deployable modules, so the risk, payouts and support teams ship on their own schedule.",
    outcome: "Release cadence moved from fortnightly to 11 deploys a week.",
    stack: ["Next.js", "TypeScript", "tRPC"],
    image: "https://picsum.photos/seed/sayef-ledgerline-console/1400/1000?grayscale",
  },
  {
    id: "fieldnote",
    title: "Fieldnote",
    kind: "Offline-first sync engine",
    year: "2023",
    summary:
      "CRDT-based note sync for field researchers working without signal for days at a time, with conflict-free merges on reconnect.",
    outcome: "Zero data-loss reports across 14 months in production.",
    stack: ["Rust", "SQLite", "React Native"],
    image: "https://picsum.photos/seed/sayef-fieldnote-sync/1400/1000?grayscale",
  },
];

export const threads = [
  { id: "01", name: "Discover", note: "Read the code, the tickets, the incidents", start: 1, end: 3 },
  { id: "02", name: "Design", note: "Interfaces and failure modes first", start: 2, end: 5 },
  { id: "03", name: "Build", note: "Small modules behind stable contracts", start: 3, end: 8 },
  { id: "04", name: "Verify", note: "Load tests and property tests alongside", start: 4, end: 9 },
  { id: "05", name: "Ship", note: "Flags, staged rollout, written handover", start: 7, end: 9 },
];

export const experience = [
  { years: "2024 to now", role: "Senior software engineer", org: "Series B logistics company", place: "Remote" },
  { years: "2022 to 2024", role: "Software engineer, platform", org: "Fintech product studio", place: "London" },
  { years: "2020 to 2022", role: "Full-stack engineer", org: "Freelance and contract", place: "Remote" },
  { years: "2019", role: "Engineering intern", org: "Research software group", place: "On site" },
];

// Add an href to a note to turn its title into a link.
export const notes: { title: string; kind: string; read: string; image: string; href?: string }[] = [
  {
    title: "Backpressure is a product decision",
    kind: "Essay",
    read: "9 min",
    image: "https://picsum.photos/seed/sayef-note-backpressure/900/1100?grayscale",
  },
  {
    title: "Design modules you can delete",
    kind: "Essay",
    read: "7 min",
    image: "https://picsum.photos/seed/sayef-note-delete/900/1100?grayscale",
  },
  {
    title: "Structured concurrency, in plain terms",
    kind: "Guide",
    read: "12 min",
    image: "https://picsum.photos/seed/sayef-note-concurrency/900/1100?grayscale",
  },
  {
    title: "tiny-pool: a 2 kB worker pool for the browser",
    kind: "Open source",
    read: "Repo",
    image: "https://picsum.photos/seed/sayef-note-tinypool/900/1100?grayscale",
  },
  {
    title: "What I check first in a legacy codebase",
    kind: "Notes",
    read: "5 min",
    image: "https://picsum.photos/seed/sayef-note-legacy/900/1100?grayscale",
  },
];
