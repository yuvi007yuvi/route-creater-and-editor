import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, ZoomControl } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useProjectStore } from '@/hooks/useProjectStore';
import L from 'leaflet';

// Fix Leaflet icon issue
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export function MapCanvas() {
    const [map, setMap] = useState<L.Map | null>(null);
    const { currentProject, updateProjectData } = useProjectStore();
    const featureGroupRef = useRef<L.FeatureGroup>(null);
    const vertexLayerRef = useRef<L.LayerGroup>(null);
    const isInternalUpdate = useRef(false);

    // Initialize vertex layer
    useEffect(() => {
        if (!map) return;
        vertexLayerRef.current = L.layerGroup().addTo(map);
        return () => {
            vertexLayerRef.current?.remove();
        };
    }, [map]);

    // Load project data into map when project changes
    useEffect(() => {
        if (!map || !currentProject || !featureGroupRef.current) return;

        // If this update was triggered by our own map editing, don't reload
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        const fg = featureGroupRef.current;
        fg.clearLayers();

        if (currentProject.data && currentProject.data.features.length > 0) {
            const geoJsonLayer = L.geoJSON(currentProject.data as any, {
                pointToLayer: (_feature, latlng) => {
                    // Generate random color
                    const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
                    return L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: color,
                        color: "#fff",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                }
            });
            geoJsonLayer.eachLayer((layer) => {
                fg.addLayer(layer);
            });

            // Fit bounds if there are features
            try {
                if (fg.getLayers().length > 0) {
                    map.fitBounds(fg.getBounds());
                }
            } catch (e) {
                console.warn("Could not fit bounds", e);
            }
        }
    }, [currentProject?.data, map]); // Reload when data changes

    const handleMapChange = () => {
        if (!featureGroupRef.current || !currentProject) return;

        const geojson = featureGroupRef.current.toGeoJSON() as any;

        // Flag that the next store update is internal
        isInternalUpdate.current = true;

        updateProjectData({
            ...currentProject.data,
            features: geojson.features as any
        });
    };

    const handleEditStart = () => {
        if (!featureGroupRef.current || !vertexLayerRef.current) return;

        const fg = featureGroupRef.current;
        const vl = vertexLayerRef.current;
        vl.clearLayers();

        fg.eachLayer((layer: any) => {
            if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
                const latlngs = layer.getLatLngs();
                // Handle nested arrays for Polygons/MultiLineStrings
                const flatLatLngs = (Array.isArray(latlngs[0]) ? latlngs.flat(999) : latlngs) as L.LatLng[];

                flatLatLngs.forEach((latlng: L.LatLng) => {
                    const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
                    L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: color,
                        color: "#fff",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8,
                        interactive: false // Let clicks pass through to the edit handles
                    }).addTo(vl);
                });
            }
        });
    };

    const handleEditStop = () => {
        vertexLayerRef.current?.clearLayers();
    };

    return (
        <div className="w-full h-full relative z-0">
            <MapContainer
                center={[51.505, -0.09]}
                zoom={13}
                scrollWheelZoom={true}
                className="w-full h-full"
                ref={setMap}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ZoomControl position="bottomright" />

                <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                        position="topright"
                        onCreated={handleMapChange}
                        onEdited={handleMapChange}
                        onDeleted={handleMapChange}
                        onEditStart={handleEditStart}
                        onEditStop={handleEditStop}
                        draw={{
                            rectangle: false,
                            circle: false,
                            circlemarker: false,
                            marker: true,
                            polyline: true,
                            polygon: true,
                        }}
                    />
                </FeatureGroup>
            </MapContainer>
        </div>
    );
}
