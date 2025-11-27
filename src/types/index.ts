import { FeatureCollection } from 'geojson';

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: number;
    updatedAt: number;
    data: FeatureCollection; // GeoJSON representation of KML
    version: number;
}

export interface ProjectMetadata {
    id: string;
    name: string;
    description: string;
    createdAt: number;
    updatedAt: number;
}

export interface AppState {
    projects: ProjectMetadata[];
    currentProject: Project | null;
    isLoading: boolean;
    error: string | null;
}
