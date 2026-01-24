// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import TableauBord from './pages/TableauBord';
import ChantierDetails from './pages/ChantierDetails';

function App() {
  const [user, setUser] = useState(null); 
  const navigate = useNavigate();
  const location = useLocation();

  // Fonction de Connexion
  const handleLogin = () => {
    setUser({ name: "Demo User", role: "admin" });
    navigate('/tableau-bord');
  };

  // --- NOUVEAU : Fonction de Déconnexion ---
  const handleLogout = () => {
    setUser(null); // On vide l'utilisateur
    navigate('/'); // On retourne à l'accueil
  };

  // Protection simple : Si on n'est pas connecté et qu'on est sur une page privée, on renvoie à l'accueil
  useEffect(() => {
    if (!user && location.pathname !== '/') {
      navigate('/');
    }
  }, [user, location, navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage onLogin={handleLogin} />} />
      
      {/* On passe la fonction onLogout au tableau de bord */}
      <Route 
        path="/tableau-bord" 
        element={<TableauBord user={user} onLogout={handleLogout} />} 
      />
      
      {/* On peut aussi passer onLogout au détail chantier si besoin, ou juste utiliser le bouton retour */}
      <Route 
        path="/chantier/:id" 
        element={<ChantierDetails user={user} />} 
      />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;