import { company } from "@/content/site";

export function FloatingWhatsapp() {
  return (
    <div className="wa-float" aria-label="Contacts WhatsApp">
      <a
        className="wa-float-btn togo"
        href={company.contacts.togo.whatsappHref}
        rel="noreferrer"
        target="_blank"
        title="WhatsApp Togo"
      >
        📱 Togo
      </a>
      <a
        className="wa-float-btn france"
        href={company.contacts.france.whatsappHref}
        rel="noreferrer"
        target="_blank"
        title="WhatsApp France"
      >
        📱 France
      </a>
    </div>
  );
}
