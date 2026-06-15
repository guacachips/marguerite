/* =========================================================================
   useParallax — a single smoothed pointer vector the layers read to drift at
   different depths. DESKTOP POINTER (mouse) only: no device-motion on mobile,
   so the experience never asks for the gyroscope / motion permission.
   Smoothing rides the shared gsap.ticker — no extra RAF loop.
   The vector is purely decorative; the ritual never depends on it.
   ========================================================================= */
import { useEffect, useRef } from 'react'
import gsap from './gsapSetup.js'

/**
 * @param {boolean} enabled  when false, targets ease back to center
 * @returns {{ vec: React.MutableRefObject<{tx:number,ty:number,cx:number,cy:number}> }}
 *   vec.cx / vec.cy are the smoothed pointer in [-1, 1]; multiply by a layer
 *   depth to offset it.
 */
export function useParallax(enabled = true) {
  const vec = useRef({ tx: 0, ty: 0, cx: 0, cy: 0 })
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    const onMouse = (e) => {
      if (!enabledRef.current) return
      const w = window.innerWidth || 1
      const h = window.innerHeight || 1
      vec.current.tx = (e.clientX / w) * 2 - 1
      vec.current.ty = (e.clientY / h) * 2 - 1
    }

    const smooth = () => {
      const v = vec.current
      // when disabled, the target is irrelevant — ease toward 0
      const tx = enabledRef.current ? v.tx : 0
      const ty = enabledRef.current ? v.ty : 0
      v.cx += (tx - v.cx) * 0.06
      v.cy += (ty - v.cy) * 0.06
    }

    window.addEventListener('mousemove', onMouse, { passive: true })
    gsap.ticker.add(smooth)

    return () => {
      window.removeEventListener('mousemove', onMouse)
      gsap.ticker.remove(smooth)
    }
  }, [])

  return { vec }
}
