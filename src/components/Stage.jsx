/* The portrait stage: a shakeable scene (L0–L3) under a stable UI layer. */
export default function Stage({ sceneRef, sceneClass = '', onScenePointerDown, scene, ui }) {
  return (
    <div className="stage">
      <div
        className={`scene ${sceneClass}`.trim()}
        ref={sceneRef}
        onPointerDown={onScenePointerDown}
      >
        {scene}
      </div>
      <div className="ui-layer">{ui}</div>
    </div>
  )
}
