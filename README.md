# Vivek Reddy — portfolio

A motion-first, single-page portfolio: knowledge engineer at **Varavox** (legal AI), founder of **IgniteXT** — live AI classes for secondary-school students (1x → 10x) and the IgniteXT student community.

Butter-smooth scrolling, velocity-reactive type, marquees, a pinned horizontal work section, 3D tilt cards, draggable stationery, and **hyperframes** — small inline video loops generated frame-by-frame from the site's own visuals.

- Type & stationery cutouts from the open-source [greenportfolio](https://github.com/gireeshkumarreddy/greenportfolio) desk theme (URW fonts — license in `licenses/`).
- Motion: [GSAP](https://gsap.com) + ScrollTrigger + [Lenis](https://lenis.darkroom.engineering), vendored in `assets/vendor/` — no CDN, no build step.
- Respects `prefers-reduced-motion`: the page renders fully static and readable.

## Run locally

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy

Any static host: publish the repo root, no build command. Keep `assets/` intact.
