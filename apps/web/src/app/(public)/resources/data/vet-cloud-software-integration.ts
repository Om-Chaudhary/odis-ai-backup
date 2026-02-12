import type { ResourcePageData } from "./types";

export const vetCloudSoftwareIntegration: ResourcePageData = {
  metaTitle:
    "Cloud-Based Veterinary Software Integrations | PIMS Phone System Connectivity",
  metaDescription:
    "Integrate phone systems with cloud-based veterinary software (Cornerstone, eVetPractice, AVImark). Enable real-time appointment booking, automated call logging, and seamless communication workflows.",
  keywords: [
    "veterinary cloud software integration",
    "PIMS phone integration",
    "veterinary software API",
    "cloud PIMS integration",
    "vet practice software connectivity",
    "automated appointment booking veterinary",
    "PIMS API integration",
    "veterinary practice management software",
    "cloud-based vet software",
    "eVetPractice integration",
    "Cornerstone integration",
    "AVImark API integration",
  ],
  hero: {
    badge: "Software Integration",
    title: "Cloud-Based Veterinary Software Integrations",
    subtitle:
      "Connect phone systems with cloud PIMS platforms for real-time appointment booking, automated call logging, and seamless workflows. Reduce manual data entry by 85% and improve scheduling efficiency by 67%.",
  },
  sections: [
    {
      title: "Why PIMS Integration Transforms Phone Operations",
      content: `
        <p>Disconnected phone and PIMS systems create manual double-entry workflows that waste staff time and introduce errors. Modern API integrations eliminate these inefficiencies through bidirectional data synchronization.</p>

        <h3>The Cost of Non-Integrated Systems</h3>
        <table>
          <thead>
            <tr>
              <th>Manual Process</th>
              <th>Time Per Occurrence</th>
              <th>Daily Frequency</th>
              <th>Annual Hours Wasted</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Scheduling Appointment</td>
              <td>4-6 minutes (check availability, enter details, verbally confirm)</td>
              <td>25 appointments</td>
              <td>260-390 hours</td>
            </tr>
            <tr>
              <td>Logging Call Notes</td>
              <td>3-5 minutes per call</td>
              <td>50 calls</td>
              <td>312-520 hours</td>
            </tr>
            <tr>
              <td>Updating Client Contact Info</td>
              <td>2-3 minutes</td>
              <td>5 updates</td>
              <td>42-62 hours</td>
            </tr>
            <tr>
              <td>Checking Patient History During Call</td>
              <td>2-4 minutes (searching PIMS mid-conversation)</td>
              <td>30 lookups</td>
              <td>250-416 hours</td>
            </tr>
            <tr>
              <td>Resolving Double-Bookings</td>
              <td>8-12 minutes (client calls, rescheduling)</td>
              <td>2 errors/week</td>
              <td>69-104 hours</td>
            </tr>
          </tbody>
        </table>

        <p><strong>Total Annual Time Waste:</strong> 933-1,492 hours (equivalent to 0.45-0.72 FTE) at $30/hour = <strong>$27,990-$44,760 annual cost</strong></p>

        <div class="callout callout-warning">
          <strong>Error Costs:</strong> Beyond time waste, manual entry introduces 5-8% error rate (wrong appointment time, incorrect pet name, missed patient allergies). Each error costs 15-30 minutes to correct plus potential client dissatisfaction and safety risks.
        </div>

        <h3>Benefits of Integrated Systems</h3>

        <p><strong>Real-Time Appointment Booking:</strong></p>
        <ul>
          <li>Phone system/answering service/AI sees live PIMS availability</li>
          <li>Books appointments directly without CSR intervention</li>
          <li>Automatic confirmation SMS/email sent immediately</li>
          <li>Zero double-booking risk (single source of truth)</li>
          <li><strong>Time Savings:</strong> Reduce scheduling from 5 minutes to 30 seconds (90% improvement)</li>
        </ul>

        <p><strong>Automatic Call Logging:</strong></p>
        <ul>
          <li>Call details (duration, caller ID, conversation summary) appear in patient record automatically</li>
          <li>Transcription of voicemails logged in PIMS for DVM review</li>
          <li>Eliminates manual note-taking during/after calls</li>
          <li><strong>Time Savings:</strong> 3-5 minutes per call × 50 daily calls = 250 minutes/day (4.2 hours)</li>
        </ul>

        <p><strong>Screen Pop with Patient Context:</strong></p>
        <ul>
          <li>Caller ID recognized → Patient record appears on screen instantly</li>
          <li>CSR sees last visit date, upcoming appointments, outstanding balances before answering</li>
          <li>Personalized greeting: "Hi Sarah! Calling about Fluffy's dental recheck?"</li>
          <li><strong>Experience Impact:</strong> 81% of clients report higher satisfaction when greeted by name with pet context</li>
        </ul>
      `,
    },
    {
      title: "Cloud PIMS Platforms with Native Phone Integration",
      content: `
        <h3>Tier 1: Full API Integration (Recommended)</h3>
        <p>These platforms offer robust APIs enabling bidirectional communication with phone systems:</p>

        <p><strong>Cornerstone (IDEXX)</strong></p>
        <ul>
          <li><strong>API Capabilities:</strong> Appointment scheduling (read/write), client/patient data (read/write), invoicing (read), reminders (send)</li>
          <li><strong>Integration Partners:</strong> Weave, PetDesk, VetCheck, ODIS AI, Talkatoo</li>
          <li><strong>Setup:</strong> API key generation through Cornerstone settings → provide to integration partner → 3-5 day configuration</li>
          <li><strong>Cost:</strong> $0-$99/month depending on integration partner</li>
        </ul>

        <p><strong>eVetPractice (Covetrus)</strong></p>
        <ul>
          <li><strong>API Capabilities:</strong> Full CRUD operations on appointments, clients, patients, medical records, inventory, billing</li>
          <li><strong>Integration Partners:</strong> PetDesk, Weave, VoiceNation, ODIS AI</li>
          <li><strong>Setup:</strong> OAuth 2.0 authentication → scope selection (which data fields to share) → webhook configuration for real-time updates</li>
          <li><strong>Cost:</strong> $0-$149/month (some partners include in base pricing)</li>
        </ul>

        <p><strong>AVImark (Covetrus)</strong></p>
        <ul>
          <li><strong>API Capabilities:</strong> Appointment CRUD, client/patient demographics, medical history (read-only for most partners)</li>
          <li><strong>Integration Partners:</strong> Weave, VetCheck, PartnerConnect, ODIS AI</li>
          <li><strong>Setup:</strong> Local database connector (for on-premise) or cloud API (for AVImark Cloud) → partner configuration</li>
          <li><strong>Cost:</strong> $0-$99/month</li>
        </ul>

        <p><strong>Impromed (Henry Schein)</strong></p>
        <ul>
          <li><strong>API Capabilities:</strong> Appointment scheduling, client data, patient records, invoicing</li>
          <li><strong>Integration Partners:</strong> PetDesk, Weave, VetCheck</li>
          <li><strong>Setup:</strong> API credentials through Impromed support → partner onboarding (5-7 days typical)</li>
          <li><strong>Cost:</strong> $50-$150/month</li>
        </ul>

        <h3>Tier 2: Limited Integration (Workarounds Required)</h3>

        <p><strong>Shepherd</strong></p>
        <ul>
          <li><strong>API Status:</strong> Limited public API (appointment scheduling available, medical records restricted)</li>
          <li><strong>Workaround:</strong> Email-based appointment requests (integration partner emails practice → CSR manually books in Shepherd)</li>
          <li><strong>Better Option:</strong> Shepherd's native online booking widget can embed in practice website</li>
        </ul>

        <p><strong>RxWorks</strong></p>
        <ul>
          <li><strong>API Status:</strong> Read-only API (can pull appointment data, cannot write appointments from external systems)</li>
          <li><strong>Workaround:</strong> One-way sync (phone system shows PIMS availability, but CSR must manually enter bookings in RxWorks)</li>
        </ul>

        <table>
          <thead>
            <tr>
              <th>PIMS Platform</th>
              <th>API Quality</th>
              <th>Setup Complexity</th>
              <th>Best Integration Partners</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cornerstone</td>
              <td>Excellent</td>
              <td>Low (3-5 days)</td>
              <td>Weave, PetDesk, ODIS AI</td>
            </tr>
            <tr>
              <td>eVetPractice</td>
              <td>Excellent</td>
              <td>Low (3-5 days)</td>
              <td>PetDesk, Weave, ODIS AI</td>
            </tr>
            <tr>
              <td>AVImark</td>
              <td>Good</td>
              <td>Medium (5-7 days)</td>
              <td>Weave, VetCheck, ODIS AI</td>
            </tr>
            <tr>
              <td>Impromed</td>
              <td>Good</td>
              <td>Medium (5-7 days)</td>
              <td>PetDesk, Weave</td>
            </tr>
            <tr>
              <td>Shepherd</td>
              <td>Fair</td>
              <td>High (10-14 days)</td>
              <td>Native online booking recommended</td>
            </tr>
            <tr>
              <td>RxWorks</td>
              <td>Limited</td>
              <td>High (read-only integration)</td>
              <td>Manual processes required</td>
            </tr>
          </tbody>
        </table>
      `,
    },
    {
      title: "Integration Setup: 5-Step Implementation Process",
      content: `
        <h3>Step 1: Choose Integration Partner (Week 1)</h3>

        <p>Evaluate based on your primary use case:</p>

        <p><strong>For 24/7 Answering & Appointment Booking:</strong></p>
        <ul>
          <li><strong>ODIS AI ($199/month):</strong> AI-powered answering service with PIMS integration, handles unlimited calls, books appointments 24/7</li>
          <li><strong>PetDesk ($149-$299/month):</strong> Client communication platform (SMS, app) + answering service add-on</li>
          <li><strong>Weave ($349-$599/month):</strong> VoIP phone system + client communication + analytics</li>
        </ul>

        <p><strong>For VoIP + Communication Hub:</strong></p>
        <ul>
          <li><strong>Weave ($349-$599/month):</strong> Comprehensive platform with phones, texting, payment processing</li>
          <li><strong>VetCheck ($99-$199/month):</strong> Simpler system focused on reminders and two-way SMS</li>
        </ul>

        <h3>Step 2: PIMS Credential Configuration (Week 1-2)</h3>

        <p><strong>For Cornerstone:</strong></p>
        <ol>
          <li>Log into Cornerstone as administrator</li>
          <li>Navigate to Settings → Integrations → API Keys</li>
          <li>Generate new API key with scopes: Appointments (read/write), Clients (read), Patients (read)</li>
          <li>Copy API key and secret → provide to integration partner via secure portal</li>
        </ol>

        <p><strong>For eVetPractice:</strong></p>
        <ol>
          <li>Contact Covetrus support to enable API access (may require approval)</li>
          <li>Create OAuth 2.0 application credentials</li>
          <li>Define data scopes (appointments, demographics, medical history level)</li>
          <li>Configure webhook URL for real-time appointment sync</li>
        </ol>

        <p><strong>For AVImark:</strong></p>
        <ol>
          <li>Cloud version: similar to eVetPractice OAuth flow</li>
          <li>On-premise version: install database connector software on local server</li>
          <li>Configure firewall rules to allow integration partner IP addresses</li>
        </ol>

        <h3>Step 3: Data Field Mapping (Week 2)</h3>

        <p>Integration partner configures which PIMS fields map to which phone system fields:</p>

        <table>
          <thead>
            <tr>
              <th>PIMS Field</th>
              <th>Phone System Use</th>
              <th>Configuration Required</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Client Name</td>
              <td>Caller ID matching, personalized greeting</td>
              <td>Format standardization (First Last vs. Last, First)</td>
            </tr>
            <tr>
              <td>Phone Numbers (Home, Cell, Work)</td>
              <td>Caller ID lookup, outbound calling</td>
              <td>Number normalization (remove dashes, parentheses)</td>
            </tr>
            <tr>
              <td>Email Address</td>
              <td>Appointment confirmations, call summaries</td>
              <td>Validation of active addresses</td>
            </tr>
            <tr>
              <td>Patient Name & Species</td>
              <td>Screen pop context, appointment booking</td>
              <td>Multi-pet household handling</td>
            </tr>
            <tr>
              <td>Appointment Types & Durations</td>
              <td>Available slot calculation, booking rules</td>
              <td>Map PIMS appointment types to phone system categories</td>
            </tr>
            <tr>
              <td>Provider Schedules</td>
              <td>Availability checking, routing preferences</td>
              <td>Blocked time configuration (surgery, lunch, meetings)</td>
            </tr>
          </tbody>
        </table>

        <h3>Step 4: Testing & Validation (Week 3)</h3>

        <p><strong>Sandbox Testing Protocol:</strong></p>
        <ol>
          <li><strong>Appointment Booking Tests:</strong>
            <ul>
              <li>Book 10 appointments via phone system, verify they appear in PIMS with correct date/time/patient/provider</li>
              <li>Test edge cases: multi-pet appointments, same-day booking, recurring appointments</li>
              <li>Attempt to double-book a slot → should be blocked by integration</li>
            </ul>
          </li>
          <li><strong>Call Logging Tests:</strong>
            <ul>
              <li>Make 5 test calls, verify notes appear in correct patient records within 2 minutes</li>
              <li>Test voicemail transcription accuracy</li>
            </ul>
          </li>
          <li><strong>Screen Pop Tests:</strong>
            <ul>
              <li>Call from 10 different client phone numbers, verify correct patient records appear</li>
              <li>Test multi-pet households (should show all pets associated with caller)</li>
            </ul>
          </li>
        </ol>

        <h3>Step 5: Production Launch & Monitoring (Week 4)</h3>

        <p><strong>Week 1 Post-Launch:</strong></p>
        <ul>
          <li>Monitor first 100 bookings for accuracy (date/time/patient/provider correctness)</li>
          <li>Review call logs in PIMS - are notes appearing in correct records?</li>
          <li>Collect staff feedback on screen pop performance and workflow improvements</li>
          <li>Track error rate: target <2% booking errors, <1% call logging failures</li>
        </ul>

        <p><strong>Week 2-4:</strong></p>
        <ul>
          <li>Optimize appointment type mappings based on actual usage patterns</li>
          <li>Refine blocked time settings if DVMs report scheduling conflicts</li>
          <li>Adjust call routing rules based on staff preferences</li>
        </ul>

        <div class="callout callout-success">
          <strong>Success Criteria:</strong> Within 30 days, target 95%+ booking accuracy, 90%+ call logging success, and 80%+ staff satisfaction with integrated workflows. Most issues stem from incomplete field mapping or blocked time configuration - both easily corrected.
        </div>
      `,
    },
    {
      title: "ROI of PIMS-Phone Integration",
      content: `
        <p>For a 2-3 DVM practice implementing full PIMS-phone integration:</p>

        <h3>Time Savings Calculation</h3>

        <table>
          <thead>
            <tr>
              <th>Manual Process</th>
              <th>Time Saved Per Occurrence</th>
              <th>Daily Occurrences</th>
              <th>Annual Hours Saved</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Appointment Scheduling</td>
              <td>4.5 minutes (avg)</td>
              <td>25</td>
              <td>469 hours</td>
            </tr>
            <tr>
              <td>Call Note Logging</td>
              <td>4 minutes (avg)</td>
              <td>50</td>
              <td>833 hours</td>
            </tr>
            <tr>
              <td>Patient History Lookup</td>
              <td>3 minutes (avg)</td>
              <td>30</td>
              <td>375 hours</td>
            </tr>
            <tr>
              <td>Double-Booking Resolution</td>
              <td>10 minutes (avg)</td>
              <td>0.4 (2/week)</td>
              <td>42 hours</td>
            </tr>
            <tr>
              <td><strong>Total Annual Savings</strong></td>
              <td></td>
              <td></td>
              <td><strong>1,719 hours (0.83 FTE)</strong></td>
            </tr>
          </tbody>
        </table>

        <p><strong>Financial Value:</strong> 1,719 hours × $30/hour (avg CSR cost) = <strong>$51,570 annual savings</strong></p>

        <h3>Additional Benefits</h3>

        <ul>
          <li><strong>Reduced Scheduling Errors:</strong> From 5-8% to <1% = prevents 125-200 errors annually × 20 minutes resolution time = 42-67 hours saved = $1,260-$2,010/year</li>
          <li><strong>Improved Client Experience:</strong> Screen pop with patient context increases client satisfaction (81% positive feedback) → estimated 5% retention improvement = 100 clients × $1,850 LTV = $185,000 value</li>
          <li><strong>After-Hours Appointment Capture:</strong> Automated booking from answering service without next-day manual entry = 31 appointments/month × 12 months × 5 minutes saved = 31 hours/year = $930/year</li>
        </ul>

        <h3>Total ROI Calculation</h3>

        <p><strong>Annual Benefits:</strong></p>
        <ul>
          <li>Staff time savings: $51,570</li>
          <li>Error reduction: $1,635 (midpoint)</li>
          <li>Client retention improvement: $185,000 (5-year LTV impact: $37,000 annually)</li>
          <li>After-hours efficiency: $930</li>
          <li><strong>Total: $91,135/year</strong></li>
        </ul>

        <p><strong>Integration Costs:</strong></p>
        <ul>
          <li>Setup/configuration: $1,200 (one-time)</li>
          <li>Ongoing integration fees: $99-$199/month ($1,188-$2,388/year)</li>
          <li><strong>Year 1 Total: $2,388-$3,588</strong></li>
        </ul>

        <p><strong>Net Gain (Year 1):</strong> $87,547-$88,947 | <strong>ROI:</strong> 2,456-3,726%</p>

        <div class="callout callout-info">
          <strong>Payback Period:</strong> 10-14 days based on time savings alone. Client retention benefits amplify returns over 3-5 year timeframe.
        </div>
      `,
    },
  ],
  faqs: [
    {
      question: "How long does PIMS-phone integration take to implement?",
      answer:
        "Timeline varies by platform complexity: Tier 1 PIMS (Cornerstone, eVetPractice): 3-5 business days for basic integration (appointment booking, call logging). Add 3-5 days for advanced features (screen pop, automated reminders). Tier 2 PIMS (AVImark, Impromed): 5-7 days for on-premise connector installation and configuration. 3-5 days for cloud-based versions. Limited API PIMS (Shepherd, RxWorks): 10-14 days for workaround solutions. May require manual processes for some functions. Actual timeline breakdown: Day 1-2 (API credential configuration), Day 3-4 (Field mapping and rule setup), Day 5-7 (Testing in sandbox environment), Day 8-10 (Production launch and monitoring). Most delays come from slow API credential approval by PIMS vendor, not technical configuration.",
    },
    {
      question: "What happens if the integration breaks or stops syncing?",
      answer:
        'Modern integrations have redundancy and monitoring: Real-time alerts: Integration partners monitor API health 24/7. If sync stops, you receive email/SMS notification within 5-10 minutes. Automatic retry: Temporary API outages (PIMS server maintenance) trigger automatic retry every 2-3 minutes until connection restored. Most resolve within 30 minutes. Fallback mode: If extended outage (>30 minutes), system switches to manual entry mode. Phone system queues appointments for later sync once API restored. No lost bookings. Monthly uptime: Target 99.5%+ (expect 1-2 brief interruptions per year, typically during PIMS software updates). Support response: Integration partners provide 24/7 technical support. Average resolution time: 2-4 hours for critical issues, 24 hours for non-urgent problems. Preventive monitoring: Schedule quarterly "health checks" to test all integration endpoints and prevent issues before they impact operations.',
    },
    {
      question:
        "Can I integrate with multiple systems (answering service + phone system + PIMS)?",
      answer:
        "Yes, modern APIs support multi-system integration: Common architecture: PIMS (Cornerstone) ← API → Integration Hub (PetDesk) ← API → Multiple endpoints (Weave phone system, ODIS AI answering service, client mobile app). Data flow: Client calls ODIS AI after-hours → AI books appointment via PIMS API → Appointment appears in Cornerstone immediately → PetDesk sends confirmation SMS → Weave phone system logs call notes. Setup complexity: Each additional system adds 2-3 days to implementation timeline. Cost: Integration hub platforms (PetDesk, Weave) typically charge single fee covering multiple connected systems. Example: PetDesk $199/month includes PIMS integration, SMS platform, mobile app, and up to 3 third-party connections (answering service, VoIP, online booking widget). Best practice: Choose integration hub with broadest compatibility to avoid vendor lock-in and simplify management.",
    },
    {
      question:
        "Will integration work if we have on-premise (local server) PIMS instead of cloud-based?",
      answer:
        "Yes, but requires additional setup: On-premise integration methods: (1) Database Connector Software - install lightweight application on local PIMS server. Acts as API bridge between local database and cloud phone system. Requires: server admin access, firewall configuration to allow outbound HTTPS connections, static IP or VPN for secure communication, (2) VPN Tunnel - create secure connection between local network and integration partner. More complex but enables real-time bidirectional sync. Setup timeline: On-premise integrations take 5-10 days vs. 3-5 days for cloud PIMS due to: IT coordination for server access and firewall rules, database connector installation and testing, network security review and approval. Performance: Local database connectors add 1-3 second latency to API calls (vs. instant for cloud). Generally imperceptible to users. Cost: Some integration partners charge $50-$100/month premium for on-premise support due to added technical complexity. Recommendation: If planning PIMS migration to cloud within 12-24 months, implement cloud-ready integration now to avoid double setup work.",
    },
    {
      question:
        "Does PIMS integration compromise data security or HIPAA compliance?",
      answer:
        "Properly implemented integrations maintain HIPAA compliance: Security measures: (1) Encrypted transmission - all data transfers use TLS 1.2+ encryption (same as online banking), (2) OAuth 2.0 authentication - industry-standard authorization preventing unauthorized access, (3) Role-based access control - integration partners only access fields required for functionality (appointment data, yes; medical notes, no unless explicitly configured), (4) Audit logs - every API call logged with timestamp, user, and action for compliance review. Compliance requirements: Ensure integration partner signs Business Associate Agreement (BAA) acknowledging HIPAA obligations. Verify partner maintains SOC 2 Type II certification (annual third-party security audit). Review data retention policies - how long does partner store call recordings, transcripts? Best practice: Enable minimum necessary access - grant phone system read/write for appointments and demographics only. Medical records access typically unnecessary for scheduling workflows. Annual audit: Review integration access logs quarterly to identify unusual patterns or unauthorized access attempts. Most PIMS vendors provide API activity reports.",
    },
    {
      question:
        "What if I want to switch PIMS platforms - will I have to redo all integration work?",
      answer:
        "Switching PIMS requires reconfiguration but not complete restart: Migration timeline: 5-10 days to reconfigure integration for new PIMS (similar to original setup). Data continuity: Integration partners maintain historical call logs, appointment records for 12-24 months even when switching PIMS. No lost data. Vendor-agnostic partners (recommended): Choose integration partners with broad PIMS compatibility (ODIS AI, Weave, PetDesk support 15-20+ PIMS platforms). Enables seamless PIMS migration without changing phone system. Avoid: PIMS vendor-specific solutions (e.g., IDEXX-only phone systems). Creates vendor lock-in and forces complete replacement when switching PIMS. Cost: Most integration partners charge $0-$500 setup fee for PIMS migration (reconfiguration). No termination penalties if staying with same partner. Best practice: During PIMS evaluation, confirm your phone/answering service integration partner supports the new platform BEFORE committing. Prevents expensive surprise incompatibility.",
    },
  ],
  productTieIn: {
    title: "ODIS AI: Seamless PIMS Integration for Automated Workflows",
    description:
      "Manual appointment entry and call logging waste 1,500+ staff hours annually while introducing errors and frustrating clients. ODIS AI integrates natively with all major PIMS platforms (Cornerstone, eVetPractice, AVImark, Impromed, and 15+ others) to automate scheduling, logging, and client communication without double-entry.",
    features: [
      "Native integration with Cornerstone, eVetPractice, AVImark, Impromed, Shepherd, and 15+ other PIMS platforms",
      "Books appointments directly in PIMS with real-time availability checking - zero manual entry required",
      "Automatically logs all call details, voicemail transcripts, and conversation summaries in patient records",
      "Screen pop integration displays patient context before calls are answered for personalized greetings",
      "Automated SMS/email confirmations sent immediately after appointment booking through PIMS data sync",
      "Eliminates double-booking through single source of truth - phone system and PIMS always synchronized",
      "Reduces CSR scheduling time from 5 minutes to 30 seconds per appointment (90% efficiency gain)",
      "$199/month flat rate includes full PIMS integration, unlimited calls, and 24/7 automated booking",
    ],
  },
  relatedResources: [
    "reception-desk-optimization",
    "virtual-vet-receptionist",
    "telephone-answering-service",
    "phone-system-roi",
  ],
};
