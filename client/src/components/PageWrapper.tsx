import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface PageWrapperProps {
  children: ReactNode;
  variant?: 'survey' | 'dashboard' | 'admin' | 'default';
  className?: string;
}

export function PageWrapper({ children, variant = 'default', className = '' }: PageWrapperProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant={variant} />
      <main className={`flex-1 ${className}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
