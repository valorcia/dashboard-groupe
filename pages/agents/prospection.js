import Head from 'next/head';
import Link from 'next/link';

const CIBLES = [
  { categorie: 'Campings & hôtellerie de plein air',  icone: '🏕️', exemples: 'Campings ★★★+, villages vacances, mobil-homes haut de gamme',                       volume: 'Élevé', panier: '40-150 k€', priorite: 'haute',    raison: 'Renouvellement équipements piscine commune ou spa balnéo, multi-sites'  },
  { categorie: 'Hôtels & spas urbains/ruraux',         icone: '🏨', exemples: 'Hôtels 4-5★, hôtels de charme, gîtes haut de gamme, demeures',                       volume: 'Moyen', panier: '60-200 k€', priorite: 'haute',    raison: 'Différenciation, montée en gamme, expérience client'                     },
  { categorie: 'Architectes & maîtres d\'œuvre',       icone: '📐', exemples: 'Cabinets archi haut de gamme, paysagistes premium, contractors',                     volume: 'Moyen', panier: '50-300 k€', priorite: 'critique', raison: 'Prescripteurs B2B, projets récurrents, chantiers groupés'                },
  { categorie: 'Syndics & gestionnaires d\'immobilier',icone: '🏢', exemples: 'Résidences avec piscine collective, syndics co-propriété, foncières',                volume: 'Faible',panier: '80-250 k€', priorite: 'moyenne',  raison: 'Marché de rénovation/conformité, contrats d\'entretien associés'         },
  { categorie: 'Centres de bien-être & instituts',     icone: '💆', exemples: 'Spas urbains, instituts de beauté, salles de sport haut de gamme',                   volume: 'Moyen', panier: '30-120 k€', priorite: 'moyenne',  raison: 'Wellness en pleine croissance, équipement balnéo'                        },
  { categorie: 'Constructeurs & promoteurs',           icone: '🏗️', exemples: 'Maisons individuelles haut de gamme, promoteurs villas, écolodges',                  volume: 'Moyen', panier: '50-150 k€', priorite: 'haute',    raison: 'Intégration dès la conception, volumes annuels'                          },
  { categorie: 'Particuliers haut patrimoine',         icone: '👤', exemples: 'Propriétaires villas, gestionnaires de patrimoine, family offices, profils LinkedIn',volume: 'Élevé', panier: '20-80 k€',  priorite: 'haute',    raison: 'Cœur de cible historique, recherche bouche-à-oreille'                    },
  { categorie: 'Communes & collectivités',             icone: '🏛️', exemples: 'Piscines municipales, centres aquatiques, écoles, EHPAD avec spa',                  volume: 'Faible',panier: '100-500 k€',priorite: 'basse',    raison: 'Long cycle de vente mais grosses opérations'                             },
];

const SOURCES = [
  { nom: 'Google Maps / Places API',     icone: '🗺️', desc: 'Extraction par catégorie SIRET + zone géo (campings, hôtels, instituts)' },
  { nom: 'LinkedIn Sales Navigator',     icone: '💼', desc: 'Recherche par poste (DG, syndic, archi) + filtres taille / zone'       },
  { nom: 'INSEE / SIRENE',               icone: '📋', desc: 'Base nationale des entreprises par NAF et zone de chalandise'           },
  { nom: 'Annuaires fédérations',        icone: '📒', desc: 'FFC (camping), UMIH (hôtellerie), CINOV (archi)'                       },
  { nom: 'Permis de construire publics', icone: '🏗️', desc: 'Veille sur PC piscine déposés dans un rayon de 100km'                  },
  { nom: 'Trafic web réciproque',        icone: '🔄', desc: 'Visiteurs site identifiés via Leadfeeder / Albacross'                  },
];

const WORKFLOW = [
  { etape: 1, titre: 'Définir la cible de la semaine',       desc: 'Le pilote ou l\'agent IA choisit une catégorie + zone géo (ex: campings 4★ en Belgique).',  duree: '1 min',  responsable: 'Pilote' },
  { etape: 2, titre: 'Extraction multi-sources',             desc: 'L\'agent interroge Google Maps + LinkedIn + INSEE et fusionne les contacts trouvés.',       duree: '< 5 min',responsable: 'Agent' },
  { etape: 3, titre: 'Enrichissement & dédoublonnage',       desc: 'Email, téléphone, site web, taille effectif, CA estimé. Détection des contacts déjà en CRM Odoo.',duree: '< 10 min',responsable: 'Agent' },
  { etape: 4, titre: 'Scoring & priorisation',               desc: 'Score 0-100 selon catégorie, panier moyen estimé, signaux d\'achat récents (PC déposé, levée de fonds).',duree: '< 2 min',responsable: 'Agent' },
  { etape: 5, titre: 'Génération de messages personnalisés', desc: 'Email + LinkedIn DM rédigés par IA, avec personnalisation locale (ville, photo d\'une réalisation proche).',duree: '< 5 min', responsable: 'Agent' },
  { etape: 6, titre: 'Validation humaine (review)',          desc: 'Le pilote review la liste finale et les drafts avant envoi (option : envoi auto si score > 80).', duree: '5 min',  responsable: 'Pilote' },
  { etape: 7, titre: 'Envoi orchestré',                      desc: 'Email (Outlook), LinkedIn DM (manuel ou Phantombuster), création des fiches dans Odoo CRM avec tag "prospect outbound".', duree: '< 5 min', responsable: 'Agent' },
  { etape: 8, titre: 'Suivi & transfert',                    desc: 'Quand un prospect répond positivement, transfert auto à l\'Agent Qualification qui prend le relais sur le tunnel inbound.', duree: 'Continu', responsable: 'Agent' },
];

const KPIS_CIBLE = [
  { l: 'Nouveaux contacts identifiés / semaine', v: '50-100', src: 'Agent' },
  { l: 'Score moyen des cibles',                  v: '> 60/100', src: 'Calcul' },
  { l: 'Taux de réponse (LinkedIn + email)',      v: '> 8 %',    src: 'Outlook + LinkedIn' },
  { l: 'Conversion réponse → RDV',                v: '> 25 %',   src: 'CRM Odoo' },
  { l: 'Coût par lead qualifié sortant',          v: '< 40 €',   src: 'Calcul' },
  { l: 'Pipeline généré / mois',                  v: '100-300 k€', src: 'Odoo CRM' },
];

export default function AgentProspection() {
  return (
    <>
      <Head><title>Agent Prospection · Dashboard Groupe</title></Head>
      <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: '16px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', color: '#fff', borderRadius: 14, padding: '20px 24px', marginBottom: 16, boxShadow: '0 6px 20px rgba(124,58,237,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>🤖</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <Link href="/" style={{ fontSize: 11, color: '#c4b5fd', textDecoration: 'none' }}>← Dashboard</Link>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginTop: 2 }}>Agent Prospection</div>
                <div style={{ fontSize: 13, color: '#ddd6fe', marginTop: 4 }}>Recherche outbound de contacts qualifiés en piscine & spa — campings, hôtels, architectes, syndics, particuliers haut patrimoine.</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>🚧 À développer</span>
                <Link href="/plan" style={{ background: '#E67E22', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Voir dans le plan ↗</Link>
              </div>
            </div>
          </div>

          {/* Pitch */}
          <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: '18px 22px', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>🎯 Mission de l'agent</div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              <strong>Identifier en continu des prospects B2B et B2C haut potentiel</strong> susceptibles d'être intéressés par une piscine, un spa ou un équipement balnéothérapique. L'agent croise plusieurs sources (Google Maps, LinkedIn, registres officiels, permis de construire), <strong>enrichit chaque contact</strong> (email, téléphone, taille, signaux d'achat), <strong>calcule un score</strong> de potentiel, <strong>rédige des messages personnalisés</strong> par IA, et alimente le CRM Odoo avec des prospects taggés <em>outbound</em>. Quand un prospect répond, le relais est passé à l'<Link href="/agents/qualification" style={{ color: '#0891b2', fontWeight: 700 }}>Agent Qualification</Link>.
            </div>
          </div>

          {/* Cibles */}
          <Bloc icone="🎯" titre="Cibles prioritaires" couleur="#7c3aed">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {CIBLES.map((c, i) => {
                const prioColors = { critique: '#dc2626', haute: '#f97316', moyenne: '#3b82f6', basse: '#94a3b8' };
                return (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e8ecf0', borderLeft: `4px solid ${prioColors[c.priorite]}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 22 }}>{c.icone}</span>
                      <div style={{ flex: 1, fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{c.categorie}</div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: prioColors[c.priorite], textTransform: 'uppercase', letterSpacing: 0.5 }}>● {c.priorite}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, lineHeight: 1.5 }}>{c.exemples}</div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                      <div><span style={{ color: '#94a3b8' }}>Volume :</span> <strong>{c.volume}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Panier :</span> <strong>{c.panier}</strong></div>
                    </div>
                    <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 6, fontStyle: 'italic' }}>→ {c.raison}</div>
                  </div>
                );
              })}
            </div>
          </Bloc>

          {/* Sources */}
          <Bloc icone="🔍" titre="Sources de prospection" couleur="#3b82f6">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {SOURCES.map((s, i) => (
                <div key={i} style={{ background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12 }}>
                  <div style={{ fontSize: 22 }}>{s.icone}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{s.nom}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Bloc>

          {/* Workflow */}
          <Bloc icone="⚙️" titre="Workflow étape par étape" couleur="#16a34a">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WORKFLOW.map((w) => (
                <div key={w.etape} style={{ display: 'flex', gap: 14, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, padding: '12px 14px', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{w.etape}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{w.titre}</div>
                      <div style={{ fontSize: 10, padding: '2px 8px', background: w.responsable === 'Agent' ? '#ede9fe' : '#fef3c7', color: w.responsable === 'Agent' ? '#5b21b6' : '#92400e', borderRadius: 99, fontWeight: 700 }}>{w.responsable === 'Agent' ? '🤖 Auto' : '👤 Humain'}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>⏱ {w.duree}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>{w.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Bloc>

          {/* KPIs */}
          <Bloc icone="📊" titre="KPIs cibles" couleur="#0891b2">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              {KPIS_CIBLE.map((k, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e8ecf0', borderTop: '3px solid #0891b2', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0891b2', marginTop: 4 }}>{k.v}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase', fontWeight: 600 }}>Source : {k.src}</div>
                </div>
              ))}
            </div>
          </Bloc>

          {/* Stack technique */}
          <Bloc icone="🛠️" titre="Stack technique envisagée" couleur="#64748b">
            <div style={{ background: '#1e293b', color: '#cbd5e1', borderRadius: 10, padding: '14px 18px', fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.7 }}>
              <div><span style={{ color: '#86efac' }}>// Pipeline outbound</span></div>
              <div><span style={{ color: '#fcd34d' }}>1.</span> Cron quotidien (Vercel Cron) → API Google Places + LinkedIn (Phantombuster)</div>
              <div><span style={{ color: '#fcd34d' }}>2.</span> Enrichissement → Clearbit / Hunter.io / INSEE API</div>
              <div><span style={{ color: '#fcd34d' }}>3.</span> Scoring → Claude API (analyse signaux faibles : taille, secteur, news)</div>
              <div><span style={{ color: '#fcd34d' }}>4.</span> Génération messages → Claude API (templates + variables locales)</div>
              <div><span style={{ color: '#fcd34d' }}>5.</span> Stockage → Odoo CRM via XML-RPC + tag <span style={{ color: '#fca5a5' }}>"prospect_outbound"</span></div>
              <div><span style={{ color: '#fcd34d' }}>6.</span> Trigger Agent Qualif quand <span style={{ color: '#fca5a5' }}>stage</span> change</div>
            </div>
          </Bloc>

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
