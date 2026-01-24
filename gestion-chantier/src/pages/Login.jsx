// src/pages/Login.jsx
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { ACJ_COLORS } from "../theme"; 

function Login() {
  const connexionGoogle = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { console.error("Erreur connexion:", error); alert("Erreur de connexion"); }
  };

  const styles = {
    page: {
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ACJ_COLORS.BLUE,
      background: `linear-gradient(135deg, ${ACJ_COLORS.BLUE} 0%, #001a33 100%)`,
      fontFamily: "'Montserrat', sans-serif"
    },
    card: {
      backgroundColor: ACJ_COLORS.WHITE,
      borderRadius: '12px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      width: '90%',
      maxWidth: '450px'
    },
    header: {
      backgroundColor: ACJ_COLORS.BLUE,
      padding: '40px 30px 30px',
      color: ACJ_COLORS.WHITE,
      position: 'relative'
    },
    yellowLine: {
      position: 'absolute',
      bottom: 0, left: 0, width: '100%', height: '6px',
      backgroundColor: ACJ_COLORS.YELLOW
    },
    button: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px',
      width: '100%', padding: '15px',
      border: 'none', borderRadius: '8px',
      backgroundColor: ACJ_COLORS.BLUE,
      color: ACJ_COLORS.WHITE,
      fontSize: '1.1em', fontWeight: '700', cursor: 'pointer',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={{margin:0, fontSize:'1.8rem', fontWeight:'800', letterSpacing:'1px'}}>ESPACE INTERNE</h1>
          <p style={{margin:'5px 0 0', opacity:0.8}}>ACJ DÉVELOPPEMENT</p>
          <div style={styles.yellowLine}></div>
        </div>
        <div style={{padding: '40px 30px', textAlign: 'center'}}>
          <p style={{marginBottom: '30px', color: '#444', lineHeight:'1.5'}}>
            Bienvenue sur le portail de gestion de chantier.<br/>
            Veuillez vous identifier pour accéder aux dossiers.
          </p>
          <button onClick={connexionGoogle} style={styles.button}>
             Connexion Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;