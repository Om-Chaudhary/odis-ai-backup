import { redirect } from "next/navigation";

/**
 * Admin operations page - redirects to scheduled items
 * TODO: Enhance with bulk operations UI
 */
export default function AdminOperationsPage() {
  redirect("/admin/scheduled");
}
