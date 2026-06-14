/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, Save, Trash2, Copy, Play, ArrowDownToLine, ArrowUpToLine, HelpCircle, Star, Sparkles, Check, Grid } from 'lucide-react';
import { CardConfig, SavedTemplate } from '../types';
import { TEMPLATE_LIBRARY_DATA } from '../templatesLibrary';

interface TemplateDbPanelProps {
  config: CardConfig;
  setConfig: React.Dispatch<React.SetStateAction<CardConfig>>;
}

export const TemplateDbPanel: React.FC<TemplateDbPanelProps> = ({ config, setConfig }) => {
  const [userTemplates, setUserTemplates] = useState<SavedTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [activePresetId, setActivePresetId] = useState<string>('acad-crimson');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load user-saved templates on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('doboka_id_templates_db');
      if (stored) {
        setUserTemplates(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Could not read template database from localstorage", err);
    }
  }, []);

  const triggerStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => {
      setStatusMsg(null);
    }, 4000);
  };

  const handleSaveCurrentDesign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      triggerStatus("Please provide a name for your custom template layout!", 'error');
      return;
    }

    const newTemplate: SavedTemplate = {
      id: 'usr-' + Date.now(),
      name: newTemplateName.trim(),
      category: 'User Custom',
      timestamp: new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      config: JSON.parse(JSON.stringify(config)), // Deep clone layout config
    };

    const updated = [...userTemplates, newTemplate];
    setUserTemplates(updated);
    localStorage.setItem('doboka_id_templates_db', JSON.stringify(updated));
    setActivePresetId(newTemplate.id);
    setNewTemplateName('');
    triggerStatus(`Successfully saved design "${newTemplate.name}" to database!`);
  };

  const handleLoadTemplate = (template: SavedTemplate) => {
    setConfig(JSON.parse(JSON.stringify(template.config)));
    setActivePresetId(template.id);
    triggerStatus(`Applied template "${template.name}" layout!`);
  };

  const handleDuplicateTemplate = (template: SavedTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned: SavedTemplate = {
      ...JSON.parse(JSON.stringify(template)),
      id: 'usr-' + Date.now() + '-clone',
      name: `${template.name} (Copy)`,
      timestamp: new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      isSystem: false,
    };

    const updated = [...userTemplates, cloned];
    setUserTemplates(updated);
    localStorage.setItem('doboka_id_templates_db', JSON.stringify(updated));
    triggerStatus(`Duplicated "${template.name}" template record`);
  };

  const handleDeleteTemplate = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to permanently delete design "${name}"?`)) {
      const updated = userTemplates.filter(t => t.id !== id);
      setUserTemplates(updated);
      localStorage.setItem('doboka_id_templates_db', JSON.stringify(updated));
      triggerStatus(`Deleted layout design "${name}"`);
      if (activePresetId === id) {
        setActivePresetId('');
      }
    }
  };

  const handleExportDatabase = () => {
    try {
      const databaseExportPayload = {
        meta: {
          exportedAt: new Date().toISOString(),
          app: 'Doboka ID Workspace Templates'
        },
        userTemplates: userTemplates
      };

      const blob = new Blob([JSON.stringify(databaseExportPayload, null, 2)], { type: 'application/json' });
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = URL.createObjectURL(blob);
      downloadAnchor.download = `doboka_presets_db_${Date.now()}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      triggerStatus("Catalog backup exported successfully!");
    } catch (err) {
      triggerStatus("Could not export catalog file", "error");
    }
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.userTemplates)) {
          const importedList = parsed.userTemplates.filter((item: any) => item && item.id && item.name && item.config);
          
          if (importedList.length === 0) {
            triggerStatus("No valid layout templates found in the backup file", "error");
            return;
          }

          const merged = [...userTemplates];
          importedList.forEach((imp: SavedTemplate) => {
            imp.id = 'usr-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
            imp.timestamp = imp.timestamp || new Date().toLocaleString();
            merged.push(imp);
          });

          setUserTemplates(merged);
          localStorage.setItem('doboka_id_templates_db', JSON.stringify(merged));
          triggerStatus(`Successfully loaded ${importedList.length} layouts from backup!`);
        } else {
          triggerStatus("Invalid file structure.", "error");
        }
      } catch (err) {
        triggerStatus("Error reading JSON file.", "error");
      }
    };
    fileReader.readAsText(file);
    e.target.value = '';
  };

  const categories = [
    { id: 'all', label: 'All Layouts (30+)' },
    { id: 'Canva PDF Imports', label: '★ Canva PDF Imports' },
    { id: 'Classic Academic', label: 'Classic Academic' },
    { id: 'Futuristic Cyber', label: 'Futuristic Cyber' },
    { id: 'Corporate Minimal', label: 'Corporate Minimal' },
    { id: 'Neon Brutalist', label: 'Neon Brutalist' },
    { id: 'Retro Varsity', label: 'Retro Varsity' },
    { id: 'User Custom', label: 'My Saved Designs' }
  ];

  // Combine system presets and user designs
  const allTemplates = [...TEMPLATE_LIBRARY_DATA, ...userTemplates];

  // Filter templates
  const filteredTemplates = allTemplates.filter(t => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'User Custom') return t.category === 'User Custom' || !t.isSystem;
    return t.category === selectedCategory;
  });

  return (
    <div className="bg-white border-2 border-zinc-900 rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] select-text animate-fade-in" id="workspace-templates-database">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-zinc-900 pb-4 mb-5 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-zinc-900 text-white rounded border border-zinc-950">
            <Database className="w-5 h-5 text-white shrink-0" />
          </div>
          <div>
            <h2 className="text-base font-display font-black uppercase text-zinc-900 tracking-tight flex items-center gap-2">
              Premium Layout Blueprint Library
              <span className="text-[10px] font-mono bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                {allTemplates.length} Templates loaded
              </span>
            </h2>
            <p className="text-2xs font-mono text-zinc-400 uppercase tracking-widest mt-0.5">
              30-50 high-fidelity variations for instant layout restoration & editing
            </p>
          </div>
        </div>

        {/* Action tags */}
        <div className="flex items-center gap-1.5 self-end md:self-auto">
          <button
            onClick={handleExportDatabase}
            className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-350 text-zinc-700 font-mono text-[10px] uppercase font-extrabold px-2.5 py-1.5 rounded transition cursor-pointer"
            title="Export Backup Of Your Custom Templates"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            Backup Export
          </button>
          <label
            className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-350 text-zinc-700 font-mono text-[10px] uppercase font-extrabold px-2.5 py-1.5 rounded transition cursor-pointer"
            title="Import Backup of saved layouts"
          >
            <ArrowUpToLine className="w-3.5 h-3.5" />
            Import Backup
            <input
              type="file"
              accept=".json"
              onChange={handleImportDatabase}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* STATUS BANNER */}
      {statusMsg && (
        <div className={`p-3 rounded-lg border text-xs font-mono mb-4 flex items-center gap-2 animate-fade-in ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
            : 'bg-red-50 text-red-800 border-red-300'
        }`}>
          {statusMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-700 shrink-0" /> : <HelpCircle className="w-4 h-4 text-red-700 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* SAVE ACTIVE LAYOUT BLOCK */}
      <div className="bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-xl p-4.5 mb-6">
        <h3 className="text-xs font-mono font-black uppercase text-zinc-700 tracking-wider mb-2 flex items-center gap-1.5">
          <Save className="w-4 h-4 text-blue-600" />
          Save Current Custom Layout to My Templates
        </h3>
        <p className="text-[11px] font-sans text-zinc-500 mb-3">
          Save your specific text boxes, customized dimensions, and reordered typography headers. This saves design independently from any current active student data!
        </p>
        <form onSubmit={handleSaveCurrentDesign} className="flex flex-col sm:flex-row items-stretch gap-3">
          <input
            type="text"
            placeholder="e.g. Science Olympiad Pass, Spring Varsity Redesign, Healthcare Badge..."
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            className="flex-1 bg-white border-2 border-zinc-900 rounded-md p-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder-zinc-400"
          />
          <button
            type="submit"
            className="bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold text-xs uppercase px-5 py-2.5 rounded-md border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5 active:translate-y-[1px]"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Save Current Design
          </button>
        </form>
      </div>

      {/* CATEGORY SELECTOR TABS */}
      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-zinc-200 pb-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-2xs font-mono font-bold uppercase transition border ${
              selectedCategory === cat.id
                ? 'bg-zinc-900 text-white border-zinc-950 shadow-sm'
                : 'bg-zinc-50 text-zinc-650 hover:bg-zinc-100 border-zinc-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* TEMPLATE CARDS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((item) => {
          const isActive = activePresetId === item.id;
          const configTheme = item.config.themeColor || '#D32F2F';

          return (
            <div
              key={item.id}
              onClick={() => handleLoadTemplate(item)}
              className={`border-2 rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer relative ${
                isActive
                  ? 'border-zinc-900 bg-zinc-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ring-2 ring-blue-500/50'
                  : 'border-zinc-200 bg-white hover:border-zinc-900 hover:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
              }`}
            >
              {/* Top Row info */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 block"
                    style={{ backgroundColor: configTheme }}
                    title={`Theme color: ${configTheme}`}
                  />
                  <div>
                    <h4 className="text-xs font-black text-zinc-900 tracking-tight uppercase max-w-[210px] truncate">
                      {item.name}
                    </h4>
                    <span className="text-[9px] font-mono text-zinc-400 block mt-0.5 font-bold uppercase">
                      Category: <em className="text-zinc-600 not-italic">{item.category || 'Dynamic Preset'}</em>
                    </span>
                  </div>
                </div>

                {item.isSystem ? (
                  <span className="bg-zinc-900 text-white text-[8px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0">
                    S-PRESET
                  </span>
                ) : (
                  <span className="bg-blue-50 text-blue-800 text-[8px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                    User Draft
                  </span>
                )}
              </div>

              {/* Attributes line */}
              <div className="mt-3 text-[10px] bg-zinc-50 p-2.5 border border-zinc-150 rounded font-mono text-zinc-550 flex flex-wrap gap-x-3 gap-y-1">
                <span>Grid: <strong className="text-zinc-800 uppercase">{item.config.draftGridType || 'Standard'}</strong></span>
                <span>Title Lines: <strong className="text-zinc-800">{item.config.schoolTitleLines?.length ?? 2}</strong></span>
                <span>Custom Boxes: <strong className="text-zinc-800">{item.config.customTextBoxes?.length ?? 0}</strong></span>
              </div>

              {/* Sub-details summary */}
              <div className="mt-3.5 border-t border-dashed border-zinc-200 pt-3 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500">
                  Est. ESTD: <strong className="text-zinc-700">{item.config.estd || 'N/A'}</strong>
                </span>

                {/* Grid controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadTemplate(item);
                    }}
                    className="p-1 px-2.5 bg-zinc-900 text-white hover:bg-zinc-800 text-[9px] font-mono font-black uppercase tracking-wider rounded transition cursor-pointer flex items-center gap-1"
                    title="Load Design"
                  >
                    <Play className="w-2.5 h-2.5 fill-white shrink-0" />
                    Apply
                  </button>
                  <button
                    onClick={(e) => handleDuplicateTemplate(item, e)}
                    className="p-1 px-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded transition cursor-pointer"
                    title="Duplicate Layout Preset"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {!item.isSystem && (
                    <button
                      onClick={(e) => handleDeleteTemplate(item.id, item.name, e)}
                      className="p-1 px-1.5 bg-red-50 hover:bg-red-500 text-red-700 hover:text-white rounded transition cursor-pointer"
                      title="Delete saved template"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t-2 border-zinc-900 text-[10px] font-mono text-zinc-500 leading-normal font-semibold">
        <p>
          ★ <em>PRO TIP:</em> Applying a template loads structural layout coordinates, color palettes, and text boxes immediately while <strong>preserving</strong> your current student dataset. Easily cycle through designs to find the best aesthetic for your institution!
        </p>
      </div>

    </div>
  );
};
