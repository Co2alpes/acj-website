// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Si vous avez un fichier CSS global
import { BrowserRouter } from 'react-router-dom' // <--- IMPORTANT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <--- AJOUTEZ CECI AUTOUR DE APP */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)