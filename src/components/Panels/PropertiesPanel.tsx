import { useProjectStore } from '@/hooks/useProjectStore';
import { Input } from '@/components/Common/Input';
import { Button } from '@/components/Common/Button';


export function PropertiesPanel() {
    const { currentProject } = useProjectStore();
    // In a real app, we'd have a 'selectedFeatureId' in the store
    // const { selectedFeatureId, updateFeature } = useProjectStore();

    // Mock selection for UI demo
    const selectedFeature = currentProject?.data.features[0];

    if (!selectedFeature) {
        return (
            <div className="p-4 text-center text-muted-foreground text-sm">
                Select a feature on the map to edit properties.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b font-semibold bg-muted/20">
                Properties
            </div>

            <div className="p-4 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                        defaultValue={selectedFeature.properties?.name || ''}
                        placeholder="Feature Name"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={selectedFeature.properties?.description || ''}
                        placeholder="Add a description..."
                    />
                </div>

                <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Styling</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Stroke</label>
                            <div className="flex items-center gap-2">
                                <input type="color" className="h-8 w-8 rounded cursor-pointer border-0" />
                                <Input className="h-8" placeholder="#000000" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Fill</label>
                            <div className="flex items-center gap-2">
                                <input type="color" className="h-8 w-8 rounded cursor-pointer border-0" />
                                <Input className="h-8" placeholder="#ffffff" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto p-4 border-t bg-muted/20">
                <Button className="w-full">Save Changes</Button>
            </div>
        </div>
    );
}
