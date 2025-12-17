/**
 * IDEXX Vital Signs Auto-fill Utility
 *
 * Monitors patient notes for vital signs mentions and automatically
 * extracts + populates the vital signs form fields
 */

import { getSupabaseClient, logger } from '@odis-ai/extension-shared';

const odisLogger = logger.child('[ODIS]');

interface VitalSigns {
  temperature?: number;
  temperature_unit?: 'F' | 'C';
  pulse?: number;
  respiration?: number;
  weight?: number;
  weight_unit?: 'kg' | 'lb' | 'g' | 'oz';
  confidence?: number;
}

interface ExtractionResult {
  success: boolean;
  vitals: VitalSigns;
  vital_signs_id?: string;
  error?: string;
}

/**
 * Extract vitals from notes text using edge function
 */
const extractVitalsFromNotes = async (
  notesText: string,
  caseId?: string,
  consultationId?: string,
): Promise<ExtractionResult> => {
  const supabase = getSupabaseClient();

  odisLogger.info('Extracting vitals from notes...', { notesText: notesText.substring(0, 100) });

  try {
    const { data, error } = await supabase.functions.invoke('extract-vitals', {
      body: {
        notes_text: notesText,
        case_id: caseId,
        consultation_id: consultationId,
      },
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }

    odisLogger.info('✅ Vitals extracted successfully', { data });

    return {
      success: true,
      vitals: data.vitals,
      vital_signs_id: data.vital_signs_id,
    };
  } catch (error) {
    odisLogger.error('❌ Failed to extract vitals', { error });
    return {
      success: false,
      vitals: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Find vital signs form inputs in the DOM
 * Based on the HTML structure from the screenshot
 */
const findVitalSignsInputs = (): {
  temperature?: HTMLInputElement;
  pulse?: HTMLInputElement;
  respiration?: HTMLInputElement;
  weight?: HTMLInputElement;
  weightUnit?: HTMLSelectElement;
} => {
  // Temperature input: input[name="temperature"]
  const temperature = document.querySelector<HTMLInputElement>('input[name="temperature"]');

  // Pulse input: input[name="pulse"]
  const pulse = document.querySelector<HTMLInputElement>('input[name="pulse"]');

  // Respiration input: input[name="respiration"]
  const respiration = document.querySelector<HTMLInputElement>('input[name="respiration"]');

  // Weight input: input[name="weight"]
  const weight = document.querySelector<HTMLInputElement>('input[name="weight"]');

  // Weight unit select: select[name="weightUnit"]
  const weightUnit = document.querySelector<HTMLSelectElement>('select[name="weightUnit"]');

  odisLogger.debug('Found vital signs inputs', {
    temperature: !!temperature,
    pulse: !!pulse,
    respiration: !!respiration,
    weight: !!weight,
    weightUnit: !!weightUnit,
  });

  return {
    temperature: temperature || undefined,
    pulse: pulse || undefined,
    respiration: respiration || undefined,
    weight: weight || undefined,
    weightUnit: weightUnit || undefined,
  };
};

/**
 * Auto-fill vital signs form fields
 * Triggers Angular change detection by dispatching input/change events
 */
const autoFillVitalSigns = (vitals: VitalSigns): boolean => {
  const inputs = findVitalSignsInputs();

  if (!inputs.temperature && !inputs.pulse && !inputs.respiration) {
    odisLogger.warn('No vital signs inputs found on page');
    return false;
  }

  let filled = false;

  // Fill temperature
  if (vitals.temperature && inputs.temperature) {
    setInputValue(inputs.temperature, vitals.temperature.toString());
    odisLogger.debug('✅ Filled temperature', { temperature: vitals.temperature });
    filled = true;
  }

  // Fill pulse
  if (vitals.pulse && inputs.pulse) {
    setInputValue(inputs.pulse, vitals.pulse.toString());
    odisLogger.debug('✅ Filled pulse', { pulse: vitals.pulse });
    filled = true;
  }

  // Fill respiration
  if (vitals.respiration && inputs.respiration) {
    setInputValue(inputs.respiration, vitals.respiration.toString());
    odisLogger.debug('✅ Filled respiration', { respiration: vitals.respiration });
    filled = true;
  }

  // Fill weight
  if (vitals.weight && inputs.weight) {
    setInputValue(inputs.weight, vitals.weight.toString());
    odisLogger.debug('✅ Filled weight', { weight: vitals.weight });
    filled = true;

    // Set weight unit if provided
    if (vitals.weight_unit && inputs.weightUnit) {
      setSelectValue(inputs.weightUnit, vitals.weight_unit);
      odisLogger.debug('✅ Set weight unit', { weightUnit: vitals.weight_unit });
    }
  }

  return filled;
};

/**
 * Set input value and trigger Angular change detection
 */
const setInputValue = (input: HTMLInputElement, value: string): void => {
  // Set the value
  input.value = value;

  // Trigger events for Angular change detection
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur', { bubbles: true }));
};

/**
 * Set select value and trigger Angular change detection
 */
const setSelectValue = (select: HTMLSelectElement, value: string): void => {
  // Find matching option
  const options = Array.from(select.options);
  const matchingOption = options.find(option => option.text.trim().toLowerCase() === value.toLowerCase());

  if (matchingOption) {
    select.value = matchingOption.value;

    // Trigger events for Angular change detection
    select.dispatchEvent(new Event('change', { bubbles: true }));
    select.dispatchEvent(new Event('blur', { bubbles: true }));
  } else {
    odisLogger.warn('No matching option found for weight unit', { value });
  }
};

/**
 * Monitor notes textarea and auto-extract vitals when notes are added
 * Debounced to avoid excessive API calls
 */
const setupVitalsAutoExtraction = (caseId?: string, consultationId?: string): (() => void) => {
  odisLogger.info('Setting up vitals auto-extraction monitor');

  // Find the notes textarea
  // Based on typical IDEXX structure, look for textarea in notes section
  const notesTextarea = document.querySelector<HTMLTextAreaElement>(
    'textarea[name*="note" i], textarea[class*="note" i]',
  );

  if (!notesTextarea) {
    odisLogger.warn('Notes textarea not found - cannot setup auto-extraction');
    return () => {}; // Return no-op cleanup function
  }

  odisLogger.debug('✅ Found notes textarea', { name: notesTextarea.name || notesTextarea.className });

  let debounceTimer: number | null = null;
  let lastExtractedText = '';

  const handleNotesChange = async () => {
    const notesText = notesTextarea.value.trim();

    // Skip if notes haven't changed significantly
    if (!notesText || notesText === lastExtractedText) {
      return;
    }

    // Debounce - wait 2 seconds after user stops typing
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(async () => {
      odisLogger.debug('Notes changed, extracting vitals...');

      lastExtractedText = notesText;

      // Extract vitals
      const result = await extractVitalsFromNotes(notesText, caseId, consultationId);

      if (result.success && Object.keys(result.vitals).length > 0) {
        // Auto-fill the form
        const filled = autoFillVitalSigns(result.vitals);

        if (filled) {
          // Show success notification (you can customize this)
          showVitalsNotification('✅ Vital signs auto-filled from notes!');
        }
      }
    }, 2000); // 2 second debounce
  };

  // Listen for input changes
  notesTextarea.addEventListener('input', handleNotesChange);
  notesTextarea.addEventListener('change', handleNotesChange);

  odisLogger.info('✅ Vitals auto-extraction monitor active');

  // Return cleanup function
  return () => {
    notesTextarea.removeEventListener('input', handleNotesChange);
    notesTextarea.removeEventListener('change', handleNotesChange);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    odisLogger.info('🛑 Vitals auto-extraction monitor stopped');
  };
};

/**
 * Show a temporary notification to the user
 */
const showVitalsNotification = (message: string): void => {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  // Add to page
  document.body.appendChild(notification);

  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(400px)';
    notification.style.transition = 'all 0.3s ease-out';

    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 300);
  }, 4000);
};

/**
 * Manual extraction trigger (e.g., button click)
 */
const triggerManualVitalsExtraction = async (caseId?: string, consultationId?: string): Promise<void> => {
  // Find notes textarea
  const notesTextarea = document.querySelector<HTMLTextAreaElement>(
    'textarea[name*="note" i], textarea[class*="note" i]',
  );

  if (!notesTextarea || !notesTextarea.value.trim()) {
    showVitalsNotification('⚠️ No notes found to extract vitals from');
    return;
  }

  showVitalsNotification('🔄 Extracting vital signs...');

  const result = await extractVitalsFromNotes(notesTextarea.value, caseId, consultationId);

  if (result.success && Object.keys(result.vitals).length > 0) {
    const filled = autoFillVitalSigns(result.vitals);

    if (filled) {
      showVitalsNotification('✅ Vital signs extracted and filled!');
    } else {
      showVitalsNotification('⚠️ Vitals extracted but no form fields found');
    }
  } else {
    showVitalsNotification('⚠️ No vital signs found in notes');
  }
};

// Exports at the end (ESLint rule: import-x/exports-last)
export { extractVitalsFromNotes, autoFillVitalSigns, setupVitalsAutoExtraction, triggerManualVitalsExtraction };
