export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="light min-h-screen bg-white text-neutral-900">
      {children}
    </div>
  );
}