import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication | AI Gmail Manager',
  description: 'Sign in or sign up to AI Gmail Manager',
};

export default function AuthLayout({
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