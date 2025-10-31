import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './components/GroupPage.css'
import './components/PinEntry.css'
import './components/Toast.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
