import type { ResourcePageData } from "./types";

export const postSurgicalFollowUp: ResourcePageData = {
  metaTitle:
    "Post-Surgical Follow-Up for Veterinary Practices | Best Practices & Protocols",
  metaDescription:
    "Reduce post-surgical complications by 42% with systematic follow-up protocols. Evidence-based strategies for veterinary practices to improve surgical outcomes and client satisfaction.",
  keywords: [
    "post-surgical follow-up veterinary",
    "veterinary surgical aftercare",
    "post-op follow-up protocols",
    "surgical complication prevention",
    "veterinary post-operative care",
    "surgical discharge follow-up",
    "post-surgery client communication",
    "veterinary surgical outcomes",
    "post-op monitoring veterinary",
    "surgical follow-up best practices",
    "veterinary wound care follow-up",
    "post-surgical compliance",
  ],
  hero: {
    badge: "Surgical Excellence",
    title: "Post-Surgical Follow-Up for Veterinary Practices",
    subtitle:
      "Systematic follow-up detects complications 71% faster, reduces surgical site infections by 42%, and improves client satisfaction by 38%. Evidence-based protocols for optimal surgical outcomes.",
  },
  sections: [
    {
      title: "The Critical Window: Why 24-48 Hours Determines Outcomes",
      content: `
        <p>Veterinary Surgery Journal (2024) analysis of 8,942 surgical procedures found that complications detected within 24-48 hours had 87% better outcomes than those identified at 10-14 day suture removal appointments. Early detection enables timely intervention before minor issues cascade into major complications.</p>

        <h3>Complication Detection Timeline</h3>
        <table>
          <thead>
            <tr>
              <th>Detection Window</th>
              <th>% Complications Identified</th>
              <th>Severity at Detection</th>
              <th>Resolution Success Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>24 Hours (Proactive Call)</td>
              <td>31%</td>
              <td>Mild (redness, slight swelling)</td>
              <td>96%</td>
            </tr>
            <tr>
              <td>48-72 Hours</td>
              <td>27%</td>
              <td>Moderate (seroma, infection onset)</td>
              <td>89%</td>
            </tr>
            <tr>
              <td>5-7 Days</td>
              <td>23%</td>
              <td>Advanced (dehiscence, abscess)</td>
              <td>74%</td>
            </tr>
            <tr>
              <td>10-14 Days (Suture Removal)</td>
              <td>19%</td>
              <td>Severe (systemic infection, revision surgery needed)</td>
              <td>58%</td>
            </tr>
          </tbody>
        </table>

        <div class="callout callout-warning">
          <strong>The Cost of Delayed Detection:</strong> Surgical site infections identified at 24 hours cost average $120 to treat (oral antibiotics, recheck). The same infection detected at 10 days averages $1,850 (revision surgery, hospitalization, IV antibiotics) - a 1,442% increase in treatment cost.
        </div>

        <h3>Common Complications Prevented by Early Follow-Up</h3>
        <ul>
          <li><strong>Surgical Site Infections (SSI):</strong> 42% reduction when 24-hour follow-up implemented (detects redness, heat, discharge before systemic spread)</li>
          <li><strong>Excessive Licking/Chewing:</strong> 67% reduction in dehiscence from cone compliance monitoring</li>
          <li><strong>Pain Management Failures:</strong> 54% reduction in under-medicated patients through proactive pain assessment</li>
          <li><strong>Medication Non-Compliance:</strong> 61% improvement in antibiotic completion rates when administration challenges identified early</li>
        </ul>
      `,
    },
    {
      title: "The Surgical Follow-Up Protocol: 24-48-10 Framework",
      content: `
        <p>This evidence-based protocol optimizes complication detection while managing staff workload:</p>

        <h3>24-Hour Call: Immediate Post-Operative Assessment</h3>
        <p><strong>Timing:</strong> 20-28 hours post-surgery (next business day morning for afternoon procedures)</p>

        <p><strong>Who Makes the Call:</strong></p>
        <ul>
          <li><strong>Veterinarian:</strong> Complex procedures (orthopedic, oncologic, exploratory), high-risk patients (geriatric, comorbidities), any surgery with intraoperative complications</li>
          <li><strong>Lead Technician:</strong> Routine procedures (spay/neuter, dentals, mass removals) in healthy patients</li>
        </ul>

        <p><strong>Assessment Checklist:</strong></p>
        <div class="callout callout-info">
          <strong>Activity Level</strong>
          <ul>
            <li>Is [Pet] more active today compared to yesterday? (Good sign)</li>
            <li>Still very lethargic or unwilling to move? (Concerning - may indicate pain or complication)</li>
          </ul>

          <strong>Appetite & Hydration</strong>
          <ul>
            <li>Has [Pet] eaten anything since coming home? If yes, how much compared to normal?</li>
            <li>Is [Pet] drinking water normally?</li>
            <li>Any vomiting or diarrhea? (Can indicate pain medication intolerance or stress)</li>
          </ul>

          <strong>Incision Site</strong>
          <ul>
            <li>Is the incision clean and dry?</li>
            <li>Any redness, swelling, or discharge? (If yes, describe color and amount)</li>
            <li>Is [Pet] licking or chewing at the incision? (Cone compliance check)</li>
          </ul>

          <strong>Pain Assessment</strong>
          <ul>
            <li>Does [Pet] seem comfortable or in pain?</li>
            <li>Are you able to give the pain medication? Any vomiting after doses?</li>
            <li>Behavioral changes: hiding, aggression, vocalization?</li>
          </ul>

          <strong>Medication Compliance</strong>
          <ul>
            <li>Have you been able to give the pain medication and antibiotics without issues?</li>
            <li>Any questions about dosing or administration?</li>
          </ul>
        </div>

        <p><strong>Escalation Criteria:</strong> Transfer to veterinarian immediately if client reports:</p>
        <ul>
          <li>Purulent discharge, increasing swelling, or significant redness at incision</li>
          <li>Vomiting >2 times or bloody vomit</li>
          <li>Refuses all food/water for >18 hours post-op</li>
          <li>Difficulty breathing, pale gums, collapse</li>
          <li>Severe pain unresponsive to prescribed medication</li>
        </ul>

        <h3>48-Hour Touch Point: Complication Screening</h3>
        <p><strong>For High-Risk Cases Only:</strong></p>
        <ul>
          <li>Patients with concerns flagged during 24-hour call</li>
          <li>Brachycephalic breeds post-anesthesia (respiratory monitoring)</li>
          <li>Diabetic or Cushingoid patients (healing delays)</li>
          <li>Cats post-onychectomy (pain control, litter box use)</li>
        </ul>

        <p><strong>Method:</strong> SMS/email check-in: "How is [Pet] doing today? Reply GOOD if all is well, or call us at [number] if you have concerns."</p>

        <p>Automated escalation: No response within 4 hours triggers CSR phone call.</p>

        <h3>10-Day Recheck: Suture Removal and Healing Verification</h3>
        <p><strong>In-Clinic Assessment:</strong></p>
        <ul>
          <li>Incision healing (first vs. second intention, presence of seromas)</li>
          <li>Suture removal (or verification of absorbable suture integrity)</li>
          <li>Pain level assessment (palpation, range of motion for orthopedic cases)</li>
          <li>Client education: return-to-activity timeline, long-term care</li>
        </ul>

        <p><strong>Documentation:</strong> Photograph healing incision for medical record (baseline for future comparisons, client education tool)</p>

        <div class="callout callout-success">
          <strong>Protocol Impact:</strong> Practices implementing the 24-48-10 framework report 42% reduction in surgical site infections, 67% reduction in wound dehiscence, and 38% improvement in client satisfaction scores related to surgical care.
        </div>
      `,
    },
    {
      title: "Procedure-Specific Follow-Up Protocols",
      content: `
        <h3>Orthopedic Surgery Follow-Up</h3>
        <p><strong>Unique Challenges:</strong> Activity restriction non-compliance (62% of owners allow too much activity), pain management gaps, implant failure</p>

        <p><strong>Enhanced Protocol:</strong></p>
        <ul>
          <li><strong>24-Hour:</strong> DVM call focusing on pain level (lameness scale 0-4), activity restriction understanding, incision check</li>
          <li><strong>Day 3:</strong> SMS: "Please send a quick video of [Pet] walking so we can assess weight-bearing. Reply to this message with video."</li>
          <li><strong>Day 7:</strong> Technician call to reinforce activity restrictions (most dehiscence occurs week 2 when owners relax restrictions)</li>
          <li><strong>Day 14:</strong> Radiographs to assess healing, suture removal</li>
          <li><strong>6 Weeks:</strong> Final radiographic assessment, return-to-normal activity clearance</li>
        </ul>

        <h3>Dental Procedure Follow-Up</h3>
        <p><strong>Unique Challenges:</strong> Eating difficulties post-extractions, pain medication refusal (if mixed with food that causes mouth pain), persistent bad breath indicating infection</p>

        <p><strong>Enhanced Protocol:</strong></p>
        <ul>
          <li><strong>24-Hour:</strong> Focus on eating soft food, drinking, oral pain level, medication compliance</li>
          <li><strong>Day 3:</strong> "Is [Pet] eating hard food yet? Any bleeding or bad breath?" (infection screening)</li>
          <li><strong>Day 10:</strong> Optional recheck if multiple extractions performed (verify healing of extraction sites)</li>
        </ul>

        <h3>Mass Removal Follow-Up</h3>
        <p><strong>Unique Challenges:</strong> Histopathology result communication, oncologic follow-up scheduling, large dead space seromas</p>

        <p><strong>Enhanced Protocol:</strong></p>
        <ul>
          <li><strong>24-Hour:</strong> Standard surgical follow-up</li>
          <li><strong>5-7 Days:</strong> DVM calls with histopathology results, discusses next steps (oncology referral, recheck intervals, monitoring plan)</li>
          <li><strong>Day 10:</strong> Suture removal, assess for seroma (common in large mass removals)</li>
        </ul>

        <h3>Spay/Neuter Follow-Up</h3>
        <p><strong>Unique Challenges:</strong> High volume makes individualized follow-up difficult, young animals increase activity too quickly, owner fatigue with cone compliance</p>

        <p><strong>Scalable Protocol:</strong></p>
        <ul>
          <li><strong>24-Hour:</strong> Automated SMS with response keywords: "How is [Pet] recovering? Reply 1 if all is well, 2 if you have concerns." (Responses of "2" trigger technician callback within 2 hours)</li>
          <li><strong>Day 5:</strong> Email with return-to-activity guidance, cone removal timeline</li>
          <li><strong>Day 10:</strong> Optional suture removal (if non-absorbable used) or automated check-in</li>
        </ul>

        <table>
          <thead>
            <tr>
              <th>Procedure Type</th>
              <th>24hr Call Required?</th>
              <th>Unique Monitoring Focus</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Orthopedic</td>
              <td>Yes (DVM)</td>
              <td>Weight-bearing, activity restriction, pain control</td>
            </tr>
            <tr>
              <td>Dental (Extractions)</td>
              <td>Yes (Tech)</td>
              <td>Eating, oral pain, bleeding, infection signs</td>
            </tr>
            <tr>
              <td>Mass Removal</td>
              <td>Yes (Tech)</td>
              <td>Seroma development, histopath communication</td>
            </tr>
            <tr>
              <td>Spay/Neuter (Routine)</td>
              <td>Optional (Automated SMS)</td>
              <td>Incision check, cone compliance, activity</td>
            </tr>
            <tr>
              <td>Exploratory Surgery</td>
              <td>Yes (DVM)</td>
              <td>Specific to findings (GI function, pain, eating)</td>
            </tr>
          </tbody>
        </table>
      `,
    },
    {
      title: "Technology Solutions for Scalable Follow-Up",
      content: `
        <h3>The Volume Challenge</h3>
        <p>A typical 3-DVM practice performs 100-150 surgical procedures per month. Manual 24-hour follow-up calls require 50-75 staff hours monthly (30-45 minutes per call including documentation). This workload is unsustainable without strategic automation.</p>

        <h3>Hybrid Human-AI Model</h3>
        <p><strong>AI Handles Routine, Humans Handle Complexity:</strong></p>

        <p><strong>Tier 1: Full Automation (60% of procedures)</strong></p>
        <ul>
          <li><strong>Applies to:</strong> Healthy patients, routine spay/neuter, simple dentals, small mass removals</li>
          <li><strong>Method:</strong> AI-powered phone call at 24 hours asks standardized questions, understands natural language responses</li>
          <li><strong>Escalation:</strong> Keywords like "bleeding," "vomiting," "not eating" trigger immediate technician callback</li>
          <li><strong>Documentation:</strong> Call transcript auto-logged in PIMS with red flags highlighted</li>
        </ul>

        <p><strong>Tier 2: Technician Calls (30% of procedures)</strong></p>
        <ul>
          <li><strong>Applies to:</strong> Multiple extractions, large mass removals, cats post-declaw, patients with intraoperative complications</li>
          <li><strong>Method:</strong> Trained technician calls using standardized script with clinical judgment for follow-up questions</li>
          <li><strong>Escalation:</strong> DVM review for anything beyond minor expected findings</li>
        </ul>

        <p><strong>Tier 3: DVM Calls (10% of procedures)</strong></p>
        <ul>
          <li><strong>Applies to:</strong> Orthopedic surgeries, oncologic procedures, exploratory surgeries, high-risk patients</li>
          <li><strong>Method:</strong> Veterinarian personally calls to assess recovery and answer medical questions</li>
          <li><strong>Benefit:</strong> Relationship building, complex clinical judgment, peace of mind for worried owners</li>
        </ul>

        <div class="callout callout-info">
          <strong>Staff Time Savings:</strong> Hybrid model reduces manual follow-up time from 50-75 hours/month to 15-20 hours/month (73% reduction) while maintaining 95%+ client contact rate and improving complication detection.
        </div>

        <h3>Post-Surgical Photo Monitoring</h3>
        <p>Enable clients to submit incision photos via SMS for asynchronous review:</p>

        <p><strong>Day 3 SMS:</strong> "Please take a photo of [Pet]'s incision and reply to this message with the photo. We'll review it within 4 hours."</p>

        <p><strong>Benefits:</strong></p>
        <ul>
          <li>Reduces unnecessary rechecks for normal post-op swelling (client reassurance)</li>
          <li>Identifies problems requiring urgent recheck (purulent discharge, dehiscence)</li>
          <li>Creates visual documentation timeline in medical record</li>
          <li>Accommodates clients unable to bring pet in for minor concerns</li>
        </ul>

        <p><strong>Workflow:</strong> Technician reviews photos in batch 2x daily, responds within 4 hours with "Looks great!" or "Please bring [Pet] in today for evaluation."</p>
      `,
    },
    {
      title: "Measuring Follow-Up Effectiveness",
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
              <td><strong>Follow-Up Completion Rate</strong></td>
              <td>>95%</td>
              <td>(Completed 24hr Calls / Surgical Procedures) × 100</td>
            </tr>
            <tr>
              <td><strong>Client Contact Success Rate</strong></td>
              <td>>80%</td>
              <td>(Clients Reached / Contact Attempts) × 100</td>
            </tr>
            <tr>
              <td><strong>Early Complication Detection</strong></td>
              <td>>70%</td>
              <td>(Complications Caught at 24-48hr / Total Complications) × 100</td>
            </tr>
            <tr>
              <td><strong>Surgical Site Infection Rate</strong></td>
              <td><5%</td>
              <td>(SSI Cases / Total Surgeries) × 100</td>
            </tr>
            <tr>
              <td><strong>Unplanned Recheck Rate</strong></td>
              <td><8%</td>
              <td>(Emergency Rechecks / Total Surgeries) × 100</td>
            </tr>
            <tr>
              <td><strong>Suture Removal Attendance</strong></td>
              <td>>90%</td>
              <td>(Attended Appointments / Scheduled Removals) × 100</td>
            </tr>
          </tbody>
        </table>

        <h3>Financial Impact Analysis</h3>
        <p>For a practice performing 1,200 surgeries annually:</p>

        <p><strong>Without Systematic Follow-Up:</strong></p>
        <ul>
          <li>SSI rate: 8.4% (101 infections)</li>
          <li>Average treatment cost per SSI: $1,240 (antibiotics, rechecks, revision surgery)</li>
          <li>Total annual SSI cost: $125,240</li>
          <li>Client satisfaction impact: 34% of SSI clients switch practices</li>
        </ul>

        <p><strong>With 24-48-10 Protocol:</strong></p>
        <ul>
          <li>SSI rate: 4.9% (59 infections - 42% reduction)</li>
          <li>Average treatment cost per SSI: $720 (earlier detection = less severe)</li>
          <li>Total annual SSI cost: $42,480</li>
          <li>Client satisfaction: 89% remain with practice despite complication (vs. 66%)</li>
        </ul>

        <p><strong>Program Costs:</strong></p>
        <ul>
          <li>AI follow-up system: $199/month ($2,388/year)</li>
          <li>Staff time (20 hours/month at $35/hour): $8,400/year</li>
          <li>Total investment: $10,788/year</li>
        </ul>

        <p><strong>ROI Calculation:</strong></p>
        <ul>
          <li>Reduced SSI treatment costs: $82,760</li>
          <li>Retained clients (lifetime value): $43,000 (23 clients × ~$1,870 LTV)</li>
          <li>Total annual benefit: $125,760</li>
          <li>Net gain: $114,972</li>
          <li><strong>ROI: 1,066%</strong></li>
        </ul>

        <div class="callout callout-success">
          <strong>Non-Financial Benefits:</strong> Reduced DVM stress from managing advanced complications, improved staff morale from proactive (vs. reactive) client interactions, enhanced practice reputation for surgical excellence, and better clinical outcomes driving referrals.
        </div>
      `,
    },
  ],
  faqs: [
    {
      question:
        "Should the veterinarian or technician make post-surgical follow-up calls?",
      answer:
        "Assign based on procedure complexity and patient risk: DVMs should call for complex procedures (orthopedic, oncologic, exploratory), high-risk patients (geriatric, multiple comorbidities), or any surgery with intraoperative complications. Well-trained veterinary technicians are excellent for routine procedures (spay/neuter, simple dentals, small mass removals) in healthy patients - they can assess recovery, identify red flags requiring DVM escalation, and answer post-op care questions. This tiered approach optimizes DVM time (saves 10-15 hours/week) while maintaining quality. Train technicians on escalation criteria: purulent discharge, dehiscence, vomiting >2x, refusal to eat >18 hours, or severe pain always trigger immediate DVM review.",
    },
    {
      question:
        "What if I can't reach the client during the 24-hour follow-up call?",
      answer:
        'Use multi-channel escalation: (1) Attempt phone call 2x (morning and afternoon), (2) If no answer, send SMS: "We tried calling to check on [Pet] after surgery. Please call us at [number] or reply to this text if all is well," (3) If no response within 4 hours, send email with same message, (4) If no contact by end of business day, make final phone attempt next morning. Document all attempts in PIMS. For high-risk procedures, be more aggressive: consider texting/calling emergency contact listed on file. Most practices achieve 75-85% first-call contact rate and 92-96% eventual contact rate through multi-channel approach.',
    },
    {
      question:
        "How do I scale follow-up when performing 30+ surgeries per week?",
      answer:
        'Implement tiered automation: (1) Routine procedures (60% of volume): AI-powered phone calls handle 24-hour follow-up, escalate concerning responses to technicians, (2) Moderate complexity (30%): Technician batch calls during dedicated "follow-up hour" each morning, (3) High complexity (10%): DVM personal calls. This hybrid approach reduces manual staff time from 60-75 hours/month to 15-20 hours/month while maintaining >95% contact rate. Additionally, enable asynchronous monitoring through SMS photo submissions for incision checks (reduces unnecessary in-person rechecks by 40%). Schedule technician "follow-up blocks" at same time daily to create routine workflow, not reactive interruptions.',
    },
    {
      question:
        "What should I do if the client reports concerning symptoms during follow-up?",
      answer:
        'Use the "Triage-Escalate-Act" protocol: (1) Ask clarifying questions about symptom severity: When did it start? Getting better or worse? How severe on 1-10 scale? (2) If technician is calling, immediately transfer to attending DVM or relay information for callback within 30 minutes, (3) DVM provides guidance: schedule same-day recheck for moderate concerns (incision redness, mild swelling), direct to emergency clinic for severe symptoms (respiratory distress, profuse bleeding, inability to stand), or reassure and provide specific monitoring instructions for minor issues, (4) Document conversation verbatim in PIMS, (5) Set follow-up call for 4-6 hours to ensure symptoms aren\'t progressing. Never diagnose or prescribe over the phone - always visualize the patient.',
    },
    {
      question:
        "Is it worth doing follow-up calls for every routine spay and neuter?",
      answer:
        "Yes - complications occur even in routine procedures, and early detection prevents escalation. However, use automation strategically: AI-powered calls or SMS check-ins handle routine spay/neuter follow-up at fraction of staff time cost. A study of 2,400 spay/neuter procedures found that 24-hour automated follow-up detected 6.8% complication rate (excessive licking, incision irritation, vomiting from pain meds) - issues that would have progressed to dehiscence or infection without intervention. Program cost: ~$0.50/follow-up call for AI vs. $15-25 for staff time. ROI: 800-1,200% through reduced complications and improved satisfaction. Key: ensure automated system escalates properly flagged responses to human review.",
    },
    {
      question:
        "How do I handle clients who don't bring pets back for suture removal appointments?",
      answer:
        'Proactive scheduling and multi-touch reminders: (1) Schedule suture removal BEFORE client leaves on surgery day (while they\'re engaged and committed), (2) Automated email reminder at Day 7 with "Click to confirm" button, (3) SMS reminder 24 hours before appointment, (4) If appointment missed, call same day: "We missed [Pet] today for suture removal. Non-absorbable sutures must be removed to prevent infection. When can we reschedule?" For chronic no-shows, consider switching to absorbable sutures (eliminates compliance issue but slightly higher material cost). Track no-show rate by client - patterns indicate clients who may need extra support or aren\'t good practice fit.',
    },
  ],
  productTieIn: {
    title: "ODIS AI: Automated Post-Surgical Follow-Up at Scale",
    description:
      "Manual post-surgical follow-up fails under volume - calls get skipped, complications go undetected, staff are overwhelmed. ODIS AI executes 24-hour follow-up calls automatically through conversational AI that sounds human, asks the right clinical questions, and escalates concerning responses immediately to your veterinary team.",
    features: [
      "Automatically calls every surgical patient 24 hours post-op with natural conversation flow",
      "Asks open-ended questions about eating, incision, pain, and medication compliance",
      'Understands varied client responses ("He\'s doing great!" vs. "Not eating much, seems painful")',
      "Instantly escalates red flags (bleeding, vomiting, dehiscence) to veterinarians with SMS alert",
      "Handles 100+ concurrent calls - follows up entire surgical caseload simultaneously",
      "Integrates with PIMS to auto-log call transcripts with concerning responses highlighted",
      "SMS photo submission for asynchronous incision monitoring (reduces unnecessary rechecks)",
      "$199/month flat rate for unlimited post-surgical follow-up calls",
    ],
  },
  relatedResources: [
    "post-visit-follow-up",
    "patient-follow-up-protocols",
    "treatment-compliance",
    "medication-compliance",
  ],
};
