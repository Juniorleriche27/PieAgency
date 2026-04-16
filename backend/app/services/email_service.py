"""
Email service — sends transactional emails via Resend.
Generates a PDF receipt attached to every payment confirmation.
Recipients: client + contact@pieagency.fr + junior.pieagency@gmail.com
"""

import base64
import io
import logging
from datetime import datetime, timezone

import httpx
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from ..config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"

NAVY = colors.HexColor("#0d1b38")
NAVY_MID = colors.HexColor("#1e3560")
GREEN = colors.HexColor("#29c768")
LIGHT_BG = colors.HexColor("#f8fafc")
GRAY = colors.HexColor("#6b7280")
WHITE = colors.white


# ── PDF generation ────────────────────────────────────────────────────────────

def _build_receipt_pdf(
    full_name: str,
    email: str,
    amount: float,
    currency: str,
    service_label: str,
    reference: str | None,
    payment_id: str | None,
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title",
        parent=styles["Normal"],
        fontSize=22,
        fontName="Helvetica-Bold",
        textColor=WHITE,
        leading=28,
    )
    sub_style = ParagraphStyle(
        "sub",
        parent=styles["Normal"],
        fontSize=10,
        fontName="Helvetica",
        textColor=colors.HexColor("#a5b4fc"),
        leading=14,
    )
    label_style = ParagraphStyle(
        "label",
        parent=styles["Normal"],
        fontSize=9,
        fontName="Helvetica",
        textColor=GRAY,
        leading=13,
    )
    value_style = ParagraphStyle(
        "value",
        parent=styles["Normal"],
        fontSize=10,
        fontName="Helvetica-Bold",
        textColor=NAVY,
        leading=14,
    )
    footer_style = ParagraphStyle(
        "footer",
        parent=styles["Normal"],
        fontSize=8,
        fontName="Helvetica",
        textColor=GRAY,
        leading=12,
        alignment=1,  # center
    )

    now = datetime.now(timezone.utc).strftime("%d/%m/%Y à %H:%M UTC")
    amount_str = f"{amount:,.0f} {currency}"

    story = []

    # ── Header banner ──────────────────────────────────────────────────────
    header_data = [[
        Paragraph("PieAgency", title_style),
        Paragraph("Accompagnement étudiant<br/>vers la France &amp; la Belgique", sub_style),
    ]]
    header_table = Table(header_data, colWidths=[9 * cm, 8 * cm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [NAVY]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, -1), 20),
        ("RIGHTPADDING", (-1, 0), (-1, -1), 20),
        ("TOPPADDING", (0, 0), (-1, -1), 18),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Confirmed badge row ────────────────────────────────────────────────
    badge_data = [["✓  PAIEMENT CONFIRMÉ"]]
    badge_table = Table(badge_data, colWidths=[17 * cm])
    badge_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#d1fae5")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#065f46")),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 0.4 * cm))

    # ── Amount box ────────────────────────────────────────────────────────
    amount_style = ParagraphStyle(
        "amount",
        parent=styles["Normal"],
        fontSize=32,
        fontName="Helvetica-Bold",
        textColor=NAVY,
        alignment=1,
        leading=38,
    )
    svc_style = ParagraphStyle(
        "svc",
        parent=styles["Normal"],
        fontSize=11,
        fontName="Helvetica",
        textColor=GRAY,
        alignment=1,
        leading=15,
    )
    amount_data = [[
        Paragraph(amount_str, amount_style),
    ], [
        Paragraph(service_label, svc_style),
    ]]
    amount_table = Table(amount_data, colWidths=[17 * cm])
    amount_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(amount_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Details table ─────────────────────────────────────────────────────
    rows = [
        ["Client", full_name],
        ["Email", email],
        ["Date", now],
    ]
    if reference:
        rows.append(["Référence dossier", reference])
    if payment_id:
        rows.append(["ID paiement", payment_id])

    detail_data = [
        [Paragraph(label, label_style), Paragraph(val, value_style)]
        for label, val in rows
    ]
    detail_table = Table(detail_data, colWidths=[5 * cm, 12 * cm])
    detail_table.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, colors.HexColor("#f1f5f9")),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(detail_table)
    story.append(Spacer(1, 0.6 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0")))
    story.append(Spacer(1, 0.4 * cm))

    # ── Next steps box ────────────────────────────────────────────────────
    next_style = ParagraphStyle(
        "next",
        parent=styles["Normal"],
        fontSize=10,
        fontName="Helvetica",
        textColor=colors.HexColor("#1e3a8a"),
        leading=15,
    )
    next_title_style = ParagraphStyle(
        "nexttitle",
        parent=styles["Normal"],
        fontSize=10,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#1e40af"),
        leading=14,
    )
    next_data = [[
        Paragraph("📋  Prochaines étapes", next_title_style),
    ], [
        Paragraph(
            "Notre équipe va vous contacter sous 24h pour la suite de votre dossier. "
            "Pour toute question, écrivez à contact@pieagency.fr.",
            next_style,
        ),
    ]]
    next_table = Table(next_data, colWidths=[17 * cm])
    next_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#bfdbfe")),
    ]))
    story.append(next_table)
    story.append(Spacer(1, 1 * cm))

    # ── Footer ────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor("#e2e8f0")))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(
        "PieAgency · pieagency.fr · contact@pieagency.fr",
        footer_style,
    ))

    doc.build(story)
    return buffer.getvalue()


# ── Email sending ─────────────────────────────────────────────────────────────

def send_payment_receipt(
    to_email: str,
    full_name: str,
    amount: float,
    currency: str,
    service_label: str,
    reference: str | None = None,
    payment_id: str | None = None,
) -> bool:
    """
    Generate a PDF receipt and email it to the client AND both admin addresses.
    Returns True on success.
    """
    if not settings.resend_enabled:
        logger.warning("Resend not configured — skipping receipt email to %s", to_email)
        return False

    # Fixed admin recipients
    admin_emails = ["contact@pieagency.fr", "junior.pieagency@gmail.com"]
    all_recipients = list({to_email.lower()} | set(admin_emails))

    try:
        pdf_bytes = _build_receipt_pdf(
            full_name=full_name,
            email=to_email,
            amount=amount,
            currency=currency,
            service_label=service_label,
            reference=reference,
            payment_id=payment_id,
        )
    except Exception:
        logger.exception("Failed to generate PDF receipt")
        return False

    pdf_b64 = base64.b64encode(pdf_bytes).decode()
    amount_str = f"{amount:,.0f} {currency}"
    subject = f"Reçu de paiement PieAgency — {amount_str}"

    html_body = f"""
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="background:linear-gradient(135deg,#0d1b38,#1e3560);border-radius:14px;
                  padding:24px 28px;text-align:center;margin-bottom:24px;">
        <div style="font-size:24px;font-weight:800;color:#fff;">PieAgency</div>
        <div style="color:rgba(255,255,255,.6);font-size:12px;margin-top:4px;">Accompagnement étudiant</div>
      </div>
      <p style="font-size:15px;color:#0d1b38;">
        Bonjour <strong>{full_name.split()[0]}</strong>,
      </p>
      <p style="font-size:14px;color:#374151;">
        Votre paiement de <strong>{amount_str}</strong> a bien été confirmé.
        Vous trouverez votre reçu officiel en pièce jointe (PDF).
      </p>
      <p style="font-size:14px;color:#374151;">
        Notre équipe vous contactera sous 24h pour la suite de votre dossier.
      </p>
      <p style="font-size:13px;color:#6b7280;margin-top:32px;">
        PieAgency · <a href="https://pieagency.fr" style="color:#6b7280;">pieagency.fr</a>
      </p>
    </div>
    """

    payload: dict = {
        "from": settings.receipt_from_email,
        "to": all_recipients,
        "subject": subject,
        "html": html_body,
        "attachments": [
            {
                "filename": f"recu-pieagency-{(payment_id or 'paiement')[:12]}.pdf",
                "content": pdf_b64,
            }
        ],
    }

    try:
        resp = httpx.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
        )
        if resp.status_code >= 400:
            logger.warning("Resend error %s: %s", resp.status_code, resp.text[:300])
            return False
        logger.info("Receipt sent to %s (payment_id=%s)", all_recipients, payment_id)
        return True
    except Exception:
        logger.exception("Failed to send receipt email to %s", to_email)
        return False
