/**
 * Schedule Status Icons
 *
 * Multi-state icons to indicate email and phone scheduling/delivery status
 * for consultations. Uses inline styles for reliable rendering in content scripts.
 *
 * Status states:
 * - none: Gray outline icon (no communication scheduled) - always visible on schedule page
 * - scheduled: Black filled icon (scheduled/pending)
 * - sent: Green filled icon (sent for email, completed for call)
 * - failed: Red filled icon (failed/error)
 */

import { DashboardLinkIcon } from './DashboardLinkIcon';

// Communication status type
type CommunicationStatus = 'none' | 'scheduled' | 'sent' | 'failed';

// Default colors - white for visibility on teal background (BrandedMenuBar)
const DEFAULT_SCHEDULED_COLOR = '#ffffff'; // white (solid/filled)
const DEFAULT_UNSCHEDULED_COLOR = 'rgba(255, 255, 255, 0.5)'; // white with opacity (outline)

// Dark colors - for light backgrounds (schedule popup)
const DARK_SCHEDULED_COLOR = '#14b8a6'; // teal-500 (solid/filled)
const DARK_UNSCHEDULED_COLOR = '#9ca3af'; // gray-400 (outline)

// Calendar grid colors - for appointment blocks
const CALENDAR_SCHEDULED_COLOR = '#111827'; // gray-900 (soft black)
const CALENDAR_SENT_COLOR = '#16a34a'; // green-600
const CALENDAR_FAILED_COLOR = '#dc2626'; // red-600
const CALENDAR_NONE_COLOR = '#9ca3af'; // gray-400 (for menubar variant)

interface IconProps {
  className?: string;
  /** @deprecated Use `status` prop instead for new calendar grid icons */
  scheduled?: boolean;
  /** Communication status for calendar grid icons */
  status?: CommunicationStatus;
  title?: string;
  size?: number;
  /**
   * Variant for styling context:
   * - light: white icons (for dark/teal bg)
   * - dark: teal/gray icons (for light bg like popup)
   * - calendar: black/green/red icons (for calendar grid, hides when none)
   * - menubar: same as calendar but always shows icons (gray when none)
   */
  variant?: 'light' | 'dark' | 'calendar' | 'menubar';
}

/**
 * Get icon color based on status and variant
 */
const getIconColor = (
  status: CommunicationStatus,
  variant: 'light' | 'dark' | 'calendar' | 'menubar',
  isScheduledLegacy?: boolean,
): string | null => {
  // Handle calendar variant with explicit status (hides when none)
  if (variant === 'calendar') {
    switch (status) {
      case 'none':
        return null; // Don't render icon
      case 'scheduled':
        return CALENDAR_SCHEDULED_COLOR;
      case 'sent':
        return CALENDAR_SENT_COLOR;
      case 'failed':
        return CALENDAR_FAILED_COLOR;
      default:
        return null;
    }
  }

  // Handle menubar variant (same colors as calendar but always shows)
  if (variant === 'menubar') {
    switch (status) {
      case 'none':
        return CALENDAR_NONE_COLOR; // Gray outline
      case 'scheduled':
        return CALENDAR_SCHEDULED_COLOR;
      case 'sent':
        return CALENDAR_SENT_COLOR;
      case 'failed':
        return CALENDAR_FAILED_COLOR;
      default:
        return CALENDAR_NONE_COLOR;
    }
  }

  // Legacy behavior for light/dark variants (used by popup and menu bar)
  const isScheduled = status === 'scheduled' || status === 'sent' || isScheduledLegacy;

  if (variant === 'dark') {
    return isScheduled ? DARK_SCHEDULED_COLOR : DARK_UNSCHEDULED_COLOR;
  }

  // Light variant
  return isScheduled ? DEFAULT_SCHEDULED_COLOR : DEFAULT_UNSCHEDULED_COLOR;
};

/**
 * Get tooltip text based on status
 */
const getTooltipText = (type: 'email' | 'call', status: CommunicationStatus): string => {
  switch (status) {
    case 'none':
      return type === 'email' ? 'No email scheduled' : 'No call scheduled';
    case 'scheduled':
      return type === 'email' ? 'Email scheduled' : 'Call scheduled';
    case 'sent':
      return type === 'email' ? 'Email sent' : 'Call completed';
    case 'failed':
      return type === 'email' ? 'Email failed' : 'Call failed';
    default:
      return '';
  }
};

/**
 * Email Icon - Supports multiple states: none, scheduled, sent, failed
 * Always renders as solid/filled icon with color indicating status
 */
const EmailIcon = ({ className = '', scheduled = false, status, title, size = 16, variant = 'light' }: IconProps) => {
  // Determine effective status - use explicit status if provided, otherwise derive from scheduled bool
  const effectiveStatus: CommunicationStatus = status ?? (scheduled ? 'scheduled' : 'none');

  // For calendar variant with 'none' status, don't render anything
  if (variant === 'calendar' && effectiveStatus === 'none') {
    return null;
  }

  const color = getIconColor(effectiveStatus, variant, scheduled);
  if (!color) return null;

  const tooltipText = title || getTooltipText('email', effectiveStatus);

  // Always render solid/filled email icon (consistent with phone icon style)
  return (
    <span title={tooltipText} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        stroke="none"
        style={{ width: size, height: size, minWidth: size }}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.5 6.75A3 3 0 014.5 3.75h15a3 3 0 013 3v10.5a3 3 0 01-3 3h-15a3 3 0 01-3-3V6.75zm2.03.53l7.72 5.15a1.5 1.5 0 001.5 0l7.72-5.15a1.5 1.5 0 00-.97-.53h-15a1.5 1.5 0 00-.97.53z"
        />
      </svg>
    </span>
  );
};

/**
 * Phone Icon - Supports multiple states: none, scheduled, sent, failed
 * Always renders as solid/filled icon with color indicating status
 */
const PhoneIcon = ({ className = '', scheduled = false, status, title, size = 16, variant = 'light' }: IconProps) => {
  // Determine effective status - use explicit status if provided, otherwise derive from scheduled bool
  const effectiveStatus: CommunicationStatus = status ?? (scheduled ? 'scheduled' : 'none');

  // For calendar variant with 'none' status, don't render anything
  if (variant === 'calendar' && effectiveStatus === 'none') {
    return null;
  }

  const color = getIconColor(effectiveStatus, variant, scheduled);
  if (!color) return null;

  const tooltipText = title || getTooltipText('call', effectiveStatus);

  // Always render solid/filled phone icon
  return (
    <span title={tooltipText} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        stroke="none"
        style={{ width: size, height: size, minWidth: size }}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
        />
      </svg>
    </span>
  );
};

/**
 * Combined Status Icons Component (Legacy - for popup and menu bar)
 * Shows both email and phone status icons side by side, plus dashboard link if available
 */
interface StatusIconsProps {
  hasScheduledEmail: boolean;
  hasScheduledCall: boolean;
  caseId?: string | null;
  className?: string;
  iconSize?: number;
}

const ScheduleStatusIcons = ({
  hasScheduledEmail,
  hasScheduledCall,
  caseId,
  className = '',
  iconSize = 16,
}: StatusIconsProps) => (
  <div
    className={className}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flexShrink: 0,
    }}>
    <EmailIcon scheduled={hasScheduledEmail} size={iconSize} />
    <PhoneIcon scheduled={hasScheduledCall} size={iconSize} />
    {caseId && <DashboardLinkIcon caseId={caseId} size={iconSize} />}
  </div>
);

/**
 * Warning Icon - Displays when contact info (email/phone) is missing
 * Shows a yellow/orange warning triangle
 */
interface ContactWarningIconProps {
  missingEmail: boolean;
  missingPhone: boolean;
  size?: number;
  variant?: 'light' | 'dark' | 'calendar' | 'menubar';
}

const WARNING_COLOR = '#f59e0b'; // amber-500
const URGENT_COLOR = '#dc2626'; // red-600

const ContactWarningIcon = ({
  missingEmail,
  missingPhone,
  size = 16,
  // variant kept for API consistency with other icons
  variant: _variant = 'menubar',
}: ContactWarningIconProps) => {
  void _variant; // Suppress unused variable warning
  // Don't show if nothing is missing
  if (!missingEmail && !missingPhone) {
    return null;
  }

  // Build tooltip text
  const missingItems: string[] = [];
  if (missingEmail) missingItems.push('email');
  if (missingPhone) missingItems.push('phone');
  const tooltipText = `Missing contact info: ${missingItems.join(' & ')}`;

  return (
    <span title={tooltipText} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={WARNING_COLOR}
        stroke="none"
        style={{ width: size, height: size, minWidth: size }}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
        />
      </svg>
    </span>
  );
};

/**
 * Urgent Case Warning Icon - Displays when a case is flagged as urgent by AI
 * Shows a red exclamation circle icon
 */
interface UrgentCaseWarningIconProps {
  isUrgent: boolean;
  urgentReason?: string | null;
  size?: number;
  variant?: 'light' | 'dark' | 'calendar' | 'menubar';
}

const UrgentCaseWarningIcon = ({
  isUrgent,
  urgentReason,
  size = 16,
  // variant kept for API consistency with other icons
  variant: _variant = 'menubar',
}: UrgentCaseWarningIconProps) => {
  void _variant; // Suppress unused variable warning
  // Don't show if not urgent
  if (!isUrgent) {
    return null;
  }

  const tooltipText = urgentReason || 'Case flagged as urgent by AI';

  return (
    <span title={tooltipText} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={URGENT_COLOR}
        stroke="none"
        style={{ width: size, height: size, minWidth: size }}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v3.75a.75.75 0 001.5 0V9zm-1.5 7.5a.75.75 0 011.5 0v.008a.75.75 0 01-1.5 0V16.5z"
        />
      </svg>
    </span>
  );
};

/**
 * Calendar Grid Status Icons Component
 * Shows email and phone status icons with color-coded states for calendar grid
 * Always shows icons: black when scheduled, gray outline when not scheduled
 */
interface CalendarGridIconsProps {
  emailStatus: CommunicationStatus;
  callStatus: CommunicationStatus;
  missingEmail?: boolean;
  missingPhone?: boolean;
  isUrgent?: boolean;
  urgentReason?: string | null;
  className?: string;
  iconSize?: number;
  /** If true, always show icons (gray outline when none). If false, hide when nothing to show. */
  alwaysShow?: boolean;
}

const CalendarGridStatusIcons = ({
  emailStatus,
  callStatus,
  missingEmail = false,
  missingPhone = false,
  isUrgent = false,
  urgentReason,
  className = '',
  iconSize = 14,
  alwaysShow = true,
}: CalendarGridIconsProps) => {
  // Check if we have anything to show
  // Note: missing contact replaces the corresponding icon position, not added as extra
  const hasEmailToShow = emailStatus !== 'none' || missingEmail;
  const hasPhoneToShow = callStatus !== 'none' || missingPhone;

  // If alwaysShow is false and nothing to show, return null
  if (!alwaysShow && !hasEmailToShow && !hasPhoneToShow && !isUrgent) {
    return null;
  }

  // Use 'menubar' variant to always show icons (gray outline for 'none', black for 'scheduled')
  const iconVariant = 'menubar';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexShrink: 0,
      }}>
      {/* Email position: show warning if missing email, otherwise show email icon */}
      {missingEmail ? (
        <ContactWarningIcon missingEmail={true} missingPhone={false} size={iconSize} variant={iconVariant} />
      ) : (
        <EmailIcon status={emailStatus} size={iconSize} variant={iconVariant} />
      )}
      {/* Phone position: show warning if missing phone, otherwise show phone icon */}
      {missingPhone ? (
        <ContactWarningIcon missingEmail={false} missingPhone={true} size={iconSize} variant={iconVariant} />
      ) : (
        <PhoneIcon status={callStatus} size={iconSize} variant={iconVariant} />
      )}
      <UrgentCaseWarningIcon isUrgent={isUrgent} urgentReason={urgentReason} size={iconSize} variant={iconVariant} />
    </div>
  );
};

export {
  EmailIcon,
  PhoneIcon,
  ScheduleStatusIcons,
  CalendarGridStatusIcons,
  ContactWarningIcon,
  UrgentCaseWarningIcon,
};
export type { CommunicationStatus, CalendarGridIconsProps, ContactWarningIconProps, UrgentCaseWarningIconProps };
