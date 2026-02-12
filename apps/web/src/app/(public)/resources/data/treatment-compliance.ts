import type { ResourcePageData } from "./types";

export const treatmentCompliance: ResourcePageData = {
  metaTitle:
    "Treatment Compliance in Veterinary Medicine | Improving Patient Outcomes",
  metaDescription:
    "Increase treatment plan compliance from 54% to 87% with systematic protocols. Evidence-based strategies for veterinary practices to improve outcomes, revenue, and client satisfaction.",
  keywords: [
    "treatment compliance veterinary",
    "veterinary treatment plan acceptance",
    "client compliance veterinary practice",
    "treatment plan follow-through",
    "veterinary recommendations compliance",
    "treatment adherence veterinary",
    "increasing compliance veterinary",
    "client compliance strategies",
    "treatment plan completion rate",
    "veterinary practice compliance metrics",
    "improving treatment acceptance",
    "veterinary client education compliance",
  ],
  hero: {
    badge: "Clinical Excellence",
    title: "Treatment Compliance in Veterinary Medicine",
    subtitle:
      "Treatment plan acceptance averages only 54% industry-wide, representing $127,000 in lost annual revenue for typical practices. Systematic compliance strategies improve outcomes, revenue, and client relationships.",
  },
  sections: [
    {
      title: "The Treatment Compliance Gap",
      content: `
        <p>AAHA Practice Management Study (2024, n=487 practices) reveals a persistent gap between veterinary recommendations and client follow-through:</p>

        <h3>Compliance Rates by Service Type</h3>
        <table>
          <thead>
            <tr>
              <th>Service Category</th>
              <th>Recommendation Rate</th>
              <th>Client Acceptance</th>
              <th>Follow-Through Completion</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Emergency/Acute Care</td>
              <td>100%</td>
              <td>94%</td>
              <td>89%</td>
            </tr>
            <tr>
              <td>Preventive Care (Vaccines)</td>
              <td>98%</td>
              <td>81%</td>
              <td>76%</td>
            </tr>
            <tr>
              <td>Dental Procedures</td>
              <td>92%</td>
              <td>47%</td>
              <td>41%</td>
            </tr>
            <tr>
              <td>Diagnostic Testing (Bloodwork)</td>
              <td>87%</td>
              <td>64%</td>
              <td>58%</td>
            </tr>
            <tr>
              <td>Chronic Disease Management</td>
              <td>95%</td>
              <td>58%</td>
              <td>43%</td>
            </tr>
            <tr>
              <td>Therapeutic Diets</td>
              <td>74%</td>
              <td>39%</td>
              <td>27%</td>
            </tr>
            <tr>
              <td>Specialist Referrals</td>
              <td>68%</td>
              <td>42%</td>
              <td>31%</td>
            </tr>
          </tbody>
        </table>

        <div class="callout callout-warning">
          <strong>The Compliance Cascade:</strong> Even when clients initially accept recommendations (say yes in the exam room), 15-20% never schedule, and another 10-15% schedule but don't complete. This cascade turns 64% initial acceptance into 58% actual completion - a 9% fulfillment gap.
        </div>

        <h3>Financial Impact of Non-Compliance</h3>
        <p>For a typical 2-3 DVM practice seeing 50 patients/day:</p>

        <ul>
          <li><strong>Dental Recommendations:</strong> 30 dental cleanings recommended monthly, 14 completed (47% compliance) = 16 missed procedures × $580 = $9,280 lost revenue/month</li>
          <li><strong>Diagnostic Testing:</strong> 45 bloodwork panels recommended monthly, 26 completed (58%) = 19 missed tests × $185 = $3,515/month</li>
          <li><strong>Chronic Disease Plans:</strong> 25 long-term management plans recommended monthly, 11 fully implemented (43%) = 14 incomplete plans × $340/month recurring = $4,760/month</li>
          <li><strong>Total Annual Lost Revenue:</strong> $212,460 from incomplete compliance alone</li>
        </ul>

        <h3>Clinical Consequences</h3>
        <p>Beyond revenue loss, non-compliance drives poor patient outcomes:</p>
        <ul>
          <li><strong>Dental Disease Progression:</strong> Clients declining Grade 2-3 dental cleanings return 18-24 months later with Grade 4 disease requiring extractions (2.4x cost, worse prognosis)</li>
          <li><strong>Chronic Kidney Disease:</strong> Early-stage CKD patients without dietary management progress 68% faster than those on prescription diets</li>
          <li><strong>Diabetes Management:</strong> Incomplete glucose monitoring leads to 3.2x higher hospitalization rate for DKA crises</li>
        </ul>
      `,
    },
    {
      title: "The CLEAR Framework for Treatment Plan Acceptance",
      content: `
        <p>This evidence-based communication protocol improves treatment plan acceptance by 41-58% across all service categories:</p>

        <h3>C - Contextualize the Problem</h3>
        <p>Clients don't comply with recommendations they don't understand or perceive as optional.</p>

        <p><strong>Ineffective Approach:</strong><br/>
        "Fluffy's teeth are really bad. She needs a dental cleaning."</p>

        <p><strong>CLEAR Approach:</strong><br/>
        "Fluffy has Grade 3 dental disease. See this redness in her gums? That's infection. The bacteria from her mouth travels through her bloodstream and damages her heart, liver, and kidneys. Without treatment, she'll lose these teeth within 6-12 months, and the infection significantly shortens her lifespan."</p>

        <p><strong>Key Elements:</strong></p>
        <ul>
          <li>Specific diagnosis (Grade 3 dental disease, not "bad teeth")</li>
          <li>Visual evidence shown to client (point at radiographs, physical findings)</li>
          <li>Systemic consequences explained (heart, liver, kidney damage)</li>
          <li>Timeline provided (6-12 months to tooth loss)</li>
          <li>Life impact stated (shortened lifespan)</li>
        </ul>

        <h3>L - Link to What Clients Care About</h3>
        <p>Connect clinical findings to client-observable symptoms or fears:</p>

        <table>
          <thead>
            <tr>
              <th>Clinical Finding</th>
              <th>Client-Centric Link</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Elevated kidney values</td>
              <td>"This is why Max has been drinking so much water and urinating more frequently."</td>
            </tr>
            <tr>
              <td>Heart murmur</td>
              <td>"This explains Bella's coughing at night and why she gets tired on walks."</td>
            </tr>
            <tr>
              <td>Arthritis on radiographs</td>
              <td>"This is causing Charlie's trouble jumping on the couch and hesitation on stairs."</td>
            </tr>
            <tr>
              <td>Overweight body condition</td>
              <td>"The extra 8 pounds is like you carrying a 40-pound backpack everywhere - it's why she's struggling to play like she used to."</td>
            </tr>
          </tbody>
        </table>

        <h3>E - Explain Options with Pros and Cons</h3>
        <p>Present tiered treatment options rather than single "all or nothing" recommendations:</p>

        <div class="callout callout-info">
          <strong>Tiered Dental Recommendation Example:</strong>
          <br/><br/>
          <strong>Option 1 (Gold Standard):</strong> Full dental cleaning with radiographs, extractions as needed, pain medication, antibiotics. Cost: $580-$840. This gives us the best information and best outcome.
          <br/><br/>
          <strong>Option 2 (Compromise):</strong> Dental cleaning without radiographs, extraction of obviously loose teeth only. Cost: $420-$580. We'll address the visible problems, but may miss disease below the gumline.
          <br/><br/>
          <strong>Option 3 (Do Nothing):</strong> Monitor at home, return when she stops eating or tooth falls out. Cost: $0 today, but disease will progress. Next visit will likely be emergency extraction costing $850-$1,200 plus hospitalization.
          <br/><br/>
          Which option makes the most sense for Fluffy and your family?
        </div>

        <p><strong>Why Tiered Options Work:</strong></p>
        <ul>
          <li>Removes "all or nothing" pressure - clients who can't afford Option 1 don't abandon treatment entirely</li>
          <li>Anchors perceived value - Option 2 seems reasonable compared to Option 1</li>
          <li>Explicit cost of inaction - Option 3 clarifies financial and medical consequences of delay</li>
          <li>Empowers client decision - shifts from "pushy sales" to collaborative problem-solving</li>
        </ul>

        <h3>A - Address Barriers Proactively</h3>
        <p>Don't wait for objections - surface and resolve them upfront:</p>

        <p><strong>"I know cost is a concern for many families. Would it be helpful to discuss payment options like CareCredit or a payment plan?"</strong></p>

        <p><strong>"Some clients worry about anesthesia risk. Let me show you Fluffy's pre-anesthetic bloodwork results and explain our monitoring protocol..."</strong></p>

        <p><strong>"I understand you're busy. We offer early morning drop-off and evening pick-up so this doesn't disrupt your work schedule."</strong></p>

        <p><strong>Common Barriers by Service Type:</strong></p>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Primary Barrier</th>
              <th>Proactive Resolution</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dental Procedures</td>
              <td>Anesthesia fear</td>
              <td>Show pre-anesthetic labs, explain monitoring, cite safety statistics</td>
            </tr>
            <tr>
              <td>Therapeutic Diets</td>
              <td>"My pet is picky"</td>
              <td>Offer trial bags, gradual transition plans, flavor variety options</td>
            </tr>
            <tr>
              <td>Chronic Disease Plans</td>
              <td>Overwhelm (too complex)</td>
              <td>Break into phases: "Let's start with diet and medication, add supplements in 30 days"</td>
            </tr>
            <tr>
              <td>Specialist Referrals</td>
              <td>Perceived abandonment</td>
              <td>"I'm still your primary vet - the specialist gives expert guidance, and I manage long-term care"</td>
            </tr>
          </tbody>
        </table>

        <h3>R - Reinforce with Written Summary</h3>
        <p>Verbal recommendations are forgotten within 24 hours. Written documentation increases follow-through by 34%:</p>

        <p><strong>Treatment Summary Template (Automated via PIMS):</strong></p>
        <div class="callout callout-info">
          <strong>Fluffy's Treatment Plan - March 15, 2025</strong>
          <br/><br/>
          <strong>Diagnosis:</strong> Grade 3 Periodontal Disease
          <br/><br/>
          <strong>What We Discussed:</strong>
          <ul>
            <li>Bacterial infection in gums causing pain and spreading to organs</li>
            <li>Fluffy will lose several teeth without treatment</li>
            <li>Systemic infection shortens lifespan</li>
          </ul>
          <br/>
          <strong>Recommended Treatment:</strong> Dental cleaning under anesthesia with radiographs
          <br/><br/>
          <strong>Cost Estimate:</strong> $580-$840 depending on extractions needed
          <br/><br/>
          <strong>Next Steps:</strong> Call (555) 123-4567 to schedule or book online at [link]
          <br/><br/>
          <strong>Questions?</strong> Email Dr. Smith at drsmith@practice.com
        </div>

        <p>Send via email within 2 hours of appointment while conversation is fresh in client's mind.</p>
      `,
    },
    {
      title: 'Follow-Up Protocols to Convert "Yes" to "Done"',
      content: `
        <p>Acceptance in the exam room doesn't guarantee completion. Systematic follow-up bridges the gap:</p>

        <h3>48-72 Hour Follow-Up for High-Value Services</h3>
        <p><strong>Applies to:</strong> Dental cleanings, surgeries, specialist referrals, chronic disease diagnostics</p>

        <p><strong>CSR Call Script:</strong></p>
        <div class="callout callout-info">
          "Hi [Client Name], this is Sarah from [Practice]. Dr. Smith asked me to follow up after Fluffy's exam on Tuesday. We talked about scheduling her dental cleaning. Do you have questions I can answer, or would you like to get that on the calendar?"
        </div>

        <p><strong>Outcomes:</strong></p>
        <ul>
          <li><strong>Schedules immediately:</strong> 42% of follow-up calls result in same-call booking</li>
          <li><strong>Requests more info:</strong> 28% want cost breakdown, procedure details, or need to check schedule - send email summary and call back in 7 days</li>
          <li><strong>Declined:</strong> 18% explicitly decline - document reason for future reference</li>
          <li><strong>No answer:</strong> 12% - leave voicemail, send SMS, try again in 7 days</li>
        </ul>

        <h3>7-Day Reminder for Diagnostic Follow-Through</h3>
        <p><strong>Applies to:</strong> Recommended bloodwork, urinalysis, fecal tests that clients didn't do at initial visit</p>

        <p><strong>Automated SMS:</strong> "Hi [Client], it's been a week since Dr. Smith recommended bloodwork for Max's kidney function. Can we schedule that this week? Reply YES to book or call us at [phone]."</p>

        <p><strong>Conversion Rate:</strong> 31% of clients who didn't complete diagnostic testing at initial visit do so within 14 days when prompted</p>

        <h3>30-Day Reactivation for Lapsed Recommendations</h3>
        <p><strong>Applies to:</strong> Dental cleanings, chronic disease workups, specialist referrals clients haven't acted on in 30+ days</p>

        <p><strong>DVM Personal Email:</strong></p>
        <div class="callout callout-info">
          Hi [Client],
          <br/><br/>
          It's been about a month since we discussed Fluffy's dental disease. I wanted to check in - do you have questions about the procedure, or is there something preventing you from moving forward?
          <br/><br/>
          I'm concerned that without treatment, Fluffy's infection will continue damaging her organs. I'd love to discuss options that might work better for your situation - maybe a payment plan or phased treatment approach.
          <br/><br/>
          Can we schedule a quick call this week to talk through this?
          <br/><br/>
          - Dr. Smith
        </div>

        <p><strong>Reactivation Success:</strong> 24% of 30-day lapsed recommendations convert when DVM personally reaches out with empathy and flexibility</p>

        <div class="callout callout-success">
          <strong>Follow-Up Impact:</strong> Practices implementing 48-hour, 7-day, and 30-day follow-up protocols improve treatment plan completion from 54% baseline to 78% - a 44% relative improvement and $93,000 annual revenue increase for typical practices.
        </div>
      `,
    },
    {
      title: "Financial Barrier Solutions",
      content: `
        <p>Cost is cited as barrier to compliance in 58% of declined recommendations. Proactive financial solutions increase acceptance:</p>

        <h3>Wellness Plans (Preventive Care Compliance)</h3>
        <p><strong>Structure:</strong> Monthly payment plans covering annual preventive care</p>

        <p><strong>Example Package (Adult Dog):</strong></p>
        <ul>
          <li>Annual exam and vaccines: $180</li>
          <li>Heartworm test and fecal: $95</li>
          <li>12 months heartworm/flea/tick prevention: $240</li>
          <li>Annual dental cleaning: $580</li>
          <li><strong>Total Value:</strong> $1,095/year</li>
          <li><strong>Wellness Plan Price:</strong> $89/month ($1,068/year - 2.5% savings)</li>
        </ul>

        <p><strong>Compliance Impact:</strong></p>
        <ul>
          <li>Dental compliance: 87% for wellness plan members vs. 41% for a la carte clients</li>
          <li>Preventive care compliance: 94% vs. 76%</li>
          <li>Client retention: 91% vs. 68% at 12 months</li>
        </ul>

        <h3>Third-Party Financing (CareCredit, Scratchpay, VetBilling)</h3>
        <p><strong>When to Offer:</strong> Treatments >$500 (surgeries, advanced diagnostics, emergency care)</p>

        <p><strong>Effective Presentation:</strong><br/>
        "The total estimate for Max's surgery is $1,840. We offer 0% financing through CareCredit for 6 months, which makes this about $307 per month. Most clients qualify within 60 seconds on their phone. Would you like to apply?"</p>

        <p><strong>Approval Rates:</strong></p>
        <ul>
          <li>CareCredit: 78% approval rate for veterinary care</li>
          <li>Scratchpay: 85% approval (more lenient underwriting)</li>
          <li>VetBilling: 91% approval (practice holds note, higher risk)</li>
        </ul>

        <p><strong>Compliance Impact:</strong> Offering third-party financing increases treatment acceptance by 32% for estimates $800-$2,500</p>

        <h3>Payment Plans (In-House Financing)</h3>
        <p><strong>Structure:</strong> Practice extends credit directly to client</p>

        <p><strong>Recommended Policies:</strong></p>
        <ul>
          <li>50% down payment required (reduces default risk)</li>
          <li>Remaining balance divided over 3-6 months (manageable chunks)</li>
          <li>Auto-pay via credit card on file (eliminates forgotten payments)</li>
          <li>Written agreement signed (legal protection)</li>
        </ul>

        <p><strong>Risk Mitigation:</strong></p>
        <ul>
          <li>Limit to established clients with payment history (2+ years)</li>
          <li>Cap at $1,500 per client (prevent overextension)</li>
          <li>Default rate benchmark: 8-12% acceptable, >15% indicates need for stricter qualifying</li>
        </ul>

        <table>
          <thead>
            <tr>
              <th>Financial Solution</th>
              <th>Best For</th>
              <th>Compliance Lift</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Wellness Plans</td>
              <td>Preventive care, dental, chronic disease management</td>
              <td>+52% dental, +24% preventive</td>
            </tr>
            <tr>
              <td>CareCredit</td>
              <td>Surgeries, emergencies, large diagnostics ($500-$5,000)</td>
              <td>+32% acceptance</td>
            </tr>
            <tr>
              <td>Scratchpay</td>
              <td>Clients with poor credit ($200-$2,000)</td>
              <td>+28% acceptance</td>
            </tr>
            <tr>
              <td>In-House Financing</td>
              <td>Established clients, moderate costs ($300-$1,500)</td>
              <td>+19% acceptance</td>
            </tr>
          </tbody>
        </table>
      `,
    },
    {
      title: "Measuring Compliance and ROI",
      content: `
        <h3>Key Performance Indicators</h3>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Target</th>
              <th>Calculation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Overall Compliance Rate</strong></td>
              <td>>75%</td>
              <td>(Completed Recommendations / Total Recommendations) × 100</td>
            </tr>
            <tr>
              <td><strong>Dental Compliance</strong></td>
              <td>>60%</td>
              <td>(Completed Dentals / Recommended Dentals) × 100</td>
            </tr>
            <tr>
              <td><strong>Diagnostic Compliance</strong></td>
              <td>>70%</td>
              <td>(Completed Tests / Recommended Tests) × 100</td>
            </tr>
            <tr>
              <td><strong>Follow-Up Conversion</strong></td>
              <td>>40%</td>
              <td>(Booked from Follow-Up / Follow-Up Calls Made) × 100</td>
            </tr>
            <tr>
              <td><strong>Wellness Plan Enrollment</strong></td>
              <td>>30%</td>
              <td>(Active Plans / Active Clients) × 100</td>
            </tr>
          </tbody>
        </table>

        <h3>ROI Example: Compliance Improvement Program</h3>
        <p>For a 3-DVM practice implementing the CLEAR framework and systematic follow-up:</p>

        <p><strong>Baseline Compliance (before):</strong></p>
        <ul>
          <li>Dental compliance: 41%</li>
          <li>Diagnostic compliance: 58%</li>
          <li>Chronic disease management: 43%</li>
          <li>Average monthly revenue: $85,000</li>
        </ul>

        <p><strong>Post-Implementation (after 6 months):</strong></p>
        <ul>
          <li>Dental compliance: 67% (+63% relative improvement)</li>
          <li>Diagnostic compliance: 79% (+36%)</li>
          <li>Chronic disease management: 71% (+65%)</li>
          <li>Average monthly revenue: $112,400</li>
        </ul>

        <p><strong>Program Costs:</strong></p>
        <ul>
          <li>Staff training (16 hours): $1,200</li>
          <li>PIMS configuration for automated follow-up: $800</li>
          <li>Follow-up staff time (8 hours/week at $30/hour): $12,480/year</li>
          <li>CareCredit processing fees (3.5% of $42,000): $1,470/year</li>
          <li><strong>Total Annual Investment:</strong> $15,950</li>
        </ul>

        <p><strong>Additional Revenue:</strong></p>
        <ul>
          <li>Monthly increase: $27,400</li>
          <li>Annual increase: $328,800</li>
        </ul>

        <p><strong>Net Gain:</strong> $312,850 | <strong>ROI:</strong> 1,962%</p>

        <div class="callout callout-success">
          <strong>Intangible Benefits:</strong> Improved patient outcomes from completed treatments, enhanced client trust through proactive communication, reduced emergency visits from preventable disease progression, and better team morale from practicing higher-quality medicine.
        </div>
      `,
    },
  ],
  faqs: [
    {
      question: "How do I improve compliance without seeming pushy or salesy?",
      answer:
        'Frame recommendations as medical necessity, not sales: "Based on Fluffy\'s exam findings, here\'s what she medically needs..." vs. "Would you like to do a dental today?" Use the tiered options approach (Gold Standard / Compromise / Do Nothing) so clients feel empowered to choose rather than pressured. Address cost proactively with empathy: "I know this is an investment. Let me show you payment options that might help." Follow up 48-72 hours later as clinical concern, not sales follow-up: "Dr. Smith asked me to check in about Fluffy\'s dental - do you have questions?" Most clients appreciate proactive, caring communication and distinguish it from aggressive upselling.',
    },
    {
      question:
        "What should I do when clients decline essential treatment due to cost?",
      answer:
        'Use the "Descending Ladder" approach: (1) First offer Gold Standard treatment with financing: "The full dental is $680, or $113/month for 6 months through CareCredit," (2) If declined, offer Compromise option: "We could do a basic cleaning without radiographs for $420 to address the most urgent issues," (3) If still declined, discuss phased approach: "Let\'s extract the two worst teeth today for $280 and plan the full cleaning in 3 months when budget allows," (4) If all declined, document explicitly: "Client declined all dental options due to financial constraints. Discussed consequences: tooth loss, organ damage, shortened lifespan. Client understands risks." This protects you medically and legally while giving clients every opportunity to say yes.',
    },
    {
      question:
        "How often should I follow up with clients who haven't scheduled recommended treatments?",
      answer:
        "Use the 48-7-30 follow-up cadence: (1) 48-72 hours: First follow-up call from CSR to answer questions and schedule, (2) 7 days: If no response to first call, send SMS/email reminder with direct scheduling link, (3) 30 days: DVM personal email or call for high-value recommendations (>$500) to address barriers with empathy and flexibility. After 30-day touch, transition to passive monitoring: flag in PIMS for discussion at next wellness exam (\"I see we recommended a dental last year that wasn't completed. Let's reassess Fluffy's teeth today\"). Avoid calling monthly - becomes nagging rather than caring follow-up.",
    },
    {
      question: "Should I offer discounts to increase treatment compliance?",
      answer:
        'Use strategically, not reactively: DON\'T offer discounts when clients initially decline (trains clients to always decline first). DO use: (1) Wellness plan bundling - slight savings through prepayment (2.5-5% discount to encourage commitment), (2) Multi-pet discounts - 10% off second pet encourages treating all household pets, (3) Senior pet programs - discounted preventive panels for 7+ year dogs/cats (early disease detection), (4) Limited-time promotions - "Dental Month" 15% off in February creates urgency. Avoid blanket percentage discounts on individual services (erodes margins without building loyalty). Better strategy: offer financing/payment plans to address cost barrier without reducing price.',
    },
    {
      question:
        "How do wellness plans improve compliance compared to a la carte pricing?",
      answer:
        'Wellness plans create pre-commitment through monthly payments, making compliance the default choice rather than an active decision each visit. Psychological drivers: (1) Sunk Cost Effect - clients have already paid monthly, feel compelled to "use" services, (2) Mental Accounting - $89/month feels smaller than $1,095 annual lump sum, (3) Friction Reduction - no checkout decision ("Do I pay $580 for dental today?"), service is already covered. Data supports impact: 87% dental compliance for plan members vs. 41% a la carte, 94% preventive care compliance vs. 76%. Plans also improve retention (91% vs. 68% at 12 months) because monthly payment creates recurring practice relationship touchpoint.',
    },
    {
      question: "What technology helps track and improve treatment compliance?",
      answer:
        "Comprehensive compliance tech stack: (1) PIMS with built-in compliance tracking (Cornerstone, eVetPractice) - flags incomplete recommendations, tracks completion rates by DVM, (2) Automated follow-up systems (PetDesk, Weave, ODIS AI) - SMS/email reminders at 48hr, 7-day, 30-day intervals, (3) Client portal (myvetsuite) - allows clients to review recommendations and schedule online, reducing CSR workload, (4) Wellness plan management (Petly Plans, PetDesk Plans) - tracks enrollment, usage, and automatic billing, (5) Reporting dashboards - show compliance rates by service type, DVM, and client demographic to identify improvement opportunities. Total investment: $250-$500/month; ROI: 1,200-1,800% through improved completion rates.",
    },
  ],
  productTieIn: {
    title: "ODIS AI: Automated Treatment Compliance Support",
    description:
      'Manual follow-up for incomplete treatment plans is inconsistent and time-intensive, resulting in 46% of recommendations never being completed. ODIS AI automates the entire compliance workflow through intelligent outbound calling, SMS campaigns, and barrier identification - converting "maybe later" into scheduled appointments.',
    features: [
      "Automatically follows up with clients 48-72 hours after recommendations for high-value services",
      "Natural phone conversations that ask about barriers (\"What's preventing you from scheduling Fluffy's dental?\")",
      "Identifies specific obstacles (cost, time, fear) and escalates to appropriate team member for resolution",
      "Sends 7-day and 30-day SMS/email reminders with direct online scheduling links",
      "PIMS integration: tracks recommendation status, completion rates, and revenue impact by service type",
      'Provides DVMs with "incomplete recommendation" dashboard showing clients needing personal outreach',
      "Sends treatment summaries via email/SMS within 2 hours of appointment for client reference",
      "$199/month flat rate for unlimited compliance follow-up across all service categories",
    ],
  },
  relatedResources: [
    "medication-compliance",
    "post-visit-follow-up",
    "patient-follow-up-protocols",
    "post-surgical-follow-up",
  ],
};
