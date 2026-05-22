import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        const next = typeof router.query.next === "string" ? router.query.next : "/";
        router.replace(next.startsWith("/") ? next : "/");
      } else {
        setError(data.error || "Erreur d'authentification");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Connexion — Dashboard Groupe</title></Head>
      <div style={{
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        background: "linear-gradient(135deg, #1a3a5c 0%, #1e3a2f 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}>
        <form onSubmit={submit} style={{
          background: "#fff",
          borderRadius: 16,
          padding: "32px 36px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Dashboard Groupe</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Piscine & Spa — accès restreint</div>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 6 }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 14,
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 16,
              fontFamily: "inherit",
            }}
          />

          {error && (
            <div style={{
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fca5a5",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 16,
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              padding: "11px",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              background: loading || !password ? "#94a3b8" : "#1e293b",
              border: "none",
              borderRadius: 8,
              cursor: loading || !password ? "not-allowed" : "pointer",
              transition: "background .15s",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </>
  );
}
