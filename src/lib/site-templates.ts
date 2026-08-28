/**
 * Tokens de tema por template — paleta, par tipográfico, forma de botão.
 * Nunca HTML duplicado por template (ver plano §3.2). O renderer público
 * (`src/app/(public)/c/[slug]`) lê isso e aplica via CSS variables.
 */
export const SITE_TEMPLATES = {
  classico: {
    label: "Clássico",
    theme: { bg: "#FBF9FC", ink: "#241C2B", accent: "#7A2E4E", font: "Georgia, serif" },
  },
  jardim: {
    label: "Jardim",
    theme: { bg: "#F6F5EE", ink: "#25301F", accent: "#4A6B3D", font: "'Segoe UI', sans-serif" },
  },
  moderno: {
    label: "Moderno",
    theme: { bg: "#0F1115", ink: "#F2F2F0", accent: "#D9B26F", font: "'Segoe UI', sans-serif" },
  },
  praia: {
    label: "Praia",
    theme: { bg: "#F5F7F7", ink: "#1B2A2E", accent: "#2E7D7B", font: "Georgia, serif" },
  },
} as const;

export type SiteTemplateId = keyof typeof SITE_TEMPLATES;

export const SITE_SECTIONS = [
  { id: "historia", label: "História do casal" },
  { id: "contagem-regressiva", label: "Contagem regressiva" },
  { id: "cerimonia-e-festa", label: "Cerimônia e festa" },
  { id: "cronograma", label: "Cronograma" },
  { id: "padrinhos", label: "Padrinhos" },
  { id: "galeria", label: "Galeria" },
  { id: "dress-code", label: "Dress code" },
  { id: "hospedagem", label: "Hospedagem" },
  { id: "faq", label: "Perguntas frequentes" },
  { id: "rsvp", label: "Confirmar presença" },
  { id: "lista-de-presentes", label: "Lista de presentes" },
  { id: "recados", label: "Recados" },
] as const;
