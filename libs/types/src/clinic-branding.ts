/**
 * Clinic Branding Types
 *
 * Defines the structure for clinic-specific branding customization
 * used in discharge emails and other communications.
 */

/**
 * Clinic branding configuration for emails
 */
export interface ClinicBranding {
  /** Clinic display name */
  clinicName: string;

  /** Clinic phone number for contact */
  clinicPhone: string;

  /** Clinic email address for contact */
  clinicEmail: string;

  /** Primary brand color in hex format (e.g., "#2563EB") */
  primaryColor?: string;

  /** URL to clinic logo image */
  logoUrl?: string | null;

  /** Custom header text for emails (optional) */
  emailHeaderText?: string | null;

  /** Custom footer text for emails (optional) */
  emailFooterText?: string | null;
}

/**
 * Default branding values
 */
export const DEFAULT_BRANDING: Partial<ClinicBranding> = {
  primaryColor: "#2563EB",
  clinicName: "Your Clinic",
  clinicPhone: "",
  clinicEmail: "",
};

/**
 * Merge clinic data with defaults to create complete branding
 */
export function createClinicBranding(
  partial: Partial<ClinicBranding>,
): ClinicBranding {
  return {
    clinicName: partial.clinicName ?? DEFAULT_BRANDING.clinicName!,
    clinicPhone: partial.clinicPhone ?? DEFAULT_BRANDING.clinicPhone!,
    clinicEmail: partial.clinicEmail ?? DEFAULT_BRANDING.clinicEmail!,
    primaryColor: partial.primaryColor ?? DEFAULT_BRANDING.primaryColor,
    logoUrl: partial.logoUrl ?? null,
    emailHeaderText: partial.emailHeaderText ?? null,
    emailFooterText: partial.emailFooterText ?? null,
  };
}
