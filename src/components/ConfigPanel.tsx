/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useRef, useState, useEffect } from 'react';
import { Settings, PenTool, RefreshCw, Upload, Sparkles, Check, CheckCircle, Plus, Trash2, ArrowUp, ArrowDown, Type, AlignLeft, Grid, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { CardConfig } from '../types';

// Helper function to analyze base64 image and extract primary dominant colors
const extractColorsFromLogo = (base64Url: string): Promise<string[]> => {
  return new Promise((resolve) => {
    if (!base64Url || !base64Url.startsWith('data:image')) {
      resolve([]);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(['#D32F2F', '#1E3A8A', '#15803D', '#EA580C', '#1A1A1A', '#023E73']);
          return;
        }

        // Processing size
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorCounts: { [hex: string]: number } = {};

        // Helper to convert rgb to hex
        const rgbToHex = (r: number, g: number, b: number) => {
          const toHex = (val: number) => {
            const hex = val.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          };
          return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
        };

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip dynamic alpha (transparent pixels)
          if (a < 180) continue;

          // Skip neutral white/near-white backgrounds (e.g. brightness > 235)
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          if (brightness > 235) continue;

          // Skip pure black backgrounds
          if (r < 25 && g < 25 && b < 25) continue;

          // Round key colors to reduce resolution noise slightly
          const bucketSize = 10;
          const roundedR = Math.round(r / bucketSize) * bucketSize;
          const roundedG = Math.round(g / bucketSize) * bucketSize;
          const roundedB = Math.round(b / bucketSize) * bucketSize;

          const hex = rgbToHex(roundedR, roundedG, roundedB);
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        // Sort color elements
        const sortedColors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0]);

        // Filter too-close similar colors to keep palette vivid & distinct
        const distinctColors: string[] = [];
        const parseHex = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return { r, g, b };
        };

        for (const col of sortedColors) {
          const cur = parseHex(col);
          let isTooSimilar = false;

          for (const dCol of distinctColors) {
            const comp = parseHex(dCol);
            const dist = Math.sqrt(
              Math.pow(cur.r - comp.r, 2) +
              Math.pow(cur.g - comp.g, 2) +
              Math.pow(cur.b - comp.b, 2)
            );
            if (dist < 45) { // Similarity threshold
              isTooSimilar = true;
              break;
            }
          }

          if (!isTooSimilar) {
            distinctColors.push(col);
          }
          if (distinctColors.length >= 6) break;
        }

        resolve(distinctColors.length > 0 ? distinctColors : ['#D32F2F', '#1E3A8A', '#15803D', '#EA580C', '#1A1A1A']);
      } catch (err) {
        console.error("AI Color extractor failing gracefully:", err);
        resolve(['#D32F2F', '#1E3A8A', '#15803D', '#EA580C', '#1A1A1A']);
      }
    };
    img.onerror = () => {
      resolve([]);
    };
    img.src = base64Url;
  });
};

interface ConfigPanelProps {
  config: CardConfig;
  setConfig: React.Dispatch<React.SetStateAction<CardConfig>>;
  students?: any[];
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig, students = [] }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [saveNotify, setSaveNotify] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze colors when schoolLogo custom upload is activated
  useEffect(() => {
    if (!config.schoolLogo) {
      setExtractedColors([]);
      return;
    }
    
    setIsAnalyzing(true);
    extractColorsFromLogo(config.schoolLogo)
      .then(colors => {
        setExtractedColors(colors);
        setIsAnalyzing(false);
        // Automatically set dominant accent color if found!
        if (colors.length > 0) {
          setConfig(prev => ({
            ...prev,
            themeColor: colors[0],
            // Since title line #1 color is tied to theme color initially, let's update it if needed or let standard theme handle it.
            schoolTitleLines: (prev.schoolTitleLines || []).map((l, index) => 
              index === 0 ? { ...l, color: colors[0] } : l
            )
          }));
          triggerSaveNotification(`✨ Extracted & Applied dominant color: ${colors[0]}`);
        }
      })
      .catch((err) => {
        console.error("Error analyzing logo colors:", err);
        setIsAnalyzing(false);
      });
  }, [config.schoolLogo]);

  // Initialize schoolTitleLines if missing
  useEffect(() => {
    if (!config.schoolTitleLines || config.schoolTitleLines.length === 0) {
      setConfig(prev => ({
        ...prev,
        schoolTitleLines: [
          {
            id: 'l1',
            text: `${prev.schoolNamePre || 'DOBOKA'} ${prev.schoolNameSuf || 'SR.'}`.trim() || 'DOBOKA HIGH COLLEGE',
            fontSize: prev.sizes?.schoolNameLine1 ?? 19,
            bold: true,
            color: prev.themeColor ?? '#D32F2F',
            fontFamily: 'Space Grotesk',
            letterSpacing: 'normal',
            lineHeight: 'normal'
          },
          {
            id: 'l2',
            text: `${prev.schoolNameLine2Pre || 'SEC. SCH'} ${prev.schoolNameLine2Suf || 'OOL'}`.trim() || 'FOR GLOBAL STUDIES',
            fontSize: prev.sizes?.schoolNameLine2 ?? 19,
            bold: true,
            color: '#1a1a1a',
            fontFamily: 'Inter',
            letterSpacing: 'normal',
            lineHeight: 'normal'
          }
        ],
        customTextBoxes: prev.customTextBoxes || []
      }));
    }
  }, []);

  const triggerSaveNotification = (msg: string) => {
    setSaveNotify(msg);
    setTimeout(() => {
      setSaveNotify(null);
    }, 2000);
  };

  // Sign Drawing canvas logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setConfig(prev => ({ ...prev, principalSign: '' }));
    triggerSaveNotification('Signature pad cleared. Default selected.');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64Url = canvas.toDataURL('image/png');
    setConfig(prev => ({ ...prev, principalSign: base64Url }));
    triggerSaveNotification('Ink signature captured successfully!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setConfig(prev => ({ ...prev, schoolLogo: base64 }));
      triggerSaveNotification('School logo applied.');
    };
    r.readAsDataURL(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setConfig(prev => ({ ...prev, principalSign: base64 }));
      triggerSaveNotification('Authorized seal signature file applied.');
    };
    r.readAsDataURL(file);
  };

  const handleTermChange = (id: string, text: string) => {
    setConfig(prev => {
      const updatedTerms = (prev.terms || []).map(t => lItem(t, id, text));
      return { ...prev, terms: updatedTerms };
    });
  };

  const handlePolicyLineChange = (text: string) => {
    setConfig(prev => ({ ...prev, policyLine: text }));
  };

  const lItem = (item: any, id: string, text: string) => {
    if (item.id === id) {
      return { ...item, text };
    }
    return item;
  };

  // Add, reorder and style custom text lines for typography
  const handleAddTitleLine = () => {
    const newLineId = 'line-' + Date.now();
    setConfig(prev => ({
      ...prev,
      schoolTitleLines: [
        ...(prev.schoolTitleLines || []),
        {
          id: newLineId,
          text: 'NEW TITLE SUBHEADER',
          fontSize: 13,
          bold: false,
          color: '#18181b',
          fontFamily: 'Inter',
          letterSpacing: 'normal',
          lineHeight: 'normal'
        }
      ]
    }));
    triggerSaveNotification('Added title line! Click on it to customize styles');
  };

  const handleDeleteTitleLine = (id: string) => {
    setConfig(prev => ({
      ...prev,
      schoolTitleLines: (prev.schoolTitleLines || []).filter(l => l.id !== id)
    }));
    triggerSaveNotification('Removed title line');
  };

  const handleTitleTextChange = (id: string, val: string) => {
    setConfig(prev => ({
      ...prev,
      schoolTitleLines: (prev.schoolTitleLines || []).map(l => 
        l.id === id ? { ...l, text: val } : l
      )
    }));
  };

  const handleTitleFieldChange = (id: string, field: string, val: any) => {
    setConfig(prev => ({
      ...prev,
      schoolTitleLines: (prev.schoolTitleLines || []).map(l => 
        l.id === id ? { ...l, [field]: val } : l
      )
    }));
  };

  const handleReorderTitleLine = (index: number, direction: 'up' | 'down') => {
    const lines = [...(config.schoolTitleLines || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= lines.length) return;

    // Swap lines
    const temp = lines[index];
    lines[index] = lines[targetIdx];
    lines[targetIdx] = temp;

    setConfig(prev => ({
      ...prev,
      schoolTitleLines: lines
    }));
  };

  // Manage custom dynamic text boxes
  const handleAddCustomBox = () => {
    const newBoxId = 'box-' + Date.now();
    setConfig(prev => ({
      ...prev,
      customTextBoxes: [
        ...(prev.customTextBoxes || []),
        {
          id: newBoxId,
          label: 'BLOOD GRP',
          value: 'O+ POSITIVE',
          side: 'front',
          offsetX: 0,
          offsetY: 0,
          fontSize: 12,
          color: '#1a1a1a',
          bold: true,
          fontFamily: 'Inter',
          letterSpacing: 'normal'
        }
      ]
    }));
    triggerSaveNotification('Added dynamic text box! Tap on cards to customize size');
  };

  const handleDeleteCustomBox = (id: string) => {
    setConfig(prev => ({
      ...prev,
      customTextBoxes: (prev.customTextBoxes || []).filter(b => b.id !== id)
    }));
    triggerSaveNotification('Custom box removed');
  };

  const handleCustomBoxFieldChange = (id: string, field: string, val: any) => {
    setConfig(prev => ({
      ...prev,
      customTextBoxes: (prev.customTextBoxes || []).map(b => 
        b.id === id ? { ...b, [field]: val } : b
      )
    }));
  };

  // 10 different technical draft grid-line template definitions
  const draftGridOptions = [
    { id: 'none', name: 'No guidelines', desc: 'Standard solid backdrop surface' },
    { id: 'blueprint', name: 'Science Blueprint', desc: 'Fine cyber grids styled on blue core background' },
    { id: 'double-rule', name: 'Dual Centering Axes', desc: 'Bold center lines with split horizontal layout markers' },
    { id: 'crosshair', name: 'Optic Radar Crosshairs', desc: 'Corner markers plus centered focus tracking bounds' },
    { id: 'radial', name: 'Conic Radial Rings', desc: 'Polar mapping concentric spheres for focal alignments' },
    { id: 'isometric', name: '3D Isometric Dot-Matrix', desc: '30-degree drafting dot coordinates scale' },
    { id: 'golden', name: 'Divine Golden Ratio', desc: 'Translucent architectural Fibonacci spiral curve overlay' },
    { id: 'bounds', name: 'CR80 Margins & Safe-Zone', desc: 'Standard printer bleeding borders and safe boundaries' },
    { id: 'matrix', name: 'Neon Subnode Matrix', desc: 'Digital computer sub-lines overlay' },
    { id: 'graph', name: 'Engineering Millimeter Graph', desc: 'Drafting grid for precise dimensional tracking' }
  ];

  // Trigger server-side layout sizing AI Calibration
  const handleAIOptimize = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/optimize-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students, config }),
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Calibration request rejected.');
      }
      const data = await response.json();
      setConfig(prev => {
        // Feed returned calibrated parameters into current config textStyles
        const styles = prev.textStyles || {};
        const elementsList = Object.keys(data);
        const updatedStyles = { ...styles };

        elementsList.forEach(el => {
          updatedStyles[el] = {
            ...(updatedStyles[el] || {}),
            customSize: data[el]
          };
        });

        return {
          ...prev,
          textStyles: updatedStyles
        };
      });
      triggerSaveNotification('✨ AI Auto-Fit sizing optimized across datasets!');
    } catch (err: any) {
      console.error(err);
      triggerSaveNotification(`AI optimization: ${err.message || 'Calibration service offline'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="bg-white border-2 border-zinc-900 rounded-xl p-6 relative shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] text-zinc-900" id="config-panel">
      
      {/* Save Banner notifications */}
      {saveNotify && (
        <div className="absolute top-4 right-4 bg-emerald-50 border-2 border-emerald-600 text-emerald-805 text-xs font-mono px-3.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-md z-50 animate-fade-in font-bold">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{saveNotify}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-zinc-900 pb-5 mb-6 gap-3 select-none">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-zinc-900 shrink-0" />
          <h3 className="text-sm font-display font-black tracking-wide text-zinc-900 uppercase">
            Branding & Multi-Line Style Canvas
          </h3>
        </div>
        <p className="text-2xs font-mono text-zinc-400 uppercase tracking-widest leading-none">
          Draft alignment controls & custom attributes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 leading-relaxed">
        
        {/* LEFT COMPONENT: Typography headers & Custom dynamic attributes */}
        <div className="flex flex-col gap-6">

          {/* SCHOOL TYPOGRAPHY LINES BLOCK */}
          <div className="bg-zinc-50 border-2 border-zinc-900 rounded-xl p-5" id="branding-school-typography-card">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-250 pb-2">
              <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-blue-600" />
                School Typography & Title Lines
              </h4>
              <button
                type="button"
                onClick={handleAddTitleLine}
                className="flex items-center gap-1 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 text-2xs font-mono font-black uppercase px-2.5 py-1.5 rounded shadow-sm transition-all cursor-pointer hover:border-zinc-500"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-800" />
                Add Title Line
              </button>
            </div>

            <p className="text-[11px] font-sans text-zinc-550 mb-4 leading-normal">
              Create unlimited institution title lines. Manage text strings, sizing, colors, and fonts below. <strong>Reorder</strong> them or drag/style directly on the card canvas preview!
            </p>

            <div className="flex flex-col gap-3.5">
              {(config.schoolTitleLines || []).map((line, idx) => (
                <div key={line.id} className="bg-white border border-zinc-300 rounded-lg p-3.5 flex flex-col gap-2.5 shadow-xs relative">
                  
                  {/* Title controls top line */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-zinc-900 text-white font-mono font-extrabold px-1.5 py-0.5 rounded">
                      LINE #{idx + 1}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleReorderTitleLine(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-zinc-100 disabled:opacity-30 rounded border border-zinc-200 transition cursor-pointer"
                        title="Reorder up"
                      >
                        <ArrowUp className="w-3 h-3 text-zinc-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderTitleLine(idx, 'down')}
                        disabled={idx === (config.schoolTitleLines || []).length - 1}
                        className="p-1 hover:bg-zinc-100 disabled:opacity-30 rounded border border-zinc-200 transition cursor-pointer"
                        title="Reorder down"
                      >
                        <ArrowDown className="w-3 h-3 text-zinc-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTitleLine(line.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded border border-red-200 transition cursor-pointer"
                        title="Delete line"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Text value */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={line.text}
                      onChange={(e) => handleTitleTextChange(line.id, e.target.value)}
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded p-1.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-zinc-900"
                      placeholder="e.g. ST. JUDE HIGH SCHOOL"
                    />
                  </div>

                  {/* Inline micro styling for typography line */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="text-[9px] text-zinc-400 block uppercase font-black mb-0.5">Typography Family:</label>
                      <select
                        value={line.fontFamily || 'Inter'}
                        onChange={(e) => handleTitleFieldChange(line.id, 'fontFamily', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 text-[10px] rounded p-1 font-sans focus:outline-none cursor-pointer"
                      >
                        <option value="Inter">Inter (General Corp)</option>
                        <option value="Space Grotesk">Space Grotesk (Tech)</option>
                        <option value="JetBrains Mono">JetBrains Mono (Mono)</option>
                        <option value="Playfair Display">Playfair Display (Serif)</option>
                        <option value="Cinzel">Cinzel (Historic Serif)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-400 block uppercase font-black mb-0.5">Text Custom Color:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={line.color || '#18181b'}
                          onChange={(e) => handleTitleFieldChange(line.id, 'color', e.target.value)}
                          className="w-5 h-5 border-0 rounded cursor-pointer p-0 shrink-0"
                        />
                        <input
                          type="text"
                          value={line.color || '#18181b'}
                          onChange={(e) => handleTitleFieldChange(line.id, 'color', e.target.value)}
                          className="flex-1 bg-zinc-50 border border-zinc-200 rounded text-[9px] p-1 font-mono uppercase focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              ))}
              {(config.schoolTitleLines || []).length === 0 && (
                <div className="text-center p-6 border-2 border-dashed border-zinc-200 rounded-lg text-xs font-mono text-zinc-450">
                  No custom title headers. Tap Add Title Line to customize headers!
                </div>
              )}
            </div>

          </div>

          {/* DYNAMIC ADDITIONAL CUSTOM DATA FIELD BOXES */}
          <div className="bg-zinc-50 border-2 border-zinc-900 rounded-xl p-5" id="branding-custom-attributes-card">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-250 pb-2">
              <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-emerald-600" />
                Additional Dynamic Text Boxes
              </h4>
              <button
                type="button"
                onClick={handleAddCustomBox}
                className="flex items-center gap-1 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 text-2xs font-mono font-black uppercase px-2.5 py-1.5 rounded shadow-sm transition-all cursor-pointer hover:border-zinc-500"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-800" />
                Add Text Box
              </button>
            </div>

            <p className="text-[11px] font-sans text-zinc-550 mb-3.5 leading-normal">
              Need custom institutional details like <strong>Blood Group</strong>, <strong>Bus Route No</strong>, or <strong>Emergency Pin</strong>? Append custom boxes here and assign them to the front or back side of cards!
            </p>

            <div className="flex flex-col gap-3">
              {(config.customTextBoxes || []).map((box, idx) => (
                <div key={box.id} className="bg-white border border-zinc-300 rounded-lg p-3.5 flex flex-col gap-2 relative shadow-2xs">
                  
                  {/* Top bar controls */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-extrabold px-2 py-0.5 rounded">
                      CUSTOM DATA FIELD #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomBox(box.id)}
                      className="text-red-500 hover:bg-red-50 p-1 border border-red-200 rounded transition cursor-pointer"
                      title="Remove field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Settings grid */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="text-[9px] text-zinc-500 block uppercase font-black mb-0.5">Field / Label Name:</label>
                      <input
                        type="text"
                        value={box.label}
                        onChange={(e) => handleCustomBoxFieldChange(box.id, 'label', e.target.value.toUpperCase())}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded p-1 text-2xs font-extrabold text-zinc-900 focus:outline-none"
                        placeholder="e.g. BLOODGRP"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 block uppercase font-black mb-0.5">Default Value / Text:</label>
                      <input
                        type="text"
                        value={box.value}
                        onChange={(e) => handleCustomBoxFieldChange(box.id, 'value', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded p-1 text-2xs font-bold text-zinc-900 focus:outline-none"
                        placeholder="e.g. O+ POSITIVE"
                      />
                    </div>
                  </div>

                  {/* Positioning Facet & Custom Font Selection */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="text-[9px] text-zinc-500 block uppercase font-black mb-0.5">Card Placement Facet:</label>
                      <select
                        value={box.side}
                        onChange={(e) => handleCustomBoxFieldChange(box.id, 'side', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded p-1 text-2xs text-zinc-800 focus:outline-none cursor-pointer"
                      >
                        <option value="front">Place on Front Facet</option>
                        <option value="back">Place on Reverse Facet</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 block uppercase font-black mb-0.5 font-sans">Font Accent Family:</label>
                      <select
                        value={box.fontFamily || 'Inter'}
                        onChange={(e) => handleCustomBoxFieldChange(box.id, 'fontFamily', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded p-1 text-2xs text-zinc-800 focus:outline-none cursor-pointer"
                      >
                        <option value="Inter">Corporate Sans-Serif</option>
                        <option value="Space Grotesk">Space Grotesk Modern</option>
                        <option value="JetBrains Mono">Developer Mono Space</option>
                        <option value="Playfair Display">Sophisticated Serif</option>
                      </select>
                    </div>
                  </div>

                </div>
              ))}
              {(config.customTextBoxes || []).length === 0 && (
                <div className="text-center p-6 border-2 border-dashed border-zinc-205 rounded-lg text-2xs font-mono text-zinc-450 uppercase tracking-wide">
                  No additional custom dynamic fields registered yet. Click Add Text Box to launch one!
                </div>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COMPONENT: Emblems, ink signatures, terms and technical guidelines draft grids */}
        <div className="flex flex-col gap-6">

          {/* CARD LAYERS VISIBILITY MANAGER */}
          <div className="bg-zinc-50 border-2 border-zinc-900 rounded-xl p-5 flex flex-col gap-3.5 animate-fade-in" id="layers-visibility-manager-card">
            <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5 border-b border-zinc-250 pb-2">
              <Eye className="w-4 h-4 text-emerald-600 animate-pulse" />
              Card Layers & Add / Remove Element Toggles
            </h4>
            
            <p className="text-[11px] font-sans text-zinc-500 leading-relaxed">
              Instantly add or remove elements. Toggling elements hides them on both front & back. Click directly on transparent slots on the card to style, reposition, or restore them.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { key: 'schoolLogo', label: 'School Logo' },
                { key: 'studentPhoto', label: 'Student Photo' },
                { key: 'studentName', label: 'Student Name' },
                { key: 'motto', label: 'Motto Slogan' },
                { key: 'session', label: 'Academic Session' },
                { key: 'labelRollNo', label: 'Roll No Label' },
                { key: 'fieldRollVal', label: 'Roll Value' },
                { key: 'labelClass', label: 'Class Label' },
                { key: 'fieldClassVal', label: 'Class Value' },
                { key: 'labelPhone', label: 'Phone Label' },
                { key: 'fieldPhoneVal', label: 'Phone Value' },
                { key: 'labelAddress', label: 'Address Label' },
                { key: 'fieldAddressVal', label: 'Address Value' },
                { key: 'principalSign', label: 'Authorized Sign' },
              ].map((layer) => {
                const isHidden = config.textStyles?.[layer.key]?.hidden ?? false;
                return (
                  <button
                    key={layer.key}
                    type="button"
                    onClick={() => {
                      setConfig(prev => {
                        const styles = prev.textStyles || {};
                        return {
                          ...prev,
                          textStyles: {
                            ...styles,
                            [layer.key]: {
                              ...styles[layer.key],
                              hidden: !isHidden
                            }
                          }
                        };
                      });
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all duration-150 text-left cursor-pointer ${
                      isHidden
                        ? 'bg-red-50 hover:bg-red-100/80 text-red-650 border-red-200 hover:border-red-300 font-bold'
                        : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-205 hover:border-zinc-300'
                    }`}
                  >
                    <span className="truncate pr-1">{layer.label}</span>
                    {isHidden ? (
                      <span className="text-[8px] uppercase bg-red-100 text-red-700 px-1 py-0.5 rounded font-black shrink-0">Hidden</span>
                    ) : (
                      <span className="text-[8px] uppercase bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-black shrink-0">Visible</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DRAFT GUIDELINE REGIME SELECTION */}
          <div className="bg-zinc-50 border-2 border-zinc-900 rounded-xl p-5" id="branding-technical-guidelines-blueprint">
            <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5 border-b border-zinc-250 pb-2 mb-4">
              <Grid className="w-4 h-4 text-zinc-800" />
              Technical Draft Guideline Rules ({draftGridOptions.length} layouts)
            </h4>
            
            <p className="text-[11px] font-sans text-zinc-550 mb-4 leading-normal">
              Activate architectural draft rulers, golden ratios, or metric margins to coordinate positions down to the pixel. These are visual layout guidelines that help mock alignment perfectly!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[295px] overflow-y-auto pr-1">
              {draftGridOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setConfig(prev => ({ ...prev, draftGridType: opt.id }))}
                  className={`p-2.5 rounded-lg border-2 cursor-pointer transition flex flex-col text-left justify-between ${
                    (config.draftGridType === opt.id || (opt.id === 'none' && !config.draftGridType))
                      ? 'bg-zinc-900 border-zinc-950 text-white shadow-sm'
                      : 'bg-white border-zinc-200 hover:border-zinc-900 text-zinc-850'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wide leading-none">{opt.name}</span>
                  <span className={`text-[9px] mt-1.5 leading-normal ${
                    (config.draftGridType === opt.id || (opt.id === 'none' && !config.draftGridType))
                      ? 'text-zinc-400'
                      : 'text-zinc-450 font-medium'
                  }`}>
                    {opt.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TACTILE CARD TEXTURE & FINISH SELECTOR */}
          <div className="bg-zinc-50 border-2 border-zinc-900 rounded-xl p-5 shadow-xs" id="branding-tactile-textures-card">
            <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5 border-b border-zinc-250 pb-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Tactile Card Texture Overlay Finish
            </h4>
            
            <p className="text-[11px] font-sans text-zinc-550 mb-4 leading-normal">
              Select elegant physical plastic or paper card finishes. Texture overlays react dynamically with cursor hover positions, giving the ID badge an authentic tactile style shine!
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'none', name: 'Standard Smooth', desc: 'Flat digital colors' },
                { id: 'matte', name: 'Paper Matte Finish', desc: 'Subtle paper grain' },
                { id: 'glossy', name: 'High Shine Glossy', desc: 'Sleek specular reflection' },
                { id: 'holographic', name: 'Cosmic Holographic', desc: 'Iridescent rainbow sheen' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, cardTexture: opt.id as 'none' | 'matte' | 'glossy' | 'holographic' }))}
                  className={`p-2.5 rounded-lg border-2 cursor-pointer transition flex flex-col text-left justify-between ${
                    (config.cardTexture === opt.id || (opt.id === 'none' && !config.cardTexture))
                      ? 'bg-zinc-900 border-zinc-950 text-white shadow-xs font-bold font-mono'
                      : 'bg-white border-zinc-200 hover:border-zinc-900 text-zinc-850 font-mono'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wide leading-none">{opt.name}</span>
                  <span className={`text-[9px] mt-1.5 leading-normal ${
                    (config.cardTexture === opt.id || (opt.id === 'none' && !config.cardTexture))
                      ? 'text-zinc-400'
                      : 'text-zinc-450 font-medium'
                  }`}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* GLOBAL BASIC METADATA CONFIGS */}
          <div className="bg-zinc-50 border-2 border-zinc-900 rounded-xl p-5 flex flex-col gap-3.5">
            <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5 border-b border-zinc-250 pb-2">
              <PenTool className="w-4 h-4 text-purple-600" />
              General Institutional Metadata
            </h4>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1 font-bold">Academic Session</label>
                <input
                  type="text"
                  value={config.session}
                  placeholder="2026-2027"
                  onChange={(e) => setConfig(prev => ({ ...prev, session: e.target.value }))}
                  className="w-full bg-white border border-zinc-300 rounded p-2 text-xs font-bold text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1 font-bold">Class Preset Filter</label>
                <input
                  type="text"
                  value={config.defaultClass || ''}
                  placeholder="E.g. X, XII"
                  onChange={(e) => setConfig(prev => ({ ...prev, defaultClass: e.target.value }))}
                  className="w-full bg-white border border-zinc-300 rounded p-2 text-xs font-bold text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1 font-bold">ESTD Year</label>
                <input
                  type="text"
                  value={config.estd || '2013'}
                  placeholder="2013"
                  onChange={(e) => setConfig(prev => ({ ...prev, estd: e.target.value }))}
                  className="w-full bg-white border border-zinc-300 rounded p-2 text-xs font-bold text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1 font-bold">Principal Designation</label>
                <input
                  type="text"
                  value={config.principalName}
                  placeholder="principal sign"
                  onChange={(e) => setConfig(prev => ({ ...prev, principalName: e.target.value }))}
                  className="w-full bg-white border border-zinc-300 rounded p-2 text-xs font-bold text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1 font-bold">Institution Motto / Slogan Text</label>
              <input
                type="text"
                value={config.motto || ''}
                placeholder="LEARN LIKE A PRO SCORE LIKE A LEGEND"
                onChange={(e) => setConfig(prev => ({ ...prev, motto: e.target.value }))}
                className="w-full bg-white border border-zinc-300 rounded p-2 text-xs font-bold text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          {/* EMBLEMS & ENGINES */}
          <div className="bg-zinc-50 border-2 border-zinc-900 rounded-xl p-5 flex flex-col gap-4">
            <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5 border-b border-zinc-250 pb-2">
              <Upload className="w-4 h-4 text-zinc-900" />
              Seals & External Image Signatures
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Logo seal */}
              <div className="bg-white border border-zinc-200 p-3 rounded-lg text-center flex flex-col justify-between h-28">
                <span className="text-[10px] font-black font-mono text-zinc-650 block mb-1 uppercase">Institutional Logo</span>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold text-[9px] uppercase px-2 py-2 rounded transition cursor-pointer"
                >
                  Upload JPG/PNG
                </button>
                {config.schoolLogo ? (
                  <button onClick={() => setConfig(prev => ({ ...prev, schoolLogo: '' }))} className="text-[9px] text-red-500 font-bold underline cursor-pointer mt-1">Reset</button>
                ) : (
                  <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase mt-1">Default Seal Active</span>
                )}
              </div>

              {/* Sign PNG */}
              <div className="bg-white border border-zinc-200 p-3 rounded-lg text-center flex flex-col justify-between h-28">
                <span className="text-[10px] font-black font-mono text-zinc-650 block mb-1 uppercase">Signature overlay</span>
                <input ref={signInputRef} type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                <button
                  type="button"
                  onClick={() => signInputRef.current?.click()}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold text-[9px] uppercase px-2 py-2 rounded transition cursor-pointer"
                >
                  Upload Transparent
                </button>
                {config.principalSign ? (
                  <button onClick={() => setConfig(prev => ({ ...prev, principalSign: '' }))} className="text-[9px] text-red-500 font-bold underline cursor-pointer mt-1">Reset</button>
                ) : (
                  <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase mt-1">Yasir Arafat draft</span>
                )}
              </div>
            </div>

            {/* BRAND ACCENT COLOR CUSTOMIZER & LOGO INTELLIGENT WATERFILL COLOR EXTRACTOR */}
            <div className="border-t border-zinc-200 pt-3.5 flex flex-col gap-3">
              <span className="text-[10px] font-black font-mono text-zinc-900 uppercase block">Institutional Branding theme & AI Color Palette:</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                {/* Real-time Theme Color Selector */}
                <div className="bg-white border border-zinc-200 p-2.5 rounded-lg flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex flex-col text-left">
                    <label className="text-[9px] text-zinc-400 uppercase font-black tracking-wide block mb-0.5">Primary Brand Accent</label>
                    <span className="text-[11px] font-mono font-bold text-zinc-800 uppercase tracking-tight">{config.themeColor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={config.themeColor || '#D32F2F'}
                      onChange={(e) => {
                        const newColor = e.target.value.toUpperCase();
                        setConfig(prev => ({
                          ...prev,
                          themeColor: newColor,
                          // Keep title line color updated with selected branding color too if set
                          schoolTitleLines: (prev.schoolTitleLines || []).map((l, idx) => 
                            idx === 0 ? { ...l, color: newColor } : l
                          )
                        }));
                      }}
                      className="w-10 h-10 border border-zinc-300 rounded cursor-pointer p-0"
                    />
                  </div>
                </div>

                {/* AI extraction status indicators */}
                <div className="bg-white border border-zinc-200 p-2.5 rounded-lg text-left shadow-2xs">
                  <div className="flex flex-col justify-center h-full">
                    <span className="text-[9px] text-zinc-400 uppercase font-black tracking-wide block mb-0.5">AI Color Analysis Engine</span>
                    {isAnalyzing ? (
                      <span className="text-[10px] text-zinc-700 font-mono font-bold uppercase tracking-wide leading-relaxed animate-pulse flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                        Analyzing logo buffers...
                      </span>
                    ) : config.schoolLogo ? (
                      <span className="text-[10px] text-emerald-700 font-mono font-black uppercase tracking-wide leading-relaxed flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-650 shrink-0" />
                        Analysis complete
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-zinc-400 uppercase leading-normal font-bold">
                        Upload custom school logo above to automatically extract accents!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Display Extracted Colors List if available */}
              {extractedColors.length > 0 && (
                <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 text-left">
                  <span className="text-[9.5px] font-black text-zinc-800 font-mono uppercase tracking-wide block mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    AI Extracted Logo Palette Candidates (Tap to Apply):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {extractedColors.map((col) => {
                      const isSelected = config.themeColor.toUpperCase() === col.toUpperCase();
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              themeColor: col,
                              schoolTitleLines: (prev.schoolTitleLines || []).map((l, idx) => 
                                idx === 0 ? { ...l, color: col } : l
                              )
                            }));
                            triggerSaveNotification(`Applied brand accent: ${col}`);
                          }}
                          className={`group flex items-center gap-1.5 px-2 py-1.5 rounded border text-[10px] font-mono transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'text-white border-zinc-950 font-black shadow-inner scale-95'
                              : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200 hover:border-zinc-450 font-bold hover:scale-[1.02]'
                          }`}
                          style={isSelected ? { backgroundColor: col, borderColor: 'rgba(0,0,0,0.15)' } : {}}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0 block"
                            style={{ backgroundColor: col }}
                          />
                          <span className={isSelected ? 'text-white' : 'text-zinc-700'}>{col}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* DIRECT HANDWRITTEN TOUCH SIGN AREA */}
            <div className="bg-white border border-zinc-200 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-zinc-900 font-mono uppercase">Direct Screen Signature Pad:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 font-mono font-extrabold text-[9px] uppercase rounded transition cursor-pointer"
                  >
                    Clear pad
                  </button>
                  <button
                    type="button"
                    onClick={saveSignature}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-black text-[9px] uppercase rounded transition cursor-pointer"
                  >
                    Save ink
                  </button>
                </div>
              </div>

              <canvas
                ref={canvasRef}
                width={350}
                height={90}
                className="w-full h-[80px] bg-zinc-50 rounded border border-zinc-300 cursor-crosshair shadow-inner"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ touchAction: 'none' }}
              />
              <span className="text-[9px] text-zinc-400 block mt-1 leading-normal font-mono select-none">
                Write signature directly above and click <strong className="text-zinc-700 underline">Save ink</strong> to sync immediately!
              </span>
            </div>

          </div>

          {/* EDIT RULES AND REGULATIONS */}
          <div className="bg-zinc-50 border-2 border-zinc-900 rounded-xl p-5 flex flex-col gap-3">
            <span className="text-xs font-mono font-black uppercase text-zinc-900 border-b border-zinc-250 pb-2">Back Side: Terms & Regulations Code</span>
            
            {(config.terms || []).map((term, index) => (
              <div key={term.id} className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-zinc-200 shadow-3xs text-left">
                <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Bullet {index + 1}: {term.label}</span>
                <textarea
                  value={term.text}
                  rows={2}
                  onChange={(e) => handleTermChange(term.id, e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded p-1.5 text-xs text-zinc-900 focus:border-zinc-900 font-sans focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* EDIT POLICY LINE */}
          <div className="bg-zinc-50 border-2 border-zinc-900 rounded-xl p-5 flex flex-col gap-3">
            <span className="text-xs font-mono font-black uppercase text-zinc-900 border-b border-zinc-250 pb-2">Back Side: Bottom Security Policy Line</span>
            <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-zinc-200 shadow-3xs text-left">
              <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Custom Policy Bar Message</span>
              <textarea
                value={config.policyLine || ''}
                rows={2}
                placeholder="This credential is non-transferable and remains the property of the issuer. If found, please return to the issuing agency."
                onChange={(e) => handlePolicyLineChange(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded p-1.5 text-xs text-zinc-900 focus:border-zinc-900 font-sans focus:outline-none"
              />
            </div>
          </div>

        </div>

      </div>

      {/* AI AUTOMATIC CALIBRATION BAR */}
      <div className="border-t-2 border-zinc-900 pt-6 mt-6 select-none bg-sky-950/5 border-dashed rounded-xl p-5 text-left">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h5 className="text-xs font-mono font-black uppercase text-zinc-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              AI Intelligent Layout Sizing Calibrator (Gemini Powered)
            </h5>
            <p className="text-[11px] font-sans text-zinc-650 leading-relaxed mt-1">
              Analyze text length vectors across your active student list. Let the AI calculate perfect font scaling heights, ensuring zero metadata overflow or text lines clashing under A6 layout densities.
            </p>
          </div>
          <button
            onClick={handleAIOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-mono font-black text-xs uppercase px-5 py-3 rounded-lg border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer shrink-0"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Recalibrating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Optimize Card Dimensions
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
