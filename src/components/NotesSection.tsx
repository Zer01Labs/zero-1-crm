import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pin, Plus, CheckSquare, Tag, Palette, Trash2, Copy, 
  Search, X, Check, Edit3, Grid, List, Sparkles, Filter, 
  Clock, Share2, CheckCircle2, CornerDownLeft, AlertCircle, FileText
} from 'lucide-react';
import { Note, NoteColor, NoteChecklistItem, CompanySettings } from '../types';

interface NotesSectionProps {
  notes: Note[];
  companySettings?: CompanySettings;
  onAddNote: (note: Omit<Note, 'id'>) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

const COLOR_OPTIONS: { id: NoteColor; label: string; bgClass: string; borderClass: string; badgeBg: string; activeRing: string }[] = [
  { 
    id: 'default', 
    label: 'Default', 
    bgClass: 'bg-surface border-border hover:border-border-soft', 
    borderClass: 'border-border', 
    badgeBg: 'bg-surface-2 text-ink-soft',
    activeRing: 'ring-stone-400' 
  },
  { 
    id: 'amber', 
    label: 'Amber / Sand', 
    bgClass: 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50', 
    borderClass: 'border-amber-500/30', 
    badgeBg: 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
    activeRing: 'ring-amber-500' 
  },
  { 
    id: 'emerald', 
    label: 'Emerald / Mint', 
    bgClass: 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50', 
    borderClass: 'border-emerald-500/30', 
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
    activeRing: 'ring-emerald-500' 
  },
  { 
    id: 'teal', 
    label: 'Teal / Sea', 
    bgClass: 'bg-teal-950/20 border-teal-500/30 hover:border-teal-500/50', 
    borderClass: 'border-teal-500/30', 
    badgeBg: 'bg-teal-500/15 text-teal-300 border border-teal-500/20',
    activeRing: 'ring-teal-500' 
  },
  { 
    id: 'blue', 
    label: 'Ocean Blue', 
    bgClass: 'bg-blue-950/20 border-blue-500/30 hover:border-blue-500/50', 
    borderClass: 'border-blue-500/30', 
    badgeBg: 'bg-blue-500/15 text-blue-300 border border-blue-500/20',
    activeRing: 'ring-blue-500' 
  },
  { 
    id: 'indigo', 
    label: 'Indigo / Dusk', 
    bgClass: 'bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/50', 
    borderClass: 'border-indigo-500/30', 
    badgeBg: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20',
    activeRing: 'ring-indigo-500' 
  },
  { 
    id: 'purple', 
    label: 'Lavender / Violet', 
    bgClass: 'bg-purple-950/20 border-purple-500/30 hover:border-purple-500/50', 
    borderClass: 'border-purple-500/30', 
    badgeBg: 'bg-purple-500/15 text-purple-300 border border-purple-500/20',
    activeRing: 'ring-purple-500' 
  },
  { 
    id: 'rose', 
    label: 'Blush / Rose', 
    bgClass: 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50', 
    borderClass: 'border-rose-500/30', 
    badgeBg: 'bg-rose-500/15 text-rose-300 border border-rose-500/20',
    activeRing: 'ring-rose-500' 
  },
  { 
    id: 'orange', 
    label: 'Peach / Coral', 
    bgClass: 'bg-orange-950/20 border-orange-500/30 hover:border-orange-500/50', 
    borderClass: 'border-orange-500/30', 
    badgeBg: 'bg-orange-500/15 text-orange-300 border border-orange-500/20',
    activeRing: 'ring-orange-500' 
  }
];

export default function NotesSection({
  notes,
  companySettings,
  onAddNote,
  onUpdateNote,
  onDeleteNote
}: NotesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // New Note Composer State
  const [isExpanded, setIsExpanded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState<NoteColor>('default');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [newIsChecklist, setNewIsChecklist] = useState(false);
  const [newChecklist, setNewChecklist] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Edit Note Modal State
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editChecklistInput, setEditChecklistInput] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [editShowColorPicker, setEditShowColorPicker] = useState(false);

  // Copy feedback notification
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const composerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to auto-save collapsed composer
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(e.target as Node)) {
        if (isExpanded) {
          handleSaveNewNote();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, newTitle, newContent, newChecklist, newTags, newColor, newIsPinned, newIsChecklist]);

  // Extract all unique tags across notes
  const allTags = Array.from(
    new Set(
      notes.flatMap(n => n.tags || []).filter(Boolean)
    )
  ).sort();

  // Save new note
  const handleSaveNewNote = () => {
    const hasContent = newTitle.trim() || newContent.trim() || newChecklist.some(c => c.text.trim());
    if (hasContent) {
      const today = new Date().toISOString().split('T')[0];
      onAddNote({
        title: newTitle.trim(),
        content: newContent.trim(),
        color: newColor,
        isPinned: newIsPinned,
        isChecklist: newIsChecklist,
        checklist: newIsChecklist ? newChecklist.filter(c => c.text.trim()) : undefined,
        tags: newTags,
        createdAt: today,
        authorName: companySettings?.companyName ? `${companySettings.companyName} Team` : 'Workspace'
      });
    }

    // Reset composer
    setNewTitle('');
    setNewContent('');
    setNewColor('default');
    setNewIsPinned(false);
    setNewIsChecklist(false);
    setNewChecklist([]);
    setNewChecklistInput('');
    setNewTags([]);
    setNewTagInput('');
    setShowColorPicker(false);
    setIsExpanded(false);
  };

  // Add checklist item in composer
  const handleAddComposerChecklistItem = () => {
    if (newChecklistInput.trim()) {
      setNewChecklist(prev => [
        ...prev,
        { id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`, text: newChecklistInput.trim(), completed: false }
      ]);
      setNewChecklistInput('');
    }
  };

  // Add tag in composer
  const handleAddComposerTag = () => {
    const formatted = newTagInput.trim().replace(/^#/, '');
    if (formatted && !newTags.includes(formatted)) {
      setNewTags(prev => [...prev, formatted]);
      setNewTagInput('');
    }
  };

  // Toggle checklist item status on a live note directly from card
  const handleToggleCardChecklist = (note: Note, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note.checklist) return;

    const updatedChecklist = note.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    onUpdateNote({
      ...note,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString()
    });
  };

  // Toggle pin on a note
  const handleTogglePin = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNote({
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date().toISOString()
    });
  };

  // Change color on a note
  const handleChangeNoteColor = (note: Note, color: NoteColor, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNote({
      ...note,
      color,
      updatedAt: new Date().toISOString()
    });
  };

  // Duplicate note
  const handleDuplicateNote = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddNote({
      title: note.title ? `${note.title} (Copy)` : 'Copy of Note',
      content: note.content,
      color: note.color,
      isPinned: note.isPinned,
      isChecklist: note.isChecklist,
      checklist: note.checklist ? note.checklist.map(c => ({ ...c, id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}` })) : undefined,
      tags: note.tags ? [...note.tags] : [],
      createdAt: new Date().toISOString().split('T')[0],
      authorName: note.authorName
    });
  };

  // Copy note text
  const handleCopyNote = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    let text = note.title ? `${note.title}\n\n` : '';
    if (note.isChecklist && note.checklist) {
      text += note.checklist.map(c => `${c.completed ? '[x]' : '[ ]'} ${c.text}`).join('\n');
    } else {
      text += note.content;
    }

    navigator.clipboard.writeText(text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter notes
  const filteredNotes = notes.filter(n => {
    if (selectedTag !== 'all') {
      if (!n.tags || !n.tags.includes(selectedTag)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchContent = n.content?.toLowerCase().includes(q);
      const matchTags = n.tags?.some(t => t.toLowerCase().includes(q));
      const matchChecklist = n.checklist?.some(c => c.text.toLowerCase().includes(q));
      return matchTitle || matchContent || matchTags || matchChecklist;
    }
    return true;
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  const getColorConfig = (color?: NoteColor) => {
    return COLOR_OPTIONS.find(c => c.id === color) || COLOR_OPTIONS[0];
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-12">
      {/* 1. HEADER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-brand" size={20} />
            <h1 className="text-xl font-display font-bold text-ink tracking-tight uppercase">
              Workspace Keep Notes
            </h1>
          </div>
          <p className="text-xs text-ink-soft mt-1 font-sans">
            Capture agency ideas, client meeting minutes, project checklists, and strategic agendas.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* SEARCH INPUT */}
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-3 text-ink-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in notes..."
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-ink-faint hover:text-ink cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* VIEW MODE TOGGLE */}
          <div className="flex items-center bg-surface-2 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-surface text-ink shadow-sm' : 'text-ink-faint hover:text-ink'
              }`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-surface text-ink shadow-sm' : 'text-ink-faint hover:text-ink'
              }`}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAGS CHIP FILTER BAR */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-mono text-ink-faint uppercase mr-1 flex items-center gap-1 shrink-0">
            <Filter size={12} /> Tags:
          </span>
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1 rounded-lg font-medium text-xs transition-all cursor-pointer shrink-0 ${
              selectedTag === 'all'
                ? 'bg-brand text-white shadow-card'
                : 'bg-surface-2 text-ink-soft hover:text-ink border border-border'
            }`}
          >
            All Notes ({notes.length})
          </button>
          {allTags.map(tag => {
            const count = notes.filter(n => n.tags?.includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  selectedTag === tag
                    ? 'bg-brand text-white shadow-card font-semibold'
                    : 'bg-surface-2 text-ink-soft hover:text-ink border border-border'
                }`}
              >
                <span>#{tag}</span>
                <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. GOOGLE KEEP QUICK COMPOSER (TOP) */}
      <div className="flex justify-center">
        <div 
          ref={composerRef}
          className={`w-full max-w-2xl transition-all duration-200 rounded-2xl border shadow-card overflow-hidden ${
            getColorConfig(newColor).bgClass
          } ${isExpanded ? 'p-4' : 'p-2.5 px-4 cursor-text'}`}
          onClick={() => {
            if (!isExpanded) setIsExpanded(true);
          }}
        >
          {!isExpanded ? (
            /* COLLAPSED BAR */
            <div className="flex items-center justify-between text-ink-faint">
              <span className="text-xs font-medium">Take a note or create a checklist...</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewIsChecklist(true);
                    setIsExpanded(true);
                  }}
                  className="p-1.5 hover:bg-surface-2 rounded-lg text-ink-soft hover:text-ink transition-colors cursor-pointer"
                  title="New checklist note"
                >
                  <CheckSquare size={16} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                  className="p-1.5 hover:bg-surface-2 rounded-lg text-ink-soft hover:text-ink transition-colors cursor-pointer"
                  title="New text note"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* EXPANDED COMPOSER */
            <div className="space-y-3 animate-fadeIn">
              {/* TITLE & PIN */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full bg-transparent font-display font-bold text-sm text-ink placeholder:text-ink-faint focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setNewIsPinned(!newIsPinned)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    newIsPinned ? 'text-amber-500 bg-amber-500/15' : 'text-ink-faint hover:text-ink'
                  }`}
                  title={newIsPinned ? "Unpin note" : "Pin note"}
                >
                  <Pin size={16} className={newIsPinned ? "fill-amber-500 rotate-45" : ""} />
                </button>
              </div>

              {/* CHECKLIST OR CONTENT */}
              {newIsChecklist ? (
                <div className="space-y-2">
                  {newChecklist.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setNewChecklist(prev => prev.map((c, i) => i === idx ? { ...c, completed: !c.completed } : c));
                        }}
                        className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                          item.completed ? 'bg-brand border-brand text-white' : 'border-border bg-surface'
                        }`}
                      >
                        {item.completed && <Check size={12} />}
                      </button>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewChecklist(prev => prev.map((c, i) => i === idx ? { ...c, text: val } : c));
                        }}
                        className={`flex-1 bg-transparent text-ink focus:outline-none ${item.completed ? 'line-through text-ink-faint' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setNewChecklist(prev => prev.filter((_, i) => i !== idx))}
                        className="text-ink-faint hover:text-loss cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}

                  {/* ADD CHECKLIST ITEM INPUT */}
                  <div className="flex items-center gap-2 pt-1">
                    <Plus size={14} className="text-ink-faint" />
                    <input
                      type="text"
                      value={newChecklistInput}
                      onChange={(e) => setNewChecklistInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComposerChecklistItem();
                        }
                      }}
                      placeholder="List item (press Enter to add)..."
                      className="flex-1 bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none"
                    />
                    {newChecklistInput && (
                      <button
                        type="button"
                        onClick={handleAddComposerChecklistItem}
                        className="text-[10px] px-2 py-0.5 rounded bg-surface-2 border border-border text-ink cursor-pointer"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Take a note..."
                  rows={3}
                  className="w-full bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none resize-none leading-relaxed"
                />
              )}

              {/* TAGS LIST & ADDER */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {newTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-2 border border-border text-ink-soft"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setNewTags(prev => prev.filter(t => t !== tag))}
                      className="hover:text-loss cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}

                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddComposerTag();
                      }
                    }}
                    placeholder="+ Add tag"
                    className="w-20 bg-transparent text-[10px] font-mono text-ink placeholder:text-ink-faint focus:outline-none"
                  />
                  {newTagInput && (
                    <button
                      type="button"
                      onClick={handleAddComposerTag}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-surface-2 text-ink-soft cursor-pointer"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>

              {/* BOTTOM TOOLBAR */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                <div className="flex items-center gap-1">
                  {/* COLOR PICKER TOGGLE */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                      title="Background color"
                    >
                      <Palette size={15} />
                    </button>

                    {showColorPicker && (
                      <div className="absolute bottom-8 left-0 z-20 p-2 rounded-xl bg-surface border border-border shadow-2xl flex items-center gap-1.5 animate-fadeIn">
                        {COLOR_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setNewColor(opt.id);
                              setShowColorPicker(false);
                            }}
                            className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 cursor-pointer ${
                              opt.id === 'default' ? 'bg-surface-2' : 
                              opt.id === 'amber' ? 'bg-amber-500' :
                              opt.id === 'emerald' ? 'bg-emerald-500' :
                              opt.id === 'teal' ? 'bg-teal-500' :
                              opt.id === 'blue' ? 'bg-blue-500' :
                              opt.id === 'indigo' ? 'bg-indigo-500' :
                              opt.id === 'purple' ? 'bg-purple-500' :
                              opt.id === 'rose' ? 'bg-rose-500' : 'bg-orange-500'
                            } ${newColor === opt.id ? `ring-2 ${opt.activeRing}` : 'border-border'}`}
                            title={opt.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CHECKLIST TOGGLE */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!newIsChecklist && newContent.trim()) {
                        const items = newContent
                          .split('\n')
                          .filter(Boolean)
                          .map(line => ({
                            id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                            text: line.replace(/^[-*•]\s*/, ''),
                            completed: false
                          }));
                        setNewChecklist(items);
                      }
                      setNewIsChecklist(!newIsChecklist);
                    }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      newIsChecklist ? 'text-brand bg-brand/15' : 'text-ink-soft hover:text-ink hover:bg-surface-2'
                    }`}
                    title="Toggle Checklist Mode"
                  >
                    <CheckSquare size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      setNewTitle('');
                      setNewContent('');
                      setNewChecklist([]);
                      setNewTags([]);
                    }}
                    className="px-3 py-1.5 rounded-xl text-ink-soft hover:text-ink hover:bg-surface-2 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewNote}
                    className="px-4 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold shadow-card hover:bg-brand/90 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>Save Note</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. NOTES DISPLAY SECTIONS */}
      {filteredNotes.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-dashed border-border rounded-2xl max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto text-ink-faint">
            <FileText size={22} />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-ink">No notes found</h4>
            <p className="text-xs text-ink-soft mt-1">
              {searchQuery || selectedTag !== 'all'
                ? 'Try adjusting your search query or tag filter.'
                : 'Click the note box above to write your first agency note or checklist.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* PINNED SECTION */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
                <Pin size={13} className="fill-amber-500" />
                <span>PINNED NOTES ({pinnedNotes.length})</span>
              </div>

              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start"
                : "space-y-3 max-w-3xl mx-auto"
              }>
                {pinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    copiedId={copiedId}
                    onOpenEdit={() => setEditingNote(note)}
                    onTogglePin={(e) => handleTogglePin(note, e)}
                    onChangeColor={(color, e) => handleChangeNoteColor(note, color, e)}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    onDuplicate={(e) => handleDuplicateNote(note, e)}
                    onCopy={(e) => handleCopyNote(note, e)}
                    onToggleChecklist={(itemId, e) => handleToggleCardChecklist(note, itemId, e)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* OTHERS SECTION */}
          {otherNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <div className="text-xs font-mono uppercase tracking-wider text-ink-faint">
                  OTHERS ({otherNotes.length})
                </div>
              )}

              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start"
                : "space-y-3 max-w-3xl mx-auto"
              }>
                {otherNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    copiedId={copiedId}
                    onOpenEdit={() => setEditingNote(note)}
                    onTogglePin={(e) => handleTogglePin(note, e)}
                    onChangeColor={(color, e) => handleChangeNoteColor(note, color, e)}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    onDuplicate={(e) => handleDuplicateNote(note, e)}
                    onCopy={(e) => handleCopyNote(note, e)}
                    onToggleChecklist={(itemId, e) => handleToggleCardChecklist(note, itemId, e)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. EDIT NOTE MODAL */}
      <AnimatePresence>
        {editingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-ink flex flex-col max-h-[90vh] ${
                getColorConfig(editingNote.color).bgClass
              }`}
            >
              {/* MODAL HEADER */}
              <div className="p-4 border-b border-border flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder="Title"
                  className="w-full bg-transparent font-display font-bold text-base text-ink placeholder:text-ink-faint focus:outline-none"
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingNote({ ...editingNote, isPinned: !editingNote.isPinned })}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      editingNote.isPinned ? 'text-amber-500 bg-amber-500/15' : 'text-ink-faint hover:text-ink'
                    }`}
                    title={editingNote.isPinned ? "Unpin note" : "Pin note"}
                  >
                    <Pin size={16} className={editingNote.isPinned ? "fill-amber-500 rotate-45" : ""} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNote(null)}
                    className="p-1.5 rounded-lg hover:bg-surface-3 text-ink-faint hover:text-ink transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* MODAL BODY */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
                {editingNote.isChecklist ? (
                  <div className="space-y-2">
                    {(editingNote.checklist || []).map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editingNote.checklist || []).map((c, i) =>
                              i === idx ? { ...c, completed: !c.completed } : c
                            );
                            setEditingNote({ ...editingNote, checklist: updated });
                          }}
                          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                            item.completed ? 'bg-brand border-brand text-white' : 'border-border bg-surface'
                          }`}
                        >
                          {item.completed && <Check size={12} />}
                        </button>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = (editingNote.checklist || []).map((c, i) =>
                              i === idx ? { ...c, text: val } : c
                            );
                            setEditingNote({ ...editingNote, checklist: updated });
                          }}
                          className={`flex-1 bg-transparent text-ink focus:outline-none ${item.completed ? 'line-through text-ink-faint' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editingNote.checklist || []).filter((_, i) => i !== idx);
                            setEditingNote({ ...editingNote, checklist: updated });
                          }}
                          className="text-ink-faint hover:text-loss cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}

                    {/* ADD CHECKLIST ROW */}
                    <div className="flex items-center gap-2 pt-1">
                      <Plus size={14} className="text-ink-faint" />
                      <input
                        type="text"
                        value={editChecklistInput}
                        onChange={(e) => setEditChecklistInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editChecklistInput.trim()) {
                            e.preventDefault();
                            const newItem = {
                              id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                              text: editChecklistInput.trim(),
                              completed: false
                            };
                            setEditingNote({
                              ...editingNote,
                              checklist: [...(editingNote.checklist || []), newItem]
                            });
                            setEditChecklistInput('');
                          }
                        }}
                        placeholder="Add checklist item (press Enter)..."
                        className="flex-1 bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    placeholder="Note content..."
                    rows={6}
                    className="w-full bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none resize-none leading-relaxed"
                  />
                )}

                {/* TAGS */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  {(editingNote.tags || []).map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-2 border border-border text-ink-soft"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNote({
                            ...editingNote,
                            tags: (editingNote.tags || []).filter(t => t !== tag)
                          });
                        }}
                        className="hover:text-loss cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}

                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={editTagInput}
                      onChange={(e) => setEditTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editTagInput.trim()) {
                          e.preventDefault();
                          const formatted = editTagInput.trim().replace(/^#/, '');
                          if (!editingNote.tags?.includes(formatted)) {
                            setEditingNote({
                              ...editingNote,
                              tags: [...(editingNote.tags || []), formatted]
                            });
                          }
                          setEditTagInput('');
                        }
                      }}
                      placeholder="+ Add tag"
                      className="w-20 bg-transparent text-[10px] font-mono text-ink placeholder:text-ink-faint focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="p-3 border-t border-border flex items-center justify-between bg-surface-2/40">
                <div className="flex items-center gap-1">
                  {/* COLOR PICKER IN EDIT */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEditShowColorPicker(!editShowColorPicker)}
                      className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                      title="Background color"
                    >
                      <Palette size={15} />
                    </button>

                    {editShowColorPicker && (
                      <div className="absolute bottom-8 left-0 z-20 p-2 rounded-xl bg-surface border border-border shadow-2xl flex items-center gap-1.5 animate-fadeIn">
                        {COLOR_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setEditingNote({ ...editingNote, color: opt.id });
                              setEditShowColorPicker(false);
                            }}
                            className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 cursor-pointer ${
                              opt.id === 'default' ? 'bg-surface-2' : 
                              opt.id === 'amber' ? 'bg-amber-500' :
                              opt.id === 'emerald' ? 'bg-emerald-500' :
                              opt.id === 'teal' ? 'bg-teal-500' :
                              opt.id === 'blue' ? 'bg-blue-500' :
                              opt.id === 'indigo' ? 'bg-indigo-500' :
                              opt.id === 'purple' ? 'bg-purple-500' :
                              opt.id === 'rose' ? 'bg-rose-500' : 'bg-orange-500'
                            } ${editingNote.color === opt.id ? `ring-2 ${opt.activeRing}` : 'border-border'}`}
                            title={opt.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CHECKLIST TOGGLE */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingNote.isChecklist && editingNote.content.trim()) {
                        const items = editingNote.content
                          .split('\n')
                          .filter(Boolean)
                          .map(line => ({
                            id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                            text: line.replace(/^[-*•]\s*/, ''),
                            completed: false
                          }));
                        setEditingNote({
                          ...editingNote,
                          isChecklist: true,
                          checklist: items
                        });
                      } else {
                        setEditingNote({
                          ...editingNote,
                          isChecklist: !editingNote.isChecklist
                        });
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      editingNote.isChecklist ? 'text-brand bg-brand/15' : 'text-ink-soft hover:text-ink hover:bg-surface-2'
                    }`}
                    title="Toggle Checklist Mode"
                  >
                    <CheckSquare size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onDeleteNote(editingNote.id);
                      setEditingNote(null);
                    }}
                    className="p-1.5 rounded-lg text-ink-faint hover:text-loss hover:bg-loss-soft transition-colors cursor-pointer"
                    title="Delete note"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateNote({
                        ...editingNote,
                        updatedAt: new Date().toISOString()
                      });
                      setEditingNote(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold shadow-card hover:bg-brand/90 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------
// INDIVIDUAL NOTE CARD COMPONENT
// ----------------------------------------------------
interface NoteCardProps {
  key?: React.Key;
  note: Note;
  copiedId: string | null;
  onOpenEdit: () => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onChangeColor: (color: NoteColor, e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onCopy: (e: React.MouseEvent) => void;
  onToggleChecklist: (itemId: string, e: React.MouseEvent) => void;
}

function NoteCard({
  note,
  copiedId,
  onOpenEdit,
  onTogglePin,
  onChangeColor,
  onDelete,
  onDuplicate,
  onCopy,
  onToggleChecklist
}: NoteCardProps) {
  const [showColorPalette, setShowColorPalette] = useState(false);
  const colorConfig = COLOR_OPTIONS.find(c => c.id === note.color) || COLOR_OPTIONS[0];

  const totalChecklist = note.checklist?.length || 0;
  const completedChecklist = note.checklist?.filter(c => c.completed).length || 0;

  return (
    <div
      onClick={onOpenEdit}
      className={`group relative p-4 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-card cursor-pointer flex flex-col justify-between ${
        colorConfig.bgClass
      }`}
    >
      <div>
        {/* TOP ROW: TITLE & PIN */}
        <div className="flex items-start justify-between gap-2 mb-2">
          {note.title ? (
            <h3 className="font-display font-bold text-sm text-ink leading-snug line-clamp-2">
              {note.title}
            </h3>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onTogglePin}
            className={`p-1.5 rounded-lg transition-opacity cursor-pointer shrink-0 ${
              note.isPinned 
                ? 'opacity-100 text-amber-500 bg-amber-500/15' 
                : 'opacity-0 group-hover:opacity-100 text-ink-faint hover:text-ink'
            }`}
            title={note.isPinned ? "Unpin note" : "Pin note"}
          >
            <Pin size={14} className={note.isPinned ? "fill-amber-500 rotate-45" : ""} />
          </button>
        </div>

        {/* CONTENT OR CHECKLIST */}
        {note.isChecklist && note.checklist && note.checklist.length > 0 ? (
          <div className="space-y-1.5 my-2">
            {note.checklist.slice(0, 5).map(item => (
              <div
                key={item.id}
                onClick={(e) => onToggleChecklist(item.id, e)}
                className="flex items-center gap-2 text-xs hover:text-ink transition-colors cursor-pointer py-0.5"
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                  item.completed ? 'bg-brand border-brand text-white' : 'border-border bg-surface'
                }`}>
                  {item.completed && <Check size={10} />}
                </div>
                <span className={`line-clamp-1 ${item.completed ? 'line-through text-ink-faint' : 'text-ink-soft'}`}>
                  {item.text}
                </span>
              </div>
            ))}

            {note.checklist.length > 5 && (
              <div className="text-[10px] font-mono text-ink-faint pt-1">
                +{note.checklist.length - 5} more items ({completedChecklist}/{totalChecklist} completed)
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-ink-soft whitespace-pre-line line-clamp-6 leading-relaxed my-1 font-sans">
            {note.content}
          </p>
        )}

        {/* TAGS */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-surface-2/80 border border-border text-ink-soft"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CARD FOOTER TOOLBAR (HOVER VISIBLE) */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/40 text-[10px] text-ink-faint">
        <span className="font-mono">
          {note.createdAt}
        </span>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* COLOR PALETTE */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPalette(!showColorPalette);
              }}
              className="p-1 rounded hover:bg-surface-2 text-ink-faint hover:text-ink cursor-pointer"
              title="Change color"
            >
              <Palette size={13} />
            </button>

            {showColorPalette && (
              <div 
                className="absolute bottom-6 right-0 z-30 p-1.5 rounded-xl bg-surface border border-border shadow-2xl flex items-center gap-1 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                {COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={(e) => {
                      onChangeColor(opt.id, e);
                      setShowColorPalette(false);
                    }}
                    className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 cursor-pointer ${
                      opt.id === 'default' ? 'bg-surface-2' : 
                      opt.id === 'amber' ? 'bg-amber-500' :
                      opt.id === 'emerald' ? 'bg-emerald-500' :
                      opt.id === 'teal' ? 'bg-teal-500' :
                      opt.id === 'blue' ? 'bg-blue-500' :
                      opt.id === 'indigo' ? 'bg-indigo-500' :
                      opt.id === 'purple' ? 'bg-purple-500' :
                      opt.id === 'rose' ? 'bg-rose-500' : 'bg-orange-500'
                    } ${note.color === opt.id ? `ring-1 ${opt.activeRing}` : 'border-border'}`}
                    title={opt.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* COPY */}
          <button
            type="button"
            onClick={onCopy}
            className="p-1 rounded hover:bg-surface-2 text-ink-faint hover:text-ink cursor-pointer relative"
            title="Copy text"
          >
            {copiedId === note.id ? <Check size={13} className="text-gain" /> : <Copy size={13} />}
          </button>

          {/* DUPLICATE */}
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 rounded hover:bg-surface-2 text-ink-faint hover:text-ink cursor-pointer"
            title="Duplicate note"
          >
            <Plus size={13} />
          </button>

          {/* DELETE */}
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded hover:bg-loss-soft text-ink-faint hover:text-loss cursor-pointer"
            title="Delete note"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
