import type { ComplianceSection } from "~/components/legal/compliance-document";

/**
 * Privacy Policy Content
 */

export const COMPANY_NAME = "OdisAI, Inc.";
export const CONTACT_EMAIL = "admin@odisai.net";
export const COMPANY_ADDRESS = "N/A";
export const LAST_UPDATED = "December 1, 2025";
export const EFFECTIVE_DATE = "June 9, 2025";

export const privacyPolicySections: ComplianceSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    content: (
      <>
        <p>
          Welcome to {COMPANY_NAME}. We are committed to protecting your privacy
          and ensuring the security of your personal information. This Privacy
          Policy explains how we collect, use, disclose, and safeguard your
          information when you use our services, including our website, Chrome
          extension, and related applications.
        </p>
        <p>
          By using our services, you agree to the collection and use of
          information in accordance with this policy. If you do not agree with
          our policies and practices, please do not use our services.
        </p>
      </>
    ),
  },
  {
    id: "information-collection",
    title: "Information We Collect",
    content: (
      <>
        <p>
          We collect several types of information from and about users of our
          services:
        </p>
      </>
    ),
    subsections: [
      {
        id: "personal-information",
        title: "Personal Information",
        content: (
          <>
            <p>
              We may collect personally identifiable information that you
              voluntarily provide to us, including but not limited to:
            </p>
            <ul>
              <li>
                <strong>Account Information:</strong> Name, email address, phone
                number, and password
              </li>
              <li>
                <strong>Profile Information:</strong> Professional title,
                organization, and profile picture
              </li>
              <li>
                <strong>Payment Information:</strong> Billing address and
                payment method details (processed securely through third-party
                payment processors)
              </li>
              <li>
                <strong>Communication Data:</strong> Information you provide
                when contacting our support team
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "usage-information",
        title: "Usage Information",
        content: (
          <>
            <p>
              We automatically collect certain information about your device and
              how you interact with our services:
            </p>
            <ul>
              <li>
                <strong>Device Information:</strong> IP address, browser type,
                operating system, device identifiers
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, features used, time
                spent, click patterns, and referring URLs
              </li>
              <li>
                <strong>Performance Data:</strong> Error logs, crash reports,
                and performance metrics
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "extension-data",
        title: "Chrome Extension Data",
        content: (
          <>
            <p>
              Our Chrome extension may collect specific information to provide
              its functionality:
            </p>
            <ul>
              <li>
                <strong>Browser Activity:</strong> URLs visited, tab
                information, and browsing patterns (only as necessary for
                extension functionality)
              </li>
              <li>
                <strong>Extension Settings:</strong> User preferences and
                configuration
              </li>
              <li>
                <strong>Synchronization Data:</strong> Data synced across your
                devices through our services
              </li>
            </ul>
            <p>
              <strong>Note:</strong> We only collect browser data necessary for
              the extension to function. We do not track your general browsing
              history beyond what is required for our service.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "how-we-use-information",
    title: "How We Use Your Information",
    content: (
      <>
        <p>
          We use the information we collect for various purposes, including:
        </p>
        <ul>
          <li>
            <strong>Service Delivery:</strong> To provide, maintain, and improve
            our services
          </li>
          <li>
            <strong>Account Management:</strong> To create and manage your
            account, authenticate users, and enable core functionality
          </li>
          <li>
            <strong>Communication:</strong> To send administrative information,
            updates, security alerts, and support messages
          </li>
          <li>
            <strong>Personalization:</strong> To customize your experience and
            provide personalized content and recommendations
          </li>
          <li>
            <strong>Analytics:</strong> To understand how users interact with
            our services and identify areas for improvement
          </li>
          <li>
            <strong>Security:</strong> To detect, prevent, and address technical
            issues, fraud, and unauthorized access
          </li>
          <li>
            <strong>Legal Compliance:</strong> To comply with legal obligations
            and protect our rights and the rights of others
          </li>
          <li>
            <strong>Marketing:</strong> To send promotional communications (with
            your consent, where required)
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "data-storage-security",
    title: "Data Storage and Security",
    content: (
      <>
        <p>
          We implement appropriate technical and organizational measures to
          protect your personal information against unauthorized access,
          alteration, disclosure, or destruction.
        </p>
      </>
    ),
    subsections: [
      {
        id: "storage-location",
        title: "Storage Location",
        content: (
          <>
            <p>
              Your data is stored on secure servers located in the US. We use
              industry-standard cloud infrastructure providers with SOC 2 Type
              II certification and ISO 27001 compliance.
            </p>
          </>
        ),
      },
      {
        id: "security-measures",
        title: "Security Measures",
        content: (
          <>
            <p>Our security measures include:</p>
            <ul>
              <li>
                <strong>Encryption:</strong> Data in transit is protected using
                TLS/SSL encryption; sensitive data at rest is encrypted
              </li>
              <li>
                <strong>Access Controls:</strong> Role-based access control
                (RBAC) and principle of least privilege
              </li>
              <li>
                <strong>Authentication:</strong> Multi-factor authentication
                options for user accounts
              </li>
              <li>
                <strong>Monitoring:</strong> Continuous security monitoring and
                regular security audits
              </li>
              <li>
                <strong>Incident Response:</strong> Procedures for detecting and
                responding to security incidents
              </li>
            </ul>
            <p>
              While we strive to protect your information, no method of
              transmission over the internet or electronic storage is 100%
              secure. We cannot guarantee absolute security.
            </p>
          </>
        ),
      },
      {
        id: "data-retention",
        title: "Data Retention",
        content: (
          <>
            <p>
              We retain your personal information for as long as necessary to
              fulfill the purposes outlined in this Privacy Policy, unless a
              longer retention period is required or permitted by law.
            </p>
            <p>
              When you delete your account, we will delete or anonymize your
              personal information within 30 days, except where we are required
              to retain it for legal, regulatory, or legitimate business
              purposes.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "third-party-services",
    title: "Third-Party Services",
    content: (
      <>
        <p>
          We use third-party services to help us operate our business and
          provide our services. These providers have access to your personal
          information only to perform specific tasks on our behalf and are
          obligated not to disclose or use it for other purposes.
        </p>
      </>
    ),
    subsections: [
      {
        id: "service-providers",
        title: "Categories of Service Providers",
        content: (
          <>
            <ul>
              <li>
                <strong>Infrastructure Providers:</strong> Cloud hosting and
                database services (e.g., Vercel, Supabase)
              </li>
              <li>
                <strong>Analytics:</strong> Usage analytics and performance
                monitoring (e.g., PostHog, Sentry)
              </li>
              <li>
                <strong>Payment Processors:</strong> Secure payment processing
                (e.g., Stripe)
              </li>
              <li>
                <strong>Communication:</strong> Email delivery and customer
                support tools (e.g., SendGrid, Intercom)
              </li>
              <li>
                <strong>Authentication:</strong> Identity verification and
                authentication services
              </li>
            </ul>
            <p className="mt-4">Supabase</p>
          </>
        ),
      },
      {
        id: "data-sharing",
        title: "Data Sharing",
        content: (
          <>
            <p>
              We do not sell, trade, or rent your personal information to third
              parties. We may share your information in the following
              circumstances:
            </p>
            <ul>
              <li>
                <strong>Service Providers:</strong> With trusted third-party
                service providers who assist in operating our services
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law,
                regulation, legal process, or governmental request
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a
                merger, acquisition, or sale of assets
              </li>
              <li>
                <strong>Protection of Rights:</strong> To enforce our terms,
                protect our rights, or ensure user safety
              </li>
              <li>
                <strong>With Consent:</strong> When you have given explicit
                consent for a specific purpose
              </li>
            </ul>
          </>
        ),
      },
    ],
  },
  {
    id: "cookies-tracking",
    title: "Cookies and Tracking Technologies",
    content: (
      <>
        <p>
          We use cookies and similar tracking technologies to track activity on
          our services and store certain information. Cookies are files with a
          small amount of data that are sent to your browser from a website and
          stored on your device.
        </p>
      </>
    ),
    subsections: [
      {
        id: "types-of-cookies",
        title: "Types of Cookies We Use",
        content: (
          <>
            <ul>
              <li>
                <strong>Essential Cookies:</strong> Required for the operation
                of our services (e.g., authentication, security)
              </li>
              <li>
                <strong>Functional Cookies:</strong> Enable enhanced
                functionality and personalization (e.g., language preferences)
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how users
                interact with our services
              </li>
              <li>
                <strong>Marketing Cookies:</strong> Used to deliver relevant
                advertisements (with your consent)
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "cookie-management",
        title: "Managing Cookies",
        content: (
          <>
            <p>
              You can control and manage cookies in various ways. Most browsers
              allow you to refuse cookies or alert you when cookies are being
              sent. However, if you disable or refuse cookies, some features of
              our services may not function properly.
            </p>
            <p>
              For more information about managing cookies, visit:{" "}
              <a
                href="https://www.allaboutcookies.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.allaboutcookies.org
              </a>
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "chrome-extension-permissions",
    title: "Chrome Extension Specific Permissions",
    content: (
      <>
        <p>
          Our Chrome extension requires specific permissions to function. Here
          is what we access and why:
        </p>
      </>
    ),
    subsections: [
      {
        id: "required-permissions",
        title: "Required Permissions",
        content: (
          <>
            <ul>
              <li>
                <strong>Storage:</strong> To save your preferences and settings
                locally and sync them across devices
              </li>
              <li>
                <strong>Active Tab:</strong> To interact with the current tab
                and provide context-specific features
              </li>
              <li>
                <strong>Host Permissions:</strong> To access specific websites
                where our extension provides functionality
              </li>
              <li>
                <strong>Identity:</strong> To authenticate your account and sync
                data securely
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "optional-permissions",
        title: "Optional Permissions",
        content: (
          <>
            <p>
              Some features require additional permissions that you can grant or
              revoke at any time:
            </p>
            <ul>
              <li>
                <strong>Notifications:</strong> To send you alerts and updates
                about important events
              </li>
              <li>
                <strong>Clipboard:</strong> To enable copy-paste functionality
                for specific features
              </li>
            </ul>
            <p className="mt-4">
              You can review and revoke permissions at any time through
              Chrome&apos;s extension settings (chrome://extensions/).
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights and Choices",
    content: (
      <>
        <p>
          Depending on your location, you may have certain rights regarding your
          personal information:
        </p>
      </>
    ),
    subsections: [
      {
        id: "gdpr-rights",
        title: "GDPR Rights (EU/EEA Users)",
        content: (
          <>
            <p>
              If you are located in the European Union or European Economic
              Area, you have the following rights:
            </p>
            <ul>
              <li>
                <strong>Right to Access:</strong> Request access to your
                personal data
              </li>
              <li>
                <strong>Right to Rectification:</strong> Request correction of
                inaccurate or incomplete data
              </li>
              <li>
                <strong>Right to Erasure:</strong> Request deletion of your
                personal data (&quot;right to be forgotten&quot;)
              </li>
              <li>
                <strong>Right to Restriction:</strong> Request restriction of
                processing your personal data
              </li>
              <li>
                <strong>Right to Data Portability:</strong> Receive your data in
                a structured, machine-readable format
              </li>
              <li>
                <strong>Right to Object:</strong> Object to processing of your
                personal data
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Withdraw consent at
                any time (where processing is based on consent)
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "ccpa-rights",
        title: "CCPA Rights (California Users)",
        content: (
          <>
            <p>
              If you are a California resident, you have the following rights
              under the California Consumer Privacy Act (CCPA):
            </p>
            <ul>
              <li>
                <strong>Right to Know:</strong> Request information about the
                personal information we collect, use, and disclose
              </li>
              <li>
                <strong>Right to Delete:</strong> Request deletion of your
                personal information
              </li>
              <li>
                <strong>Right to Opt-Out:</strong> Opt-out of the sale of your
                personal information (Note: We do not sell personal information)
              </li>
              <li>
                <strong>Right to Non-Discrimination:</strong> Not receive
                discriminatory treatment for exercising your rights
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "exercising-rights",
        title: "Exercising Your Rights",
        content: (
          <>
            <p>
              To exercise any of these rights, please contact us at{" "}
              {CONTACT_EMAIL}. We will respond to your request within 30 days
              (or as required by applicable law).
            </p>
            <p>
              You may also access, update, or delete certain information
              directly through your account settings.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "childrens-privacy",
    title: "Children's Privacy",
    content: (
      <>
        <p>
          Our services are not intended for children under the age of 13 (or 16
          in the EU/EEA). We do not knowingly collect personal information from
          children under these ages.
        </p>
        <p>
          If you are a parent or guardian and believe your child has provided us
          with personal information, please contact us at {CONTACT_EMAIL}. We
          will delete such information from our systems promptly.
        </p>
      </>
    ),
  },
  {
    id: "international-transfers",
    title: "International Data Transfers",
    content: (
      <>
        <p>
          Your information may be transferred to and maintained on computers
          located outside of your state, province, country, or other
          governmental jurisdiction where data protection laws may differ from
          those in your jurisdiction.
        </p>
        <p>
          If you are located outside the United States and choose to provide
          information to us, please note that we transfer the data, including
          personal data, to the United States and process it there.
        </p>
        <p>
          For EU/EEA users, we ensure that appropriate safeguards are in place,
          such as Standard Contractual Clauses approved by the European
          Commission, to protect your personal data.
        </p>
      </>
    ),
  },
  {
    id: "changes-to-policy",
    title: "Changes to This Privacy Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time to reflect changes
          in our practices, technology, legal requirements, or other factors.
        </p>
        <p>We will notify you of any material changes by:</p>
        <ul>
          <li>Posting the updated policy on this page</li>
          <li>
            Updating the &quot;Last Updated&quot; date at the top of this policy
          </li>
          <li>
            Sending you an email notification (for significant changes that
            materially affect your rights)
          </li>
        </ul>
        <p>
          We encourage you to review this Privacy Policy periodically for any
          changes. Your continued use of our services after changes are posted
          constitutes your acceptance of the updated policy.
        </p>
      </>
    ),
  },
  {
    id: "contact-information",
    title: "Contact Information",
    content: (
      <>
        <p>
          If you have any questions, concerns, or requests regarding this
          Privacy Policy or our data practices, please contact us:
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
