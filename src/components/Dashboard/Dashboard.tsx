import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/hooks/useProjectStore';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { Plus, Search, Trash2, FolderOpen, Clock, Map as MapIcon } from 'lucide-react';


// Simple date formatter to avoid dependency for now
const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

export function Dashboard({ onOpenProject }: { onOpenProject: (id: string) => void }) {
    const { projects, loadProjects, createProject, deleteProject, isLoading } = useProjectStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        try {
            const id = await createProject(newProjectName, 'New KML Project');
            setNewProjectName('');
            setIsCreating(false);
            onOpenProject(id);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto bg-slate-950 text-slate-200">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
                    <p className="text-slate-400 mt-1">Manage your KML maps and routes.</p>
                </div>
                <Button onClick={() => setIsCreating(true)} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 border-0">
                    <Plus size={18} /> New Project
                </Button>
            </div>

            {isCreating && (
                <div className="mb-8 p-6 border border-slate-800 rounded-xl bg-slate-900 shadow-xl animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleCreate} className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-slate-300">Project Name</label>
                            <Input
                                autoFocus
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="e.g. City Center Survey"
                                className="bg-slate-950 border-slate-800 text-white focus:ring-blue-500/50"
                            />
                        </div>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">Create Project</Button>
                        <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
                    </form>
                </div>
            )}

            <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                    className="pl-10 h-12 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:ring-blue-500/50 rounded-xl"
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-slate-500">Loading projects...</div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                    <div className="mx-auto w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <FolderOpen className="text-slate-500" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-white">No projects found</h3>
                    <p className="text-slate-500 mt-1">Get started by creating a new project.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            className="group border border-slate-800 rounded-xl p-5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-900/10 transition-all bg-slate-900 cursor-pointer flex flex-col relative overflow-hidden"
                            onClick={() => onOpenProject(project.id)}
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-800 text-blue-400 rounded-lg group-hover:bg-blue-500/10 group-hover:text-blue-300 transition-colors">
                                    <MapIcon size={24} />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-900/20 -mr-2 -mt-2 transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Are you sure you want to delete this project?')) {
                                            deleteProject(project.id);
                                        }
                                    }}
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>

                            <h3 className="font-semibold text-xl mb-2 truncate text-white group-hover:text-blue-400 transition-colors" title={project.name}>{project.name}</h3>
                            <p className="text-sm text-slate-400 line-clamp-2 mb-6 h-10 leading-relaxed">
                                {project.description || "No description provided for this project."}
                            </p>

                            <div className="mt-auto flex items-center text-xs text-slate-500 pt-4 border-t border-slate-800">
                                <Clock size={14} className="mr-1.5" />
                                <span>Updated {formatDate(project.updatedAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
