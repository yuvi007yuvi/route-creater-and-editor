import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    sidebar?: React.ReactNode; // This is the secondary sidebar (panels)
    mainSidebar?: React.ReactNode; // This is the main navigation sidebar
}

export function Layout({ children, sidebar, mainSidebar }: LayoutProps) {
    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
            {/* Main Navigation Sidebar */}
            {mainSidebar}

            {/* Secondary Sidebar (Panel) - Optional */}
            {sidebar && (
                <aside className="w-80 border-r border-slate-200 bg-white flex flex-col z-10 shadow-xl">
                    {sidebar}
                </aside>
            )}

            {/* Main Content Area */}
            <main className="flex-1 relative flex flex-col min-w-0 bg-slate-50">
                {children}
            </main>
        </div>
    );
}
