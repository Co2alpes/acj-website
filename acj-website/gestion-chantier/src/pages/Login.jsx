// src/pages/Login.jsx
import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { ACJ_COLORS } from "../theme"; 
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/tableau-bord');
    } catch (err) {
      console.error("Erreur connexion email:", err);
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const connexionGoogle = async () => {
    setLoading(true);
    setError(null);
    try { 
      await signInWithPopup(auth, googleProvider);
      navigate('/tableau-bord');
    } catch (error) { 
      console.error("Erreur connexion Google:", error); 
      setError("Impossible de se connecter avec Google.");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F0F2F5',
      fontFamily: "'Montserrat', sans-serif"
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      backgroundColor: ACJ_COLORS.BLUE,
      padding: '40px 20px',
      textAlign: 'center',
      color: 'white'
    },
    logoText: {
        fontSize: '2rem',
        fontWeight: '900',
        margin: 0,
        textTransform: 'uppercase',
        letterSpacing: '2px',
        color: ACJ_COLORS.YELLOW
    },
    subText: {
        fontSize: '0.8rem', 
        textTransform: 'uppercase', 
        letterSpacing: '1px', 
        opacity: 0.9,
        marginTop: '10px',
        color: 'white'
    },
    body: {
      padding: '30px',
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#555'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '1rem',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
      fontFamily: 'inherit'
    },
    btnPrimary: {
      width: '100%',
      padding: '14px',
      backgroundColor: ACJ_COLORS.BLUE,
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginBottom: '10px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      opacity: loading ? 0.7 : 1
    },
    divider: {
      textAlign: 'center',
      margin: '20px 0',
      color: '#999',
      fontSize: '0.85rem',
      position: 'relative'
    },
    btnGoogle: {
      width: '100%',
      padding: '12px',
      backgroundColor: 'white',
      color: '#333',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    },
    error: {
      backgroundColor: '#FFEBEE',
      color: '#D32F2F',
      padding: '10px',
      borderRadius: '4px',
      fontSize: '0.9rem',
      marginBottom: '20px',
      textAlign: 'center'
    },
    backLink: {
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '0.9rem'
    },
    link: {
        color: ACJ_COLORS.BLUE,
        textDecoration: 'none',
        fontWeight: '600',
        cursor: 'pointer'
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
            <h1 style={styles.logoText}>ACJ</h1>
            <div style={styles.subText}>Espace Professionnel</div>
        </div>
        
        <div style={styles.body}>
          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleEmailLogin}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input 
                type="email" 
                placeholder="nom@entreprise.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required 
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Mot de passe</label>
              <input 
                type="password" 
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input} 
                required
              />
            </div>
            
            <button type="submit" style={styles.btnPrimary} disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div style={styles.divider}>OU</div>

          <button onClick={connexionGoogle} style={styles.btnGoogle} disabled={loading}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="Google" />
            Continuer avec Google
          </button>
          
          <div style={styles.backLink}>
              <span onClick={() => navigate('/')} style={styles.link}>← Retour au site</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;