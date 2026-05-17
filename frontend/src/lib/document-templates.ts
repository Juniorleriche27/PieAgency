import type { CandidateDocument, EducationLevel, GradingSystem } from "@/lib/private-documents";

type DocTemplate = { title: string; priority: CandidateDocument["priority"] };

const COMMON: DocTemplate[] = [
  { title: "CV", priority: "high" },
  { title: "Lettre de motivation", priority: "high" },
  { title: "Passeport", priority: "high" },
  { title: "Justificatif d'hébergement", priority: "high" },
  { title: "Justificatif de financement", priority: "medium" },
  { title: "Documents visa", priority: "medium" },
];

function bulletins(classe: string, system: GradingSystem): DocTemplate[] {
  if (system === "trimestre") {
    return [
      { title: `Bulletin ${classe} — Trimestre 1`, priority: "high" },
      { title: `Bulletin ${classe} — Trimestre 2`, priority: "high" },
      { title: `Bulletin ${classe} — Trimestre 3`, priority: "high" },
    ];
  }
  return [
    { title: `Bulletin ${classe} — Semestre 1`, priority: "high" },
    { title: `Bulletin ${classe} — Semestre 2`, priority: "high" },
  ];
}

function lyceeDocs(system: GradingSystem): DocTemplate[] {
  const classes = ["Seconde", "Première", "Terminale"];
  const docs: DocTemplate[] = [];
  for (const cl of classes) {
    docs.push(...bulletins(cl, system));
    docs.push({ title: `Relevé d'examen — ${cl}`, priority: "medium" });
    docs.push({ title: `Attestation / Diplôme — ${cl}`, priority: "medium" });
  }
  return docs;
}

function universiteDocs(system: GradingSystem): DocTemplate[] {
  const docs: DocTemplate[] = [];
  const licenceYears = ["L1", "L2", "L3"];
  const masterYears = ["M1", "M2"];

  for (const yr of licenceYears) {
    if (system === "trimestre") {
      docs.push({ title: `Bulletin ${yr} — Trimestre 1`, priority: "high" });
      docs.push({ title: `Bulletin ${yr} — Trimestre 2`, priority: "high" });
      docs.push({ title: `Bulletin ${yr} — Trimestre 3`, priority: "high" });
    } else {
      docs.push({ title: `Bulletin ${yr} — Semestre 1`, priority: "high" });
      docs.push({ title: `Bulletin ${yr} — Semestre 2`, priority: "high" });
    }
    if (yr === "L3") {
      docs.push({ title: "Diplôme de Licence", priority: "high" });
    }
  }

  for (const yr of masterYears) {
    docs.push({ title: `Bulletin ${yr} — Semestre 1`, priority: "high" });
    docs.push({ title: `Bulletin ${yr} — Semestre 2`, priority: "high" });
    if (yr === "M2") {
      docs.push({ title: "Diplôme de Master", priority: "high" });
    }
  }

  docs.push({ title: "Relevé de notes officiel", priority: "medium" });
  return docs;
}

function btsDocs(system: GradingSystem): DocTemplate[] {
  const docs: DocTemplate[] = [];
  for (const yr of ["BTS Année 1", "BTS Année 2"]) {
    if (system === "trimestre") {
      docs.push({ title: `Bulletin ${yr} — Trimestre 1`, priority: "high" });
      docs.push({ title: `Bulletin ${yr} — Trimestre 2`, priority: "high" });
      docs.push({ title: `Bulletin ${yr} — Trimestre 3`, priority: "high" });
    } else {
      docs.push({ title: `Bulletin ${yr} — Semestre 1`, priority: "high" });
      docs.push({ title: `Bulletin ${yr} — Semestre 2`, priority: "high" });
    }
  }
  docs.push({ title: "Diplôme BTS / Attestation", priority: "high" });
  docs.push({ title: "Relevé de notes BTS", priority: "medium" });
  return docs;
}

function autreDocs(): DocTemplate[] {
  return [
    { title: "Diplôme principal", priority: "high" },
    { title: "Relevé de notes", priority: "high" },
    { title: "Attestation de scolarité", priority: "medium" },
  ];
}

export function buildDocumentTemplates(
  level: EducationLevel,
  system: GradingSystem,
): CandidateDocument[] {
  let levelDocs: DocTemplate[] = [];

  if (level === "lycee") levelDocs = lyceeDocs(system);
  else if (level === "universite") levelDocs = universiteDocs(system);
  else if (level === "bts") levelDocs = btsDocs(system);
  else levelDocs = autreDocs();

  return [...levelDocs, ...COMMON].map((t, i) => ({
    id: `tpl-${i}-${t.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: t.title,
    status: "not-started",
    priority: t.priority,
  }));
}
