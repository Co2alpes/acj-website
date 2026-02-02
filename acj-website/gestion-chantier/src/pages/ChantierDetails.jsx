// src/pages/ChantierDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ACJ_COLORS } from '../theme';
import { pdf } from '@react-pdf/renderer';
import DocumentPDF from '../components/DocumentPDF';
import { Icon } from '@iconify/react';

function ChantierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chantier, setChantier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState({});
  
  const [newItem, setNewItem] = useState({ nom: '', quantite: 1, prix: 0 });
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchChantier = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "chantiers", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          // Initialisation des tableaux si manquants
          if (!data.materiaux) data.materiaux = [];
          if (!data.documents) data.documents = []; 
          setChantier(data);
          setFormData(data);
        } else {
          console.log("Document introuvable !");
          navigate('/tableau-bord');
        }
        
        // Load Company Settings
        const settingsSnap = await getDoc(doc(db, "parametres", "entreprise"));
        if (settingsSnap.exists()) {
           setCompanySettings(settingsSnap.data());
        }

      } catch (error) {
        console.error("Erreur de chargement:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChantier();
  }, [id, navigate]);

  // --- GESTION DES MATÉRIAUX ---
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.nom) return;
    const itemToAdd = { ...newItem, id: Date.now() };
    try {
      const docRef = doc(db, "chantiers", id);
      await updateDoc(docRef, { materiaux: arrayUnion(itemToAdd) });
      setChantier(prev => ({ ...prev, materiaux: [...prev.materiaux, itemToAdd] }));
      setNewItem({ nom: '', quantite: 1, prix: 0 });
    } catch (error) {
      console.error("Erreur ajout item:", error);
    }
  };

  const handleDeleteItem = async (item) => {
    if(!window.confirm("Supprimer cet élément ?")) return;
    try {
      const docRef = doc(db, "chantiers", id);
      await updateDoc(docRef, { materiaux: arrayRemove(item) });
      setChantier(prev => ({ ...prev, materiaux: prev.materiaux.filter(i => i.id !== item.id) }));
    } catch (error) {
      console.error("Erreur suppression item:", error);
    }
  };

  // --- GESTION DES FICHIERS ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `chantiers/${id}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const newDoc = {
        name: file.name,
        url: downloadURL,
        type: file.type,
        size: file.size,
        date: new Date().toISOString(),
        path: snapshot.metadata.fullPath
      };

      const docRef = doc(db, "chantiers", id);
      await updateDoc(docRef, { documents: arrayUnion(newDoc) });
      
      setChantier(prev => ({ ...prev, documents: [...prev.documents, newDoc] }));
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors de l'envoi du fichier.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileDoc) => {
    if(!window.confirm(`Supprimer le fichier "${fileDoc.name}" ?`)) return;

    try {
      if (fileDoc.path) {
        const fileRef = ref(storage, fileDoc.path);
        await deleteObject(fileRef).catch(e => console.warn("Fichier storage introuvable", e));
      }
      const docRef = doc(db, "chantiers", id);
      await updateDoc(docRef, { documents: arrayRemove(fileDoc) });
      setChantier(prev => ({ ...prev, documents: prev.documents.filter(d => d.url !== fileDoc.url) }));
    } catch (error) {
      console.error("Erreur suppression fichier:", error);
    }
  };

  const handleSaveInfo = async () => {
    try {
      const docRef = doc(db, "chantiers", id);
      await updateDoc(docRef, { ...formData });
      setChantier(formData);
      setEditMode(false);
    } catch (error) {
      console.error("Erreur mise à jour info:", error);
    }
  };

  // --- GÉNÉRATION PDF AUTOMATIQUE ---
  const handleGenerateAndSavePDF = async (type) => {
    if (!chantier) return;
    const confirmMsg = `Voulez-vous générer et enregistrer ${type === 'Devis' ? 'le devis' : 'la facture'} dans les fichiers du chantier ?`;
    if (!window.confirm(confirmMsg)) return;

    setUploading(true);
    try {
      // 1. Générer le Blob PDF
      const blob = await pdf(
        <DocumentPDF 
          type={type} 
          chantier={{...chantier, ...companySettings}} 
          materiaux={chantier.materiaux || []} 
          total={chantier.materiaux ? chantier.materiaux.reduce((acc, item) => acc + (Number(item.prix) * Number(item.quantite)), 0) : 0} 
        />
      ).toBlob();

      // 2. Nom du fichier
      const fileName = `${type}_${chantier.nom.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      // 3. Upload vers Storage
      const storageRef = ref(storage, `chantiers/${id}/${Date.now()}_${fileName}`);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 4. Enregistrer métadonnées
      const newDoc = {
        name: fileName,
        url: downloadURL,
        type: 'application/pdf',
        size: blob.size,
        date: new Date().toISOString(),
        path: snapshot.metadata.fullPath
      };

      const docRef = doc(db, "chantiers", id);
      await updateDoc(docRef, { documents: arrayUnion(newDoc) });
      setChantier(prev => ({ ...prev, documents: [...prev.documents, newDoc] }));

      // 5. Télécharger pour l'utilisateur
      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`${type} généré et enregistré avec succès !`);

    } catch (error) {
      console.error("Erreur génération PDF:", error);
      alert("Erreur lors de la génération du document.");
    } finally {
      setUploading(false);
    }
  };

  // --- STYLES & HELPERS ---
  const getFileIcon = (type) => {
    if (!type) return 'vscode-icons:default-file';
    if (type.includes('pdf')) return 'vscode-icons:file-type-pdf2';
    if (type.includes('image')) return 'vscode-icons:file-type-image';
    if (type.includes('word') || type.includes('document')) return 'vscode-icons:file-type-word';
    if (type.includes('excel') || type.includes('sheet')) return 'vscode-icons:file-type-excel';
    return 'vscode-icons:default-file';
  };

  const styles = {
    page: { backgroundColor: '#F0F2F5', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif", paddingBottom: '50px' },
    topBar: { backgroundColor: ACJ_COLORS.BLUE, padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    backBtn: { background: 'none', border: 'none', color: 'white', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textTransform:'uppercase', opacity: 0.8 },
    title: { margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.2rem', fontWeight: '900' },
    main: { maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' },
    card: { backgroundColor: 'white', borderRadius: '8px', padding: '30px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', position: 'relative' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f0f0f0', paddingBottom: '15px', marginBottom: '25px' },
    h2: { margin: 0, color: ACJ_COLORS.BLUE, fontSize: '1.1rem', textTransform: 'uppercase', fontWeight: '800' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    th: { textAlign: 'left', padding: '15px', borderBottom: `2px solid ${ACJ_COLORS.BLUE}`, color: ACJ_COLORS.BLUE, fontWeight: '700', textTransform:'uppercase', fontSize:'0.75rem' },
    td: { padding: '15px', borderBottom: '1px solid #eee', color: '#555' },
    input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
    btn: { padding: '10px 20px', backgroundColor: ACJ_COLORS.BLUE, color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.8rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
    statusBadge: (s) => ({ padding: '5px 12px', borderRadius: '20px', backgroundColor: s==='Terminé'?'#E8F5E9':s==='En cours'?'#FFF3E0':'#FFEBEE', color: s==='Terminé'?'#2E7D32':s==='En cours'?'#EF6C00':'#C62828', fontWeight:'bold', fontSize:'0.8rem', textTransform:'uppercase' }),
    totalRow: { display: 'flex', justifyContent: 'flex-end', gap: '30px', marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #eee', fontSize: '1.1rem', fontWeight: 'bold', color: ACJ_COLORS.BLUE },
    fileItem: { display: 'flex', alignItems: 'center', padding: '12px 15px', backgroundColor: '#F8F9FA', borderRadius: '6px', marginBottom: '10px', border: '1px solid #eee', transition: 'all 0.2s' }
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh', color: ACJ_COLORS.BLUE}}>Chargement...</div>;
  if (!chantier) return null;

  const totalHT = chantier.materiaux ? chantier.materiaux.reduce((acc, item) => acc + (Number(item.prix) * Number(item.quantite)), 0) : 0;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
           <button onClick={() => navigate('/tableau-bord')} style={styles.backBtn}>← Retour</button>
           <h1 style={styles.title}>{chantier.nom}</h1>
        </div>
        <div style={styles.statusBadge(chantier.statut)}>{chantier.statut}</div>
      </div>

      <div style={styles.main}>
        {/* COLONNE GAUCHE : MATERIAUX & FICHIERS */}
        <div style={{display:'flex', flexDirection:'column', gap:'30px'}}>
          
          {/* CARTE MATÉRIAUX */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.h2}>Détail de la prestation</h2>
            </div>
            
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Désignation</th>
                  <th style={styles.th} width="80">Qté</th>
                  <th style={styles.th} width="100">PU HT</th>
                  <th style={styles.th} width="100">Total HT</th>
                  <th style={styles.th} width="50"></th>
                </tr>
              </thead>
              <tbody>
                {chantier.materiaux && chantier.materiaux.map((item, idx) => (
                  <tr key={idx}>
                    <td style={styles.td}>{item.nom}</td>
                    <td style={styles.td}>{item.quantite}</td>
                    <td style={styles.td}>{Number(item.prix).toLocaleString()} €</td>
                    <td style={{...styles.td, fontWeight:'bold'}}>{(Number(item.quantite)*Number(item.prix)).toLocaleString()} €</td>
                    <td style={styles.td}><button onClick={()=>handleDeleteItem(item)} style={{border:'none', background:'none', color:'#e57373', cursor:'pointer', fontSize:'1.2rem'}}>×</button></td>
                  </tr>
                ))}
                <tr style={{backgroundColor:'#f9f9f9'}}>
                   <td style={styles.td}><input type="text" placeholder="Ajouter..." value={newItem.nom} onChange={e=>setNewItem({...newItem, nom:e.target.value})} style={styles.input} /></td>
                   <td style={styles.td}><input type="number" min="1" value={newItem.quantite} onChange={e=>setNewItem({...newItem, quantite:e.target.value})} style={styles.input} /></td>
                   <td style={styles.td}><input type="number" step="0.01" value={newItem.prix} onChange={e=>setNewItem({...newItem, prix:e.target.value})} style={styles.input} /></td>
                   <td style={styles.td}></td>
                   <td style={styles.td}><button onClick={handleAddItem} style={{border:'none', background:ACJ_COLORS.BLUE, color:'white', width:'30px', height:'30px', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>+</button></td>
                </tr>
              </tbody>
            </table>

            <div style={styles.totalRow}>
              <span>Total HT : {totalHT.toLocaleString()} €</span>
              <span>TTC : {(totalHT * 1.2).toLocaleString()} €</span>
            </div>
          </div>

          {/* CARTE FICHIERS JOINTS */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.h2}>Fichiers Joints</h2>
              <div style={{position:'relative', overflow:'hidden', display:'inline-block'}}>
                <button style={{...styles.btn, fontSize:'0.75rem', padding:'8px 15px'}} disabled={uploading}>
                  {uploading ? 'Envoi...' : '+ Ajouter Fichier'}
                </button>
                <input 
                  type="file" 
                  onChange={handleFileUpload} 
                  disabled={uploading}
                  style={{position:'absolute', left:0, top:0, opacity:0, width:'100%', height:'100%', cursor:'pointer'}} 
                />
              </div>
            </div>
            
            {chantier.documents && chantier.documents.length > 0 ? (
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                {chantier.documents.map((doc, idx) => (
                  <div key={idx} style={styles.fileItem}>
                    <Icon icon={getFileIcon(doc.type)} width="30" style={{marginRight: '15px'}} />
                    <div style={{flex:1, overflow:'hidden'}}>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none', color:'#333', fontWeight:'600', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.9rem'}}>
                        {doc.name}
                      </a>
                      <div style={{fontSize:'0.75rem', color:'#999'}}>{new Date(doc.date).toLocaleDateString()}</div>
                    </div>
                    <button onClick={()=>handleDeleteFile(doc)} style={{border:'none', background:'none', color:'#e57373', cursor:'pointer', padding:'5px'}}>🗑️</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center', color:'#999', padding:'20px', fontStyle:'italic'}}>
                Aucun document joint pour le moment.
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : INFOS & ACTIONS */}
        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
          
          {/* CARTE CLIENT */}
          <div style={styles.card}>
            <div style={{...styles.cardHeader, borderBottom:'none', marginBottom:'10px'}}>
               <h2 style={styles.h2}>Client</h2>
               <button onClick={()=>setEditMode(!editMode)} style={{border:'none', background:'none', color:ACJ_COLORS.BLUE, textDecoration:'underline', cursor:'pointer', fontSize:'0.8rem'}}>
                 {editMode ? 'Fermer' : 'Modifier'}
               </button>
            </div>
            
            {editMode ? (
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <input type="text" placeholder="Nom" value={formData.clientNom || ''} onChange={e=>setFormData({...formData, clientNom:e.target.value})} style={styles.input} />
                <input type="text" placeholder="Adresse" value={formData.ville || ''} onChange={e=>setFormData({...formData, ville:e.target.value})} style={styles.input} />
                <select value={formData.statut} onChange={e=>setFormData({...formData, statut:e.target.value})} style={styles.input}>
                  <option>Devis</option><option>En cours</option><option>Terminé</option><option>Urgent</option>
                </select>
                <button onClick={handleSaveInfo} style={{...styles.btn, marginTop:'10px'}}>Enregistrer</button>
              </div>
            ) : (
              <div style={{fontSize:'0.9rem', color:'#555', lineHeight:'1.6'}}>
                <strong style={{color:'#333', fontSize:'1rem'}}>{chantier.clientNom || 'Client Inconnu'}</strong><br/>
                {chantier.ville}<br/>
                <div style={{marginTop:'15px', color:ACJ_COLORS.BLUE, fontWeight:'bold', fontSize:'0.8rem'}}>
                   Dossier du {new Date(chantier.date_creation?.seconds * 1000).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* CARTE ACTIONS DOCUMENTS */}
          <div style={styles.card}>
             <h2 style={{...styles.h2, marginBottom:'20px'}}>Devis & Factures</h2>
             <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                <button 
                  onClick={() => handleGenerateAndSavePDF('Devis')} 
                  disabled={uploading}
                  style={{...styles.btn, width:'100%', backgroundColor: '#fff', color: ACJ_COLORS.BLUE, border:`2px solid ${ACJ_COLORS.BLUE}`}}
                >
                  {uploading ? 'Génération...' : '💾 Créer & Enregistrer Devis'}
                </button>

                <button 
                  onClick={() => handleGenerateAndSavePDF('Facture')} 
                  disabled={uploading}
                  style={{...styles.btn, width:'100%'}}
                >
                  {uploading ? 'Génération...' : '💾 Créer & Enregistrer Facture'}
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ChantierDetails;