import React, { useState } from 'react';
import { 
  ArrowRight,
  Plus, 
  Trash2, 
  Edit2, 
  Eye, 
  User,
  Users,
  BookOpen,
  Camera, 
  Gamepad, 
  MessageSquare, 
  Zap, 
  Download,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react';
import { StoryProject, Chapter, Scene, Character, SceneType, Dialogue, GameEvent } from './types';
import { cn } from './lib/utils';
import { motion, Reorder } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { jsPDF } from 'jspdf';
import ConfirmationModal from './components/ConfirmationModal';

interface EditorProps {
  project: StoryProject;
  onUpdateProject: (project: StoryProject) => void;
  onBack: () => void;
}

export default function Editor({ project, onUpdateProject, onBack }: EditorProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'characters' | 'world' | 'outline' | 'editor'>('summary');
  const [activeChapterId, setActiveChapterId] = useState<string>(project.chapters?.[0]?.id || '');
  const [activeSceneId, setActiveSceneId] = useState<string>(project.chapters?.[0]?.scenes?.[0]?.id || '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [deleteConfig, setDeleteConfig] = useState<{ 
    type: 'chapter' | 'scene' | 'world' | 'character', 
    id: string, 
    extraId?: string,
    title: string 
  } | null>(null);

  const activeChapter = project.chapters.find(c => c.id === activeChapterId);
  const activeScene = activeChapter?.scenes.find(s => s.id === activeSceneId);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const updateProjectField = <T extends keyof StoryProject>(field: T, value: StoryProject[T]) => {
    onUpdateProject({ ...project, [field]: value, lastModified: Date.now() });
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'فصل جديد',
      scenes: []
    };
    onUpdateProject({
      ...project,
      chapters: [...project.chapters, newChapter],
      lastModified: Date.now()
    });
    setActiveChapterId(newChapter.id);
  };

  const addScene = (chapterId: string) => {
    const newScene: Scene = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'مشهد جديد',
      description: '',
      type: 'cinematic',
      dialogues: [],
      events: []
    };
    const updatedChapters = project.chapters.map(c => {
      if (c.id === chapterId) {
        return { ...c, scenes: [...c.scenes, newScene] };
      }
      return c;
    });
    onUpdateProject({ ...project, chapters: updatedChapters, lastModified: Date.now() });
    setActiveSceneId(newScene.id);
  };

  const updateScene = (updates: Partial<Scene>) => {
    if (!activeScene) return;
    const updatedChapters = project.chapters.map(c => ({
      ...c,
      scenes: c.scenes.map(s => s.id === activeSceneId ? { ...s, ...updates } : s)
    }));
    onUpdateProject({ ...project, chapters: updatedChapters, lastModified: Date.now() });
  };

  const handleAiAction = async (action: string) => {
    if (!aiPrompt && !activeScene && activeTab === 'editor') return;
    setAiLoading(true);
    try {
      const model = 'gemini-2.0-flash';
      let prompt = `أنت مساعد كاتب قصص ألعاب احترافي.
معلومات القصة:
- العنوان: ${project.name}
- النوع: ${project.genre}
- الأسلوب: ${project.style}
- زمن السرد: ${project.tense === 'past' ? 'الماضي' : project.tense === 'present' ? 'المضارع' : 'المستقبل'}
- الملخص: ${project.description}

`;
      
      if (activeTab === 'editor' && activeScene) {
        prompt += `الفصل الحالي: ${activeChapter?.title}\n`;
        prompt += `المشهد الحالي: ${activeScene.title}. وصفه التقني: ${activeScene.description}\n`;
      }
      
      prompt += `المهمة المطلوبة: ${action}. ${aiPrompt ? `ملاحظات إضافية من الكاتب: ${aiPrompt}` : ''}
يرجى كتابة الرد باللغة العربية بأسلوب أدبي رفيع يتناسب مع النوع والأسلوب المذكورين أعلاه.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      setAiResult(response.text || '');
    } catch (error) {
      console.error(error);
      setAiResult('حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.');
    } finally {
      setAiLoading(false);
    }
  };

  const exportProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `${project.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const margin = 10;
    let y = 20;

    doc.setFontSize(22);
    doc.text(project.name, 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(12);
    doc.text(`Genre: ${project.genre} | Style: ${project.style} | Tense: ${project.tense}`, margin, y);
    y += 10;

    doc.setFontSize(14);
    const descLines = doc.splitTextToSize(`Description: ${project.description}`, 190);
    doc.text(descLines, margin, y);
    y += (descLines.length * 7) + 10;

    // Outline
    if (project.outline) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(16);
      doc.text('Story Outline', margin, y);
      y += 10;
      doc.setFontSize(10);
      const outlineLines = doc.splitTextToSize(project.outline, 190);
      doc.text(outlineLines, margin, y);
      y += (outlineLines.length * 5) + 15;
    }

    // World Building
    if (project.worldBuilding.length > 0) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(16);
      doc.text('World Building', margin, y);
      y += 10;
      project.worldBuilding.forEach(entry => {
        doc.setFontSize(12);
        doc.text(`${entry.category}: ${entry.title}`, margin, y);
        y += 7;
        doc.setFontSize(10);
        const contentLines = doc.splitTextToSize(entry.content, 180);
        doc.text(contentLines, margin + 5, y);
        y += (contentLines.length * 5) + 10;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      y += 10;
    }

    project.chapters.forEach((chapter, cIdx) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(18);
      doc.text(`Chapter ${cIdx + 1}: ${chapter.title}`, margin, y);
      y += 10;

      chapter.scenes.forEach((scene, sIdx) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.text(`  Scene ${sIdx + 1}: ${scene.title} (${scene.type})`, margin, y);
        y += 7;
        doc.setFontSize(10);
        const sceneDesc = doc.splitTextToSize(`Description: ${scene.description}`, 180);
        doc.text(sceneDesc, margin + 5, y);
        y += (sceneDesc.length * 5) + 5;

        if (scene.content) {
          const contentLines = doc.splitTextToSize(scene.content, 180);
          doc.text(contentLines, margin + 5, y);
          y += (contentLines.length * 5) + 5;
        }

        scene.dialogues.forEach(d => {
          const char = project.characters.find(c => c.id === d.characterId)?.name || 'Character';
          doc.text(`      ${char}: ${d.text}`, margin, y);
          y += 5;
          if (y > 280) { doc.addPage(); y = 20; }
        });
        y += 10;
      });
      y += 10;
    });

    doc.save(`${project.name}.pdf`);
  };

  const addCharacter = () => {
    const newChar: Character = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'شخصية جديدة',
      role: 'دور ثانوي',
      traits: [],
      background: ''
    };
    onUpdateProject({
      ...project,
      characters: [...project.characters, newChar],
      lastModified: Date.now()
    });
  };

  const addEvent = () => {
    if (!activeScene) return;
    const newEvent: GameEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'حدث جديد',
      description: 'وصف الحدث...'
    };
    updateScene({ events: [...activeScene.events, newEvent] });
  };

  const deleteDialogue = (id: string) => {
    if (!activeScene) return;
    updateScene({ dialogues: activeScene.dialogues.filter(d => d.id !== id) });
  };

  const deleteEvent = (id: string) => {
    if (!activeScene) return;
    updateScene({ events: activeScene.events.filter(e => e.id !== id) });
  };

  const deleteChapter = (id: string) => {
    const chapter = project.chapters.find(c => c.id === id);
    setDeleteConfig({ type: 'chapter', id, title: chapter?.title || 'هذا الفصل' });
  };

  const confirmDeleteChapter = (id: string) => {
    onUpdateProject({
      ...project,
      chapters: project.chapters.filter(c => c.id !== id),
      lastModified: Date.now()
    });
    if (activeChapterId === id) {
      setActiveChapterId('');
      setActiveSceneId('');
    }
  };

  const deleteScene = (chapterId: string, sceneId: string) => {
    const scene = project.chapters.find(c => c.id === chapterId)?.scenes.find(s => s.id === sceneId);
    setDeleteConfig({ type: 'scene', id: sceneId, extraId: chapterId, title: scene?.title || 'هذا المشهد' });
  };

  const confirmDeleteScene = (chapterId: string, sceneId: string) => {
    const updatedChapters = project.chapters.map(c => {
      if (c.id === chapterId) {
        return { ...c, scenes: c.scenes.filter(s => s.id !== sceneId) };
      }
      return c;
    });
    onUpdateProject({ ...project, chapters: updatedChapters, lastModified: Date.now() });
    if (activeSceneId === sceneId) setActiveSceneId('');
  };

  return (
    <div className="grid h-screen w-full grid-rows-[60px_1fr_140px] grid-cols-[240px_1fr_240px] bg-brand-gray dark:bg-dark-bg overflow-hidden text-right transition-colors duration-300" dir="rtl">
      {/* Header */}
      <header className="col-span-3 bg-white dark:bg-dark-card border-b border-brand-border flex items-center justify-between px-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)] z-30">
        <div className="flex items-center gap-3 text-xl font-bold text-brand-accent">
          <span className="text-2xl">◈</span>
          <span>حكواتي الألعاب</span>
          <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
          <span className="text-sm text-slate-500 dark:text-dark-muted font-normal truncate max-w-[200px]">{project.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn-secondary soft-button px-4 py-1.5 flex items-center gap-2">
            <ArrowRight size={16} />
            الرئيسية
          </button>
          <button onClick={exportPdf} className="btn-secondary soft-button px-4 py-1.5 flex items-center gap-2">
            <Download size={16} />
            تصدير PDF
          </button>
          <button onClick={exportProject} className="btn-secondary soft-button px-4 py-1.5 flex items-center gap-2">
            <Download size={16} />
            تصدير JSON
          </button>
          <button onClick={addChapter} className="btn-primary soft-button px-4 py-1.5 flex items-center gap-2">
            <Plus size={16} />
            فصل جديد
          </button>
        </div>
      </header>

      {/* Right Sidebar - Projects/Chapters/Characters */}
      <aside className="col-start-3 row-start-2 bg-white dark:bg-dark-card border-r border-brand-border p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar z-20">
        <div className="space-y-4">
          <div className="sidebar-title">أفكاري</div>
          <nav className="flex flex-col gap-1">
            {[
              { id: 'summary', label: 'ملخص', icon: <BookOpen size={16} /> },
              { id: 'characters', label: 'الشخصيات', icon: <Users size={16} /> },
              { id: 'world', label: 'بناء العالم', icon: <Eye size={16} /> },
              { id: 'outline', label: 'مخطط تفصيلي', icon: <GripVertical size={16} /> },
              { id: 'editor', label: 'المحرر', icon: <Edit2 size={16} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-brand-pink dark:bg-pink-900/30 text-brand-accent shadow-sm" 
                    : "text-slate-500 dark:text-dark-muted hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'editor' && (
          <div>
            <div className="sidebar-title">الفصول والمشاهد</div>
            {/* ... rest of chapter/scene list ... */}
          <div className="space-y-2">
            {project.chapters?.map((chapter) => (
              <div key={chapter.id} className="space-y-1">
                <div 
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg text-sm font-bold cursor-pointer transition-all",
                    activeChapterId === chapter.id 
                      ? "bg-brand-pink dark:bg-pink-900/30 text-brand-accent" 
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-dark-text"
                  )}
                  onClick={() => setActiveChapterId(chapter.id)}
                >
                  <span className="truncate">{chapter.title}</span>
                  <ChevronDown size={14} className={cn("transition-transform", activeChapterId === chapter.id && "rotate-180")} />
                  <Trash2 size={12} className="text-red-400 hover:text-red-600 ml-2" onClick={(e) => { e.stopPropagation(); deleteChapter(chapter.id); }} />
                </div>
                {activeChapterId === chapter.id && (
                  <div className="mr-3 border-r border-pink-100 dark:border-pink-900/40 pr-2 space-y-1 py-1">
                    {chapter.scenes?.map(scene => (
                      <div
                        key={scene.id}
                        onClick={() => setActiveSceneId(scene.id)}
                        className={cn(
                          "w-full text-right p-1.5 text-xs rounded-md cursor-pointer flex items-center gap-2 transition-all",
                          activeSceneId === scene.id 
                            ? "bg-white dark:bg-slate-800 text-brand-accent border border-brand-pink dark:border-brand-accent shadow-sm font-bold" 
                            : "text-slate-500 dark:text-dark-muted hover:text-slate-800 dark:hover:text-dark-text"
                        )}
                      >
                        {scene.type === 'cinematic' ? <Camera size={12} /> : <Gamepad size={12} />}
                        <span className="truncate">{scene.title}</span>
                        <Trash2 size={10} className="text-red-300 hover:text-red-500 mr-auto" onClick={(e) => { e.stopPropagation(); deleteScene(chapter.id, scene.id); }} />
                      </div>
                    ))}
                    <button onClick={() => addScene(chapter.id)} className="text-[10px] text-brand-accent hover:underline mt-1 pr-1 font-bold">
                      + مشهد جديد
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        )}

        <div>
          <div className="sidebar-title">الشخصيات النشطة</div>
          <div className="space-y-2">
            {project.characters?.slice(0, 3).map(char => (
              <div key={char.id} className="flex items-center gap-3 p-2.5 bg-[#fdfdfd] dark:bg-slate-800/50 border border-[#f0f0f0] dark:border-dark-border rounded-lg">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                  {char.name[0]}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-bold truncate leading-tight dark:text-dark-text">{char.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-dark-muted truncate leading-tight">{char.role}</p>
                </div>
              </div>
            ))}
            <button onClick={() => setActiveTab('characters')} className="w-full py-2 border border-dashed border-pink-200 dark:border-dark-border rounded-lg text-[10px] text-brand-accent hover:bg-pink-50 dark:hover:bg-slate-800 transition-all font-bold">
              إدارة كل الشخصيات
            </button>
          </div>
        </div>
      </aside>

      {/* Main Editor */}
      <main className="col-start-2 row-start-2 bg-[#f8f7f4] dark:bg-dark-bg p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        {activeTab === 'summary' && (
          <div className="max-w-3xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header>
              <h2 className="text-3xl font-serif font-bold text-ink dark:text-dark-text mb-2">قصة الكتاب المقدس</h2>
              <p className="text-slate-500 dark:text-dark-muted text-sm leading-relaxed">
                تتبع التفاصيل الرئيسية لعالم قصتك لتحسين الاقتراحات أو املأها خطوة بخطوة لتطوير فكرتك إلى مسودة أولية.
              </p>
            </header>
            
            <section className="space-y-4">
              <div className="sidebar-title">النوع والأسلوب</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400">النوع الأدبي</label>
                  <input 
                    type="text" 
                    value={project.genre}
                    onChange={(e) => updateProjectField('genre', e.target.value)}
                    placeholder="رومانسي، رعب، فانتازيا..." 
                    className="w-full bg-white dark:bg-dark-card border border-brand-border p-3 rounded-xl text-sm focus:ring-1 focus:ring-brand-pink outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400">الأسلوب</label>
                  <input 
                    type="text" 
                    value={project.style}
                    onChange={(e) => updateProjectField('style', e.target.value)}
                    placeholder="أسلوب مخصص..." 
                    className="w-full bg-white dark:bg-dark-card border border-brand-border p-3 rounded-xl text-sm focus:ring-1 focus:ring-brand-pink outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="sidebar-title">ملخص القصة</div>
              <textarea 
                value={project.description}
                onChange={(e) => updateProjectField('description', e.target.value)}
                className="w-full h-48 bg-white dark:bg-dark-card border border-brand-border p-4 rounded-xl text-sm focus:ring-1 focus:ring-brand-pink outline-none resize-none leading-relaxed"
                placeholder="قم بتقديم الشخصيات وأهدافها والصراع المركزي..."
              />
            </section>

            <section className="space-y-4">
              <div className="sidebar-title">زمن السرد</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'past', label: 'الماضي', desc: 'يخلق شعوراً بسرد القصص' },
                  { id: 'present', label: 'زمن المضارع', desc: 'طابع أكثر حيوية وإثارة' },
                  { id: 'future', label: 'زمن المستقبل', desc: 'خيار غير مألوف، مفيد للتباين' },
                ].map((t) => (
                  <button 
                    key={t.id}
                    onClick={() => updateProjectField('tense', t.id as any)}
                    className={cn(
                      "flex flex-col gap-1 p-4 rounded-xl text-right border transition-all hover:border-brand-pink",
                      project.tense === t.id 
                        ? "bg-brand-pink/10 border-brand-pink shadow-sm" 
                        : "bg-white dark:bg-dark-card border-brand-border"
                    )}
                  >
                    <span className="font-bold text-sm text-brand-accent">{t.label}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">{t.desc}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="max-w-4xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-serif font-bold text-ink dark:text-dark-text">الشخصيات</h2>
                <p className="text-slate-500 dark:text-dark-muted text-sm mt-1">إدارة الأبطال والشخصيات الثانوية في عالمك.</p>
              </div>
              <button onClick={addCharacter} className="btn-primary soft-button px-6">
                <Plus size={18} />
                إضافة شخصية
              </button>
            </header>

            <div className="grid grid-cols-2 gap-4">
              {project.characters?.map(char => (
                <div key={char.id} className="soft-card p-5 group relative space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-brand-pink/20 flex items-center justify-center text-brand-accent font-bold text-xl">
                      {char.name[0]}
                    </div>
                    <div className="flex-grow">
                      <input 
                        type="text" 
                        value={char.name}
                        onChange={(e) => {
                          const updated = (project.characters || []).map(c => c.id === char.id ? { ...c, name: e.target.value } : c);
                          updateProjectField('characters', updated);
                        }}
                        className="text-lg font-bold bg-transparent border-none p-0 focus:ring-0 w-full dark:text-dark-text"
                      />
                      <input 
                        type="text" 
                        value={char.role}
                        onChange={(e) => {
                          const updated = (project.characters || []).map(c => c.id === char.id ? { ...c, role: e.target.value } : c);
                          updateProjectField('characters', updated);
                        }}
                        className="text-xs text-slate-400 bg-transparent border-none p-0 focus:ring-0 w-full"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const charObj = project.characters?.find(c => c.id === char.id);
                        if (charObj) setDeleteConfig({ type: 'character', id: charObj.id, title: charObj.name });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">الخلفية الدرامية</label>
                    <textarea 
                      value={char.background}
                      onChange={(e) => {
                        const updated = (project.characters || []).map(c => c.id === char.id ? { ...c, background: e.target.value } : c);
                        updateProjectField('characters', updated);
                      }}
                      className="w-full bg-[#fafafa] dark:bg-slate-800/30 border border-brand-border p-3 rounded-lg text-xs h-20 resize-none outline-none dark:text-dark-text"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'world' && (
          <div className="max-w-4xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-serif font-bold text-ink dark:text-dark-text">بناء العالم</h2>
                <p className="text-slate-500 dark:text-dark-muted text-sm mt-1">تتبع التفاصيل الرئيسية لعالم قصتك لتحسين الاقتراحات.</p>
              </div>
              <button 
                onClick={() => {
                  const newEntry = { id: Math.random().toString(), category: 'عام', title: 'عنصر جديد', content: '' };
                  updateProjectField('worldBuilding', [...project.worldBuilding, newEntry]);
                }} 
                className="btn-primary soft-button px-6"
              >
                <Plus size={18} />
                عنصر جديد
              </button>
            </header>

            <div className="grid grid-cols-1 gap-4">
              {project.worldBuilding?.map(entry => (
                <div key={entry.id} className="soft-card p-6 space-y-4">
                  <div className="flex justify-between gap-4">
                    <div className="flex-grow flex gap-4">
                      <input 
                        type="text" 
                        value={entry.category}
                        onChange={(e) => {
                          const updated = (project.worldBuilding || []).map(w => w.id === entry.id ? { ...w, category: e.target.value } : w);
                          updateProjectField('worldBuilding', updated);
                        }}
                        className="text-[10px] font-bold bg-brand-pink/10 text-brand-accent px-2 py-1 rounded h-fit outline-none"
                      />
                      <input 
                        type="text" 
                        value={entry.title}
                        onChange={(e) => {
                          const updated = (project.worldBuilding || []).map(w => w.id === entry.id ? { ...w, title: e.target.value } : w);
                          updateProjectField('worldBuilding', updated);
                        }}
                        className="text-lg font-bold bg-transparent border-none p-0 focus:ring-0 flex-grow dark:text-dark-text"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const wbEntry = project.worldBuilding?.find(w => w.id === entry.id);
                        if (wbEntry) setDeleteConfig({ type: 'world', id: wbEntry.id, title: wbEntry.title });
                      }}
                      className="text-slate-300 hover:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <textarea 
                    value={entry.content}
                    onChange={(e) => {
                      const updated = (project.worldBuilding || []).map(w => w.id === entry.id ? { ...w, content: e.target.value } : w);
                      updateProjectField('worldBuilding', updated);
                    }}
                    className="w-full bg-[#fafafa] dark:bg-slate-800/30 border border-brand-border p-4 rounded-xl text-sm h-32 resize-none outline-none dark:text-dark-text"
                    placeholder="اكتب تفاصيل هذا العنصر من العالم..."
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'outline' && (
          <div className="max-w-4xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <header className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-serif font-bold text-ink dark:text-dark-text">مخطط تفصيلي</h2>
                <p className="text-slate-500 dark:text-dark-muted text-sm mt-1">ارسم خريطة الطريق لقصتك من البداية إلى النهاية.</p>
              </div>
              <button onClick={() => handleAiAction('توليد مخطط تفصيلي')} className="btn-primary soft-button px-6">
                <Sparkles size={18} />
                توليد مخطط بالذكاء الاصطناعي
              </button>
            </header>

            <div className="soft-card p-1 min-h-[500px]">
              <textarea 
                value={project.outline}
                onChange={(e) => updateProjectField('outline', e.target.value)}
                className="w-full min-h-[500px] p-8 font-serif text-lg leading-loose bg-white dark:bg-dark-card rounded-xl border-none focus:ring-0 resize-none outline-none dark:text-dark-text"
                placeholder="ابدأ بكتابة مخطط روايتك هنا..."
              />
            </div>
          </div>
        )}

        {activeTab === 'editor' && activeScene && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="soft-card p-0 flex flex-col h-full overflow-hidden">
              <div className="border-b border-brand-border p-6 flex justify-between items-center bg-white dark:bg-dark-card">
                <div>
                  <h2 className="text-xl font-bold dark:text-dark-text">{activeScene.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{activeChapter?.title} | {activeScene.type === 'cinematic' ? 'مشهد سينمائي' : 'مشهد لعب'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAiAction('اكتب مسودة لهذا المشهد')} className="btn-primary soft-button text-xs py-1.5 px-4 shadow-none font-bold">
                    <Sparkles size={14} />
                    يكتب
                  </button>
                  <button onClick={() => handleAiAction('اقترح أفكار للمشهد الحالي')} className="btn-secondary soft-button text-xs py-1.5 px-4 border-slate-200">
                    <Zap size={14} />
                    يولد
                  </button>
                </div>
              </div>
              
              <div className="flex-grow grid grid-cols-[1fr_320px]">
                <div className="p-8 border-l border-brand-border bg-white dark:bg-dark-card overflow-y-auto custom-scrollbar">
                  <textarea 
                    value={activeScene.content || ''}
                    onChange={(e) => updateScene({ content: e.target.value })}
                    className="w-full h-full min-h-[400px] font-serif text-xl leading-relaxed bg-transparent border-none focus:ring-0 outline-none resize-none dark:text-dark-text"
                    placeholder="... مع رائحة العاصفة الرطبة التي تقترب، تشبثت به وهو..."
                  />
                </div>
                
                <div className="bg-[#fcfcfc] dark:bg-slate-900/50 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                    <div className="sidebar-title">وصف تقني للمشهد</div>
                    <textarea 
                      value={activeScene.description}
                      onChange={(e) => updateScene({ description: e.target.value })}
                      className="w-full h-24 bg-white dark:bg-dark-card border border-brand-border p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-pink leading-normal dark:text-dark-text"
                      placeholder="ما الكاميرا والبيئة تفعل؟"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="sidebar-title">الحوارات (المسودة)</div>
                    <div className="space-y-3">
                      {activeScene.dialogues?.map((d, i) => (
                        <div key={d.id} className="bg-white dark:bg-dark-card border border-brand-border p-3 rounded-lg flex flex-col gap-1 shadow-sm">
                          <div className="flex justify-between items-center text-[10px] font-bold text-brand-accent mb-1 border-b border-slate-50 dark:border-dark-border pb-1">
                            <span>{project.characters?.find(c => c.id === d.characterId)?.name || 'شخصية'}</span>
                            <button onClick={() => deleteDialogue(d.id)} className="text-slate-200 hover:text-red-400"><Trash2 size={12} /></button>
                          </div>
                          <input 
                            value={d.text}
                            onChange={(e) => {
                              const updated = [...(activeScene.dialogues || [])];
                              if (updated[i]) {
                                updated[i].text = e.target.value;
                                updateScene({ dialogues: updated });
                              }
                            }}
                            className="bg-transparent border-none p-0 text-xs focus:ring-0 dark:text-dark-text"
                          />
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newD: Dialogue = { id: Math.random().toString(), characterId: project.characters?.[0]?.id || '', text: '' };
                          updateScene({ dialogues: [...(activeScene.dialogues || []), newD] });
                        }}
                        className="w-full py-2 border border-dashed border-slate-200 text-[10px] text-slate-400 hover:bg-slate-50 rounded-lg transition-all"
                      >
                        + إضافة حوار جديد
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'editor' && !activeScene && (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400 italic gap-4">
            <BookOpen size={48} className="opacity-20" />
            اختر مشهداً من القائمة الجانبية للبدء بالتحرير...
          </div>
        )}
      </main>

      {/* Left Sidebar - AI */}
      <aside className="col-start-1 row-start-2 bg-white dark:bg-dark-card border-l border-brand-border p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <div className="ai-gradient p-4 rounded-xl shadow-sm">
          <div className="text-brand-accent font-bold text-sm mb-4 flex items-center gap-2">
            <Sparkles size={16} /> المساعد الذكي ✧
          </div>
          <div className="space-y-2">
            <button onClick={() => handleAiAction('توليد فكرة للمشهد التالي')} className="w-full text-right bg-white dark:bg-slate-800 border border-[#eee] dark:border-dark-border p-2.5 rounded-lg text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm dark:text-dark-text">
              <span className="text-pink-400">💡</span> ولّد فكرة للمشهد التالي
            </button>
            <button onClick={() => handleAiAction('تطوير الحوار الحالي')} className="w-full text-right bg-white dark:bg-slate-800 border border-[#eee] dark:border-dark-border p-2.5 rounded-lg text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm dark:text-dark-text">
              <span className="text-blue-400">✎</span> طوّر الحوار الحالي
            </button>
            <button onClick={() => handleAiAction('اقتراح سمات للشخصية')} className="w-full text-right bg-white dark:bg-slate-800 border border-[#eee] dark:border-dark-border p-2.5 rounded-lg text-[13px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm dark:text-dark-text">
              <span className="text-orange-400">👤</span> اقترح سمات للشخصية
            </button>
          </div>
          
          {aiLoading && (
            <div className="mt-4 text-[11px] text-slate-500 dark:text-dark-muted animate-pulse text-center">جاري التفكير...</div>
          )}
          
          {aiResult && !aiLoading && (
            <div className="mt-4 bg-white/80 dark:bg-dark-card/80 p-3 rounded-lg border border-brand-pink dark:border-brand-accent text-[11px] leading-relaxed max-h-40 overflow-y-auto custom-scrollbar dark:text-dark-text">
              {aiResult}
            </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="sidebar-title">إعدادات الكاميرا</div>
          <div className="text-[12px] bg-[#f9f9f9] dark:bg-slate-800/30 p-3 rounded-lg border border-dashed border-[#ccc] dark:border-dark-border leading-loose dark:text-dark-muted">
            <div className="flex justify-between"><span>الزاوية:</span> <span className="text-brand-accent">متوسطة</span></div>
            <div className="flex justify-between"><span>التركيز:</span> <span className="text-brand-accent">وجه البطل</span></div>
            <div className="flex justify-between"><span>التوقيت:</span> <span className="text-brand-accent">00:45 ث</span></div>
          </div>
        </div>
      </aside>

      {/* Timeline Bar - Footer */}
      <footer className="col-span-3 row-start-3 bg-white dark:bg-dark-card border-t border-brand-border p-4 px-6 flex flex-col gap-2 z-30 shadow-[0_-2px_4px_rgba(0,0,0,0.02)]">
        <div className="sidebar-title !m-0">الجدول الزمني للقصة</div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar scroll-smooth">
          {project.chapters?.flatMap((c, cIdx) => 
            c.scenes?.map((s, sIdx) => (
              <div 
                key={s.id}
                onClick={() => { setActiveChapterId(c.id); setActiveSceneId(s.id); }}
                className={cn(
                  "min-w-[140px] h-[70px] rounded-lg p-2.5 text-[11px] border transition-all cursor-pointer flex flex-col justify-between relative",
                  activeSceneId === s.id && activeChapterId === c.id 
                    ? "border-brand-accent bg-brand-pink dark:bg-brand-accent/30" 
                    : "border-brand-border dark:border-dark-border bg-[#f2f2f2] dark:bg-dark-bg hover:border-pink-300 dark:hover:border-brand-accent"
                )}
              >
                <div className="font-bold truncate dark:text-dark-text">{s.title}</div>
                <div className="text-[9px] text-slate-500 dark:text-dark-muted uppercase">{c.title}</div>
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#ddd] dark:bg-slate-700 text-[8px] font-bold dark:text-dark-text">
                  {s.type === 'cinematic' ? 'سينمائي' : 'لعب'}
                </div>
                {activeSceneId === s.id && activeChapterId === c.id && <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-[#4CAF50]"></div>}
              </div>
            )) || []
          )}
          <button 
            onClick={() => addScene(activeChapterId || project.chapters?.[0]?.id)}
            className="min-w-[140px] h-[70px] rounded-lg border border-dashed border-[#ccc] dark:border-dark-border opacity-50 flex items-center justify-center text-[10px] cursor-pointer hover:opacity-100 transition-all dark:text-dark-muted"
          >
            + إضافة مشهد
          </button>
        </div>
      </footer>

      <ConfirmationModal 
        isOpen={!!deleteConfig}
        onClose={() => setDeleteConfig(null)}
        onConfirm={() => {
          if (!deleteConfig) return;
          if (deleteConfig.type === 'chapter') confirmDeleteChapter(deleteConfig.id);
          if (deleteConfig.type === 'scene' && deleteConfig.extraId) confirmDeleteScene(deleteConfig.extraId, deleteConfig.id);
          if (deleteConfig.type === 'world') updateProjectField('worldBuilding', project.worldBuilding.filter(w => w.id !== deleteConfig.id));
          if (deleteConfig.type === 'character') updateProjectField('characters', project.characters.filter(c => c.id !== deleteConfig.id));
        }}
        title={`حذف ${deleteConfig?.type === 'chapter' ? 'الفصل' : deleteConfig?.type === 'scene' ? 'المشهد' : deleteConfig?.type === 'character' ? 'الشخصية' : 'العنصر'}`}
        message={`هل أنت متأكد من رغبتك في حذف "${deleteConfig?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
      />
    </div>
  );
}
