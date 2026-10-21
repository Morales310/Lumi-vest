# LUMI-VEST

Airbnb-inspired property marketplace for Kaduna — static HTML/CSS/JS, no build step.

## Run locally

```bash
npm start          # serves on http://localhost:3000
# or
python3 -m http.server 3000
```

## Deploy

**Netlify (drag & drop)** — go to <https://app.netlify.com/drop> and drop this folder. Done.

**Netlify CLI**

```bash
npx netlify-cli deploy --prod --dir .
```

**Vercel**

```bash
npx vercel --prod
```

**GitHub Pages** — push this folder to a repo, enable Pages on the branch root.
`.nojekyll` is already included.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Page shell: header search, hero, listings, host, footer, modal |
| `styles.css` | Airbnb-style design system + animations |
| `script.js` | Listings data, filters, carousels, wishlist, modal, reveals |
| `img/`, `VID-*.mp4` | Listing photos and walkthrough videos |

## Contact wiring

Phone / WhatsApp / email links point at `+234 916 865 9842` and
`jesevelarrealestate@gmail.com` — edit `CONTACT` at the top of `script.js`
and the hard-coded links in `index.html` to change them.

## Cloudflare publishing API

The admin panel sends listing changes through the separate `lumi-vest-publishing-api`
Worker. Keep this Worker name distinct from any Pages or static-site deployment: a site
deployment must not replace the API Worker. Its GitHub token is stored only as the
`GITHUB_TOKEN` Worker secret.

Deploy the Worker from the repository root with Wrangler, then set the secret with
`npx wrangler secret put GITHUB_TOKEN`. The website's `ADMIN_API` URL is configured near
the top of `script.js`; site deployments must publish that file without running Wrangler
against the API Worker.
