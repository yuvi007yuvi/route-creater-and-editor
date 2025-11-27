import { kml } from '@tmcw/togeojson';
import tokml from 'tokml';
import { FeatureCollection } from 'geojson';

export const kmlUtils = {
    async parseKml(file: File): Promise<FeatureCollection> {
        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Invalid KML file: ' + parserError.textContent);
        }

        const geojson = kml(xmlDoc);

        // Ensure it's a FeatureCollection
        if (geojson.type !== 'FeatureCollection') {
            return {
                type: 'FeatureCollection',
                features: [geojson as any]
            };
        }

        return geojson as FeatureCollection;
    },

    exportKml(data: FeatureCollection, name: string): void {
        const kmlString = tokml(data, {
            documentName: name,
            documentDescription: 'Exported from KML Editor Portal'
        });

        const blob = new Blob([kmlString], { type: 'application/vnd.google-earth.kml+xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.replace(/\s+/g, '_')}.kml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
