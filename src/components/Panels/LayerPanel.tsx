import { useProjectStore } from '@/hooks/useProjectStore';
import { Eye, Folder, MapPin, Hexagon, Activity } from 'lucide-react';


export function LayerPanel() {
    const { currentProject } = useProjectStore();

    if (!currentProject) return null;

    // This is a simplified view. In reality, we'd need a recursive tree component
    // to handle nested folders in KML. For now, we'll flatten features.
    const features = currentProject.data.features;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b font-semibold flex items-center justify-between bg-muted/20">
                <span>Layers</span>
                <span className="text-xs text-muted-foreground">{features.length} items</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {features.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        No layers yet. <br /> Use the toolbar to draw.
                    </div>
                ) : (
                    features.map((feature, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-accent group text-sm"
                        >
                            <button className="text-muted-foreground hover:text-foreground">
                                <Eye size={16} />
                            </button>

                            <div className="text-muted-foreground">
                                {getIconForGeometry(feature.geometry.type)}
                            </div>

                            <span className="truncate flex-1">
                                {feature.properties?.name || `Untitled ${feature.geometry.type}`}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function getIconForGeometry(type: string) {
    switch (type) {
        case 'Point': return <MapPin size={16} />;
        case 'LineString': return <Activity size={16} />;
        case 'Polygon': return <Hexagon size={16} />;
        default: return <Folder size={16} />;
    }
}
