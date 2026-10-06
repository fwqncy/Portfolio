// Placeholder copy. Replace projects, roles, links and the email with real details before publishing.

export const profile = {
  name: "Sayef Khan",
  role: "Software Engineer",
  email: "sayxfkhan@gmail.com",
  status: "Open to full-time roles and select contracts",
  links: [
    { label: "GitHub", href: "https://github.com/fwqncy" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/sayxfk/" },
    // Served from public/; replace that file to update the CV.
    { label: "Download CV", href: "/Sayef_Khan_CV_2026.pdf" },
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
    id: "beacon",
    title: "Beacon",
    kind: "AI knowledge assistant",
    year: "2023",
    summary:
      "An internal assistant that answers staff questions from 40,000 company documents and shows the exact page each answer came from.",
    outcome: "Tested against a seeded dataset of sample company documents, with every answer linking back to its source page.",
    stack: ["Python", "FastAPI", "pgvector", "Claude API"],
  },
  {
    id: "ledgerline",
    title: "Ledgerline",
    kind: "Modular payments console",
    year: "2024",
    summary:
      "An operator console split into independently deployable modules, so the risk, payouts and support teams ship on their own schedule.",
    outcome: "Designed so the risk, payouts and support modules can each be deployed on their own, without redeploying the whole console.",
    stack: ["Next.js", "TypeScript", "tRPC"],
  },
  {
    id: "rostra",
    title: "Rostra",
    kind: "Staff rostering and shift-swap app",
    year: "2024",
    summary:
      "A rostering tool for multi-site restaurants that lets staff swap shifts from their phone, with managers approving in one tap and labour cost shown live.",
    outcome: "Built to cut weekly rostering from ~3 hours to under 1, based on how I rostered at restaurants.",
    stack: ["C#", "ASP.NET Core", "Entity Framework", "SQL Server", "Azure"],
  },
  {
    id: "relay",
    title: "Relay",
    kind: "Concurrent job runtime",
    year: "2025",
    summary:
      "A work-stealing scheduler for a logistics platform, replacing a single-queue worker pool that stalled under burst traffic.",
    outcome: "Load-tested at 12k jobs/sec locally. p95 latency dropped from 1.8 s to 240 ms versus a single-queue baseline.",
    stack: ["Go", "Postgres", "Redis Streams"],
  },
  {
    id: "fieldnote",
    title: "Fieldnote",
    kind: "Offline-first sync engine",
    year: "2026",
    summary:
      "CRDT-based note sync for field researchers working without signal for days at a time, with conflict-free merges on reconnect.",
    outcome: "Designed so notes edited offline on more than one device merge cleanly on reconnect, without losing changes.",
    stack: ["Rust", "SQLite", "React Native"],
  },
  {
    id: "pantry",
    title: "Pantry",
    kind: "Stock and supplier ordering REST API",
    year: "2026",
    summary:
      "A Spring Boot REST API that tracks stock against par levels across stores and raises supplier orders automatically, backed by PostgreSQL and a full integration test suite.",
    outcome: "Built to flag stock below par and raise supplier orders automatically, based on how I ran stock-takes at restaurants.",
    stack: ["Java", "Spring Boot", "PostgreSQL", "JPA", "JUnit", "Testcontainers"],
  },
];
