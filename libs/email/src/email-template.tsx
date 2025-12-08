import type { ReactNode } from "react";

export interface DischargeEmailProps {
  patientName: string;
  dischargeSummaryContent: string;
  breed?: string | null;
  species?: string | null;
  clinicName?: string | null;
  clinicPhone?: string | null;
  clinicEmail?: string | null;
  structuredContent?: unknown;
  primaryColor?: string | null;
  logoUrl?: string | null;
  headerText?: string | null;
  footerText?: string | null;
  date?: string | null;
}

export function DischargeEmailTemplate(props: DischargeEmailProps): ReactNode {
  return (
    <div>
      <h1>Discharge Instructions for {props.patientName}</h1>
      <p>{props.dischargeSummaryContent}</p>
      {props.clinicName ? <p>Clinic: {props.clinicName}</p> : null}
      {props.clinicPhone ? <p>Phone: {props.clinicPhone}</p> : null}
      {props.clinicEmail ? <p>Email: {props.clinicEmail}</p> : null}
      {props.date ? <p>Date: {props.date}</p> : null}
    </div>
  );
}
