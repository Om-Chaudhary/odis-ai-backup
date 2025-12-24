import type { SOAPTemplate } from "../impl/soap-templates-storage";

export const defaultTemplates: SOAPTemplate[] = [
  {
    id: "wellness-exam",
    name: "Wellness Exam",
    category: "Routine Care",
    description: "Standard wellness examination template",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `<p>Appointment reason: Wellness examination</p>
<p><br></p>
<table align="center" border=".5" cellpadding="5" cellspacing="1" style="width:687px;">
<tbody>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>S = Subjective Information</strong></td>
</tr>
<tr>
<td>Presenting Complaint</td>
<td style="width:477px;">Wellness examination</td>
</tr>
<tr>
<td>Appetite</td>
<td style="width:477px;">wnl</td>
</tr>
<tr>
<td>Thirst</td>
<td style="width:477px;">wnl</td>
</tr>
<tr>
<td>Energy</td>
<td style="width:477px;">wnl</td>
</tr>
<tr>
<td>Urinating/Defecating</td>
<td style="width:477px;">wnl</td>
</tr>
<tr>
<td>V/D/C/S</td>
<td style="width:477px;">none</td>
</tr>
<tr>
<td>Last Dental Cleaning?</td>
<td style="width:477px;">-</td>
</tr>
<tr>
<td>Current medications</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Supplements</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Diet</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Flea Control</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Heartworm Control</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Temperament</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Indoor/Outdoor</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Who's bringing the pet in?</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>O = Objective Information</strong></td>
</tr>
<tr>
<td>Pulse</td>
<td style="width:477px;">SSFP</td>
</tr>
<tr>
<td>Respiration</td>
<td style="width:477px;">eupneic</td>
</tr>
<tr>
<td colspan="2" style="width:677px;"><p>BAR, Mucous Membranes-Pink, TPR-WNL, CRT-&lt; 2s</p><p>Behavior:</p><p>BCS - /9</p></td>
</tr>
<tr>
<td>Heart/Lung Auscultation</td>
<td style="width:477px;">No murmur or arrhythmia auscultated. Clear lung sounds in all fields</td>
</tr>
<tr>
<td>Skin</td>
<td style="width:477px;">Clean haircoat, normal skin-Free of erythema, swelling, and signs of parasites. No masses.</td>
</tr>
<tr>
<td>Oral, Nose, and Throat</td>
<td style="width:477px;"><p>Normal tongue, no masses, no lesions, healthy gingiva, clean teeth, normal dentition.</p><p>Normal nose, no discharge; normal throat palpation; no coughing, no sneezing.</p></td>
</tr>
<tr>
<td>Ears</td>
<td style="width:477px;">AU- normal and clean pinnae, otoscopic exam: AU: clean ear canals, intact tympanic membranes</td>
</tr>
<tr>
<td>Eyes</td>
<td style="width:477px;">OU- No discharge, normal clean/clear conjunctiva, and corneae, normal PLR direct and indirect, no fundic exam.</td>
</tr>
<tr>
<td>Abdominal Palpation</td>
<td style="width:477px;">Normal, pliable, no masses/pain/organomegaly</td>
</tr>
<tr>
<td>M/S</td>
<td style="width:477px;">No Atrophy or lameness, normal ambulation, well symmetrically muscled. Full normal ROM on all 4x and neck.</td>
</tr>
<tr>
<td>NEURO</td>
<td style="width:477px;">No signs of neurological deficits were noted upon cursory examination, and no proprioceptive deficits on all 4x.</td>
</tr>
<tr>
<td>Rectal</td>
<td style="width:477px;">normal perianal, no digital exam</td>
</tr>
<tr>
<td>GU</td>
<td style="width:477px;">Normal external genitalia, no discharge. No masses.</td>
</tr>
<tr>
<td>Lymph Nodes</td>
<td style="width:477px;">All peripheral lymph nodes are normal in size and symmetrical.</td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>A = Assessment of the Case</strong></td>
</tr>
<tr>
<td colspan="2" style="width:677px;"><p><br></p></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>P = Plan</strong></td>
</tr>
<tr>
<td>Treatment and Medication</td>
<td style="width:477px;"><p><br></p></td>
</tr>
<tr>
<td>Follow-up care instructions</td>
<td style="width:477px;"><p><br></p></td>
</tr>
</tbody>
</table>
<p><br></p>`,
  },
  {
    id: "recheck-visit",
    name: "Recheck Visit",
    category: "Follow-up",
    description: "Template for follow-up/recheck appointments",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `<p>Appointment reason: Recheck</p>
<p><br></p>
<table align="center" border=".5" cellpadding="5" cellspacing="1" style="width:687px;">
<tbody>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>S = Subjective Information</strong></td>
</tr>
<tr>
<td>Presenting Complaint</td>
<td style="width:477px;">Recheck for:</td>
</tr>
<tr>
<td>Progress since last visit</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Appetite</td>
<td style="width:477px;">wnl</td>
</tr>
<tr>
<td>Thirst</td>
<td style="width:477px;">wnl</td>
</tr>
<tr>
<td>Energy</td>
<td style="width:477px;">wnl</td>
</tr>
<tr>
<td>Urinating/Defecating</td>
<td style="width:477px;">wnl</td>
</tr>
<tr>
<td>V/D/C/S</td>
<td style="width:477px;">none</td>
</tr>
<tr>
<td>Current medications</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Medication compliance</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Who's bringing the pet in?</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>O = Objective Information</strong></td>
</tr>
<tr>
<td>Pulse</td>
<td style="width:477px;">SSFP</td>
</tr>
<tr>
<td>Respiration</td>
<td style="width:477px;">eupneic</td>
</tr>
<tr>
<td colspan="2" style="width:677px;"><p>BAR, Mucous Membranes-Pink, TPR-WNL, CRT-&lt; 2s</p><p>Behavior:</p><p>BCS - /9</p></td>
</tr>
<tr>
<td>Focused physical exam</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>A = Assessment of the Case</strong></td>
</tr>
<tr>
<td colspan="2" style="width:677px;"><p><br></p></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>P = Plan</strong></td>
</tr>
<tr>
<td>Treatment and Medication</td>
<td style="width:477px;"><p><br></p></td>
</tr>
<tr>
<td>Follow-up care instructions</td>
<td style="width:477px;"><p><br></p></td>
</tr>
</tbody>
</table>
<p><br></p>`,
  },
  {
    id: "emergency-consult",
    name: "Emergency Consultation",
    category: "Emergency",
    description: "Template for emergency/urgent care visits",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `<p>Appointment reason: Emergency consultation</p>
<p><br></p>
<table align="center" border=".5" cellpadding="5" cellspacing="1" style="width:687px;">
<tbody>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>S = Subjective Information</strong></td>
</tr>
<tr>
<td>Chief Complaint</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Duration of symptoms</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Onset (acute/gradual)</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Appetite</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Water intake</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Vomiting/Diarrhea</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Current medications</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Recent trauma/toxin exposure</td>
<td style="width:477px;">none reported</td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>O = Objective Information</strong></td>
</tr>
<tr>
<td>Mentation</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Pulse</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Respiration</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Temperature</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>MM/CRT</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>BCS</td>
<td style="width:477px;">/9</td>
</tr>
<tr>
<td>Physical exam findings</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Diagnostics performed</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>A = Assessment of the Case</strong></td>
</tr>
<tr>
<td colspan="2" style="width:677px;"><p>Differential diagnoses:</p><p>1. </p><p>2. </p><p>3. </p></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>P = Plan</strong></td>
</tr>
<tr>
<td>Immediate treatment</td>
<td style="width:477px;"><p><br></p></td>
</tr>
<tr>
<td>Diagnostics recommended</td>
<td style="width:477px;"><p><br></p></td>
</tr>
<tr>
<td>Hospitalization/Monitoring</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Follow-up care instructions</td>
<td style="width:477px;"><p><br></p></td>
</tr>
</tbody>
</table>
<p><br></p>`,
  },
  {
    id: "dental-procedure",
    name: "Dental Cleaning",
    category: "Procedures",
    description: "Template for dental cleaning procedures",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `<p>Appointment reason: Dental cleaning</p>
<p><br></p>
<table align="center" border=".5" cellpadding="5" cellspacing="1" style="width:687px;">
<tbody>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>S = Subjective Information</strong></td>
</tr>
<tr>
<td>Presenting Complaint</td>
<td style="width:477px;">Dental prophylaxis</td>
</tr>
<tr>
<td>Previous dental history</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Current medications</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>NPO since</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>O = Objective Information</strong></td>
</tr>
<tr>
<td>Pre-anesthetic exam</td>
<td style="width:477px;">BAR, MM pink, CRT &lt;2s, normal cardiopulmonary exam</td>
</tr>
<tr>
<td>Pre-anesthetic bloodwork</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Anesthetic protocol</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Dental findings</td>
<td style="width:477px;"><p>Grade: /4 periodontal disease</p><p>Calculus:</p><p>Gingivitis:</p><p>Missing teeth:</p><p>Mobile teeth:</p><p>Fractured teeth:</p></td>
</tr>
<tr>
<td>Procedures performed</td>
<td style="width:477px;"><p>- Full mouth scaling and polishing</p><p>- Dental radiographs</p><p>- Extractions (if any):</p></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>A = Assessment of the Case</strong></td>
</tr>
<tr>
<td colspan="2" style="width:677px;"><p>Periodontal disease, grade /4</p></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>P = Plan</strong></td>
</tr>
<tr>
<td>Post-operative medications</td>
<td style="width:477px;"><p><br></p><p>DRUG COUNSELING DONE (a digital copy e-mailed to owner)</p></td>
</tr>
<tr>
<td>Home care recommendations</td>
<td style="width:477px;"><p>- Daily tooth brushing</p><p>- Dental diet/treats</p><p>- Recheck in 2 weeks for suture removal (if applicable)</p></td>
</tr>
<tr>
<td>Follow-up</td>
<td style="width:477px;">Annual dental exam and cleaning as needed</td>
</tr>
</tbody>
</table>
<p><br></p>`,
  },
  {
    id: "vaccination-visit",
    name: "Vaccination Visit",
    category: "Routine Care",
    description: "Template for vaccination appointments",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `<p>Appointment reason: Vaccinations</p>
<p><br></p>
<table align="center" border=".5" cellpadding="5" cellspacing="1" style="width:687px;">
<tbody>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>S = Subjective Information</strong></td>
</tr>
<tr>
<td>Presenting Complaint</td>
<td style="width:477px;">Vaccination appointment</td>
</tr>
<tr>
<td>Appetite</td>
<td style="width:477px;">wnl</td>
</tr>
<tr>
<td>Energy</td>
<td style="width:477px;">wnl</td>
</tr>
<tr>
<td>Any recent illness</td>
<td style="width:477px;">none reported</td>
</tr>
<tr>
<td>Previous vaccine reactions</td>
<td style="width:477px;">none reported</td>
</tr>
<tr>
<td>Current medications</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>O = Objective Information</strong></td>
</tr>
<tr>
<td colspan="2" style="width:677px;"><p>BAR, Mucous Membranes-Pink, TPR-WNL, CRT-&lt; 2s</p><p>Behavior: friendly</p><p>BCS - /9</p></td>
</tr>
<tr>
<td>Brief physical exam</td>
<td style="width:477px;">Patient is healthy and suitable for vaccination</td>
</tr>
<tr>
<td>Vaccinations administered</td>
<td style="width:477px;"><p><br></p></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>A = Assessment of the Case</strong></td>
</tr>
<tr>
<td colspan="2" style="width:677px;"><p>Healthy patient, vaccinations current</p></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>P = Plan</strong></td>
</tr>
<tr>
<td>Post-vaccination monitoring</td>
<td style="width:477px;">Monitor for reactions (swelling, lethargy, vomiting) - contact clinic if any concerns</td>
</tr>
<tr>
<td>Next vaccination due</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Follow-up</td>
<td style="width:477px;">Return for next scheduled vaccinations</td>
</tr>
</tbody>
</table>
<p><br></p>`,
  },
  {
    id: "post-surgical",
    name: "Post-Surgical Follow-up",
    category: "Follow-up",
    description: "Template for post-operative recheck visits",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `<p>Appointment reason: Post-surgical recheck</p>
<p><br></p>
<table align="center" border=".5" cellpadding="5" cellspacing="1" style="width:687px;">
<tbody>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>S = Subjective Information</strong></td>
</tr>
<tr>
<td>Surgical procedure</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Date of surgery</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Post-op progress</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Appetite</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Pain level</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Activity level</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>E-collar compliance</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Medications given</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>O = Objective Information</strong></td>
</tr>
<tr>
<td colspan="2" style="width:677px;"><p>BAR, Mucous Membranes-Pink, TPR-WNL</p><p>BCS - /9</p></td>
</tr>
<tr>
<td>Incision assessment</td>
<td style="width:477px;"><p>Appearance:</p><p>Swelling:</p><p>Discharge:</p><p>Suture integrity:</p></td>
</tr>
<tr>
<td>Pain assessment</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Focused exam</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>A = Assessment of the Case</strong></td>
</tr>
<tr>
<td colspan="2" style="width:677px;"><p>Post-operative day # following [procedure]</p><p>Healing:</p></td>
</tr>
<tr>
<td colspan="2" style="background-color:#bbbbbb;width:677px;"><strong>P = Plan</strong></td>
</tr>
<tr>
<td>Suture removal</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Medication changes</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Activity restrictions</td>
<td style="width:477px;"><br></td>
</tr>
<tr>
<td>Follow-up</td>
<td style="width:477px;"><br></td>
</tr>
</tbody>
</table>
<p><br></p>`,
  },
];
