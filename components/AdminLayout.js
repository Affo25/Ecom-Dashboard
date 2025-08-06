'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-h-screen lg:ml-0">
        {/* Header */}
        <Header setIsSidebarOpen={setIsSidebarOpen} />

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto">
          <div className="max-w-full">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}