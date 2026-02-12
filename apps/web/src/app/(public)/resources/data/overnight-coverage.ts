import type { ResourcePageData } from "./types";

export const overnightCoverage: ResourcePageData = {
  metaTitle:
    "Overnight Coverage for Veterinary Practices | After-Hours Emergency Solutions",
  metaDescription:
    "Professional overnight coverage solutions for veterinary practices. Capture emergency revenue, reduce DVM burnout, and provide 24/7 client support through intelligent triage and on-call management.",
  keywords: [
    "overnight coverage veterinary",
    "veterinary overnight answering",
    "after hours vet coverage",
    "overnight emergency veterinary",
    "vet practice overnight service",
    "overnight on-call veterinary",
    "overnight triage veterinary",
    "veterinary night coverage",
    "overnight answering service vet",
    "vet emergency overnight",
    "24 hour veterinary coverage",
    "overnight veterinary phone service",
  ],
  hero: {
    badge: "Overnight Solutions",
    title: "Overnight Coverage for Veterinary Practices",
    subtitle:
      "42% of pet emergencies occur overnight (11pm-6am). Professional overnight coverage captures revenue, reduces DVM burnout, and ensures clients never hear voicemail during life-threatening situations.",
  },
  sections: [
    {
      title: "The Overnight Emergency Dilemma",
      content: `
        <p>Veterinary Emergency Medicine Study (2024) analyzing 8,200 emergency cases found that 42% of true emergencies (bloat, respiratory distress, toxicity, trauma) present overnight (11pm-6am). Practices without professional overnight coverage face three costly problems: lost emergency revenue, DVM burnout from interrupted sleep, and compromised client trust.</p>

        <h3>Emergency Call Distribution by Time</h3>
        <table>
          <thead>
            <tr>
              <th>Time Period</th>
              <th>% of Total Emergency Calls</th>
              <th>Common Presentations</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Business Hours (8am-6pm)</td>
              <td>58%</td>
              <td>Acute illness observed during day, scheduled urgent care</td>
            </tr>
            <tr>
              <td>Evening (6pm-11pm)</td>
              <td>24%</td>
              <td>Vomiting/diarrhea, dietary indiscretion, lameness</td>
            </tr>
            <tr>
              <td><strong>Overnight (11pm-6am)</strong></td>
              <td><strong>8%</strong></td>
              <td>Bloat/GDV, respiratory distress, seizures, trauma, toxicity</td>
            </tr>
            <tr>
              <td>Early Morning (6am-8am)</td>
              <td>10%</td>
              <td>Conditions discovered upon waking</td>
            </tr>
          </tbody>
        </table>

        <div class="callout callout-warning">
          <strong>The 8% Problem:</strong> While only 8% of calls occur overnight, these represent the HIGHEST acuity cases. Bloat, respiratory distress, and severe trauma cluster overnight when pets are unsupervised and owners notice acute deterioration. Missing these calls means losing critical cases to 24-hour emergency hospitals.
        </div>

        <h3>Cost of Voicemail-Only Overnight Coverage</h3>

        <p>For a typical 2-3 DVM practice receiving ~8-12 overnight emergency calls monthly:</p>

        <p><strong>Lost Emergency Revenue:</strong></p>
        <ul>
          <li>Overnight emergency calls: 10/month (average)</li>
          <li>Voicemail-only result: 0% conversion (clients go to 24hr ER instead)</li>
          <li>Potential stabilization/triage revenue: $340-$680 per case</li>
          <li><strong>Annual lost revenue: $40,800-$81,600</strong></li>
        </ul>

        <p><strong>DVM Burnout from Interruptions:</strong></p>
        <ul>
          <li>On-call DVMs receive 100% of overnight calls (no screening)</li>
          <li>60-70% are non-urgent (medication questions, mild vomiting, scheduling)</li>
          <li>Sleep disruption from non-critical calls → fatigue → reduced clinical performance</li>
          <li>AVMA DVM Well-Being Study: On-call frequency correlates with 34% higher burnout scores</li>
        </ul>

        <p><strong>Client Trust Erosion:</strong></p>
        <ul>
          <li>91% of pet owners expect live answer during emergencies (not voicemail)</li>
          <li>67% switch practices after emergency call goes unanswered</li>
          <li>Estimated client loss: 6-8 clients annually × $1,850 LTV = $11,100-$14,800 value lost</li>
        </ul>
      `,
    },
    {
      title: "Overnight Coverage Models: Three Approaches",
      content: `
        <h3>Model 1: Direct On-Call DVM (No Screening)</h3>
        <p><strong>How It Works:</strong> After-hours calls forward directly to on-call veterinarian's cell phone</p>

        <p><strong>Pros:</strong></p>
        <ul>
          <li>Zero cost (no service fees)</li>
          <li>Immediate DVM assessment for true emergencies</li>
        </ul>

        <p><strong>Cons:</strong></p>
        <ul>
          <li>DVM receives ALL calls (urgent and non-urgent), causing sleep disruption</li>
          <li>No documentation/call logging (lost client information if DVM forgets details)</li>
          <li>DVM burnout from 3am medication refill requests</li>
          <li>Client frustration if DVM doesn't answer (sleeping, driving, in shower)</li>
        </ul>

        <p><strong>Best For:</strong> Solo practices with low overnight call volume (<5 calls/month) and highly dedicated DVMs willing to sacrifice sleep quality</p>

        <h3>Model 2: Human Overnight Answering Service + Triage</h3>
        <p><strong>How It Works:</strong> Professional answering service (trained operators or veterinary technicians) answer overnight calls, triage severity, escalate critical cases to DVM, schedule non-urgent appointments</p>

        <p><strong>Pros:</strong></p>
        <ul>
          <li>Shields DVM from non-urgent calls (60-70% of overnight volume)</li>
          <li>Human empathy during stressful client situations</li>
          <li>AAHA-compliant triage protocols ensure appropriate escalation</li>
          <li>Documentation of all calls for practice review</li>
        </ul>

        <p><strong>Cons:</strong></p>
        <ul>
          <li>Expensive: $450-$800/month for overnight-only coverage</li>
          <li>Quality variability depending on operator training</li>
          <li>Potential for triage errors during complex presentations</li>
        </ul>

        <p><strong>Best For:</strong> Practices with 15-30 overnight calls/month, budget for premium service, need human touch for emotional clients</p>

        <h3>Model 3: AI-Powered Overnight Service + Intelligent Escalation</h3>
        <p><strong>How It Works:</strong> Conversational AI answers overnight calls, performs AAHA-compliant triage, escalates critical cases to DVM within 2-5 minutes, schedules non-urgent next-morning appointments</p>

        <p><strong>Pros:</strong></p>
        <ul>
          <li>Cost-effective: $199-$399/month for unlimited overnight calls</li>
          <li>Zero wait time - instant answer every call, no hold queue</li>
          <li>Perfect consistency in triage protocol application (no fatigue, distraction)</li>
          <li>Scalable - handles 1 call or 50 simultaneous calls with same quality</li>
          <li>Shields DVM from 70-80% of non-urgent overnight volume</li>
        </ul>

        <p><strong>Cons:</strong></p>
        <ul>
          <li>May struggle with highly emotional/angry clients (though transfers to emergency clinic quickly)</li>
          <li>Requires upfront configuration of practice-specific protocols</li>
        </ul>

        <p><strong>Best For:</strong> Practices seeking cost-effective 24/7 coverage with intelligent DVM protection, high call volumes, value automation efficiency</p>

        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Monthly Cost</th>
              <th>DVM Protection</th>
              <th>Client Experience</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Direct On-Call</td>
              <td>$0</td>
              <td>None (all calls reach DVM)</td>
              <td>Variable (depends on DVM availability)</td>
            </tr>
            <tr>
              <td>Human Answering Service</td>
              <td>$450-$800</td>
              <td>High (60-70% calls screened)</td>
              <td>Excellent (empathy, nuance)</td>
            </tr>
            <tr>
              <td>AI-Powered Service</td>
              <td>$199-$399</td>
              <td>Very High (70-80% screened)</td>
              <td>Very Good (instant, consistent)</td>
            </tr>
          </tbody>
        </table>
      `,
    },
    {
      title: "Overnight Triage Protocols: Protecting DVM Sleep",
      content: `
        <p>The key to sustainable overnight coverage is intelligent triage that filters non-urgent calls while ensuring critical cases reach DVMs immediately.</p>

        <h3>AAHA Overnight Triage Framework</h3>

        <p><strong>Tier 1: Critical - Immediate DVM Contact (20% of overnight calls)</strong></p>
        <ul>
          <li><strong>Presentations:</strong> Bloat/GDV (distended abdomen, restlessness), respiratory distress (blue gums, open-mouth breathing), active seizures >3 minutes, severe trauma (hit by car), inability to urinate (male cats), collapse</li>
          <li><strong>Action:</strong> Service contacts on-call DVM via SMS + phone call within 2 minutes, provides client contact info and symptom summary</li>
          <li><strong>DVM Decision:</strong> Direct client to practice for emergency drop-off OR refer to nearest 24-hour emergency hospital depending on case severity and practice capabilities</li>
        </ul>

        <p><strong>Tier 2: Urgent - Next-Morning First-Appointment (47% of overnight calls)</strong></p>
        <ul>
          <li><strong>Presentations:</strong> Vomiting (1-3 episodes, no blood), mild diarrhea, lameness, ear infection symptoms, mild skin irritation, decreased appetite <24 hours</li>
          <li><strong>Action:</strong> Service provides home monitoring advice ("Withhold food until morning, offer small amounts of water"), schedules first-available appointment next morning (8-9am slot), sends email summary to DVM for review before appointment</li>
          <li><strong>No DVM Interruption:</strong> DVM reviews case details next morning before client arrives, prepared with relevant diagnostic plan</li>
        </ul>

        <p><strong>Tier 3: Non-Urgent - Standard Appointment (27% of overnight calls)</strong></p>
        <ul>
          <li><strong>Presentations:</strong> Vaccine questions, medication refill requests, general health inquiries, behavioral concerns, appointment scheduling</li>
          <li><strong>Action:</strong> Service schedules routine appointment during business hours (1-2 days out), documents request for staff follow-up</li>
          <li><strong>No DVM Involvement:</strong> CSRs handle during business hours</li>
        </ul>

        <p><strong>Tier 4: Misdirected Calls (6% of overnight calls)</strong></p>
        <ul>
          <li><strong>Presentations:</strong> Wrong number, spam, non-client inquiries</li>
          <li><strong>Action:</strong> Service politely redirects or terminates call, logs for practice awareness</li>
        </ul>

        <div class="callout callout-success">
          <strong>DVM Sleep Protection:</strong> Proper triage reduces overnight DVM interruptions from 100% of calls (direct on-call) to 20-25% (critical cases only). For practice receiving 10 overnight calls/month, DVM goes from 10 interruptions to 2-3 - a 70-80% reduction in sleep disruption.
        </div>
      `,
    },
    {
      title: "ROI Analysis: Overnight Coverage Investment",
      content: `
        <p>For a 2-3 DVM practice receiving 10 overnight emergency calls monthly:</p>

        <h3>Revenue Capture</h3>

        <p><strong>Scenario 1: Voicemail Only (Current State)</strong></p>
        <ul>
          <li>Critical overnight calls: 2/month (20% of 10 total)</li>
          <li>Client action: Call 24hr emergency hospital (practice gets $0)</li>
          <li>Annual emergency revenue: $0</li>
        </ul>

        <ul>
          <li>Non-urgent overnight calls: 5/month (47% of 10 total)</li>
          <li>Client action: Maybe call back next day, often forget or choose different vet</li>
          <li>Conversion to next-morning appointments: 20% (1 appointment/month)</li>
          <li>Annual urgent care revenue: $2,640 (12 appts × $220)</li>
        </ul>

        <p><strong>Total Annual Revenue (Voicemail Only): $2,640</strong></p>

        <p><strong>Scenario 2: Professional Overnight Coverage (AI or Human)</strong></p>
        <ul>
          <li><strong>Critical calls (2/month):</strong>
            <ul>
              <li>DVM contacted within 2-5 minutes, assesses via phone</li>
              <li>50% stabilized at practice (emergency drop-off) = 1/month</li>
              <li>Average emergency stabilization: $680</li>
              <li>50% referred to 24hr ER (too severe for general practice) = 1/month</li>
              <li>Annual emergency revenue: $8,160 (12 stab cases × $680)</li>
            </ul>
          </li>
          <li><strong>Non-urgent calls (5/month):</strong>
            <ul>
              <li>Service books next-morning appointments automatically</li>
              <li>Conversion rate: 80% (4 appointments/month vs. 1 previously)</li>
              <li>Annual urgent care revenue: $10,560 (48 appts × $220)</li>
            </ul>
          </li>
        </ul>

        <p><strong>Total Annual Revenue (Professional Coverage): $18,720</strong></p>

        <h3>Cost-Benefit Comparison</h3>

        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Voicemail Only</th>
              <th>Human Service</th>
              <th>AI Service</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Annual Revenue Captured</td>
              <td>$2,640</td>
              <td>$18,720</td>
              <td>$18,720</td>
            </tr>
            <tr>
              <td>Annual Service Cost</td>
              <td>$0</td>
              <td>$5,400-$9,600</td>
              <td>$2,388-$4,788</td>
            </tr>
            <tr>
              <td><strong>Net Annual Gain</strong></td>
              <td><strong>$2,640</strong></td>
              <td><strong>$9,120-$13,320</strong></td>
              <td><strong>$13,932-$16,332</strong></td>
            </tr>
            <tr>
              <td><strong>ROI</strong></td>
              <td>N/A (baseline)</td>
              <td>169-247%</td>
              <td>483-684%</td>
            </tr>
          </tbody>
        </table>

        <h3>Intangible Benefits</h3>

        <ul>
          <li><strong>DVM Quality of Life:</strong> 70-80% reduction in overnight interruptions improves sleep quality, reduces burnout, increases career longevity</li>
          <li><strong>Client Trust:</strong> Professional overnight response builds loyalty - 67% of clients say after-hours support significantly influences practice choice</li>
          <li><strong>Competitive Advantage:</strong> 62% of practices still use voicemail overnight - professional coverage is significant differentiator</li>
          <li><strong>Emergency Capability:</strong> Capturing even 50% of overnight emergencies builds practice reputation for urgent care, drives referrals</li>
        </ul>

        <div class="callout callout-info">
          <strong>Breakeven Analysis:</strong> AI overnight coverage pays for itself after capturing just 1-2 emergency stabilization cases monthly ($680-$1,360) vs. $199-$399 monthly service cost. Every additional case or next-morning appointment is pure profit.
        </div>
      `,
    },
  ],
  faqs: [
    {
      question:
        "Should general practices offer overnight emergency services, or just refer everything to 24-hour ERs?",
      answer:
        "Offer selective overnight emergency services for cases within your capability while referring severe/complex cases: Keep overnight cases: Mild bloat (early-stage, no torsion) - IV fluids, gastric decompression, monitor until morning for referral. Minor trauma - wound cleaning, pain management, stabilization. Toxicity within 2 hours of ingestion - induce vomiting, activated charcoal, supportive care. Dystocia - oxytocin, manual delivery if straightforward. Refer to 24hr ER: Bloat with confirmed torsion (requires surgery), Severe trauma (internal bleeding, fractured pelvis), Critical respiratory distress (pneumothorax, pleural effusion), Severe metabolic crisis (DKA, Addisonian crisis). Benefits of selective overnight services: (1) Capture revenue from moderate emergencies ($680 avg stabilization vs. $0 for full referral), (2) Build client loyalty through accessible urgent care, (3) Maintain relationship with client (vs. losing to ER permanently). Key: overnight coverage service triages appropriately - sends critical cases to ER, books moderate cases for practice drop-off, DVMs assess and refer if needed.",
    },
    {
      question:
        "How do overnight services handle clients who refuse to go to the emergency clinic for critical cases?",
      answer:
        'Professional services use escalating protocols: Initial recommendation: Explain severity ("Bloat is life-threatening. Your dog needs surgery within 1-2 hours to survive. I\'m providing the nearest emergency clinic: [name, address, phone].") Document client response verbatim: "Client advised of life-threatening nature, declined emergency clinic." If client insists on waiting: Offer on-call DVM callback for assessment (DVM may provide same ER recommendation with medical authority). If client still refuses: Document informed refusal, provide specific warning signs to monitor ("If gums turn white/blue, breathing becomes labored, or pet collapses, this is life-or-death - call 911 for animal ambulance or go to ER immediately"), schedule first-thing morning recheck (6-7am if possible). Critical: Never diagnose or prescribe treatment over phone for cases requiring hands-on assessment. Liability protection through documentation that client was warned and refused appropriate care. Most clients follow ER recommendation when severity is explained clearly. ~5-8% decline initially but call back within 30-60 minutes when condition worsens.',
    },
    {
      question:
        "What happens if my on-call DVM doesn't respond when the service tries to escalate a critical case?",
      answer:
        'Multi-tiered escalation prevents gaps in coverage: Primary escalation (0-3 minutes): Service calls on-call DVM cell phone. If no answer, sends SMS: "URGENT: Critical case requires immediate callback. Client: [Name], Pet: [Name], Symptoms: [Summary], Client phone: [Number]." Secondary escalation (3-5 minutes): If no DVM response, service calls designated backup DVM (practice owner or secondary on-call). Sends same SMS alert. Final escalation (5+ minutes): If no veterinarian reachable, service directs client to nearest 24-hour emergency clinic with full information, documents attempted DVM contact in call notes for morning review. Best practices to prevent: (1) Require DVMs to acknowledge critical case alerts within 3 minutes (text "RECEIVED"), (2) Always designate backup DVM in on-call schedule, (3) Test DVM contact numbers monthly to ensure phones are charged and reachable, (4) Review any missed escalations at weekly team meetings. Most "unreachable DVM" situations are dead cell phone batteries or incorrect contact numbers - both preventable with basic protocols.',
    },
    {
      question:
        "Can overnight coverage services schedule appointments in my PIMS, or do I need to manually enter them next morning?",
      answer:
        "Modern services integrate directly with PIMS for real-time booking: API integration (recommended): Service connects to Cornerstone, eVetPractice, AVImark, Impromed via API. Books next-morning urgent appointments directly into first available slots (typically 8-9am). Respects provider schedules, blocked time, appointment durations. Automatic client confirmation SMS/email sent immediately. Zero manual entry required. Email summary (fallback): If PIMS lacks API, service emails overnight appointment requests to designated practice address. CSR reviews email first thing in morning (7:30-8am), manually enters into PIMS, confirms with clients. Adds 10-15 minutes of morning admin time. Portal dashboard: Some services provide web portal showing overnight bookings. CSR reviews and imports to PIMS via CSV upload or copy-paste. Better than email, worse than API. Setup timeline: API integration takes 3-5 days (credential configuration, field mapping, testing). Most major PIMS platforms supported. Recommendation: Choose overnight service with native PIMS integration to eliminate morning manual entry burden and ensure clients receive instant confirmation.",
    },
    {
      question:
        "How do I transition from DVMs being on-call directly to using an overnight answering service?",
      answer:
        'Gradual transition reduces resistance and validates service quality: Phase 1 (Weeks 1-2): Soft launch with DVM backup. Service handles all overnight calls, performs triage, but DVMs still receive SMS summary of EVERY call (even non-critical). DVMs can review triage decisions and provide feedback. Phase 2 (Weeks 3-4): Service handles calls independently, only contacts DVMs for Tier 1 (critical) cases as designed. DVMs receive next-morning email summary of all overnight calls for quality review. Phase 3 (Month 2+): Full operational. DVMs only contacted for true emergencies. Weekly review of call logs to ensure appropriate triage. DVM buy-in strategies: (1) Frame as "protection from non-urgent interruptions" not "replacement of clinical judgment," (2) Share sleep quality improvement data after 30 days (most DVMs report better rest), (3) Involve DVMs in triage protocol development (builds ownership and trust), (4) Celebrate successes (e.g., "Service correctly identified early bloat and got client to ER in time - pet survived"). Typical timeline: 30 days to full trust, 60 days for DVMs to prefer service over direct-call model. Initial skepticism is normal and fades with positive results.',
    },
    {
      question:
        "What metrics should I track to measure overnight coverage effectiveness?",
      answer:
        "Comprehensive overnight performance dashboard: Revenue metrics: (1) Emergency stabilizations per month (target: 1-2 from overnight calls), (2) Next-morning urgent appointments booked (target: 3-5/month), (3) Total overnight revenue captured (target: $1,500-$2,000/month). Quality metrics: (1) Triage accuracy - % of DVM escalations that were truly critical (target: >85%), (2) Inappropriate escalations - DVM woken for non-urgent cases (target: <10% of escalations), (3) Missed critical cases - severe presentations not escalated appropriately (target: 0%, review any occurrence immediately). Client experience: (1) Answer speed (target: <2 rings for overnight calls), (2) Client satisfaction - survey next-morning appointment clients about overnight service (target: >80% positive), (3) Client complaints about overnight handling (target: <2% of calls). DVM wellbeing: (1) Overnight interruptions per month (baseline: 8-12 direct calls, target: 2-3 critical escalations), (2) DVM sleep quality self-reported surveys (1-10 scale, target: improve by 2+ points), (3) DVM satisfaction with overnight coverage (quarterly survey). Review monthly in team meetings, quarterly with service provider to optimize triage protocols based on actual performance data.",
    },
  ],
  productTieIn: {
    title: "ODIS AI: Intelligent Overnight Coverage That Protects DVMs",
    description:
      "Direct on-call models burn out veterinarians with 3am medication refill questions. Human answering services cost $450-$800/month. ODIS AI delivers intelligent overnight coverage at a fraction of the cost - shielding DVMs from 70-80% of non-urgent calls while ensuring critical cases reach them within 2 minutes.",
    features: [
      "AAHA-compliant triage protocols built into every overnight conversation",
      "Shields DVMs from 70-80% of overnight calls (non-urgent cases handled autonomously)",
      "Escalates critical cases to on-call DVM via SMS + phone within 2 minutes with symptom summary",
      "Books next-morning urgent appointments automatically in PIMS for moderate cases",
      "Provides emergency clinic information for severe cases requiring immediate 24hr care",
      "Perfect consistency in triage protocol application - no fatigue, distraction, or variability",
      "Full call recording and documentation for quality review and legal protection",
      "$199/month flat rate for unlimited overnight coverage (11pm-6am, 7 nights/week)",
    ],
  },
  relatedResources: [
    "emergency-answering-service",
    "emergency-vet-call-center",
    "24-hour-call-center",
    "telephone-answering-service",
  ],
};
