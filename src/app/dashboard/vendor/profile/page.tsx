import { PageHeader } from "@/components/shared/ui-kit";
import { ProfilePanel } from "@/components/dashboard/profile-panel";

export default function VendorProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vendor workspace"
        title="Profile"
        description="Manage your contact details and profile photo. Your email is managed by your sign-in provider."
      />
      <ProfilePanel role="vendor" />
    </div>
  );
}
