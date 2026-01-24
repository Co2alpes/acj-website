// src/components/DocumentPDF.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 9, color: '#000', lineHeight: 1.3 },
  
  // --- EN-TÊTE ---
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  
  // Logo & Émetteur (Gauche)
  leftCol: { width: '50%' },
  logoImage: { width: 150, marginBottom: 15, objectFit: 'contain' }, 
  logoText: { fontSize: 28, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 0 },
  subLogo: { fontSize: 8, letterSpacing: 2, marginBottom: 15, textTransform: 'uppercase' },
  senderLabel: { fontSize: 8, textDecoration: 'underline', marginBottom: 3, fontWeight: 'bold' },
  senderText: { fontSize: 9, marginBottom: 1 },

  // Infos Document (Droite)
  rightCol: { width: '45%', alignItems: 'flex-start' },
  
  // CORRECTION ICI : Plus de 'uppercase' forcé, taille ajustée
  docTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'right', width:'100%', color: '#000' },
  
  infoRow: { flexDirection: 'row', marginBottom: 3, width: '100%' },
  infoLabel: { width: 100, fontWeight: 'bold', fontSize: 9 },
  infoValue: { fontSize: 9 },

  // --- DESTINATAIRE ---
  recipientBox: { alignSelf: 'flex-end', width: '45%', marginTop: 10, marginBottom: 40, borderLeft: '1px solid #000', paddingLeft: 10 },
  recipientLabel: { fontSize: 8, fontWeight: 'bold', textDecoration: 'underline', marginBottom: 3 },
  recipientText: { fontSize: 10, fontWeight: 'bold' },
  
  // --- TABLEAU ---
  table: { display: "table", width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: '#000', borderRightWidth: 0, borderBottomWidth: 0, marginBottom: 20 },
  tableRow: { margin: "auto", flexDirection: "row" },
  headerRow: { backgroundColor: '#F0F0F0', fontWeight: 'bold' },
  colDesc: { width: "50%", borderStyle: "solid", borderWidth: 1, borderColor: '#000', borderLeftWidth: 0, borderTopWidth: 0 },
  colTva: { width: "10%", borderStyle: "solid", borderWidth: 1, borderColor: '#000', borderLeftWidth: 0, borderTopWidth: 0 },
  colPu: { width: "15%", borderStyle: "solid", borderWidth: 1, borderColor: '#000', borderLeftWidth: 0, borderTopWidth: 0 },
  colQty: { width: "10%", borderStyle: "solid", borderWidth: 1, borderColor: '#000', borderLeftWidth: 0, borderTopWidth: 0 },
  colTotal: { width: "15%", borderStyle: "solid", borderWidth: 1, borderColor: '#000', borderLeftWidth: 0, borderTopWidth: 0 },
  cell: { margin: 5, fontSize: 8 },
  cellRight: { margin: 5, fontSize: 8, textAlign: 'right' },
  cellHeader: { margin: 5, fontSize: 8, fontWeight: 'bold', textAlign: 'center' },

  // --- PIED DE PAGE ---
  footerContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  bankBlock: { width: '55%', fontSize: 8 },
  bankTitle: { fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5, marginTop: 10 },
  bankDetailsRow: { flexDirection: 'row', marginBottom: 2 },
  bankLabel: { width: 80, fontWeight: 'bold' },
  totalsBlock: { width: '35%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, borderBottom: '1px solid #eee', paddingBottom: 2 },
  totalLabel: { fontWeight: 'bold' },
  totalFinal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, paddingTop: 5, borderTop: '2px solid #000', fontWeight: 'bold', fontSize: 11 },
  legal: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 7, color: '#666', borderTop: '1px solid #ccc', paddingTop: 5 }
});

const DocumentPDF = ({ type, chantier, materiaux = [], reports = [], total = 0 }) => {
  const docRef = `${type.substring(0,3).toUpperCase()}${new Date().getFullYear()}-${chantier.id ? chantier.id.substring(0,4).toUpperCase() : '000'}`;
  
  // CORRECTION : "Proposition commerciale" (minuscule à commerciale)
  const titleText = type === 'Devis' ? 'Proposition commerciale' : 'Facture';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.leftCol}>
            {chantier?.companyLogoUrl ? (
              <Image src={chantier.companyLogoUrl} style={styles.logoImage} />
            ) : (
              <>
                <Text style={styles.logo}>ACJ</Text>
                <Text style={styles.subLogo}>DÉVELOPPEMENT</Text>
              </>
            )}
            
            <Text style={styles.senderLabel}>Émetteur :</Text>
            <Text style={{...styles.senderText, fontWeight: 'bold'}}>MONSIEUR {chantier?.companyContact || "ALAIN BONO"}</Text>
            <Text style={styles.senderText}>{chantier?.companyAddress}</Text>
            <Text style={styles.senderText}>{chantier?.companyZipCity}</Text>
            <Text style={{...styles.senderText, marginTop: 5}}>Tél: {chantier?.companyPhone}</Text>
            <Text style={styles.senderText}>Email: {chantier?.companyEmail}</Text>
          </View>

          <View style={styles.rightCol}>
            {/* Titre corrigé ici */}
            <Text style={styles.docTitle}>{titleText}</Text>
            
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Réf. :</Text><Text style={styles.infoValue}>{docRef}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Réf. Client :</Text><Text style={styles.infoValue}>C{chantier?.clientId ? chantier.clientId.substring(0,4) : 'DIV'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Date :</Text><Text style={styles.infoValue}>{new Date().toLocaleDateString('fr-FR')}</Text></View>
            {type === 'Devis' && <View style={styles.infoRow}><Text style={styles.infoLabel}>Validité :</Text><Text style={styles.infoValue}>30 jours</Text></View>}
          </View>
        </View>

        <View style={styles.recipientBox}>
          <Text style={styles.recipientLabel}>Adressé à :</Text>
          <Text style={styles.recipientText}>{chantier?.clientNom || "CLIENT"}</Text>
          <Text style={{fontSize: 9}}>{chantier?.ville || "Adresse Chantier"}</Text>
        </View>

        <Text style={{fontSize: 10, fontWeight: 'bold', marginBottom: 10}}>Objet : {chantier?.nom}</Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.headerRow]}>
            <View style={styles.colDesc}><Text style={styles.cellHeader}>Désignation</Text></View>
            <View style={styles.colTva}><Text style={styles.cellHeader}>TVA</Text></View>
            <View style={styles.colPu}><Text style={styles.cellHeader}>P.U. HT</Text></View>
            <View style={styles.colQty}><Text style={styles.cellHeader}>Qté</Text></View>
            <View style={styles.colTotal}><Text style={styles.cellHeader}>Total HT</Text></View>
          </View>
          {materiaux.map((mat, i) => (
            <View style={styles.tableRow} key={i}>
              <View style={styles.colDesc}><Text style={styles.cell}>{mat.nom}</Text></View>
              <View style={styles.colTva}><Text style={styles.cellRight}>20%</Text></View>
              <View style={styles.colPu}><Text style={styles.cellRight}>{Number(mat.prix).toFixed(2)}</Text></View>
              <View style={styles.colQty}><Text style={styles.cellRight}>{mat.quantite}</Text></View>
              <View style={styles.colTotal}><Text style={styles.cellRight}>{(Number(mat.quantite)*Number(mat.prix)).toFixed(2)}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.footerContainer}>
          <View style={styles.bankBlock}>
            {type === 'Facture' && (
              <>
                <Text style={{fontStyle: 'italic', marginBottom: 10}}>Conditions de règlement : 30 jours date de facture.</Text>
                <Text style={styles.bankTitle}>Règlement par virement :</Text>
                <View style={styles.bankDetailsRow}><Text style={styles.bankLabel}>Banque :</Text><Text>{chantier?.companyBankName}</Text></View>
                <View style={styles.bankDetailsRow}><Text style={styles.bankLabel}>Titulaire :</Text><Text>{chantier?.companyOwner}</Text></View>
                <View style={styles.bankDetailsRow}><Text style={styles.bankLabel}>IBAN :</Text><Text>{chantier?.companyIban}</Text></View>
                <View style={styles.bankDetailsRow}><Text style={styles.bankLabel}>BIC :</Text><Text>{chantier?.companyBic}</Text></View>
              </>
            )}
            {type === 'Devis' && <Text style={{marginTop: 20, fontStyle: 'italic'}}>Bon pour accord (Date, Cachet et Signature) :</Text>}
          </View>

          <View style={styles.totalsBlock}>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Total HT</Text><Text>{total.toLocaleString('fr-FR', {minimumFractionDigits: 2})} €</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>TVA (20%)</Text><Text>{(total*0.2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} €</Text></View>
            <View style={styles.totalFinal}><Text>Net à payer</Text><Text>{(total*1.2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} €</Text></View>
          </View>
        </View>

        <Text style={styles.legal}>
          {chantier?.companyLegalStatus} - SIRET: {chantier?.companySiret} - NAF: {chantier?.companyNaf} - TVA Intra: {chantier?.companyTva}
        </Text>
      </Page>
    </Document>
  );
};

export default DocumentPDF;