import { useState, useEffect } from "react";
import Head from "next/head";

const data = {
  societes: [
    {
      id: "luca",
      nom: "Luca Créations",
      pays: "🇧🇪",
      couleur: "#1a3a5c",
      accent: "#2e6da4",
      tresorerie: 18400,
      seuilAlerte: 15000,
      chantiers: [
        { id: 1, client: "Famille Dupont", ville: "Liège", type: "Piscine coque", avancement: 75, equipe: "Team A", statut: "En cours", alerte: false },
        { id: 2, client: "Résidence Les Pins", ville: "Namur", type: "Spa + terrasse", avancement: 40, equipe: "Team B", statut: "En cours", alerte: false },
        { id: 3, client: "M. Verhagen", ville: "Bruxelles", type: "Rénovation piscine", avancement: 10, equipe: "Team A", statut: "Démarrage", alerte: true },
        { id: 4, client: "Villa Ardennes", ville: "Bastogne", type: "Piscine + local tech", avancement: 90, equipe: "Team C", statut: "Finition", alerte: false },
      ],
      devis: [
        { client: "M. Martens", montant: 34500, date: "08/05/2026", statut: "En attente", jours: 8 },
        { client: "Mme Lecomte", montant: 18200, date: "02/05/2026", statut: "Urgent", jours: 14 },
        { client: "Camping du Lac", montant: 52000, date: "28/04/2026", statut: "Urgent", jours: 18 },
      ],
      ca_mensuel: [42000, 38000, 55000, 61000, 48000, 67000],
    },
    {
      id: "valorcia",
      nom: "Valorcia",
      pays: "🇱🇺",
      couleur: "#1e3a2f",
      accent: "#2d7a5a",
      tresorerie: 9200,
      seuilAlerte: 12000,
      chantiers: [
        { id: 1, client: "Château Heintz", ville: "Luxembourg", type: "Piscine extérieure", avancement: 60, equipe: "Team D", statut: "En cours", alerte: false },
        { id: 2, client: "Résidence Kirchberg", ville: "Luxembourg-Ville", type: "Spa collectif", avancement: 25, equipe: "Team E", statut: "En cours", alerte: true },
        { id: 3, client: "Villa Mondorf", ville: "Mondorf", type: "Piscine intérieure", avancement: 5, equipe: "Team D", statut: "Démarrage", alerte: false },
      ],
      devis: [
        { client: "Ambassade BE", montant: 78000, date: "05/05/2026", statut: "Chaud", jours: 11 },
        { client: "Domaine Duhr", montant: 41000, date: "24/04/2026", statut: "Urgent", jours: 22 },
      ],
      ca_mensuel: [28000, 31000, 29000, 44000, 38000, 51000],
    },
    {
      id: "spa123",
      nom: "123Spa",
      pays: "🇫🇷",
      couleur: "#2a1f3d",
      accent: "#6b3fa0",
      tresorerie: 31500,
      seuilAlerte: 20000,
      chantiers: [],
      devis: [
        { client: "Spa Belfort", montant: 12400, date: "10/05/2026", statut: "En attente", jours: 6 },
        { client: "Centre Wellness Lyon", montant: 28000, date: "06/05/2026", statut: "Chaud", jours: 10 },
      ],
      ecommerce: {
        ventes_mois: 89,
        ca_mois: 142600,
        panier_moyen: 1602,
        top_produits: [
          { nom: "Spa Vivo 6 places", vendus: 12, ca: 43200 },
          { nom: "Spa Nemo 4 places", vendus: 18, ca: 39600 },
          { nom: "Spa Luxe Duo", vendus: 8, ca: 24000 },
          { nom: "Accessoires & produits", vendus: 51, ca: 18900 },
        ],
        ventes_mois_hist: [54, 61, 72, 68, 81, 89],
      },
      ca_mensuel: [98000, 107000, 121000, 115000, 134000, 142600],
    },
  ],
  marketing: {
    google_ads: [
      { societe: "Luca Créations 🇧🇪", budget: 1200, depense: 1048, clics: 342, conversions: 14, cpa: 74.8, roas: 3.2 },
      { societe: "Valorcia 🇱🇺", budget: 900, depense: 812, clics: 198, conversions: 8, cpa: 101.5, roas: 2.8 },
      { societe: "123Spa 🇫🇷", budget: 2500, depense: 2341, clics: 1204, conversions: 67, cpa: 34.9, roas: 4.7 },
    ],
    meta_ads: [
      { societe: "Luca Créations 🇧🇪", budget: 800, depense: 734, portee: 18400, clics: 412, conversions: 9 },
      { societe: "Valorcia 🇱🇺", budget: 600, depense: 521, portee: 9800, clics: 201, conversions: 5 },
      { societe: "123Spa 🇫🇷", budget: 1800, depense: 1672, portee: 44200, clics: 2104, conversions: 48 },
    ],
  },
  juridique: {
    dossiers: [
      { nom: "Desjoyaux", statut: "ACTIF", priorite: "URGENCE", type: "Litige commercial", prochaine_action: "Réponse avocat attendue", echeance: "23/05/2026", societe: "Luca Créations 🇧🇪", risque: "Élevé" },
      { nom: "Contrat fournisseur Pool Tech", statut: "En révision", priorite: "Normal", type: "Contrat", prochaine_action: "Validation clauses", echeance: "30/05/2026", societe: "Valorcia 🇱🇺", risque: "Faible" },
    ],
  },
  agents: [
    // ─── Commercial ─────────────────────────────────────────────────────
    { nom: "Agent Commercial", icone: "🎯", avatarSeed: "commercial-bot-42", type: "AGENT", categorie: "Commercial", statut: "En dev", env: "Vercel", avancement: 40, desc: "Analyse leads, traçabilité, relances devis", couleur: "#dc2626", sources: ["Odoo CRM", "Outlook", "Jotform"], onglet: "commercial-agent" },
    { nom: "/devis-relance", icone: "📨", avatarSeed: "devis-bot-11", type: "SKILL", categorie: "Commercial", statut: "Actif", env: "Vercel", avancement: 70, desc: "Relance automatique devis sans réponse > 7j", couleur: "#ef4444", sources: ["Odoo Vente", "Outlook"] },
    { nom: "/lead-qualif", icone: "🔎", avatarSeed: "lead-bot-22", type: "SKILL", categorie: "Commercial", statut: "En dev", env: "—", avancement: 30, desc: "Qualification auto des leads entrants (BANT)", couleur: "#f97316", sources: ["Jotform", "Outlook"] },
    { nom: "Closing Coach", icone: "🎙️", avatarSeed: "closing-bot-55", type: "MISSION", categorie: "Commercial", statut: "Concept", env: "—", avancement: 10, desc: "Coach IA pour finaliser les gros deals (> 30k€)", couleur: "#b91c1c", sources: ["Odoo Vente"] },

    // ─── Comptabilité ───────────────────────────────────────────────────
    { nom: "Agent Compta", icone: "📊", avatarSeed: "compta-bot-01", type: "AGENT", categorie: "Comptabilité", statut: "En dev", env: "Vercel", avancement: 25, desc: "Rapprochements bancaires, alertes anomalies", couleur: "#0891b2", sources: ["Odoo Compta", "Banque"] },
    { nom: "/facture-relance", icone: "💰", avatarSeed: "facture-bot-31", type: "ROUTINE", categorie: "Comptabilité", statut: "Actif", env: "Vercel", avancement: 65, desc: "Relance impayés à J+15 / J+30 / J+45", couleur: "#0e7490", sources: ["Odoo Compta", "Email"] },
    { nom: "/tresorerie-alerte", icone: "🚨", avatarSeed: "treso-bot-44", type: "HOOK", categorie: "Comptabilité", statut: "Actif", env: "Vercel", avancement: 90, desc: "Alerte Slack si tréso société < seuil critique", couleur: "#0284c7", sources: ["OneDrive Excel"], onglet: "finance" },
    { nom: "/tva-mensuelle", icone: "🧾", avatarSeed: "tva-bot-67", type: "ROUTINE", categorie: "Comptabilité", statut: "En dev", env: "—", avancement: 20, desc: "Préparation déclaration TVA mensuelle multi-pays", couleur: "#1e40af", sources: ["Odoo Compta"] },

    // ─── Opérations ─────────────────────────────────────────────────────
    { nom: "Agent Chantiers", icone: "🏗️", avatarSeed: "chantier-bot-13", type: "AGENT", categorie: "Opérations", statut: "En dev", env: "—", avancement: 30, desc: "Suivi avancement, alertes retards, photos terrain", couleur: "#16a34a", sources: ["Planneo", "Mobile équipes"], onglet: "chantiers" },
    { nom: "Planneo", icone: "📅", avatarSeed: "planneo-bot-77", type: "AGENT", categorie: "Opérations", statut: "Actif", env: "AWS", avancement: 80, desc: "Planning chantiers — API à développer", couleur: "#2d7a5a", sources: ["Planneo API"] },
    { nom: "/sav-triage", icone: "🛠️", avatarSeed: "sav-bot-89", type: "SKILL", categorie: "Opérations", statut: "Concept", env: "—", avancement: 5, desc: "Tri SAV par urgence + assignation technicien", couleur: "#15803d", sources: ["Outlook", "Téléphone"] },
    { nom: "/equipe-allocation", icone: "👥", avatarSeed: "team-bot-21", type: "MISSION", categorie: "Opérations", statut: "Concept", env: "—", avancement: 0, desc: "Optimisation allocation équipes A/B/C par chantier", couleur: "#14532d", sources: ["Planneo"] },

    // ─── Brand & Digital ────────────────────────────────────────────────
    { nom: "SEO-AUTO", icone: "📈", avatarSeed: "seo-bot-19", type: "AGENT", categorie: "Brand & Digital", statut: "En dev", env: "—", avancement: 35, desc: "Automatisation SEO contenu multi-sites", couleur: "#2e6da4", sources: ["GSC", "GA4"] },
    { nom: "/content-ideas", icone: "💡", avatarSeed: "ideas-bot-34", type: "SKILL", categorie: "Brand & Digital", statut: "Actif", env: "Vercel", avancement: 60, desc: "Idées de contenu blog mensuelles par société", couleur: "#3b82f6", sources: ["GSC", "Trends"] },
    { nom: "/social-post", icone: "📱", avatarSeed: "social-bot-56", type: "ROUTINE", categorie: "Brand & Digital", statut: "En dev", env: "—", avancement: 25, desc: "Posts auto Instagram + LinkedIn + Facebook", couleur: "#7c3aed", sources: ["Meta API", "LinkedIn API"] },
    { nom: "/ads-optimizer", icone: "🎯", avatarSeed: "ads-bot-78", type: "ROUTINE", categorie: "Brand & Digital", statut: "Concept", env: "—", avancement: 5, desc: "Optim CPA Google Ads + Meta hebdomadaire", couleur: "#6366f1", sources: ["Google Ads", "Meta Ads"] },

    // ─── Secrétariat ────────────────────────────────────────────────────
    { nom: "Agent Secrétaire", icone: "📋", avatarSeed: "secretary-bot-99", type: "AGENT", categorie: "Secrétariat", statut: "En dev", env: "Vercel", avancement: 40, desc: "Gestion TODOs, briefing mails, agenda quotidien", couleur: "#a855f7", sources: ["Gmail", "Outlook", "Calendars"] },
    { nom: "/todo", icone: "✅", avatarSeed: "todo-bot-12", type: "SKILL", categorie: "Secrétariat", statut: "Actif", env: "Vercel", avancement: 80, desc: "Ajout / check / suppression TODO avec rappels", couleur: "#c084fc", sources: ["KV Storage"] },
    { nom: "/inbox-triage", icone: "📥", avatarSeed: "inbox-bot-23", type: "SKILL", categorie: "Secrétariat", statut: "En dev", env: "—", avancement: 30, desc: "Tri intelligent inbox Gmail + Outlook par priorité", couleur: "#9333ea", sources: ["Gmail API", "Microsoft Graph"] },
    { nom: "/agenda", icone: "🗓️", avatarSeed: "agenda-bot-45", type: "SKILL", categorie: "Secrétariat", statut: "En dev", env: "—", avancement: 35, desc: "Briefing matin : RDV du jour + prep par RDV", couleur: "#7e22ce", sources: ["Google Calendar", "Outlook Calendar"] },

    // ─── Dev Apps ───────────────────────────────────────────────────────
    { nom: "Smart-Deal", icone: "💼", avatarSeed: "smartdeal-bot-88", type: "AGENT", categorie: "Dev Apps", statut: "En dev", env: "—", avancement: 20, desc: "Optimisation devis & closing piscines/spas", couleur: "#6b3fa0", sources: ["Odoo Vente"] },
    { nom: "CoachMe", icone: "🧠", avatarSeed: "coachme-bot-33", type: "AGENT", categorie: "Dev Apps", statut: "En dev", env: "—", avancement: 15, desc: "Coaching IA équipes terrain via mobile", couleur: "#b5600c", sources: ["Mobile équipes"] },
    { nom: "Worker Claude Local", icone: "🤖", avatarSeed: "worker-bot-00", type: "HOOK", categorie: "Dev Apps", statut: "Concept", env: "Local Mac", avancement: 5, desc: "Worker local qui exécute les ordres via Claude Code (abo Max)", couleur: "#475569", sources: ["KV Queue", "Claude CLI"] },
  ],
  tresorerieHebdo: {
    source_fichier: "Previsionnel_Tresorerie_TDB.xlsx",
    onedrive_path: "OneDrive/Finance/",
    derniere_maj: "2026-05-22 06:30",
    semaines: [
      { semaine: "S10", entrees: 5000, sorties: 13750, difference: -8750, cumul: 41235 },
      { semaine: "S11", entrees: 0, sorties: 39880, difference: -39880, cumul: 1355 },
      { semaine: "S12", entrees: 39800, sorties: 0, difference: 39800, cumul: 41155 },
      { semaine: "S13", entrees: 7000, sorties: 16000, difference: -9000, cumul: 32155 },
      { semaine: "S14", entrees: 0, sorties: 0, difference: 0, cumul: 32155 },
      { semaine: "S15", entrees: 16100, sorties: 13000, difference: 3100, cumul: 35255 },
      { semaine: "S16", entrees: 9700, sorties: 0, difference: 9700, cumul: 44955 },
      { semaine: "S17", entrees: 57644, sorties: 49600, difference: 8044, cumul: 52999 },
      { semaine: "S18", entrees: 27000, sorties: 20000, difference: 7000, cumul: 59999 },
      { semaine: "S19", entrees: 0, sorties: 0, difference: 0, cumul: 59999 },
      { semaine: "S20", entrees: 0, sorties: 0, difference: 0, cumul: 59999 },
      { semaine: "S21", entrees: 38800, sorties: 27000, difference: 11800, cumul: 71799 },
    ],
  },
  commercialAgent: {
    connexions: [
      { service: "Odoo CRM", statut: "connecté", icone: "🟢", desc: "Lecture pipeline & opportunités" },
      { service: "Odoo Vente", statut: "connecté", icone: "🟢", desc: "Lecture devis & statuts" },
      { service: "Outlook (Microsoft 365)", statut: "à connecter", icone: "🔴", desc: "Tracking emails entrants/sortants" },
      { service: "Jotform", statut: "à connecter", icone: "🔴", desc: "Webhook nouveaux leads" },
    ],
    kpis: { leads_mois: 47, devis_envoyes: 28, devis_sans_reponse: 9, relances_envoyees: 23, conversions: 7, taux_conversion: 14.9 },
    sources_leads: [
      { source: "Jotform", count: 12, couleur: "#f97316" },
      { source: "Outlook", count: 18, couleur: "#2e6da4" },
      { source: "Odoo CRM", couleur: "#6b3fa0", count: 11 },
      { source: "Site web", count: 6, couleur: "#2d7a5a" },
    ],
    leads_a_traiter: [
      { nom: "Pierre Lambert", source: "Jotform", societe: "Luca 🇧🇪", jours: 1, demande: "Devis piscine coque 8x4", urgent: false },
      { nom: "Mme Hoffmann", source: "Outlook", societe: "Valorcia 🇱🇺", jours: 2, demande: "Rénovation piscine intérieure", urgent: false },
      { nom: "Restaurant Le Coq", source: "Odoo CRM", societe: "Luca 🇧🇪", jours: 3, demande: "Spa pro 10 places", urgent: true },
      { nom: "Sylvie Mertens", source: "Jotform", societe: "123Spa 🇫🇷", jours: 4, demande: "Spa Vivo 6 places", urgent: false },
      { nom: "M. Dieudonné", source: "Outlook", societe: "Valorcia 🇱🇺", jours: 6, demande: "Étude faisabilité piscine", urgent: true },
    ],
    devis_a_relancer: [
      { client: "Camping du Lac", montant: 52000, jours: 18, societe: "Luca 🇧🇪", action: "Appel + email programmé pour demain 10h" },
      { client: "Domaine Duhr", montant: 41000, jours: 22, societe: "Valorcia 🇱🇺", action: "2e relance email — modèle 'objection prix'" },
      { client: "Mme Lecomte", montant: 18200, jours: 14, societe: "Luca 🇧🇪", action: "Relance SMS suggérée" },
    ],
    actions_agent: [
      { date: "Aujourd'hui 09:14", type: "Email envoyé", desc: "Relance Camping du Lac — modèle 'reminder J+15'" },
      { date: "Aujourd'hui 08:30", type: "Lead créé Odoo", desc: "Pierre Lambert (Jotform → Odoo CRM Luca)" },
      { date: "Hier 17:42", type: "Devis tracké", desc: "Domaine Duhr — devis 22 jours sans réponse, escaladé" },
      { date: "Hier 14:15", type: "Note CRM", desc: "M. Verhagen → ajout note 'attente retour permis'" },
    ],
  },
};

const MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"];

// Génère l'URL d'un avatar robot DiceBear pour un agent.
// Service public, pas d'API key, SVG renvoyé directement.
function agentAvatarUrl(seed, color) {
  const bg = (color || "#1e293b").replace("#", "");
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=20`;
}

function MiniBar({ values, color }) {
  const max = Math.max(...values);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36 }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, background: i === values.length - 1 ? color : color + "55", borderRadius: 2, height: `${(v / max) * 100}%`, minHeight: 4 }} />
      ))}
    </div>
  );
}

function Badge({ label, type }) {
  const styles = {
    urgent: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" },
    chaud: { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" },
    actif: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" },
    ok: { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" },
    dev: { background: "#e0e7ff", color: "#3730a3", border: "1px solid #a5b4fc" },
    normal: { background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" },
  };
  const s = styles[type] || styles.normal;
  return (
    <span style={{ ...s, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, letterSpacing: 0.3, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 5, background: "#e2e8f0", borderRadius: 99, overflow: "hidden", marginTop: 4 }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 99, transition: "width .6s ease" }} />
    </div>
  );
}

function KpiCard({ label, value, sub, alert, color }) {
  return (
    <div style={{ background: "#fff", border: alert ? "1.5px solid #fca5a5" : "1px solid #e8ecf0", borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: alert ? "#dc2626" : (color || "#1e293b"), lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8" }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [societeActive, setSocieteActive] = useState("luca");
  const [agentTypeFilter, setAgentTypeFilter] = useState("ALL");
  const [commercialLive, setCommercialLive] = useState(null);
  const [commercialStatus, setCommercialStatus] = useState("idle"); // idle | loading | live | error
  const [commercialError, setCommercialError] = useState(null);
  const [tresorerieLive, setTresorerieLive] = useState(null);
  const [tresorerieStatus, setTresorerieStatus] = useState("idle");
  const [tresorerieError, setTresorerieError] = useState(null);

  useEffect(() => {
    if (tab !== "finance" || tresorerieStatus === "loading" || tresorerieStatus === "live") return;
    setTresorerieStatus("loading");
    fetch("/api/tresorerie")
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setTresorerieLive(d);
          setTresorerieStatus("live");
        } else {
          setTresorerieError(d.error || "Erreur OneDrive");
          setTresorerieStatus("error");
        }
      })
      .catch(e => {
        setTresorerieError(e.message);
        setTresorerieStatus("error");
      });
  }, [tab, tresorerieStatus]);

  useEffect(() => {
    if (tab !== "commercial-agent" || commercialStatus === "loading" || commercialStatus === "live") return;
    setCommercialStatus("loading");
    fetch("/api/commercial")
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setCommercialLive(d);
          setCommercialStatus("live");
        } else {
          setCommercialError(d.error || "Erreur Odoo");
          setCommercialStatus("error");
        }
      })
      .catch(e => {
        setCommercialError(e.message);
        setCommercialStatus("error");
      });
  }, [tab, commercialStatus]);

  const societe = data.societes.find(s => s.id === societeActive);
  const totalTreso = data.societes.reduce((a, s) => a + s.tresorerie, 0);
  const totalAlerts = data.societes.filter(s => s.tresorerie < s.seuilAlerte).length;
  const totalChantiers = data.societes.reduce((a, s) => a + s.chantiers.length, 0);
  const totalDevis = data.societes.reduce((a, s) => a + s.devis.length, 0);
  const devisUrgents = data.societes.reduce((a, s) => a + s.devis.filter(d => d.statut === "Urgent").length, 0);

  const tabs = [
    { id: "overview", label: "Vue générale" },
    { id: "chantiers", label: "Chantiers" },
    { id: "commercial", label: "Commercial" },
    { id: "finance", label: "Finance" },
    { id: "ecommerce", label: "123Spa e-commerce" },
    { id: "marketing", label: "Marketing" },
    { id: "juridique", label: "Juridique" },
    { id: "commercial-agent", label: "🎯 Agent Commercial" },
    { id: "agents", label: "Agents" },
  ];

  const navStyle = (id) => ({
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: tab === id ? 600 : 400,
    color: tab === id ? "#1e293b" : "#64748b",
    cursor: "pointer",
    background: "none",
    border: "none",
    borderBottom: tab === id ? "2px solid #1e293b" : "2px solid transparent",
    whiteSpace: "nowrap",
  });

  const societeNavStyle = (id) => ({
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: societeActive === id ? 600 : 400,
    color: societeActive === id ? "#fff" : "#475569",
    background: societeActive === id ? societe.accent : "transparent",
    border: "1px solid " + (societeActive === id ? societe.accent : "#e2e8f0"),
    borderRadius: 8,
    cursor: "pointer",
  });

  return (
    <>
      <Head>
        <title>Dashboard Groupe Piscine & Spa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#1e293b" }}>
        {/* Header */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e8ecf0", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>Groupe Piscine & Spa</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
              ⚠ Desjoyaux — action requise
            </span>
            {totalAlerts > 0 && (
              <span style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                💶 Trésorerie — vigilance
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e8ecf0", padding: "0 28px", display: "flex", gap: 4, overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={navStyle(t.id)}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: "24px 28px", maxWidth: 1100 }}>

          {/* ─── VUE GÉNÉRALE ─── */}
          {tab === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
                <KpiCard label="Trésorerie groupe" value={`${(totalTreso / 1000).toFixed(1)}k€`} sub="3 sociétés consolidées" alert={totalAlerts > 0} />
                <KpiCard label="Chantiers actifs" value={totalChantiers} sub="BEL + LUX" color="#2e6da4" />
                <KpiCard label="Devis en attente" value={totalDevis} sub={`dont ${devisUrgents} urgents`} alert={devisUrgents > 0} />
                <KpiCard label="Dossier juridique" value="Desjoyaux" sub="Action requise — 23/05" alert={true} />
              </div>

              {/* Aperçu par société */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                {data.societes.map(s => (
                  <div key={s.id} style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ background: s.couleur, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{s.pays} {s.nom}</div>
                        <div style={{ fontSize: 12, color: "#ffffff99", marginTop: 2 }}>
                          {s.chantiers.length} chantiers · {s.devis.length} devis
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: s.tresorerie < s.seuilAlerte ? "#fca5a5" : "#86efac" }}>
                          {(s.tresorerie / 1000).toFixed(1)}k€
                        </div>
                        <div style={{ fontSize: 10, color: "#ffffff77" }}>trésorerie</div>
                      </div>
                    </div>
                    <div style={{ padding: "14px 18px" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>CA mensuel</div>
                      <MiniBar values={s.ca_mensuel} color={s.accent} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>Jan</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: s.accent }}>{(s.ca_mensuel[5] / 1000).toFixed(1)}k€ / jun</span>
                      </div>
                      {s.tresorerie < s.seuilAlerte && (
                        <div style={{ marginTop: 10, padding: "6px 10px", background: "#fee2e2", borderRadius: 8, fontSize: 12, color: "#991b1b", fontWeight: 500 }}>
                          ⚠ Trésorerie sous le seuil d'alerte ({(s.seuilAlerte / 1000).toFixed(0)}k€)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Refonte Valorcia */}
              <div style={{ marginTop: 20, background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>🇱🇺 Refonte Valorcia — priorité 2025</div>
                  <Badge label="En cours — 35%" type="dev" />
                </div>
                {[
                  { label: "Identité de marque", done: true },
                  { label: "Site web refonte", done: false, avancement: 60 },
                  { label: "Communication Luxembourg", done: false, avancement: 30 },
                  { label: "Expansion géographique", done: false, avancement: 10 },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 3 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, background: item.done ? "#d1fae5" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: item.done ? "#059669" : "#94a3b8", flexShrink: 0 }}>
                      {item.done ? "✓" : "·"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: item.done ? "#64748b" : "#1e293b" }}>{item.label}</div>
                      {!item.done && <ProgressBar value={item.avancement} color="#2d7a5a" />}
                    </div>
                    {!item.done && <span style={{ fontSize: 11, color: "#94a3b8" }}>{item.avancement}%</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── CHANTIERS ─── */}
          {tab === "chantiers" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {data.societes.filter(s => s.chantiers.length > 0).map(s => (
                  <button key={s.id} onClick={() => setSocieteActive(s.id)} style={societeNavStyle(s.id)}>
                    {s.pays} {s.nom}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {societe.chantiers.map(c => (
                  <div key={c.id} style={{ background: "#fff", border: c.alerte ? "1.5px solid #fca5a5" : "1px solid #e8ecf0", borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.client}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{c.type} · {c.ville} · {c.equipe}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {c.alerte && <Badge label="⚠ Alerte" type="urgent" />}
                        <Badge label={c.statut} type={c.statut === "Finition" ? "ok" : "normal"} />
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={c.avancement} color={societe.accent} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: societe.accent, minWidth: 36, textAlign: "right" }}>{c.avancement}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── COMMERCIAL ─── */}
          {tab === "commercial" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {data.societes.map(s => (
                  <button key={s.id} onClick={() => setSocieteActive(s.id)} style={societeNavStyle(s.id)}>
                    {s.pays} {s.nom}
                  </button>
                ))}
              </div>
              <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Devis en attente — {societe.pays} {societe.nom}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{societe.devis.length} devis actifs</span>
                </div>
                {societe.devis.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucun devis en attente</div>
                ) : (
                  societe.devis.map((d, i) => (
                    <div key={i} style={{ padding: "14px 20px", borderBottom: i < societe.devis.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{d.client}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Envoyé le {d.date} · {d.jours} jours sans réponse</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{d.montant.toLocaleString("fr-FR")} €</div>
                      <Badge label={d.statut} type={d.statut === "Urgent" ? "urgent" : d.statut === "Chaud" ? "chaud" : "normal"} />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ─── FINANCE ─── */}
          {tab === "finance" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                {data.societes.map(s => (
                  <KpiCard
                    key={s.id}
                    label={`${s.pays} ${s.nom}`}
                    value={`${(s.tresorerie / 1000).toFixed(1)}k€`}
                    sub={`Seuil alerte : ${(s.seuilAlerte / 1000).toFixed(0)}k€`}
                    alert={s.tresorerie < s.seuilAlerte}
                  />
                ))}
              </div>

              {/* ─ Graphique entrées / sorties hebdomadaire ─ */}
              {(() => {
                const tresor = (tresorerieStatus === "live" && tresorerieLive?.semaines?.length > 0)
                  ? tresorerieLive
                  : data.tresorerieHebdo;
                const semaines = tresor.semaines;
                const totalEntrees = semaines.reduce((a, w) => a + w.entrees, 0);
                const totalSorties = semaines.reduce((a, w) => a + w.sorties, 0);
                const soldeNet = totalEntrees - totalSorties;
                const maxVal = Math.max(...semaines.map(w => Math.max(w.entrees, w.sorties)));
                const status = tresorerieStatus === "loading" ? { label: "⏳ Chargement OneDrive…", bg: "#fef3c7", fg: "#92400e" }
                  : tresorerieStatus === "live" ? { label: "🟢 Live OneDrive", bg: "#d1fae5", fg: "#065f46" }
                  : tresorerieStatus === "error" ? { label: "⚠ OneDrive — données simulées", bg: "#fee2e2", fg: "#991b1b" }
                  : { label: "📦 Données simulées", bg: "#e0e7ff", fg: "#3730a3" };

                return (
                  <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Trésorerie hebdomadaire — entrées vs sorties</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          📁 {tresor.source_fichier || "Excel OneDrive"} · MAJ {tresor.derniere_maj || "—"}
                        </div>
                        {tresorerieError && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4, fontStyle: "italic" }}>{tresorerieError}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                        <span style={{ background: status.bg, color: status.fg, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{status.label}</span>
                        <button
                          onClick={() => { setTresorerieStatus("idle"); setTresorerieLive(null); setTresorerieError(null); }}
                          style={{ background: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", padding: "3px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 500 }}
                        >🔄 Rafraîchir</button>
                      </div>
                    </div>

                    {/* KPIs entrées / sorties / solde / trésorerie actuelle */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 18 }}>
                      <div style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px" }}>
                        <div style={{ fontSize: 10, color: "#065f46", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>↑ Entrées ({semaines.length}s)</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#059669" }}>{(totalEntrees / 1000).toFixed(1)}k€</div>
                      </div>
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px" }}>
                        <div style={{ fontSize: 10, color: "#991b1b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>↓ Sorties ({semaines.length}s)</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#dc2626" }}>{(totalSorties / 1000).toFixed(1)}k€</div>
                      </div>
                      <div style={{ background: soldeNet >= 0 ? "#eff6ff" : "#fef2f2", border: "1px solid " + (soldeNet >= 0 ? "#bfdbfe" : "#fecaca"), borderRadius: 10, padding: "10px 14px" }}>
                        <div style={{ fontSize: 10, color: soldeNet >= 0 ? "#1e40af" : "#991b1b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>= Solde net cumulé</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: soldeNet >= 0 ? "#2563eb" : "#dc2626" }}>{soldeNet >= 0 ? "+" : ""}{(soldeNet / 1000).toFixed(1)}k€</div>
                      </div>
                      {(() => {
                        const dernierCumul = [...semaines].reverse().find(w => w.cumul !== undefined && w.cumul !== 0);
                        if (!dernierCumul) return null;
                        return (
                          <div style={{ background: "#fdf4ff", border: "1px solid #f5d0fe", borderRadius: 10, padding: "10px 14px" }}>
                            <div style={{ fontSize: 10, color: "#86198f", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>🏦 Trésorerie fin {dernierCumul.semaine}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#a21caf" }}>{(dernierCumul.cumul / 1000).toFixed(1)}k€</div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Graphique miroir + ligne de trésorerie cumulée superposée */}
                    {(() => {
                      const W = 1100, H = 240, padL = 8, padR = 8, padT = 10, padB = 32;
                      const innerW = W - padL - padR;
                      const innerH = H - padT - padB;
                      const midY = padT + innerH / 2;
                      const colW = innerW / semaines.length;
                      const cumuls = semaines.map(w => w.cumul || 0).filter(v => v !== 0);
                      const hasCumul = cumuls.length > 0;
                      const cumulMin = hasCumul ? Math.min(...cumuls, 0) : 0;
                      const cumulMax = hasCumul ? Math.max(...cumuls, 0) : 1;
                      const cumulRange = cumulMax - cumulMin || 1;
                      const cumulY = (v) => padT + innerH - ((v - cumulMin) / cumulRange) * innerH;

                      const linePoints = semaines.map((w, i) => {
                        const x = padL + colW * (i + 0.5);
                        const y = cumulY(w.cumul || 0);
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      }).join(' ');

                      return (
                        <div style={{ overflowX: "auto", paddingBottom: 4 }}>
                          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: semaines.length * 28, height: H, display: "block" }} preserveAspectRatio="none">
                            {/* Axe central */}
                            <line x1={padL} y1={midY} x2={W - padR} y2={midY} stroke="#cbd5e1" strokeWidth="1" />

                            {/* Barres entrées (au-dessus) et sorties (en-dessous) */}
                            {semaines.map((w, i) => {
                              const x = padL + colW * i + 1;
                              const bw = Math.max(colW - 2, 1);
                              const hIn = (w.entrees / maxVal) * (innerH / 2);
                              const hOut = (w.sorties / maxVal) * (innerH / 2);
                              return (
                                <g key={i}>
                                  {w.entrees > 0 && (
                                    <rect x={x} y={midY - hIn} width={bw} height={hIn} fill="url(#gIn)" rx="2">
                                      <title>{`${w.semaine} — Entrées : ${w.entrees.toLocaleString("fr-FR")} €`}</title>
                                    </rect>
                                  )}
                                  {w.sorties > 0 && (
                                    <rect x={x} y={midY} width={bw} height={hOut} fill="url(#gOut)" rx="2">
                                      <title>{`${w.semaine} — Sorties : ${w.sorties.toLocaleString("fr-FR")} €`}</title>
                                    </rect>
                                  )}
                                </g>
                              );
                            })}

                            {/* Ligne de trésorerie cumulée */}
                            {hasCumul && (
                              <>
                                <polyline points={linePoints} fill="none" stroke="#a21caf" strokeWidth="2" />
                                {semaines.map((w, i) => {
                                  if (!w.cumul) return null;
                                  const x = padL + colW * (i + 0.5);
                                  const y = cumulY(w.cumul);
                                  return (
                                    <circle key={i} cx={x} cy={y} r="3" fill="#a21caf">
                                      <title>{`${w.semaine} — Trésorerie cumulée : ${w.cumul.toLocaleString("fr-FR")} €`}</title>
                                    </circle>
                                  );
                                })}
                              </>
                            )}

                            {/* Labels semaines */}
                            {semaines.map((w, i) => {
                              const x = padL + colW * (i + 0.5);
                              return (
                                <text key={i} x={x} y={H - 8} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">{w.semaine}</text>
                              );
                            })}

                            <defs>
                              <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                              </linearGradient>
                              <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="100%" stopColor="#dc2626" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      );
                    })()}

                    <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 8, fontSize: 11, color: "#64748b", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 10, height: 10, background: "#10b981", borderRadius: 2 }} /> Entrées
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 10, height: 10, background: "#ef4444", borderRadius: 2 }} /> Sorties
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 16, height: 2, background: "#a21caf", borderRadius: 1 }} /> Trésorerie cumulée
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>CA mensuel par société (6 derniers mois)</div>
                {data.societes.map(s => (
                  <div key={s.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{s.pays} {s.nom}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: s.accent }}>{(s.ca_mensuel[5] / 1000).toFixed(1)}k€ ce mois</span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {s.ca_mensuel.map((v, i) => (
                        <div key={i} style={{ flex: 1, textAlign: "center" }}>
                          <div style={{ height: 32, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                            <div style={{ width: "70%", background: i === 5 ? s.accent : s.accent + "44", borderRadius: 3, height: `${(v / Math.max(...s.ca_mensuel)) * 100}%`, minHeight: 4 }} />
                          </div>
                          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{MOIS[i]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── 123SPA E-COMMERCE ─── */}
          {tab === "ecommerce" && (() => {
            const sp = data.societes.find(s => s.id === "spa123");
            const ec = sp.ecommerce;
            return (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
                  <KpiCard label="Ventes juin" value={ec.ventes_mois} sub="spas vendus" color="#6b3fa0" />
                  <KpiCard label="CA juin" value={`${(ec.ca_mois / 1000).toFixed(1)}k€`} sub="+10% vs mai" color="#6b3fa0" />
                  <KpiCard label="Panier moyen" value={`${ec.panier_moyen.toLocaleString("fr-FR")} €`} sub="par commande" />
                  <KpiCard label="Trésorerie" value={`${(sp.tresorerie / 1000).toFixed(1)}k€`} sub="au-dessus du seuil" color="#059669" />
                </div>
                <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Top produits — juin 2026</div>
                  {ec.top_produits.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < ec.top_produits.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <div style={{ width: 24, height: 24, background: "#f1f5f9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#6b3fa0", flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{p.nom}</div>
                        <ProgressBar value={(p.ca / ec.ca_mois) * 100} color="#6b3fa0" />
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{p.ca.toLocaleString("fr-FR")} €</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.vendus} vendus</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Ventes mensuelles (6 mois)</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
                    {ec.ventes_mois_hist.map((v, i) => (
                      <div key={i} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", height: 60 }}>
                          <div style={{ width: "60%", background: i === 5 ? "#6b3fa0" : "#6b3fa044", borderRadius: 4, height: `${(v / Math.max(...ec.ventes_mois_hist)) * 100}%` }} />
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{MOIS[i]}</div>
                        <div style={{ fontSize: 11, fontWeight: i === 5 ? 700 : 400, color: i === 5 ? "#6b3fa0" : "#94a3b8" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ─── MARKETING ─── */}
          {tab === "marketing" && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Google Ads — performances mai 2026</div>
              <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
                {data.marketing.google_ads.map((c, i) => (
                  <div key={i} style={{ padding: "14px 20px", borderBottom: i < data.marketing.google_ads.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 140, fontWeight: 500, fontSize: 13 }}>{c.societe}</div>
                    <div style={{ flex: 1, display: "flex", gap: 20, flexWrap: "wrap" }}>
                      {[
                        { label: "Budget", val: `${c.budget}€` },
                        { label: "Dépensé", val: `${c.depense}€` },
                        { label: "Clics", val: c.clics },
                        { label: "Conversions", val: c.conversions },
                        { label: "CPA", val: `${c.cpa}€` },
                      ].map((kpi, j) => (
                        <div key={j} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{kpi.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{kpi.val}</div>
                        </div>
                      ))}
                    </div>
                    <Badge label={`ROAS ${c.roas}x`} type={c.roas >= 4 ? "ok" : c.roas >= 3 ? "chaud" : "urgent"} />
                  </div>
                ))}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Meta Ads (Facebook / Instagram) — mai 2026</div>
              <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, overflow: "hidden" }}>
                {data.marketing.meta_ads.map((c, i) => (
                  <div key={i} style={{ padding: "14px 20px", borderBottom: i < data.marketing.meta_ads.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 140, fontWeight: 500, fontSize: 13 }}>{c.societe}</div>
                    <div style={{ flex: 1, display: "flex", gap: 20, flexWrap: "wrap" }}>
                      {[
                        { label: "Budget", val: `${c.budget}€` },
                        { label: "Dépensé", val: `${c.depense}€` },
                        { label: "Portée", val: c.portee.toLocaleString("fr-FR") },
                        { label: "Clics", val: c.clics },
                        { label: "Conversions", val: c.conversions },
                      ].map((kpi, j) => (
                        <div key={j} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{kpi.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{kpi.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── JURIDIQUE ─── */}
          {tab === "juridique" && (
            <div>
              {data.juridique.dossiers.map((d, i) => (
                <div key={i} style={{ background: "#fff", border: d.priorite === "URGENCE" ? "1.5px solid #fca5a5" : "1px solid #e8ecf0", borderRadius: 14, padding: "20px 22px", marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{d.nom}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{d.societe} · {d.type}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Badge label={d.statut} type={d.priorite === "URGENCE" ? "actif" : "normal"} />
                      <Badge label={d.risque} type={d.risque === "Élevé" ? "urgent" : "ok"} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>PROCHAINE ACTION</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{d.prochaine_action}</div>
                    </div>
                    <div style={{ background: d.priorite === "URGENCE" ? "#fee2e2" : "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>ÉCHÉANCE</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: d.priorite === "URGENCE" ? "#dc2626" : "#1e293b" }}>{d.echeance}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── AGENT COMMERCIAL ─── */}
          {tab === "commercial-agent" && (() => {
            const mock = data.commercialAgent;
            const isLive = commercialStatus === "live" && commercialLive;
            const ag = isLive
              ? {
                  ...mock,
                  kpis: commercialLive.kpis,
                  sources_leads: commercialLive.sources_leads.length > 0 ? commercialLive.sources_leads : mock.sources_leads,
                  leads_a_traiter: commercialLive.leads_a_traiter.length > 0 ? commercialLive.leads_a_traiter : mock.leads_a_traiter,
                  devis_a_relancer: commercialLive.devis_a_relancer.length > 0 ? commercialLive.devis_a_relancer : mock.devis_a_relancer,
                  connexions: mock.connexions.map(c =>
                    c.service.startsWith("Odoo")
                      ? { ...c, statut: "connecté", icone: "🟢" }
                      : c
                  ),
                }
              : mock;
            const totalSources = ag.sources_leads.reduce((a, s) => a + s.count, 0) || 1;
            const statusBadge =
              commercialStatus === "loading" ? { label: "⏳ Chargement Odoo…", color: "#fef3c7", text: "#92400e" } :
              commercialStatus === "live" ? { label: "🟢 Live Odoo", color: "#d1fae5", text: "#065f46" } :
              commercialStatus === "error" ? { label: "⚠ Erreur Odoo — données simulées", color: "#fee2e2", text: "#991b1b" } :
              { label: "📦 Données simulées", color: "#e0e7ff", text: "#3730a3" };
            return (
              <div>
                {/* Bandeau agent */}
                <div style={{ background: "linear-gradient(135deg, #dc2626 0%, #9f1239 100%)", borderRadius: 16, padding: "20px 24px", color: "#fff", marginBottom: 20, display: "flex", alignItems: "center", gap: 18 }}>
                  <img
                    src={agentAvatarUrl("commercial-bot-42", "ffffff")}
                    alt="Avatar Agent Commercial"
                    style={{ width: 72, height: 72, borderRadius: 14, background: "rgba(255,255,255,0.12)", padding: 4, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Agent Commercial</div>
                    <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>Analyse leads, traçabilité, relances devis — multi-sociétés</div>
                    {commercialStatus === "error" && (
                      <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4, fontStyle: "italic" }}>{commercialError}</div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    <span style={{ background: statusBadge.color, color: statusBadge.text, padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                      {statusBadge.label}
                    </span>
                    <button
                      onClick={() => { setCommercialStatus("idle"); setCommercialLive(null); }}
                      style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "3px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 500 }}
                    >
                      🔄 Rafraîchir
                    </button>
                  </div>
                </div>

                {/* Connexions */}
                <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, padding: "16px 20px", marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Connexions API</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                    {ag.connexions.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: c.statut === "connecté" ? "#f0fdf4" : "#fef2f2", border: "1px solid " + (c.statut === "connecté" ? "#bbf7d0" : "#fecaca"), borderRadius: 10 }}>
                        <div style={{ fontSize: 14 }}>{c.icone}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{c.service}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{c.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
                  <KpiCard label="Leads ce mois" value={ag.kpis.leads_mois} sub="toutes sources" color="#dc2626" />
                  <KpiCard label="Devis envoyés" value={ag.kpis.devis_envoyes} sub="ce mois" color="#1e293b" />
                  <KpiCard label="Sans réponse" value={ag.kpis.devis_sans_reponse} sub="à relancer" alert={true} />
                  <KpiCard label="Relances auto" value={ag.kpis.relances_envoyees} sub="par l'agent" color="#2d7a5a" />
                  <KpiCard label="Conversions" value={ag.kpis.conversions} sub={`${ag.kpis.taux_conversion}% taux`} color="#2d7a5a" />
                </div>

                {/* Sources de leads */}
                <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Provenance des leads — ce mois</div>
                  <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
                    {ag.sources_leads.map((s, i) => (
                      <div key={i} style={{ flex: s.count, background: s.couleur, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 600 }}>
                        {s.count}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                    {ag.sources_leads.map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <div style={{ width: 10, height: 10, background: s.couleur, borderRadius: 2 }} />
                        <span style={{ fontWeight: 500 }}>{s.source}</span>
                        <span style={{ color: "#94a3b8" }}>{s.count} ({Math.round((s.count / totalSources) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leads à traiter */}
                <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>📥 Leads à traiter</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{ag.leads_a_traiter.length} en attente</span>
                  </div>
                  {ag.leads_a_traiter.map((l, i) => (
                    <div key={i} style={{ padding: "12px 20px", borderBottom: i < ag.leads_a_traiter.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{l.nom}</span>
                          {l.urgent && <Badge label="Urgent" type="urgent" />}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{l.demande} · {l.societe}</div>
                      </div>
                      <Badge label={l.source} type={l.source === "Jotform" ? "chaud" : l.source === "Outlook" ? "dev" : "normal"} />
                      <div style={{ fontSize: 12, color: l.jours > 3 ? "#dc2626" : "#94a3b8", fontWeight: 600, minWidth: 70, textAlign: "right" }}>
                        {l.jours}j sans suivi
                      </div>
                    </div>
                  ))}
                </div>

                {/* Devis à relancer */}
                <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, fontSize: 14 }}>
                    💬 Devis à relancer — actions suggérées par l'agent
                  </div>
                  {ag.devis_a_relancer.map((d, i) => (
                    <div key={i} style={{ padding: "14px 20px", borderBottom: i < ag.devis_a_relancer.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                        <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{d.client} <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 12 }}>· {d.societe}</span></div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{d.montant.toLocaleString("fr-FR")} €</div>
                        <Badge label={`${d.jours}j`} type="urgent" />
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", paddingLeft: 0, fontStyle: "italic" }}>→ {d.action}</div>
                    </div>
                  ))}
                </div>

                {/* Activité agent */}
                <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 14, padding: "16px 20px" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>📋 Activité récente de l'agent</div>
                  {ag.actions_agent.map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: i < ag.actions_agent.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center" }}>
                      <div style={{ fontSize: 11, color: "#94a3b8", minWidth: 130 }}>{a.date}</div>
                      <Badge label={a.type} type="dev" />
                      <div style={{ flex: 1, fontSize: 12, color: "#475569" }}>{a.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ─── AGENTS ─── */}
          {tab === "agents" && (() => {
            const TYPE_META = {
              AGENT:   { color: "#1e293b", bg: "#e2e8f0", desc: "Agent autonome" },
              SKILL:   { color: "#0c4a6e", bg: "#e0f2fe", desc: "Action ponctuelle" },
              MISSION: { color: "#831843", bg: "#fce7f3", desc: "Multi-étapes" },
              ROUTINE: { color: "#065f46", bg: "#d1fae5", desc: "Récurrent planifié" },
              HOOK:    { color: "#78350f", bg: "#fef3c7", desc: "Déclenché par événement" },
            };
            const CATEGORIES = ["Commercial", "Comptabilité", "Opérations", "Brand & Digital", "Secrétariat", "Dev Apps"];
            const typeFilter = agentTypeFilter;

            const filtered = data.agents.filter(a => typeFilter === "ALL" || a.type === typeFilter);
            const totalByType = data.agents.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {});
            const actifs = data.agents.filter(a => a.statut === "Actif").length;
            const enDev = data.agents.filter(a => a.statut === "En dev").length;
            const concepts = data.agents.filter(a => a.statut === "Concept").length;
            const avgAdv = Math.round(data.agents.reduce((s, a) => s + a.avancement, 0) / data.agents.length);

            return (
            <div>
              {/* En-tête : titre + KPIs */}
              <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", color: "#fff", borderRadius: 16, padding: "22px 24px", marginBottom: 18, boxShadow: "0 4px 16px rgba(15,23,42,.1)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>🤖 Réseau agentique Valorcia</div>
                    <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
                      {data.agents.length} agents · {Object.keys(TYPE_META).length} types · {CATEGORIES.length} catégories
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 22 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#86efac" }}>{actifs}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.6 }}>Actifs</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#fcd34d" }}>{enDev}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.6 }}>En dev</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#cbd5e1" }}>{concepts}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.6 }}>Concept</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#a78bfa" }}>{avgAdv}%</div>
                      <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.6 }}>Avancement moy.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtres par type */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                <button
                  onClick={() => setAgentTypeFilter("ALL")}
                  style={{
                    padding: "8px 14px", borderRadius: 99, border: "1px solid #cbd5e1",
                    background: typeFilter === "ALL" ? "#1e293b" : "#fff",
                    color: typeFilter === "ALL" ? "#fff" : "#475569",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Tous · {data.agents.length}
                </button>
                {Object.entries(TYPE_META).map(([t, m]) => (
                  <button
                    key={t}
                    onClick={() => setAgentTypeFilter(t)}
                    title={m.desc}
                    style={{
                      padding: "8px 14px", borderRadius: 99, border: `1px solid ${m.color}33`,
                      background: typeFilter === t ? m.color : m.bg,
                      color: typeFilter === t ? "#fff" : m.color,
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {t} · {totalByType[t] || 0}
                  </button>
                ))}
              </div>

              {/* Grille par catégorie */}
              {CATEGORIES.map(cat => {
                const agentsInCat = filtered.filter(a => a.categorie === cat);
                if (agentsInCat.length === 0) return null;
                return (
                  <div key={cat} style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #f1f5f9" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", letterSpacing: -0.2 }}>{cat}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{agentsInCat.length} agent{agentsInCat.length > 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                      {agentsInCat.map((app, i) => {
                        const typeMeta = TYPE_META[app.type] || TYPE_META.AGENT;
                        return (
                        <div
                          key={i}
                          onClick={() => app.onglet && setTab(app.onglet)}
                          style={{
                            background: "#fff",
                            border: "1px solid #e8ecf0",
                            borderLeft: `4px solid ${app.couleur}`,
                            borderRadius: 14,
                            padding: "18px 20px",
                            cursor: app.onglet ? "pointer" : "default",
                            transition: "transform .15s ease, box-shadow .15s ease",
                            position: "relative",
                          }}
                          onMouseEnter={(e) => app.onglet && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.06)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "none")}
                        >
                          {/* Badge type en haut à droite */}
                          <div style={{ position: "absolute", top: 12, right: 12, padding: "2px 8px", background: typeMeta.bg, color: typeMeta.color, fontSize: 9, fontWeight: 700, borderRadius: 4, letterSpacing: 0.6 }}>
                            {app.type}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                            <div style={{ width: 64, height: 64, borderRadius: 14, background: `linear-gradient(135deg, ${app.couleur}20 0%, ${app.couleur}40 100%)`, padding: 4, flexShrink: 0, boxShadow: `0 2px 8px ${app.couleur}30` }}>
                              <img
                                src={agentAvatarUrl(app.avatarSeed, app.couleur)}
                                alt={`Avatar ${app.nom}`}
                                style={{ width: "100%", height: "100%", borderRadius: 10, display: "block" }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0, paddingRight: 40 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.nom}</span>
                                <span style={{ fontSize: 14, opacity: 0.6 }}>{app.icone}</span>
                              </div>
                              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{app.env !== "—" ? `Hébergé : ${app.env}` : "Hébergement à définir"}</div>
                            </div>
                          </div>

                          <div style={{ fontSize: 12, color: "#475569", marginBottom: 12, lineHeight: 1.5, minHeight: 36 }}>{app.desc}</div>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                            {app.sources?.map((src, j) => (
                              <span key={j} style={{ fontSize: 10, padding: "2px 8px", background: "#f1f5f9", color: "#64748b", borderRadius: 99, fontWeight: 500 }}>
                                {src}
                              </span>
                            ))}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <Badge label={app.statut} type={app.statut === "Actif" ? "ok" : app.statut === "Concept" ? "normal" : "dev"} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: app.couleur }}>{app.avancement}%</span>
                          </div>
                          <ProgressBar value={app.avancement} color={app.couleur} />

                          {app.onglet && (
                            <div style={{ marginTop: 12, fontSize: 11, color: app.couleur, fontWeight: 600 }}>
                              → Voir le tableau de bord agent
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 20, background: "#f8fafc", border: "1px solid #e8ecf0", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Roadmap déploiement</div>
                {[
                  { phase: "Phase 1", label: "Dashboard Claude — données simulées", done: true },
                  { phase: "Phase 2", label: "Connexion Odoo (trésorerie, devis, facturation)", done: false },
                  { phase: "Phase 3", label: "Google Ads + Meta Ads API", done: false },
                  { phase: "Phase 4", label: "Planneo API + Outlook", done: false },
                  { phase: "Phase 5", label: "Déploiement Vercel + réseau agentique", done: false },
                ].map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: i < 4 ? "1px solid #e8ecf0" : "none" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, background: p.done ? "#d1fae5" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: p.done ? "#059669" : "#94a3b8", flexShrink: 0 }}>{p.done ? "✓" : "·"}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6b3fa0", minWidth: 60 }}>{p.phase}</div>
                    <div style={{ fontSize: 13, color: p.done ? "#94a3b8" : "#1e293b" }}>{p.label}</div>
                    {p.done && <Badge label="Fait" type="ok" />}
                  </div>
                ))}
              </div>
            </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
