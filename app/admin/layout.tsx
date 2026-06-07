// Neutral wrapper for the whole /admin segment. The auth guard lives in the
// (dashboard) route group; login is handled on the shared /account page.
export default function AdminSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
