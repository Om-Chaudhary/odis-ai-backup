import { scrapeClientPhoneFromPage } from '../../utils/dom/client-dom-scraper';
import { fetchClientPhoneNumber } from '../../utils/extraction/client-fetcher';
import { fetchCurrentConsultationData } from '../../utils/extraction/consultation-fetcher';
import { normalizePhoneNumber, isValidE164PhoneNumber } from '../../utils/formatting/phone-formatter';
import { scheduleDischargeCall } from '../../utils/sync/schedule-call-api';
import {
  transformConsultationToCallRequest,
  validateConsultationData,
} from '../../utils/transformation/consultation-transformer';
import { logger, now, addDays, formatDateTimeLocal, trackEvent } from '@odis-ai/extension/shared';
import { useState } from 'react';
import type { IdexxConsultationPageData } from '../../types';

const odisLogger = logger.child('[ODIS]');

/**
 * Enforce 12pm-5pm time constraint for scheduled calls
 * If scheduled time is outside this range, adjust to nearest valid time
 */
const enforceBusinessHours = (date: Date): Date => {
  const constrainedDate = new Date(date);
  const hours = constrainedDate.getHours();

  // If before 12pm, set to 12pm
  if (hours < 12) {
    constrainedDate.setHours(12, 0, 0, 0);
  }
  // If after 5pm (17:00), set to next day at 12pm
  else if (hours >= 17) {
    constrainedDate.setDate(constrainedDate.getDate() + 1);
    constrainedDate.setHours(12, 0, 0, 0);
  }

  return constrainedDate;
};

interface ScheduleDischargeCallButtonProps {
  /** If true, renders as a compact menu button. If false, renders as a standalone floating button */
  menuStyle?: boolean;
}

/**
 * Schedule Discharge Call Button
 * Appears in IDEXX consultation pages to schedule follow-up calls via VAPI
 */
const ScheduleDischargeCallButton = ({ menuStyle = false }: ScheduleDischargeCallButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [consultationData, setConsultationData] = useState<IdexxConsultationPageData | null>(null);
  const [scheduledFor, setScheduledFor] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  // Editable fields for missing data
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [phoneType, setPhoneType] = useState<'mobile' | 'home' | 'work' | 'other' | null>(null);

  // Initialize default scheduled time (2 days from now, constrained to 12pm-5pm)
  const getDefaultScheduledTime = () => {
    const date = addDays(now(), 2);
    date.setHours(14, 0, 0, 0); // Default to 2pm

    // Enforce business hours
    const constrainedDate = enforceBusinessHours(date);
    return formatDateTimeLocal(constrainedDate);
  };

  /**
   * Wait for phone number to populate with retries
   */
  const waitForPhoneNumber = async (
    data: IdexxConsultationPageData,
    maxRetries = 3,
    delayMs = 1000,
  ): Promise<{ phone: string; type: 'mobile' | 'home' | 'work' | 'other' | null }> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Try consultation data first
      const phoneNumber =
        data.client.phone || data.client.mobilePhone || data.client.homePhone || data.client.workPhone || '';
      let detectedPhoneType: 'mobile' | 'home' | 'work' | 'other' | null = null;

      if (phoneNumber) {
        if (data.client.mobilePhone === phoneNumber) detectedPhoneType = 'mobile';
        else if (data.client.homePhone === phoneNumber) detectedPhoneType = 'home';
        else if (data.client.workPhone === phoneNumber) detectedPhoneType = 'work';
        else detectedPhoneType = 'other';

        return { phone: normalizePhoneNumber(phoneNumber), type: detectedPhoneType };
      }

      // Try client API
      if (data.client.id) {
        try {
          const clientPhoneResult = await fetchClientPhoneNumber(data.client.id);
          if (clientPhoneResult.phone) {
            return {
              phone: normalizePhoneNumber(clientPhoneResult.phone),
              type: clientPhoneResult.type,
            };
          }

          // Fallback: DOM scraping
          const scrapedResult = await scrapeClientPhoneFromPage(data.client.id);
          if (scrapedResult.phone) {
            return {
              phone: normalizePhoneNumber(scrapedResult.phone),
              type: scrapedResult.type,
            };
          }
        } catch (err) {
          odisLogger.error(`❌ Failed to fetch phone (attempt ${attempt + 1})`, { attempt: attempt + 1, error: err });
        }
      }

      // Wait before retry (except on last attempt)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // No phone found after all retries
    return { phone: '', type: null };
  };

  const handleOpenModal = async () => {
    setIsLoading(true);
    setError(null);
    setWarnings([]);
    setSuccess(false);

    try {
      const data = await fetchCurrentConsultationData();

      if (!data) {
        throw new Error('Failed to fetch consultation data. Make sure you are on a consultation page.');
      }

      // Validate data
      const validation = validateConsultationData(data);
      if (!validation.valid) {
        throw new Error(`Invalid consultation data: ${validation.errors.join(', ')}`);
      }

      setConsultationData(data);

      // Pre-fill editable fields
      const fullName = `${data.client.firstName || ''} ${data.client.lastName || ''}`.trim();
      setOwnerName(fullName);

      // Wait for phone number to populate
      const { phone: phoneNumber, type: detectedPhoneType } = await waitForPhoneNumber(data);

      setOwnerPhone(phoneNumber);
      setPhoneType(detectedPhoneType);

      // Check if all required fields are present
      const hasAllFields = fullName.trim() !== '' && phoneNumber !== '' && isValidE164PhoneNumber(phoneNumber);

      if (hasAllFields) {
        // Auto-schedule without showing modal
        // Calculate schedule date (2 days from now, constrained to 12pm-5pm)
        const scheduleDate = enforceBusinessHours(addDays(now(), 2));

        // Create call request
        const updatedData: IdexxConsultationPageData = {
          ...data,
          client: {
            ...data.client,
            firstName: data.client.firstName || '',
            lastName: data.client.lastName || '',
            phone: phoneNumber,
          },
        };

        const notes = `Consultation #${data.consultation.id} - ${data.consultation.reason}`;
        const callRequest = transformConsultationToCallRequest(updatedData, scheduleDate, notes);

        // Send to backend API
        const response = await scheduleDischargeCall(callRequest);

        if (!response.success) {
          // Track failed call scheduling
          await trackEvent(
            {
              event_type: 'call_scheduled',
              event_category: 'discharge',
              event_action: 'schedule',
              source: 'idexx_extension',
              patient_id: String(data.patient.id),
              success: false,
              error_message: response.error || 'Failed to schedule call',
              metadata: {
                consultation_id: data.consultation.id,
                scheduled_for: scheduleDate.toISOString(),
                auto_scheduled: true,
              },
            },
            { trackFeatureUsage: true, updateSession: true },
          );
          throw new Error(response.error || 'Failed to schedule call');
        }

        // Track successful call scheduling
        await trackEvent(
          {
            event_type: 'call_scheduled',
            event_category: 'discharge',
            event_action: 'schedule',
            source: 'idexx_extension',
            patient_id: String(data.patient.id),
            scheduled_call_id: response.data?.callId,
            success: true,
            metadata: {
              consultation_id: data.consultation.id,
              scheduled_for: scheduleDate.toISOString(),
              auto_scheduled: true,
              phone_type: detectedPhoneType,
            },
          },
          { trackFeatureUsage: true, updateSession: true },
        );

        // Show success notification
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        // Show modal for manual input
        setIsOpen(true);
        setScheduledFor(getDefaultScheduledTime());

        // Show warnings
        if (validation.warnings.length > 0) {
          setWarnings(validation.warnings);
        }
        if (!phoneNumber) {
          setWarnings(prev => [...prev, 'Phone number not found - please enter manually']);
        }

        setCustomNotes(`Consultation #${data.consultation.id} - ${data.consultation.reason}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      odisLogger.error('❌ Failed to schedule call', { error: err });

      // Show modal on error so user can try manually
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleCall = async () => {
    if (!consultationData) return;

    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields at submit time
      if (!ownerName.trim()) {
        throw new Error('Owner name is required');
      }
      if (!ownerPhone.trim()) {
        throw new Error('Owner phone number is required');
      }

      // Normalize and validate phone number
      const normalizedPhone = normalizePhoneNumber(ownerPhone);
      if (!isValidE164PhoneNumber(normalizedPhone)) {
        throw new Error(
          `Invalid phone number format. Expected +1XXXXXXXXXX (10 digits), got: ${normalizedPhone}. Please enter a valid US phone number.`,
        );
      }

      // Convert scheduledFor to Date and enforce business hours
      const scheduleDate = enforceBusinessHours(new Date(scheduledFor));
      if (isNaN(scheduleDate.getTime())) {
        throw new Error('Invalid date/time selected');
      }

      // Validate not in the past
      if (scheduleDate < now()) {
        throw new Error('Cannot schedule call in the past');
      }

      // Create updated consultation data with user-edited values
      const [firstName, ...lastNameParts] = ownerName.trim().split(' ');
      const lastName = lastNameParts.join(' ');

      const updatedData: IdexxConsultationPageData = {
        ...consultationData,
        client: {
          ...consultationData.client,
          firstName: firstName || '',
          lastName: lastName || '',
          phone: normalizedPhone, // Use normalized phone in E.164 format
        },
      };

      // Transform data
      const callRequest = transformConsultationToCallRequest(updatedData, scheduleDate, customNotes);

      odisLogger.info('Scheduling discharge call...', { callRequest });

      // Send to backend API
      const response = await scheduleDischargeCall(callRequest);

      if (!response.success) {
        // Track failed call scheduling
        await trackEvent(
          {
            event_type: 'call_scheduled',
            event_category: 'discharge',
            event_action: 'schedule',
            source: 'idexx_extension',
            patient_id: String(consultationData.patient.id),
            success: false,
            error_message: response.error || 'Failed to schedule call',
            metadata: {
              consultation_id: consultationData.consultation.id,
              scheduled_for: scheduleDate.toISOString(),
            },
          },
          { trackFeatureUsage: true, updateSession: true },
        );
        throw new Error(response.error || 'Failed to schedule call');
      }

      // Track successful call scheduling
      await trackEvent(
        {
          event_type: 'call_scheduled',
          event_category: 'discharge',
          event_action: 'schedule',
          source: 'idexx_extension',
          patient_id: String(consultationData.patient.id),
          scheduled_call_id: response.data?.callId,
          success: true,
          metadata: {
            consultation_id: consultationData.consultation.id,
            scheduled_for: scheduleDate.toISOString(),
            phone_type: phoneType,
          },
        },
        { trackFeatureUsage: true, updateSession: true },
      );

      setSuccess(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setWarnings([]);
        setConsultationData(null);
        setOwnerName('');
        setOwnerPhone('');
        setPhoneType(null);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      odisLogger.error('❌ Failed to schedule call', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setWarnings([]);
    setSuccess(false);
    setConsultationData(null);
    setOwnerName('');
    setOwnerPhone('');
    setPhoneType(null);
  };

  return (
    <>
      {/* Auto-schedule success toast */}
      {success && !isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#10b981',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            zIndex: 100001,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
          <span>✅</span>
          <span>Discharge call scheduled successfully!</span>
        </div>
      )}

      {/* Main Button - Conditional Styling */}
      {menuStyle ? (
        <button
          className="odis-unified-insert-btn"
          onClick={handleOpenModal}
          disabled={isLoading}
          title="Schedule a discharge follow-up call">
          <div className="odis-btn-content">
            <span className="odis-btn-text">{isLoading ? 'Scheduling...' : 'Schedule Discharge Call'}</span>
          </div>
        </button>
      ) : (
        <button
          onClick={handleOpenModal}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: isLoading ? '#94a3b8' : '#14b8a6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (!isLoading) e.currentTarget.style.backgroundColor = '#0d9488';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (!isLoading) e.currentTarget.style.backgroundColor = '#14b8a6';
          }}>
          {/* Phone icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{isLoading ? 'Scheduling...' : 'Schedule Discharge Call'}</span>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
          onClick={handleClose}
          onKeyDown={e => {
            if (e.key === 'Escape') handleClose();
          }}>
          <div
            role="button"
            tabIndex={0}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}>
            {/* Header */}
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                Schedule Discharge Follow-Up Call
              </h2>
              <button
                onClick={handleClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Loading State */}
              {isLoading && !consultationData && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '4px solid #e5e7eb',
                      borderTopColor: '#14b8a6',
                      borderRadius: '50%',
                      margin: '0 auto 16px',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <p style={{ color: '#6b7280', margin: 0 }}>Loading consultation data...</p>
                </div>
              )}

              {/* Warning State */}
              {warnings.length > 0 && (
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}>
                  <p style={{ margin: '0 0 8px 0', color: '#d97706', fontSize: '14px', fontWeight: '600' }}>
                    ⚠️ Missing Data
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#d97706', fontSize: '13px' }}>
                    {warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}>
                  <p style={{ margin: 0, color: '#dc2626', fontSize: '14px' }}>❌ {error}</p>
                </div>
              )}

              {/* Success State */}
              {success && (
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}>
                  <p style={{ margin: 0, color: '#16a34a', fontSize: '14px' }}>
                    ✅ Discharge call scheduled successfully!
                  </p>
                </div>
              )}

              {/* Form */}
              {consultationData && !success && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleScheduleCall();
                  }}>
                  {/* Patient Info */}
                  <div style={{ marginBottom: '20px' }}>
                    <label
                      htmlFor="patient-name"
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '6px',
                      }}>
                      Patient
                    </label>
                    <input
                      id="patient-name"
                      type="text"
                      value={consultationData.patient.name}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: '#f9fafb',
                      }}
                    />
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                      {consultationData.patient.species || 'Unknown species'} •{' '}
                      {consultationData.patient.breed || 'Unknown breed'}
                    </p>
                  </div>

                  {/* Owner Info */}
                  <div style={{ marginBottom: '20px' }}>
                    <label
                      htmlFor="owner-name"
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '6px',
                      }}>
                      Owner <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      id="owner-name"
                      type="text"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      required
                      placeholder="Enter owner name"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: ownerName ? '#f9fafb' : '#ffffff',
                      }}
                    />
                  </div>

                  {/* Phone Number */}
                  <div style={{ marginBottom: '20px' }}>
                    <label
                      htmlFor="owner-phone"
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '6px',
                      }}>
                      Phone Number <span style={{ color: '#dc2626' }}>*</span>
                      {phoneType && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '500', color: '#14b8a6' }}>
                          {phoneType === 'mobile' && '📱 Mobile'}
                          {phoneType === 'home' && '🏠 Home'}
                          {phoneType === 'work' && '💼 Work'}
                          {phoneType === 'other' && '📞 Phone'}
                        </span>
                      )}
                    </label>
                    <input
                      id="owner-phone"
                      type="tel"
                      value={ownerPhone}
                      onChange={e => {
                        // Auto-normalize phone as user types
                        const input = e.target.value;
                        const normalized = normalizePhoneNumber(input);
                        setOwnerPhone(normalized);
                      }}
                      onBlur={e => {
                        // Ensure normalization on blur
                        const normalized = normalizePhoneNumber(e.target.value);
                        setOwnerPhone(normalized);
                      }}
                      required
                      placeholder="+14085551234"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1px solid ${
                          ownerPhone && !isValidE164PhoneNumber(ownerPhone) ? '#ef4444' : '#d1d5db'
                        }`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: ownerPhone ? '#f9fafb' : '#ffffff',
                      }}
                    />
                    {ownerPhone && !isValidE164PhoneNumber(ownerPhone) && (
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#ef4444' }}>
                        ⚠️ Phone must be 10 digits (will auto-format to +1XXXXXXXXXX)
                      </p>
                    )}
                    {ownerPhone && isValidE164PhoneNumber(ownerPhone) && (
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#10b981' }}>
                        ✅ Valid format: {ownerPhone}
                      </p>
                    )}
                  </div>

                  {/* Veterinarian */}
                  <div style={{ marginBottom: '20px' }}>
                    <label
                      htmlFor="veterinarian-name"
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '6px',
                      }}>
                      Veterinarian
                    </label>
                    <input
                      id="veterinarian-name"
                      type="text"
                      value={consultationData.pageData.providers[0]?.name || 'Unknown'}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: '#f9fafb',
                      }}
                    />
                  </div>

                  {/* Schedule For - Date/Time Picker */}
                  <div style={{ marginBottom: '20px' }}>
                    <label
                      htmlFor="scheduled-for"
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '6px',
                      }}>
                      Schedule Call For <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      id="scheduled-for"
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={e => setScheduledFor(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                      Default: 2 days from now at 2:00 PM (calls auto-adjusted to 12pm-5pm)
                    </p>
                  </div>

                  {/* Custom Notes */}
                  <div style={{ marginBottom: '20px' }}>
                    <label
                      htmlFor="custom-notes"
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '6px',
                      }}>
                      Notes (Optional)
                    </label>
                    <textarea
                      id="custom-notes"
                      value={customNotes}
                      onChange={e => setCustomNotes(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                      placeholder="Additional notes about this follow-up call..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button
                      type="submit"
                      disabled={isLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: isLoading ? '#94a3b8' : '#14b8a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                      }}>
                      {isLoading ? 'Scheduling...' : 'Schedule Call'}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                      }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export { ScheduleDischargeCallButton };
