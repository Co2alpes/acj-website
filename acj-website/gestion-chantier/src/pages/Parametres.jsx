// src/pages/Parametres.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ACJ_COLORS } from '../theme';

function Parametres() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: "ACJ DÉVELOPPEMENT",
    companyContact: "ALAIN BONO",
    companyAddress: "24 Avenue de la Libération, 33110 LE BOUSCAT",
    companyPhone: "06 00 00 00 00",
    companyEmail: "contact@acj-developpement.fr",
    companySiret: "",
    companyNaf: "",
    companyTva: "",
    companyLegalStatus: "SASU au capital de 1000€",
    companyBankName: "",
    companyIban: "FR76 ...",
    companyBic: "",
    companyOwner: ""
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "parametres", "entreprise");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Erreur chargement paramètres:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, "parametres", "entreprise");
      await setDoc(docRef, formData, { merge: true });
      alert("Paramètres enregistrés avec succès !");
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    page: { backgroundColor: '#F0F2F5', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif", paddingBottom: '50px' },
    topBar: { backgroundColor: ACJ_COLORS.BLUE, padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    backBtn: { background: 'none', border: 'none', color: 'white', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textTransform:'uppercase', opacity: 0.8 },
    title: { margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.2rem', fontWeight: '900' },
    main: { maxWidth: '800px', margin: '40px auto', padding: '0 20px' },
    card: { backgroundColor: 'white', borderRadius: '8px', padding: '30px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' },
    sectionTitle: { color: ACJ_COLORS.BLUE, borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px', textTransform:'uppercase', fontSize:'1rem', fontWeight:'bold' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem', color: '#555' },
    input: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', boxSizing:'border-box' },
    saveBtn: { backgroundColor: ACJ_COLORS.BLUE, color: 'white', padding: '12px 25px', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'block', width: '100%', marginTop: '30px', textTransform:'uppercase' }
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh', color: ACJ_COLORS.BLUE}}>Chargement...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
           <button onClick={() => navigate('/tableau-bord')} style={styles.backBtn}>← Retour</button>
           <h1 style={styles.title}>Paramètres Documents</h1>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.card}>
          <form onSubmit={handleSave}>
            
            <h3 style={styles.sectionTitle}>Identification Entreprise</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom de l'entreprise (En-tête)</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Adresse complète</label>
              <input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange} style={styles.input} />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom du contact</label>
                <input type="text" name="companyContact" value={formData.companyContact} onChange={handleChange} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Téléphone</label>
                <input type="text" name="companyPhone" value={formData.companyPhone} onChange={handleChange} style={styles.input} />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} style={styles.input} />
            </div>

            <h3 style={{...styles.sectionTitle, marginTop:'30px'}}>Mentions Légales</h3>
            <div style={styles.formGroup}>
               <label style={styles.label}>Statut Juridique (ex: SASU au capital de...)</label>
               <input type="text" name="companyLegalStatus" value={formData.companyLegalStatus} onChange={handleChange} style={styles.input} />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px'}}>
               <div style={styles.formGroup}>
                 <label style={styles.label}>SIRET</label>
                 <input type="text" name="companySiret" value={formData.companySiret} onChange={handleChange} style={styles.input} />
               </div>
               <div style={styles.formGroup}>
                 <label style={styles.label}>Code NAF/APE</label>
                 <input type="text" name="companyNaf" value={formData.companyNaf} onChange={handleChange} style={styles.input} />
               </div>
               <div style={styles.formGroup}>
                 <label style={styles.label}>TVA Intra.</label>
                 <input type="text" name="companyTva" value={formData.companyTva} onChange={handleChange} style={styles.input} />
               </div>
            </div>

            <h3 style={{...styles.sectionTitle, marginTop:'30px'}}>Coordonnées Bancaires (Pour Factures)</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom de la Banque</label>
              <input type="text" name="companyBankName" value={formData.companyBankName} onChange={handleChange} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Titulaire du compte</label>
              <input type="text" name="companyOwner" value={formData.companyOwner} onChange={handleChange} style={styles.input} />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
               <div style={styles.formGroup}>
                 <label style={styles.label}>IBAN</label>
                 <input type="text" name="companyIban" value={formData.companyIban} onChange={handleChange} style={styles.input} />
               </div>
               <div style={styles.formGroup}>
                 <label style={styles.label}>BIC</label>
                 <input type="text" name="companyBic" value={formData.companyBic} onChange={handleChange} style={styles.input} />
               </div>
            </div>

            <button type="submit" disabled={saving} style={styles.saveBtn}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Parametres;