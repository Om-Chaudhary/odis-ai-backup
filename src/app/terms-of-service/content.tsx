import type { ComplianceSection } from "~/components/legal/compliance-document";

/**
 * Terms of Service Content
 *
 * TODO: Replace "COMPANY_NAME" with your actual company name throughout this file
 * TODO: Update governing law jurisdiction based on your location
 * TODO: Review and customize all sections based on your specific services
 * TODO: Consult with legal counsel before publishing
 */

export const COMPANY_NAME = "COMPANY_NAME";
export const CONTACT_EMAIL = "legal@company.com"; // TODO: Update with actual email
export const COMPANY_ADDRESS = "123 Business Street, City, State 12345"; // TODO: Update with actual address
export const GOVERNING_LAW_JURISDICTION = "State of [YOUR STATE]"; // TODO: Update
export const LAST_UPDATED = "January 1, 2025"; // TODO: Update with actual date
export const EFFECTIVE_DATE = "January 1, 2025"; // TODO: Update with actual date

export const termsOfServiceSections: ComplianceSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: (
      <>
        <p>
          Welcome to {COMPANY_NAME}. These Terms of Service ("Terms") govern
          your access to and use of our website, applications, and services
          (collectively, the "Services").
        </p>
        <p>
          By accessing or using our Services, you agree to be bound by these
          Terms and our Privacy Policy. If you do not agree to these Terms,
          please do not use our Services.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility",
    content: (
      <>
        <p>
          You must be at least 18 years old to use our Services. By using our
          Services, you represent and warrant that you meet this age
          requirement.
        </p>
        <p>
          If you are using our Services on behalf of an organization, you
          represent that you have the authority to bind that organization to
          these Terms.
        </p>
      </>
    ),
  },
  {
    id: "account-registration",
    title: "Account Registration and Security",
    content: (
      <>
        <p>
          To access certain features of our Services, you may need to create an
          account. You agree to:
        </p>
        <ul>
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain and update your information to keep it accurate</li>
          <li>Maintain the security of your password and account</li>
          <li>
            Notify us immediately of any unauthorized use of your account
          </li>
          <li>Accept responsibility for all activities under your account</li>
        </ul>
      </>
    ),
  },
  {
    id: "prohibited-conduct",
    title: "Prohibited Conduct",
    content: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on intellectual property rights of others</li>
          <li>
            Transmit viruses, malware, or other malicious code
          </li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Interfere with or disrupt our Services</li>
          <li>Use our Services for any unlawful purpose</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Impersonate any person or entity</li>
        </ul>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property Rights",
    content: (
      <>
        <p>
          Our Services and all content, features, and functionality are owned by{" "}
          {COMPANY_NAME} and are protected by copyright, trademark, and other
          intellectual property laws.
        </p>
        <p>
          You are granted a limited, non-exclusive, non-transferable license to
          access and use our Services for your personal or internal business
          purposes.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    content: (
      <>
        <p>
          We may terminate or suspend your access to our Services at any time,
          with or without cause, with or without notice.
        </p>
        <p>
          You may terminate your account at any time by contacting us at{" "}
          {CONTACT_EMAIL}.
        </p>
      </>
    ),
  },
  {
    id: "disclaimer",
    title: "Disclaimer of Warranties",
    content: (
      <>
        <p>
          OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
          WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT
          LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, AND NON-INFRINGEMENT.
        </p>
      </>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    content: (
      <>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY_NAME} SHALL NOT BE
          LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
          PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO YOUR USE OF OUR
          SERVICES.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law",
    content: (
      <>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of {GOVERNING_LAW_JURISDICTION}, without regard to its conflict
          of law provisions.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact Information",
    content: (
      <>
        <p>
          For questions about these Terms, please contact us at:
        </p>
        <div className="mt-4 rounded-lg border bg-slate-50 p-4">
          <p>
            <strong>{COMPANY_NAME}</strong>
          </p>
          <p className="mt-2">
            <strong>Email:</strong>{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p className="mt-1">
            <strong>Address:</strong> {COMPANY_ADDRESS}
          </p>
        </div>
      </>
    ),
  },
];
