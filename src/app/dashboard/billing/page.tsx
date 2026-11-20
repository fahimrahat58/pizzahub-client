import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth-guards";

export default async function BillingPage() {
  await requireUser(["admin"]);
  redirect("/dashboard/admin#billing");
}
