import Background from "./components/Background";
import HeroVisual from "./components/HeroVisual";
import CopyEmail from "./components/CopyEmail";
import ProjectShowcase from "./components/ProjectShowcase";
import Services from "./components/Services";
import { profile, projects } from "./content";

// Link icons (24x24); brand marks from Simple Icons.
const ICONS: Record<string, string> = {
  GitHub:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  LinkedIn:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 4.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  "Download CV": "M12 2a1 1 0 0 1 1 1v10.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V3a1 1 0 0 1 1-1zM4 19a1 1 0 0 1 1 1h14a1 1 0 1 1 2 0 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 1 1 0 0 1 1-1z",
};

export default function Page() {
  return (
    <>
      <Background />
      <a href="#main" className="skip">
        Skip to content
      </a>

      <header className="nav wrap">
        <nav aria-label="Sections">
          <ul className="nav-links">
            <li><a href="#work">Projects</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <main id="main">
        {/* 01 Hero: asymmetric split */}
        <section id="top" className="hero wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title" className="hero-name">
              <span className="hero-name-a" data-text="Sayef">Sayef</span>{" "}
              <span className="hero-name-b" data-text="Khan">Khan</span>
            </h1>
            <p className="hero-role">{profile.role}</p>
            <p className="hero-subheads mono">
              <span>Specialising in multithreaded systems</span>
              <svg className="hero-subheads-star" viewBox="-10 -10 20 20" aria-hidden="true">
                <path d="M0,-10 Q1.2,-1.2 10,0 Q1.2,1.2 0,10 Q-1.2,1.2 -10,0 Q-1.2,-1.2 0,-10Z" />
              </svg>
              <span>Modular code</span>
            </p>
            <div className="hero-cta">
              <a href="#work" className="btn btn-solid">Projects</a>
              <a href="#contact" className="btn btn-ghost">Get in touch</a>
            </div>
          </div>
          <HeroVisual />
        </section>

        {/* 02 Statement: offset editorial text */}
        <section className="statement wrap reveal" aria-labelledby="about-title">
          <h2 id="about-title" className="label mono">About</h2>
          <div className="statement-body">
            <p className="hello">Hello,</p>
            <p className="lede">
              I’m Sayef, an engineer who builds software that stays fast & modular as the team grows. I enjoy the behind-the-scenes details that keep everything running smoothly:
              queue semantics, module boundaries, the migration plan nobody wrote down.
            </p>
            <p className="statement-aside">
              Across backend platforms, product frontends and the seams between them. I leave behind code
              that the next person can change without asking me first.
              A Computer Science graduate who spent six years managing restaurants
              and now builds software for the problems he actually lived.
            </p>
          </div>
        </section>

        {/* 03 Work: zig-zag media rows */}
        <section id="work" className="work wrap" aria-labelledby="work-title">
          <div className="section-head">
            <h2 id="work-title" className="label mono">Past projects</h2>
            <p className="section-count mono">{String(projects.length).padStart(2, "0")} projects</p>
          </div>
          <ol className="work-list">
            {projects.map((p, i) => (
              <li key={p.id} className="work-row reveal" data-flip={i % 2 === 1}>
                <ProjectShowcase id={p.id} title={p.title} />
                <div className="work-text">
                  <p className="mono meta">
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <span>{p.year}</span>
                  </p>
                  <h3>{p.title}</h3>
                  <p className="work-kind">{p.kind}</p>
                  <p>{p.summary}</p>
                  <p className="work-outcome">{p.outcome}</p>
                  <ul className="tags mono" aria-label="Stack">
                    {p.stack.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 04 Services: curved card slider */}
        <section id="services" className="services" aria-labelledby="services-title">
          <div className="section-head wrap">
            <h2 id="services-title" className="label mono">Services</h2>
            <p className="section-count mono">Drag or scroll sideways</p>
          </div>
          <p className="services-title wrap">What I bring to a team</p>
          <Services />
        </section>

        {/* 09 Contact: oversized type */}
        <section id="contact" className="contact wrap" aria-labelledby="contact-title">
          <h2 id="contact-title" className="label mono">Contact</h2>
          <p className="contact-big">
            Got a project in mind? <span className="dim">Let’s talk it through.</span>
          </p>
          <div className="contact-row">
            <a className="contact-mail" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <CopyEmail email={profile.email} />
          </div>
          <p className="eyebrow contact-status mono">
            <span className="dot" aria-hidden="true" />
            {profile.status}
          </p>
          <ul className="contact-links mono">
            {profile.links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className={l.label === "Download CV" ? "btn-ghost contact-outline" : "link"}
                  download={l.href.endsWith(".pdf") || undefined}
                >
                  {ICONS[l.label] && (
                    <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={ICONS[l.label]} />
                    </svg>
                  )}
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="foot wrap mono">
        <span translate="no">Sayef</span>
        <span>Built with Next.js and a little GLSL</span>
        <a href="#top" className="link">Back to top</a>
      </footer>
    </>
  );
}
