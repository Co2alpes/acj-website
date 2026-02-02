// src/components/DocumentPDF.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register a font optionally if needed, otherwise Helvetica is standard
// Font.register({ family: 'Open Sans', src: '...' });

const PDF_COLORS = {
  PRIMARY: '#002D5A', // ACJ BLUE
  SECONDARY: '#005BBB',
  ACCENT: '#D4AF37', // GOLD
  TEXT: '#333333',
  GRAY_LIGHT: '#F5F5F5',
  BORDER: '#E0E0E0'
};

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: PDF_COLORS.TEXT, lineHeight: 1.4 },
  
  // --- HEADER & LOGO ---
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, borderBottom: `1px solid ${PDF_COLORS.PRIMARY}`, paddingBottom: 20 },
  
  logoBlock: { width: '40%' },
  logoText: { fontSize: 24, fontWeight: 'bold', color: PDF_COLORS.PRIMARY, textTransform: 'uppercase' },
  logoSub: { fontSize: 8, letterSpacing: 2, color: PDF_COLORS.ACCENT, textTransform: 'uppercase', marginBottom: 10 },
  
  companyInfo: { fontSize: 9, color: '#555' },
  
  docInfoBlock: { width: '40%', alignItems: 'flex-end', justifyContent: 'center' },
  docType: { fontSize: 20, fontWeight: 'bold', color: PDF_COLORS.PRIMARY, textTransform: 'uppercase', marginBottom: 5 },
  docRef: { fontSize: 10, color: '#666', marginBottom: 2 },
  
  // --- CLIENT BOX ---
  clientContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 30 },
  clientBox: { width: '45%', backgroundColor: PDF_COLORS.GRAY_LIGHT, padding: 15, borderRadius: 4 },
  clientLabel: { fontSize: 8, color: '#888', textTransform: 'uppercase', marginBottom: 5, fontWeight: 'bold' },
  clientName: { fontSize: 12, fontWeight: 'bold', color: PDF_COLORS.PRIMARY, marginBottom: 2 },
  clientAddress: { fontSize: 10, color: '#444' },

  // --- META INFO ROW (Date, Object) ---
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  metaItem: { flexDirection: 'column' },
  metaLabel: { fontSize: 8, color: '#888', textTransform: 'uppercase', fontWeight: 'bold' },
  metaValue: { fontSize: 10, fontWeight: 'bold' },

  // --- TABLE ---
  tableContainer: { marginTop: 10, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: PDF_COLORS.PRIMARY, padding: 8, alignItems: 'center' },
  th: { color: 'white', fontWeight: 'bold', fontSize: 9, textTransform: 'uppercase' },
  
  row: { flexDirection: 'row', borderBottom: `1px solid ${PDF_COLORS.BORDER}`, padding: 8, alignItems: 'center' },
  rowStriped: { backgroundColor: '#FBFCFD' },
  
  // Columns widths
  colDesc: { width: '55%' },
  colQty: { width: '10%', textAlign: 'center' },
  colUnit: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  
  cellText: { fontSize: 10 },
  cellBold: { fontSize: 10, fontWeight: 'bold' },

  // --- TOTAUX ---
  totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalsBox: { width: '40%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 10, color: '#666' },
  totalValue: { fontSize: 10, fontWeight: 'bold' },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTop: `2px solid ${PDF_COLORS.PRIMARY}`, marginTop: 5 },
  grandTotalLabel: { fontSize: 12, fontWeight: 'bold', color: PDF_COLORS.PRIMARY },
  grandTotalValue: { fontSize: 12, fontWeight: 'bold', color: PDF_COLORS.PRIMARY },

  // --- FOOTER ---
  footerSection: { position: 'absolute', bottom: 40, left: 40, right: 40 },
  
  paymentBlock: { marginBottom: 20, padding: 10, backgroundColor: '#F9F9F9', borderRadius: 4, display: 'flex', flexDirection: 'row', gap: 20 },
  paymentTitle: { fontSize: 9, fontWeight: 'bold', color: PDF_COLORS.PRIMARY, marginBottom: 4 },
  paymentText: { fontSize: 8, color: '#555' },

  signatureBox: { height: 60, border: `1px dashed ${PDF_COLORS.BORDER}`, marginTop: 10, padding: 10 },
  signatureText: { fontSize: 8, color: '#888' },

  legalText: { fontSize: 7, color: '#999', textAlign: 'center', marginTop: 20, borderTop: `1px solid ${PDF_COLORS.BORDER}`, paddingTop: 10 }
});

const DocumentPDF = ({ type, chantier, materiaux = [], total = 0 }) => {
  // --- DEFAULTS (Hardcoded for ACJ if missing) ---
  const company = {
    name: "ACJ DÉVELOPPEMENT",
    contact: "ALAIN BONO",
    address: "24 Avenue de la Libération, 33110 LE BOUSCAT",
    phone: "06 00 00 00 00", // Placeholder if not in DB
    email: "contact@acj-developpement.fr", // Placeholder
    siret: "123 456 789 00012", // Placeholder
    iban: "FR76 1234 5678 9012 3456 7890 123", // Placeholder
    bic: "ABCDFR2X" // Placeholder
  };
  
  // Update company with chantier props if available (from global settings)
  if (chantier?.companySiret) company.siret = chantier.companySiret;
  if (chantier?.companyIban) company.iban = chantier.companyIban;
  if (chantier?.companyBic) company.bic = chantier.companyBic;
  if (chantier?.companyBankName) company.bankName = chantier.companyBankName;

  // Merge prop data if exists
  const emetteur = {
    name: chantier?.companyName || company.name,
    address: chantier?.companyAddress || company.address,
    contact: chantier?.companyContact || company.contact,
    phone: chantier?.companyPhone || company.phone,
    email: chantier?.companyEmail || company.email,
  };

  const docDate = new Date().toLocaleDateString('fr-FR');
  // Secure ID slicing if ID is undefined/short
  const safeId = chantier && chantier.id ? chantier.id.substr(0,4).toUpperCase() : '000';
  const docRef = `${type.substring(0,3).toUpperCase()}-${new Date().getFullYear()}-${safeId}`;

  // Calculs
  const tvaRate = 0.20;
  const tvaAmount = total * tvaRate;
  const totalTTC = total + tvaAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* EN-TÊTE PROFESSIONNEL */}
        <View style={styles.header}>
          <View style={styles.logoBlock}>
            {/* Si un logo est dispo via URL, on pourrait l'afficher ici. 
               Pour l'instant, on utilise le style texte ACJ */}
            <Text style={styles.logoText}>ACJ</Text>
            <Text style={styles.logoSub}>Rénovation & Développement</Text>
            
            <View style={{marginTop: 5}}>
               <Text style={styles.companyInfo}>{emetteur.name}</Text>
               <Text style={styles.companyInfo}>{emetteur.address}</Text>
               <Text style={styles.companyInfo}>{emetteur.contact}</Text>
               <Text style={styles.companyInfo}>{emetteur.phone} | {emetteur.email}</Text>
            </View>
          </View>

          <View style={styles.docInfoBlock}>
             <Text style={styles.docType}>{type}</Text>
             <Text style={styles.docRef}>N° {docRef}</Text>
             <Text style={styles.docRef}>Date : {docDate}</Text>
          </View>
        </View>

        {/* INFO CLIENT */}
        <View style={styles.clientContainer}>
           <View style={styles.clientBox}>
              <Text style={styles.clientLabel}>Facturé à :</Text>
              <Text style={styles.clientName}>{chantier.clientNom || 'Client Inconnu'}</Text>
              <Text style={styles.clientAddress}>{chantier.ville || 'Adresse non renseignée'}</Text>
           </View>
        </View>

        <View style={styles.metaRow}>
           <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Intitulé du chantier</Text>
              <Text style={styles.metaValue}>{chantier.nom || 'Travaux divers'}</Text>
           </View>
        </View>

        {/* TABLEAU DES PRESTATIONS */}
        <View style={styles.tableContainer}>
           {/* Header */}
           <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colDesc]}>Désignation</Text>
              <Text style={[styles.th, styles.colQty]}>Qté</Text>
              <Text style={[styles.th, styles.colUnit]}>P.U. HT</Text>
              <Text style={[styles.th, styles.colTotal]}>Total HT</Text>
           </View>

           {/* Rows */}
           {materiaux && materiaux.map((item, index) => {
             const isStriped = index % 2 === 1;
             return (
               <View key={index} style={[styles.row, isStriped ? styles.rowStriped : {}]}>
                  <Text style={[styles.cellText, styles.colDesc]}>{item.nom}</Text>
                  <Text style={[styles.cellText, styles.colQty]}>{item.quantite}</Text>
                  <Text style={[styles.cellText, styles.colUnit]}>{Number(item.prix).toLocaleString('fr-FR', {minimumFractionDigits:2})} €</Text>
                  <Text style={[styles.cellBold, styles.colTotal]}>{(Number(item.prix) * Number(item.quantite)).toLocaleString('fr-FR', {minimumFractionDigits:2})} €</Text>
               </View>
             );
           })}
        </View>

        {/* TOTAUX */}
        <View style={styles.totalsSection}>
           <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                 <Text style={styles.totalLabel}>Total HT</Text>
                 <Text style={styles.totalValue}>{total.toLocaleString('fr-FR', {minimumFractionDigits:2})} €</Text>
              </View>
              <View style={styles.totalRow}>
                 <Text style={styles.totalLabel}>TVA (20%)</Text>
                 <Text style={styles.totalValue}>{tvaAmount.toLocaleString('fr-FR', {minimumFractionDigits:2})} €</Text>
              </View>
              <View style={styles.grandTotal}>
                 <Text style={styles.grandTotalLabel}>Total TTC</Text>
                 <Text style={styles.grandTotalValue}>{totalTTC.toLocaleString('fr-FR', {minimumFractionDigits:2})} €</Text>
              </View>
           </View>
        </View>

        {/* FOOTER & CONDITIONS */}
        <View style={styles.footerSection}>
           
           <View style={{flexDirection:'row', justifyContent:'space-between', gap:20}}>
              {/* Box Devis : Signature */}
              {type === 'Devis' && (
                <View style={{width:'45%'}}>
                   <Text style={{fontSize:9, fontStyle:'italic', marginBottom:5}}>Bon pour accord (Date et Signature)</Text>
                   <View style={styles.signatureBox}></View>
                </View>
              )}

              {/* Box Facture : RIB */}
              <View style={{flex:1}}>
                  <View style={styles.paymentBlock}>
                    <View style={{flex:1}}>
                      <Text style={styles.paymentTitle}>Règlement par virement</Text>
                      <Text style={styles.paymentText}>IBAN : {company.iban}</Text>
                      <Text style={styles.paymentText}>BIC : {company.bic}</Text>
                      <Text style={styles.paymentText}>Banque : {company.bankName || 'Crédit Mutuel (Exemple)'}</Text>
                    </View>
                    <View style={{flex:1}}>
                       <Text style={styles.paymentTitle}>Conditions</Text>
                       <Text style={styles.paymentText}>Paiement à réception de facture.</Text>
                       <Text style={styles.paymentText}>Aucun escompte pour paiement anticipé.</Text>
                    </View>
                  </View>
              </View>
           </View>

           <Text style={styles.legalText}>
              {company.name} - {company.address} - SIRET : {company.siret} - TVA Intracommunautaire : FRXX 000 000 000
           </Text>
        </View>

      </Page>
    </Document>
  );
};

export default DocumentPDF;