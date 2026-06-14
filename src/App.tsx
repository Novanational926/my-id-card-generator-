/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Users, 
  Settings, 
  Printer, 
  FileSpreadsheet, 
  Eye, 
  RefreshCw, 
  EyeOff, 
  Move, 
  Sliders, 
  Database,
  Type,
  Grid,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Upload,
  Play,
  Check,
  CheckCircle,
  Save,
  Download,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  PenTool,
  QrCode,
  Undo,
  Redo,
  Image as ImageIcon
} from 'lucide-react';
import { IDCard } from './components/IDCard';
import { DataGrid } from './components/DataGrid';
import { PrintLayout } from './components/PrintLayout';
import { Student, CardConfig, ColumnMap, SavedTemplate } from './types';
import { TEMPLATE_LIBRARY_DATA } from './templatesLibrary';

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

        const size = 50;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorCounts: { [hex: string]: number } = {};

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

          if (a < 180) continue;

          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          if (brightness > 235) continue;
          if (r < 25 && g < 25 && b < 25) continue;

          const bucketSize = 10;
          const roundedR = Math.round(r / bucketSize) * bucketSize;
          const roundedG = Math.round(g / bucketSize) * bucketSize;
          const roundedB = Math.round(b / bucketSize) * bucketSize;

          const hex = rgbToHex(roundedR, roundedG, roundedB);
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        const sortedColors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0]);

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
            if (dist < 45) {
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

export default function App() {
  // Navigation State - Unified 3 Steps Workflow
  const [activeTab, setActiveTab] = useState<'designer' | 'spreadsheet' | 'printer'>('designer');
  const [previewMode, setPreviewMode] = useState<'3d' | 'dual'>('dual');
  const [designerMode, setDesignerMode] = useState(true); // default active for interactive click-drag edits
  const [canvasZoom, setCanvasZoom] = useState<number>(1.0);

  // Sidebar / Customizer internal tabs
  const [activeRightTab, setActiveRightTab] = useState<'skins' | 'text' | 'sizes' | 'elements'>('skins');

  // Responsive state for Android/mobile preview auto-scaling
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 1024;
  const mobileScale = windowWidth < 360 ? 0.72 : (windowWidth < 415 ? 0.78 : 0.84);

  // Pre-loaded realistic student dataset
  const [students, setStudents] = useState<Student[]>([
    {
      id: 'stud-1',
      name: 'JONATHAN PATTERSON',
      rollNo: '0012',
      class: 'X',
      phone: '+123-456-7890',
      address: 'Sardar Gaon, Hojai : Assam : 782440',
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'stud-2',
      name: 'SARAH CONNOR',
      rollNo: '0013',
      class: 'X',
      phone: '+123-999-8888',
      address: 'Bazar Road, Doboka : Assam : 782440',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'stud-3',
      name: 'DAVID GUPTA',
      rollNo: '0014',
      class: 'XII',
      phone: '+91-9876543210',
      address: 'Nirmal Gaon, Lanka : Assam : 782446',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    }
  ]);

  // Preloaded school values correlating exact visual layout
  const [config, setConfig] = useState<CardConfig>({
    schoolNamePre: 'STUDIO',
    schoolNameSuf: 'SHODWE',
    schoolNameLine2Pre: 'DESIGN',
    schoolNameLine2Suf: 'MANAGER',
    schoolLogo: '', // Empty triggers fallback LogoSVG vector seal
    principalName: 'YASIR ARAFAT',
    principalSign: '', // Empty triggers fallback SignatureSVG
    session: '2026-2027',
    defaultClass: 'XII',
    estd: '2016',
    motto: 'STUDIO SHODWE',
    themeColor: '#9B111E', // Studio Shodwe deep red
    layoutStyle: 'shodwe-cia',
    gridBackground: true,
    draftGridType: 'none' as any,
    policyLine: '',
    sizes: {
      schoolLogo: 52,
      schoolNameLine1: 19,
      schoolNameLine2: 19,
      studentPhoto: 168,
      studentName: 25,
      studentMeta: 14.2,
      sideStripeText: 19,
      backLogo: 72,
      backTermsTitle: 15.5,
      backTermsText: 11.2,
      principalSign: 50,
      principalName: 11,
      fieldLabels: 14.5,
      fieldRollVal: 14.5,
      fieldClassVal: 14.5,
      fieldPhoneVal: 14.5,
      fieldAddressVal: 14.5,
    },
    showTermsOnBack: true,
    cardTexture: 'none',
    terms: [
      {
        id: 'term-1',
        label: 'Identification',
        text: 'Employees and students are required to keep their ID badge visible or easily accessible during working hours.'
      },
      {
        id: 'term-2',
        label: 'Proper Use',
        text: 'This card is issued solely for institutional services. It is non-transferable and remains the property of the school.'
      },
      {
        id: 'term-3',
        label: 'Loss & Damage',
        text: 'In case of loss or damage, notify the administration office immediately to request a replacement badge.'
      }
    ],
    schoolTitleLines: [
      { id: 'l1', text: 'STUDIO SHODWE', fontSize: 14, bold: true, color: '#ffffff', fontFamily: 'Space Grotesk' }
    ],
    customTextBoxes: [],
    textStyles: {},
  });

  // Default excel column mappings
  const [columnMap, setColumnMap] = useState<ColumnMap>({
    name: 'Full Name',
    rollNo: 'Roll No',
    class: 'Class',
    phone: 'Phone Number',
    address: 'Address',
    photo: 'Photo'
  });

  // Custom extra field keys for spreadsheet
  const [customFieldKeys, setCustomFieldKeys] = useState<string[]>([]);

  // Active student ID highlighting in the live preview card
  const [selectedStudentId, setSelectedStudentId] = useState<string>('stud-1');
  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const handleUpdateStudent = (id: string, updatedFields: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updatedFields } : s));
  };

  // State for user custom layouts database
  const [userTemplates, setUserTemplates] = useState<SavedTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [activePresetId, setActivePresetId] = useState<string>('pdf-shodwe-red');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [saveNotify, setSaveNotify] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);

  // Whiteboard Signature Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Logo & Signature file triggers
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);

  // Load custom templates databases from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('doboka_id_templates_db');
      if (stored) {
        setUserTemplates(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Could not retrieve stored template database", err);
    }
  }, []);

  // Update dynamic extracted colors upon logo changes
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
      });
  }, [config.schoolLogo]);

  const triggerNotify = (text: string) => {
    setSaveNotify(text);
    setTimeout(() => {
      setSaveNotify(null);
    }, 4000);
  };

  // Design Layout History state engine for professional Undo / Redo mechanics
  const [history, setHistory] = useState<CardConfig[]>([]);
  const [future, setFuture] = useState<CardConfig[]>([]);
  
  // High-visibility Save Design modal states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalName, setSaveModalName] = useState('');

  const configTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHistoryConfigRef = useRef<CardConfig>(config);

  // Tracks design modifications and saves states in history periodically when user pauses editing
  useEffect(() => {
    if (!config) return;
    
    // Skip if current configuration matches the last registered history checkpoint
    if (JSON.stringify(config) === JSON.stringify(lastHistoryConfigRef.current)) {
      return;
    }

    if (configTimeoutRef.current) {
      clearTimeout(configTimeoutRef.current);
    }

    configTimeoutRef.current = setTimeout(() => {
      setHistory(prev => {
        const updated = [...prev, lastHistoryConfigRef.current];
        if (updated.length > 50) updated.shift(); // Limit history buffer to 50 states
        return updated;
      });
      setFuture([]); // Clear future redo stack on fresh changes
      lastHistoryConfigRef.current = config;
    }, 800); // 800ms edit pause debounce

    return () => {
      if (configTimeoutRef.current) {
        clearTimeout(configTimeoutRef.current);
      }
    };
  }, [config]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const prevConfig = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    setFuture(prev => [config, ...prev]);

    lastHistoryConfigRef.current = prevConfig;
    setConfig(prevConfig);
    triggerNotify('Layout update Undone ↩️');
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const nextConfig = future[0];
    setFuture(prev => prev.slice(1));
    setHistory(prev => [...prev, config]);

    lastHistoryConfigRef.current = nextConfig;
    setConfig(nextConfig);
    triggerNotify('Layout update Redone ↪️');
  };

  // Keyboard shortcut listener for design updates (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleShortcutKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleShortcutKeyDown);
    return () => window.removeEventListener('keydown', handleShortcutKeyDown);
  }, [config, history, future]);

  const handleSaveModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveModalName.trim()) {
      triggerNotify("Please assign a layout title first.");
      return;
    }

    const brandNew: SavedTemplate = {
      id: 'usr-' + Date.now(),
      name: saveModalName.trim(),
      category: 'User Custom',
      timestamp: new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      config: JSON.parse(JSON.stringify(config)),
    };

    const updated = [...userTemplates, brandNew];
    setUserTemplates(updated);
    localStorage.setItem('doboka_id_templates_db', JSON.stringify(updated));
    setActivePresetId(brandNew.id);
    setSaveModalName('');
    setShowSaveModal(false);
    triggerNotify(`Saved structure "${brandNew.name}" to Library!`);
  };

  // Safe layout save to catalog database
  const handleSaveCurrentLayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      triggerNotify("Please assign a layout title first.");
      return;
    }

    const brandNew: SavedTemplate = {
      id: 'usr-' + Date.now(),
      name: newTemplateName.trim(),
      category: 'User Custom',
      timestamp: new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      config: JSON.parse(JSON.stringify(config)),
    };

    const updated = [...userTemplates, brandNew];
    setUserTemplates(updated);
    localStorage.setItem('doboka_id_templates_db', JSON.stringify(updated));
    setActivePresetId(brandNew.id);
    setNewTemplateName('');
    triggerNotify(`Saved structure "${brandNew.name}" to Library!`);
  };

  const handleApplyPresetGroup = (tpl: SavedTemplate) => {
    setConfig(JSON.parse(JSON.stringify(tpl.config)));
    setActivePresetId(tpl.id);
    triggerNotify(`Applied skin preset: ${tpl.name}`);
  };

  const handleDeleteCustomLayout = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete layout preset "${name}"?`)) {
      const updated = userTemplates.filter(t => t.id !== id);
      setUserTemplates(updated);
      localStorage.setItem('doboka_id_templates_db', JSON.stringify(updated));
      triggerNotify(`Deleted structure layout.`);
    }
  };

  // Direct Screen Signature Pad actions
  const startDrawingOnCanvas = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#002244';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const drawOnCanvas = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingOnCanvas = () => {
    setIsDrawing(false);
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setConfig(prev => ({ ...prev, principalSign: '' }));
    triggerNotify('Cleared whiteboard signature.');
  };

  const saveSignatureCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setConfig(prev => ({ ...prev, principalSign: dataUrl }));
    triggerNotify('Captured hand signature!');
  };

  // Image Upload Streams
  const handleLogoUploadAction = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setConfig(prev => ({ ...prev, schoolLogo: ev.target?.result as string }));
      triggerNotify('Brand Emblem uploaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUploadAction = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setConfig(prev => ({ ...prev, principalSign: ev.target?.result as string }));
      triggerNotify('Authorized Signature uploaded!');
    };
    reader.readAsDataURL(file);
  };

  // Gemini calibration sizing caller
  const triggerAiCalibrationSizing = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/optimize-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students, config }),
      });
      if (!response.ok) {
        throw new Error('AI calibration rejected or offline.');
      }
      const data = await response.json();
      setConfig(prev => {
        const styles = prev.textStyles || {};
        const elementsList = Object.keys(data);
        const updatedStyles = { ...styles };

        elementsList.forEach(el => {
          updatedStyles[el] = {
            ...(updatedStyles[el] || {}),
            customSize: data[el]
          };
        });

        return { ...prev, textStyles: updatedStyles };
      });
      triggerNotify('✨ AI Calibrated element heights flawlessly!');
    } catch (err: any) {
      console.warn(err);
      triggerNotify(`Calibration: Service offline, fallback values active.`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // School Line Customizer helpers
  const handleAddHeaderLine = () => {
    const newLineId = 'line-' + Date.now();
    setConfig(prev => ({
      ...prev,
      schoolTitleLines: [
        ...(prev.schoolTitleLines || []),
        { id: newLineId, text: 'NEW DEPARTMENT LINE', fontSize: 12, bold: false, color: '#27272a', fontFamily: 'Inter' }
      ]
    }));
    triggerNotify('New subheader textline added!');
  };

  const handleRemoveHeaderLine = (id: string) => {
    setConfig(prev => ({
      ...prev,
      schoolTitleLines: (prev.schoolTitleLines || []).filter(l => l.id !== id)
    }));
    triggerNotify('Header line removed.');
  };

  // Custom metadata field triggers
  const handleAddCustomFieldBox = () => {
    const newBoxId = 'box-' + Date.now();
    setConfig(prev => ({
      ...prev,
      customTextBoxes: [
        ...(prev.customTextBoxes || []),
        {
          id: newBoxId,
          label: 'BLOOD GROUP',
          value: 'O+ POSITIVE',
          side: 'front',
          offsetX: 0,
          offsetY: 0,
          fontSize: 12,
          color: '#18181b',
          bold: true,
          fontFamily: 'Inter'
        }
      ]
    }));
    triggerNotify('Custom Field Box appended to Front Side!');
  };

  const handleRemoveCustomFieldBox = (id: string) => {
    setConfig(prev => ({
      ...prev,
      customTextBoxes: (prev.customTextBoxes || []).filter(b => b.id !== id)
    }));
    triggerNotify('Field box removed.');
  };

  // Terms and condition texts
  const handleTermTextChanged = (id: string, updatedText: string) => {
    setConfig(prev => ({
      ...prev,
      terms: (prev.terms || []).map(t => t.id === id ? { ...t, text: updatedText } : t)
    }));
  };

  const handleTermLabelChanged = (id: string, updatedLabel: string) => {
    setConfig(prev => ({
      ...prev,
      terms: (prev.terms || []).map(t => t.id === id ? { ...t, label: updatedLabel } : t)
    }));
  };

  const handleDeleteTerm = (id: string) => {
    setConfig(prev => ({
      ...prev,
      terms: (prev.terms || []).filter(t => t.id !== id)
    }));
    triggerNotify('Term bullet statement deleted.');
  };

  const handleAddTerm = () => {
    const newId = `term-${Date.now()}`;
    setConfig(prev => ({
      ...prev,
      terms: [
        ...(prev.terms || []),
        { id: newId, label: 'Rule', text: 'Write your custom policy or terms and conditions statement line here.' }
      ]
    }));
    triggerNotify('New Term statement appended.');
  };

  const handleResetToStandardSchoolCard = () => {
    setConfig({
      schoolNamePre: 'SACRED',
      schoolNameSuf: 'HEART',
      schoolNameLine2Pre: 'HIGH',
      schoolNameLine2Suf: 'SCHOOL',
      schoolLogo: '', // Blank defaults to premium academic seal
      principalName: 'YASIR ARAFAT',
      principalSign: '', // Blank defaults to vector signature
      session: '2026-2027',
      defaultClass: 'XII',
      estd: '1998',
      motto: 'EDUCATION • INTEGRITY • SERVICE',
      themeColor: '#1E3A8A', // Classic Oxford Navy blue
      layoutStyle: 'academic', // Standard academic vertical school layout 
      gridBackground: true,
      draftGridType: 'none',
      policyLine: 'This ID credential card is strictly non-transferable and remains the property of the institution. If discovered, please return directly to school gate admin office.',
      globalTextScale: 1.0,
      showTermsOnBack: true,
      sizes: {
        schoolLogo: 52,
        schoolNameLine1: 19,
        schoolNameLine2: 19,
        studentPhoto: 168,
        studentName: 25,
        studentMeta: 14.5,
        sideStripeText: 19,
        backLogo: 72,
        backTermsTitle: 15.5,
        backTermsText: 11.2,
        principalSign: 50,
        principalName: 11,
        fieldLabels: 14.5,
        fieldRollVal: 14.5,
        fieldClassVal: 14.5,
        fieldPhoneVal: 14.5,
        fieldAddressVal: 14.5,
      },
      terms: [
        {
          id: 'term-1',
          label: 'Identification',
          text: 'The student must carry this card identity record visible at all times within campus perimeter limits.'
        },
        {
          id: 'term-2',
          label: 'Proper Use',
          text: 'This card is strictly non-transferable and remains the sole legal property of the issuing school.'
        },
        {
          id: 'term-3',
          label: 'Loss & Damage',
          text: 'In event of sudden breakdown, damage, or loss of card, report instantly to admin office for duplicate application workflows.'
        }
      ],
      schoolTitleLines: [
        { id: 'l1', text: 'SACRED HEART ACADEMY', fontSize: 16, bold: true, color: '#FFFFFF', fontFamily: 'Space Grotesk' },
        { id: 'l2', text: 'ESTD 1998 | AFFILIATED TO STATE EDUCATION BOARD', fontSize: 10, bold: false, color: '#cbd5e1', fontFamily: 'JetBrains Mono' }
      ],
      customTextBoxes: [], // Reset any floating user text boxes
      textStyles: {} // Wipe any manually dragged offsets, custom colors, sizing discrepancies, and hidden states
    });
    setCanvasZoom(1.0);
    setDesignerMode(true);
    triggerNotify('Calibrated back to standard vertical School ID layout successfully!');
  };

  const renderResetToStandardSchoolCardBanner = () => {
    return (
      <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border-2 border-indigo-900 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-3xs text-left mb-4 animate-fade-in">
        <div className="flex gap-2 items-start text-indigo-950">
          <div className="p-1.5 bg-indigo-900 text-white rounded-lg shrink-0 flex items-center justify-center">
            <RefreshCw className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <h5 className="text-[10.5px] font-mono font-black uppercase tracking-tight">
              Calibrate Standard school id
            </h5>
            <p className="text-[9.5px] text-zinc-600 font-sans leading-relaxed mt-0.5 font-medium">
              Reset layouts, orientation, sizing proportions, default logo/signatures, and conditions to a perfect vertical academic standard.
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset current canvas template layout and branding details to standard, calibrated school vertical card dimensions? This preserves student names database but cleans styling edits.")) {
              handleResetToStandardSchoolCard();
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-900 hover:bg-slate-900 active:translate-y-[0.5px] text-white text-[9.5px] font-mono font-extrabold uppercase rounded-lg border-2 border-indigo-950 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] cursor-pointer transition-all"
        >
          <span>↺</span> restore school card standard
        </button>
      </div>
    );
  };

  const categories = [
    'all',
    'Classic Academic',
    'Futuristic Cyber',
    'Corporate Minimal',
    'Neon Brutalist',
    'Retro Varsity',
    'Canva PDF Imports',
    'User Custom'
  ];
  const allAvailableTemplates = [...TEMPLATE_LIBRARY_DATA, ...userTemplates];
  const filteredTemplatesList = allAvailableTemplates.filter(t => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const swatchesColors = [
    '#9B111E', // Studio Shodwe deep red
    '#D32F2F', // Doboka signature crimson
    '#1E3A8A', // Oxford deep blue
    '#15803D', // Forest emerald green
    '#18181B', // Solid anthracite
    '#EA580C', // Sunset high-vis orange
    '#7C3AED', // Royal purple accent
  ];

  // Render our customizer panel drawers depending on activeRightTab selection
  const renderDrawerShelf = () => {
    switch (activeRightTab) {
      case 'skins':
        return (
          <div className="flex flex-col gap-4 animate-fade-in text-left">
            <div className="flex flex-col">
              <h4 className="text-xs font-mono font-black uppercase text-zinc-900 tracking-wider">
                📂 Live Layout & Preset Library
              </h4>
              <p className="text-[11px] font-sans text-zinc-500 mt-1 leading-normal">
                Cycle preset styles or apply digital backdrops. Click any preset to instantly update the card.
              </p>
            </div>

            {renderResetToStandardSchoolCardBanner()}

            {/* Category selection pill badges */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-none flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[9px] font-mono font-black uppercase tracking-wider border-2 rounded-full cursor-pointer transition select-none active:translate-y-[1px] leading-none ${
                    selectedCategory === cat
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                      : 'bg-white hover:bg-zinc-100 text-zinc-650 border-zinc-200'
                  }`}
                >
                  {cat === 'all'
                    ? 'ALL PRESETS'
                    : cat === 'Canva PDF Imports'
                    ? 'Canva Premium'
                    : cat.replace('Classic ', '').replace('Corporate ', '').replace('Futuristic ', '').replace('Neon ', '').replace('Retro ', '')}
                </button>
              ))}
            </div>

            {/* Catalog list container */}
            <div className="grid grid-cols-2 gap-1.5 max-h-[290px] overflow-y-auto pr-1">
              {filteredTemplatesList.map((tpl) => {
                const isActive = activePresetId === tpl.id;
                const themeCol = tpl.config?.themeColor || '#D32F2F';
                const cardBg = tpl.config?.layoutStyle === 'ginyard-shawn' || tpl.config?.layoutStyle === 'larana-navy' ? '#18181b' : '#ffffff';
                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleApplyPresetGroup(tpl)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left cursor-pointer transition select-none h-[48px] overflow-hidden ${
                      isActive
                        ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm ring-1 ring-white/10'
                        : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    {/* Iconic preview miniature avatar */}
                    <div 
                      className="w-7 h-9 rounded border flex flex-col justify-between p-[2px] shrink-0 shadow-sm relative overflow-hidden"
                      style={{ backgroundColor: cardBg, borderColor: isActive ? themeCol : '#cbd5e1' }}
                    >
                      {/* Accent header indicator */}
                      <div className="w-full h-[4px] rounded-[1px] mb-[1px]" style={{ backgroundColor: themeCol }} />
                      
                      {/* Photo + Mini Info lines representation */}
                      <div className="flex gap-[2px] items-center mb-[1px] w-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-200 shrink-0 border-[0.5px] border-zinc-300" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : undefined }} />
                        <div className="flex-1 flex flex-col gap-[1px] overflow-hidden">
                          <div className="w-full h-[1.5px] bg-zinc-300 rounded-[0.5px]" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : undefined }} />
                          <div className="w-[80%] h-[1.5px] bg-zinc-300 rounded-[0.5px]" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : undefined }} />
                        </div>
                      </div>
                      
                      {/* Bottom strip marker */}
                      <div className="w-full h-[2.5px] rounded-[0.5px]" style={{ backgroundColor: themeCol, opacity: 0.7 }} />
                    </div>

                    {/* Metadata column */}
                    <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center gap-0.5">
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className={`text-[9.5px] font-sans leading-none font-black uppercase truncate flex-1 ${
                          isActive ? 'text-white' : 'text-zinc-850'
                        }`} title={tpl.name}>
                          {tpl.name}
                        </span>
                        {!tpl.isSystem && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomLayout(tpl.id, tpl.name, e);
                            }}
                            className="p-1 text-red-400 hover:text-red-500 rounded transition shrink-0"
                            title="Delete custom blueprint"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <span className={`text-[7px] font-mono tracking-wide uppercase truncate block opacity-85 font-black ${
                        isActive ? 'text-zinc-400' : 'text-zinc-500'
                      }`}>
                        {tpl.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save current design block */}
            <form onSubmit={handleSaveCurrentLayout} className="border-t border-zinc-150 pt-3 flex flex-col gap-2 mt-1">
              <label className="text-[10px] font-mono font-black uppercase text-zinc-650 tracking-tight">
                💾 Keep Design Configuration as Custom skin Preset:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. Doboka High Science Lab"
                  className="flex-1 bg-white border-2 border-zinc-900 rounded-lg p-2 text-xs font-bold text-zinc-900 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-zinc-900 hover:bg-zinc-850 text-white px-3 py-2 rounded-lg font-mono font-black text-xs uppercase tracking-wider cursor-pointer border-2 border-zinc-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        );

      case 'text':
        return (
          <div className="flex flex-col gap-4 animate-fade-in text-left">
            <div className="flex flex-col">
              <h4 className="text-xs font-mono font-black uppercase text-zinc-900 tracking-wider">
                ✍️ Texts, Emblems & Signature whiteboards (T)
              </h4>
              <p className="text-[11px] font-sans text-zinc-500 mt-1 leading-normal">
                Configure School Name lines, custom variable boxes, logos and principal signature.
              </p>
            </div>

            {renderResetToStandardSchoolCardBanner()}

            {/* School Header Lines */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b pb-1.5 border-zinc-150">
                <span className="text-[10px] font-mono font-black uppercase text-zinc-900 tracking-tight">
                  🏢 Institution Header Textlines:
                </span>
                <button
                  type="button"
                  onClick={handleAddHeaderLine}
                  className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 hover:bg-zinc-850 text-white text-[9px] font-mono font-black rounded uppercase cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-white" />
                  Add Line
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
                {(config.schoolTitleLines || []).map((line, idx) => (
                  <div key={line.id} className="bg-zinc-100 border border-zinc-300 rounded-md p-2.5 relative">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="text-[8px] bg-zinc-800 text-white font-mono font-black px-1.5 py-0.5 rounded leading-none uppercase">
                        Header line #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHeaderLine(line.id)}
                        className="text-red-500 hover:bg-red-50 p-0.5 rounded border border-red-200"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={line.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfig(prev => ({
                          ...prev,
                          schoolTitleLines: (prev.schoolTitleLines || []).map(l => l.id === line.id ? { ...l, text: val } : l)
                        }));
                      }}
                      className="w-full bg-white border border-zinc-200 rounded p-1 text-2xs font-extrabold text-zinc-900 focus:outline-none focus:border-zinc-500"
                    />

                    {/* Quick Fonts selectors */}
                    <div className="grid grid-cols-2 gap-2 mt-1.5 text-[8.5px] font-mono uppercase text-zinc-500">
                      <div>
                        <span>Font Type:</span>
                        <select
                          value={line.fontFamily || 'Inter'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfig(prev => ({
                              ...prev,
                              schoolTitleLines: (prev.schoolTitleLines || []).map(l => l.id === line.id ? { ...l, fontFamily: val } : l)
                            }));
                          }}
                          className="w-full bg-white border border-zinc-200 p-0.5 text-[8.5px] font-mono uppercase focus:outline-none cursor-pointer"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Space Grotesk">Space Grotesk</option>
                          <option value="JetBrains Mono">JetBrains Mono</option>
                          <option value="Playfair Display">Playfair Display</option>
                        </select>
                      </div>
                      <div>
                        <span>Hex Color:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="color"
                            value={line.color || config.themeColor}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfig(prev => ({
                                ...prev,
                                schoolTitleLines: (prev.schoolTitleLines || []).map(l => l.id === line.id ? { ...l, color: val } : l)
                              }));
                            }}
                            className="w-4 h-4 border-0 p-0 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={line.color || config.themeColor}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfig(prev => ({
                                ...prev,
                                schoolTitleLines: (prev.schoolTitleLines || []).map(l => l.id === line.id ? { ...l, color: val } : l)
                              }));
                            }}
                            className="w-full bg-white border border-zinc-200 p-0.5 text-[8px] font-mono focus:outline-none uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Seals & Signatures Block */}
            <div className="grid grid-cols-2 gap-2 border-t border-zinc-150 pt-3">
              <div>
                <span className="text-[9px] font-mono font-black text-zinc-650 uppercase block mb-1">
                  🏫 Emblem file:
                </span>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUploadAction} />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 font-mono font-bold text-[9px] uppercase rounded text-center cursor-pointer"
                >
                  Upload Logo
                </button>
                {config.schoolLogo && (
                  <button onClick={() => setConfig(prev => ({ ...prev, schoolLogo: '' }))} className="text-[8px] text-red-500 font-black uppercase underline block mx-auto mt-1 cursor-pointer">
                    Clear custom logo
                  </button>
                )}
              </div>

              <div>
                <span className="text-[9px] font-mono font-black text-zinc-650 uppercase block mb-1">
                  ✒️ Sign Image:
                </span>
                <input ref={signInputRef} type="file" accept="image/*" className="hidden" onChange={handleSignatureUploadAction} />
                <button
                  type="button"
                  onClick={() => signInputRef.current?.click()}
                  className="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 font-mono font-bold text-[9px] uppercase rounded text-center cursor-pointer"
                >
                  Upload Sign
                </button>
                {config.principalSign && (
                  <button onClick={() => setConfig(prev => ({ ...prev, principalSign: '' }))} className="text-[8px] text-red-500 font-black uppercase underline block mx-auto mt-1 cursor-pointer">
                    Reset defaults
                  </button>
                )}
              </div>
            </div>

            {/* Direct Whiteboard Digital Signature Pad Draw Area */}
            <div className="bg-zinc-50 border border-zinc-300 rounded-lg p-3.5 flex flex-col gap-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-mono font-black text-zinc-900 uppercase">
                  ✍️ Direct Touch Signature Whiteboard:
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={clearSignatureCanvas}
                    className="px-1.5 py-0.5 bg-zinc-200 hover:bg-zinc-250 text-zinc-700 font-mono text-[8px] uppercase rounded cursor-pointer font-bold"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={saveSignatureCanvasImage}
                    className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-850 text-white font-mono text-[8.5px] font-bold uppercase rounded cursor-pointer"
                  >
                    Apply Sign
                  </button>
                </div>
              </div>

              <canvas
                ref={canvasRef}
                width={380}
                height={85}
                className="w-full h-[65px] bg-white border border-zinc-300 rounded shadow-inner cursor-crosshair"
                onMouseDown={startDrawingOnCanvas}
                onMouseMove={drawOnCanvas}
                onMouseUp={stopDrawingOnCanvas}
                onMouseLeave={stopDrawingOnCanvas}
                onTouchStart={startDrawingOnCanvas}
                onTouchMove={drawOnCanvas}
                onTouchEnd={stopDrawingOnCanvas}
                style={{ touchAction: 'none' }}
              />
              <span className="text-[8px] font-mono text-zinc-400 block leading-tight font-semibold">
                Write authorized signatures inside the canvas whitepad, then tap <strong>Apply Sign</strong>.
              </span>
            </div>

            {/* Custom variable metadata boxes details */}
            <div className="flex flex-col gap-2.5 border-t border-zinc-150 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase text-zinc-900 tracking-tight">
                  ➕ Append Custom Data Fields:
                </span>
                <button
                  type="button"
                  onClick={handleAddCustomFieldBox}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-mono font-black rounded uppercase cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  Add Box
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                {(config.customTextBoxes || []).map((box, idx) => (
                  <div key={box.id} className="bg-zinc-50 border border-zinc-301 rounded p-2 text-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-black text-[#15803D] uppercase">Field #{idx+1}</span>
                      <button onClick={() => handleRemoveCustomFieldBox(box.id)} className="text-red-500 uppercase hover:underline text-[9px] font-bold">Delete</button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        placeholder="Label (e.g. BLOOD GRP)"
                        value={box.label}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setConfig(prev => ({
                            ...prev,
                            customTextBoxes: (prev.customTextBoxes || []).map(b => b.id === box.id ? { ...b, label: val } : b)
                          }));
                        }}
                        className="bg-white border rounded p-1 font-mono uppercase focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. B+ POSITIVE)"
                        value={box.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfig(prev => ({
                            ...prev,
                            customTextBoxes: (prev.customTextBoxes || []).map(b => b.id === box.id ? { ...b, value: val } : b)
                          }));
                        }}
                        className="bg-white border rounded p-1 font-sans focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-1 text-[8px] uppercase">
                      <select
                        value={box.side}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setConfig(prev => ({
                            ...prev,
                            customTextBoxes: (prev.customTextBoxes || []).map(b => b.id === box.id ? { ...b, side: val } : b)
                          }));
                        }}
                        className="bg-white border text-[8.5px] rounded p-0.5 focus:outline-none"
                      >
                        <option value="front">Front Facet</option>
                        <option value="back">Reverse Facet</option>
                      </select>
                      <select
                        value={box.fontFamily || 'Inter'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfig(prev => ({
                            ...prev,
                            customTextBoxes: (prev.customTextBoxes || []).map(b => b.id === box.id ? { ...b, fontFamily: val } : b)
                          }));
                        }}
                        className="bg-white border text-[8.5px] rounded p-0.5 focus:outline-none"
                      >
                        <option value="Inter">Inter Sans</option>
                        <option value="Space Grotesk">Space Grotesk</option>
                        <option value="JetBrains Mono">Mono Dev</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* motto established session principal designation */}
            <div className="grid grid-cols-2 gap-2 border-t border-zinc-150 pt-3">
              <div>
                <label className="text-[9px] uppercase font-mono block text-zinc-500 font-bold mb-0.5">Slogan/Motto:</label>
                <input
                  type="text"
                  value={config.motto}
                  onChange={(e) => setConfig(prev => ({ ...prev, motto: e.target.value }))}
                  className="w-full bg-white border border-zinc-200 rounded p-1 text-2xs font-bold text-zinc-950 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-mono block text-zinc-500 font-bold mb-0.5">Principal Designation:</label>
                <input
                  type="text"
                  value={config.principalName}
                  onChange={(e) => setConfig(prev => ({ ...prev, principalName: e.target.value }))}
                  className="w-full bg-white border border-zinc-200 rounded p-1 text-2xs font-bold text-zinc-950 focus:outline-none"
                />
              </div>
            </div>

            {/* Back Terms and Conditions */}
            <div className="border-t border-zinc-150 pt-3 select-none flex flex-col gap-2.5">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 shadow-3xs">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setConfig(prev => ({ ...prev, showTermsOnBack: !prev.showTermsOnBack }))}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-mono font-black text-zinc-900 uppercase">
                      📜 Show Terms on Back Face
                    </span>
                    <span className="text-[8px] text-zinc-550 font-medium leading-tight mt-0.5">
                      Enable to render custom regulatory terms on the back of the ID card instead of the signature block.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!config.showTermsOnBack}
                    onChange={(e) => setConfig(prev => ({ ...prev, showTermsOnBack: e.target.checked }))}
                    className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 accent-zinc-950 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="text-[9.5px] font-mono font-black text-zinc-700 uppercase">
                  Regulations & Terms Bullets:
                </span>
                <button
                  onClick={handleAddTerm}
                  className="bg-zinc-950 hover:bg-zinc-900 text-white font-mono text-[9px] px-2.5 py-1 rounded transition duration-150 shadow-3xs flex items-center gap-1 font-extrabold"
                >
                  <span>+</span> Add Line Rule
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
                {(!config.terms || config.terms.length === 0) ? (
                  <div className="text-center py-4 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-200">
                    <p className="text-[10px] text-zinc-400 font-mono">No terms or rules defined yet.</p>
                  </div>
                ) : (
                  (config.terms || []).map((term, idx) => (
                    <div key={term.id} className="bg-white border border-zinc-200 p-2.5 rounded-lg shadow-3xs transition hover:border-zinc-350">
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <div className="flex-1 text-left">
                          <label className="text-[8px] uppercase tracking-wider font-extrabold text-zinc-400 font-mono block mb-0.5">Label Prefix:</label>
                          <input
                            type="text"
                            value={term.label || ''}
                            onChange={(e) => handleTermLabelChanged(term.id, e.target.value)}
                            placeholder="e.g. Note, Rule, Regulation"
                            className="w-full bg-zinc-50 border border-zinc-200 rounded p-1 text-2xs font-bold text-zinc-900 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteTerm(term.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-mono text-[8px] p-1 rounded font-black transition self-end h-[24px] px-2"
                          title="Delete Statement"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="text-left">
                        <label className="text-[8px] uppercase tracking-wider font-extrabold text-zinc-400 font-mono block mb-1">Statement Text:</label>
                        <textarea
                          value={term.text || ''}
                          rows={2}
                          onChange={(e) => handleTermTextChanged(term.id, e.target.value)}
                          placeholder="Type rules/instructions for losing the card, etc..."
                          className="w-full bg-zinc-50 border border-zinc-200 p-1.5 rounded text-2xs font-semibold text-zinc-800 leading-normal focus:outline-none focus:bg-white focus:border-zinc-350 transition duration-150"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'sizes':
        return (
          <div className="flex flex-col gap-4 animate-fade-in text-left">
            <div className="flex flex-col">
              <h4 className="text-xs font-mono font-black uppercase text-zinc-900 tracking-wider">
                📏 Layout Sizes, Heights & Dimensions
              </h4>
              <p className="text-[11px] font-sans text-zinc-550 mt-1 leading-normal">
                Fine-tune elements dimensions and font sizing heights. Adjust lines in real-time.
              </p>
            </div>

            {renderResetToStandardSchoolCardBanner()}

            {/* GLOBAL WYSIWYG TEXT ZOOM CONTROLLER */}
            <div className="bg-zinc-50 border-2 border-zinc-900 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-900 font-extrabold uppercase">
                <span className="flex items-center gap-1.5 matches-vibe text-[#1e3a8a]">
                  <Type className="w-4 h-4 text-indigo-600 animate-pulse" />
                  Global WYSIWYG Text Zoom
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                  {Math.round((config.globalTextScale ?? 1.0) * 100)}%
                </span>
              </div>
              <p className="text-[10px] text-zinc-505 font-sans leading-relaxed">
                Zoom in or out all labels, details, captions, and school name header fonts collectively.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setConfig(prev => ({
                      ...prev,
                      globalTextScale: Math.max(0.5, Number(((prev.globalTextScale ?? 1.0) - 0.05).toFixed(2)))
                    }));
                  }}
                  className="p-1 px-2.5 bg-white border border-zinc-300 hover:bg-zinc-100 hover:border-zinc-400 font-mono text-zinc-900 font-black text-xs rounded-lg active:scale-95 cursor-pointer shadow-sm select-none"
                  title="Zoom Out All Texts"
                >
                  -
                </button>
                <input
                  type="text"
                  readOnly
                  value={`${Math.round((config.globalTextScale ?? 1.0) * 100)}%`}
                  className="w-14 text-center bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs font-mono font-bold rounded py-1 shrink-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    setConfig(prev => ({
                      ...prev,
                      globalTextScale: Math.min(2.0, Number(((prev.globalTextScale ?? 1.0) + 0.05).toFixed(2)))
                    }));
                  }}
                  className="p-1 px-2.5 bg-white border border-zinc-300 hover:bg-zinc-100 hover:border-zinc-400 font-mono text-zinc-900 font-black text-xs rounded-lg active:scale-95 cursor-pointer shadow-sm select-none"
                  title="Zoom In All Texts"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfig(prev => ({
                      ...prev,
                      globalTextScale: 1.0
                    }));
                  }}
                  className="p-1 text-[9px] font-mono text-indigo-800 hover:underline hover:text-indigo-950 uppercase shrink-0 font-bold"
                  title="Reset scale to 100%"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* GEMINI INTELLIGENT SIZING CALIBRATOR CALL-ACTION BUTTON */}
            <button
              type="button"
              onClick={triggerAiCalibrationSizing}
              disabled={isOptimizing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-zinc-950 bg-gradient-to-r from-blue-900 to-indigo-950 text-white font-mono font-black text-xs uppercase tracking-wide cursor-pointer transition active:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] disabled:opacity-50"
              title="Automatically analyze dynamic string volumes across registries & fix text overflows"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Generating AI Calibration Calibration...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  AI Intelligent Layout Calibrator
                </>
              )}
            </button>

            {/* List of Sizing Sliders */}
            <div className="flex flex-col gap-3 max-h-[310px] overflow-y-auto pr-1">
              {[
                { key: 'schoolLogo', label: 'Emlbems & Seals heights', min: 35, max: 70 },
                { key: 'studentPhoto', label: 'Student Photo heights', min: 110, max: 200 },
                { key: 'studentName', label: 'Student Name font size', min: 16, max: 32 },
                { key: 'studentMeta', label: 'Field value font size', min: 11, max: 18 },
                { key: 'schoolNameLine1', label: 'School Name Line 1 font size', min: 12, max: 24 },
                { key: 'schoolNameLine2', label: 'School Name Line 2 font size', min: 10, max: 20 },
                { key: 'fieldLabels', label: 'Metadata tag descriptions font', min: 11, max: 17 },
                { key: 'backLogo', label: 'Reverse Side Logo heights', min: 50, max: 110 },
                { key: 'principalSign', label: 'Principal digital sign size', min: 36, max: 70 },
                { key: 'backTermsText', label: 'Back terms rules font size', min: 8, max: 15 },
              ].map((item) => {
                const unscaledDefaults: Record<string, number> = {
                  schoolLogo: 52,
                  studentPhoto: 172,
                  studentName: 26,
                  studentMeta: 14.5,
                  schoolNameLine1: 19,
                  schoolNameLine2: 19,
                  fieldLabels: 14.5,
                  backLogo: 72,
                  principalSign: 50,
                  backTermsText: 11.2,
                };
                const currentVal = config.sizes?.[item.key as keyof typeof config.sizes] ?? unscaledDefaults[item.key] ?? 15;
                return (
                  <div key={item.key} className="flex flex-col gap-1 border-b border-zinc-100 pb-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-700 font-bold uppercase leading-none">
                      <span>{item.label}:</span>
                      <strong className="text-zinc-950 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                        {currentVal}px
                      </strong>
                    </div>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      value={currentVal}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setConfig(prev => ({
                          ...prev,
                          sizes: {
                            ...(prev.sizes || {}),
                            [item.key]: val
                          }
                        }));
                      }}
                      className="w-full accent-zinc-900 h-1.5 rounded cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'elements':
        return (
          <div className="flex flex-col gap-4 animate-fade-in text-left">
            <div className="flex flex-col">
              <h4 className="text-xs font-mono font-black uppercase text-zinc-900 tracking-wider">
                🎯 Visual Guidelines & Elements Switchers
              </h4>
              <p className="text-[11px] font-sans text-zinc-550 mt-1 leading-normal">
                Toggle watermark alignment grids, show/hide scanner barcode layout elements, and select primary brand color.
              </p>
            </div>

            {/* Primary Accent Color Selector Swatches with extractor */}
            <div className="flex flex-col gap-2 border-b border-zinc-150 pb-3">
              <span className="text-[10px] font-mono font-black text-zinc-800 uppercase block mb-1">
                🎨 Brand Primary Accent theme color:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.themeColor}
                  onChange={(e) => {
                    const newColor = e.target.value.toUpperCase();
                    setConfig(prev => ({
                      ...prev,
                      themeColor: newColor,
                      schoolTitleLines: (prev.schoolTitleLines || []).map((l, ind) => 
                        ind === 0 ? { ...l, color: newColor } : l
                      )
                    }));
                  }}
                  className="w-10 h-10 border-2 border-zinc-900 rounded-lg cursor-pointer shrink-0"
                />
                
                <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                  {swatchesColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          themeColor: color,
                          schoolTitleLines: (prev.schoolTitleLines || []).map((l, ind) => 
                            ind === 0 ? { ...l, color } : l
                          )
                        }));
                        triggerNotify(`Selected theme: ${color}`);
                      }}
                      className={`w-5.5 h-5.5 rounded-full border-2 transition active:scale-95 cursor-pointer hover:scale-110 ${
                        config.themeColor === color ? 'border-zinc-950 scale-105 shadow-sm' : 'border-zinc-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Logo intelligent watercolor extractor feed list */}
              {extractedColors.length > 0 && (
                <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-2.5 mt-1">
                  <span className="text-[8.5px] font-black text-zinc-800 font-mono uppercase block mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    AI Extracted Logo Accent Candidates (Tap to select):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {extractedColors.slice(0, 5).map((col) => (
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
                          triggerNotify(`Applied logo brand candidate: ${col}`);
                        }}
                        className="flex items-center gap-1 bg-white border px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-black tracking-tight"
                      >
                        <span className="w-1.5 h-1.5 rounded-full border border-black/10 shrink-0 block" style={{ backgroundColor: col }} />
                        <span>{col}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Elements Checkboxes Toggles list */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-mono font-black text-zinc-800 uppercase block mb-1">
                Toggle Staged Card Elements:
              </span>

              {/* Photo show / hide */}
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, hidePhoto: !(prev as any).hidePhoto }))}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 font-mono font-black text-[10px] uppercase cursor-pointer select-none active:translate-y-[1px] ${
                  !(config as any).hidePhoto
                    ? 'bg-zinc-900 border-zinc-950 text-white shadow-sm'
                    : 'bg-zinc-50 text-zinc-400 border-zinc-200 hover:text-zinc-550'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Profile Photo: {!(config as any).hidePhoto ? 'VISIBLE' : 'HIDDEN'}</span>
                </div>
                <span>{!(config as any).hidePhoto ? 'ON' : 'OFF'}</span>
              </button>

              {/* Barcode / QR show / hide */}
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, hideBarcode: !(prev as any).hideBarcode }))}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 font-mono font-black text-[10px] uppercase cursor-pointer select-none active:translate-y-[1px] ${
                  !(config as any).hideBarcode
                    ? 'bg-zinc-900 border-zinc-950 text-white shadow-sm'
                    : 'bg-zinc-50 text-zinc-400 border-zinc-200 hover:text-zinc-550'
                }`}
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scanner Barcode/QR: {!(config as any).hideBarcode ? 'VISIBLE' : 'HIDDEN'}</span>
                </div>
                <span>{!(config as any).hideBarcode ? 'ON' : 'OFF'}</span>
              </button>

              {/* Draft Guideline and Waterproofing Background align overlays */}
              <div className="flex flex-col gap-1 border-t border-zinc-150 pt-2 text-[10px] font-mono uppercase text-zinc-700 font-black">
                <span>🎯 Watermark Alignment Aids Overlay:</span>
                <select
                  value={config.draftGridType || 'none'}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setConfig(prev => ({ ...prev, draftGridType: val }));
                  }}
                  className="w-full bg-white border-2 border-zinc-900 rounded-lg p-2 text-2xs font-bold text-zinc-950 focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  <option value="none">No layout guidelines</option>
                  <option value="blueprint">Science Blue core blueprint</option>
                  <option value="graph">Millimeter engineering grid rule</option>
                  <option value="radial">Polar conic coordinate rings</option>
                  <option value="isometric">3D Drafting isometric matrix</option>
                  <option value="golden">Devine Fibonacci spiral overlay</option>
                  <option value="bounds">Printer Bleeding Safebounds</option>
                </select>
              </div>
            </div>
          </div>
        );
    }
  };

  // If we are currently in Step 3, let the PrintLayout component take central control of the page
  if (activeTab === 'printer') {
    return (
      <PrintLayout
        students={students}
        config={config}
        onBack={() => setActiveTab('spreadsheet')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans select-none text-zinc-900" id="main-application-shell">
      
      {/* GLOBAL NAVBAR HEADER */}
      <header className="border-b-2 border-zinc-900 bg-white sticky top-0 z-40 select-text text-zinc-905 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Headline logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-display font-black uppercase tracking-tight text-zinc-900 leading-none">
                  Doboka ID Builder Studio
                </h1>
                <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 bg-zinc-100 border border-zinc-350 text-zinc-800 rounded">
                  V.2090
                </span>
              </div>
              <p className="text-[8.5px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5 leading-none">
                Industrial Identity Badge System
              </p>
            </div>
          </div>

          {/* Quick links header */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-500 hidden md:block uppercase font-bold mr-1.5">
              Profiles: <strong className="text-zinc-900 font-extrabold">{students.length}</strong>
            </span>
            
            <button
              onClick={() => {
                if (activeTab === 'designer') {
                  setActiveTab('spreadsheet');
                } else if (activeTab === 'spreadsheet') {
                  setActiveTab('printer');
                }
              }}
              className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 active:scale-95 text-white font-mono font-black text-[10.5px] px-3.5 py-2 rounded-lg border border-zinc-900 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] uppercase transition cursor-pointer"
            >
              <span>{activeTab === 'designer' ? 'Next: Upload excel' : 'Next: Compile PDF'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* WORKFLOW PIPELINE PROGRESS MAP */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 select-none" id="milestones-stepper">
        <div className="bg-white border-2 border-zinc-900 rounded-xl p-3.5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase font-black">PIPELINE MONITOR</span>
            <h2 className="text-xs font-display font-black uppercase text-zinc-900">SYSTEM FLOW CHART PROGRESSION</h2>
          </div>
          
          <div className="flex items-center w-full md:w-auto overflow-x-auto py-1 scrollbar-none justify-between md:justify-end gap-1.5 sm:gap-4 md:flex-1 max-w-xl">
            {[
              { id: 'designer', title: '1. DESIGN LOBBY', desc: 'Live Customizer' },
              { id: 'spreadsheet', title: '2. EXCEL LEDGER', desc: 'Profiles Database' },
              { id: 'printer', title: '3. PRINT SUITE', desc: 'A4 Grid Compiler' },
            ].map((step, idx) => {
              const isActive = activeTab === step.id;
              const isPast = (activeTab === 'spreadsheet' && step.id === 'designer') ||
                            (activeTab === 'printer');
              
              return (
                <React.Fragment key={step.id}>
                  {idx > 0 && (
                    <div className={`hidden md:block h-0.5 w-6 transition ${isPast ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
                  )}
                  <button
                    onClick={() => setActiveTab(step.id as any)}
                    className="flex items-center gap-2 text-left cursor-pointer transition focus:outline-none shrink-0 group active:scale-95"
                  >
                    <div 
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono font-black text-[11px] transition ${
                        isActive 
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-md ring-4' 
                          : isPast 
                            ? 'bg-zinc-100 text-zinc-900 border-zinc-900' 
                            : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                      }`}
                      style={isActive ? { 
                        backgroundColor: config.themeColor, 
                        borderColor: config.themeColor,
                        outline: `3px solid ${config.themeColor}33`
                      } : {}}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-[10px] font-display font-black uppercase text-zinc-900 leading-none group-hover:text-zinc-600">{step.title}</div>
                      <div className="text-[8px] font-mono text-zinc-450 mt-0.5 leading-none">{step.desc}</div>
                    </div>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE CENTRAL STAGES */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 lg:pb-6">
        {saveNotify && (
          <div className="fixed top-20 right-6 bg-emerald-50 border-2 border-emerald-600 text-emerald-800 text-xs font-mono px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xl z-50 animate-fade-in font-black">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <span>{saveNotify}</span>
          </div>
        )}

        {showSaveModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4" 
            onClick={() => setShowSaveModal(false)}
          >
            <div 
              className="bg-white border-2 border-zinc-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] p-5 max-w-sm w-full animate-scale-up text-left" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-2 mb-3 border-zinc-150">
                <h3 className="text-xs font-mono font-black uppercase text-zinc-900 tracking-wider">
                  💾 Save Layout Blueprint
                </h3>
                <button 
                  onClick={() => setShowSaveModal(false)} 
                  className="text-zinc-400 hover:text-zinc-600 font-bold uppercase text-[10px] cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSaveModalSubmit} className="flex flex-col gap-3">
                <p className="text-[11px] font-sans text-zinc-500 leading-normal">
                  Save your current layout style adjustments, custom colors, dimensions, and text structures as a reusable preset blueprint.
                </p>
                
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[9px] font-mono font-black uppercase text-zinc-500">Assign Layout Name:</span>
                  <input
                    type="text"
                    required
                    value={saveModalName}
                    onChange={(e) => setSaveModalName(e.target.value)}
                    placeholder="e.g. Science Dept Corporate, Red Edition"
                    className="w-full bg-white border-2 border-zinc-900 rounded-lg p-2.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2 rounded-lg font-mono font-black text-[10px] uppercase cursor-pointer border border-zinc-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-white py-2 rounded-lg font-mono font-black text-[10px] uppercase cursor-pointer border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] active:translate-y-[1px] transition"
                  >
                    Confirm & Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'designer' ? (
          /* =======================================================
             STEP 1: DESIGN & CUSTOMIZING LOBBY (LARGE INTEGRATED VIEW)
             ======================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
            
            {/* Left/Center Column (7 Grid Columns): Big Live Preview tracking */}
            <div className="lg:col-span-7 bg-white border-2 border-zinc-900 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col gap-4">
              
              <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <h3 className="text-xs font-mono font-black uppercase text-zinc-900 flex items-center gap-1.5">
                    Live target tracking Card Facet
                  </h3>
                </div>
                <span className="text-[8px] font-mono px-1.5 py-0.5 bg-zinc-100 border rounded tracking-widest text-zinc-500 uppercase">
                  CR80 Format density
                </span>
              </div>

              {/* Designer Toggle Guidelines button */}
              <div className="flex flex-wrap gap-2.5 items-center justify-between bg-zinc-100 p-2 border-2 border-zinc-900 rounded-lg">
                <button
                  onClick={() => setDesignerMode(!designerMode)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded text-[10px] font-mono font-black uppercase cursor-pointer select-none active:translate-y-[1px] ${
                    designerMode
                      ? 'bg-blue-600 border-2 border-blue-900 text-white font-bold'
                      : 'bg-white hover:bg-zinc-50 text-zinc-800 border-2 border-zinc-200'
                  }`}
                  title="Permits clicking element blocks inside the preview to relocate/drag or customize metrics"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>{designerMode ? '💥 WYSIWYG DRAGGING LIVE' : '🎯 STATIC CR80 BLUEPRINT'}</span>
                </button>

                {/* Visual History & Quick-Save Panel */}
                <div className="flex items-center gap-2">
                  {/* Undo / Redo tools */}
                  <div className="flex bg-white p-0.5 rounded border border-zinc-300">
                    <button
                      onClick={handleUndo}
                      disabled={history.length === 0}
                      className={`w-7 h-7 flex items-center justify-center rounded transition ${
                        history.length === 0 ? 'opacity-35 cursor-not-allowed text-zinc-400' : 'hover:bg-zinc-100 text-zinc-900 active:translate-y-[1px] cursor-pointer'
                      }`}
                      title="Undo Design Change (Ctrl+Z)"
                    >
                      <Undo className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={future.length === 0}
                      className={`w-7 h-7 flex items-center justify-center rounded transition ${
                        future.length === 0 ? 'opacity-35 cursor-not-allowed text-zinc-400' : 'hover:bg-zinc-100 text-zinc-900 active:translate-y-[1px] cursor-pointer'
                      }`}
                      title="Redo Design Change (Ctrl+Y)"
                    >
                      <Redo className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Save Design Trigger */}
                  <button
                    onClick={() => {
                      setSaveModalName('');
                      setShowSaveModal(true);
                    }}
                    className="flex items-center gap-1.5 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 text-white rounded font-mono font-black text-[9.5px] uppercase cursor-pointer transition select-none active:translate-y-[1px] shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] border border-zinc-950"
                    title="Instantly save copy of current custom design skin to catalog library"
                  >
                    <Save className="w-3 h-3 text-white" />
                    <span>Save Design</span>
                  </button>
                </div>

                {/* Canvas Zoom In / Zoom Out and Reset control widget - identical to Canva */}
                <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-zinc-300">
                  <button
                    onClick={() => setCanvasZoom(z => Math.max(0.4, z - 0.1))}
                    className="p-1 hover:bg-zinc-150 rounded text-[11px] font-black cursor-pointer leading-none text-zinc-800 w-6 h-6 flex items-center justify-center"
                    title="Zoom Out"
                  >
                    ➖
                  </button>
                  <span className="text-[9px] font-mono font-black text-zinc-900 w-11 text-center select-none">{Math.round(canvasZoom * 100)}%</span>
                  <button
                    onClick={() => setCanvasZoom(z => Math.min(2.5, z + 0.1))}
                    className="p-1 hover:bg-zinc-150 rounded text-[11px] font-black cursor-pointer leading-none text-zinc-800 w-6 h-6 flex items-center justify-center"
                    title="Zoom In"
                  >
                    ➕
                  </button>
                  <div className="w-[1px] h-4 bg-zinc-200 mx-0.5" />
                  <button
                    onClick={() => setCanvasZoom(1.0)}
                    className="p-1 hover:bg-zinc-150 rounded text-[11px] font-black cursor-pointer leading-none text-zinc-500 hover:text-zinc-900 w-6 h-6 flex items-center justify-center"
                    title="Reset Zoom"
                  >
                    ↺
                  </button>
                </div>

                <div className="flex bg-white/80 p-0.5 rounded border border-zinc-300">
                  <button
                    onClick={() => setPreviewMode('dual')}
                    className={`px-2 py-1 text-[8.5px] font-mono font-black uppercase rounded ${
                      previewMode === 'dual' ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Dual Faces
                  </button>
                  <button
                    onClick={() => {
                      setPreviewMode('3d');
                      setDesignerMode(false); // disable dragging in 3d view
                    }}
                    className={`px-2 py-1 text-[8.5px] font-mono font-black uppercase rounded ${
                      previewMode === '3d' ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    3D Flip
                  </button>
                </div>
              </div>

              {/* Instructions and help tips */}
              <p className="text-[10px] font-semibold font-sans text-zinc-550 leading-relaxed text-center">
                {designerMode 
                  ? '⭐ drag text headers or custom boxes on the card layout below with your mouse! Tap once to style fonts.'
                  : previewMode === '3d' 
                    ? '★ Click on the credit-card body replica to spin and check alignment!' 
                    : '★ Blueprint mode: side-by-side front and reverse sides. Adjust right customizer items to observe live!'}
              </p>

              {/* ACTIVE PHYSICAL CHASSIS CONTAINER */}
              <div 
                className="flex justify-center items-center py-2 bg-gradient-to-br from-zinc-50/50 to-zinc-100/50 border border-zinc-200 rounded-xl" 
                style={{ minHeight: previewMode === 'dual' ? (isMobile ? '460px' : '920px') : '530px' }}
              >
                {activeStudent ? (
                  previewMode === '3d' && !designerMode ? (
                    <IDCard
                      student={activeStudent}
                      config={config}
                      setConfig={setConfig}
                      scale={(isMobile ? mobileScale : 0.94) * canvasZoom}
                      isPrinting={false}
                      designerMode={false}
                      onUpdateStudent={handleUpdateStudent}
                    />
                  ) : (
                    <div className="flex flex-col gap-5 items-center w-full select-none">
                      {/* FRONT CARD FACENCY */}
                      <div className="flex flex-col items-center">
                        <IDCard
                          student={activeStudent}
                          config={config}
                          setConfig={setConfig}
                          scale={(isMobile ? mobileScale : 0.90) * canvasZoom}
                          isPrinting={false}
                          forcedSide="front"
                          designerMode={designerMode}
                          onUpdateStudent={handleUpdateStudent}
                        />
                      </div>

                      {/* Spacer */}
                      <div className="w-full border-t border-dashed border-zinc-250 my-1" />

                      {/* REVERSE CARD FACENCY */}
                      <div className="flex flex-col items-center">
                        <IDCard
                          student={activeStudent}
                          config={config}
                          setConfig={setConfig}
                          scale={(isMobile ? mobileScale : 0.90) * canvasZoom}
                          isPrinting={false}
                          forcedSide="back"
                          designerMode={designerMode}
                          onUpdateStudent={handleUpdateStudent}
                        />
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-zinc-400 font-mono text-center text-xs p-8">No students listed. Add standard records below.</div>
                )}
              </div>

              {/* Target Selector Switcher */}
              {students.length > 0 && (
                <div className="border-t pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="text-left w-full sm:w-auto">
                    <label className="block text-[9.5px] font-mono font-black uppercase text-zinc-500 mb-1 leading-none">
                      Select active testing Student profile:
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full sm:w-64 bg-zinc-100 text-xs font-bold text-zinc-900 border-2 border-zinc-900 rounded p-1.5 cursor-pointer max-w-full"
                    >
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name || '(Blank Record Name)'} [Class: {st.class || 'X'}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Move to Step 2 big button */}
                  <button
                    onClick={() => setActiveTab('spreadsheet')}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-3 px-5 bg-zinc-900 hover:bg-zinc-850 text-white font-mono font-black text-xs uppercase rounded-xl border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer tracking-wider"
                  >
                    <span>Save Design & Upload Excel →</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column (5 Grid Columns): THE INTEGRATED DRAWERS CONTROL PANE (Right nav bar of tools icons) */}
            <div className="lg:col-span-5 bg-white border-2 border-zinc-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] grid grid-cols-12 overflow-hidden min-h-[460px] lg:min-h-[730px] items-stretch">
              
              {/* Central Drawer Component (Cols 10) */}
              <div className="col-span-10 p-5 overflow-y-auto">
                {renderDrawerShelf()}
              </div>

              {/* Right Vertical Iconic Nav-rail Bar (Cols 2) (Right side tool icon selector like templates drawing catalog etc) */}
              <div className="col-span-2 border-l border-zinc-200 bg-zinc-100 flex flex-col items-center py-4 justify-start gap-4 shrink-0">
                {[
                  { id: 'skins', label: 'Skins', icon: Database, tooltip: 'Blueprints presets and skin catalog' },
                  { id: 'text', label: 'Branding', icon: Type, tooltip: 'Typography texts and Authorized Sign' },
                  { id: 'sizes', label: 'Sizes', icon: Sliders, tooltip: 'Sizing dynamic elements sliders' },
                  { id: 'elements', label: 'Elements', icon: Grid, tooltip: 'Watermarks visual guidelines and outlines toggling' },
                ].map((shelf) => {
                  const isActive = activeRightTab === shelf.id;
                  const Icon = shelf.icon;
                  return (
                    <button
                      key={shelf.id}
                      onClick={() => setActiveRightTab(shelf.id as any)}
                      className={`group flex flex-col items-center justify-center w-11 h-12 rounded-lg cursor-pointer transition relative ${
                        isActive
                          ? 'text-white shadow-inner scale-95'
                          : 'text-zinc-400 hover:text-zinc-800'
                      }`}
                      style={isActive ? { backgroundColor: config.themeColor } : {}}
                      title={shelf.tooltip}
                    >
                      <Icon className="w-5.5 h-5.5" />
                      <span className={`text-[8px] font-mono uppercase tracking-tight mt-1 leading-none font-extrabold ${isActive ? 'text-white' : 'text-zinc-550'}`}>
                        {shelf.label}
                      </span>
                      {/* Tooltip popping */}
                      <span className="absolute right-12 scale-0 group-hover:scale-100 bg-zinc-950 text-white text-[8.5px] font-mono uppercase truncate font-bold px-2 py-1 rounded shadow-md z-40 transition-transform origin-right w-28 text-center pointer-events-none">
                        {shelf.label} Control
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>

          </div>
        ) : (
          /* =======================================================
             STEP 2: THE BULK LEDGER DATA SPREADSHEET (SIDE-BY-SIDE WORKING MODE)
             ======================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in text-left">
            
            {/* FLOATING COMPACT TARGET TRACKER PREVIEW (3 Grid Columns - Left Sticky Side) */}
            <div className="lg:col-span-3 lg:sticky lg:top-20 flex flex-col gap-3">
              <div className="bg-white border-2 border-zinc-900 rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
                  <h4 className="text-[10px] font-mono font-black uppercase text-zinc-900 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-zinc-800" />
                    Live Trace Tracker
                  </h4>
                  <span className="text-[8px] font-mono uppercase bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded leading-none border border-emerald-200">
                    Active
                  </span>
                </div>

                <p className="text-[9.5px] font-sans text-zinc-500 leading-normal font-medium">
                  Currently selected ledger profile. Changes on the spreadsheet update layout parameters in real-time.
                </p>

                {/* Live Card Facet Scale Down */}
                <div className="flex justify-center items-center py-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                  {activeStudent ? (
                    <IDCard
                      student={activeStudent}
                      config={config}
                      setConfig={setConfig}
                      scale={isMobile ? 0.72 : 0.61}
                      isPrinting={false}
                      forcedSide="front"
                      designerMode={false}
                      onUpdateStudent={handleUpdateStudent}
                    />
                  ) : (
                    <span className="text-2xs font-mono text-zinc-400">Empty profile selected.</span>
                  )}
                </div>

                {activeStudent && (
                  <div className="bg-zinc-50 p-2.5 rounded border text-[9px] font-mono leading-none flex flex-col gap-1 text-zinc-700">
                    <div>✏️ Tracing ID Name: <strong className="text-zinc-950 font-black">{activeStudent.name || 'N/A'}</strong></div>
                    <div className="mt-0.5">📟 Roll No: <span className="font-bold">{activeStudent.rollNo || 'N/A'}</span> | Class: {activeStudent.class || 'N/A'}</div>
                  </div>
                )}
              </div>

              {/* Move steps actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('designer')}
                  className="flex-1 py-2 px-3 bg-zinc-200 hover:bg-zinc-250 border border-zinc-300 font-mono font-black text-xs uppercase rounded-lg cursor-pointer transition select-none active:translate-y-[1px]"
                >
                  ← edit layout
                </button>
                <button
                  onClick={() => setActiveTab('designer')}
                  className="p-2 bg-white hover:bg-zinc-50 border-2 border-zinc-900 rounded-lg cursor-pointer"
                  title="Return to customizer designer lobby"
                >
                  <Settings className="w-4 h-4 text-zinc-800" />
                </button>
              </div>
            </div>

            {/* SPREADSHEET TABLE GRID (9 Grid Columns - Right Side) */}
            <div className="lg:col-span-9 flex flex-col gap-4">
              <div className="bg-white border-2 border-zinc-900 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-1 gap-2">
                  <div className="text-left">
                    <span className="text-[9px] font-mono tracking-widest text-zinc-400 block uppercase font-bold leading-none">Database ingestion Step</span>
                    <h3 className="text-xs font-mono font-black uppercase text-zinc-900 tracking-wide mt-1">
                      📄 Spreadsheet Registry & Student Database Ingest
                    </h3>
                  </div>
                  <span className="text-[10px] bg-sky-100 text-sky-850 px-2 py-0.5 rounded font-mono font-black uppercase border border-sky-305">
                    Excel parser active
                  </span>
                </div>

                {/* Mount standard spreadsheet editable DataGrid */}
                <DataGrid
                  students={students}
                  setStudents={setStudents}
                  columnMap={columnMap}
                  setColumnMap={setColumnMap}
                  onProceedToBranding={() => setActiveTab('designer')}
                  onProceedToPrint={() => setActiveTab('printer')}
                  customFieldKeys={customFieldKeys}
                  setCustomFieldKeys={setCustomFieldKeys}
                />
              </div>
            </div>

          </div>
        )}
      </main>

      {/* FOOTER ACCENTS */}
      <footer className="border-t-2 border-zinc-900 bg-white py-5 mt-12 text-zinc-800 pb-20 lg:pb-6 select-text">
        <div className="max-w-7xl mx-auto px-6 text-center text-[10px] font-mono text-zinc-500">
          <p>© 2026 Doboka Senior Secondary School. Bulk identity generation workspace with live responsive tracking feed.</p>
        </div>
      </footer>

      {/* MOBILE FRIENDLY ACCENT STEPS BOTTOM NAVIGATION BAR */}
      <nav 
        className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-2 border-zinc-900 px-4 py-2 flex items-center justify-around z-40 lg:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe"
      >
        {[
          { id: 'designer', label: 'Designer Lobby', icon: Settings },
          { id: 'spreadsheet', label: 'Upload Excel', icon: FileSpreadsheet },
        ].map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className="flex flex-col items-center justify-center flex-1 py-1 relative active:scale-95 transition-transform cursor-pointer"
            >
              <div 
                className={`px-6 py-1.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isActive ? 'text-white shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-650'
                }`}
                style={isActive ? { backgroundColor: config.themeColor } : {}}
              >
                <Icon className="w-5.5 h-5.5" />
              </div>
              <span className={`text-[10px] font-mono font-black uppercase mt-1 tracking-tight transition-colors ${isActive ? 'text-zinc-900 font-bold' : 'text-zinc-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setActiveTab('printer')}
          className="flex flex-col items-center justify-center flex-1 py-1 border-l border-zinc-200 active:scale-95 transition-transform cursor-pointer"
        >
          <div className="px-5 py-1.5 rounded-full text-zinc-400 hover:text-zinc-900">
            <Printer className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] font-mono font-black uppercase mt-1 tracking-tight text-zinc-400">
            Compile PDF
          </span>
        </button>
      </nav>

    </div>
  );
}
