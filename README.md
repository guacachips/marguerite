# 🌼 Effeuille la marguerite

Une web app **portrait, mobile-first**, qui recrée le rituel d'enfance de l'effeuillage de la marguerite — *« un peu, beaucoup, passionnément, à la folie, pas du tout »*. On pense très fort à quelqu'un, on touche le bouton, la fleur s'épanouit ; puis on détache chaque pétale du bout du doigt. Chaque pétale plane comme un voile, fait sonner une note cristalline qui monte vers le verdict, et fait fleurir le mot suivant au-dessus de la corolle. Le **nombre de pétales est aléatoire à chaque partie** → le verdict final, mis en scène plein écran, change à chaque fois.

Ce n'est pas une démo : c'est une **expérience finie**, pensée comme un objet d'art sensoriel — son + toucher + image couplés, direction artistique « prairie aquarelle », sound design 100 % synthétisé.

---

## Lancer le projet

```bash
npm install
npm run dev        # serveur de dev
npm run build      # build de production (dossier dist/)
npm run preview    # sert le build de production
```

> ⚠️ **Ports** : dans ce workspace, le port **5173 est déjà occupé** par un autre projet (`space-merchant`). Lancez la marguerite sur un port dédié :
> ```bash
> npx vite --port 5193 --strictPort --host 127.0.0.1
> ```

Ouvrez ensuite l'URL sur mobile (ou en mode responsive portrait) pour l'expérience complète. Le son démarre au premier tap sur le CTA (politique *autoplay* des navigateurs).

---

## L'expérience

| Écran | Ce qui se passe |
|-------|-----------------|
| **Intro** | Titre poétique, marguerite en bouton fermé qui respire, CTA *« Effeuiller la marguerite »* (shimmer). Le tap réveille l'audio et **fait éclore** la fleur. |
| **Rituel** | Tap-to-pluck : chaque pétale fait *squash → snap élastique → vol planant* avec flutter 3D, traînée « encre dans l'eau », pollen éjecté, ripple, son cristallin montant, haptique. Le **mot du cycle** se pose au-dessus en serif Fraunces. Le cœur bat à chaque pétale, la fleur s'allège. |
| **Verdict** | Le dernier pétale plane au ralenti (*time-warp*), le cœur émet une onde de lumière, le pollen s'élève. Un voile crème monte, une carte poétique apparaît et le verdict **s'écrit lettre par lettre**. *« Une autre fleur »* recommence avec un nouveau nombre de pétales. |

---

## Stack & architecture

- **React 19 + Vite** — coquille applicative, machine à états du flow.
- **GSAP 3.15** (tous plugins gratuits : Physics2D, MotionPath, DrawSVG, CustomEase) — toute la motion.
- **Tone.js 15** — sound design **entièrement synthétisé**, zéro asset audio.
- Marguerite **procédurale en SVG** (aquarelle via filtres `feTurbulence`/`feDisplacement`).

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

---

## Direction artistique — « Prairie aquarelle »

Fond ivoire crème, sauge tendre, blush, soleil doux ; pétales blanc cassé, cœur safran. Peint-main, brumeux, organique, *lovely*. **Jamais de noir, jamais de bord dur** : toute ombre est une teinte chaude désaturée et floutée. Typo : **Fraunces** (serif italique) pour les mots et le verdict, **Nunito** pour l'UI.

## Accessibilité & performance

- **`prefers-reduced-motion`** respecté : screenshake / flutter / parallaxe / flashs coupés, chute remplacée par un fondu doux, idle réduit à une respiration lente.
- Pétales **focusables au clavier** (`role=button`, Espace/Entrée), région **`aria-live`** annonçant chaque mot et le verdict, bouton mute accessible, contrastes soignés.
- Animations exclusivement **`transform`/`opacity`** (GPU), filtres SVG rastérisés une fois, pools de particules, **un seul** `gsap.ticker`, `maxPolyphony` Tone limité.

---

*Fait avec soin — une expiration, pas une victoire.* 🤍
