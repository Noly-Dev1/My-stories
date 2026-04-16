import React, { useState } from 'react';
import { 
  Plus, 
  BookOpen, 
  Users, 
  Settings, 
  Download, 
  Trash2, 
  Clock, 
  Search,
  ChevronLeft
} from 'lucide-react';
import { StoryProject } from './types';
import { cn } from './lib/utils';
import { motion } from 'motion/react';

interface DashboardProps {
  projects: StoryProject[];
  onCreateProject: () => void;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onImportProject: (project: StoryProject) => void;
}

export default function Dashboard({ projects, onCreateProject, onSelectProject, onDeleteProject, onImportProject }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        onImportProject(imported); 
      } catch (err) {
        setError('خطأ في استيراد الملف - تأكد من أنه ملف JSON صالح لمشروع حكواتي الألعاب');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-16 min-h-screen text-right transition-colors duration-300">
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white px-8 py-4 rounded-2xl shadow-xl flex items-center gap-4 border-2 border-white"
        >
          <span className="text-sm font-bold">{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <ChevronLeft size={20} className="rotate-90" />
          </button>
        </motion.div>
      )}
      <header className="mb-16 flex items-end justify-between border-b-2 border-slate-900 pb-8 dark:border-white">
        <div>
          <h1 className="text-6xl font-serif font-bold text-ink dark:text-dark-text mb-4">أفكاري</h1>
          <p className="text-slate-500 dark:text-dark-muted text-lg">استوديو كتابة الألعاب الاحترافي</p>
        </div>
        <div className="flex gap-4">
          <label className="soft-button btn-secondary px-6 py-3 cursor-pointer">
            <Download size={20} />
            <span>يستورد</span>
            <input type="file" className="hidden" onChange={handleImport} />
          </label>
          <button 
            onClick={onCreateProject}
            className="soft-button btn-primary py-3 px-8 shadow-md text-lg"
          >
            <Plus size={24} />
            <span>جديد</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <aside className="lg:col-span-1 space-y-8">
          <div className="sidebar-title">تصفية</div>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث..."
              className="w-full h-12 pr-12 pl-4 bg-white dark:bg-dark-card rounded-xl border border-brand-border outline-none focus:ring-1 focus:ring-brand-pink text-sm dark:text-dark-text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <div className="sidebar-title">الأنماط المميزة</div>
            {['مجربة وموثوقة', 'يناسب أسلوبي', 'يبدو أنك أنت', 'مخصص'].map(tag => (
              <div key={tag} className="text-sm py-2 px-3 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-600 dark:text-dark-muted transition-colors">
                {tag}
              </div>
            ))}
          </div>
        </aside>

        <main className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <motion.div 
                  layoutId={project.id}
                  key={project.id}
                  className="bg-white dark:bg-dark-card border-b-4 border-r-4 border-slate-900 dark:border-pink-900 overflow-hidden flex flex-col hover:-translate-x-1 hover:-translate-y-1 transition-all cursor-pointer group"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => onSelectProject(project.id)}
                >
                  <div className="p-8 flex-grow">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-accent uppercase mb-4 tracking-widest">
                      <Clock size={12} />
                      <span>{new Date(project.lastModified).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <h3 className="text-3xl font-serif font-bold mb-4 group-hover:text-brand-accent transition-colors dark:text-dark-text leading-tight">{project.name}</h3>
                    <p className="text-slate-600 dark:text-dark-muted text-sm line-clamp-3 leading-relaxed">{project.description}</p>
                  </div>
                  
                  <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-dark-muted text-[10px] uppercase font-bold">
                        <Users size={14} />
                        <span>{project.characters.length}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-dark-muted text-[10px] uppercase font-bold">
                        <BookOpen size={14} />
                        <span>{project.chapters.length}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-32 text-slate-400 border-2 border-dashed border-slate-200 dark:border-dark-border rounded-3xl">
                <BookOpen size={64} className="mb-6 opacity-10" />
                <p className="text-2xl font-serif italic">لم تبدأ حكايتك بعد...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
