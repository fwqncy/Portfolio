# Sayef Khan · Portfolio

My personal portfolio site, built with Next.js and GSAP around a space, galaxy and star theme. It introduces who I am, then shows seven projects as a row of cards, each one flipping over to its case study.

## What's on the page

- **Header:** a fixed ticker tape that loops a TypeScript "Hello World!" project. It hides as you scroll down, comes back as you scroll up, and speeds up and changes direction with your scrolling.
- **Hero:** layered type after henry.codes, centred over an animated 3D glass star: my name in huge condensed capitals, an outlined italic "software" tucked over its lower left, and "ENGINEER" in spaced serif capitals spanning its full width. Scrolling dissolves the name and star into the starfield.
- **Intro:** a short introduction written as a TypeScript file, with ASCII rings orbiting it like a planet.
- **Projects:** a row of cards, starting on the newest (Terra). Click a side card, drag, swipe, use the arrow keys or the galaxy bar to move back through older work; each card spins a half turn as it moves aside, where it bells out toward the edge of the screen. Every card plays its screen recording and shows the title, subtitle, description, tools and year. Hovering zooms the card in a little, tips it toward the cursor and lights it with a glare and stardust that follow the mouse. Underneath, a galaxy progress bar grows stars, ringed planets, moons and tiny galaxies as it fills, with a comet at its head; pull it back and they burst into stardust.
- **Case studies:** clicking the middle card flips it over and zooms in to its case study on the back, on the ShaderGradient "04 Nighty night" gradient, with the galaxy bar stood on end down the left to switch projects. The URL follows (for example `/projects/terra`), so links can be shared and the browser's Back button flips the card closed. All seven projects have full write-ups with real code excerpts and screen recordings.
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
| Case-study write-ups and code excerpts | `app/caseStudies.ts` |
| Project screen recordings | `public/projects/<id>/preview.mp4` and `poster.jpg` (Terra's is built from its README screenshots for now) |
| Intro wording | `app/components/AboutCode.tsx` |
| Projects heading | `app/components/Home.tsx` |
| Header ticker lines | `app/components/CodeHeader.tsx` |
| Footer captions and links | `app/components/SiteFooter.tsx` |
| Card layout and per-project tints | `app/lib/cardFace.ts` |
| Colours, fonts and layout | `app/globals.css` |
| CV file | `public/Sayef-Khan-CV.pdf` |
| Site icon | `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png` |

## Project structure

```
app/
  page.tsx               Home page
  layout.tsx             Fonts, background, header and footer
  projects/[id]/page.tsx The home page with one project's case study open
  content.ts             Profile and project data
  globals.css            All styles
  lib/gsap.ts            GSAP plugin setup and the horizontal loop helper
  lib/cardFace.ts        Draws each project card into a canvas
  lib/cardStage.ts       WebGL card carousel (spin, stretch, hover), with a CSS fallback
  lib/openCase.ts        Opens a case study from anywhere on the page
  components/
    Background.tsx       Starfield and nebula backdrop
    CodeHeader.tsx       Hide-on-scroll header with the Hello World ticker
    Hero.tsx             Name, role and scroll-driven fade
    AboutCode.tsx        Intro as a code file, with the orbiting ASCII aura
    CaseGradient.tsx     ShaderGradient background for case studies
    HeroVisual.tsx       Loads the 3D star, with a CSS fallback
    GlassStar.tsx        The 3D glass star scene
    Home.tsx             Hero, intro and projects, shared by both pages
    ProjectCarousel.tsx  Project cards, input, and the flip into each case study
    GalaxyBar.tsx        Galaxy progress bar for moving between projects
    CaseStudy.tsx        Case-study content on the back of a card
    Code.tsx             Syntax-highlighted code excerpts
    ProjectVideo.tsx     Muted looping screen recording that plays while on screen
    SiteFooter.tsx       Stippled skyline footer with links and contact
public/
  hdr/                   Lighting maps for the 3D star
  Sayef-Khan-CV.pdf
```

## Contact

- Email: [sayxfkhan@gmail.com](mailto:sayxfkhan@gmail.com)
- LinkedIn: [linkedin.com/in/sayxfk](https://www.linkedin.com/in/sayxfk/)
- GitHub: [github.com/fwqncy](https://github.com/fwqncy)
