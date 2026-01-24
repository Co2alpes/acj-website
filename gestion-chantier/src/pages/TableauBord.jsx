// src/pages/TableauBord.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ACJ_COLORS } from '../theme';

// CALENDRIER
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import fr from 'date-fns/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// GRAPHIQUES & CARTE
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const locales = { 'fr': fr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// --- UTILITAIRES JOURS FÉRIÉS ---
const getEaster = (year) => {
  const f = Math.floor, G = year % 19, C = f(year / 100), H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30, I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)), J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7, L = I - J, month = 3 + f((L + 40) / 44), day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
};

// Retourne une liste d'objets { date, nom }
const getJoursFeriesData = (year) => {
  const paques = getEaster(year);
  const lundiPaques = new Date(paques); lundiPaques.setDate(paques.getDate() + 1);
  const ascension = new Date(paques); ascension.setDate(paques.getDate() + 39);
  const pentecote = new Date(paques); pentecote.setDate(paques.getDate() + 50);

  return [
    { date: new Date(year, 0, 1), name: "Jour de l'an" },
    { date: new Date(year, 4, 1), name: "Fête du Travail" },
    { date: new Date(year, 4, 8), name: "Victoire 1945" },
    { date: new Date(year, 6, 14), name: "Fête Nationale" },
    { date: new Date(year, 7, 15), name: "Assomption" },
    { date: new Date(year, 10, 1), name: "Toussaint" },
    { date: new Date(year, 10, 11), name: "Armistice 1918" },
    { date: new Date(year, 11, 25), name: "Noël" },
    { date: lundiPaques, name: "Lundi de Pâques" },
    { date: ascension, name: "Ascension" },
    { date: pentecote, name: "Lundi de Pentecôte" }
  ];
};

const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

function TableauBord({ user, onLogout }) {
  const navigate = useNavigate();

  // --- ÉTATS ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [allChantiers, setAllChantiers] = useState([]);
  const [events, setEvents] = useState([]); // Événements BDD
  const [globalSearch, setGlobalSearch] = useState('');

  // FORMULAIRES
  const [nouveauClient, setNouveauClient] = useState('');
  const [nomChantier, setNomChantier] = useState('');
  const [villeChantier, setVilleChantier] = useState('');
  const [coordsChantier, setCoordsChantier] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityList, setShowCityList] = useState(false);
  const [montantChantier, setMontantChantier] = useState('');
  const [statutChantier, setStatutChantier] = useState('En cours');
  const [dateFacturation, setDateFacturation] = useState('');

  // PLANNING
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ 
    title: '', startDate: '', startTime: '08:00', endDate: '', endTime: '17:00', type: 'Chantier' 
  });
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState(Views.MONTH);

  // CHARGEMENT
  useEffect(() => {
    const unsubEvents = onSnapshot(query(collection(db, "planning")), (s) => setEvents(s.docs.map(d => ({ 
      id: d.id, 
      title: d.data().title, 
      start: d.data().start?.toDate ? d.data().start.toDate() : new Date(d.data().start), 
      end: d.data().end?.toDate ? d.data().end.toDate() : new Date(d.data().end), 
      type: d.data().type || 'Chantier',
      allDay: false
    }))));
    const unsubClients = onSnapshot(query(collection(db, "clients"), orderBy("nom", "asc")), (s) => setClients(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubAll = onSnapshot(query(collection(db, "chantiers"), orderBy("date_creation", "desc")), (s) => { const data = s.docs.map(d => ({ id: d.id, ...d.data() })); setAllChantiers(data); });
    return () => { unsubEvents(); unsubClients(); unsubAll(); };
  }, []);

  useEffect(() => {
    if (selectedClient) setChantiers(selectedClient.id === 'orphan' ? allChantiers.filter(c => !c.clientId) : allChantiers.filter(c => c.clientId === selectedClient.id));
    else setChantiers(globalSearch ? allChantiers.filter(c => c.nom.toLowerCase().includes(globalSearch.toLowerCase()) || c.ville.toLowerCase().includes(globalSearch.toLowerCase())) : allChantiers);
  }, [selectedClient, allChantiers, globalSearch]);

  // LOGIQUE VILLE
  const searchCities = async (input) => { setVilleChantier(input); if (input.length > 2) { try { const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${input}&type=municipality&limit=5`); const d = await r.json(); if (d.features) { setCitySuggestions(d.features.map(f => ({ label: `${f.properties.name} (${f.properties.postcode.substring(0,2)})`, value: f.properties.name, coords: f.geometry.coordinates }))); setShowCityList(true); } } catch (e) { console.error(e); } } else setShowCityList(false); };
  const selectCity = (city) => { setVilleChantier(city.value); setCoordsChantier(city.coords); setShowCityList(false); };

  // KPI
  const caFacture = allChantiers.filter(c => c.statut === 'Terminé').reduce((a, c) => a + (Number(c.montant) || 0), 0);
  const caEnCours = allChantiers.filter(c => c.statut === 'En cours').reduce((a, c) => a + (Number(c.montant) || 0), 0);
  const graphData = Object.values(allChantiers.reduce((acc, curr) => {
    const d = curr.date_facturation ? new Date(curr.date_facturation) : new Date(); const k = `${d.getFullYear()}-${d.getMonth()}`; const lbl = d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
    if (!acc[k]) acc[k] = { name: lbl, Facturé: 0, Prévisionnel: 0, sort: k };
    curr.statut === 'Terminé' ? acc[k].Facturé += (Number(curr.montant)||0) : acc[k].Prévisionnel += (Number(curr.montant)||0);
    return acc;
  }, {})).sort((a,b) => a.sort.localeCompare(b.sort));

  // ACTIONS
  const creerClient = async (e) => { e.preventDefault(); if(!nouveauClient) return; await addDoc(collection(db, "clients"), { nom: nouveauClient, date_creation: new Date() }); setNouveauClient(''); };
  const supprimerClient = async (e, id) => { e?.stopPropagation(); if(window.confirm("Supprimer ?")) { await deleteDoc(doc(db, "clients", id)); if (selectedClient?.id === id) setSelectedClient(null); } };
  const supprimerChantier = async (e, id) => { e.stopPropagation(); if(window.confirm("Supprimer l'affaire ?")) await deleteDoc(doc(db, "chantiers", id)); };
  const ajouterChantier = async (e) => { e.preventDefault(); await addDoc(collection(db, "chantiers"), { nom: nomChantier, ville: villeChantier, clientId: selectedClient.id==='orphan'?null:selectedClient.id, clientNom: selectedClient.id==='orphan'?'Non classé':selectedClient.nom, date_creation: new Date(), statut: statutChantier, montant: Number(montantChantier)||0, date_facturation: dateFacturation, latitude: coordsChantier?coordsChantier[1]:null, longitude: coordsChantier?coordsChantier[0]:null }); setNomChantier(''); setVilleChantier(''); setCoordsChantier(null); };
  
  // PLANNING
  const handleSelectSlot = ({ start, end }) => { 
    const sDate = start.toISOString().split('T')[0]; const eDate = end.toISOString().split('T')[0];
    const sTime = start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 ? '08:00' : start.toTimeString().slice(0,5);
    const eTime = end.getHours() === 0 && end.getMinutes() === 0 ? '17:00' : end.toTimeString().slice(0,5);
    setNewEvent({ title: '', startDate: sDate, startTime: sTime, endDate: eDate, endTime: eTime, type: 'Chantier' }); 
    setShowEventModal(true); 
  };
  
  const saveEvent = async (e) => { e.preventDefault(); const start = new Date(`${newEvent.startDate}T${newEvent.startTime}`); const end = new Date(`${newEvent.endDate}T${newEvent.endTime}`); await addDoc(collection(db, "planning"), { title: newEvent.title, start, end, type: newEvent.type }); setShowEventModal(false); };
  
  const handleSelectEvent = async (evt) => { 
    // On empêche la suppression des jours fériés générés automatiquement
    if (evt.type === 'Ferié') return;
    if(window.confirm(`Supprimer "${evt.title}" ?`)) await deleteDoc(doc(db, "planning", evt.id)); 
  };
  
  const onNavigate = useCallback((newDate) => setCalendarDate(newDate), [setCalendarDate]);
  const onView = useCallback((newView) => setCalendarView(newView), [setCalendarView]);

  // --- NOUVEAU : GÉNÉRATION DES ÉVÉNEMENTS FÉRIÉS ---
  const holidayEvents = useMemo(() => {
    // On génère pour l'année en cours, précédente et suivante pour être sûr
    const currentYear = calendarDate.getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];
    let feries = [];

    years.forEach(y => {
      const data = getJoursFeriesData(y);
      const yearEvents = data.map((item, index) => ({
        id: `ferie-${y}-${index}`, // ID unique virtuel
        title: `🇫🇷 ${item.name}`, // Drapeau pour le style
        start: item.date,
        end: item.date,
        allDay: true,
        type: 'Ferié' // Type Spécial
      }));
      feries = [...feries, ...yearEvents];
    });
    return feries;
  }, [calendarDate]);

  // Fusion des événements BDD et Fériés
  const allCalendarEvents = [...events, ...holidayEvents];

  // STYLES
  const eventStyleGetter = (event) => {
    let backgroundColor = ACJ_COLORS.BLUE;
    let color = 'white';
    
    switch (event.type) { 
      case 'Visite': backgroundColor = '#2E7D32'; break; 
      case 'Réunion': backgroundColor = '#EF6C00'; break; 
      case 'Bureau': backgroundColor = '#757575'; break; 
      case 'Ferié': // Nouveau Style pour Férié
        backgroundColor = '#FFCDD2'; // Fond rouge très clair
        color = '#B71C1C'; // Texte rouge foncé
        break;
      default: backgroundColor = ACJ_COLORS.BLUE; 
    }

    return { 
      style: { 
        backgroundColor, 
        color,
        borderRadius: '6px', 
        opacity: event.type === 'Ferié' ? 1 : 0.9, 
        border: event.type === 'Ferié' ? '1px solid #E57373' : 'none', 
        display: 'block', 
        fontSize: '0.8rem', 
        padding: '4px 8px', 
        boxShadow: event.type === 'Ferié' ? 'none' : '0 2px 4px rgba(0,0,0,0.15)',
        fontWeight: event.type === 'Ferié' ? 'bold' : 'normal',
        pointerEvents: event.type === 'Ferié' ? 'none' : 'auto' // Non cliquable
      } 
    };
  };

  const dayPropGetter = useCallback((date) => {
    const feries = getJoursFeriesData(date.getFullYear()).map(f => f.date);
    const isFerie = feries.some(f => isSameDay(f, date));
    if (isFerie) return { style: { backgroundColor: '#FFEBEE', color: '#C62828', fontWeight: 'bold' } };
    return {};
  }, []);

  const handleLogout = () => { navigate('/'); };

  const styles = {
    layout: { display: 'flex', height: '100vh', backgroundColor: '#F0F2F5', fontFamily: "'Montserrat', sans-serif", overflow: 'hidden' },
    sidebar: { width: '270px', backgroundColor: ACJ_COLORS.BLUE, color: 'white', padding: '40px 25px', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '4px 0 20px rgba(0,0,0,0.1)' },
    logo: { fontSize: '1.5rem', fontWeight: '900', color: 'white', marginBottom: '60px', letterSpacing: '2px', textTransform:'uppercase' },
    menuItem: (isActive) => ({ padding: '15px 20px', margin: '10px 0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '1px', backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', color: isActive ? ACJ_COLORS.YELLOW : 'rgba(255,255,255,0.7)', borderLeft: isActive ? `4px solid ${ACJ_COLORS.YELLOW}` : '4px solid transparent' }),
    logoutButton: { marginTop: '10px', padding: '12px 20px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffcdd2', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '1px' },
    main: { flex: 1, padding: '40px', overflowY: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    pageTitle: { fontSize: '2rem', fontWeight: '800', color: '#1a1a1a', margin: 0, textTransform: 'uppercase', letterSpacing:'-1px' },
    searchBar: { backgroundColor: 'white', padding: '12px 25px', borderRadius: '50px', border: '1px solid #e0e0e0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', width: '350px', outline: 'none', fontFamily: 'inherit' },
    input: { padding: '12px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', boxSizing:'border-box', marginBottom:'15px', backgroundColor:'#FAFAFA', fontFamily:'inherit' },
    select: { padding: '12px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', marginBottom:'15px', backgroundColor:'#FAFAFA', fontFamily:'inherit' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '30px' },
    card: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', position: 'relative', border: '1px solid #f0f0f0' },
    kpiLabel: { fontSize: '0.85rem', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing:'1px', marginBottom:'5px' },
    kpiValue: { fontSize: '2.2rem', fontWeight: '900', color: ACJ_COLORS.BLUE },
    btnPrimary: { padding: '12px 25px', backgroundColor: ACJ_COLORS.YELLOW, color: ACJ_COLORS.BLUE, border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', width:'100%', textTransform:'uppercase', letterSpacing:'1px', transition:'transform 0.2s', boxShadow: '0 4px 10px rgba(255, 193, 7, 0.3)' },
    tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', padding: '18px 15px', alignItems: 'center', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', transition: 'all 0.2s', ':hover': { backgroundColor: '#F8F9FA', transform:'translateX(5px)' } },
    badge: (status) => { let bg = '#eee'; let col = '#555'; if(status === 'Terminé') { bg = '#E8F5E9'; col = '#2E7D32'; } if(status === 'En cours') { bg = '#FFF3E0'; col = '#EF6C00'; } if(status === 'Urgent') { bg = '#FFEBEE'; col = '#C62828'; } return { padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: bg, color: col, width: 'fit-content', textTransform:'uppercase' }; },
    folderCard: { backgroundColor: 'white', border: `1px solid #eee`, borderRadius: '12px', padding: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent:'center', cursor: 'pointer', position: 'relative', height: '160px', boxShadow: '0 5px 15px rgba(0,0,0,0.03)', transition: 'all 0.3s' },
    folderIcon: { fontSize: '3rem', marginBottom: '10px', color: ACJ_COLORS.YELLOW },
    suggestionsBox: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #eee', borderRadius: '0 0 8px 8px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' },
    suggestionItem: { padding: '12px', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid #f0f0f0', color: '#555' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(13, 71, 161, 0.4)', backdropFilter:'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
    modalContent: { backgroundColor: 'white', padding: '40px', borderRadius: '12px', width: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }
  };

  const handleSidebarClick = (view) => { setCurrentView(view); setSelectedClient(null); };

  return (
    <div style={styles.layout}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800;900&display=swap');
        .rbc-toolbar { margin-bottom: 20px; }
        .rbc-toolbar-label { font-size: 1.2rem; font-weight: 800; color: ${ACJ_COLORS.BLUE}; text-transform: uppercase; }
        .rbc-btn-group button { border: none; background-color: white; color: #555; font-weight: 600; padding: 8px 15px; border-radius: 20px !important; margin: 0 3px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: all 0.2s; cursor:pointer; }
        .rbc-btn-group button:hover, .rbc-btn-group button.rbc-active { background-color: ${ACJ_COLORS.BLUE}; color: white; box-shadow: 0 4px 10px rgba(13, 71, 161, 0.3); }
        .rbc-btn-group button:focus { outline: none; }
        .rbc-header { padding: 15px 0; font-size: 0.8rem; font-weight: 800; color: ${ACJ_COLORS.BLUE}; text-transform: uppercase; border-bottom: 2px solid ${ACJ_COLORS.YELLOW} !important; }
        .rbc-calendar { background-color: #fdfdfd; border-radius: 12px; }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #eaeaea; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid #eaeaea; }
        .rbc-off-range-bg { background-color: #f4f4f4; }
        .rbc-today { background-color: #FFFDE7 !important; }
        .rbc-date-cell { padding: 8px; font-weight: 600; color: #555; font-size: 0.9rem; }
        .rbc-off-range .rbc-date-cell { color: #bbb; }
        .rbc-event { border: none !important; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
      `}</style>

      {/* MODALE PLANNING */}
      {showEventModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEventModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{margin:'0 0 25px 0', color: ACJ_COLORS.BLUE, textTransform:'uppercase'}}>Nouveau Rendez-vous</h3>
            <form onSubmit={saveEvent}>
              <label style={styles.kpiLabel}>Titre</label><input type="text" autoFocus required style={styles.input} value={newEvent.title} onChange={e=>setNewEvent({...newEvent, title:e.target.value})} placeholder="Nom du chantier ou rdv..." />
              <div style={{display:'flex', gap:'10px'}}>
                <div style={{flex:1}}><label style={styles.kpiLabel}>Du</label><input type="date" required style={styles.input} value={newEvent.startDate} onChange={e=>setNewEvent({...newEvent, startDate:e.target.value})} /></div>
                <div style={{flex:1}}><label style={styles.kpiLabel}>Au</label><input type="date" required style={styles.input} value={newEvent.endDate} onChange={e=>setNewEvent({...newEvent, endDate:e.target.value})} /></div>
              </div>
              <div style={{display:'flex', gap:'10px'}}>
                <div style={{flex:1}}><label style={styles.kpiLabel}>Heure Début</label><input type="time" required style={styles.input} value={newEvent.startTime} onChange={e=>setNewEvent({...newEvent, startTime:e.target.value})} /></div>
                <div style={{flex:1}}><label style={styles.kpiLabel}>Heure Fin</label><input type="time" required style={styles.input} value={newEvent.endTime} onChange={e=>setNewEvent({...newEvent, endTime:e.target.value})} /></div>
              </div>
              <label style={styles.kpiLabel}>Type d'activité</label>
              <select style={styles.select} value={newEvent.type} onChange={e=>setNewEvent({...newEvent, type:e.target.value})}>
                <option>Chantier</option><option>Visite</option><option>Réunion</option><option>Bureau</option>
              </select>
              <div style={{display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'20px'}}>
                <button type="button" onClick={() => setShowEventModal(false)} style={{padding:'10px 20px', border:'none', background:'#eee', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Annuler</button>
                <button type="submit" style={{...styles.btnPrimary, width:'auto'}}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>ACJ PRO</div>
        <div style={styles.menuItem(currentView === 'dashboard')} onClick={() => handleSidebarClick('dashboard')}>📊 Tableau de Bord</div>
        <div style={styles.menuItem(currentView === 'map')} onClick={() => handleSidebarClick('map')}>🗺️ Carte Chantiers</div>
        <div style={styles.menuItem(currentView === 'planning')} onClick={() => handleSidebarClick('planning')}>📅 Planning</div>
        <div style={styles.menuItem(currentView === 'clients')} onClick={() => handleSidebarClick('clients')}>📂 Dossiers</div>
        <div style={{marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'15px', color:'white', marginBottom: '15px'}}><div style={{width:'40px', height:'40px', borderRadius:'50%', background:'white', color:ACJ_COLORS.BLUE, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>A</div><div><div style={{fontWeight:'bold'}}>ADMIN</div><div style={{fontSize:'0.7rem', opacity:0.7, cursor:'pointer'}} onClick={()=>window.open('https://mail.google.com')}>📧 Ouvrir Gmail</div></div></div>
          <button onClick={onLogout} style={styles.logoutButton}>🚪 Déconnexion</button>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>{selectedClient ? selectedClient.nom : (currentView === 'dashboard' ? 'Vue d\'ensemble' : currentView === 'map' ? 'Carte' : currentView === 'planning' ? 'Planning' : 'Dossiers')}</h2>
            {selectedClient && <button onClick={() => setSelectedClient(null)} style={{background:'none', border:'none', color:ACJ_COLORS.BLUE, cursor:'pointer', fontWeight:'800', padding:0, marginTop:5, textTransform:'uppercase'}}>← Retour Liste</button>}
          </div>
          <input type="text" placeholder="🔍 Rechercher une affaire..." style={styles.searchBar} value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} />
        </div>

        {/* CONTENU PRINCIPAL */}
        {currentView === 'dashboard' && (
          <>
            <div style={styles.grid}>
              <div style={styles.card}><div style={styles.kpiLabel}>CA Facturé</div><div style={styles.kpiValue}>{caFacture.toLocaleString()} €</div></div>
              <div style={styles.card}><div style={styles.kpiLabel}>En Production</div><div style={styles.kpiValue}>{caEnCours.toLocaleString()} €</div></div>
              <div style={styles.card}><div style={styles.kpiLabel}>Dossiers Actifs</div><div style={styles.kpiValue}>{allChantiers.length}</div></div>
            </div>
            <div style={styles.card}>
              <h3 style={{marginTop:0, color:ACJ_COLORS.BLUE, textTransform:'uppercase'}}>Performance</h3>
              <div style={{height: '300px'}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={graphData}><defs><linearGradient id="cR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACJ_COLORS.BLUE} stopOpacity={0.8}/><stop offset="95%" stopColor={ACJ_COLORS.BLUE} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Area type="monotone" dataKey="Facturé" stroke={ACJ_COLORS.BLUE} fill="url(#cR)" /><Area type="monotone" dataKey="Prévisionnel" stroke={ACJ_COLORS.YELLOW} fill="#FFF9C4" /></AreaChart></ResponsiveContainer></div>
            </div>
            <div style={{...styles.card, marginTop:'25px'}}>
              <h3 style={{marginTop:0, color:ACJ_COLORS.BLUE, textTransform:'uppercase', marginBottom:'20px'}}>Dernières Affaires</h3>
              {allChantiers.slice(0, 5).map(c => (
                <div key={c.id} style={styles.tableRow} onClick={() => navigate(`/chantier/${c.id}`)}>
                  <div style={{fontWeight:'bold', color:'#333'}}>{c.nom}<br/><span style={{fontSize:'0.75rem', fontWeight:'normal', color:'#999'}}>{c.ville}</span></div>
                  <div>{c.clientNom}</div><div style={{fontWeight:'bold'}}>{Number(c.montant).toLocaleString()} €</div><div style={styles.badge(c.statut)}>{c.statut}</div>
                  <button onClick={(e) => supprimerChantier(e, c.id)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'#e0e0e0', transition:'color 0.2s'}} onMouseEnter={e=>e.target.style.color='red'} onMouseLeave={e=>e.target.style.color='#e0e0e0'}>×</button>
                </div>
              ))}
            </div>
          </>
        )}

        {currentView === 'map' && (
          <div style={{...styles.card, height: '700px', padding: 0, overflow:'hidden'}}>
            <MapContainer center={[46.6, 1.8]} zoom={6} style={{ height: '100%', width: '100%' }}><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{allChantiers.filter(c => c.latitude).map(c => (<Marker key={c.id} position={[c.latitude, c.longitude]}><Popup><strong>{c.nom}</strong><br />{c.ville}<br /><a href={`/chantier/${c.id}`}>Voir</a></Popup></Marker>))}</MapContainer>
          </div>
        )}

        {currentView === 'planning' && (
          <div style={{...styles.card, height: '750px', padding: '20px'}}>
            <div style={{display:'flex', gap:'20px', marginBottom:'20px', fontSize:'0.8rem', justifyContent:'center'}}>
              <span style={{display:'flex', alignItems:'center', gap:'5px'}}><span style={{width:12, height:12, borderRadius:'50%', background:ACJ_COLORS.BLUE}}></span> Chantier</span>
              <span style={{display:'flex', alignItems:'center', gap:'5px'}}><span style={{width:12, height:12, borderRadius:'50%', background:'#2E7D32'}}></span> Visite</span>
              <span style={{display:'flex', alignItems:'center', gap:'5px'}}><span style={{width:12, height:12, borderRadius:'50%', background:'#EF6C00'}}></span> Réunion</span>
              <span style={{display:'flex', alignItems:'center', gap:'5px'}}><span style={{width:12, height:12, borderRadius:'50%', background:'#757575'}}></span> Bureau</span>
              <span style={{display:'flex', alignItems:'center', gap:'5px'}}><span style={{width:12, height:12, borderRadius:'50%', background:'#FFCDD2', border:'1px solid #E57373'}}></span> Férié</span>
            </div>
            <Calendar 
              localizer={localizer} 
              events={allCalendarEvents} 
              startAccessor="start" 
              endAccessor="end" 
              style={{ height: '100%' }} 
              selectable 
              onSelectSlot={handleSelectSlot} 
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              dayPropGetter={dayPropGetter}
              date={calendarDate}
              onNavigate={onNavigate}
              view={calendarView}
              onView={onView}
              views={['month', 'week', 'day', 'agenda']}
              messages={{ next: "Suivant", previous: "Précédent", today: "Aujourd'hui", month: "Mois", week: "Semaine", day: "Jour", agenda: "Agenda", date: "Date", time: "Heure", event: "Événement", noEventsInRange: "Aucun événement." }}
              culture='fr'
            />
          </div>
        )}

        {currentView === 'clients' && !selectedClient && (
          <>
            <div style={styles.card}>
              <h3 style={{marginTop:0, color:ACJ_COLORS.BLUE, textTransform:'uppercase'}}>Nouveau Dossier</h3>
              <form onSubmit={creerClient} style={{display:'flex', gap:'15px'}}><input type="text" placeholder="Nom du client / opération..." value={nouveauClient} onChange={e=>setNouveauClient(e.target.value)} style={{...styles.input, marginBottom:0}} /><button type="submit" style={{...styles.btnPrimary, width:'auto'}}>Créer</button></form>
            </div>
            <div style={{...styles.grid, marginTop:'30px', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))'}}>
              <div style={{...styles.folderCard, background:'#f9f9f9', border:'2px dashed #ddd'}} onClick={() => setSelectedClient({id:'orphan', nom:'Non Classés'})}><div style={{...styles.folderIcon, color:'#ccc'}}>🗂️</div><div style={{fontWeight:'700', color:'#888'}}>NON CLASSÉS</div></div>
              {clients.map(client => (
                <div key={client.id} style={styles.folderCard} onClick={() => setSelectedClient(client)}>
                  <button onClick={(e) => supprimerClient(e, client.id)} style={{position:'absolute', top:10, right:10, border:'none', background:'none', color:'#eee', fontSize:'1.2rem', cursor:'pointer'}} onMouseEnter={e=>e.target.style.color='red'} onMouseLeave={e=>e.target.style.color='#eee'}>×</button>
                  <div style={styles.folderIcon}>📁</div><div style={{fontWeight:'700', color:'#333', textAlign:'center', textTransform:'uppercase'}}>{client.nom}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedClient && (
          <div style={{display:'grid', gridTemplateColumns: '2fr 1fr', gap:'30px'}}>
            <div style={styles.card}>
              <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', paddingBottom:'15px', marginBottom:'15px'}}><h3 style={{margin:0, color:ACJ_COLORS.BLUE}}>AFFAIRES</h3>{selectedClient.id !== 'orphan' && <button onClick={(e)=>supprimerClient(e,selectedClient.id)} style={{background:'none', border:'1px solid #ffcdd2', color:'#c62828', borderRadius:'4px', padding:'5px 10px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'bold'}}>SUPPRIMER DOSSIER</button>}</div>
              {chantiers.map(c => (
                <div key={c.id} style={styles.tableRow} onClick={() => navigate(`/chantier/${c.id}`)}>
                  <div style={{fontWeight:'bold', color:'#333'}}>{c.nom}</div><div>{c.ville}</div><div style={{fontWeight:'bold'}}>{Number(c.montant).toLocaleString()} €</div><div style={styles.badge(c.statut)}>{c.statut}</div>
                  <button onClick={(e) => supprimerChantier(e, c.id)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'#e0e0e0', transition:'color 0.2s'}} onMouseEnter={e=>e.target.style.color='red'} onMouseLeave={e=>e.target.style.color='#e0e0e0'}>×</button>
                </div>
              ))}
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'25px'}}>
              <div style={{...styles.card, background:ACJ_COLORS.BLUE, color:'white', border:'none'}}><div style={{opacity:0.8, textTransform:'uppercase', fontSize:'0.8rem'}}>CA Facturé</div><div style={{fontSize:'2rem', fontWeight:'900'}}>{chantiers.filter(c=>c.statut==='Terminé').reduce((a,b)=>a+(Number(b.montant)||0),0).toLocaleString()} €</div></div>
              <div style={styles.card}>
                <h4 style={{marginTop:0, color:ACJ_COLORS.BLUE, textTransform:'uppercase'}}>Nouvelle Affaire</h4>
                <form onSubmit={ajouterChantier}>
                  <label style={styles.kpiLabel}>Nom</label><input type="text" value={nomChantier} onChange={e=>setNomChantier(e.target.value)} style={styles.input} required />
                  <label style={styles.kpiLabel}>Ville (Auto)</label>
                  <div style={{position:'relative'}}><input type="text" value={villeChantier} onChange={e=>searchCities(e.target.value)} style={styles.input} placeholder="..." required />{showCityList && citySuggestions.length > 0 && (<div style={styles.suggestionsBox}>{citySuggestions.map((c, i) => (<div key={i} style={styles.suggestionItem} onClick={() => selectCity(c)}>{c.label}</div>))}</div>)}</div>
                  <div style={{display:'flex', gap:'10px'}}><div style={{flex:1}}><label style={styles.kpiLabel}>Montant</label><input type="number" value={montantChantier} onChange={e=>setMontantChantier(e.target.value)} style={styles.input} /></div><div style={{flex:1}}><label style={styles.kpiLabel}>Date</label><input type="date" value={dateFacturation} onChange={e=>setDateFacturation(e.target.value)} style={styles.input} /></div></div>
                  <label style={styles.kpiLabel}>Statut</label><select value={statutChantier} onChange={e=>setStatutChantier(e.target.value)} style={styles.select}><option value="Devis">Devis</option><option value="En cours">En cours</option><option value="Urgent">Urgent</option><option value="Terminé">Terminé</option></select>
                  <button type="submit" style={styles.btnPrimary}>Ajouter</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TableauBord;