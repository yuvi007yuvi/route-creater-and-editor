import { create } from 'zustand';
import { Project, ProjectMetadata } from '../types';
import { storage } from '../lib/storage';
import { v4 as uuidv4 } from 'uuid';

// Simple UUID generator if we don't want to install uuid package yet
const generateId = () => uuidv4();

interface ProjectStore {
    projects: ProjectMetadata[];
    currentProject: Project | null;
    isLoading: boolean;
    error: string | null;

    loadProjects: () => Promise<void>;
    createProject: (name: string, description: string) => Promise<string>;
    openProject: (id: string) => Promise<void>;
    saveCurrentProject: () => Promise<void>;
    updateProjectData: (data: any) => void; // Type as FeatureCollection later
    deleteProject: (id: string) => Promise<void>;
    closeProject: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,

    loadProjects: async () => {
        set({ isLoading: true, error: null });
        try {
            const projects = await storage.getProjectsMetadata();
            set({ projects, isLoading: false });
        } catch (err) {
            set({ error: 'Failed to load projects', isLoading: false });
        }
    },

    createProject: async (name: string, description: string) => {
        set({ isLoading: true, error: null });
        try {
            const newProject: Project = {
                id: generateId(),
                name,
                description,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                version: 1,
                data: { type: 'FeatureCollection', features: [] },
            };

            await storage.saveProject(newProject);
            set((state) => ({
                projects: [...state.projects, {
                    id: newProject.id,
                    name: newProject.name,
                    description: newProject.description,
                    createdAt: newProject.createdAt,
                    updatedAt: newProject.updatedAt
                }],
                currentProject: newProject,
                isLoading: false
            }));
            return newProject.id;
        } catch (err) {
            set({ error: 'Failed to create project', isLoading: false });
            throw err;
        }
    },

    openProject: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const project = await storage.loadProject(id);
            if (project) {
                set({ currentProject: project, isLoading: false });
            } else {
                set({ error: 'Project not found', isLoading: false });
            }
        } catch (err) {
            set({ error: 'Failed to open project', isLoading: false });
        }
    },

    saveCurrentProject: async () => {
        const { currentProject } = get();
        if (!currentProject) return;

        set({ isLoading: true });
        try {
            const updatedProject = {
                ...currentProject,
                updatedAt: Date.now(),
            };
            await storage.saveProject(updatedProject);
            set({ currentProject: updatedProject, isLoading: false });

            // Refresh metadata list to show updated time
            const projects = await storage.getProjectsMetadata();
            set({ projects });
        } catch (err) {
            set({ error: 'Failed to save project', isLoading: false });
        }
    },

    updateProjectData: (data: any) => {
        set((state) => {
            if (!state.currentProject) return {};
            return {
                currentProject: {
                    ...state.currentProject,
                    data,
                }
            };
        });
    },

    deleteProject: async (id: string) => {
        set({ isLoading: true });
        try {
            await storage.deleteProject(id);
            set((state) => ({
                projects: state.projects.filter((p) => p.id !== id),
                currentProject: state.currentProject?.id === id ? null : state.currentProject,
                isLoading: false
            }));
        } catch (err) {
            set({ error: 'Failed to delete project', isLoading: false });
        }
    },

    closeProject: () => {
        set({ currentProject: null });
    }
}));
