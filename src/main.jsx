import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/theme.css'
import './styles/global.css'

// Note: intentionally NOT wrapped in <StrictMode>. The experience drives GSAP
// timelines and a Tone.js audio graph imperatively; StrictMode's double-invoke
// of effects in dev would spin up the audio context and animations twice.
createRoot(document.getElementById('root')).render(<App />)
