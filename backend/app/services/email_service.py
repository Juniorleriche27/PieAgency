"""
Email service — sends transactional emails via Resend.
Used for payment receipts and admin notifications.
"""

import logging

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def _receipt_html(
    full_name: str,
    amount: float,
    currency: str,
    service_label: str,
    reference: str | None,
    payment_id: str | None,
) -> str:
    ref_row = (
        f"<tr><td style='padding:6px 0;color:#6b7280;font-size:13px;'>Référence dossier</td>"
        f"<td style='padding:6px 0;font-weight:600;font-size:13px;'>{reference}</td></tr>"
        if reference else ""
    )
    pid_row = (
        f"<tr><td style='padding:6px 0;color:#6b7280;font-size:13px;'>ID paiement</td>"
        f"<td style='padding:6px 0;font-size:13px;color:#6b7280;'>{payment_id}</td></tr>"
        if payment_id else ""
    )
    return f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(13,27,56,.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d1b38 0%,#1e3560 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">PieAgency</div>
            <div style="color:rgba(255,255,255,.7);font-size:13px;margin-top:4px;">Accompagnement étudiant</div>
          </td>
        </tr>

        <!-- Success badge -->
        <tr>
          <td style="padding:32px 40px 0;text-align:center;">
            <div style="display:inline-block;background:#d1fae5;color:#065f46;font-size:13px;font-weight:700;padding:6px 16px;border-radius:999px;letter-spacing:.04em;">
              ✓ PAIEMENT CONFIRMÉ
            </div>
            <h1 style="margin:16px 0 4px;font-size:22px;font-weight:700;color:#0d1b38;">
              Merci, {full_name.split()[0]} !
            </h1>
            <p style="margin:0;color:#6b7280;font-size:14px;">
              Votre paiement a bien été reçu par PieAgency.
            </p>
          </td>
        </tr>

        <!-- Amount -->
        <tr>
          <td style="padding:24px 40px;">
            <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;text-align:center;border:1px solid #e2e8f0;">
              <div style="color:#6b7280;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;">Montant payé</div>
              <div style="font-size:36px;font-weight:800;color:#0d1b38;margin-top:4px;">
                {amount:,.0f} <span style="font-size:18px;">{currency}</span>
              </div>
              <div style="color:#6b7280;font-size:13px;margin-top:6px;">{service_label}</div>
            </div>
          </td>
        </tr>

        <!-- Details table -->
        <tr>
          <td style="padding:0 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f1f5f9;">
              {ref_row}
              {pid_row}
            </table>
          </td>
        </tr>

        <!-- Next steps -->
        <tr>
          <td style="padding:0 40px 32px;">
            <div style="background:#eff6ff;border-radius:10px;padding:16px 20px;">
              <div style="font-size:13px;font-weight:700;color:#1e40af;margin-bottom:6px;">📋 Prochaines étapes</div>
              <p style="margin:0;font-size:13px;color:#1e3a8a;line-height:1.6;">
                Notre équipe va vous contacter sous 24h pour la suite de votre dossier.
                Si vous avez des questions, répondez directement à cet email.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              PieAgency · <a href="https://pieagency.fr" style="color:#6b7280;">pieagency.fr</a> ·
              <a href="mailto:contact@pieagency.fr" style="color:#6b7280;">contact@pieagency.fr</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def send_payment_receipt(
    to_email: str,
    full_name: str,
    amount: float,
    currency: str,
    service_label: str,
    reference: str | None = None,
    payment_id: str | None = None,
) -> bool:
    """Send a payment receipt to the customer and BCC admin emails. Returns True on success."""
    if not settings.resend_enabled:
        logger.warning("Resend not configured — skipping receipt email to %s", to_email)
        return False

    html = _receipt_html(full_name, amount, currency, service_label, reference, payment_id)
    subject = f"Reçu de paiement PieAgency — {amount:,.0f} {currency}"

    payload: dict = {
        "from": settings.receipt_from_email,
        "to": [to_email],
        "subject": subject,
        "html": html,
    }
    bcc = list(settings.admin_email_list - {to_email.lower()})
    if bcc:
        payload["bcc"] = bcc

    try:
        resp = httpx.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10,
        )
        if resp.status_code >= 400:
            logger.warning("Resend error %s: %s", resp.status_code, resp.text[:300])
            return False
        logger.info("Receipt sent to %s (payment_id=%s)", to_email, payment_id)
        return True
    except Exception:
        logger.exception("Failed to send receipt email to %s", to_email)
        return False
