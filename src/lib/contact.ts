/**
 * Public contact details shared by the site footer and the support page.
 * Keep this as the single source of truth — the footer and support links are
 * generated from here so the details can never drift apart.
 */
export const supportContact = {
  email: "hello@pizzahub.example",
  emailHref: "mailto:hello@pizzahub.example",
  phone: "+1 (555) 012-3456",
  phoneHref: "tel:+15550123456",
  address: "24 Pizza Lane, Food District",
} as const;
