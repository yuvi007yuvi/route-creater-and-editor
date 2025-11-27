import { useRef, useState } from 'react';
import { Layout } from './components/Layout/Layout';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { MapCanvas } from './components/Map/MapCanvas';
import { LayerPanel } from './components/Panels/LayerPanel';
import { PropertiesPanel } from './components/Panels/PropertiesPanel';
import { useProjectStore } from './hooks/useProjectStore';

import { kmlUtils } from './lib/kml';

import { AutoRouteModule } from './components/AutoRoute/AutoRouteModule';

function App() {
    const { currentProject, openProject, closeProject, updateProjectData } = useProjectStore();
    const [activeModule, setActiveModule] = useState<'editor' | 'autoroute'>('editor');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        if (currentProject) {
            kmlUtils.exportKml(currentProject.data, currentProject.name);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentProject) return;

        try {
            const geojson = await kmlUtils.parseKml(file);
            // Append features for better UX
            const newFeatures = [...currentProject.data.features, ...geojson.features];
            updateProjectData({
                ...currentProject.data,
                features: newFeatures
            });
            alert(`Imported ${geojson.features.length} features.`);
        } catch (err) {
            console.error(err);
            alert('Failed to import KML');
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Layout
            mainSidebar={
                <Sidebar
                    activeModule={activeModule}
                    onModuleChange={setActiveModule}
                />
            }
        >
            {currentProject ? (
                activeModule === 'editor' ? (
                    <div className="w-full h-full flex flex-col">
                        <div className="h-14 border-b border-slate-800 bg-slate-900 flex items-center px-4 justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <button onClick={closeProject} className="text-sm font-medium hover:underline text-slate-400 hover:text-white">
                                    &larr; Back to Projects
                                </button>
                                <div className="h-4 w-px bg-slate-700 mx-2" />
                                <h2 className="font-semibold text-white">{currentProject.name}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".kml,.xml"
                                    className="hidden"
                                />
                                <button
                                    onClick={handleImportClick}
                                    className="text-xs border border-slate-700 text-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
                                >
                                    Import KML
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="text-xs border border-slate-700 text-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
                                >
                                    Export KML
                                </button>
                                <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                                    Save
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative flex overflow-hidden">
                            <div className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col z-10">
                                <LayerPanel />
                            </div>
                            <div className="flex-1 relative">
                                <MapCanvas />
                            </div>
                            <div className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col z-10">
                                <PropertiesPanel />
                            </div>
                        </div>
                    </div>
                ) : (
                    <AutoRouteModule />
                )
            ) : (
                <Dashboard onOpenProject={openProject} />
            )}
        </Layout>
    );
}

export default App;
