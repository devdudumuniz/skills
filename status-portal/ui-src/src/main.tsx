import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useApi } from "./components";
import { Icon, ProjectPortal } from "./project";
import "./styles.css";

// Mesmo shell do modo CLIENT_VIEWER do Control Center original; o papel vem do servidor (/api/session).
function parse(hash: string): URLSearchParams {
  const [, query] = hash.replace(/^#\/?/, "").split("?");
  return new URLSearchParams(query ?? "");
}

function Portal() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const session = useApi<{ role: string }>("session");
  const ov = useApi<{ project?: { title?: string } }>("project/overview");
  useEffect(() => {
    const title = ov.data?.project?.title;
    document.title = title ? `${title} — acompanhamento` : "Acompanhamento do projeto";
  }, [ov.data]);
  const role = session.data?.role ?? (session.error ? "CLIENT_VIEWER" : null);
  if (role === null) return <div className="muted" style={{ padding: 24 }}>Carregando…</div>;
  return (
    <div className="shell client portal-theme">
      <nav className="side" aria-label="Seções">
        <div className="brand brand-portal">
          <Icon n="scale" size={26} />
          <div>Acompanhamento<span>{role === "ADMIN" ? "visão da administração · somente leitura" : "visão do cliente · somente leitura"}</span></div>
        </div>
        <a href="#/acompanhamento" className="active" aria-current="page"><Icon n="file" size={16} />Projeto</a>
        <p className="side-note">Dados derivados do planejamento, do histórico de execução e das evidências do projeto.</p>
        <div id="side-foot" className="side-foot" />
      </nav>
      <main><ProjectPortal key={role} initial={parse(hash)} role={role} /></main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Portal />
  </StrictMode>,
);
