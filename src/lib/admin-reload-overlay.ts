export const ERP_UPLOAD_RELOAD_PENDING_KEY = "erp-upload-reload-pending";
export const ERP_UPLOAD_RELOAD_READY_EVENT = "erp-upload-reload-ready";

const OVERLAY_ID = "admin-upload-reload-overlay";

export type AdminUploadReloadPending = {
  message: string;
  detail?: string;
  phaseKey?: string;
  brandKitCardId?: string;
};

export function markAdminUploadReloadPending(payload: AdminUploadReloadPending): void {
  try {
    sessionStorage.setItem(ERP_UPLOAD_RELOAD_PENDING_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function peekAdminUploadReloadPending(): AdminUploadReloadPending | null {
  try {
    const raw = sessionStorage.getItem(ERP_UPLOAD_RELOAD_PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUploadReloadPending;
  } catch {
    return null;
  }
}

export function clearAdminUploadReloadPending(): void {
  try {
    sessionStorage.removeItem(ERP_UPLOAD_RELOAD_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function signalAdminUploadReloadReady(): void {
  if (typeof window === "undefined") return;
  clearAdminUploadReloadPending();
  window.dispatchEvent(new Event(ERP_UPLOAD_RELOAD_READY_EVENT));
}

function overlayMarkup(title: string, detail: string): string {
  return `
    <div style="
      position:fixed;inset:0;z-index:2147483646;
      display:flex;align-items:center;justify-content:center;
      padding:24px;
      background:rgba(242,242,242,0.92);
      backdrop-filter:blur(6px);
      font-family:'Helvetica Neue',Helvetica,'Segoe UI',Roboto,Arial,sans-serif;
    ">
      <div style="
        width:min(100%,380px);
        border-radius:20px;
        border:1px solid rgba(19,25,69,0.1);
        background:#fff;
        padding:28px 24px;
        box-shadow:0 24px 60px rgba(19,25,69,0.12);
        text-align:center;
      ">
        <div style="
          width:44px;height:44px;margin:0 auto 16px;
          border-radius:999px;
          border:3px solid rgba(50,63,246,0.15);
          border-top-color:#323FF6;
          animation:adminReloadSpin 0.85s linear infinite;
        "></div>
        <p style="margin:0;font-size:15px;font-weight:600;color:#131945;line-height:1.45;">${title}</p>
        <p style="margin:10px 0 0;font-size:13px;color:rgba(19,25,69,0.58);line-height:1.55;">${detail}</p>
      </div>
    </div>
    <style>
      @keyframes adminReloadSpin { to { transform: rotate(360deg); } }
    </style>
  `;
}

/** Overlay inmediato (sobrevive hasta el reload; en la nueva página lo retoma React). */
export function showAdminReloadOverlay(title: string, detail: string): void {
  if (typeof document === "undefined") return;
  hideAdminReloadOverlay();
  const root = document.createElement("div");
  root.id = OVERLAY_ID;
  root.setAttribute("role", "alertdialog");
  root.setAttribute("aria-busy", "true");
  root.setAttribute("aria-live", "assertive");
  root.innerHTML = overlayMarkup(title, detail);
  document.body.appendChild(root);
  document.body.style.overflow = "hidden";
}

export function hideAdminReloadOverlay(): void {
  if (typeof document === "undefined") return;
  document.getElementById(OVERLAY_ID)?.remove();
  document.body.style.overflow = "";
}
