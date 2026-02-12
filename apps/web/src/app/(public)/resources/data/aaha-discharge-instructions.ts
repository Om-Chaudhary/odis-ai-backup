import type { ResourcePageData } from "./types";

export const aahaDischargeInstructions: ResourcePageData = {
  // SEO
  metaTitle: "AAHA Discharge Instructions: Standards & Best Practices",
  metaDescription:
    "Learn what AAHA standards require for veterinary discharge instructions, how to close compliance gaps, and practical steps to improve client outcomes after every visit.",
  keywords: [
    "aaha discharge instructions",
    "aaha discharge standards",
    "veterinary discharge instructions",
    "aaha accreditation discharge",
    "veterinary discharge compliance",
    "aaha standards of accreditation",
    "discharge summary veterinary",
    "client discharge instructions vet",
  ],

  // Hero
  hero: {
    badge: "Discharge Standards",
    title: "AAHA Discharge Instructions: What the Standards Require",
    subtitle:
      "A practical breakdown of AAHA accreditation requirements for discharge instructions, common pitfalls practices face, and how to build a repeatable process that keeps clients informed and pets healthy.",
  },

  // Content sections
  sections: [
    {
      title: "What AAHA Standards Require for Discharge Instructions",
      content: `<p>The American Animal Hospital Association (AAHA) Standards of Accreditation set clear expectations for patient discharge. Under the Patient Care standards, accredited hospitals must provide written discharge instructions to the client at the time of release. These instructions must be understandable to a layperson and documented in the medical record.</p>
<p>Specifically, AAHA evaluators look for:</p>
<ul>
<li><strong>Written home-care instructions</strong> provided at every discharge, whether the visit was a routine wellness exam or a complex surgical procedure.</li>
<li><strong>Documentation in the patient record</strong> confirming that instructions were delivered and, ideally, that the client acknowledged understanding.</li>
<li><strong>Medication details</strong> including drug name, dose, frequency, duration, route of administration, and potential side effects.</li>
<li><strong>Follow-up expectations</strong> such as recheck appointments, activity restrictions, dietary changes, and warning signs that should prompt an emergency visit.</li>
</ul>
<p>The standards do not prescribe a specific format or template. Practices have flexibility in how they deliver instructions, whether printed, emailed, or sent through a client portal, as long as the information is complete and accessible.</p>`,
      callout: {
        type: "warning",
        text: "During AAHA evaluations, discharge documentation is one of the most frequently cited areas for improvement. Incomplete or missing instructions can affect accreditation status.",
      },
    },
    {
      title: "Key Components of Compliant Discharge Summaries",
      content: `<p>Meeting the letter of AAHA standards is a starting point. Building discharge summaries that genuinely help clients requires attention to several components:</p>
<ul>
<li><strong>Diagnosis or condition summary:</strong> A plain-language explanation of what was found or treated during the visit. Avoid jargon; write as though the client has no medical background.</li>
<li><strong>Procedures performed:</strong> A brief description of any procedures, including why they were done and what the client should expect during recovery.</li>
<li><strong>Medication instructions:</strong> Each medication listed with its purpose, dosing schedule, duration, and what to do if a dose is missed. Include warnings about drug interactions or contraindications with food.</li>
<li><strong>Activity and dietary restrictions:</strong> Specific guidance on exercise limitations, crate rest requirements, feeding changes, or wound care protocols.</li>
<li><strong>Warning signs:</strong> A clear list of symptoms that warrant an immediate call or emergency visit, such as vomiting, lethargy, swelling at a surgical site, or changes in breathing.</li>
<li><strong>Follow-up schedule:</strong> When to return for suture removal, rechecks, lab work, or booster vaccines, with dates rather than vague timeframes.</li>
<li><strong>Contact information:</strong> Daytime and after-hours phone numbers, including emergency clinic referrals if your practice is not open 24/7.</li>
</ul>
<p>Practices that include all of these elements consistently score well on AAHA evaluations and, more importantly, see fewer preventable readmissions and after-hours emergency calls.</p>`,
    },
    {
      title: "Common Compliance Gaps and How to Fix Them",
      content: `<p>Even well-intentioned practices fall into patterns that create compliance gaps. Here are the most common issues AAHA evaluators flag and how to address them:</p>
<ul>
<li><strong>Verbal-only instructions:</strong> Telling clients what to do at checkout without providing anything in writing. Under stress, clients retain a fraction of what they hear. The fix is straightforward: generate a printed or digital summary for every discharge, no exceptions.</li>
<li><strong>Generic templates with no customization:</strong> Using the same boilerplate regardless of procedure or diagnosis. Templates are fine as a starting point, but each summary needs procedure-specific and patient-specific details filled in.</li>
<li><strong>Missing medication side effects:</strong> Listing medications without noting common adverse reactions or what to watch for. Clients need to know the difference between a normal post-anesthetic recovery and a drug reaction.</li>
<li><strong>No documentation of delivery:</strong> Providing instructions but not recording in the chart that they were given. Add a checkbox or note field in your PIMS that confirms discharge instructions were delivered.</li>
<li><strong>Inconsistent follow-up scheduling:</strong> Telling the client to "call if anything seems off" instead of scheduling a specific recheck date. Practices that schedule follow-ups at discharge have significantly higher compliance rates.</li>
</ul>
<p>The simplest way to close these gaps is to build discharge documentation into your workflow as a required step, not an optional one. If your practice management system supports discharge templates, configure them so that key fields cannot be skipped.</p>`,
      callout: {
        type: "tip",
        text: "Assign one team member per shift to audit a sample of that day's discharge summaries. A five-minute daily review catches gaps before they become patterns.",
      },
    },
    {
      title: "Writing Effective Client-Facing Instructions",
      content: `<p>Compliance and clarity are not the same thing. A discharge summary can check every AAHA box and still confuse the client. Effective client-facing instructions share a few characteristics:</p>
<p><strong>Use plain language.</strong> Replace "administer 2.5 mg/kg PO BID for 10 days" with "Give one tablet by mouth twice daily, with food, for 10 days." Medical shorthand is efficient for the medical record but meaningless to most pet owners.</p>
<p><strong>Organize visually.</strong> Use headings, bullet points, and bold text to make the document scannable. Clients will refer back to these instructions at home, often on their phone, and they need to find the right section quickly.</p>
<p><strong>Be specific about timelines.</strong> Instead of "restrict activity for two weeks," write "No running, jumping, or stair climbing until your recheck appointment on March 15." Concrete dates and actions are easier to follow than relative timeframes.</p>
<p><strong>Include a "call us if" section.</strong> This is the most important part of any discharge summary. List the specific warning signs, like "Call us immediately if you notice swelling larger than a golf ball at the incision site, vomiting more than once, or refusal to eat for more than 24 hours." Specificity reduces both unnecessary calls and dangerous delays.</p>
<p><strong>Confirm understanding before the client leaves.</strong> Have a technician review the key points verbally and ask the client to repeat back the medication schedule. This teach-back method is well-established in human healthcare and works equally well in veterinary practice.</p>`,
      callout: {
        type: "stat",
        text: "Studies in human healthcare show patients forget 40-80% of information provided by clinicians almost immediately. Written instructions significantly improve recall and adherence.",
      },
    },
    {
      title: "Automating Discharge Follow-Up for Better Outcomes",
      content: `<p>Discharge instructions set expectations, but follow-up is what drives outcomes. The gap between "here are your instructions" and "how is your pet doing?" is where compliance breaks down. Many practices struggle with follow-up because it requires staff time they do not have.</p>
<p>Structured follow-up after discharge accomplishes several things:</p>
<ul>
<li><strong>Catches complications early:</strong> A check-in call 24-48 hours post-procedure surfaces issues like wound complications, medication reactions, or inadequate pain control before they escalate.</li>
<li><strong>Reinforces instructions:</strong> Clients who receive a follow-up call are more likely to adhere to medication schedules and activity restrictions because the contact serves as a reminder and an opportunity to ask questions.</li>
<li><strong>Improves client satisfaction:</strong> Pet owners consistently rate post-visit follow-up as one of the most valued services a practice can offer. It signals that the practice cares about outcomes, not just the visit itself.</li>
<li><strong>Supports AAHA continuity-of-care expectations:</strong> AAHA standards emphasize continuity of care, and documented follow-up demonstrates that the practice actively monitors patient outcomes beyond the discharge moment.</li>
</ul>
<p>The challenge is operational. Most practices cannot dedicate a technician to making follow-up calls for every discharge when that same technician is needed in the treatment area. This is where automation becomes practical. Automated phone or messaging systems can handle routine post-discharge check-ins, collect structured responses about the patient's recovery, and escalate to a clinician only when the responses indicate a potential problem.</p>`,
    },
  ],

  // Downloadable asset
  asset: {
    title: "AAHA-Aligned Discharge Instructions Template",
    description:
      "A customizable discharge template covering every component AAHA evaluators look for, including medication tables, warning signs, and follow-up scheduling fields. Available in print and digital formats.",
    ctaText: "Download the Template",
  },

  // Statistics
  stats: [
    {
      value: "28%",
      label:
        "of veterinary clients do not fully understand discharge instructions at the time they leave the clinic",
      source: "JAVMA Client Communication Study",
    },
    {
      value: "50%+",
      label:
        "of post-surgical complications are linked to non-adherence to home-care instructions",
      source: "AAHA Trends Magazine",
    },
    {
      value: "3x",
      label:
        "higher recheck compliance at practices that schedule follow-ups at the time of discharge",
      source: "Veterinary Hospital Managers Association",
    },
    {
      value: "15 min",
      label:
        "average staff time saved per discharge when using structured templates versus free-text notes",
      source: "AAHA Practice Efficiency Report",
    },
  ],

  // FAQs
  faqs: [
    {
      question: "Are discharge instructions required for AAHA accreditation?",
      answer:
        "Yes. AAHA Standards of Accreditation require that written discharge instructions be provided to the client and documented in the patient record for every visit. This applies to routine wellness exams, dental procedures, surgeries, and hospitalizations. Verbal-only instructions do not meet the standard.",
    },
    {
      question: "What format do AAHA discharge instructions need to be in?",
      answer:
        "AAHA does not mandate a specific format. Practices can use printed handouts, emailed summaries, client portal messages, or text-based communications. The requirement is that the instructions are written, understandable to a layperson, and include all relevant home-care details including medications, activity restrictions, warning signs, and follow-up scheduling.",
    },
    {
      question:
        "How detailed do medication instructions need to be on discharge summaries?",
      answer:
        "Medication instructions should include the drug name, dose in client-friendly terms (e.g., 'one tablet' rather than milligrams), route of administration, frequency, duration, whether to give with food, and common side effects to watch for. AAHA evaluators check that clients have enough information to administer medications safely without needing to call the clinic for clarification.",
    },
    {
      question:
        "Can discharge instructions be generated automatically from the PIMS?",
      answer:
        "Most modern practice management systems support discharge templates that auto-populate patient name, medications, and visit details. The key is to configure these templates so that procedure-specific instructions, warning signs, and follow-up dates are included rather than relying on a single generic template for all visit types. Automated generation saves time but requires periodic review to ensure accuracy and completeness.",
    },
    {
      question: "Does AAHA require post-discharge follow-up calls?",
      answer:
        "AAHA standards emphasize continuity of care but do not explicitly require a follow-up phone call for every discharge. However, practices that implement structured post-discharge follow-up, whether by phone, automated messaging, or client portal check-ins, demonstrate stronger continuity of care during evaluations and tend to achieve better patient outcomes.",
    },
  ],

  // Product tie-in
  productTieIn: {
    title: "Automate Your Post-Discharge Follow-Up",
    description:
      "OdisAI makes automated follow-up calls to clients after discharge, checking on patient recovery, reinforcing home-care instructions, and flagging concerns for your team. Every call is documented and summarized so your staff spends time on clinical care instead of phone tag.",
    solutionSlug: "discharge-follow-up",
  },

  // Cross-linking
  relatedResources: [
    {
      slug: "veterinary-discharge-instructions-template",
      label: "Discharge Instructions Template",
    },
    {
      slug: "veterinary-client-communication-guide",
      label: "Client Communication Guide",
    },
  ],
  relatedSolutions: [
    {
      slug: "discharge-follow-up",
      label: "Automated Discharge Follow-Up",
    },
    {
      slug: "veterinary-answering-service",
      label: "24/7 Answering Service",
    },
  ],

  // Schema
  schemaType: "HowTo",

  // Hub page
  iconName: "ClipboardCheck",
  cardDescription:
    "Understand what AAHA accreditation requires for discharge instructions, close common compliance gaps, and build a repeatable process that improves client outcomes.",
};
