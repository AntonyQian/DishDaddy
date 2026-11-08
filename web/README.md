# DishDaddy web

A black, glass-and-light web version of the three screens: Kitchen, Recipes and Cook Mode.
It talks to the same recipe server as the phone app.

```bash
npm run server   # the recipe server, port 8787
npm run web      # this site, http://localhost:3000
```

`/api/*` is forwarded to the server (`API_URL`, default `http://localhost:8787`), so there is no CORS to set up.
The Kitchen lives in the browser (`localStorage`, same shape as the phone app's).

## Stack

- **Next.js** (App Router) and **Tailwind CSS v4**
- **React Three Fiber** and **drei**: the glass pantry, bowl and foods are built in code (physical materials, procedural light panels), so there are no model or HDR files to download
- **GSAP ScrollTrigger** drives the 3D scenes from scroll and pins Cook Mode; **Lenis** gives inertia scrolling that GSAP shares
- **Framer Motion**: page transitions, shared-layout pills, springs, tilt and magnetic buttons
- Spotlight cards, split-text reveals, magnetic buttons, count-up and the aurora backdrop are written here in the style of React Bits, not copied from it
