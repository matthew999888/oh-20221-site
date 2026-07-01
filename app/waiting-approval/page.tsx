import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import RefreshButton from "./refresh-button";

// IMPORTANT: this page intentionally renders nothing but the root layout
// (which has no nav) plus this centered card. Do NOT wrap this route in
// any layout that adds a nav/header — per spec it must show "only a
// centered message (no nav at all)".
export default async function WaitingApprovalPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // If the user is actually fine now (approved + has roles), don't strand
  // them here.
  if (session.user.status === "approved" && session.user.roles.length > 0) {
    redirect("/dashboard");
  }

  const isPending = session.user.status === "pending";

  return (
    <>
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-orb-2" />
      </div>

      <main className="waiting-wrap">
        <div className="waiting-card">
          <p className="waiting-eyebrow">Account Status</p>
          <h1 className="waiting-title">
            {isPending ? "Your account is waiting for staff approval" : "Waiting for a role to be assigned"}
          </h1>
          <p className="waiting-sub">
            {isPending
              ? "A SASI/ASI or unit admin needs to review and approve your account before you can sign in to the portal. Check back later, or contact your unit staff if this takes longer than expected."
              : "Your account has been approved, but no role has been assigned yet. Contact your unit admin to be assigned a role — once assigned, you'll get access to the portal."}
          </p>

          <RefreshButton />
        </div>
      </main>
    </>
  );
}
