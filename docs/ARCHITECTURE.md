# Architecture & développement

Compagnon technique du [README](../README.md). L'expérience, la direction
artistique, la chorégraphie et le sound design vivent dans
[`DESIGN_BIBLE.md`](DESIGN_BIBLE.md).

## Lancer le projet

```bash
npm install
npm run dev        # dev — Vite, http://localhost:5173
npm run build      # build de production → dist/
npm run preview    # sert le build de production
```

À ouvrir sur mobile (ou en responsive portrait) pour l'expérience complète. Le son démarre au premier tap sur le CTA — contrainte *autoplay* des navigateurs.

## Stack

- **React 19 + Vite** — coquille applicative, machine à états du flow.
- **GSAP 3.15** (tous plugins gratuits : Physics2D, MotionPath, DrawSVG, CustomEase) — toute la motion.
- **Tone.js 15** — sound design **entièrement synthétisé**, zéro asset audio.
- Marguerite **procédurale en SVG** (aquarelle via filtres `feTurbulence`/`feDisplacement`).

## Arborescence du code

```
src/
├─ App.jsx                 machine à états (intro → rituel → verdict → rejouer), screenshake, mute
├─ components/
│  ├─ Stage.jsx            scène (secouable) + couche UI stable
│  ├─ Backdrop.jsx         L0/L1 : ciel, lavis flous, rais volumétriques, grain papier
│  ├─ Meadow.jsx           L2/L4 : pollen ambiant, marguerites fantômes, spore d'inactivité
│  ├─ Daisy.jsx            L3 : SVG procédural, vie idle, particules, tap-to-pluck, verdict
│  ├─ WordBand.jsx         bande mot fixe, cross-fade, soulignement aquarelle (DrawSVG)
│  ├─ IntroScreen.jsx      titre + CTA (démarre l'audio dans le geste utilisateur)
│  ├─ VerdictCard.jsx      voile crème + carte + révélation lettre-par-lettre
│  └─ ControlsBar.jsx      bouton mute persistant, accessible
├─ lib/
│  ├─ daisy.js             generateDaisy(seed) → modèle pur (pétales, phyllotaxie, tige)
│  ├─ petalChoreography.js squash → snap → promotion (getScreenCTM) → vol/flutter → fade
│  ├─ idle.js              UN gsap.ticker : respiration, balancement, micro-vie, glow, parallax
│  ├─ particles.js         pool SVG réutilisable : pollen (Physics2D), ripple, pluie de verdict
│  ├─ audio.js             moteur Tone.js : nappe, pluck pentatonique montant, verdict
│  ├─ phrases.js           le cycle + métadonnées de verdict
│  ├─ random.js            PRNG seedable (mulberry32)
│  ├─ gsapSetup.js         enregistrement des plugins GSAP
│  ├─ useReducedMotion.js  · useParallax.js
├─ hooks/useHaptics.js     retour tactile (Vibration API)
└─ styles/                 theme.css (tokens DA) · global.css (reset + stage)
docs/DESIGN_BIBLE.md       cahier des charges DA & chorégraphie (source de vérité)
```

## Accessibilité & performance

- **`prefers-reduced-motion`** respecté : screenshake / flutter / parallaxe / flashs coupés, chute remplacée par un fondu doux, idle réduit à une respiration lente.
- Pétales **focusables au clavier** (`role=button`, Espace/Entrée), région **`aria-live`** annonçant chaque mot et le verdict, bouton mute accessible, contrastes soignés.
- Animations exclusivement **`transform`/`opacity`** (GPU), filtres SVG rastérisés une fois, pools de particules, **un seul** `gsap.ticker`, `maxPolyphony` Tone limité.

## Déploiement

Site statique déployé sur **Cloudflare Pages** :

```bash
npm run build
wrangler pages deploy dist --project-name la-marguerite --branch main
```

→ **https://la-marguerite.pages.dev**
