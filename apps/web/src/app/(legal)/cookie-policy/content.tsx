import type { ComplianceSection } from "~/components/legal/compliance-document";

/**
 * Cookie Policy Content
 *
 * TODO: Replace "COMPANY_NAME" with your actual company name throughout this file
 * TODO: Update contact information
 * TODO: Customize cookie categories based on your actual usage
 * TODO: Add specific third-party cookies used
 */

export const COMPANY_NAME = "OdisAI"; // TODO: Verify company name
export const CONTACT_EMAIL = "privacy@odis.ai"; // TODO: Update with actual email
export const LAST_UPDATED = "January 1, 2025"; // TODO: Update with actual date
export const EFFECTIVE_DATE = "January 1, 2025"; // TODO: Update with actual date

export const cookiePolicySections: ComplianceSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    content: (
      <>
        <p>
          This Cookie Policy explains how {COMPANY_NAME} (&ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;) uses cookies and similar
          tracking technologies when you visit our website and use our services.
        </p>
        <p>
          By continuing to use our website, you consent to the use of cookies as
          described in this policy. You can manage your cookie preferences at
          any time through your browser settings.
        </p>
      </>
    ),
  },
  {
    id: "what-are-cookies",
    title: "What Are Cookies?",
    content: (
      <>
        <p>
          Cookies are small text files that are placed on your device (computer,
          smartphone, or tablet) when you visit a website. They are widely used
          to make websites work more efficiently and provide information to the
          website owners.
        </p>
        <p>
          Cookies can be &ldquo;persistent&rdquo; or &ldquo;session&rdquo;
          cookies. Persistent cookies remain on your device for a set period or
          until you delete them, while session cookies are deleted when you
          close your web browser.
        </p>
      </>
    ),
  },
  {
    id: "cookies-we-use",
    title: "Cookies We Use",
    content: (
      <>
        <p>We use different types of cookies for various purposes:</p>
      </>
    ),
    subsections: [
      {
        id: "essential-cookies",
        title: "Essential Cookies",
        content: (
          <>
            <p>
              These cookies are necessary for the website to function properly.
              They enable basic functions like page navigation and access to
              secure areas of the website. The website cannot function properly
              without these cookies.
            </p>
            <ul>
              {/* TODO: Add specific essential cookies */}
              <li>
                <strong>Authentication cookies:</strong> Used to identify you
                when you log in to our services
              </li>
              <li>
                <strong>Security cookies:</strong> Used to support security
                features and detect malicious activity
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "analytics-cookies",
        title: "Analytics Cookies",
        content: (
          <>
            <p>
              These cookies help us understand how visitors interact with our
              website by collecting and reporting information anonymously. This
              helps us improve our website and services.
            </p>
            <ul>
              {/* TODO: Add specific analytics tools used */}
              <li>
                <strong>PostHog:</strong> We use PostHog for product analytics
                to understand how users interact with our services
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "functional-cookies",
        title: "Functional Cookies",
        content: (
          <>
            <p>
              These cookies enable enhanced functionality and personalization,
              such as remembering your preferences and settings.
            </p>
            <ul>
              {/* TODO: Add specific functional cookies */}
              <li>
                <strong>Preference cookies:</strong> Remember your settings and
                preferences
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "marketing-cookies",
        title: "Marketing Cookies",
        content: (
          <>
            <p>
              These cookies may be set through our site by our advertising
              partners. They may be used to build a profile of your interests
              and show you relevant advertisements on other sites.
            </p>
            <ul>
              {/* TODO: Add specific marketing cookies if used */}
              <li>
                Currently, we do not use marketing cookies. This may change in
                the future, and this policy will be updated accordingly.
              </li>
            </ul>
          </>
        ),
      },
    ],
  },
  {
    id: "third-party-cookies",
    title: "Third-Party Cookies",
    content: (
      <>
        <p>
          Some cookies are placed by third-party services that appear on our
          pages. We do not control the use of these third-party cookies. Please
          refer to the privacy policies of these third parties for more
          information about their cookies:
        </p>
        <ul>
          {/* TODO: Add all third-party services used */}
          <li>Supabase (authentication and database)</li>
          <li>PostHog (analytics)</li>
          <li>Vercel (hosting)</li>
        </ul>
      </>
    ),
  },
  {
    id: "managing-cookies",
    title: "Managing Cookies",
    content: (
      <>
        <p>
          You can control and manage cookies in various ways. Please keep in
          mind that removing or blocking cookies may impact your user experience
          and parts of our website may no longer be fully accessible.
        </p>
      </>
    ),
    subsections: [
      {
        id: "browser-settings",
        title: "Browser Settings",
        content: (
          <>
            <p>
              Most web browsers allow you to manage cookies through their
              settings. You can typically find these settings in the
              &ldquo;Options&rdquo; or &ldquo;Preferences&rdquo; menu of your
              browser. The following links may help:
            </p>
            <ul>
              <li>Chrome: chrome://settings/cookies</li>
              <li>Firefox: about:preferences#privacy</li>
              <li>Safari: Preferences → Privacy</li>
              <li>Edge: edge://settings/content/cookies</li>
            </ul>
          </>
        ),
      },
      {
        id: "opt-out-tools",
        title: "Opt-Out Tools",
        content: (
          <>
            <p>
              You can also opt out of certain cookies using the following
              industry opt-out tools:
            </p>
            <ul>
              <li>
                Network Advertising Initiative: optout.networkadvertising.org
              </li>
              <li>Digital Advertising Alliance: optout.aboutads.info</li>
              <li>Your Online Choices (EU): youronlinechoices.eu</li>
            </ul>
          </>
        ),
      },
    ],
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: (
      <>
        <p>
          We may update this Cookie Policy from time to time to reflect changes
          in our practices or for other operational, legal, or regulatory
          reasons. We will notify you of any material changes by posting the new
          Cookie Policy on this page and updating the &ldquo;Last Updated&rdquo;
          date.
        </p>
        <p>
          We encourage you to review this Cookie Policy periodically for any
          changes.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact Us",
    content: (
      <>
        <p>
          If you have any questions about our use of cookies or this Cookie
          Policy, please contact us at:
        </p>
        <ul>
          <li>
            <strong>Email:</strong> {CONTACT_EMAIL}
          </li>
          <li>
            <strong>Website:</strong> odis.ai
          </li>
        </ul>
      </>
    ),
  },
];
