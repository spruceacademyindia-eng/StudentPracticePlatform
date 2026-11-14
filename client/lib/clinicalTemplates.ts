export interface ClinicalDischargeForm {
  preset: string;
  title: string;
  hospitalName: string;
  dateOfService: string;
  admitDate: string;
  dischargeDate: string;
  admittingDiagnosis: string;
  dischargeDiagnosis: string;
  secondaryDiagnoses: string;
  attendingMD: string;
  consultations: string;
  labsImaging: string;
  cardiacEcho: string;
  cxr: string;
  labPanels: string;
  hospitalCourse: string;
  mode: 'BOTH' | 'PRACTICE' | 'CHALLENGE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  targetWPM: number;
  minimumAccuracy: number;
}

export const CLINICAL_PRESETS: Record<string, Partial<ClinicalDischargeForm>> = {
  orthopedic_spine: {
    preset: 'orthopedic_spine',
    title: 'Clinical Discharge Summary — Spinal Stenosis & Decubitus Ulcer',
    hospitalName: 'Ace Discharge Summary',
    dateOfService: '',
    admitDate: '',
    dischargeDate: '',
    admittingDiagnosis: 'bilateral leg weakness, UTI',
    dischargeDiagnosis: 'severe spinal stenosis, bilateral gluteal decubitus ulcer, stage II, UTI',
    secondaryDiagnoses: 'hyponatremia, diastolic heart failure',
    attendingMD: 'Dr. XXXXX',
    consultations: 'none',
    labsImaging: `CT Scan of head without contrast: no acute intracranial abnormality.
CT scan of lumbar spine: There is extensive spondylosis with multilevel prominent osteophytes and disc space narrowing. There is also facet arthropathy. Compression fracture are seen at T12 and L1. There is approximately 20% ant. Wedge compression at both levels. The chronicity is uncertain although there is a fracture line transverse the ant. Superior endplate of L1 suggesting of fracture fragments.`,
    cardiacEcho: 'EF 75%, normal left ventricular wall thickness with normal left ventricular size and systolic function. Moderately dilated left atrium. Heavy mitral annular calcification is present. Cannot exclude prostatic mitral valve. Clinical correlation is needed. Mild to moderate tricuspid regurgitation with a calculated RSVP of 48 mmHG.',
    cxr: `CXR: 1/9: lungs are hypoventilated without pneumothorax, opacities overlying both lower lobes is consistent to small to moderate bilateral effusions with underlying atelectasis and/or infiltrate, large greater that right.
CXR: 1/6: heart is enlarged, moderate right pleural effusion is present, small left pleural effusion is present, and findings suggestive of congestive heart failure.
Echo: EF 75%, normal left ventricular wall thickness with normal left ventricular size and systolic function. Moderately dilated left atrium. Heavy mitral annular calcification is present. Can not exclude prostatic mitral valve. Clinical correlation is needed.`,
    labPanels: `Labs: CBC: 11.8/10.1/32.4/186
BMP: 129/4.1/91/29/17/1.3, albumin 2.6
Urine culture: S. Aureus, Coagulase negative`,
    hospitalCourse: `Patient admitted for acute onset of bilateral leg weakness, UTI and bilateral gluteal decubitus ulcer.
For bilateral leg weakness: CT scan of head and lumbar spine reports as above. Patient has several spinal stenosis and facet diseases that prevent her from walking anymore. Family declined further surgery intervention and agrees with disposition to skilled nursing facility.`,
    mode: 'BOTH',
    difficulty: 'HARD',
    targetWPM: 35,
    minimumAccuracy: 85,
  },

  cardiology_acs: {
    preset: 'cardiology_acs',
    title: 'Inpatient Cardiology Discharge Summary — ACS & Drug-Eluting Stent',
    hospitalName: 'Cardiovascular Care Discharge Summary',
    dateOfService: '',
    admitDate: '',
    dischargeDate: '',
    admittingDiagnosis: 'acute substernal chest discomfort, diaphoresis',
    dischargeDiagnosis: 'acute coronary syndrome, non-ST elevation myocardial infarction, CAD status-post PCI',
    secondaryDiagnoses: 'essential hypertension, hyperlipidemia, type 2 diabetes mellitus',
    attendingMD: 'Dr. Marcus Vance, FACC',
    consultations: 'Interventional Cardiology, Clinical Nutrition',
    labsImaging: `Coronary Angiography: 90% focal stenosis of mid-LAD treated successfully with 3.0 x 18 mm drug-eluting stent. TIMI-3 flow restored.
Transthoracic Echocardiogram: LVEF 50%, mild anteroseptal hypokinesis. No mural thrombus.`,
    cardiacEcho: 'Ejection fraction estimated at 50% with preserved right ventricular systolic function. Normal valvular structure without hemodynamically significant regurgitation.',
    cxr: `CXR: clear lung fields without focal consolidation, pneumothorax, or vascular congestion. Cardiac silhouette within normal limits.`,
    labPanels: `Labs: Peak Troponin-I: 2.84 ng/mL
CBC: 14.2/12.8/38.2/210
BMP: 138/4.2/102/24/18/0.92, glucose 142
Lipid Panel: Total cholesterol 228, LDL 146, HDL 38, Triglycerides 220`,
    hospitalCourse: `The patient presented with acute ischemic symptoms. Cardiac catheterization demonstrated critical mid-LAD obstruction requiring percutaneous coronary intervention. Post-procedure recovery remained uneventful without recurrent angina or puncture site hematoma. Discharge medications initiated include dual antiplatelet therapy with aspirin and clopidogrel, high-intensity atorvastatin, and carvedilol. Follow-up scheduled in cardiology clinic.`,
    mode: 'BOTH',
    difficulty: 'HARD',
    targetWPM: 35,
    minimumAccuracy: 90,
  },

  pulmonology_copd: {
    preset: 'pulmonology_copd',
    title: 'Pulmonary Medicine Discharge Summary — Severe COPD Exacerbation',
    hospitalName: 'Pulmonary & Critical Care Discharge Summary',
    dateOfService: '',
    admitDate: '',
    dischargeDate: '',
    admittingDiagnosis: 'acute dyspnea on exertion, purulent sputum production, hypoxemia',
    dischargeDiagnosis: 'severe acute exacerbation of chronic obstructive pulmonary disease, community-acquired bacterial bronchitis',
    secondaryDiagnoses: 'tobacco use disorder 40 pack-years, pulmonary hypertension, cor pulmonale',
    attendingMD: 'Dr. Elena Rostova, FCCP',
    consultations: 'Respiratory Therapy, Physical Medicine & Rehabilitation',
    labsImaging: `High-Resolution CT Chest: Severe centrilobular emphysema with bronchial wall thickening. No acute pulmonary thromboembolism.
Arterial Blood Gas on Room Air: pH 7.34, PaCO2 54 mmHg, PaO2 58 mmHg, HCO3 30 mEq/L, indicating chronic compensated respiratory acidosis with acute hypoxemia.`,
    cardiacEcho: 'Right ventricular dilation with systolic flattening of the interventricular septum, consistent with moderate pulmonary arterial hypertension. Calculated pulmonary systolic pressure 52 mmHg.',
    cxr: `CXR: 1/14: Hyperinflated lung fields with flattened diaphragms and increased retrosternal airspace. Patchy peribronchial opacities at bilateral lung bases without frank consolidation.`,
    labPanels: `Labs: CBC: WBC 14.6 with 82% neutrophils, Hemoglobin 16.2, Hematocrit 49.1%, Platelets 265
BMP: 139/4.0/98/31/16/0.85
Sputum Gram Stain: Heavy gram-negative diplococci; culture positive for Moraxella catarrhalis.`,
    hospitalCourse: `The patient was admitted with acute respiratory distress secondary to infectious COPD exacerbation. Promptly initiated on systemic intravenous corticosteroids, nebulized bronchodilators, and targeted antimicrobial therapy with azithromycin and ceftriaxone. Supplemental oxygen was titrated to maintain saturation between 88% and 92%. Successfully weaned to room air and ambulatory pulmonary rehab protocol established.`,
    mode: 'BOTH',
    difficulty: 'HARD',
    targetWPM: 30,
    minimumAccuracy: 88,
  },
};

/**
 * Compiles a structured clinical discharge form into the authentic hospital text format
 */
export function compileDischargeSummaryText(form: Partial<ClinicalDischargeForm>): string {
  const sections: string[] = [];

  // 1. Document Title (Starts directly with Discharge Summary)
  sections.push('DISCHARGE SUMMARY:');

  // 2. Encounter Metadata
  const metaLines: string[] = [
    `Date of Service: ${form.dateOfService || ''}`.trim(),
    `Admit Date: ${form.admitDate || ''}`.trim(),
    `Discharge Date: ${form.dischargeDate || ''}`.trim(),
  ];
  sections.push(metaLines.join('\n'));

  // 5. Diagnoses
  if (form.admittingDiagnosis?.trim()) {
    sections.push(`Admitting Diagnosis: ${form.admittingDiagnosis.trim()}`);
  }

  if (form.dischargeDiagnosis?.trim()) {
    sections.push(`Discharge diagnosis/Discharge condition: ${form.dischargeDiagnosis.trim()}`);
  }

  if (form.secondaryDiagnoses?.trim()) {
    sections.push(`Secondary Diagnoses: ${form.secondaryDiagnoses.trim()}`);
  }

  // 6. Care Team
  if (form.attendingMD?.trim()) {
    sections.push(`Attending MD: ${form.attendingMD.trim()}`);
  }

  if (form.consultations?.trim()) {
    sections.push(`Consultations: ${form.consultations.trim()}`);
  }

  // 7. Diagnostic Findings & Labs
  if (form.labsImaging?.trim()) {
    sections.push(`Labs/Imaging: ${form.labsImaging.trim()}`);
  }

  if (form.cardiacEcho?.trim()) {
    sections.push(`Cardiac echo: ${form.cardiacEcho.trim()}`);
  }

  if (form.cxr?.trim()) {
    sections.push(form.cxr.trim());
  }

  if (form.labPanels?.trim()) {
    sections.push(form.labPanels.trim());
  }

  // 8. Hospital Course
  if (form.hospitalCourse?.trim()) {
    sections.push(`Hospital Course\n${form.hospitalCourse.trim()}`);
  }

  return sections.join('\n\n');
}

/**
 * Checks whether a given passage is a clinical discharge summary
 */
export function isDischargeSummaryContent(title: string = '', content: string = ''): boolean {
  const titleLower = title.toLowerCase();
  return (
    titleLower.includes('discharge summary') ||
    content.includes('DISCHARGE SUMMARY:') ||
    content.includes('Admitting Diagnosis:') ||
    content.includes('Discharge diagnosis/Discharge condition:')
  );
}

