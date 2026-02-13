import type { Metadata } from "next";
import ContactContent from "~/app/(public)/contact/contact-content";
import { getPublicPageRobots } from "~/lib/metadata";

export const metadata: Metadata = {
  title: "Contact Us | Get in Touch with OdisAI",
  description:
    "Have questions about OdisAI? Contact our team for support, sales inquiries, or to learn more about our AI voice agents for veterinary clinics.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact OdisAI | Veterinary AI Voice Agents",
    description: "Get in touch with the OdisAI team.",
    url: "/contact",
  },
  robots: getPublicPageRobots(),
};

export default function ContactPage() {
  return <ContactContent />;
}
