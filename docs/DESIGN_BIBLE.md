# Design Bible — « Effeuille la marguerite »

> Synthèse du panel créatif (3 lentilles : game-feel · éditorial · sensoriel) en une bible d'implémentation. Source de vérité pour la fidélité de l'exécution.

## North Star
Une marguerite peinte à l'aquarelle, **vivante et respirante**, qu'on joue du bout du doigt : chaque tap détache un pétale qui **plane comme un voile**, fait sonner une **note cristalline montante** vers le verdict, et fait **fleurir le mot suivant**. Le dernier pétale **dilate le temps** et peint plein écran une **carte poétique**. Un instrument-jouet sensoriel — triple couplage son + toucher + image, servi par la retenue éditoriale et le game-feel (anticipation/overshoot). C'est une **expiration, pas une victoire**.

## Direction artistique (verrouillée — alignée `theme.css`)
- Palette : fond ivoire crème `--c-cream` #FBF7EF → warm #F6EFE0 → deep #EFE6D3 ; sauge `--c-sage` #C9D8B6 ; blush `--c-blush` #E8B4B8 ; soleil `--c-sun` #F2C879 ; pétale `--c-petal` #FDFBF6 ; cœur safran `--grad-heart` #F2C879→#E5A33C→#D98E2B.
- **Jamais de noir, jamais de bord dur.** Toute ombre = teinte chaude désaturée, opacité ≤ .2, blur généreux 20–40px.
- Typo : **Fraunces** italique (mots du cycle, verdict, titre) ; **Nunito** (UI/CTA/captions).
- Grain : filtre SVG watercolor (feTurbulence baseFreq .012 / numOctaves 3 + feDisplacement scale 4 + feGaussianBlur .4) sur pétales, **rastérisé une fois** ; overlay grain papier (fractalNoise .9) multiply 4–5% figé sur la scène.
- Lumière diffuse chaude **haut-gauche** ; glow safran qui **pulse à chaque pluck**.

## Composition (portrait, 5 couches Z)
- **L0** fond `--grad-sky` + vignette aquarelle coins (statique).
- **L1** lavis hors-focus sauge+blush 14–18% opacité, blur 36–40px, parallax ×0.15.
- **L2** pollen/brume arrière (14–18 motes) + 2 marguerites fantômes 35% jamais nettes (depth-of-field), parallax ×0.3.
- **L3** LA marguerite, point focal net, ancrée à 56–58% de hauteur, décalée 3–4% à gauche ; ombre portée aquarelle (blur 24px, sauge 18%, bas-droite 8px) qui se déforme avec le sway.
- **L4** pollen avant net + pétale tombé occasionnel devant caméra, parallax ×0.8.
- **Bande MOT** fixe centrée tiers haut (~24% hauteur), **JAMAIS de reflow**. CTA ancré bas (safe-area + 24px). Mute discret haut-droite. **Pas de compteur de pétales** (mystère préservé). 3 écrans : intro · rituel · verdict.

## Marguerite SVG (procédurale)
- 1 SVG inline, `viewBox 0 0 400 600`, généré en JS au mount (graine aléatoire/run). Groupes nommés : `#flower` > `#stem`, `#petals` (`g.petal[data-index]`), `#core`.
- **Pétales** : N aléatoire **13–37**. Chaque pétale = un `<path>` amande asymétrique, L 78–90 / W 18–24, base étroite à r≈32, pointe arrondie légèrement bilobée (échancrure 3px). Bézier cubiques, twist ±4° des contrôles, micro-variation longueur .92–1.08. Angle = i·(360/N) + jitter ±4°, transform-origin à la **base** (au cœur).
- Remplissage : linearGradient vertical #FDFBF6 (pointe) → #FBF7EF → base ombrée #F3EEE3, + liseré blush #E8B4B8 10–12% multiply près de la base.
- **Cœur** : disque r=34 `--grad-heart` + ~60 micro-points en **phyllotaxie** (angle d'or 137.5°, r=4·√i), teintes #E5A33C→#D98E2B opacités 50–90% + highlight spéculaire blanc 30% haut-gauche.
- **Tige** : path S, gradient `--c-stem` #93A877→`--c-sage`, largeur 4–5px, round caps, 2 feuilles lancéolées (à 60% et 75%).
- Filtres dans `<defs>`, calculés **une seule fois**, jamais animés/frame. Pétales en chute → drop-shadow CSS léger (pas le feTurbulence lourd).

## Chorégraphie du pétale (timeline GSAP indépendante/pétale, ~1100ms ; input redispo à ~150–180ms)
1. **Anticipation/squash** (0–100ms) : scaleX .94 / scaleY 1.06 + recul 2px vers cœur + glow flash safran 0 0 12px, `power3.in`. Cœur micro-recul .97.
2. **Release/snap/pop** (100–180ms) : overshoot scale 1.06 puis détachement base ; rotation init ±8° ; flash glow blanc `back.out(3)` + `elastic.out(1.1,0.5)`. **Micro-screenshake** scène L0–L3 ±3px / ±0.4°, 4 osc 120ms `power2.out`. Émission : 6–10 pollen safran (Physics2D vel 80–180, angle -60..-120°, gravity 220, friction .04, scale→0, life 600–900ms) + ripple radial (2 cercles r 0→120 + fade).
3. **Chute/plane** (180–1100ms) : Y +320..+480 `power1.in`, drift X ±40..120 `sine.inOut`. Flutter 3D : rotationY 0→360 lin + scaleX 1→0.4→1 (transparence du voile) + flutter scaleY .82–1 ~6Hz + rotationZ ±220. Depth-pass : devant (Z4) ~200ms puis derrière la fleur (Z2) à mi-chute ; scale 1→0.78 + blur 0→1.5px sur les 380 derniers ms.
4. **Fade** (900–1100ms) : opacité 1→0 (reste 1 jusqu'à 70% du trajet puis `power2.in`), retiré du DOM en onComplete.
- **Traînée** : 3 clones fantômes opacité .15/.10/.05 décalés 40–60ms + blur 3px (encre dans l'eau). Cœur réagit (squash .97→1.04→1). Tige : whip sine 1 oscillation après chaque arrachage.

## Vie idle (UN seul gsap.ticker)
- Respiration corolle scale 1→1.018→1 (4200ms sine.inOut yoyo) couplée ±4% glow.
- Balancement fleur ±1.5° (6000ms), sway tige ±2.5° (7000ms) — **fréquences premières entre elles** (organique non-répétitif).
- Micro-vie/pétale ±0.8° stagger (période 3–4s). Pollen ambiant 14–18 motes dérive brownienne + drift ascendant −8px/s, wrap-around, pool. Cœur pulse glow 6s + phyllotaxie scintille par vagues.
- Hover/tilt : mousemove desktop (lerp .06, quickTo) / deviceorientation mobile (throttle 30Hz) → parallax 5 couches + fleur s'incline (max 3°). Repos >8s : spore solitaire en diagonale.

## Bande mot
- Fixe, tiers haut ~24%, absolue, jamais de reflow. Fraunces italique 300–400, `--fs-word`, couleur safran `--c-sun-deep` #E5A33C, letter-spacing .02em.
- Transition (au snap, ~150ms après tap) : SORTIE remontée 14px + fade + blur 0→6px + tracking élargi, 220ms `power2.in`. ENTRÉE de +14px, blur 8→0, scale .92→1.05→1 `back.out(2.2)`, 360ms, décalé 80–120ms (croisement propre). Ink-bleed blush. Sur **« à la folie »** : jitter text-shadow 600ms. Mots longs : clamp/auto-fit, jamais de wrap. `aria-live=polite`.

## Verdict (dernier pétale → rupture de rythme)
1. **Time-warp** (0–1400ms) : timeScale 0.4, le pétale plane seul plein écran (voile 3D + comète de pollen doré) ; scène désature/floute ; nappe se suspend (low-pass se ferme, reverb s'ouvre) ; zoom caméra scale 1.08 vers le cœur.
2. **Bloom** (1400–2400ms) : onde de lumière safran plein cadre (radial, max .7, jamais aveuglant) + ~40 pollens qui s'élèvent ; la fleur nue remonte et grandit (×1.3–1.4).
3. **Carte poétique** (2400–3400ms) : fondu au crème (voile ivoire 0→92% par le bas) ; carte glassmorphism crème (radius `--radius-card`, backdrop-blur 16px, fond rgba(253,251,246,.78), bord blush .4, `--shadow-card`, bords watercolor) monte (`back.out(1.4)`). Sur-titre italique sauge + **verdict** Fraunces `--fs-verdict` safran qui **s'écrit lettre par lettre** (blur 14→0, scale .9→1, rise 8px, stagger 40–45ms, `power3.out`). Ornement : 3 mini-pétales + petit ornement floral au trait + 1 pétale **relique** qui flotte.
4. **CTA Rejouer** (pill sauge outline) fade+rise après 600–800ms. Filter saturate 1.08 brightness 1.04. Tap = re-floraison, nouveau N.

## Sound design (Tone.js — voir `lib/audio.js`)
- INIT au tap CTA intro (autoplay policy). Master Volume → Limiter(-1dB) → Destination. Bus reverb partagé Reverb(decay 9s, wet .55, preDelay .04). Mute persiste (localStorage).
- **Nappe** PolySynth(FM/AM, sine) accord Do add9 étalé (C2 G2 C3 E3 D4), ADSR 4/2/.6/6–8s, −22..−26dB, AutoFilter(.06Hz, depth .4) = respiration spectrale (couplée à la vignette).
- **Pluck** PluckSynth (Karplus, attackNoise 1, dampening 4000, resonance .92), note **montante** sur pentatonique de Do (C5 D5 E5 G5 A5 C6…), FeedbackDelay('8n', fb .28, wet .3) + reverb, vélocité .7–.9, detune ±12c, −8..−12dB + MembraneSynth très court (pop boisé).
- **Froissement** NoiseSynth(pink, .002/.12/0/.08) → bandpass 3000 Q1.5, −24dB.
- **Pollen** MetalSynth adouci / sines courtes, 2–3 notes >C6, highpass 1500, ~1/3 du temps.
- **Mot** Synth sine souffle la fondamentale (300ms, release 1s, −20dB) ; « passionnément »/« à la folie » plus ouvert.
- **Verdict** : suspension → résolution. Nappe glisse vers accord plus chaud. Arpège PluckSynth descendant (C6 G5 E5 C5 G4) stagger 120ms, reverb wet .7 ; cloche grave FMSynth C3 (release 6s). « à la folie » → Tremolo 6Hz. « pas du tout » → résolution mineure douce-amère (Cmaj→Amin add9).
- maxPolyphony 8, dispose des voix mortes ; dégrade gracieusement (visuel+haptique restent complets).

## Perf & A11y
- Animer **exclusivement** transform + opacity. force3D. will-change posé au tap / retiré en onComplete. Pétales détachés sur leur layer, retirés du DOM après fade.
- Pooling : pollen ambiant ≤18, éjecté ≤10/pluck, pluie verdict ~40. Filtres SVG une fois. blur de chute ≤1.5px. **Un seul** gsap.ticker. deviceorientation throttle 30Hz. Tone maxPolyphony 8, Limiter −1dB.
- **prefers-reduced-motion** : coupe screenshake/flutter/parallax/flash ; chute → fade + petite translation 250–300ms ; idle → respiration très lente ; verdict en fade simple ; rituel 100% fonctionnel.
- ARIA : CTA labels clairs ; pétales `role=button` focusables (Espace/Entrée), aria-label « Arracher un pétale » ; région `aria-live=polite` (mot + verdict). Contraste ink #5B5142 sur crème ~8:1 ; safran réservé aux grandes tailles (44px+). Cibles tactiles ≥44px (hitbox transparente élargie). Mute toujours visible, état persistant, focus visible (outline sauge 2px).
