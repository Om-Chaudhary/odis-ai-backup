import { VapiTestPage } from "~/components/admin/vapi-test-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vapi Assistant Test | OdisAI Admin",
  description: "Test Vapi AI assistant with custom variables",
};

export default function VapiTestRoute() {
  return <VapiTestPage />;
}
