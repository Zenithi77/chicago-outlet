// Neutral wrapper for the whole /admin segment. The auth guard lives in the
// (dashboard) route group so /admin/login can stay public.
export default function AdminSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
