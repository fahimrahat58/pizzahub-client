import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, Mail, MapPin, Phone } from "lucide-react";

import { LinkButton } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supportContact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms that apply when you use PizzaHub to browse restaurants, place orders, or manage a vendor account.",
};

const lastUpdated = "November 19, 2026";

type TermSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const sections: TermSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    paragraphs: [
      "PizzaHub is an online platform that connects customers with independent pizza kitchens and gives restaurant owners the tools to manage their listings, menus, and orders. These Terms of Use explain the rules that apply when you browse the site, place an order, or use a vendor account.",
      "These terms apply to the PizzaHub website and the services we provide through it. They do not govern separate agreements you may have directly with a restaurant. If you do not agree with these terms, please do not use PizzaHub.",
    ],
  },
  {
    id: "acceptance-of-terms",
    title: "Acceptance of Terms",
    paragraphs: [
      "By creating an account, placing an order, listing a restaurant, or otherwise using PizzaHub, you confirm that you have read and agree to these terms. If you use PizzaHub on behalf of a business, you confirm that you are authorised to accept these terms for that business.",
      "We may update these terms from time to time. The current version is always available on this page, together with the date it was last updated. Your continued use of PizzaHub after an update means you accept the revised terms.",
    ],
  },
  {
    id: "account-registration",
    title: "Account Registration",
    paragraphs: [
      "Some features, such as placing orders and managing a restaurant, require an account. You can register as a customer or as a vendor. Please provide accurate, current information and keep your account details up to date.",
      "You are responsible for keeping your password secure and for activity that happens under your account. If you believe someone else is using your account without permission, contact us using the details in the Contact Information section below.",
    ],
    bullets: [
      "Use an email address and payment method that you are authorised to use.",
      "Do not create multiple accounts to bypass limits or restrictions.",
      "Vendors must be authorised to represent the restaurant they list.",
    ],
  },
  {
    id: "user-responsibilities",
    title: "User Responsibilities",
    paragraphs: [
      "As a customer, you are responsible for reviewing your order, delivery details, and payment information before submitting them. Provide accurate address and contact details so the restaurant can fulfil your order.",
      "Use PizzaHub respectfully. Communicate politely with restaurants and staff, and do not submit orders or messages that are false, abusive, or intended to disrupt a restaurant's operations.",
    ],
  },
  {
    id: "vendor-responsibilities",
    title: "Vendor Responsibilities",
    paragraphs: [
      "Vendors are responsible for the accuracy of the information they provide about their restaurant and menu, including prices, item descriptions, ingredients, and allergen information. Keep availability and opening hours current so customers are not misled.",
      "Vendors are responsible for preparing orders to a reasonable standard and for complying with the food safety, labelling, and business requirements that apply to them. Handling customer enquiries and order issues in a timely way is also part of using the platform responsibly.",
    ],
  },
  {
    id: "restaurant-listings-and-menu-information",
    title: "Restaurant Listings and Menu Information",
    paragraphs: [
      "Vendors control the content of their restaurant listings and menus. PizzaHub does not independently verify every listing, price, photograph, or description, and we do not guarantee that an item is available at any particular time.",
      "We may remove or hide listing content that breaches these terms, is reported as inaccurate, or creates a risk for other users. Photos and descriptions should give customers a fair representation of what they will receive.",
    ],
  },
  {
    id: "orders-and-payments",
    title: "Orders and Payments",
    paragraphs: [
      "When you place an order, you are asking the restaurant to prepare it. The restaurant may accept or reject an order, and availability may change after you submit it. The total amount, including any delivery fees or taxes, is shown before you confirm payment.",
      "Payments are processed securely by Stripe. PizzaHub does not store your card details. Once an order is accepted, it is prepared by the restaurant rather than by PizzaHub, and any questions about the food itself should be raised with the restaurant first.",
    ],
  },
  {
    id: "subscription-plans-and-billing",
    title: "Subscription Plans and Billing",
    paragraphs: [
      "PizzaHub offers optional Premium subscription plans for vendors, with monthly and yearly billing options. The current prices and what each plan includes are shown on the vendor subscription page before you purchase.",
      "Subscriptions are processed by Stripe and renew automatically at the interval you chose until you cancel. You can review your plan, update your payment method, and manage billing details through the Manage Subscription option on the vendor subscription page.",
    ],
  },
  {
    id: "subscription-cancellation-and-renewal",
    title: "Subscription Cancellation and Renewal",
    paragraphs: [
      "You can cancel your Premium subscription at any time from the Stripe Billing Portal using the Manage Subscription option. Unless a different date is shown in the portal, cancellation takes effect at the end of your current billing period, and Premium features remain available until then.",
      "If a payment fails, Stripe may retry it and we may pause or end Premium access after repeated failures. Cancelling a subscription does not delete your account, restaurant, menu, or order history.",
    ],
  },
  {
    id: "refund-policy",
    title: "Refund Policy",
    paragraphs: [
      "If something goes wrong with an order, contact us with your order details and we will review the situation with you and the restaurant. Refunds for orders are considered case by case, taking into account whether the order was prepared, delivered, or accepted.",
      "Subscription fees generally cover the billing period already paid for, so we do not normally refund partial periods after a cancellation. If we make an error in billing or cancel a plan on our side, we will work with you to put it right. Nothing in this section removes any rights you may have under applicable law.",
    ],
  },
  {
    id: "prohibited-activities",
    title: "Prohibited Activities",
    paragraphs: [
      "Please use PizzaHub only for its intended purpose. The following are not permitted:",
    ],
    bullets: [
      "Placing fake orders, posting fake reviews, or manipulating ratings.",
      "Attempting to access another person's account or payment information.",
      "Scraping, automated bulk requests, or interfering with the operation of the site.",
      "Uploading unlawful, harmful, misleading, or offensive content.",
      "Impersonating a restaurant or another user, or misusing promotional offers.",
      "Infringing intellectual property rights or helping anyone else to do so.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    paragraphs: [
      "The PizzaHub name, branding, site design, and software belong to PizzaHub or its licensors. You may use the site to browse and order, but you may not copy, sell, or reuse our branding or site content without permission.",
      "Vendors keep ownership of the restaurant content they provide and give PizzaHub permission to display it on the platform. Reviews and other content you submit may be shown publicly alongside restaurants and menu items.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    paragraphs: [
      "PizzaHub provides the platform that connects customers and restaurants. Restaurants are responsible for the food they prepare and the orders they fulfil. To the extent permitted by applicable law, PizzaHub is not responsible for indirect or consequential losses arising from use of the site.",
      "We work to keep the platform available and secure, but we cannot guarantee uninterrupted access or that every listing is error-free. If you experience a problem, please contact us so we can investigate.",
    ],
  },
  {
    id: "account-suspension-and-termination",
    title: "Account Suspension and Termination",
    paragraphs: [
      "We may suspend or restrict an account where we reasonably believe these terms have been breached, where fraud or non-payment is involved, or where continued access could put other users or a restaurant at risk. Where practical, we will explain the reason and how to contact us.",
      "You may stop using PizzaHub at any time. If you would like your account closed, contact us using the details below and we will help you with the request.",
    ],
  },
  {
    id: "changes-to-these-terms",
    title: "Changes to These Terms",
    paragraphs: [
      "We may revise these terms as PizzaHub develops, for example when we add features or change how a service works. The Last Updated date at the top of this page shows when the current version was published.",
      "We encourage you to review this page occasionally. If you continue to use PizzaHub after a change takes effect, we take that as acceptance of the updated terms.",
    ],
  },
];

const tableOfContents = [
  ...sections.map((section, index) => ({
    id: section.id,
    title: section.title,
    number: index + 1,
  })),
  { id: "contact-information", title: "Contact Information", number: 16 },
];

export default function TermsOfUsePage() {
  return (
    <div className="hero-glow flex-1 overflow-x-clip">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="space-y-5">
          <div className="flex items-center gap-2 text-orange-500">
            <FileText className="size-5" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Legal</p>
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Terms of Use
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            These terms explain how PizzaHub works, what we expect from customers and
            vendors, and how subscriptions, orders, and payments are handled.
          </p>
          <Badge variant="outline" className="w-fit">
            Last Updated: {lastUpdated}
          </Badge>
        </header>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle>On this page</CardTitle>
          </CardHeader>
          <CardContent>
            <nav aria-label="Terms of Use sections">
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tableOfContents.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`#${item.id}`}
                      className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-orange-600 dark:hover:text-orange-400"
                    >
                      <span className="font-mono text-xs text-orange-500">
                        {String(item.number).padStart(2, "0")}
                      </span>
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </CardContent>
        </Card>

        <div className="mt-8 space-y-6">
          {sections.map((section, index) => (
            <Card key={section.id} id={section.id} className="scroll-mt-24">
              <CardHeader className="grid-cols-[auto_1fr] items-start gap-3 sm:gap-4">
                <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500/10 text-sm font-semibold text-orange-600 dark:text-orange-400">
                  {index + 1}
                </span>
                <CardTitle className="text-lg sm:text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="gap-3 text-sm leading-relaxed text-muted-foreground">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ))}

          <Card id="contact-information" className="scroll-mt-24">
            <CardHeader className="grid-cols-[auto_1fr] items-start gap-3 sm:gap-4">
              <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500/10 text-sm font-semibold text-orange-600 dark:text-orange-400">
                16
              </span>
              <CardTitle className="text-lg sm:text-xl">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="gap-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                If you have a question about these terms, an order, or your vendor
                account, please get in touch. We will do our best to help.
              </p>
              <ul className="grid gap-3 sm:grid-cols-3">
                <li className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-orange-500" />
                  <span className="min-w-0 break-words">
                    Email:{" "}
                    <a href={supportContact.emailHref} className="text-orange-600 hover:underline dark:text-orange-400">
                      {supportContact.email}
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-orange-500" />
                  <span className="min-w-0 break-words">
                    Phone:{" "}
                    <a href={supportContact.phoneHref} className="text-orange-600 hover:underline dark:text-orange-400">
                      {supportContact.phone}
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-orange-500" />
                  <span className="min-w-0 break-words">Address: {supportContact.address}</span>
                </li>
              </ul>
              <p>
                You can also open the{" "}
                <Link href="/contact-support" className="font-medium text-orange-600 hover:underline dark:text-orange-400">
                  Contact Support
                </Link>{" "}
                page for more ways to reach us.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <LinkButton href="/">
            <ArrowLeft className="size-4" /> Back to home
          </LinkButton>
          <LinkButton href="/contact-support" variant="outline">
            Contact Support
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
