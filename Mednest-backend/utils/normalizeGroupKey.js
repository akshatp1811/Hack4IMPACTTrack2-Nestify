/**
 * Alias lookup map — maps common variants of scan/lab/test names
 * to a normalized key used for smart grouping queries.
 *
 * The ML service (Python) will also maintain a copy of this map.
 * Keep both in sync when adding new aliases.
 */
const ALIASES = {
  // ── X-Ray variants ──
  'chest x-ray': 'chest_xray',
  'x ray chest': 'chest_xray',
  'cxr': 'chest_xray',
  'chest xray': 'chest_xray',

  // ── Ultrasound variants ──
  'usg abdomen': 'usg_abdomen',
  'ultrasound abdomen': 'usg_abdomen',
  'abdominal ultrasound': 'usg_abdomen',
  'usg upper abdomen': 'usg_abdomen',

  // ── ECG variants ──
  'ecg': 'ecg',
  'ekg': 'ecg',
  'electrocardiogram': 'ecg',
  'electrocardiograph': 'ecg',

  // ── MRI variants ──
  'mri brain': 'mri_brain',
  'brain mri': 'mri_brain',
  'mri head': 'mri_brain',

  // ── CT variants ──
  'ct chest': 'ct_chest',
  'chest ct': 'ct_chest',
  'hrct chest': 'ct_chest',

  // ── Lab: CBC ──
  'complete blood count': 'cbc',
  'cbc': 'cbc',
  'full blood count': 'cbc',

  // ── Lab: Lipid Profile ──
  'lipid profile': 'lipid_profile',
  'lipid panel': 'lipid_profile',
  'cholesterol test': 'lipid_profile',

  // ── Lab: Thyroid ──
  'thyroid panel': 'thyroid_panel',
  'thyroid profile': 'thyroid_panel',
  'tft': 'thyroid_panel',
  'thyroid function test': 'thyroid_panel',

  // ── Lab: Blood Glucose ──
  'blood glucose': 'blood_glucose',
  'fasting blood sugar': 'blood_glucose',
  'fbs': 'blood_glucose',
  'rbs': 'blood_glucose',
  'hba1c': 'hba1c',

  // ── Lab: Liver ──
  'liver function test': 'lft',
  'lft': 'lft',

  // ── Lab: Kidney ──
  'kidney function test': 'kft',
  'renal function test': 'kft',
  'kft': 'kft',
  'rft': 'kft',
}

/**
 * Normalizes a subType string into a consistent groupKey.
 *
 * @param {string} subType — raw subType from user input or ML output
 * @returns {string|null} — normalized key (e.g. "chest_xray", "cbc")
 */
function normalizeGroupKey(subType) {
  if (!subType) return null
  const key = subType.toLowerCase().trim()
  return ALIASES[key] || key.replace(/\s+/g, '_')
}

module.exports = normalizeGroupKey
