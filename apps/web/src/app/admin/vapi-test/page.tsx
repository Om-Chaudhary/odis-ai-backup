import { VapiTestPage } from "~/components/admin/vapi-test-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Squad Test | OdisAI Admin",
  description:
    "Test the Follow-Up Squad outbound call with custom case variables",
};

export default function VapiTestRoute() {
  return <VapiTestPage />;
}
