import type { ResourcePageData } from "./types";

export const frontDeskTraining: ResourcePageData = {
  // SEO
  metaTitle:
    "Veterinary Front Desk Training Program | CSR Training Guide for Vet Clinics",
  metaDescription:
    "Comprehensive veterinary front desk training program covering phone etiquette, client communication, PIMS mastery, emergency triage, conflict resolution, and revenue optimization. Includes 30-day onboarding plan, ongoing training calendar, and competency frameworks for new and experienced CSRs.",
  keywords: [
    "veterinary front desk training",
    "vet receptionist training program",
    "CSR training veterinary",
    "veterinary customer service training",
    "vet clinic front desk onboarding",
    "veterinary receptionist skills",
    "vet clinic phone training",
    "veterinary CSR competencies",
    "front desk training manual vet",
    "veterinary receptionist certification",
  ],

  // Hero
  hero: {
    badge: "Training Excellence",
    title: "Veterinary Front Desk Training: Building World-Class CSR Teams",
    subtitle:
      "Your front desk is the first and last touchpoint for every client. Comprehensive, structured training transforms good CSRs into exceptional ones, driving client retention, revenue growth, and team morale. Discover proven frameworks for onboarding new hires and developing tenured staff.",
  },

  // Sections
  sections: [
    {
      title: "The ROI of Structured CSR Training Programs",
      content: `<p>Most veterinary practices approach front desk training reactively: a few days of shadowing, basic PIMS instruction, and "figure it out as you go." This ad-hoc approach creates inconsistent client experiences, higher error rates, and faster CSR burnout and turnover.</p>

<p>Practices that implement structured training programs see measurable business impact:</p>

<table>
  <thead>
    <tr><th>Metric</th><th>Ad-Hoc Training</th><th>Structured Training</th><th>Impact</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>Time to proficiency</td>
      <td>6-9 months</td>
      <td>3-4 months</td>
      <td>50% faster productive output</td>
    </tr>
    <tr>
      <td>Error rate</td>
      <td>8-12 errors/100 transactions</td>
      <td>2-3 errors/100 transactions</td>
      <td>75% fewer scheduling, billing, and communication errors</td>
    </tr>
    <tr>
      <td>Client satisfaction (NPS)</td>
      <td>+32</td>
      <td>+58</td>
      <td>81% increase in promoter score</td>
    </tr>
    <tr>
      <td>Revenue per CSR</td>
      <td>$420K</td>
      <td>$580K</td>
      <td>+$160K through better upselling, appointment optimization</td>
    </tr>
    <tr>
      <td>First-year turnover</td>
      <td>52%</td>
      <td>18%</td>
      <td>65% reduction saves $20K+ per prevented departure</td>
    </tr>
  </tbody>
</table>

<h3>Cost-Benefit Analysis of Training Investment</h3>

<p>A comprehensive CSR training program requires:</p>

<ul>
  <li><strong>Initial program development:</strong> 40-60 hours to create training manual, checklists, competency assessments, and onboarding curriculum (one-time cost)</li>
  <li><strong>Per-hire onboarding:</strong> 80-100 hours of trainer time over 30 days (mix of lead CSR and practice manager time)</li>
  <li><strong>Ongoing training:</strong> 2-4 hours per month per CSR for skill development and cross-training</li>
</ul>

<p><strong>Total annual cost for 3-person CSR team:</strong> $15,000-$20,000 (includes program development amortized over 3 years, onboarding for 1 new hire/year, ongoing training)</p>

<p><strong>Annual benefits:</strong></p>
<ul>
  <li>Prevented turnover (1.5 departures/year × $10K replacement cost): $15,000</li>
  <li>Increased revenue per CSR (+$160K × 3 CSRs × 50% attributable to training): $240,000</li>
  <li>Reduced errors (200 fewer errors/year × $50 average cost per error): $10,000</li>
  <li>Faster time-to-proficiency (3 months saved × $3K lost productivity): $3,000</li>
</ul>

<p><strong>Net annual benefit: $248,000</strong> on a $20,000 investment = <strong>1,240% ROI</strong></p>`,
      callout: {
        type: "stat",
        text: "Structured CSR training programs deliver 1,240% ROI through reduced turnover, increased revenue per CSR, and faster time-to-proficiency.",
      },
    },
    {
      title: "The 30-Day New Hire Onboarding Blueprint",
      content: `<p>The first 30 days determine whether a new CSR will thrive or struggle. A structured onboarding plan sets clear expectations, builds competence systematically, and creates early wins that build confidence.</p>

<h3>Week 1: Foundation & Culture (Shadowing Phase)</h3>

<p><strong>Day 1: Welcome & Orientation</strong></p>
<ul>
  <li>Morning: Practice tour, team introductions, culture overview, employee handbook review</li>
  <li>Lunch: Team welcome lunch (full practice attends to show CSRs are valued)</li>
  <li>Afternoon: Basic PIMS navigation (client lookup, appointment view), practice protocols review</li>
  <li><strong>Assignment:</strong> Review practice website, service offerings, and fee schedule</li>
</ul>

<p><strong>Days 2-3: Phone & Client Communication Foundations</strong></p>
<ul>
  <li>Shadow experienced CSR on phones for 2 full days</li>
  <li>Learn: Professional greeting, placing callers on hold, message-taking protocol, emergency recognition</li>
  <li>Practice: Role-play common phone scenarios (appointment requests, general questions, upset clients)</li>
  <li><strong>Checkpoint:</strong> Demonstrate proper phone greeting, hold procedure, and message-taking</li>
</ul>

<p><strong>Days 4-5: Check-In, Checkout, and Client Flow</strong></p>
<ul>
  <li>Shadow check-in process: greeting clients, updating information, managing waiting room</li>
  <li>Shadow checkout: payment processing, explaining invoices, scheduling follow-ups, retail sales</li>
  <li>Learn PIMS invoicing, payment posting, and receipt generation</li>
  <li><strong>Checkpoint:</strong> Successfully check in and check out 3 clients under supervision</li>
</ul>

<h3>Week 2: Supervised Practice (Training Wheels Phase)</h3>

<p><strong>Days 6-8: Phone Coverage with Support</strong></p>
<ul>
  <li>Answer phones independently with experienced CSR monitoring nearby</li>
  <li>Goal: Handle 20-30 calls per day, escalating complex questions</li>
  <li>Daily debrief: Review 3-5 challenging calls and discuss better handling approaches</li>
  <li><strong>Checkpoint:</strong> Demonstrate ability to schedule appointments, take messages accurately, recognize emergencies</li>
</ul>

<p><strong>Days 9-10: Front Desk Rotation</strong></p>
<ul>
  <li>Rotate between check-in, checkout, and phone throughout the day</li>
  <li>Begin learning PIMS estimates, medical records navigation, client history review</li>
  <li>Introduction to common medications, preventive services, and retail products</li>
  <li><strong>Checkpoint:</strong> Manage complete client visit cycle (check-in through checkout) for 5 clients independently</li>
</ul>

<h3>Week 3: Independence with Oversight (Competency Building Phase)</h3>

<p><strong>Days 11-13: Primary Responsibility Assignments</strong></p>
<ul>
  <li>Assigned as primary front desk CSR for 4-hour shifts</li>
  <li>Experienced CSR remains available but does not intervene unless asked</li>
  <li>Learn advanced PIMS: inventory lookups, prescription refills, financial holds/discounts</li>
  <li><strong>Checkpoint:</strong> Complete full day as primary front desk CSR with <5 errors requiring correction</li>
</ul>

<p><strong>Days 14-15: Client Education & Upselling Training</strong></p>
<ul>
  <li>Learn how to explain common services: wellness plans, dental cleanings, spay/neuter, vaccinations</li>
  <li>Practice recommending appropriate preventive care based on pet age, species, lifestyle</li>
  <li>Shadow experienced CSR on retail product recommendations and add-on service discussions</li>
  <li><strong>Checkpoint:</strong> Successfully recommend and schedule 3 preventive care add-ons during client interactions</li>
</ul>

<h3>Week 4: Full Integration (Autonomy Phase)</h3>

<p><strong>Days 16-18: Conflict Resolution & Problem-Solving</strong></p>
<ul>
  <li>Training on handling upset clients, billing disputes, appointment conflicts</li>
  <li>Learn when and how to escalate to practice manager or doctor</li>
  <li>Role-play difficult scenarios: client can't afford treatment, client angry about wait time, client disputes charge</li>
  <li><strong>Checkpoint:</strong> De-escalate and resolve 2 real client concerns without escalation</li>
</ul>

<p><strong>Days 19-20: Emergency Protocols & Triage Basics</strong></p>
<ul>
  <li>Learn emergency triage questions (bleeding, breathing, bloat, toxins, trauma)</li>
  <li>Practice recognizing true emergencies vs. urgent vs. routine concerns</li>
  <li>Review after-hours protocols, emergency clinic referral procedures, on-call escalation</li>
  <li><strong>Checkpoint:</strong> Correctly triage 10 emergency scenarios (mix of real and simulated)</li>
</ul>

<p><strong>Days 21-30: Full Autonomy with Weekly Check-Ins</strong></p>
<ul>
  <li>New CSR operates independently as regular team member</li>
  <li>Weekly 30-minute check-ins with practice manager to address questions, review performance, identify skill gaps</li>
  <li>Begin cross-training in advanced topics (financial conversations, payment plans, VIP client management)</li>
  <li><strong>30-Day Assessment:</strong> Formal competency evaluation covering all core skills</li>
</ul>`,
      callout: {
        type: "insight",
        text: "Structured 30-day onboarding reduces time-to-proficiency from 6-9 months to 3-4 months and cuts first-year turnover from 52% to 18%.",
      },
    },
    {
      title: "Core Competency Framework: Skills Every CSR Must Master",
      content: `<p>Exceptional CSRs demonstrate competence across multiple domains. Use this framework to assess skill levels and create individualized development plans.</p>

<h3>1. Phone Communication Excellence</h3>

<p><strong>Level 1 - Basic (0-3 months):</strong></p>
<ul>
  <li>Answers phone professionally with practice name and personal greeting within 3 rings</li>
  <li>Places callers on hold properly (asks permission, explains why, returns within 60 seconds)</li>
  <li>Takes accurate messages with all required information (caller name, phone, pet, reason for call)</li>
  <li>Recognizes true emergencies and escalates appropriately</li>
</ul>

<p><strong>Level 2 - Proficient (3-12 months):</strong></p>
<ul>
  <li>Handles 80%+ of calls without escalation or assistance</li>
  <li>Schedules appointments efficiently (under 90 seconds per call)</li>
  <li>Provides accurate answers to common medical questions within scope</li>
  <li>Uses empathetic language for distressed or emotional callers</li>
  <li>Identifies upsell opportunities and recommends appropriate services</li>
</ul>

<p><strong>Level 3 - Expert (12+ months):</strong></p>
<ul>
  <li>Handles complex multi-pet scheduling, emergency triage, and billing inquiries seamlessly</li>
  <li>Coaches newer CSRs on phone best practices</li>
  <li>Maintains composure with aggressive or demanding callers</li>
  <li>Recognizes patterns in call volume and proactively suggests workflow improvements</li>
</ul>

<h3>2. PIMS Mastery</h3>

<p><strong>Level 1 - Basic:</strong></p>
<ul>
  <li>Client and patient lookup by name, phone, or account number</li>
  <li>Basic appointment scheduling (view calendar, create appointment, assign doctor and room)</li>
  <li>Simple invoicing (apply services, process payment, print receipt)</li>
  <li>Navigate medical records to view vaccine history and medication list</li>
</ul>

<p><strong>Level 2 - Proficient:</strong></p>
<ul>
  <li>Create estimates and treatment plans</li>
  <li>Process prescription refills with doctor approval</li>
  <li>Manage inventory (check stock levels, place orders, receive shipments)</li>
  <li>Apply discounts, holds, and payment plans according to practice policy</li>
  <li>Generate reports (daily cash reconciliation, appointment statistics, outstanding balances)</li>
</ul>

<p><strong>Level 3 - Expert:</strong></p>
<ul>
  <li>Troubleshoot common PIMS errors independently</li>
  <li>Train new hires on PIMS workflows</li>
  <li>Customize PIMS settings (appointment types, fee schedules, templates)</li>
  <li>Identify and report PIMS bugs or feature requests to vendor</li>
</ul>

<h3>3. Client Education & Communication</h3>

<p><strong>Level 1 - Basic:</strong></p>
<ul>
  <li>Explains common services (wellness exams, vaccinations, dental cleanings) using practice-approved language</li>
  <li>Directs clients to appropriate educational resources (handouts, website, blog)</li>
  <li>Answers basic questions about hospital hours, services, and policies</li>
</ul>

<p><strong>Level 2 - Proficient:</strong></p>
<ul>
  <li>Recommends preventive care based on pet signalment (age, species, lifestyle)</li>
  <li>Explains medical concepts in client-friendly language (not medical jargon)</li>
  <li>Handles financial conversations with confidence (explains estimates, discusses payment options)</li>
  <li>Recognizes when client needs more in-depth medical explanation from doctor</li>
</ul>

<p><strong>Level 3 - Expert:</strong></p>
<ul>
  <li>Builds rapport with clients that drives loyalty and referrals</li>
  <li>Identifies unmet needs and suggests appropriate services without being pushy</li>
  <li>Translates complex medical conditions into understandable explanations</li>
  <li>Mentors newer CSRs on client communication techniques</li>
</ul>

<h3>4. Conflict Resolution & Service Recovery</h3>

<p><strong>Level 1 - Basic:</strong></p>
<ul>
  <li>Remains calm and professional when clients are upset</li>
  <li>Listens actively and acknowledges client concerns</li>
  <li>Knows when to escalate to practice manager or doctor</li>
</ul>

<p><strong>Level 2 - Proficient:</strong></p>
<ul>
  <li>Resolves minor complaints independently (long wait times, appointment scheduling issues)</li>
  <li>Uses de-escalation techniques to calm upset clients</li>
  <li>Offers appropriate service recovery (apology, discount, future incentive)</li>
  <li>Documents complaints and resolutions for future reference</li>
</ul>

<p><strong>Level 3 - Expert:</strong></p>
<ul>
  <li>Handles complex disputes (billing disagreements, medical outcomes, client expectations)</li>
  <li>Converts upset clients into promoters through exceptional service recovery</li>
  <li>Identifies systemic issues causing recurring complaints and proposes solutions</li>
  <li>Trains team on conflict resolution best practices</li>
</ul>`,
    },
    {
      title: "Ongoing Training Calendar: Continuous Skill Development",
      content: `<p>Initial onboarding builds foundation, but ongoing training prevents skill atrophy, keeps teams current on new services and technology, and provides growth opportunities that reduce turnover.</p>

<h3>Weekly Training (15-20 minutes)</h3>

<p><strong>Format:</strong> Team huddle during low-traffic period (Tuesday-Thursday 2-3 PM)</p>

<p><strong>Sample Topics:</strong></p>
<ul>
  <li>Week 1: New service launch - How to explain laser therapy to clients</li>
  <li>Week 2: Role-play challenging phone scenario - Client can't afford recommended treatment</li>
  <li>Week 3: Product spotlight - Demonstrate and discuss new retail product (flea/tick prevention, dental chews)</li>
  <li>Week 4: PIMS feature training - Using new appointment reminder system</li>
</ul>

<p><strong>Goal:</strong> Maintain skill sharpness, address recurring problems, build product knowledge</p>

<h3>Monthly Deep-Dive Training (1 hour)</h3>

<p><strong>Format:</strong> Dedicated training session before opening or after closing</p>

<p><strong>Sample Topics:</strong></p>
<ul>
  <li>January: Financial conversations - How to discuss estimates, payment plans, CareCredit</li>
  <li>February: Emergency triage refresher - Recognizing life-threatening conditions</li>
  <li>March: Upselling without being pushy - Consultative selling techniques</li>
  <li>April: Conflict resolution - De-escalation strategies and service recovery</li>
  <li>May: PIMS deep-dive - Advanced features most CSRs don't use</li>
  <li>June: Multi-pet household management - Coordinating care for complex families</li>
  <li>July: Medical terminology - Building vocabulary to better understand doctor conversations</li>
  <li>August: Retail merchandising - Product placement and display best practices</li>
  <li>September: Client retention strategies - Reactivating lapsed clients</li>
  <li>October: Holiday planning - Managing busy season stress and client volume</li>
  <li>November: Year-end financial conversations - Discussing remaining wellness plan benefits</li>
  <li>December: New year planning - Review metrics and set goals for next year</li>
</ul>

<h3>Quarterly Cross-Training (Half Day)</h3>

<p><strong>Format:</strong> CSRs shadow clinical team and vice versa</p>

<p><strong>Activities:</strong></p>
<ul>
  <li>CSRs observe appointments, treatments, and surgeries to understand what happens "in the back"</li>
  <li>Doctors and technicians cover front desk to experience phone volume and client interactions</li>
  <li>Joint discussion of workflow pain points and collaborative solutions</li>
</ul>

<p><strong>Goal:</strong> Build empathy, improve communication, identify process improvements</p>

<h3>Annual CE/Conference (1-2 days)</h3>

<p><strong>Format:</strong> Send at least one lead CSR to industry conference</p>

<p><strong>Options:</strong></p>
<ul>
  <li>Fetch Conference (veterinary management focused)</li>
  <li>VMX Conference (large multi-track CE event)</li>
  <li>Local VHMA chapter meetings (Veterinary Hospital Managers Association)</li>
  <li>Online webinars through NAVTA or practice management companies</li>
</ul>

<p><strong>Goal:</strong> Exposure to industry best practices, networking, professional development, retention through growth investment</p>`,
      callout: {
        type: "warning",
        text: "Practices that skip ongoing training see CSR competency decline by 20-30% within 12 months as skills atrophy and new team members aren't properly integrated.",
      },
    },
    {
      title: "Training Tools & Resources: Building Your Program",
      content: `<p>Effective training requires structured resources that ensure consistency, track progress, and provide reference materials for CSRs at all skill levels.</p>

<h3>Essential Training Materials</h3>

<p><strong>1. Front Desk Training Manual (50-80 pages)</strong></p>

<p>Comprehensive written resource covering:</p>
<ul>
  <li>Practice overview (history, mission, team, services)</li>
  <li>Phone protocols (greetings, hold procedures, emergency triage questions)</li>
  <li>PIMS step-by-step guides with screenshots (appointment scheduling, invoicing, client creation)</li>
  <li>Common client questions with approved answers</li>
  <li>Service descriptions and pricing</li>
  <li>Conflict resolution frameworks and example scenarios</li>
  <li>Emergency protocols and after-hours procedures</li>
</ul>

<p><strong>2. Quick Reference Guides (1-2 pages each)</strong></p>

<p>Laminated cards at front desk for instant access:</p>
<ul>
  <li>Emergency triage questions checklist</li>
  <li>Appointment type guide (duration, fees, what's included)</li>
  <li>Common medication pronunciation and spelling guide</li>
  <li>Payment plan eligibility criteria and approval process</li>
  <li>Escalation decision tree (when to get manager vs. doctor)</li>
</ul>

<p><strong>3. Competency Assessment Checklists</strong></p>

<p>Objective skill validation for each training phase:</p>
<ul>
  <li>30-day assessment: 50 observable skills rated Beginner/Proficient/Expert</li>
  <li>90-day assessment: Advanced skills and independence evaluation</li>
  <li>Annual review: Complete competency framework across all domains</li>
</ul>

<p><strong>4. Role-Play Scenario Library</strong></p>

<p>Collection of 20-30 common and challenging scenarios for practice:</p>
<ul>
  <li>Upset client scenarios (long wait, unexpected charge, poor outcome)</li>
  <li>Financial conversation scenarios (can't afford estimate, declined CareCredit)</li>
  <li>Emergency triage scenarios (bloat, toxicity, hit by car, seizure)</li>
  <li>Complex scheduling scenarios (multi-pet household, special requests)</li>
</ul>

<p><strong>5. Video Training Library</strong></p>

<p>Screen recordings and demonstrations for self-paced learning:</p>
<ul>
  <li>PIMS walkthrough videos (10-15 minutes each for major workflows)</li>
  <li>Client communication examples (excellent and poor phone calls for comparison)</li>
  <li>Service explanations (how to describe dental cleanings, laser therapy, wellness plans)</li>
  <li>Technology tutorials (appointment reminder system, client portal, online booking)</li>
</ul>

<h3>Training Delivery Tools</h3>

<ul>
  <li><strong>Learning Management System (LMS):</strong> TalentLMS, Trainual, or practice-built Google Drive folder for organized resource access and progress tracking</li>
  <li><strong>Screen Recording Software:</strong> Loom or OBS for creating PIMS training videos</li>
  <li><strong>Assessment Platform:</strong> Google Forms or Typeform for competency quizzes and knowledge checks</li>
  <li><strong>Communication Channel:</strong> Slack or team group chat for quick questions during training period</li>
</ul>`,
    },
  ],

  // FAQs
  faqs: [
    {
      question: "How long should CSR onboarding take?",
      answer:
        "Structured onboarding should span 30 days with defined phases: Week 1 (shadowing and observation), Week 2 (supervised practice), Week 3 (independence with oversight), Week 4 (full autonomy with weekly check-ins). This 30-day intensive training is followed by ongoing mentorship and skill development for 60-90 days until the CSR achieves full proficiency. Practices that rush onboarding to 1-2 weeks see 50%+ first-year turnover and months of errors and inefficiency.",
    },
    {
      question:
        "Should I hire experienced CSRs from other vet clinics or train inexperienced candidates?",
      answer:
        "Both approaches have merit. Experienced CSRs bring veterinary knowledge and PIMS familiarity, allowing faster time-to-productivity (4-6 weeks vs. 12-16 weeks for inexperienced hires). However, they may also bring bad habits or resistance to your specific protocols. Inexperienced candidates (customer service background from retail, hospitality, healthcare) often make exceptional long-term CSRs when properly trained - they're eager to learn, have no preconceptions, and can be molded to your culture. Many top-performing practices use a mix: hire experienced CSRs as leads/trainers, hire inexperienced candidates as associates who learn from them.",
    },
    {
      question:
        "What's the best way to train CSRs on emergency triage without medical training?",
      answer:
        "Focus on standardized triage questions, not medical diagnosis. CSRs should ask specific questions (Is the pet having difficulty breathing? Are the gums pale/white/blue? Is the pet seizing or unconscious?) and recognize patterns that always require immediate care. Create a decision tree that maps answers to outcomes (YES to any breathing/circulation/consciousness question = emergency referral now). Practice with role-play scenarios monthly to maintain skill. Emphasize that CSRs are not making medical judgments - they're following a protocol designed by your veterinarians to catch all life-threatening conditions.",
    },
    {
      question:
        "How do I train CSRs to upsell preventive care without being pushy or salesy?",
      answer:
        'Reframe upselling as client education and pet advocacy. Train CSRs to ask lifestyle questions (Does Fluffy go to dog parks? Does Max go outside?) and use answers to recommend appropriate preventive care (flea/tick prevention, heartworm testing, Lyme vaccination). Teach consultative selling: present recommendations as what the CSR would do for their own pet ("If Max were my dog and he goes outside, I\'d definitely want to protect him with..." ). Role-play until recommendations feel natural and conversational rather than scripted. Track acceptance rates and celebrate CSRs who successfully educate clients into better care.',
    },
    {
      question:
        "What topics should ongoing training cover for experienced CSRs?",
      answer:
        "Experienced CSRs need skill reinforcement, advanced techniques, and professional development: Advanced conflict resolution and difficult conversation skills, financial counseling and payment plan negotiations, leadership development for future lead CSR or management roles, cross-training on clinical workflows to understand the full client journey, technology deep-dives (mastering underutilized PIMS features), client retention and reactivation strategies, and industry trends through CE conferences. Ongoing training prevents skill atrophy, reduces burnout through novelty and challenge, and demonstrates investment in CSR growth which improves retention.",
    },
    {
      question: "How do I measure whether CSR training is effective?",
      answer:
        "Track these metrics quarterly: Time-to-proficiency (how long until new CSRs operate independently), error rates (scheduling mistakes, billing errors, communication failures per 100 transactions), client satisfaction scores (NPS or CSAT focused on front desk experience), revenue per CSR (measure upselling and appointment optimization effectiveness), first-year turnover (structured training should reduce this from 50%+ to under 20%), and competency assessment scores (track skill progression using standardized evaluations). Also gather qualitative feedback: ask CSRs what training was most/least helpful and have them rate their confidence in key skills.",
    },
  ],

  // Product Tie-In
  productTieIn: {
    title: "ODIS AI: Accelerate CSR Training with Smart Phone Automation",
    description:
      "New CSRs typically need 6-8 weeks to handle phones confidently. ODIS AI removes phone overwhelm from the learning curve by handling 70-80% of routine calls automatically, allowing new hires to focus on mastering PIMS, in-person client service, and clinical knowledge without drowning in phone interruptions.",
    features: [
      "Handles routine calls (appointments, questions, prescription refills) automatically during CSR training period",
      "Reduces phone call training time from 6-8 weeks to 2-3 weeks",
      "New CSRs can focus on learning PIMS, front desk workflows, and client relationships without phone stress",
      "Experienced CSRs available to mentor new hires instead of being buried in phone calls",
      "Provides real call transcripts that can be used for training examples and scenario practice",
      "24/7 coverage means new CSRs never feel pressure to handle after-hours calls they're not ready for",
    ],
    cta: "See how ODIS AI supports CSR training",
  },

  // Related Resources
  relatedResources: [
    "veterinary-csr-appreciation",
    "reception-desk-optimization",
    "vet-call-center-solutions",
    "vet-tech-client-communication",
  ],

  // Hub page fields
  cardDescription:
    "Build world-class CSR teams with comprehensive training frameworks covering phone excellence, PIMS mastery, client service, and conflict resolution. Includes onboarding checklists and retention strategies.",
  stats: [
    {
      value: "60%",
      label: "Average CSR turnover rate in veterinary practices",
    },
    {
      value: "6-8 weeks",
      label: "Time for new CSRs to handle phones confidently",
    },
    {
      value: "$8,500",
      label: "Average cost to replace a single CSR",
    },
  ],
};
