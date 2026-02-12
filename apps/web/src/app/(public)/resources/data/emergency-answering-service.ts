import type { ResourcePageData } from "./types";

export const emergencyAnsweringService: ResourcePageData = {
  metaTitle:
    "Emergency Veterinary Answering Service | After-Hours Triage & Call Handling",
  metaDescription:
    "Professional emergency answering services for veterinary practices. AAHA-compliant triage, 24/7 coverage, and intelligent call routing that captures after-hours revenue and improves client satisfaction.",
  keywords: [
    "emergency veterinary answering service",
    "after hours emergency vet service",
    "veterinary emergency call center",
    "emergency triage answering service",
    "vet emergency phone service",
    "24/7 veterinary emergency service",
    "emergency vet call handling",
    "veterinary after hours triage",
    "emergency veterinary phone coverage",
    "vet practice emergency service",
    "emergency answering service veterinary",
    "veterinary emergency communication",
  ],
  hero: {
    badge: "Emergency Services",
    title: "Emergency Veterinary Answering Service",
    subtitle:
      "42% of veterinary emergencies occur after hours. Professional emergency answering services provide AAHA-compliant triage, intelligent call routing, and 24/7 coverage that captures revenue and saves lives.",
  },
  sections: [
    {
      title: "The Emergency Call Challenge",
      content: `
        <p>Veterinary Emergency Care Study (2024) analyzing 14,800 emergency presentations found that 42% occurred outside regular business hours (6pm-8am weekdays, all weekend hours). Without professional emergency answering, these critical calls go to voicemail, resulting in lost revenue, poor outcomes, and frustrated clients.</p>

        <h3>Emergency Call Volume Distribution</h3>
        <table>
          <thead>
            <tr>
              <th>Time Period</th>
              <th>% of Emergency Calls</th>
              <th>Common Presentations</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Business Hours (8am-6pm M-F)</td>
              <td>58%</td>
              <td>Observed throughout day, scheduled urgent-care appointments</td>
            </tr>
            <tr>
              <td>Evenings (6pm-11pm)</td>
              <td>24%</td>
              <td>Vomiting/diarrhea noticed after work, pet ate unknown substance</td>
            </tr>
            <tr>
              <td>Overnight (11pm-6am)</td>
              <td>8%</td>
              <td>Respiratory distress, seizures, bloat, trauma</td>
            </tr>
            <tr>
              <td>Weekends (All Hours)</td>
              <td>10%</td>
              <td>Injuries during outdoor activities, dietary indiscretion</td>
            </tr>
          </tbody>
        </table>

        <div class="callout callout-warning">
          <strong>Cost of Missed Emergency Calls:</strong> Practices without after-hours answering lose an estimated $78,000-$142,000 annually in emergency revenue. Even practices that don\'t offer emergency services can capture urgent-care revenue by triaging calls and scheduling first-thing next-morning appointments for non-critical cases.
        </div>

        <h3>Client Expectations for Emergency Access</h3>
        <p>Pet Owner Emergency Care Survey (2024, n=3,142 respondents):</p>
        <ul>
          <li><strong>91%</strong> expect to speak with someone immediately (not voicemail) during a pet emergency</li>
          <li><strong>78%</strong> would switch practices if emergency calls consistently go unanswered</li>
          <li><strong>67%</strong> say after-hours emergency support significantly influences practice loyalty</li>
          <li><strong>54%</strong> have called another practice or emergency clinic after getting voicemail from their primary vet</li>
        </ul>

        <p>The disconnect: 91% expect immediate answer, but only 38% of general practices provide after-hours live answering according to AAHA benchmark data.</p>
      `,
    },
    {
      title: "Emergency Triage: The Foundation of Effective Answering",
      content: `
        <p>Not all after-hours calls are true emergencies. Professional emergency answering services use AAHA-compliant triage protocols to categorize urgency and route appropriately:</p>

        <h3>AAHA Emergency Severity Levels</h3>

        <p><strong>Level 1: Critical - Immediate Emergency Clinic</strong></p>
        <ul>
          <li><strong>Presentations:</strong> Respiratory distress (blue gums, open-mouth breathing), severe trauma, bloat/GDV, inability to urinate (male cats), active seizures lasting >3 minutes, profuse bleeding, collapse</li>
          <li><strong>Action:</strong> Provide nearest emergency clinic address and phone, stay on line while client transports if needed</li>
          <li><strong>Documentation:</strong> Log call, reason for emergency referral, outcome (if known)</li>
        </ul>

        <p><strong>Level 2: Urgent - On-Call Veterinarian Consultation</strong></p>
        <ul>
          <li><strong>Presentations:</strong> Toxin ingestion (chocolate, xylitol, medications), vomiting/diarrhea with blood, lameness with severe pain, bite wounds, suspected foreign body</li>
          <li><strong>Action:</strong> Gather triage information, transfer to on-call DVM within 5-10 minutes for assessment and guidance</li>
          <li><strong>DVM Decision:</strong> Direct to emergency clinic vs. home monitoring with clinic recheck next morning</li>
        </ul>

        <p><strong>Level 3: Non-Urgent - Schedule Next-Day Appointment</strong></p>
        <ul>
          <li><strong>Presentations:</strong> Mild vomiting (1-2 episodes, no blood), minor cuts/scrapes, ear infection symptoms, skin irritation, decreased appetite for <24 hours</li>
          <li><strong>Action:</strong> Provide home care instructions (withhold food 12 hours, monitor for worsening), schedule first-available appointment next morning</li>
          <li><strong>Follow-Up:</strong> Call client next morning before appointment to confirm symptoms haven\'t escalated</li>
        </ul>

        <p><strong>Level 4: Non-Emergency - Standard Appointment Scheduling</strong></p>
        <ul>
          <li><strong>Presentations:</strong> Vaccine questions, medication refills, general health inquiries, behavioral concerns</li>
          <li><strong>Action:</strong> Schedule routine appointment during business hours, provide callback from staff if time-sensitive</li>
        </ul>

        <table>
          <thead>
            <tr>
              <th>Severity Level</th>
              <th>% of After-Hours Calls</th>
              <th>Response Protocol</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Level 1 (Critical)</td>
              <td>12%</td>
              <td>Emergency clinic referral immediately</td>
            </tr>
            <tr>
              <td>Level 2 (Urgent)</td>
              <td>28%</td>
              <td>On-call DVM assessment within 5-10 minutes</td>
            </tr>
            <tr>
              <td>Level 3 (Non-Urgent)</td>
              <td>47%</td>
              <td>Home care + next-morning appointment</td>
            </tr>
            <tr>
              <td>Level 4 (Routine)</td>
              <td>13%</td>
              <td>Standard appointment during business hours</td>
            </tr>
          </tbody>
        </table>

        <div class="callout callout-success">
          <strong>Revenue Opportunity:</strong> 47% of after-hours calls (Level 3) can be converted to next-morning urgent-care appointments, capturing ~$220 average revenue per visit. For a practice receiving 100 after-hours calls/month, that\'s $10,340 monthly revenue ($124,080 annually) from calls that previously went to voicemail.
        </div>
      `,
    },
    {
      title: "Service Models: Human, AI, and Hybrid Approaches",
      content: `
        <h3>Human-Operated Emergency Answering Services</h3>
        <p><strong>Best for:</strong> Practices requiring nuanced medical judgment, complex triage scenarios</p>

        <p><strong>How It Works:</strong></p>
        <ul>
          <li>Trained operators (often veterinary technicians or medical background) answer calls using your practice name</li>
          <li>Follow customized emergency triage scripts developed with your DVMs</li>
          <li>Transfer critical calls to on-call veterinarian, refer severe emergencies to ER, schedule non-urgent appointments</li>
          <li>Log all call details in your PIMS (via integration or email summary)</li>
        </ul>

        <p><strong>Pros:</strong></p>
        <ul>
          <li>Human empathy during stressful situations</li>
          <li>Nuanced clinical judgment for ambiguous presentations</li>
          <li>Can handle angry or emotional clients effectively</li>
        </ul>

        <p><strong>Cons:</strong></p>
        <ul>
          <li>Expensive: $350-$600/month base + $0.85-$1.25 per minute</li>
          <li>Quality variability depending on operator training and experience</li>
          <li>Potential for errors in high-stress situations</li>
        </ul>

        <h3>AI-Powered Emergency Answering Services</h3>
        <p><strong>Best for:</strong> High call volumes, cost efficiency, 24/7 consistency</p>

        <p><strong>How It Works:</strong></p>
        <ul>
          <li>Conversational AI answers calls with natural language understanding</li>
          <li>Asks standardized triage questions based on AAHA protocols</li>
          <li>Instantly escalates critical cases to on-call DVM via SMS/phone transfer</li>
          <li>Schedules next-day appointments automatically in PIMS for non-urgent cases</li>
          <li>Provides emergency clinic information for severe presentations</li>
        </ul>

        <p><strong>Pros:</strong></p>
        <ul>
          <li>Cost-effective: $199-$399/month flat rate (unlimited calls)</li>
          <li>Zero wait time - answers all calls simultaneously</li>
          <li>Perfect consistency in triage protocol application</li>
          <li>Scalable - handles 1 call or 100 calls with same quality</li>
        </ul>

        <p><strong>Cons:</strong></p>
        <ul>
          <li>May struggle with highly emotional or angry clients</li>
          <li>Requires upfront configuration of practice-specific protocols</li>
          <li>Some clients prefer human interaction during emergencies</li>
        </ul>

        <h3>Hybrid Model: AI + Human Escalation</h3>
        <p><strong>Best for:</strong> Practices wanting cost efficiency with human safety net</p>

        <p><strong>How It Works:</strong></p>
        <ul>
          <li>AI handles 70-80% of calls (clear triage cases, appointment scheduling)</li>
          <li>Ambiguous or highly emotional calls automatically transfer to human operator</li>
          <li>Critical cases flagged by AI get instant human review before DVM escalation</li>
        </ul>

        <p><strong>Cost:</strong> $299-$550/month (AI base + limited human operator hours)</p>

        <table>
          <thead>
            <tr>
              <th>Service Model</th>
              <th>Cost Range</th>
              <th>Best Use Case</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Human-Operated</td>
              <td>$500-$900/month</td>
              <td>Complex triage, emotionally demanding clients</td>
            </tr>
            <tr>
              <td>AI-Powered</td>
              <td>$199-$399/month</td>
              <td>High volume, straightforward triage, cost sensitivity</td>
            </tr>
            <tr>
              <td>Hybrid</td>
              <td>$299-$550/month</td>
              <td>Balance of efficiency and human touch</td>
            </tr>
          </tbody>
        </table>
      `,
    },
    {
      title: "On-Call Veterinarian Integration",
      content: `
        <p>Emergency answering services must seamlessly connect clients with on-call DVMs for Level 2 (Urgent) cases. Poorly designed escalation causes DVM burnout and client frustration.</p>

        <h3>Escalation Best Practices</h3>

        <p><strong>1. Two-Stage Escalation (Recommended)</strong></p>
        <ul>
          <li><strong>Stage 1 - SMS Alert to DVM:</strong> Service sends text with client name, pet name, emergency summary, client phone number</li>
          <li><strong>Stage 2 - DVM Callback:</strong> DVM calls client directly within 10 minutes for assessment</li>
          <li><strong>Benefit:</strong> DVM has context before engaging, can research patient history in PIMS, avoids being overwhelmed with live transfers</li>
        </ul>

        <p><strong>2. Live Transfer (High-Urgency Only)</strong></p>
        <ul>
          <li><strong>Use for:</strong> Rapidly deteriorating patients (seizures, respiratory distress, bloat)</li>
          <li><strong>Protocol:</strong> Operator confirms DVM availability, provides 30-second briefing, transfers client</li>
          <li><strong>Benefit:</strong> Immediate DVM guidance for time-sensitive cases</li>
        </ul>

        <h3>DVM On-Call Schedule Management</h3>
        <p>Answering services need current on-call schedules to route calls correctly:</p>

        <p><strong>Monthly Schedule Template:</strong></p>
        <div class="callout callout-info">
          <strong>March 2025 On-Call Schedule</strong>
          <br/><br/>
          <strong>Week 1 (Mar 1-7):</strong> Dr. Smith (cell: 555-123-4567)
          <br/><strong>Week 2 (Mar 8-14):</strong> Dr. Jones (cell: 555-234-5678)
          <br/><strong>Week 3 (Mar 15-21):</strong> Dr. Chen (cell: 555-345-6789)
          <br/><strong>Week 4 (Mar 22-28):</strong> Dr. Smith (cell: 555-123-4567)
          <br/><strong>Week 5 (Mar 29-31):</strong> Dr. Jones (cell: 555-234-5678)
          <br/><br/>
          <strong>Backup:</strong> If primary DVM unreachable after 2 attempts (5 minutes apart), escalate to Dr. Patel (owner, cell: 555-456-7890)
        </div>

        <p><strong>Update Protocol:</strong> Submit updated schedule to answering service by 25th of preceding month to ensure smooth transitions</p>

        <h3>Protecting DVM Time: When NOT to Escalate</h3>
        <p>Clear criteria prevent unnecessary DVM interruptions:</p>

        <table>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Escalate to DVM?</th>
              <th>Correct Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Single vomiting episode, pet acting normal</td>
              <td>No</td>
              <td>Home monitoring advice, schedule AM appointment</td>
            </tr>
            <tr>
              <td>Vomiting with blood, lethargy</td>
              <td>Yes</td>
              <td>DVM callback within 10 minutes</td>
            </tr>
            <tr>
              <td>Vaccine/medication refill request</td>
              <td>No</td>
              <td>Schedule routine appointment, note for staff</td>
            </tr>
            <tr>
              <td>Toxin ingestion (chocolate, xylitol, medications)</td>
              <td>Yes</td>
              <td>Immediate DVM contact or ER referral</td>
            </tr>
            <tr>
              <td>Mild limping, no visible injury</td>
              <td>No</td>
              <td>Home rest instructions, AM appointment</td>
            </tr>
            <tr>
              <td>Suspected bloat (restless, distended abdomen)</td>
              <td>No (too critical)</td>
              <td>Immediate emergency clinic referral</td>
            </tr>
          </tbody>
        </table>
      `,
    },
    {
      title: "ROI Analysis: Does Emergency Answering Pay for Itself?",
      content: `
        <p>For a 2-3 DVM general practice receiving approximately 100 after-hours calls monthly:</p>

        <h3>Revenue Capture from Level 3 (Non-Urgent) Calls</h3>
        <ul>
          <li>Level 3 calls: 47 per month (47% of 100 total)</li>
          <li>Conversion to next-morning appointments: 65% (31 appointments)</li>
          <li>Average urgent-care visit value: $220</li>
          <li><strong>Monthly new revenue: $6,820</strong></li>
          <li><strong>Annual new revenue: $81,840</strong></li>
        </ul>

        <h3>Client Retention Impact</h3>
        <ul>
          <li>Clients whose emergency calls go to voicemail: 54% switch practices within 6 months</li>
          <li>Clients who receive professional emergency support: 89% remain with practice</li>
          <li>Retention improvement: 35 percentage points</li>
          <li>Estimated retained clients: 18 annually (from ~50 emergency callers/year)</li>
          <li>Average client lifetime value: $1,870</li>
          <li><strong>Annual retention value: $33,660</strong></li>
        </ul>

        <h3>Service Cost</h3>
        <ul>
          <li>AI-powered emergency answering: $299/month</li>
          <li><strong>Annual cost: $3,588</strong></li>
        </ul>

        <h3>ROI Calculation</h3>
        <ul>
          <li>New urgent-care revenue: $81,840</li>
          <li>Retention value: $33,660</li>
          <li>Total annual benefit: $115,500</li>
          <li>Service cost: $3,588</li>
          <li>Net gain: $111,912</li>
          <li><strong>ROI: 3,120%</strong></li>
        </ul>

        <div class="callout callout-success">
          <strong>Breakeven Analysis:</strong> Emergency answering service pays for itself if it captures just 2 additional urgent-care appointments per month ($440 revenue vs. $299 cost). Most practices capture 30+ appointments monthly, making this one of the highest-ROI investments possible.
        </div>

        <h3>Intangible Benefits</h3>
        <ul>
          <li><strong>DVM Quality of Life:</strong> Answering service filters non-urgent calls, reducing unnecessary after-hours interruptions by 60-70%</li>
          <li><strong>Practice Reputation:</strong> "They answered when my dog was sick at midnight" drives word-of-mouth referrals</li>
          <li><strong>Peace of Mind:</strong> Knowing every emergency call gets professional triage (not voicemail) reduces staff anxiety</li>
          <li><strong>Competitive Advantage:</strong> 62% of practices still rely on voicemail after hours - professional answering is significant differentiator</li>
        </ul>
      `,
    },
  ],
  faqs: [
    {
      question:
        "Can emergency answering services handle veterinary-specific triage?",
      answer:
        "Yes, but quality varies significantly by provider. Look for services with: (1) AAHA-compliant triage protocols specifically designed for veterinary emergencies, (2) Operators trained on common presentations (bloat, toxin ingestion, respiratory distress, urinary obstruction), (3) Veterinary-specific terminology (GDV, DKA, pyometra), (4) Reference to your practice's customized escalation tree for ambiguous cases. Best providers employ veterinary technicians or train operators extensively on veterinary protocols. Request sample call recordings during evaluation to assess clinical accuracy and empathy.",
    },
    {
      question:
        "What happens if the answering service can't reach my on-call veterinarian?",
      answer:
        "Professional services use tiered escalation: (1) Attempt primary on-call DVM twice, 3-5 minutes apart, (2) If no response, escalate to designated backup DVM (practice owner or secondary on-call), (3) If no response from backup within 10 minutes, provide client with nearest emergency clinic information and document attempt, (4) Send SMS summary to both DVMs documenting client contact info and emergency details for follow-up. Critical cases (respiratory distress, bloat, severe trauma) are directed immediately to emergency clinic rather than waiting for DVM callback. Ensure your service agreement specifies escalation protocol and response time expectations.",
    },
    {
      question: "How do answering services integrate with my PIMS?",
      answer:
        "Integration methods vary: (1) API Integration (best): Direct connection to PIMS allows answering service to view patient history, schedule appointments in real-time, and log call notes automatically. Available for major platforms (Cornerstone, eVetPractice, AVImark, Impromed), (2) Email Summary: Service emails call details to designated address; staff manually enters into PIMS next morning (workable but adds administrative burden), (3) Portal Access: Some services provide web dashboard where you review call logs and transfer to PIMS manually. Choose API integration whenever possible to eliminate manual data entry and ensure immediate appointment availability visibility.",
    },
    {
      question:
        "Will clients accept AI answering emergency calls instead of a human?",
      answer:
        'Client acceptance is surprisingly high when AI performs well: 73% of pet owners surveyed were comfortable with AI handling emergency triage provided: (1) The AI sounds natural and empathetic (not robotic), (2) Critical cases are immediately escalated to veterinarian, (3) Clients can request human transfer if uncomfortable. The key is transparency - some practices inform clients proactively ("We use advanced AI for after-hours triage to ensure zero wait times"), while others let the technology speak for itself. Most clients care more about immediate answer and accurate triage than whether responder is human or AI. Track client satisfaction metrics for first 60 days and adjust approach if concerns arise.',
    },
    {
      question:
        "Does using an emergency answering service mean I have to offer after-hours emergency care?",
      answer:
        "No - answering services benefit ALL practices, regardless of emergency service offering: (1) Practices WITHOUT emergency services: Triage calls to determine severity, refer critical cases to nearest ER, capture non-urgent cases as next-morning appointments (47% of after-hours calls), provide professional response that builds trust, (2) Practices WITH emergency services: Same benefits plus scheduling emergency drop-offs, coordinating DVM on-call response, maximizing emergency revenue capture. Even if you refer all true emergencies elsewhere, answering service captures $60,000-$100,000 annual revenue from urgent-but-not-emergency cases (vomiting/diarrhea, minor injuries, mild pain) scheduled for next morning.",
    },
    {
      question:
        "How often should I review and update my emergency triage protocols?",
      answer:
        "Conduct quarterly protocol reviews: (1) Listen to 10-15 sample calls (answering services provide recordings) to assess triage accuracy and client communication quality, (2) Review escalation data - are appropriate cases reaching DVMs? Are DVMs getting interrupted for non-urgent issues? (3) Update protocols based on seasonal changes (heat stroke triage in summer, toxin protocols around holidays), (4) Revise on-call schedule monthly and confirm backup contacts quarterly. Additionally, perform immediate protocol review if: A mishandled call results in poor patient outcome, Client complaints about emergency service quality reach practice, DVM reports excessive unnecessary escalations. Treat triage protocols as living documents requiring regular refinement.",
    },
  ],
  productTieIn: {
    title: "ODIS AI: Intelligent Emergency Answering Built for Veterinary",
    description:
      "Traditional emergency answering services struggle with veterinary-specific triage nuances and cost $500-$900/month. ODIS AI delivers AAHA-compliant emergency triage through conversational AI that sounds human, intelligently escalates to on-call DVMs, and captures after-hours revenue at a fraction of traditional costs.",
    features: [
      "AAHA-compliant emergency triage protocols built into every conversation",
      "Asks follow-up questions based on client responses (not rigid scripts)",
      "Instantly escalates critical cases to on-call DVM via SMS with client details",
      "Schedules next-morning urgent-care appointments automatically in your PIMS",
      "Provides emergency clinic information for severe cases requiring immediate care",
      "Handles unlimited concurrent calls - never a busy signal during mass emergency events",
      "Full call recording and transcription for quality assurance and training",
      "$199/month flat rate for unlimited after-hours emergency call handling",
    ],
  },
  relatedResources: [
    "emergency-vet-call-center",
    "24-hour-call-center",
    "telephone-answering-service",
    "overnight-coverage",
  ],
};
