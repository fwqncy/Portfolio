// Placeholder copy. Replace projects, roles, links and the email with real details before publishing.

export const profile = {
  name: "Sayef Khan",
  role: "Software Engineer",
  email: "sayefk21@gmail.com",
  status: "Open to full-time roles and select contracts",
  links: [
    { label: "GitHub", href: "https://github.com/fwqncy" },
    { label: "LinkedIn", href: "hhttps://www.linkedin.com/sayxfk/" },
    // Placeholder: put your CV in /public (for example public/cv.pdf) and set href to "/cv.pdf".
    { label: "Download CV", href: "#" },
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
  },
];
