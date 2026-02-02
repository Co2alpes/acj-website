// src/pages/LandingPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { ACJ_COLORS, SHADOWS, FONTS } from '../theme';

import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  // --- ÉTATS ---
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // C'est cette ligne qui manquait et causait l'erreur :
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const [visibleSections, setVisibleSections] = useState({});
  const observer = useRef(null);

  // --- DÉTECTION SCROLL ---
  useEffect(() => {
    const handleScroll = () => {
      // Détection compatible tous navigateurs
      const position = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setIsScrolled(position > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check initial
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- ANIMATION APPARITION ---
  useEffect(() => {
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-id');
          if (id) {
            setVisibleSections((prev) => ({ ...prev, [id]: true }));
            observer.current.unobserve(entry.target);
          }
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.observe-me').forEach((el) => observer.current.observe(el));
    return () => { if (observer.current) observer.current.disconnect(); };
  }, []);

  const getAnimClass = (id, delay = 0) => {
    const isVisible = visibleSections[id];
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
      transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`
    };
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // --- DONNÉES ---
  const servicesData = [
    { title: "AMO & CONSEIL", desc: "Pilotage stratégique et opérationnel des infrastructures.", icon: "🏗️" },
    { title: "INGÉNIERIE ROUTIÈRE", desc: "Conception, dimensionnement et suivi technique.", icon: "🛣️" },
    { title: "CONTRÔLE EXTÉRIEUR", desc: "Laboratoire in-situ, carottages et validation conformité.", icon: "🔬" }
  ];

  const projectsData = [
    { title: "Autoroute A69", loc: "Tarn (81)", img: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=800&q=80" },
    { title: "Rocade Sud", loc: "Strasbourg (67)", img: "https://images.unsplash.com/photo-1621955964441-c173e01c135b?auto=format&fit=crop&w=800&q=80" },
    { title: "ZAC des Lilas", loc: "Bordeaux (33)", img: "https://images.unsplash.com/photo-1590486803833-1c5dc8ce84ac?auto=format&fit=crop&w=800&q=80" }
  ];

  const valuesData = [
    { title: "SÉCURITÉ", text: "Zéro accident : notre priorité absolue sur tous les chantiers." },
    { title: "ENVIRONNEMENT", text: "Des solutions techniques pour réduire l'empreinte carbone." },
    { title: "INNOVATION", text: "Utilisation des dernières technologies de diagnostic routier." }
  ];

  const teamMembers = [
    { name: "Alexandre C.", role: "Directeur Technique", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80" },
    { name: "Julie M.", role: "Cheffe de Projet", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" },
    { name: "Thomas D.", role: "Resp. Laboratoire", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80" },
    { name: "Sarah L.", role: "Ingénieure Études", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80" }
  ];

  // --- VARIABLES STYLES DYNAMIQUES ---
  // Modification : Utilisation de la couleur ACJ_COLORS.BLUE directement avec une légère transparence
  // Si scroll > 10px -> Bleu sombre (0.95), sinon Transparent
  const navBg = isMobileMenuOpen ? 'transparent' : (isScrolled ? 'rgba(0, 45, 90, 0.98)' : 'transparent');
  
  const navBorderBottom = (!isMobileMenuOpen && isScrolled) ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent';
  const navPadding = isScrolled ? '15px 40px' : '30px 50px';
  
  // Texte toujours blanc maintenant (sur fond transparent ou bleu sombre)
  const contentColor = '#ffffff';
  const linkColor = '#ffffff';
  
  const textShadow = (!isMobileMenuOpen && !isScrolled) ? '0 2px 10px rgba(0,0,0,0.5)' : 'none';
  
  // Bouton
  // Quand scrollé (fond bleu), on peut le mettre en Jaune pour le contraste, ou garder le style "ghost" blanc.
  // Pour l'instant, je vais mettre le bouton en jaune ACJ quand on scroll pour qu'il ressorte bien sur le bleu sombre.
  const btnBg = (isMobileMenuOpen || !isScrolled) ? 'rgba(255,255,255,0.2)' : ACJ_COLORS.YELLOW;
  const btnText = (isMobileMenuOpen || !isScrolled) ? '#ffffff' : ACJ_COLORS.BLUE;
  const btnBorder = (isMobileMenuOpen || !isScrolled) ? '1px solid #ffffff' : `1px solid ${ACJ_COLORS.YELLOW}`;

  // --- STYLES OBJETS ---
  const styles = {
    wrapper: { fontFamily: "'Montserrat', 'Segoe UI', sans-serif", color: '#333', overflowX: 'hidden' },
    
    nav: { 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      padding: navPadding, 
      backgroundColor: navBg, 
      borderBottom: navBorderBottom,
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
      transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)', // Transition un peu plus rapide pour l'effet "apparition"
      backdropFilter: (isScrolled && !isMobileMenuOpen) ? 'blur(12px)' : 'none',
      boxShadow: (isScrolled && !isMobileMenuOpen) ? '0 4px 30px rgba(0,0,0,0.1)' : 'none'
    },
    logo: { 
      fontSize: '1.5rem', fontWeight: '900', 
      color: contentColor, 
      textTransform: 'uppercase', letterSpacing: '2px', textDecoration:'none',
      textShadow: textShadow,
      transition: 'color 0.6s ease, text-shadow 0.6s ease',
      zIndex: 1001
    },
    
    // Le style "desktopMenu" a été déplacé dans le bloc <style> plus bas pour éviter l'erreur @media
    
    link: { 
      textDecoration: 'none', 
      color: linkColor, 
      fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', letterSpacing:'1px',
      textTransform: 'uppercase',
      textShadow: textShadow,
      transition: 'color 0.6s ease, text-shadow 0.6s ease'
    },
    btnLogin: { 
      padding: '10px 25px', 
      backgroundColor: btnBg, 
      color: btnText, 
      border: btnBorder, borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem',
      transition: 'all 0.6s ease',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    },

    burgerIcon: {
      flexDirection: 'column', gap: '6px', cursor: 'pointer', zIndex: 1001,
      // Display géré par CSS
    },
    burgerLine: (rot) => ({
      width: '25px', height: '3px', backgroundColor: contentColor, borderRadius: '2px',
      transition: 'all 0.4s ease', transform: rot || 'none'
    }),
    mobileOverlay: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
      backgroundColor: ACJ_COLORS.BLUE, zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px',
      transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'transform 0.5s cubic-bezier(0.7, 0, 0.3, 1)',
      opacity: isMobileMenuOpen ? 1 : 0
    },

    hero: { 
      height: '100vh', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: 'url("https://images.unsplash.com/photo-1621955964441-c173e01c135b?auto=format&fit=crop&w=2000&q=80")',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'
    },
    heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0, 45, 90, 0.7) 100%)' },
    heroContent: { position: 'relative', zIndex: 2, textAlign: 'center', color: 'white', maxWidth: '900px', padding:'0 20px' },
    heroTitle: { fontSize: '4.5rem', fontWeight: '900', margin: '0 0 20px 0', lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-2px', textShadow: '0 10px 30px rgba(0,0,0,0.3)' },
    heroSubtitle: { fontSize: '1.5rem', fontWeight: '300', opacity: 0.95, marginBottom: '40px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' },
    heroBtn: { padding: '18px 45px', backgroundColor: ACJ_COLORS.YELLOW, color: ACJ_COLORS.BLUE, border: 'none', borderRadius: '4px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', transition: 'transform 0.2s' },
    scrollIndicator: { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', color: 'white', animation: 'bounce 2s infinite', fontSize:'2rem', cursor:'pointer' },

    section: { padding: '100px 20px', backgroundColor: 'white' },
    sectionAlt: { padding: '100px 20px', backgroundColor: ACJ_COLORS.BG_PAGE },
    sectionTitle: { fontSize: '2.5rem', fontWeight: '900', color: ACJ_COLORS.BLUE, marginBottom: '20px', textTransform: 'uppercase', textAlign: 'center' },
    sectionSubtitle: { fontSize: '1.1rem', color: ACJ_COLORS.TEXT_SECONDARY, lineHeight: 1.6, textAlign: 'center', maxWidth:'700px', margin:'0 auto 60px auto' },

    servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' },
    serviceCard: { padding: '40px 30px', backgroundColor: 'white', borderRadius: '4px', textAlign: 'center', boxShadow: SHADOWS.CARD, borderBottom: `4px solid ${ACJ_COLORS.YELLOW}`, transition: 'transform 0.3s' },
    projectsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', maxWidth: '1400px', margin: '0 auto' },
    projectCard: { position: 'relative', height: '300px', overflow: 'hidden', cursor: 'pointer' },
    projectImg: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' },
    projectOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '30px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', color: 'white' },
    valuesGrid: { display: 'flex', justifyContent: 'center', gap: '60px', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' },
    valueItem: { maxWidth: '250px' },
    valueTitle: { fontSize: '1.2rem', fontWeight: '800', color: ACJ_COLORS.BLUE, margin: '15px 0 10px 0', textTransform: 'uppercase' },
    teamGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', maxWidth: '1000px', margin: '0 auto' },
    teamPhoto: { width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', marginBottom: '20px', border: `4px solid ${ACJ_COLORS.YELLOW}` },

    footer: { backgroundColor: ACJ_COLORS.BLUE, color: 'white', padding: '80px 20px 40px 20px' },
    copyright: { textAlign: 'center', marginTop: '60px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0) translateX(-50%);} 40% {transform: translateY(-10px) translateX(-50%);} 60% {transform: translateY(-5px) translateX(-50%);} }
        
        .service-card:hover { transform: translateY(-5px); }
        .project-card:hover .project-img { transform: scale(1.1); }
        
        .nav-link { position: relative; }
        .nav-link::after { content: ''; position: absolute; width: 0; height: 3px; bottom: -5px; left: 0; background-color: ${ACJ_COLORS.YELLOW}; transition: width 0.3s; }
        .nav-link:hover::after { width: 100%; }

        .desktop-menu { display: flex; align-items: center; gap: 40px; }
        .mobile-burger { display: none; }

        .menu-link { 
          fontSize: 2rem; fontWeight: 800; color: white; textDecoration: none;
          textTransform: uppercase; letterSpacing: -1px; cursor: pointer; lineHeight: 1.1;
          transition: all 0.3s ease; display: inline-block;
        }
        .menu-link:hover { color: ${ACJ_COLORS.YELLOW} !important; transform: translateX(10px); }

        @media (max-width: 900px) {
          .desktop-menu { display: none !important; }
          .mobile-burger { display: flex !important; }
          .hero-title { fontSize: 3rem !important; }
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;600;800;900&display=swap');
      `}</style>
      
      {/* --- BANDEAU --- */}
      <nav style={styles.nav}>
        <a href="#" style={styles.logo}>ACJ DÉVELOPPEMENT</a>
        
        <div className="desktop-menu">
          <a href="#about" style={styles.link} className="nav-link">Notre ADN</a>
          <a href="#expertises" style={styles.link} className="nav-link">Expertises</a>
          <a href="#projets" style={styles.link} className="nav-link">Références</a>
          <a href="#equipe" style={styles.link} className="nav-link">Carrières</a>
          <button onClick={() => navigate('/login')} style={styles.btnLogin}>ESPACE PRO</button>
        </div>

        <div className="mobile-burger" style={styles.burgerIcon} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <div style={styles.burgerLine(isMobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none')}></div>
          <div style={{...styles.burgerLine('none'), opacity: isMobileMenuOpen ? 0 : 1}}></div>
          <div style={styles.burgerLine(isMobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none')}></div>
        </div>
      </nav>

      {/* --- MENU MOBILE --- */}
      <div style={styles.mobileOverlay}>
        <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="menu-link">NOTRE ADN</a>
        <a href="#expertises" onClick={() => setIsMobileMenuOpen(false)} className="menu-link">EXPERTISES</a>
        <a href="#projets" onClick={() => setIsMobileMenuOpen(false)} className="menu-link">RÉFÉRENCES</a>
        <a href="#equipe" onClick={() => setIsMobileMenuOpen(false)} className="menu-link">CARRIÈRES</a>
        <button onClick={() => {setIsMobileMenuOpen(false); navigate('/login');}} style={{...styles.btnLogin, backgroundColor:ACJ_COLORS.YELLOW, color:ACJ_COLORS.BLUE, border:'none', marginTop:'20px'}}>ESPACE PRO</button>
      </div>

      {/* --- HERO --- */}
      <header style={styles.hero}>
        <div style={styles.heroOverlay}></div>
        <div className="observe-me" data-id="hero" style={{...styles.heroContent, ...getAnimClass('hero')}}>
          <h1 style={styles.heroTitle} className="hero-title">L'INGÉNIERIE<br/>EN MOUVEMENT</h1>
          <p style={styles.heroSubtitle}>Expertise routière, contrôle technique et accompagnement durable.</p>
          <a href="#about"><button style={styles.heroBtn}>Découvrir ACJ</button></a>
        </div>
        <div style={styles.scrollIndicator} onClick={() => window.scrollTo(0, window.innerHeight)}>▼</div>
      </header>

      {/* --- NOTRE ADN --- */}
      <section id="about" style={styles.section}>
        <div className="observe-me" data-id="about" style={{maxWidth:'1000px', margin:'0 auto', display:'flex', gap:'50px', alignItems:'center', flexWrap:'wrap', ...getAnimClass('about')}}>
          <div style={{flex:1, minWidth:'300px'}}>
            <h2 style={{...styles.sectionTitle, textAlign:'left'}}>NOTRE ADN</h2>
            <div style={{width:'60px', height:'4px', backgroundColor:ACJ_COLORS.YELLOW, marginBottom:'30px'}}></div>
            <p style={{fontSize:'1.1rem', lineHeight:1.6, color:'#555', marginBottom:'20px'}}>Depuis 15 ans, <strong>ACJ Développement</strong> est le partenaire privilégié des maîtres d'ouvrage publics et privés.</p>
            <p style={{fontSize:'1rem', lineHeight:1.6, color:'#666'}}>Nous allions expertise technique et vision stratégique pour garantir la pérennité de vos infrastructures routières.</p>
          </div>
          <div style={{flex:1, minWidth:'300px'}}>
            <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80" alt="Chantier" style={{width:'100%', borderRadius:'8px', boxShadow:'0 20px 40px rgba(0,0,0,0.1)'}} />
          </div>
        </div>
      </section>

      {/* --- EXPERTISES --- */}
      <section id="expertises" style={styles.sectionAlt}>
        <h2 style={styles.sectionTitle}>Nos Expertises</h2>
        <div style={styles.servicesGrid}>
          {servicesData.map((service, index) => (
            <div key={index} style={styles.serviceCard} className="service-card observe-me" data-id={`serv-${index}`}>
              <div style={{fontSize:'3rem', marginBottom:'20px'}}>{service.icon}</div>
              <h3 style={{color:ACJ_COLORS.BLUE, textTransform:'uppercase', fontSize:'1.2rem', marginBottom:'15px'}}>{service.title}</h3>
              <p style={{color:'#666', lineHeight:1.5}}>{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- PROJETS --- */}
      <section id="projets" style={{padding:'0', backgroundColor:'#111'}}>
        <div style={styles.projectsGrid}>
          {projectsData.map((p, i) => (
            <div key={i} style={styles.projectCard} className="project-card">
              <img src={p.img} alt={p.title} style={styles.projectImg} className="project-img" />
              <div style={styles.projectOverlay}>
                <h3 style={{fontSize:'1.5rem', fontWeight:'800', margin:0, textTransform:'uppercase'}}>{p.title}</h3>
                <p style={{color:ACJ_COLORS.YELLOW, fontWeight:'600', margin:'5px 0 0'}}>{p.loc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- VALEURS --- */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Nos Engagements RSE</h2>
        <div style={styles.valuesGrid}>
          {valuesData.map((v, i) => (
            <div key={i} style={styles.valueItem}>
              <div style={styles.valueTitle}>{v.title}</div>
              <p style={{color:'#666', lineHeight:1.5}}>{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- EQUIPE --- */}
      <section id="equipe" style={styles.sectionAlt}>
        <h2 style={styles.sectionTitle}>Vos Interlocuteurs</h2>
        <div style={styles.teamGrid}>
          {teamMembers.map((member, i) => (
            <div key={i} className="observe-me" data-id={`team-${i}`} style={{textAlign:'center', ...getAnimClass(`team-${i}`, i*0.1)}}>
              <img src={member.img} alt={member.name} style={styles.teamPhoto} />
              <h3 style={{fontSize:'1.2rem', fontWeight:'800', color:ACJ_COLORS.BLUE, margin:'0 0 5px 0'}}>{member.name}</h3>
              <p style={{textTransform:'uppercase', fontSize:'0.8rem', fontWeight:'600', color: '#888', letterSpacing:'1px'}}>{member.role}</p>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center', marginTop:'60px'}}>
          <p style={{fontStyle:'italic', color:'#666', marginBottom:'20px'}}>Vous souhaitez rejoindre l'aventure ACJ ?</p>
          <button style={{padding:'12px 30px', border:`2px solid ${ACJ_COLORS.BLUE}`, background:'transparent', color:ACJ_COLORS.BLUE, fontWeight:'bold', borderRadius:'30px', cursor:'pointer'}}>Voir nos offres</button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer id="contact" style={styles.footer}>
        <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', maxWidth: '1200px', margin: '0 auto'}}>
          <div>
            <h4 style={{color: 'white', marginBottom: '20px', fontSize: '1.2rem'}}>ACJ DÉVELOPPEMENT</h4>
            <p style={{color:'#888', lineHeight:1.6}}>Partenaire de confiance pour la maîtrise d'œuvre et le contrôle des infrastructures routières.</p>
          </div>
          <div>
            <h4 style={{color: 'white', marginBottom: '20px', fontSize: '1.2rem'}}>CONTACT</h4>
            <p style={{color:'#888', marginBottom:'10px'}}>📍 12 Rue de l'Industrie, 75000 Paris</p>
            <p style={{color:'#888', marginBottom:'10px'}}>📞 01 23 45 67 89</p>
            <p style={{color:'#888'}}>✉️ contact@acj-developpement.fr</p>
          </div>
          <div>
            <h4 style={{color: 'white', marginBottom: '20px', fontSize: '1.2rem'}}>CERTIFICATIONS</h4>
            <p style={{color:'#888'}}>• ISO 9001:2015</p>
            <p style={{color:'#888'}}>• Qualification OPQIBI</p>
          </div>
        </div>
        <div style={styles.copyright}>
          © {new Date().getFullYear()} ACJ Développement. Tous droits réservés. | <span onClick={() => navigate('/login')} style={{cursor:'pointer', textDecoration:'underline', color:'white'}}>Connexion Salariés</span>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;