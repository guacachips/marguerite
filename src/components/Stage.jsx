/* The portrait stage: a shakeable scene (L0–L3) under a stable UI layer. */
export default function Stage({ sceneRef, sceneClass = '', scene, ui }) {
  return (
    <div className="stage">
      <div className={`scene ${sceneClass}`.trim()} ref={sceneRef}>
        {scene}
      </div>
      <div className="ui-layer">{ui}</div>
    </div>
  )
}
