import React, { useRef, useState } from 'react';
import { Upload, Play, Download, AlertCircle, CheckCircle2, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import * as turf from '@turf/turf';
import { kmlUtils } from '@/lib/kml';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';

export function AutoRouteModule() {
    const [vehicleHistory, setVehicleHistory] = useState<any>(null);
    const [wardBoundary, setWardBoundary] = useState<any>(null);
    const [generatedRoute, setGeneratedRoute] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState<{ originalPoints: number; filteredPoints: number } | null>(null);

    // Settings
    const [wardOptions, setWardOptions] = useState<any[]>([]);
    const [showWardSelection, setShowWardSelection] = useState(false);
    const [bufferRadius, setBufferRadius] = useState(20); // Meters
    const [smoothness, setSmoothness] = useState(0.0001);
    const [snapToRoad, setSnapToRoad] = useState(false);

    const vehicleInputRef = useRef<HTMLInputElement>(null);
    const wardInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'vehicle' | 'ward') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const geojson = await kmlUtils.parseKml(file);
            if (type === 'vehicle') {
                setVehicleHistory(geojson);
                setGeneratedRoute(null);
                setWardOptions([]);
                setShowWardSelection(false);
            } else {
                setWardBoundary(geojson);
                setGeneratedRoute(null);
                setWardOptions([]);
                setShowWardSelection(false);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to parse KML file');
        }
        e.target.value = '';
    };

    const analyzeWards = () => {
        if (!vehicleHistory || !wardBoundary) return;

        setIsProcessing(true);
        setGeneratedRoute(null);
        setStats(null);

        setTimeout(() => {
            try {
                // 1. Extract points
                const points: any[] = [];
                turf.featureEach(vehicleHistory, (feature) => {
                    if (feature.geometry.type === 'Point') {
                        points.push(feature);
                    } else if (feature.geometry.type === 'LineString') {
                        const exploded = turf.explode(feature);
                        turf.featureEach(exploded, (p) => points.push(p));
                    }
                });

                if (points.length === 0) {
                    alert('No points found in Vehicle History');
                    setIsProcessing(false);
                    return;
                }

                // 2. Analyze all wards with BUFFER
                const options: any[] = [];
                turf.featureEach(wardBoundary, (feature) => {
                    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                        const bufferedFeature = turf.buffer(feature, bufferRadius / 1000, { units: 'kilometers' });
                        const pointsInPoly = points.filter((point) =>
                            turf.booleanPointInPolygon(point, bufferedFeature as any)
                        ).length;

                        if (pointsInPoly > 0) {
                            options.push({
                                feature: feature,
                                bufferedFeature: bufferedFeature,
                                name: feature.properties?.name || feature.properties?.Name || 'Unnamed Ward',
                                points: pointsInPoly,
                                percentage: ((pointsInPoly / points.length) * 100).toFixed(1)
                            });
                        }
                    }
                });

                options.sort((a, b) => b.points - a.points);

                if (options.length === 0) {
                    alert('No vehicle points found inside ANY of the provided wards (even with buffer).');
                    setIsProcessing(false);
                } else if (options.length === 1) {
                    generateRouteForWard(options[0].bufferedFeature, points, options[0].name);
                } else {
                    setWardOptions(options);
                    setShowWardSelection(true);
                    setIsProcessing(false);
                }

            } catch (err) {
                console.error(err);
                alert('Error analyzing wards');
                setIsProcessing(false);
            }
        }, 1000);
    };

    const generateRouteForWard = async (wardFeature: any, allPoints: any[], wardName: string) => {
        try {
            const searchFeature = wardFeature.geometry ? wardFeature : turf.buffer(wardFeature, bufferRadius / 1000, { units: 'kilometers' });

            const pointsInside = allPoints.filter((point) =>
                turf.booleanPointInPolygon(point, searchFeature as any)
            );

            if (pointsInside.length < 2) {
                alert('Not enough points to generate a route.');
                setIsProcessing(false);
                return;
            }

            let route;

            if (snapToRoad) {
                // OSRM Map Matching
                const sampleRate = Math.ceil(pointsInside.length / 90);
                const sampledPoints = pointsInside.filter((_, i) => i % sampleRate === 0);

                // Ensure we only send lon,lat (remove elevation if present)
                const coordinates = sampledPoints.map(p => p.geometry.coordinates.slice(0, 2).join(',')).join(';');
                const url = `https://router.project-osrm.org/match/v1/driving/${coordinates}?overview=full&geometries=geojson`;

                try {
                    const response = await fetch(url);
                    const data = await response.json();

                    if (data.code === 'Ok' && data.matchings && data.matchings.length > 0) {
                        const mergedCoords = data.matchings.flatMap((m: any) => m.geometry.coordinates);
                        route = turf.lineString(mergedCoords, {
                            name: `AI Route (Snapped) - ${wardName}`,
                            description: `Generated from ${pointsInside.length} points inside ${wardName}. Snapped to road.`
                        });
                    } else {
                        throw new Error('OSRM matching failed');
                    }
                } catch (e) {
                    console.warn('OSRM failed, falling back to simple line', e);
                    const coords = pointsInside.map((p) => p.geometry.coordinates);
                    route = turf.lineString(coords);
                }
            } else {
                // Standard Line
                const coords = pointsInside.map((p) => p.geometry.coordinates);
                route = turf.lineString(coords);

                // Apply Smoothing
                if (smoothness > 0) {
                    route = turf.simplify(route, { tolerance: smoothness, highQuality: true });
                }
            }

            // Add metadata
            route.properties = {
                name: `AI Route - ${wardName}`,
                description: `Generated from ${pointsInside.length} points inside ${wardName}.`
            };

            setGeneratedRoute(turf.featureCollection([route]));
            setStats({
                originalPoints: allPoints.length,
                filteredPoints: pointsInside.length
            });

            setShowWardSelection(false);

        } catch (err) {
            console.error(err);
            alert('Error creating route geometry');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExport = () => {
        if (!generatedRoute) return;
        kmlUtils.exportKml(generatedRoute, 'AI_Auto_Route');
    };

    const [isPanelExpanded, setIsPanelExpanded] = useState(true);

    return (
        <div className="flex h-full w-full bg-slate-50 text-slate-900 relative">
            {/* Ward Selection Modal */}
            {showWardSelection && (
                <div className="absolute inset-0 z-[2000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">Select Target Ward</h3>
                            <p className="text-slate-500 text-sm mt-1">
                                The vehicle passed through multiple wards. Which one do you want to process?
                            </p>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {wardOptions.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setIsProcessing(true);
                                        setTimeout(() => {
                                            const points: any[] = [];
                                            turf.featureEach(vehicleHistory, (f) => {
                                                if (f.geometry.type === 'Point') points.push(f);
                                                else if (f.geometry.type === 'LineString') {
                                                    turf.featureEach(turf.explode(f), p => points.push(p));
                                                }
                                            });
                                            generateRouteForWard(option.bufferedFeature, points, option.name);
                                        }, 100);
                                    }}
                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-slate-200 mb-1"
                                >
                                    <div className="text-left">
                                        <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {option.name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {option.points} points found
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-blue-600">
                                            {option.percentage}%
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            match
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => { setShowWardSelection(false); setIsProcessing(false); }}
                                className="px-4 py-2 text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Control Panel */}
            <div className={`${isPanelExpanded ? 'w-96' : 'w-0'} border-r border-slate-200 bg-white flex flex-col transition-all duration-300 relative z-10`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                    className="absolute -right-3 top-8 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-full p-1 shadow-lg z-50"
                    title={isPanelExpanded ? "Collapse Panel" : "Expand Panel"}
                >
                    {isPanelExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className={`flex flex-col p-6 overflow-y-auto h-full ${!isPanelExpanded && 'hidden'}`}>
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Zap className="text-blue-600" fill="currentColor" />
                            Auto Route AI
                        </h2>
                        <p className="text-slate-500 text-sm">Upload vehicle history and ward boundary to automatically generate a route.</p>
                    </div>

                    {/* Step 1: Uploads */}
                    <div className="space-y-6 mb-8">
                        {/* Vehicle History */}
                        <div className="p-4 border border-slate-200 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <label className="font-medium text-slate-900">1. Vehicle History</label>
                                {vehicleHistory ? <CheckCircle2 className="text-green-600" size={18} /> : <AlertCircle className="text-slate-400" size={18} />}
                            </div>
                            <p className="text-xs text-slate-500 mb-4">Upload KML with raw GPS points.</p>
                            <input
                                type="file"
                                ref={vehicleInputRef}
                                onChange={(e) => handleFileUpload(e, 'vehicle')}
                                accept=".kml,.xml"
                                className="hidden"
                            />
                            <button
                                onClick={() => vehicleInputRef.current?.click()}
                                className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <Upload size={14} /> {vehicleHistory ? 'Change File' : 'Upload KML'}
                            </button>
                        </div>

                        {/* Ward Boundary */}
                        <div className="p-4 border border-slate-200 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <label className="font-medium text-slate-900">2. Ward Boundary</label>
                                {wardBoundary ? <CheckCircle2 className="text-green-600" size={18} /> : <AlertCircle className="text-slate-400" size={18} />}
                            </div>
                            <p className="text-xs text-slate-500 mb-4">Upload KML with ward polygon.</p>
                            <input
                                type="file"
                                ref={wardInputRef}
                                onChange={(e) => handleFileUpload(e, 'ward')}
                                accept=".kml,.xml"
                                className="hidden"
                            />
                            <button
                                onClick={() => wardInputRef.current?.click()}
                                className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <Upload size={14} /> {wardBoundary ? 'Change File' : 'Upload KML'}
                            </button>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="mb-8 space-y-4">
                        {/* Buffer */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-2">
                                <label className="font-medium text-slate-900 text-sm">Boundary Buffer</label>
                                <span className="text-blue-600 text-xs font-bold">{bufferRadius}m</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={bufferRadius}
                                onChange={(e) => setBufferRadius(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Expand ward boundary to include roads on the edge.
                            </p>
                        </div>

                        {/* Smoothness */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-2">
                                <label className="font-medium text-slate-900 text-sm">Route Smoothing</label>
                                <span className="text-blue-600 text-xs font-bold">{(smoothness * 10000).toFixed(0)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={smoothness * 100000}
                                onChange={(e) => setSmoothness(parseInt(e.target.value) / 100000)}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Reduce jitter and clean up messy lines.
                            </p>
                        </div>

                        {/* Snap to Road */}
                        <div
                            onClick={() => setSnapToRoad(!snapToRoad)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${snapToRoad ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${snapToRoad ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <div className="font-medium text-slate-900 text-sm">Snap to Road</div>
                                    <div className="text-xs text-slate-500">Use AI to match roads</div>
                                </div>
                            </div>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${snapToRoad ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${snapToRoad ? 'left-5' : 'left-1'}`}></div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Generate */}
                    <div className="mb-8">
                        <button
                            onClick={analyzeWards}
                            disabled={!vehicleHistory || !wardBoundary || isProcessing}
                            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg transition-all ${!vehicleHistory || !wardBoundary || isProcessing
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                                }`}
                        >
                            {isProcessing ? (
                                <>Processing...</>
                            ) : (
                                <><Play size={18} /> Analyze & Generate Route</>
                            )}
                        </button>
                    </div>

                    {/* Step 3: Results */}
                    {stats && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="font-medium text-slate-900 mb-3">Generation Results</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total Points:</span>
                                    <span className="text-slate-900">{stats.originalPoints}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Points in Ward:</span>
                                    <span className="text-green-600">{stats.filteredPoints}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-200 mt-2">
                                    <span className="text-slate-500">Efficiency:</span>
                                    <span className="text-blue-600">{Math.round((stats.filteredPoints / stats.originalPoints) * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {generatedRoute && (
                        <button
                            onClick={handleExport}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all"
                        >
                            <Download size={18} /> Export Generated Route
                        </button>
                    )}
                </div>
            </div>

            {/* Map Preview */}
            <div className="flex-1 relative bg-slate-50 z-0">
                <MapContainer
                    center={[51.505, -0.09]}
                    zoom={13}
                    className="w-full h-full"
                >
                    <MapController data={[vehicleHistory, wardBoundary]} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Render Vehicle History */}
                    {vehicleHistory && (
                        <GeoJSON
                            key="vehicle-history"
                            data={vehicleHistory}
                            pointToLayer={(_feature, latlng) => (
                                L.circleMarker(latlng, {
                                    radius: 4,
                                    fillColor: '#64748b',
                                    color: '#fff',
                                    weight: 1,
                                    opacity: 1,
                                    fillOpacity: 0.8
                                })
                            )}
                        />
                    )}

                    {/* Render Ward Boundary */}
                    {wardBoundary && (
                        <>
                            <GeoJSON
                                data={wardBoundary}
                                style={{ color: '#ef4444', weight: 2, fillOpacity: 0.05, dashArray: '5, 5' }}
                            />
                            {/* Render Buffer Visualization if > 0 */}
                            {bufferRadius > 0 && (
                                <GeoJSON
                                    key={`buffer-${bufferRadius}`} // Force re-render on radius change
                                    data={turf.buffer(wardBoundary, bufferRadius / 1000, { units: 'kilometers' }) as any}
                                    style={{ color: '#3b82f6', weight: 1, fillOpacity: 0.05, dashArray: '2, 4', opacity: 0.5 }}
                                />
                            )}
                        </>
                    )}

                    {/* Render Generated Route */}
                    {generatedRoute && (
                        <GeoJSON
                            data={generatedRoute}
                            style={{ color: '#3b82f6', weight: 4, opacity: 0.9 }}
                        />
                    )}
                </MapContainer>

                {/* Legend/Overlay */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 shadow-xl z-[1000] text-xs space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border border-red-500 bg-red-500/20"></div>
                        <span className="text-slate-600">Ward Boundary</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-500/50"></div>
                        <span className="text-slate-600">Raw History</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-1 bg-blue-500 rounded-full"></div>
                        <span className="text-slate-600">Generated Route</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper component to fit bounds
function MapController({ data }: { data: any[] }) {
    const map = useMap();

    React.useEffect(() => {
        if (!data) return;

        const features: any[] = [];

        for (const d of data) {
            if (!d) continue;

            if (d.type === 'FeatureCollection') {
                if (d.features && Array.isArray(d.features)) {
                    features.push(...d.features);
                }
            } else {
                features.push(d);
            }
        }

        if (features.length > 0) {
            const group = L.featureGroup(features.map(f => L.geoJSON(f)));
            try {
                map.fitBounds(group.getBounds(), { padding: [50, 50] });
            } catch (e) {
                console.warn('Could not fit bounds', e);
            }
        }
    }, [data, map]);

    return null;
}
