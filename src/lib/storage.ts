import { get, set, del } from 'idb-keyval';
import { Project, ProjectMetadata } from '../types';

const PROJECT_PREFIX = 'project_';
const METADATA_KEY = 'projects_metadata';

export const storage = {
    async getProjectsMetadata(): Promise<ProjectMetadata[]> {
        return (await get<ProjectMetadata[]>(METADATA_KEY)) || [];
    },

    async saveProject(project: Project): Promise<void> {
        // 1. Save full project data
        await set(`${PROJECT_PREFIX}${project.id}`, project);

        // 2. Update metadata list
        const metadata: ProjectMetadata = {
            id: project.id,
            name: project.name,
            description: project.description,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        };

        const allMetadata = await this.getProjectsMetadata();
        const index = allMetadata.findIndex((p) => p.id === project.id);

        if (index >= 0) {
            allMetadata[index] = metadata;
        } else {
            allMetadata.push(metadata);
        }

        await set(METADATA_KEY, allMetadata);
    },

    async loadProject(id: string): Promise<Project | undefined> {
        return await get<Project>(`${PROJECT_PREFIX}${id}`);
    },

    async deleteProject(id: string): Promise<void> {
        await del(`${PROJECT_PREFIX}${id}`);

        const allMetadata = await this.getProjectsMetadata();
        const newMetadata = allMetadata.filter((p) => p.id !== id);
        await set(METADATA_KEY, newMetadata);
    },
};
