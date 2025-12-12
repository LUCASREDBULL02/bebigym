// src/components/BackupTools.jsx
import React, { useRef, useState, useEffect } from "react";

/**
 * BackupTools
 * Props:
 * - dataProvider(): => { logs, profile, bodyStats, other? }    // returns app data to export
 * - restoreHandler(payload): (payload) => void                 // sets entire app state from payload
 * - onToast(msg): optional function to show toast messages
 *
 * Funktioner:
 * - Export: genererar JSON och triggar nedladdning
 * - Import: användaren laddar upp .json -> visar preview/count och kräver bekräftelse innan restore
 * - Auto-backup: sparar snapshot i localStorage var 72h (och sparar timestamp)
 * - Restore last auto-backup-knapp
 */
export default function BackupTools({ dataProvider, restoreHandler, onToast }) {
  const fileInputRef = useRef(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState(null);
  const [autoBackupInfo, setAutoBackupInfo] = useState(() => {
    try {
      const raw = localStorage.getItem("bebi_auto_backup_meta");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const toast = (title) => {
    if (onToast) onToast(title);
  };

  // Export data -> trigger download
  function handleExport() {
    try {
      const payload = dataProvider();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.download = `bebi-backup-${now}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast("Export klar — nedladdning påbörjad");
    } catch (e) {
      console.error(e);
      toast("Fel vid export");
    }
  }

  // Manuell import: öppna file dialog
  function handleOpenImport() {
    setImportPreview(null);
    setImportError(null);
    if (fileInputRef.current) fileInputRef.current.click();
  }

  // När fil väljs: parse JSON, show preview and require confirm
  async function handleFilePicked(e) {
    setImportPreview(null);
    setImportError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const json = JSON.parse(text);
      // Basic sanity checks
      const keys = Object.keys(json || {});
      setImportPreview({
        fileName: f.name,
        keys,
        counts: {
          logs: (json.logs && json.logs.length) || 0,
          bodyStats: json.bodyStats ? Object.keys(json.bodyStats).reduce((s,k)=>s+(json.bodyStats[k]?.length||0),0) : 0,
        },
        raw: json,
      });
    } catch (err) {
      console.error(err);
      setImportError("Kunde inte läsa filen — kontrollera att det är giltig JSON.");
    } finally {
      // clear value so same file can be selected again next time
      e.target.value = "";
    }
  }

  // Confirmed import -> ask one more confirm (browser confirm)
  function handleConfirmImport() {
    if (!importPreview) return;
    const confirmMsg =
      "Vill du ersätta ALL nuvarande data med innehållet i backupen?\n\nDetta kan inte ångras (du kan dock exportera först). Vill du fortsätta?";
    if (!window.confirm(confirmMsg)) {
      toast("Import avbruten");
      return;
    }

    try {
      restoreHandler(importPreview.raw);
      setImportPreview(null);
      toast("Import klar — appen är uppdaterad.");
    } catch (err) {
      console.error(err);
      toast("Fel vid import — se console.");
    }
  }

  // AUTO BACKUP: skapa snapshot och spara i localStorage
  function createAutoBackup() {
    try {
      const snapshot = dataProvider();
      const meta = {
        timestamp: new Date().toISOString(),
        sizeBytes: new Blob([JSON.stringify(snapshot)]).size,
      };
      localStorage.setItem("bebi_auto_backup", JSON.stringify(snapshot));
      localStorage.setItem("bebi_auto_backup_meta", JSON.stringify(meta));
      setAutoBackupInfo(meta);
      toast("Auto-backup skapad");
    } catch (err) {
      console.error(err);
      toast("Fel vid auto-backup");
    }
  }

  // Restore last auto-backup (with confirm)
  function handleRestoreAutoBackup() {
    const raw = localStorage.getItem("bebi_auto_backup");
    if (!raw) {
      toast("Ingen auto-backup hittades");
      return;
    }
    const metaRaw = localStorage.getItem("bebi_auto_backup_meta");
    const meta = metaRaw ? JSON.parse(metaRaw) : null;
    const confirmMsg = `Vill du återställa senaste auto-backup (${meta?.timestamp || "okänt"})? Detta ersätter nuvarande data. Fortsätta?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      const payload = JSON.parse(raw);
      restoreHandler(payload);
      toast("Auto-backup återställd");
    } catch (err) {
      console.error(err);
      toast("Fel vid återställning av auto-backup");
    }
  }

  // On mount: schedule auto-backup every 72h (259200000 ms) and also create if none exists
  useEffect(() => {
    // ensure there's a backup at least once on install
    if (!localStorage.getItem("bebi_auto_backup")) {
      createAutoBackup();
    } else {
      const metaRaw = localStorage.getItem("bebi_auto_backup_meta");
      setAutoBackupInfo(metaRaw ? JSON.parse(metaRaw) : null);
    }

    const interval = setInterval(() => {
      createAutoBackup();
    }, 72 * 60 * 60 * 1000); // 72h

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="backup-tools card" style={{ padding: 12 }}>
      <h4 style={{ marginTop: 0 }}>Backup & Restore</h4>

      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <button className="btn" onClick={handleExport}>
          ⤓ Exportera (JSON)
        </button>

        <button className="btn" onClick={handleOpenImport}>
          ⤒ Importera (.json)
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleFilePicked}
        />

        <button className="btn" onClick={createAutoBackup}>
          ⚡ Skapa auto-backup nu
        </button>

        <button className="btn" onClick={handleRestoreAutoBackup}>
          ♻️ Återställ senaste auto-backup
        </button>
      </div>

      {autoBackupInfo && (
        <div className="small" style={{ marginBottom: 8 }}>
          Senaste auto-backup: <strong>{autoBackupInfo.timestamp}</strong> • {autoBackupInfo.sizeBytes} bytes
        </div>
      )}

      {importError && <div className="error small">{importError}</div>}

      {importPreview && (
        <div style={{ border: "1px dashed rgba(255,255,255,0.06)", padding: 8, borderRadius: 8 }}>
          <div><strong>Importförhandsvisning:</strong> {importPreview.fileName}</div>
          <div className="small" style={{ marginTop: 6 }}>
            Nycklar: {importPreview.keys.join(", ")}
          </div>
          <div className="small">Logs: {importPreview.counts.logs} • Kroppsmått: {importPreview.counts.bodyStats}</div>

          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => setImportPreview(null)}>Avbryt</button>
            <button className="btn-pink" onClick={handleConfirmImport}>Säkerställ & Importera</button>
          </div>
        </div>
      )}
    </div>
  );
}
