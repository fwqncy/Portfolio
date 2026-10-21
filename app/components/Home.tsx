import AboutCode from "./AboutCode";
import Hero from "./Hero";
import ProjectCarousel from "./ProjectCarousel";
import { profile, projects } from "../content";

// The whole home page. A case study's URL renders it too, with that project's card already flipped open.
export default function Home({ openId }: { openId?: string }) {
  return (
    <main id="main">
      <Hero role={profile.role} />

      <AboutCode />

      <section id="work" className="work" aria-labelledby="work-title">
        <h2 id="work-title" className="visually-hidden">
          Projects
        </h2>
        <ProjectCarousel projects={projects} openId={openId} />
      </section>
    </main>
  );
}
