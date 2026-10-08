# Sayef Khan · Portfolio

My personal portfolio site, built with Next.js. It introduces who I am, walks through six projects with a side-by-side view of the code and the finished product, and lists the skills I bring to a team.

## What's on the page

- **Hero:** my name in a glowing serif, an animated 3D glass star and a shader-gradient background.
- **About:** a short introduction, from managing restaurants to building software.
- **Past projects:** six projects from 2023 to 2026. Each one shows a real code snippet next to a mock of the finished product, built in HTML and CSS rather than screenshots so it stays sharp at any size.
- **Services:** a draggable, curved card slider covering full-stack development, languages, tools, cloud, databases, AI, testing and systems fundamentals.
- **Contact:** email with a one-click copy button, GitHub, LinkedIn and a CV download.

## Built with

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) and React 19
- TypeScript
- [three.js](https://threejs.org) with React Three Fiber and Drei for the 3D star
- [ShaderGradient](https://shadergradient.co) for the animated background
- Plain CSS, with the Geist and Italiana fonts

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
| Project titles, years, summaries, outcomes and tags | `app/content.ts` (`projects`) |
| Each project's code snippet and product mock | `app/components/ProjectShowcase.tsx` |
| Services cards and their skill lists | `app/components/Services.tsx` |
| Hero, About and Contact wording | `app/page.tsx` |
| Colors, fonts and layout | `app/globals.css` |
| CV file | `public/Sayef_Khan_CV_2026.pdf` |
| Site icon | `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png` |

## Project structure

```
app/
  page.tsx               The page and all its sections
  layout.tsx             Fonts and page metadata
  content.ts             Profile and project data
  globals.css            All styles
  components/
    Background.tsx       Animated shader-gradient background
    HeroVisual.tsx       Loads the 3D star, with a CSS fallback
    GlassStar.tsx        The 3D glass star scene
    ProjectShowcase.tsx  Code and product panels for each project
    Services.tsx         Curved card slider
    CopyEmail.tsx        Copy-to-clipboard button
public/
  hdr/                   Lighting maps for the 3D star
  Sayef_Khan_CV_2026.pdf
```

## Contact

- Email: [sayxfkhan@gmail.com](mailto:sayxfkhan@gmail.com)
- LinkedIn: [linkedin.com/in/sayxfk](https://www.linkedin.com/in/sayxfk/)
- GitHub: [github.com/fwqncy](https://github.com/fwqncy)
