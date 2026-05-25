import Head from 'next/head';
import Link from 'next/link';

// Tunnel de conversion ultra-pensé pour piscine/spa.
// Chaque phase a son timing, ses canaux, son contenu type et sa condition de sortie.
const TUNNEL = [
  {
    phase: 'P0', titre: 'Réception du lead', timing: 'Instantané (< 60 s)', couleur: '#0891b2', icone: '📥',
    desc: 'Un lead arrive depuis Jotform, Outlook, site web, GMB, réseaux sociaux ou prospection outbound.',
    actions: [
      'Création automatique de la fiche dans Odoo CRM avec tag de la source',
      'Notification temps réel à l\'équipe commerciale (Slack + push mobile)',
      'Si source = prospection outbound, transfert depuis l\'agent prospection avec tout l\'historique',
    ],
    canaux: ['CRM Odoo', 'Slack/Push'],
    sortie: '→ Phase 1 immédiate',
  },
  {
    phase: 'P1', titre: 'Enrichissement & scoring IA', timing: '< 2 min', couleur: '#0e7490', icone: '🧠',
    desc: 'L\'agent enrichit le lead avec toutes les données disponibles puis calcule un score 0-100.',
    actions: [
      'Recherche LinkedIn / Pages Jaunes / site web pour qualifier le profil',
      'Géolocalisation : zone de chalandise (proche / lointain), proximité d\'une réalisation existante',
      'Analyse du message : taille piscine évoquée, budget mentionné, urgence',
      'Scoring : HOT (≥ 75) / WARM (40-74) / COLD (< 40)',
      'Catégorisation : Particulier / Pro / Architecte / Camping / Autre',
    ],
    canaux: ['Claude API', 'Google Places', 'LinkedIn'],
    sortie: '→ P2 si score ≥ 40 · → P6 (nurturing) si < 40',
  },
  {
    phase: 'P2', titre: 'Premier contact ultra-personnalisé', timing: '< 15 min après réception', couleur: '#0891b2', icone: '✉️',
    desc: 'Email + WhatsApp (si numéro fourni) personnalisés avec photos de réalisations dans la zone géographique du prospect.',
    actions: [
      'Email IA généré avec : prénom, ville, 2-3 photos de chantiers réalisés à < 50km, lien Calendly direct',
      'Si téléphone : message WhatsApp court (3 lignes max) avec photo d\'une réalisation locale',
      'Object email A/B testé : "Votre projet piscine à [ville] — quelques exemples"',
      'Si score HOT : notification mobile à l\'équipe pour appel téléphonique dans l\'heure',
    ],
    canaux: ['Outlook', 'WhatsApp Business API', 'Calendly'],
    sortie: '→ P3 si pas de réponse à J+2 · → P5 (RDV) si réponse positive',
  },
  {
    phase: 'P3', titre: 'Relance 1 — Valeur ajoutée', timing: 'J+2 (48h)', couleur: '#2563eb', icone: '🎁',
    desc: 'Si pas de réponse, on apporte de la valeur sans relancer commercialement.',
    actions: [
      'Email "guide PDF gratuit" : "Comment choisir sa piscine — 7 erreurs à éviter"',
      'Ou bien : témoignage vidéo d\'un client de la zone géographique',
      'SMS court : "On vous a envoyé un petit guide, ça vous a été utile ?"',
      'Tracking ouverture email + click PDF → re-scoring',
    ],
    canaux: ['Outlook', 'SMS (OVH ou Twilio)'],
    sortie: '→ P4 si pas de réponse à J+5 · → P5 si engagement',
  },
  {
    phase: 'P4', titre: 'Relance 2 — Preuve sociale', timing: 'J+5', couleur: '#3b82f6', icone: '⭐',
    desc: 'Renforcement de la confiance par les avis et chiffres clés.',
    actions: [
      'Email : avis Google récents (4.8/5 sur 38 avis) + 2 photos avant/après spectaculaires',
      'Mise en avant d\'une garantie/avantage : "Devis et visite gratuits sous 48h"',
      'WhatsApp : un message audio personnalisé du dirigeant si lead HOT',
      'Si entreprise/camping : envoi d\'une étude de cas client similaire',
    ],
    canaux: ['Outlook', 'WhatsApp'],
    sortie: '→ P5 si engagement · → P6 si pas de réponse à J+10',
  },
  {
    phase: 'P5', titre: 'RDV planifié & briefing commercial', timing: 'Instantané quand RDV pris', couleur: '#16a34a', icone: '📅',
    desc: 'Le prospect a accepté un RDV : on prépare le commercial à fond.',
    actions: [
      'Auto-création du RDV dans le calendrier du commercial (Outlook Calendar)',
      'Briefing pré-RDV envoyé 2h avant : profil, historique des échanges, photos zone géo, budget estimé, hypothèses techniques',
      'Confirmation auto au prospect 24h avant + relance la veille',
      'Itinéraire envoyé automatiquement si déplacement',
    ],
    canaux: ['Outlook Calendar', 'Maps'],
    sortie: '→ P7 (post-RDV) une fois le RDV passé',
  },
  {
    phase: 'P6', titre: 'Nurturing long-terme', timing: 'Si pas de réponse à J+10 ou score < 40', couleur: '#94a3b8', icone: '🌱',
    desc: 'Réintégration dans une campagne mensuelle de contenu valeur pour rester top-of-mind.',
    actions: [
      'Newsletter mensuelle avec saisonnalité : "Préparez votre piscine pour l\'été", "Spa intérieur : guide hiver"',
      'Retargeting Facebook/Instagram avec photos locales',
      'Re-contact manuel à J+90 si signal d\'achat détecté (visite site, ouverture newsletter)',
      'Tag CRM "cold" → exclusion des relances commerciales agressives',
    ],
    canaux: ['Mailchimp', 'Meta Ads (retargeting)'],
    sortie: '→ Réveil en P2 si signal d\'achat détecté',
  },
  {
    phase: 'P7', titre: 'Suivi devis & closing', timing: 'Après RDV', couleur: '#15803d', icone: '💼',
    desc: 'Le devis a été envoyé, on accompagne jusqu\'à la signature.',
    actions: [
      'Auto-relance J+7 si devis pas signé : message court avec rappel des bénéfices',
      'Auto-relance J+14 : appel programmé pour le commercial + email "objection prix"',
      'Auto-relance J+21 : dernière offre (financement, geste commercial limité)',
      'Notification responsable si devis > 30k€ et > 15j sans réponse → reprise main',
      'Tracking : taux d\'ouverture, parties du devis les plus consultées (avec un outil type DocSend)',
    ],
    canaux: ['Outlook', 'WhatsApp', 'Slack'],
    sortie: '→ Commande signée · ou Perdu (raison documentée pour learning)',
  },
];

const KPIS = [
  { l: 'Délai 1er contact', v: '< 15 min', sub: 'objectif vs 4 min actuel' },
  { l: 'Conversion lead → RDV', v: '> 35 %', sub: '14,9 % actuel' },
  { l: 'Conversion RDV → devis', v: '> 80 %', sub: 'standard du marché' },
  { l: 'Conversion devis → cmd', v: '> 35 %', sub: '25 % actuel' },
  { l: 'Cycle moyen lead → cmd', v: '< 21 j', sub: '~35 j actuel' },
  { l: 'Coût par conversion', v: '< 600 €', sub: 'tous canaux confondus' },
];

const CONNECTEURS_REQUIS = [
  { nom: 'Odoo CRM',         statut: 'partiel', desc: 'Création + suivi fiches lead, stages, tags' },
  { nom: 'Outlook',          statut: 'config',  desc: 'Envoi mails + tracking réponses' },
  { nom: 'WhatsApp Business',statut: 'absent',  desc: 'API Cloud Meta — à configurer' },
  { nom: 'Calendly',         statut: 'absent',  desc: 'Prise de RDV auto + webhook vers CRM' },
  { nom: 'Claude API',       statut: 'absent',  desc: 'Génération messages personnalisés + scoring' },
  { nom: 'Google Places',    statut: 'absent',  desc: 'Enrichissement géolocalisation' },
  { nom: 'SMS (OVH/Twilio)', statut: 'absent',  desc: 'Relances courtes complémentaires' },
];

export default function AgentQualification() {
  return (
    <>
      <Head><title>Agent Qualification · Dashboard Groupe</title></Head>
      <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: '16px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', color: '#fff', borderRadius: 14, padding: '20px 24px', marginBottom: 16, boxShadow: '0 6px 20px rgba(8,145,178,.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>🤖</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <Link href="/" style={{ fontSize: 11, color: '#a5f3fc', textDecoration: 'none' }}>← Dashboard</Link>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginTop: 2 }}>Agent Qualification</div>
                <div style={{ fontSize: 13, color: '#cffafe', marginTop: 4 }}>Tunnel automatisé de conversion : du lead entrant à la commande signée. 8 phases, 4 canaux, IA personnalisée.</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>🚧 À développer</span>
                <Link href="/agents/prospection" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,.3)' }}>← Agent Prospection</Link>
              </div>
            </div>
          </div>

          {/* Mission */}
          <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: '18px 22px', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>🎯 Mission de l'agent</div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              <strong>Maximiser le taux de conversion des leads entrants</strong> en orchestrant un parcours de nurturing 100% automatisé et personnalisé, calibré pour le cycle de décision long de la piscine et du spa (3-12 mois). L'agent reçoit chaque lead, l'enrichit, le score, déclenche des séquences multi-canaux (email, WhatsApp, SMS, retargeting), passe la main aux commerciaux au bon moment, et apprend de chaque issue pour s'améliorer.
            </div>
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 8, fontSize: 12, color: '#0e7490' }}>
              💡 <strong>Principe directeur :</strong> ne JAMAIS laisser un lead chaud sans réponse plus de 15 minutes. Apporter de la valeur AVANT de demander quelque chose. Personnaliser à fond avec les données locales (photos, témoignages, ville).
            </div>
          </div>

          {/* Tunnel visuel */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12, paddingLeft: 8, borderLeft: '3px solid #0891b2' }}>
              <span style={{ fontSize: 16 }}>🌀</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Tunnel de conversion — 8 phases</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
              {/* Ligne verticale en fond */}
              <div style={{ position: 'absolute', left: 26, top: 30, bottom: 30, width: 2, background: 'linear-gradient(180deg, #0891b2 0%, #16a34a 100%)', opacity: 0.2, borderRadius: 99, zIndex: 0 }} />
              {TUNNEL.map((p, i) => (
                <div key={p.phase} style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 14, background: '#fff', border: '1px solid #e8ecf0', borderLeft: `4px solid ${p.couleur}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: p.couleur, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0, border: '3px solid #fff', boxShadow: `0 0 0 2px ${p.couleur}` }}>
                    {p.phase}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 20 }}>{p.icone}</span>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{p.titre}</div>
                      <div style={{ fontSize: 10, padding: '2px 8px', background: `${p.couleur}15`, color: p.couleur, borderRadius: 99, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>⏱ {p.timing}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 10, lineHeight: 1.5 }}>{p.desc}</div>

                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Actions automatisées</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#475569', lineHeight: 1.7 }}>
                      {p.actions.map((a, j) => <li key={j}>{a}</li>)}
                    </ul>

                    <div style={{ display: 'flex', gap: 14, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Canaux :</span>
                        {p.canaux.map((c, j) => (
                          <span key={j} style={{ marginLeft: 6, fontSize: 11, padding: '2px 8px', background: '#f1f5f9', color: '#475569', borderRadius: 99, fontWeight: 600 }}>{c}</span>
                        ))}
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: 11, color: p.couleur, fontWeight: 700 }}>{p.sortie}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs cibles */}
          <Bloc icone="📊" titre="KPIs cibles du tunnel" couleur="#16a34a">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {KPIS.map((k, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e8ecf0', borderTop: '3px solid #16a34a', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{k.v}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{k.sub}</div>
                </div>
              ))}
            </div>
          </Bloc>

          {/* Connecteurs */}
          <Bloc icone="🔌" titre="Connecteurs nécessaires" couleur="#7c3aed">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {CONNECTEURS_REQUIS.map((c, i) => {
                const statusColors = {
                  config: { bg: '#d1fae5', fg: '#065f46', label: '✓ Configuré' },
                  partiel:{ bg: '#fef3c7', fg: '#92400e', label: '⚠ Partiel' },
                  absent: { bg: '#fee2e2', fg: '#991b1b', label: '✗ Absent' },
                };
                const s = statusColors[c.statut];
                return (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{c.nom}</div>
                      <span style={{ fontSize: 10, padding: '2px 8px', background: s.bg, color: s.fg, borderRadius: 99, fontWeight: 700 }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{c.desc}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, padding: '8px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#475569' }}>
              👉 Configurer dans <Link href="/connectors" style={{ color: '#7c3aed', fontWeight: 700 }}>🔌 Connecteurs</Link>
            </div>
          </Bloc>

          {/* Liens connexes */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <Link href="/agents/prospection" style={{ flex: 1, minWidth: 200, background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: '#fff', padding: '14px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>← Étape précédente</div>
              <div style={{ fontSize: 15, marginTop: 2 }}>🤖 Agent Prospection (outbound)</div>
            </Link>
            <Link href="/plan" style={{ flex: 1, minWidth: 200, background: 'linear-gradient(135deg, #6b21a8, #4c1d95)', color: '#fff', padding: '14px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Suivre le développement</div>
              <div style={{ fontSize: 15, marginTop: 2 }}>🧠 Plan de progression</div>
            </Link>
            <Link href="/kpi" style={{ flex: 1, minWidth: 200, background: 'linear-gradient(135deg, #E67E22, #c2410c)', color: '#fff', padding: '14px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Voir les indicateurs</div>
              <div style={{ fontSize: 15, marginTop: 2 }}>📊 KPI Groupe → Commercial</div>
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}

function Bloc({ icone, titre, couleur, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, paddingLeft: 8, borderLeft: `3px solid ${couleur}` }}>
        <span style={{ fontSize: 16 }}>{icone}</span>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{titre}</div>
      </div>
      {children}
    </div>
  );
}
