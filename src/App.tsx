import React, { useState, useEffect } from 'react';
import { StoryProject } from './types';
import Dashboard from './Dashboard';
import Editor from './Editor';
import { Moon, Sun } from 'lucide-react';
import ConfirmationModal from './components/ConfirmationModal';

const MOCK_PROJECTS: StoryProject[] = [
  {
    id: '1',
    name: 'حارس المدينة القديمة',
    description: 'لعبة مغامرات في مدينة عربية قديمة مليئة بالأسرار والغموض.',
    genre: 'مغامرة / فانتازيا',
    style: 'أدبي كلاسيكي',
    tense: 'past',
    lastModified: Date.now() - 86400000,
    worldBuilding: [
      { id: 'w1', category: 'المحيط', title: 'ساحة المدينة', content: 'ساحة واسعة مرصوفة بالحجارة، يتوسطها تمثال برونزي قديم.' }
    ],
    outline: 'تبدأ القصة بوصول البطل إلى المدينة المهجورة...',
    characters: [
      { id: 'c1', name: 'يوسف', role: 'البطل', traits: ['شجاع', 'ذكي'], background: 'حارس سابق للمدينة' },
      { id: 'c2', name: 'ليلى', role: 'المساعدة', traits: ['حكيمة'], background: 'باحثة آثار' }
    ],
    chapters: [
      {
        id: 'ch1',
        title: 'البداية',
        scenes: [
          {
            id: 's1',
            title: 'وصول يوسف',
            description: 'يصل يوسف إلى ساحة المدينة المهجورة ويجد أول دليل.',
            type: 'cinematic',
            content: 'كان الهواء ثقيلاً برائحة الغبار والصدأ عندما خطى يوسف أولى خطواته في الساحة المهجورة...',
            dialogues: [
              { id: 'd1', characterId: 'c1', text: 'لقد عدت أخيراً...' }
            ],
            events: [
              { id: 'e1', title: 'فتح البوابة الكبيرة', description: 'يجب على اللاعب التفاعل مع الرافعة' }
            ]
          }
        ]
      }
    ]
  }
];

export default function App() {
  const [projects, setProjects] = useState<StoryProject[]>(() => {
    const saved = localStorage.getItem('story_projects');
    const parsed = saved ? JSON.parse(saved) : MOCK_PROJECTS;
    // Normalize data to ensure all required arrays exist
    return (parsed as StoryProject[]).map(p => ({
      ...p,
      chapters: p.chapters || [],
      characters: p.characters || [],
      worldBuilding: p.worldBuilding || [],
      outline: p.outline || ''
    }));
  });
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('story_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleCreateProject = () => {
    const newProject: StoryProject = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'مشروع بلا عنوان',
      description: 'وصف لمشروعك الجديد...',
      genre: '',
      style: '',
      tense: 'past',
      lastModified: Date.now(),
      chapters: [],
      characters: [],
      worldBuilding: [],
      outline: ''
    };
    setProjects([newProject, ...projects]);
    setActiveProjectId(newProject.id);
  };

  const handleUpdateProject = (updatedProject: StoryProject) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleDeleteProject = (id: string) => {
    setProjectToDelete(id);
  };

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      setProjects(projects.filter(p => p.id !== projectToDelete));
      setProjectToDelete(null);
    }
  };

  const handleImportProject = (importedProject: StoryProject) => {
    // Check if ID exists, if so update or give new ID
    const exists = projects.find(p => p.id === importedProject.id);
    if (exists) {
      importedProject.id = Math.random().toString(36).substr(2, 9);
    }
    setProjects([importedProject, ...projects]);
    setActiveProjectId(importedProject.id);
  };

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? 'dark' : ''}`} dir="rtl">
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed bottom-6 left-6 z-50 p-3 bg-white dark:bg-dark-card border border-brand-border rounded-full shadow-lg text-brand-accent hover:scale-110 transition-all"
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      {activeProjectId && activeProject ? (
        <Editor 
          project={activeProject} 
          onUpdateProject={handleUpdateProject}
          onBack={() => setActiveProjectId(null)}
        />
      ) : (
        <Dashboard 
          projects={projects}
          onCreateProject={handleCreateProject}
          onSelectProject={setActiveProjectId}
          onDeleteProject={handleDeleteProject}
          onImportProject={handleImportProject}
        />
      )}

      <ConfirmationModal 
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={confirmDeleteProject}
        title="حذف المشروع"
        message="هل أنت متأكد من رغبتك في حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح جميع الفصول والمشاهد الخاصة به."
        confirmText="حذف المشروع"
      />
    </div>
  );
}
