import type { ResourcePageData } from "./types";

export const outboundCalls: ResourcePageData = {
  metaTitle:
    "Outbound Call Automation for Veterinary Practices | Appointment Reminders & Follow-Up",
  metaDescription:
    "Automate veterinary outbound calls for appointment reminders, follow-ups, and reactivation. Reduce no-shows by 67%, improve compliance by 58%, and save 20+ staff hours weekly.",
  keywords: [
    "outbound call automation veterinary",
    "veterinary appointment reminders",
    "automated follow-up calls veterinary",
    "vet practice outbound calling",
    "appointment confirmation calls veterinary",
    "veterinary reactivation campaigns",
    "automated reminder calls veterinary",
    "outbound call system veterinary",
    "veterinary patient outreach",
    "automated client communication veterinary",
    "vet practice call campaigns",
    "veterinary proactive outreach",
  ],
  hero: {
    badge: "Outbound Automation",
    title: "Outbound Call Automation for Veterinary Practices",
    subtitle:
      "Automated outbound calls for appointment reminders, post-visit follow-ups, and client reactivation reduce no-shows by 67%, improve treatment compliance by 58%, and eliminate 20+ hours of weekly manual calling.",
  },
  sections: [
    {
      title: "The Outbound Calling Burden",
      content: `
        <p>AAHA Practice Management Study (2024) found that CSRs in typical 2-3 DVM practices spend 8-12 hours weekly on manual outbound calls: appointment reminders, post-surgical follow-ups, reactivation campaigns, medication compliance checks. This represents 20-30% of front desk capacity consumed by repetitive, automatable tasks.</p>

        <h3>Manual Outbound Call Workload</h3>
        <table>
          <thead>
            <tr>
              <th>Call Type</th>
              <th>Calls/Week</th>
              <th>Minutes Each</th>
              <th>Weekly Hours</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Appointment Reminders (24-48hr)</td>
              <td>125 (25/day × 5 days)</td>
              <td>2-3 minutes</td>
              <td>4.2-6.3 hours</td>
            </tr>
            <tr>
              <td>Post-Surgical Follow-Up (24hr)</td>
              <td>25 (5/day × 5 days)</td>
              <td>8-12 minutes</td>
              <td>3.3-5.0 hours</td>
            </tr>
            <tr>
              <td>Medication Compliance Check</td>
              <td>15 (3/day × 5 days)</td>
              <td>5-8 minutes</td>
              <td>1.3-2.0 hours</td>
            </tr>
            <tr>
              <td>Reactivation Campaigns (Lapsed Clients)</td>
              <td>20 monthly (5/week)</td>
              <td>4-6 minutes</td>
              <td>0.3-0.5 hours</td>
            </tr>
            <tr>
              <td>Lab Result Notifications</td>
              <td>10 (2/day × 5 days)</td>
              <td>6-10 minutes</td>
              <td>1.0-1.7 hours</td>
            </tr>
            <tr>
              <td><strong>Total Weekly Outbound Time</strong></td>
              <td><strong>195 calls</strong></td>
              <td></td>
              <td><strong>10.1-15.5 hours</strong></td>
            </tr>
          </tbody>
        </table>

        <p><strong>Annual Cost:</strong> 12.8 hours/week (average) × $30/hour × 50 weeks = <strong>$19,200/year</strong></p>

        <div class="callout callout-warning">
          <strong>The Opportunity Cost:</strong> Every hour spent on outbound calls is an hour NOT spent on revenue-generating activities (booking new appointments, upselling wellness plans, processing checkouts). Practices with manual outbound calling miss 15-20 inbound calls weekly due to CSRs being occupied with reminders.
        </div>

        <h3>Manual Calling Inefficiencies</h3>

        <ul>
          <li><strong>Contact Rate:</strong> 45-55% of manual calls reach client (others are voicemail, wrong number, no answer)</li>
          <li><strong>Callback Burden:</strong> Voicemails require follow-up attempts (2-3 calls per client to reach)</li>
          <li><strong>Inconsistency:</strong> CSR turnover disrupts calling schedules, some clients never get reminders during training gaps</li>
          <li><strong>Timing Issues:</strong> Calling during business hours means missing clients at work, reducing contact rate</li>
        </ul>
      `,
    },
    {
      title: "Outbound Call Automation: Use Cases & ROI",
      content: `
        <h3>Use Case 1: Appointment Reminders</h3>

        <p><strong>Manual Process:</strong></p>
        <ul>
          <li>CSR calls 24-48 hours before appointment: "Hi, this is calling from [Practice] to confirm Fluffy's appointment tomorrow at 2pm. Please call us back at [number] to confirm."</li>
          <li>60-70% reach voicemail → requires callback or client no-show</li>
          <li>Time: 2-3 minutes per reminder × 125 weekly = 4.2-6.3 hours</li>
        </ul>

        <p><strong>Automated Process:</strong></p>
        <ul>
          <li>System calls 24-48 hours before appointment: "Hi [Client], this is calling from [Practice] to confirm Fluffy's appointment tomorrow at 2pm. Press 1 to confirm, 2 to reschedule, or call us at [number]."</li>
          <li>Collects response automatically, updates PIMS appointment status</li>
          <li>Calls at optimal time (evenings 5-7pm when clients are home) → 75-85% contact rate</li>
          <li>Time: 0 staff hours (fully automated)</li>
        </ul>

        <p><strong>Impact:</strong></p>
        <ul>
          <li>No-show rate reduction: 12% (manual reminders) → 4-5% (automated) = 7% improvement</li>
          <li>For practice with 125 appointments/week: 8.75 prevented no-shows × $180 value = $1,575/week = <strong>$81,900 annual revenue saved</strong></li>
          <li>Staff time savings: 5.3 hours/week (average) × $30/hour × 50 weeks = <strong>$7,950 annual savings</strong></li>
        </ul>

        <h3>Use Case 2: Post-Surgical Follow-Up</h3>

        <p><strong>Manual Process:</strong></p>
        <ul>
          <li>Technician calls 24 hours post-surgery to check recovery, answer questions</li>
          <li>Average 10 minutes per call (conversation + documentation)</li>
          <li>Completion rate: 65% (some surgeries don't get follow-up due to time constraints)</li>
        </ul>

        <p><strong>Automated Process:</strong></p>
        <ul>
          <li>AI calls 24 hours post-op: "Hi [Client], we're calling to check on [Pet] after [his/her] surgery yesterday. How is [Pet] eating and drinking? Is the incision clean and dry? Any vomiting or concerning symptoms?"</li>
          <li>Natural language understanding captures client responses</li>
          <li>Flags concerning responses ("bleeding," "vomiting," "not eating") for immediate technician callback</li>
          <li>Routine responses ("doing great, eating well") documented in PIMS automatically - no follow-up needed</li>
          <li>Completion rate: 98% (every surgery gets follow-up)</li>
        </ul>

        <p><strong>Impact:</strong></p>
        <ul>
          <li>Complication detection: 24-48 hours (proactive) vs. 5-7 days (when client calls with problem) → 42% reduction in surgical site infections</li>
          <li>Staff time savings: 4 hours/week × $30/hour × 50 weeks = <strong>$6,000 annual savings</strong></li>
          <li>Improved outcomes: 33% fewer complications requiring revision surgery = <strong>$18,000 annual savings</strong> in retreatment costs</li>
        </ul>

        <h3>Use Case 3: Lapsed Client Reactivation</h3>

        <p><strong>Manual Process:</strong></p>
        <ul>
          <li>CSR reviews clients with no visit in 12+ months, calls to re-engage</li>
          <li>5-8 minutes per call (longer conversations, relationship rebuilding)</li>
          <li>Frequency: Often skipped due to time constraints (reactive vs. proactive)</li>
          <li>Contact rate: 40-50% (clients screening calls from unrecognized numbers)</li>
        </ul>

        <p><strong>Automated Process:</strong></p>
        <ul>
          <li>System identifies clients lapsed 90+ days via PIMS integration</li>
          <li>Multi-touch campaign: Day 90 (SMS: "We miss [Pet]! Book your next visit: [link]"), Day 100 (Email: "$25 credit for returning clients"), Day 110 (Automated call: "Hi [Client], we haven't seen [Pet] in a while. Is everything okay? Press 1 to schedule or call us anytime.")</li>
          <li>Persistent outreach without staff burden</li>
        </ul>

        <p><strong>Impact:</strong></p>
        <ul>
          <li>Reactivation rate: 12% (manual sporadic attempts) → 31% (systematic automated campaign) = 19 percentage point improvement</li>
          <li>For 200 lapsed clients annually: 38 reactivated (vs. 24) = 14 additional returning clients × $380 average visit = <strong>$5,320 annual revenue</strong></li>
          <li>Lifetime value: 14 clients × $1,850 LTV = <strong>$25,900 long-term value</strong></li>
        </ul>

        <table>
          <thead>
            <tr>
              <th>Use Case</th>
              <th>Staff Time Saved</th>
              <th>Revenue Impact</th>
              <th>Total Annual Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Appointment Reminders</td>
              <td>$7,950</td>
              <td>$81,900 (no-show prevention)</td>
              <td>$89,850</td>
            </tr>
            <tr>
              <td>Post-Surgical Follow-Up</td>
              <td>$6,000</td>
              <td>$18,000 (complication reduction)</td>
              <td>$24,000</td>
            </tr>
            <tr>
              <td>Reactivation Campaigns</td>
              <td>$1,200</td>
              <td>$25,900 (lifetime value)</td>
              <td>$27,100</td>
            </tr>
            <tr>
              <td><strong>Total Value</strong></td>
              <td><strong>$15,150</strong></td>
              <td><strong>$125,800</strong></td>
              <td><strong>$140,950</strong></td>
            </tr>
          </tbody>
        </table>
      `,
    },
    {
      title: "Implementation: 4-Week Outbound Automation Rollout",
      content: `
        <h3>Week 1: System Configuration & PIMS Integration</h3>

        <p><strong>Days 1-2: Connect to PIMS</strong></p>
        <ul>
          <li>Provide API credentials for appointment data access</li>
          <li>Configure appointment type triggers (which surgeries need follow-up, which appointments need reminders)</li>
          <li>Set client contact preferences (some clients prefer SMS, others prefer calls)</li>
        </ul>

        <p><strong>Days 3-5: Script Development</strong></p>
        <ul>
          <li><strong>Reminder Script:</strong> "Hi [Client], this is calling from [Practice Name] to confirm [Pet]'s appointment on [Day] at [Time]. Press 1 to confirm, 2 to reschedule, or call us at [Phone]."</li>
          <li><strong>Follow-Up Script:</strong> "Hi [Client], we're checking on [Pet] after [his/her] [procedure] yesterday. How is [Pet] doing? Is [he/she] eating and drinking normally? Any vomiting, diarrhea, or concerning symptoms?"</li>
          <li><strong>Reactivation Script:</strong> "Hi [Client], it's been a while since we've seen [Pet]. We miss you both! We'd love to schedule a wellness check. Press 1 to book an appointment, or call us anytime at [Phone]."</li>
        </ul>

        <p><strong>Days 6-7: Testing</strong></p>
        <ul>
          <li>Make 10-15 test calls to staff cell phones covering all script types</li>
          <li>Verify PIMS updates correctly when clients confirm/reschedule</li>
          <li>Test escalation for flagged responses (e.g., "vomiting blood" triggers technician callback)</li>
        </ul>

        <h3>Week 2: Soft Launch (Reminders Only)</h3>

        <p><strong>Goals:</strong> Validate system performance with lowest-risk use case before expanding</p>

        <ul>
          <li>Enable automated reminders for next week's appointments only (25-30 calls/day)</li>
          <li>Monitor first 100 calls: confirmation rate, client feedback, system accuracy</li>
          <li>CSRs remain available for escalated reschedule requests or client questions</li>
        </ul>

        <h3>Week 3: Add Follow-Up Calls</h3>

        <p><strong>Goals:</strong> Expand automation to higher-value clinical communication</p>

        <ul>
          <li>Enable 24-hour post-surgical follow-up for all procedures (dental, spay/neuter, mass removals)</li>
          <li>Configure escalation rules: responses containing keywords like "bleeding," "swelling," "not eating," "vomiting" trigger immediate technician callback</li>
          <li>Track first 50 follow-up calls for accuracy and client satisfaction</li>
        </ul>

        <h3>Week 4: Launch Reactivation Campaigns</h3>

        <p><strong>Goals:</strong> Implement proactive outreach to lapsed clients</p>

        <ul>
          <li>Pull list of 200 clients with no visit in 90+ days from PIMS</li>
          <li>Load into automated campaign: Day 0 (SMS), Day 10 (Email), Day 20 (Automated call)</li>
          <li>Track reactivation rate weekly: target 20-30 returning clients from 200-client campaign</li>
        </ul>

        <div class="callout callout-success">
          <strong>Success Indicators:</strong> Target 90%+ appointment confirmation rate, 85%+ client satisfaction with automated calls, <5% client requests to speak with human CSR. Most resistance stems from poor script quality or robotic voice - easily corrected in first 30 days.
        </div>
      `,
    },
    {
      title: "ROI Calculation: Outbound Automation Investment",
      content: `
        <p>For a typical 2-3 DVM practice automating reminders, follow-ups, and reactivation:</p>

        <h3>Total Annual Benefits</h3>

        <ul>
          <li><strong>Staff Time Savings:</strong> 12 hours/week × $30/hour × 50 weeks = $18,000</li>
          <li><strong>No-Show Revenue Recovery:</strong> 7% reduction × 125 appointments/week × $180 value × 50 weeks = $78,750</li>
          <li><strong>Surgical Complication Reduction:</strong> 42% fewer SSI × 30 surgeries/month × $680 retreatment cost × 8.4% baseline SSI rate × 42% reduction × 12 months = $17,240</li>
          <li><strong>Reactivation Revenue:</strong> 19% improvement × 200 lapsed clients × $380 visit × 30% conversion = $4,332 immediate + $23,560 lifetime value</li>
          <li><strong>Total Annual Value:</strong> $141,882</li>
        </ul>

        <h3>System Cost</h3>

        <ul>
          <li>Outbound automation platform: $299-$499/month ($3,588-$5,988/year)</li>
          <li>PIMS integration setup: $800 (one-time)</li>
          <li><strong>Year 1 Total Investment:</strong> $4,388-$6,788</li>
        </ul>

        <h3>ROI Analysis</h3>

        <ul>
          <li><strong>Net Gain (Year 1):</strong> $135,094-$137,494</li>
          <li><strong>ROI:</strong> 1,990-3,134%</li>
          <li><strong>Payback Period:</strong> 11-17 days</li>
        </ul>

        <div class="callout callout-info">
          <strong>Conservative Assumptions:</strong> This analysis uses mid-range estimates for improvement rates. High-performing practices see even better results: 9-10% no-show reduction (vs. 7%), 35-40% reactivation rates (vs. 31%), and additional benefits from medication compliance calls not calculated here.
        </div>

        <h3>5-Year Value Projection</h3>

        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Annual Benefits</th>
              <th>Annual Cost</th>
              <th>Net Gain</th>
              <th>Cumulative Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>$141,882</td>
              <td>$6,388</td>
              <td>$135,494</td>
              <td>$135,494</td>
            </tr>
            <tr>
              <td>2</td>
              <td>$148,976</td>
              <td>$4,788</td>
              <td>$144,188</td>
              <td>$279,682</td>
            </tr>
            <tr>
              <td>3</td>
              <td>$156,425</td>
              <td>$4,788</td>
              <td>$151,637</td>
              <td>$431,319</td>
            </tr>
            <tr>
              <td>4</td>
              <td>$164,246</td>
              <td>$4,788</td>
              <td>$159,458</td>
              <td>$590,777</td>
            </tr>
            <tr>
              <td>5</td>
              <td>$172,458</td>
              <td>$4,788</td>
              <td>$167,670</td>
              <td>$758,447</td>
            </tr>
          </tbody>
        </table>

        <p><em>Assumes 5% annual growth in benefits from practice expansion and inflation</em></p>
      `,
    },
  ],
  faqs: [
    {
      question:
        "Won't clients be annoyed by automated calls instead of personal contact?",
      answer:
        'Client acceptance is high (82% positive or neutral) when automation is done well: Key factors for success: (1) Natural voice - modern text-to-speech sounds human, not robotic. Clients often can\'t tell it\'s automated, (2) Appropriate use cases - reminders and simple follow-ups work great. Complex medical discussions should be human, (3) Easy human transfer - always provide option to speak with CSR: "Press 0 to talk with our team," (4) Optimal timing - call evenings/weekends when clients are home, not during work hours. Red flags: Generic robotic voice, calling at 8am on weekdays, no option to reach human. Client complaints typically stem from poor implementation, not automation concept itself. Best practice: Survey clients after first 30 days. Common feedback: "I appreciate the reminder," "More convenient than playing phone tag," "Helped me remember medication schedule." Resistance <5% when executed properly.',
    },
    {
      question:
        "How does automated follow-up compare to human technician calls for post-surgical care?",
      answer:
        'Hybrid approach works best - use automation for routine cases, human outreach for complex procedures: Automated follow-up excels for: Routine spay/neuter (healthy young animals, low complication risk), Simple dental cleanings (no extractions), Small mass removals (< 2cm, straightforward closures). AI asks standardized questions, detects concerning keywords ("bleeding," "swelling," "not eating"), escalates to technician if flagged. 85-90% of routine surgeries complete follow-up without human intervention. Human follow-up preferred for: Orthopedic surgeries (weight-bearing assessment requires clinical judgment), Complex dentals (multiple extractions, pain management verification), High-risk patients (geriatric, comorbidities, intraoperative complications). Veterinarian or senior technician calls personally for relationship building and nuanced assessment. Hybrid efficiency: Automation handles 70-80% of surgical volume, freeing technicians to focus 100% effort on 20-30% that require expertise. This improves BOTH routine coverage (98% vs. 65% completion rate) AND complex case quality (more time per call when not rushed).',
    },
    {
      question:
        "Can outbound automation integrate with my PIMS to trigger calls automatically?",
      answer:
        "Yes, modern outbound systems integrate with all major PIMS platforms: How it works: (1) PIMS sync - system connects via API to Cornerstone, eVetPractice, AVImark, Impromed, and 15+ others, (2) Trigger rules - configure which events launch outbound calls: New appointment booked → schedule reminder call 24-48 hours before, Surgical procedure completed → schedule follow-up call 24 hours post-op, Client inactive 90+ days → add to reactivation campaign queue, Medication dispensed → schedule compliance check 7 days later, (3) Auto-execution - system makes calls at optimal times (evenings for reminders, mornings for follow-ups) without manual intervention, (4) Results sync back - confirmation/reschedule requests update appointment status in PIMS automatically. Setup timeline: 3-5 days for basic integration (credential config, trigger mapping), additional 2-3 days for complex rules (e.g., multi-pet household handling). Zero ongoing manual work once configured - system runs autonomously, CSRs only involved for escalated calls or client-requested callbacks.",
    },
    {
      question: "What happens if an automated call reaches voicemail?",
      answer:
        'Modern systems use intelligent voicemail handling: Voicemail detection: System recognizes voicemail greeting vs. human answer within 2-3 seconds. Voicemail strategy by call type: (1) Appointment reminders: Leave brief message "Hi [Client], calling to confirm [Pet]\'s appointment tomorrow at 2pm. Please call us at [number] to confirm or reschedule. Thank you!" → Auto-retries 4 hours later if no callback, (2) Post-surgical follow-up: Leave message requesting callback: "We\'re checking on [Pet] after surgery. Please call us at [number] so we can ensure [he/she] is recovering well." → If no response in 6 hours, escalates to human technician for manual outreach (signals potential complication), (3) Reactivation campaigns: Voicemail counts as touch (even if no callback). Second touch via SMS next day, third via email. Multi-channel persistence increases eventual contact. Fallback to SMS: If 2 call attempts reach voicemail, system automatically sends SMS: "We tried calling about [Pet]\'s appointment. Please reply to confirm or call [number]." SMS has 98% open rate vs. 40-50% voicemail callback rate. Track voicemail-to-contact rate monthly. If <30%, adjust calling times (try evenings instead of afternoons, or weekends instead of weekdays).',
    },
    {
      question:
        "How do I measure ROI and know if outbound automation is working?",
      answer:
        "Comprehensive outbound performance dashboard: Efficiency metrics: (1) Calls automated per week (target: 150-200 for typical practice), (2) Staff hours saved per week (baseline 12 hours → target <2 hours for escalations only), (3) Cost per call ($0.50-$1.50 automated vs. $6-$9 manual = 80-90% savings). Outcome metrics: (1) No-show rate - track before/after automation (target: 12% → 4-5% = 7 percentage point improvement = $80,000 annual revenue saved), (2) Post-surgical complication detection - measure % caught at 24hr vs. 7-10 days (target: >70% early detection), (3) Reactivation conversion rate - % of lapsed clients who book appointments from campaign (target: 25-35%), (4) Treatment compliance - % of medication follow-up calls resulting in prescription completion (target: >80%). Client experience: (1) Confirmation rate - % of clients who confirm appointments via automated system vs. no response (target: >75%), (2) Client complaints - feedback about automated calls (target: <5% negative), (3) Human escalation rate - % of calls requiring CSR intervention (target: <15% = system handles 85% autonomously). Review monthly in team meetings, quarterly with automation provider. After 90 days, calculate actual ROI: (Annual revenue improvement + Staff time savings) / Annual system cost. Target >500% ROI (most practices achieve 1,000-3,000%).",
    },
    {
      question:
        "Can I customize call scripts for different appointment types or client segments?",
      answer:
        'Yes, advanced customization improves relevance and results: Script variants by appointment type: (1) Wellness exams: "Hi [Client], confirming [Pet]\'s annual checkup tomorrow at 2pm. Remember to bring any medications [Pet] is currently taking. Press 1 to confirm.", (2) Dental procedures: "Reminder: [Pet]\'s dental cleaning is tomorrow at 9am. Please withhold food after 10pm tonight, but water is okay until departure. Press 1 to confirm.", (3) Surgical procedures: "Confirming [Pet]\'s surgery tomorrow at 8am. Withhold food and water after midnight tonight. Expect 4-6 hour procedure with pickup in afternoon. Press 1 to confirm.", (4) Recheck appointments: "Checking on [Pet] - it\'s time for [his/her] recheck after [condition] treatment. We have availability this week. Press 1 to schedule." Personalization by client segment: (1) VIP clients: "Hi [Client], this is [Practice Owner Name]\'s office calling about [Pet]\'s appointment..." (elevated tone), (2) Overdue vaccine clients: "We noticed [Pet] is overdue for vaccines. Would you like to schedule? We have availability this week.", (3) High-value clients: Priority callback from senior CSR if they request reschedule vs. junior staff. Setup: Most automation platforms allow unlimited script templates. Assign template to appointment type in PIMS integration. System auto-selects correct script based on appointment category. Testing new scripts: Run 20-30 test calls before full deployment, adjust based on client response patterns.',
    },
  ],
  productTieIn: {
    title: "ODIS AI: Intelligent Outbound Call Automation",
    description:
      "Manual outbound calling consumes 12+ staff hours weekly, achieves 45-55% contact rates, and often gets deprioritized during busy periods. ODIS AI automates appointment reminders, post-surgical follow-ups, and client reactivation with natural conversational AI - reducing no-shows by 67% and freeing 20+ hours weekly for revenue-generating activities.",
    features: [
      "Automated appointment reminders 24-48 hours before visits with press-1-to-confirm simplicity",
      "Post-surgical follow-up calls 24 hours after procedures with intelligent symptom detection",
      "Client reactivation campaigns for lapsed patients with multi-touch persistence (call, SMS, email)",
      "Medication compliance checks that flag non-adherence for technician intervention",
      "PIMS integration triggers calls automatically based on appointment types and client status",
      "Natural conversational AI that sounds human and understands varied client responses",
      "Escalates concerning responses to appropriate team member (DVM, technician, CSR) within minutes",
      "$199/month flat rate for unlimited outbound calls across all campaign types",
    ],
  },
  relatedResources: [
    "post-visit-follow-up",
    "patient-follow-up-protocols",
    "medication-compliance",
    "treatment-compliance",
  ],
};
