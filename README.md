# 🌼 Effeuille la marguerite

Une web app **portrait, mobile-first** qui recrée le rituel d'enfance de l'effeuillage de la marguerite — *« un peu, beaucoup, passionnément, à la folie, pas du tout »*.

On pense à quelqu'un, on touche le bouton, la fleur éclôt ; puis on détache chaque pétale du bout du doigt. Chaque pétale plane comme un voile, fait sonner une note cristalline et fait fleurir le mot suivant au-dessus de la corolle. Le **nombre de pétales est tiré au hasard à chaque partie** : le verdict final, mis en scène plein écran, change donc à chaque fois.

Direction artistique « prairie aquarelle », sound design **entièrement synthétisé** (zéro asset audio).

**🌐 En ligne : https://la-marguerite.pages.dev**

---

## Lancer le projet

```bash
npm install
npm run dev        # dev — Vite, http://localhost:5173
npm run build      # build de production → dist/
npm run preview    # sert le build de production
```

À ouvrir sur mobile (ou en responsive portrait) pour l'expérience complète. Le son démarre au premier tap sur le CTA — contrainte *autoplay* des navigateurs.

---

## L'expérience

| Écran | Ce qui se passe |
|-------|-----------------|
| **Intro** | Titre poétique, marguerite en bouton fermé qui respire, CTA *« Effeuiller la marguerite »* (shimmer). Le tap réveille l'audio et **fait éclore** la fleur. |
| **Rituel** | Tap-to-pluck : chaque pétale fait *squash → snap élastique → vol planant* avec flutter 3D, traînée « encre dans l'eau », pollen éjecté, ripple, son cristallin montant, haptique. Le **mot du cycle** se pose au-dessus en serif Fraunces. Le cœur bat à chaque pétale, la fleur s'allège. |
| **Verdict** | Le dernier pétale plane au ralenti (*time-warp*), le cœur émet une onde de lumière, le pollen s'élève. Un voile crème monte, une carte poétique apparaît et le verdict **s'écrit lettre par lettre**. *« Une autre fleur »* recommence avec un nouveau nombre de pétales. |

---

## Stack

- **React 19 + Vite** — coquille applicative, machine à états du flow.
- **GSAP 3.15** (tous plugins gratuits : Physics2D, MotionPath, DrawSVG, CustomEase) — toute la motion.
- **Tone.js 15** — sound design **entièrement synthétisé**, zéro asset audio.
- Marguerite **procédurale en SVG** (aquarelle via filtres `feTurbulence`/`feDisplacement`).

Côté code — arborescence du projet, accessibilité et budget de performance : **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**. Direction artistique détaillée & chorégraphie : **[`docs/DESIGN_BIBLE.md`](docs/DESIGN_BIBLE.md)**.

---

## Direction artistique — « Prairie aquarelle »

Fond ivoire crème, sauge tendre, blush, soleil doux ; pétales blanc cassé, cœur safran. Peint-main, brumeux, organique. **Jamais de noir, jamais de bord dur** : toute ombre est une teinte chaude désaturée et floutée. Typo : **Fraunces** (serif italique) pour les mots et le verdict, **Nunito** pour l'UI.

---

## Déploiement

Site statique déployé sur **Cloudflare Pages** :

```bash
npm run build
wrangler pages deploy dist --project-name la-marguerite --branch main
```

→ **https://la-marguerite.pages.dev**
