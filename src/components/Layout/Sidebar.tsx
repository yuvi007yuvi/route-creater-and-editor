import React, { useState } from 'react';
import { Map, Wand2, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
    activeModule: 'editor' | 'autoroute';
    onModuleChange: (module: 'editor' | 'autoroute') => void;
}

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div
            className={`${isExpanded ? 'w-64' : 'w-20'} bg-slate-950 flex flex-col py-6 border-r border-slate-800 z-50 transition-all duration-300 ease-in-out relative`}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -right-3 top-8 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-full p-1 shadow-lg z-50"
            >
                {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>

            {/* Branding / Logo */}
            <div className={`mb-8 px-4 flex items-center gap-3 ${isExpanded ? 'justify-start' : 'justify-center'}`}>
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <Map className="text-white w-6 h-6" />
                </div>
                {isExpanded && (
                    <div className="overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-4 duration-300">
                        <h1 className="font-bold text-white text-lg leading-tight">RouteMaster</h1>
                        <p className="text-xs text-blue-400 font-medium tracking-wider">PRO EDITION</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 flex flex-col gap-2 w-full px-3">
                <NavButton
                    active={activeModule === 'editor'}
                    onClick={() => onModuleChange('editor')}
                    icon={<Map size={20} />}
                    label="Route Editor"
                    isExpanded={isExpanded}
                />

                <NavButton
                    active={activeModule === 'autoroute'}
                    onClick={() => onModuleChange('autoroute')}
                    icon={<Wand2 size={20} />}
                    label="AI Auto Route"
                    isExpanded={isExpanded}
                />
            </div>

            {/* Footer Actions */}
            <div className="mt-auto flex flex-col gap-2 w-full px-3">
                <NavButton
                    onClick={() => { }}
                    icon={<Settings size={20} />}
                    label="Settings"
                    isExpanded={isExpanded}
                />
                <NavButton
                    onClick={() => { }}
                    icon={<LogOut size={20} />}
                    label="Logout"
                    isExpanded={isExpanded}
                />
            </div>
        </div>
    );
}

interface NavButtonProps {
    active?: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    isExpanded: boolean;
}

function NavButton({ active, onClick, icon, label, isExpanded }: NavButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative
                ${active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white hover:bg-slate-800'
                }
                ${isExpanded ? 'justify-start' : 'justify-center'}
            `}
            title={!isExpanded ? label : undefined}
        >
            <div className="flex-shrink-0">{icon}</div>

            {isExpanded && (
                <span className="font-medium whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">
                    {label}
                </span>
            )}

            {/* Active Indicator (Collapsed) */}
            {!isExpanded && active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r-full" />
            )}
        </button>
    );
}
