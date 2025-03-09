import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | AI Gmail Manager',
  description: 'Manage your Gmail with AI-powered draft replies',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 