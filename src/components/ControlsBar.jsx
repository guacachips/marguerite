/* A single, always-visible, keyboard-accessible mute toggle (top-right). */
export default function ControlsBar({ muted, onToggleMute }) {
  return (
    <div className="controls">
      <button
        className="mute-btn"
        onClick={onToggleMute}
        aria-pressed={muted}
        aria-label={muted ? 'Activer le son' : 'Couper le son'}
        title={muted ? 'Activer le son' : 'Couper le son'}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M4 9.5h3.2L11 6v12l-3.8-3.5H4z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {muted ? (
            <path
              d="M16 9l5 6M21 9l-5 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ) : (
            <>
              <path
                d="M15 9.2a4 4 0 0 1 0 5.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M17.6 7a7.5 7.5 0 0 1 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}
