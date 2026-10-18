// Placeholder copy. Replace projects, roles, links and the email with real details before publishing.

export const profile = {
  name: "Sayef Khan",
  role: "Software Engineer",
  email: "sayxfkhan@gmail.com",
  status: "Open to full-time roles and selected contracts",
  links: [
    { label: "GitHub", href: "https://github.com/fwqncy" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/sayxfk/" },
    // Served from public/; replace that file to update the CV.
    { label: "Download CV", href: "/Sayef-Khan-CV.pdf" },
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
  // Placeholder photo for the case study. Swap for your own, e.g. "/projects/relay/poster.jpg" in public/.
  image: string;
  // Optional screen recording, used for the homepage preview and the top of the case study.
  video?: { src: string; poster: string };
  repo?: string;
};

export const projects: Project[] = [
  {
    id: "arachne",
    title: "Arachne",
    kind: "AI knowledge assistant",
    year: "2023",
    summary:
      "An internal assistant that answers staff questions from company documents, cites the exact page behind every claim, and draws what you've learned as a web.",
    outcome:
      "Runs on a seeded set of 9 sample company documents (41 passages). Below a 0.55 similarity score it says it couldn't find an answer instead of guessing.",
    stack: ["Python", "FastAPI", "pgvector", "Claude API", "Three.js", "GSAP"],
    image: "/projects/arachne/poster.jpg",
    video: { src: "/projects/arachne/preview.mp4", poster: "/projects/arachne/poster.jpg" },
    repo: "https://github.com/fwqncy/Arachne",
  },
  {
    id: "ledgerline",
    title: "Ledgerline",
    kind: "Modular payments console",
    year: "2024",
    summary:
      "A payments console set like a newspaper. Payouts, Risk, Support and the Ledger are separate modules, so each team ships on its own schedule without redeploying the whole console.",
    outcome:
      "Each module has its own API endpoint, query cache and error boundary: mount just one with LEDGERLINE_MODULES=payouts, and a module that crashes leaves the rest working.",
    stack: ["Next.js", "TypeScript", "tRPC", "GSAP", "Three.js"],
    image: "/projects/ledgerline/poster.jpg",
    video: { src: "/projects/ledgerline/preview.mp4", poster: "/projects/ledgerline/poster.jpg" },
    repo: "https://github.com/fwqncy/Ledgerline",
  },
  {
    id: "rostra",
    title: "Rostra",
    kind: "Staff rostering and shift-swap app",
    year: "2024",
    summary:
      "A rostering app for multi-site restaurants. Staff swap shifts from their phone, managers approve in one tap with labour cost shown live, and a cherry blossom tree grows the more you use it.",
    outcome: "Built to cut weekly rostering from ~3 hours to under 1, based on how I rostered at restaurants.",
    stack: ["C#", "ASP.NET Core", "Entity Framework", "SQL Server", "Azure", "Three.js"],
    image: "/projects/rostra/poster.jpg",
    video: { src: "/projects/rostra/preview.mp4", poster: "/projects/rostra/poster.jpg" },
    repo: "https://github.com/fwqncy/Rostra",
  },
  {
    id: "relay",
    title: "Relay",
    kind: "Concurrent job runtime",
    year: "2025",
    summary:
      "A work-stealing job scheduler for a logistics platform, replacing a single-queue worker pool that stalled under burst traffic. It ships with a full logistics workspace and a 3D map whose fleet grows from horse carts to container ships as you deliver.",
    outcome:
      "Load-tested with a 12,000-job burst on a laptop: p95 queue latency fell from 1.36 s to 693 ms versus the single-queue baseline, and throughput nearly doubled to about 15,500 jobs/s.",
    stack: ["Go", "Postgres", "Redis Streams", "React", "Three.js", "GSAP"],
    image: "/projects/relay/poster.jpg",
    video: { src: "/projects/relay/preview.mp4", poster: "/projects/relay/poster.jpg" },
    repo: "https://github.com/fwqncy/Relay",
  },
  {
    id: "fieldnote",
    title: "Fieldnote",
    kind: "Offline-first sync engine",
    year: "2026",
    summary:
      "An offline-first notes app and CRDT sync engine for people working without signal for days. Notes live on the device, and edits made on more than one device merge on reconnect without conflicts.",
    outcome: "Designed so notes edited offline on more than one device merge cleanly on reconnect, without losing changes.",
    stack: ["Rust", "SQLite", "React Native", "TypeScript", "Three.js", "GSAP"],
    image: "/projects/fieldnote/poster.jpg",
    video: { src: "/projects/fieldnote/preview.mp4", poster: "/projects/fieldnote/poster.jpg" },
    repo: "https://github.com/fwqncy/Fieldnote",
  },
  {
    id: "trawler",
    title: "Trawler",
    kind: "Stock and supplier ordering REST API",
    year: "2026",
    summary:
      "A Spring Boot REST API that tracks stock against par levels across stores and drafts supplier orders automatically, with a web client where every stock line is a fish in a whirlpool.",
    outcome: "Built to flag stock below par and raise supplier orders automatically, based on how I ran stock-takes at restaurants.",
    stack: ["Java", "Spring Boot", "PostgreSQL", "JPA", "Testcontainers", "Three.js"],
    image: "/projects/trawler/poster.jpg",
    video: { src: "/projects/trawler/preview.mp4", poster: "/projects/trawler/poster.jpg" },
    repo: "https://github.com/fwqncy/Trawler",
  },
];
