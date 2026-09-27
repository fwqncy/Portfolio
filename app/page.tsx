import Image from "next/image";
import Background from "./components/Background";
import HeroVisual from "./components/HeroVisual";
import CopyEmail from "./components/CopyEmail";
import { experience, notes, profile, projects, threads } from "./content";

const WEEKS = 8;

export default function Page() {
  return (
    <>
      <Background />
      <a href="#main" className="skip">
        Skip to content
      </a>

      <header className="nav wrap">
        <a href="#top" className="nav-name" translate="no">
          Sayef
        </a>
        <nav aria-label="Sections">
          <ul className="nav-links">
            <li><a href="#work">Work</a></li>
            <li><a href="#process">Process</a></li>
            <li><a href="#experience">Experience</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <main id="main">
        {/* 01 Hero: asymmetric split */}
        <section id="top" className="hero wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow mono">
              <span className="dot" aria-hidden="true" />
              {profile.status}
            </p>
            <h1 id="hero-title">
              Multithreaded systems.
              <br />
              <span className="dim">Modular code.</span>
            </h1>
            <p className="hero-sub">
              I design and build concurrent backends and composable frontends for teams that need software to keep
              scaling after launch.
            </p>
            <div className="hero-cta">
              <a href="#work" className="btn btn-solid">See selected work</a>
              <a href="#contact" className="btn btn-ghost">Get in touch</a>
            </div>
          </div>
          <HeroVisual />
        </section>

        {/* 02 Statement: offset editorial text */}
        <section className="statement wrap reveal" aria-labelledby="about-title">
          <h2 id="about-title" className="label mono">About</h2>
          <div className="statement-body">
            <p className="lede">
              I’m Sayef, a software engineer who works where throughput meets maintainability. I like the unglamorous
              parts: queue semantics, module boundaries, the migration plan nobody wrote down.
            </p>
            <p className="statement-aside">
              Six years across backend platforms, product frontends and the seams between them. I leave behind code
              that the next person can change without asking me first.
            </p>
          </div>
        </section>

        {/* 03 Work: zig-zag media rows */}
        <section id="work" className="work wrap" aria-labelledby="work-title">
          <div className="section-head">
            <h2 id="work-title" className="label mono">Selected work</h2>
            <p className="section-count mono">{String(projects.length).padStart(2, "0")} projects</p>
          </div>
          <ol className="work-list">
            {projects.map((p, i) => (
              <li key={p.id} className="work-row reveal" data-flip={i % 2 === 1}>
                <figure className="work-media">
                  <Image
                    src={p.image}
                    alt={`${p.title}: ${p.kind}`}
                    width={1400}
                    height={1000}
                    sizes="(max-width: 860px) 100vw, 58vw"
                  />
                </figure>
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

        {/* 04 Capabilities: bento modules */}
        <section className="modules wrap" aria-labelledby="modules-title">
          <div className="section-head">
            <h2 id="modules-title" className="label mono">Modules</h2>
            <p className="section-count mono">What I plug into a team</p>
          </div>
          <div className="bento reveal">
            <article className="cell cell-a">
              <p className="mono meta">mod/backend</p>
              <h3>Concurrent backends</h3>
              <p>
                Schedulers, queues, streaming pipelines and the retry, idempotency and backpressure rules that make them
                boring in production.
              </p>
              <p className="mono cell-foot">Go · Rust · Postgres · Kafka</p>
            </article>
            <article className="cell cell-b">
              <p className="mono meta">mod/frontend</p>
              <h3>Frontend architecture</h3>
              <p>App shells split along team lines, with typed contracts between them.</p>
            </article>
            <article className="cell cell-c">
              <p className="mono meta">mod/infra</p>
              <h3>Infrastructure</h3>
              <p>Terraform, CI that finishes in minutes, observability wired in on day one.</p>
            </article>
            <figure className="cell cell-img">
              <Image
                src="https://picsum.photos/seed/sayef-modules-desk/1200/900?grayscale"
                alt="A quiet workspace with a laptop and notebook"
                width={1200}
                height={900}
                sizes="(max-width: 860px) 100vw, 50vw"
              />
            </figure>
            <article className="cell cell-d">
              <p className="mono meta">mod/reliability</p>
              <h3>Testing and reliability</h3>
              <p>Property tests, load tests and runbooks that are read before the incident, not during.</p>
            </article>
          </div>
        </section>

        {/* 05 Process: parallel thread lanes */}
        <section id="process" className="process wrap" aria-labelledby="process-title">
          <div className="section-head">
            <h2 id="process-title" className="label mono">Process</h2>
            <p className="section-count mono">Five threads, one schedule</p>
          </div>
          <p className="process-intro">
            Work doesn’t run in phases. Discovery keeps going while I build, and verification starts the week the first
            module compiles.
          </p>
          <div className="lanes reveal" role="list">
            <div className="lanes-axis mono" aria-hidden="true">
              <span>week</span>
              <div className="lanes-ticks">
                {Array.from({ length: WEEKS }, (_, i) => (
                  <span key={i}>w{i + 1}</span>
                ))}
              </div>
            </div>
            {threads.map((t) => (
              <div className="lane" role="listitem" key={t.id}>
                <div className="lane-label">
                  <span className="mono meta">thread.{t.id}</span>
                  <span className="lane-name">{t.name}</span>
                  <span className="lane-note">{t.note}</span>
                </div>
                <div className="lane-track" aria-hidden="true">
                  <div className="lane-bar" style={{ gridColumn: `${t.start} / ${t.end}` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 06 Principle: full-bleed media */}
        <section className="bleed" aria-labelledby="principle-title">
          <Image
            src="https://picsum.photos/seed/sayef-stairs-f/2400/1200?grayscale"
            alt="Parallel rail lines under station lights in fog"
            fill
            sizes="100vw"
            className="bleed-img"
          />
          <div className="bleed-copy wrap">
            <h2 id="principle-title" className="label mono">Principle</h2>
            <blockquote>
              <p>“The best module is the one you can delete on a Friday without a meeting.”</p>
            </blockquote>
          </div>
        </section>

        {/* 07 Experience: indexed table */}
        <section id="experience" className="experience wrap" aria-labelledby="experience-title">
          <div className="section-head">
            <h2 id="experience-title" className="label mono">Experience</h2>
            <p className="section-count mono">Most recent first</p>
          </div>
          <table className="xp reveal">
            <thead className="visually-hidden">
              <tr>
                <th scope="col">Years</th>
                <th scope="col">Role</th>
                <th scope="col">Organisation</th>
                <th scope="col">Location</th>
              </tr>
            </thead>
            <tbody>
              {experience.map((x) => (
                <tr key={x.years}>
                  <td className="mono xp-years">{x.years}</td>
                  <th scope="row" className="xp-role">{x.role}</th>
                  <td className="xp-org">{x.org}</td>
                  <td className="mono xp-place">{x.place}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 08 Notes: horizontal rail */}
        <section className="notes" aria-labelledby="notes-title">
          <div className="section-head wrap">
            <h2 id="notes-title" className="label mono">Writing and open source</h2>
            <p className="section-count mono">Scroll sideways</p>
          </div>
          <ul className="rail" tabIndex={0} aria-label="Writing and open source, scrollable">
            {notes.map((n) => (
              <li key={n.title} className="rail-item">
                <Image src={n.image} alt="" width={900} height={1100} sizes="(max-width: 860px) 72vw, 26vw" />
                <span className="mono meta">
                  <span>{n.kind}</span>
                  <span>{n.read}</span>
                </span>
                {n.href ? (
                  <a href={n.href} className="rail-title rail-link">
                    {n.title}
                  </a>
                ) : (
                  <span className="rail-title">{n.title}</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* 09 Contact: oversized type */}
        <section id="contact" className="contact wrap" aria-labelledby="contact-title">
          <h2 id="contact-title" className="label mono">Contact</h2>
          <p className="contact-big">
            Have a system that needs to <span className="dim">scale, split or settle down?</span>
          </p>
          <div className="contact-row">
            <a className="contact-mail" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <CopyEmail email={profile.email} />
          </div>
          <ul className="contact-links mono">
            {profile.links.filter((l) => l.href !== "#").map((l) => (
              <li key={l.label}>
                <a href={l.href} className="link">
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
