/**
 * Internal staff tooling — no public nav, not linked from anywhere in
 * the site. Just supplies the shared black background here: the login/
 * forgot-password/reset-password pages already render their own centered
 * logo inside their card (see components/staff/LoginForm.tsx etc.), and
 * the protected dashboard shell has its own logo in the sidebar
 * (components/staff/StaffSidebar.tsx) — a header here on top of either
 * would just be a redundant, stacked second logo bar.
 */
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen w-full bg-black">{children}</div>
}
