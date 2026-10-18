import AboutCode from "./components/AboutCode";
import Hero from "./components/Hero";
import ProjectStack from "./components/ProjectStack";
import { profile, projects } from "./content";

export default function Page() {
  return (
    <main id="main">
      <Hero role={profile.role} />

      <AboutCode />

      <section id="work" className="work" aria-labelledby="work-title">
        <h2 id="work-title" className="visually-hidden">
          Projects
        </h2>
        <ProjectStack projects={projects} />
      </section>
    </main>
  );
}
