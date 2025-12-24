import { RichTextEditor } from './components/RichTextEditor';
import { createDischargeEmailTemplate, formatVisitDate } from './services/emailTemplate';
import { validateAndParseEmailList } from './utils/emailValidation';
import { getSupabaseClient, logger } from '@odis-ai/extension/shared';
import { Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Database } from '@database-types';

type DischargeSummary = Database['public']['Tables']['discharge_summaries']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export default function App() {
  const [dischargeSummary, setDischargeSummary] = useState<DischargeSummary | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [subject, setSubject] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [recipientEmails, setRecipientEmails] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailValidation, setEmailValidation] = useState<{ valid: string[]; invalid: string[] }>({
    valid: [],
    invalid: [],
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // @ts-expect-error - cases.patients is included in the query but not in the type
  const patientName = dischargeSummary?.cases?.patients?.[0]?.name || 'Unknown Patient';

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get discharge summary ID from URL params
        const params = new URLSearchParams(window.location.search);
        const summaryId = params.get('id');

        if (!summaryId) {
          throw new Error('No discharge summary ID provided');
        }

        const supabase = getSupabaseClient();

        // Load discharge summary
        const { data: summaryData, error: summaryError } = await supabase
          .from('discharge_summaries')
          .select('*, cases!inner(id, external_id, patients(name))')
          .eq('id', summaryId)
          .single();

        if (summaryError) throw summaryError;
        if (!summaryData) throw new Error('Discharge summary not found');

        setDischargeSummary(summaryData);
        setSubject(`Discharge Summary - ${summaryData.cases?.patients?.[0]?.name || 'Unknown Patient'}`);
        setEditorContent(summaryData.content || '');

        // Load user profile for clinic info
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profileData } = await supabase.from('users').select('*').eq('id', user.id).single();

          setUserProfile(profileData);
        }
      } catch (err) {
        logger.error('[ODIS] Error loading data', { error: err });
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Validate emails whenever recipientEmails changes
  useEffect(() => {
    if (recipientEmails.trim()) {
      const validation = validateAndParseEmailList(recipientEmails);
      setEmailValidation(validation);
    } else {
      setEmailValidation({ valid: [], invalid: [] });
    }
  }, [recipientEmails]);

  const handleSend = async () => {
    if (!dischargeSummary || emailValidation.valid.length === 0 || !subject.trim() || !editorContent.trim()) return;

    try {
      setIsSending(true);
      setError(null);

      const supabase = getSupabaseClient();

      // Wrap content with branded email template
      const wrappedEmailContent = createDischargeEmailTemplate({
        petName: patientName,
        ownerName: 'Pet Owner',
        clinicName: userProfile?.clinic_name || 'OdisAI Veterinary Clinic',
        clinicPhone: userProfile?.clinic_phone || '',
        clinicEmail: userProfile?.clinic_email || '',
        clinicAddress: '',
        visitDate: formatVisitDate(dischargeSummary.created_at),
        dischargeSummaryContent: editorContent,
      });

      // Plain text version (strip HTML tags)
      const textContent = editorContent.replace(/<[^>]*>/g, '');

      // Call Supabase Edge Function to send email via Resend
      const { error } = await supabase.functions.invoke('send-discharge-email', {
        body: {
          to: emailValidation.valid,
          subject: subject,
          html: wrappedEmailContent,
          text: textContent,
          patientName: patientName,
          dischargeSummaryId: dischargeSummary.id,
        },
      });

      if (error) throw error;

      // Close the tab after successful send
      window.close();
    } catch (err) {
      logger.error('[ODIS] Error sending email', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    window.close();
  };

  const renderPreview = () => {
    if (!dischargeSummary) return null;

    const previewHtml = createDischargeEmailTemplate({
      petName: patientName,
      ownerName: 'Pet Owner',
      clinicName: userProfile?.clinic_name || 'OdisAI Veterinary Clinic',
      clinicPhone: userProfile?.clinic_phone || '',
      clinicEmail: userProfile?.clinic_email || '',
      clinicAddress: '',
      visitDate: formatVisitDate(dischargeSummary.created_at),
      dischargeSummaryContent: editorContent,
    });

    return (
      <iframe
        srcDoc={previewHtml}
        className="w-full border-0"
        style={{ minHeight: '800px', height: '100%' }}
        title="Email Preview"
        sandbox="allow-same-origin"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-[#5ab9b4]"></div>
          <p className="mt-4 text-gray-600">Loading discharge summary...</p>
        </div>
      </div>
    );
  }

  if (error && !dischargeSummary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-5xl text-red-500">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800">Error Loading Email</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <button
            onClick={handleCancel}
            className="rounded-lg bg-gray-200 px-6 py-2 text-gray-800 transition-colors hover:bg-gray-300">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#5ab9b4] to-[#6ac9c4] text-white shadow-lg">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Email Discharge Summary
              </h1>
              <p className="mt-2 text-sm text-white/90">Patient: {patientName}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/20 px-4 py-2 transition-colors hover:bg-white/30"
                disabled={isSending}>
                {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isPreviewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={handleCancel}
                className="rounded-lg border border-white/30 bg-white/20 px-4 py-2 transition-colors hover:bg-white/30"
                disabled={isSending}>
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || emailValidation.valid.length === 0 || !subject.trim() || !editorContent.trim()}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-[#5ab9b4] transition-all hover:bg-white/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
                {isSending ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                      <path
                        d="M12 2a10 10 0 0 1 10 10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.75"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Send to {emailValidation.valid.length} recipient{emailValidation.valid.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-6 py-8">
        <div className="flex min-h-0 flex-1 flex-col space-y-6 rounded-xl bg-white p-8 shadow-md">
          {!isPreviewMode ? (
            <>
              {/* Recipient Email */}
              <div className="space-y-2">
                <label htmlFor="recipient" className="block text-sm font-semibold text-gray-700">
                  Recipient Email(s) <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    (comma-separated for multiple recipients)
                  </span>
                </label>
                <input
                  id="recipient"
                  type="text"
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-900 transition-colors focus:border-[#5ab9b4] focus:outline-none focus:ring-2 focus:ring-[#5ab9b4]/20"
                  value={recipientEmails}
                  onChange={e => setRecipientEmails(e.target.value)}
                  placeholder="owner@example.com, owner2@example.com"
                  disabled={isSending}
                />
                {emailValidation.valid.length > 0 && (
                  <p className="text-sm text-green-600">✓ {emailValidation.valid.length} valid email(s)</p>
                )}
                {emailValidation.invalid.length > 0 && (
                  <p className="text-sm text-red-600">✗ Invalid email(s): {emailValidation.invalid.join(', ')}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-900 transition-colors focus:border-[#5ab9b4] focus:outline-none focus:ring-2 focus:ring-[#5ab9b4]/20"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="(123) 456-7890"
                  disabled={isSending}
                />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-900 transition-colors focus:border-[#5ab9b4] focus:outline-none focus:ring-2 focus:ring-[#5ab9b4]/20"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  disabled={isSending}
                />
              </div>

              {/* Rich Text Editor */}
              <div className="flex min-h-0 flex-1 flex-col space-y-2">
                <div className="block text-sm font-semibold text-gray-700">
                  Message <span className="text-red-500">*</span>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden rounded-lg border-2 border-gray-300">
                  <RichTextEditor
                    content={editorContent}
                    onChange={setEditorContent}
                    placeholder="Enter discharge summary content..."
                    editable={!isSending}
                    className="h-full"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <h3 className="mb-4 text-lg font-semibold text-gray-700">Email Preview</h3>
              <div className="min-h-0 flex-1 overflow-auto rounded-lg border-2 border-gray-300">{renderPreview()}</div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
