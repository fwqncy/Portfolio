# Sayef Khan · Portfolio

My personal portfolio site, built with Next.js and GSAP around a space, galaxy and star theme. It introduces who I am, walks through six projects, and links each one to its own case-study page.

## What's on the page

- **Header:** a fixed ticker tape that loops a TypeScript "Hello World!" project. It hides as you scroll down, comes back as you scroll up, and speeds up and changes direction with your scrolling.
- **Hero:** layered type after henry.codes, centred over an animated 3D glass star: my name in huge condensed capitals, an outlined italic "software" tucked over its lower left, and "ENGINEER" in spaced serif capitals spanning its full width. Scrolling dissolves the name and star into the starfield.
- **Intro:** a short introduction written as a TypeScript file, with ASCII rings orbiting it like a planet.
- **Projects:** six full-screen panels that pin and layer over each other as you scroll, with a side list of project names whose glowing line follows the active project. Each panel shows real code next to a screen recording of the project running.
- **Case studies:** opening a project sweeps a wavy shape overlay up the screen into its own page (for example `/projects/arachne`); going back sweeps it down and lands on the same project. Each page sits on the ShaderGradient "04 Nighty night" gradient, with an image or screen recording, overview, outcome, stack and a faint looping ASCII fire. All six projects have full write-ups with real code excerpts and screen recordings.
- **Footer:** after open space where the starfield carries on, a stippled skyline of starlit spires rises into a henry.codes-style footer: columns of projects, links (GitHub, LinkedIn, CV) and contact, a stippled ringed planet, and a serif sign-off. The skyline springs up harder the faster you scroll into it.

## Built with

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) and React 19
- TypeScript
- [GSAP](https://gsap.com) with ScrollTrigger, Observer, ScrollTo and MorphSVG, via `@gsap/react`
- [three.js](https://threejs.org) with React Three Fiber and Drei for the 3D star
- [Tailwind CSS 4](https://tailwindcss.com) alongside hand-written CSS in `app/globals.css`
- [ShaderGradient](https://shadergradient.co) for the case-study backgrounds
- Anton, Instrument Serif, IBM Plex Mono, Cormorant Garamond and Geist

## Running it locally

You need **Node.js 20.9 or newer**.

```sh
npm install
npm run dev
```

Then open <http://localhost:3000>.

To build and run the production version:

```sh
npm run build
npm start
```

## Editing the content

Most of the text lives in one file, so you don't need to touch the layout to update it.

| What | Where |
|---|---|
| Name, role, email, status line, GitHub / LinkedIn / CV links | `app/content.ts` (`profile`) |
| Project titles, years, summaries, outcomes, tags and case-study images | `app/content.ts` (`projects`) |
| Each project's preview code snippet | `app/components/ProjectShowcase.tsx` |
| Case-study write-ups and code excerpts | `app/caseStudies.ts` |
| Project screen recordings | `public/projects/<id>/preview.mp4` and `poster.jpg` |
| Intro wording | `app/components/AboutCode.tsx` |
| Projects heading | `app/page.tsx` |
| Header ticker lines | `app/components/CodeHeader.tsx` |
| Footer captions and links | `app/components/SiteFooter.tsx` |
| Colours, fonts and layout | `app/globals.css` |
| CV file | `public/Sayef-Khan-CV.pdf` |
| Site icon | `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png` |

## Project structure

```
app/
  page.tsx               Home page: hero, intro and projects
  layout.tsx             Fonts, background, header, page transition and footer
  projects/[id]/page.tsx One case-study page per project
  content.ts             Profile and project data
  globals.css            All styles
  lib/gsap.ts            GSAP plugin setup and the horizontal loop helper
  components/
    Background.tsx       Starfield and nebula backdrop
    CodeHeader.tsx       Hide-on-scroll header with the Hello World ticker
    Hero.tsx             Name, role and scroll-driven fade
    AboutCode.tsx        Intro as a code file, with the orbiting ASCII aura
    CaseGradient.tsx     ShaderGradient background for case studies
    HeroVisual.tsx       Loads the 3D star, with a CSS fallback
    GlassStar.tsx        The 3D glass star scene
    ProjectStack.tsx     Layered pinned project panels
    ProjectIndex.tsx     Side list of projects with the moving line
    ProjectShowcase.tsx  Code snippet beside each project's recording
    ProjectCase.tsx      Case-study page content
    ProjectVideo.tsx     Muted looping screen recording that plays while on screen
    PageTransition.tsx   Shape-overlay transition between pages
    AsciiFire.tsx        Looping ASCII fire behind case studies
    SiteFooter.tsx       Stippled skyline footer with links and contact
public/
  hdr/                   Lighting maps for the 3D star
  Sayef-Khan-CV.pdf
```

## Contact

- Email: [sayxfkhan@gmail.com](mailto:sayxfkhan@gmail.com)
- LinkedIn: [linkedin.com/in/sayxfk](https://www.linkedin.com/in/sayxfk/)
- GitHub: [github.com/fwqncy](https://github.com/fwqncy)
