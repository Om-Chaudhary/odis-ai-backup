import { redirect } from "next/navigation";

/**
 * Admin index page - redirects to scheduled items
 */
export default function AdminPage() {
  redirect("/admin/scheduled");
}
