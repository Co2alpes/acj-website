// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { ACJ_COLORS } from './theme';

import LandingPage from './pages/LandingPage';
import TableauBord from './pages/TableauBord';
import ChantierDetails from './pages/ChantierDetails';
import Parametres from './pages/Parametres';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // --- Gestion de l'état d'authentification ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Fonction de Déconnexion ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  // --- Protection des routes ---
  const RequireAuth = ({ children }) => {
    if (authLoading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', color:ACJ_COLORS.BLUE}}>Chargement...</div>;
    
    if (!user) {
      // Rediriger vers login si non connecté, sauf si on est sur la landing page
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  if (authLoading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', color:ACJ_COLORS.BLUE}}>Chargement de l'application...</div>;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/tableau-bord" /> : <Login />} />
      
      <Route 
        path="/tableau-bord" 
        element={
          <RequireAuth>
            <TableauBord user={user} onLogout={handleLogout} />
          </RequireAuth>
        } 
      />
      
      <Route 
        path="/chantier/:id" 
        element={
          <RequireAuth>
            <ChantierDetails user={user} />
          </RequireAuth>
        } 
      />

      <Route 
        path="/parametres" 
        element={
          <RequireAuth>
            <Parametres user={user} />
          </RequireAuth>
        } 
      />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;