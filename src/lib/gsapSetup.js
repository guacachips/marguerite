/* =========================================================================
   gsapSetup.js — register GSAP plugins once, in one place.
   GSAP 3.15 ships every plugin in the public package, so the full physical
   vision (Physics2D pollen, MotionPath falls, DrawSVG underline) is available.
   Always import gsap from THIS module so registration is guaranteed.
   ========================================================================= */
import gsap from 'gsap'
import { Physics2DPlugin } from 'gsap/Physics2DPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(Physics2DPlugin, MotionPathPlugin, DrawSVGPlugin, CustomEase)

// A couple of signature eases used across the experience.
if (!CustomEase.get?.('petalFall')) {
  CustomEase.create('petalFall', 'M0,0 C0.25,0 0.35,0.5 0.5,0.72 0.66,0.94 0.8,1 1,1')
}

export { gsap, Physics2DPlugin, MotionPathPlugin, DrawSVGPlugin, CustomEase }
export default gsap
