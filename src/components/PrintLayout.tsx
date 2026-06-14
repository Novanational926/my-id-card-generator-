/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Printer, RefreshCw, Layers, ArrowLeft, Info, Grid, FileDown, Scissors, Crop, Scale, LayoutGrid, CheckCircle2, Trash2, Maximize2 } from 'lucide-react';
import { IDCard } from './IDCard';
import { Student, CardConfig } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

// Helper to remove modern CSS "oklch" colors from cloned document styles before html2canvas parses them
const handleCloneCleanOklch = (clonedDoc: Document) => {
  // 1. Process all existing style Tags in the cloned head
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent) {
      styleTag.textContent = styleTag.textContent.replace(/oklch\([^)]+\)/g, 'rgb(75, 85, 99)');
    }
  });

  // 2. Safely read browser-compiled styleRules from the original window document and inline them with oklch replaced
  let combinedCss = '';
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i];
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (let j = 0; j < rules.length; j++) {
            combinedCss += rules[j].cssText + '\n';
          }
        }
      } catch (e) {
        // Safe to ignore cross-origin stylesheet warnings
      }
    }
  } catch (err) {
    console.warn("Could not read stylesheet rules synchronously:", err);
  }

  if (combinedCss) {
    const processedCss = combinedCss.replace(/oklch\([^)]+\)/g, 'rgb(75, 85, 99)');
    const styleEl = clonedDoc.createElement('style');
    styleEl.textContent = processedCss;
    clonedDoc.head.appendChild(styleEl);

    // Remove original link tags in clonedDoc to prevent html2canvas from fetching and parsing them from network
    const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(l => l.remove());
  }
};

interface PrintLayoutProps {
  students: Student[];
  config: CardConfig;
  onBack: () => void;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ students, config, onBack }) => {
  // Print Mode & Sheet configuration states
  const [layoutMode, setLayoutMode] = useState<'coupled' | 'separated'>('coupled');
  const [printScale, setPrintScale] = useState<number>(0.60);
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [cardGap, setCardGap] = useState<number>(14); // gap in px
  const [pageSizeUnit, setPageSizeUnit] = useState<'A4' | 'Letter'>('A4');
  const [showSheetBorders, setShowSheetBorders] = useState<boolean>(true);
  const [badgeSize, setBadgeSize] = useState<'standard' | 'compact'>('standard');

  // Dynamic state for manually ordering and pruning elements
  const [localStudents, setLocalStudents] = useState<Student[]>(() => students);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Custom states for styling selected cards
  const [cardStyles, setCardStyles] = useState<Record<string, {
    grayscale?: boolean;
    squareCorners?: boolean;
    cardBorderColor?: string;
    borderStyle?: 'solid' | 'dashed' | 'double' | 'none';
  }>>({});

  // Synchronize local student list with the parent sheet when parent updates
  const studentsKey = students.map(s => s.id).join(',');
  React.useEffect(() => {
    setLocalStudents(students);
  }, [studentsKey]);

  // Drag and drop mechanical states
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const updated = [...localStudents];
    const [removed] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, removed);
    setLocalStudents(updated);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // PDF Compilation States
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');
  const [pdfProgressPct, setPdfProgressPct] = useState<number>(0);

  const startPrint = () => {
    window.print();
  };

  // Convert and compile each page container into high-resolution JPG images, packing them sequentially into an offline PDF
  const downloadHighResPDF = async () => {
    const originalBorders = showSheetBorders;
    try {
      setIsGeneratingPdf(true);
      setPdfProgressPct(5);
      setPdfProgress("Hiding preview outlines and preparing vector-aligned PDF page content...");

      // Temporarily hide sheet page helper borders for a vector-clean capture
      setShowSheetBorders(false);
      
      // Allow React state updates to flush to DOM
      await new Promise((resolve) => setTimeout(resolve, 150));

      const pages = document.querySelectorAll('.print-sheet-page');
      if (pages.length === 0) {
        alert("Unable to detect printable sheets. Please ensure database profiles are loaded.");
        setIsGeneratingPdf(false);
        setShowSheetBorders(originalBorders);
        return;
      }

      // PDF Page settings: A4 is 210mm x 297mm; Letter is 215.9mm x 279.4mm
      const format = pageSizeUnit === 'A4' ? 'a4' : 'letter';
      const pdfWidth = pageSizeUnit === 'A4' ? 210 : 215.9;
      const pdfHeight = pageSizeUnit === 'A4' ? 297 : 279.4;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: format,
        compress: true,
      });

      for (let i = 0; i < pages.length; i++) {
        const stepPct = Math.round(5 + (i / pages.length) * 85);
        setPdfProgressPct(stepPct);
        setPdfProgress(`Rendering paper page ${i + 1} of ${pages.length} to high-resolution matrix...`);

        const pageEl = pages[i] as HTMLElement;

        // Force maximum graphics fidelity on generation buffers (scale: 3 for premium 300DPI physical output)
        const canvas = await html2canvas(pageEl, {
          scale: 3, 
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: pageEl.scrollWidth,
          windowHeight: pageEl.scrollHeight,
          ignoreElements: (element) => element.classList.contains('no-print'),
          onclone: handleCloneCleanOklch,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage(format, 'portrait');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      setPdfProgressPct(95);
      setPdfProgress("Packing assets and certifying final document stream...");
      
      const fileName = `doboka_id_cards_batch_${Date.now()}.pdf`;
      pdf.save(fileName);

      setPdfProgressPct(100);
      setPdfProgress("Download successful! Batch generated properly.");
      
      setTimeout(() => {
        setIsGeneratingPdf(false);
        setPdfProgress("");
        setPdfProgressPct(0);
      }, 1500);

    } catch (err: any) {
      console.error("PDF engine compiler error:", err);
      alert(`Export failed: ${err?.message || 'Check asset urls or CORS constraints.'}`);
      setIsGeneratingPdf(false);
      setPdfProgress("");
      setPdfProgressPct(0);
    } finally {
      // Always restore original borders view configuration
      setShowSheetBorders(originalBorders);
    }
  };

  // Export all ID cards as individual high-resolution PNG image files packaged in a ZIP archive.
  const downloadHighResImages = async () => {
    const originalBorders = showSheetBorders;
    try {
      setIsGeneratingPdf(true); // Share same high DPI rendering overlay
      setPdfProgressPct(5);
      setPdfProgress("Initiating high-resolution image rendering pipeline...");
      
      // Hide outline borders for graphics fidelity
      setShowSheetBorders(false);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const zip = new JSZip();
      const folder = zip.folder("high_res_id_cards");
      
      let successCount = 0;
      const total = localStudents.length;

      for (let i = 0; i < total; i++) {
        const student = localStudents[i];
        const stepPct = Math.round(5 + (i / total) * 85);
        setPdfProgressPct(stepPct);
        setPdfProgress(`Rendering ${student.name} [ID No: ${student.rollNo || student.id}] (${i + 1}/${total})...`);

        // Render front side
        const frontEl = document.getElementById(`card-front-${student.id}`);
        if (frontEl) {
          const canvasFront = await html2canvas(frontEl, {
            scale: 3, // 300 DPI high resolution
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            onclone: handleCloneCleanOklch,
          });
          
          const dataUrlFront = canvasFront.toDataURL('image/png');
          const base64DataFront = dataUrlFront.replace(/^data:image\/png;base64,/, "");
          const fileSafeName = student.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
          const pKey = student.rollNo || student.id;
          folder?.file(`${fileSafeName}_${pKey}_front.png`, base64DataFront, { base64: true });
          successCount++;
        }

        // Render back side
        const backEl = document.getElementById(`card-back-${student.id}`);
        if (backEl) {
          const canvasBack = await html2canvas(backEl, {
            scale: 3, // 300 DPI high resolution
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            onclone: handleCloneCleanOklch,
          });
          
          const dataUrlBack = canvasBack.toDataURL('image/png');
          const base64DataBack = dataUrlBack.replace(/^data:image\/png;base64,/, "");
          const fileSafeName = student.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
          const pKey = student.rollNo || student.id;
          folder?.file(`${fileSafeName}_${pKey}_back.png`, base64DataBack, { base64: true });
          successCount++;
        }
      }

      if (successCount === 0) {
        alert("No printable ID card instances found in the current sheet layout.");
        setIsGeneratingPdf(false);
        setShowSheetBorders(originalBorders);
        return;
      }

      setPdfProgressPct(92);
      setPdfProgress("Assembling PNG files into a single, high-fidelity ZIP archive...");
      await new Promise(resolve => setTimeout(resolve, 100));

      const content = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `id_cards_png_pack_${Date.now()}.zip`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = zipFileName;
      link.click();

      setPdfProgressPct(100);
      setPdfProgress(`ZIP generated! Downloaded ${successCount} high-res card faces successfully.`);
      
      setTimeout(() => {
        setIsGeneratingPdf(false);
        setPdfProgress("");
        setPdfProgressPct(0);
      }, 1800);

    } catch (err: any) {
      console.error("ZIP packaging error:", err);
      alert(`Export failed: ${err?.message || 'Check asset memory constraints.'}`);
      setIsGeneratingPdf(false);
      setPdfProgress("");
      setPdfProgressPct(0);
    } finally {
      setShowSheetBorders(originalBorders);
    }
  };

  // Split students into pages based on mode: 3 students (3 pairs = 6 cards) for Coupled, 6 students for Separated
  const CARDS_PER_PAGE = layoutMode === 'coupled' ? 3 : 6;
  const chunkStudents = (arr: Student[], size: number) => {
    const chunks: Student[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const studentPages = chunkStudents(localStudents, CARDS_PER_PAGE);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 sm:p-6 text-zinc-900" id="print-arena-container">
      
      {/* PDF BUILD ENGINE PROGRESS DISPLAY OVERLAY */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-white border-4 border-zinc-900 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] select-text animate-scale-up text-left">
            <div className="flex items-center gap-3 mb-4 border-b border-zinc-200 pb-3">
              <div className="w-10 h-10 bg-[#D32F2F] rounded-lg text-white flex items-center justify-center font-bold text-center shrink-0">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-display font-black uppercase text-zinc-900 leading-none">
                  AI PDF Vector Export Engine
                </h4>
                <p className="text-[10px] font-mono uppercase text-[#D32F2F] font-bold mt-1 tracking-wider leading-none">
                  Rendering at 300 DPI High-Resolution
                </p>
              </div>
            </div>

            <p className="text-xs font-sans text-zinc-700 leading-relaxed mb-4">
              {pdfProgress}
            </p>

            <div className="w-full bg-zinc-100 rounded-full h-3 border-2 border-zinc-900 overflow-hidden relative mb-2">
              <div 
                className="bg-[#D32F2F] h-full transition-all duration-300"
                style={{ width: `${pdfProgressPct}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-zinc-400 uppercase font-black">
              <span>PROGRESS</span>
              <span>{pdfProgressPct}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ARENA HEADER & CONTROLS CONTROL-TOWER */}
      <div className="max-w-6xl mx-auto mb-6 grid grid-cols-1 lg:grid-cols-5 gap-6 no-print">
        
        {/* LEFT COLUMN: Print parameters & scale adjustments (3/5 cols) */}
        <div className="lg:col-span-3 bg-white border-2 border-zinc-900 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] text-left flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
              <div>
                <button
                  onClick={onBack}
                  className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-500 hover:text-zinc-900 transition uppercase mb-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Ledger Dashboard
                </button>
                <h2 className="text-xl font-display font-black tracking-wide text-zinc-900 uppercase flex items-center gap-2 leading-none">
                  <Printer className="w-5 h-5 text-zinc-900" />
                  Batch Production & Print Suite
                </h2>
                <p className="text-[11px] text-zinc-500 font-sans mt-1">
                  Configure boundaries and scaling, or drag cards below to optimize paper layout manually.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Standard Trigger browser printing */}
                <button
                  onClick={startPrint}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-mono font-black text-xs rounded-lg border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] uppercase transition cursor-pointer active:translate-y-[1px]"
                  title="Launch browser printing properties"
                >
                  <Printer className="w-4 h-4" />
                  System Print
                </button>

                {/* High DPI Direct PDF Export */}
                <button
                  onClick={downloadHighResPDF}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-[#D32F2F] hover:bg-[#b02222] text-white font-mono font-black text-xs rounded-lg border-2 border-[#D32F2F] shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] uppercase transition cursor-pointer hover:scale-[1.01]"
                  title="Export a high fidelity PDF file instantly"
                >
                  <FileDown className="w-4 h-4" />
                  Download PDF
                </button>

                {/* High DPI Zip-Pack PNG Export */}
                <button
                  onClick={downloadHighResImages}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-mono font-black text-xs rounded-lg border-2 border-amber-600 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] uppercase transition cursor-pointer hover:scale-[1.01]"
                  title="Export all cards as individual high-resolution PNG images"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-once" />
                  Download Images (ZIP)
                </button>
              </div>
            </div>

            {/* DETAILED PRINT-READY CUSTOMISATION SECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-left select-none">
              
              {/* Card Dimensions & Aspect scale */}
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <span className="text-[10px] uppercase font-black text-zinc-400 font-mono tracking-wider block mb-1.5 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-zinc-500" />
                  A4 Rendering Scale
                </span>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <input
                    type="range"
                    min="0.45"
                    max="1.10"
                    step="0.01"
                    value={printScale}
                    onChange={(e) => setPrintScale(parseFloat(e.target.value))}
                    className="accent-zinc-900 flex-1 h-1 bg-zinc-200 rounded appearance-none cursor-pointer"
                  />
                  <span className="bg-zinc-900 text-white px-1.5 py-0.5 rounded text-[9.5px] font-black shrink-0">
                    {Math.round(printScale * 100)}%
                  </span>
                </div>
                <div className="flex justify-between mt-1 text-[9px] text-zinc-400 font-bold uppercase">
                  <span>Compact</span>
                  <button 
                    onClick={() => setPrintScale(badgeSize === 'compact' ? 0.73 : 0.60)} 
                    className="text-zinc-650 hover:text-zinc-900 underline font-black bg-transparent border-none p-0 cursor-pointer"
                  >
                    Reset ({badgeSize === 'compact' ? '73%' : '60%'})
                  </button>
                  <span>PVC 100%</span>
                </div>
              </div>
 
              {/* Grid gaps customizer */}
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <span className="text-[10px] uppercase font-black text-zinc-400 font-mono tracking-wider block mb-1.5 flex items-center gap-1">
                  <LayoutGrid className="w-3.5 h-3.5 text-zinc-500" />
                  Card Spacing Gap
                </span>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="2"
                    value={cardGap}
                    onChange={(e) => setCardGap(parseInt(e.target.value))}
                    className="accent-zinc-900 flex-1 h-1 bg-zinc-200 rounded appearance-none cursor-pointer"
                  />
                  <span className="bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded text-[9.5px] font-black shrink-0 border border-zinc-300">
                    {cardGap}px
                  </span>
                </div>
                <div className="flex justify-between mt-1 text-[9px] text-zinc-400 font-mono uppercase font-bold">
                  <span>Overlay (0)</span>
                  <span>Loose (40)</span>
                </div>
              </div>
 
              {/* Layout presentation mode selection */}
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-left">
                <span className="text-[10px] uppercase font-black text-zinc-400 font-mono tracking-wider block mb-1.5 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-zinc-500" />
                  Sheet Format
                </span>
                <div className="flex p-0.5 bg-zinc-200 border border-zinc-300 rounded-md gap-0.5">
                  <button
                    onClick={() => setLayoutMode('coupled')}
                    className={`flex-1 text-center py-1 rounded text-[9.5px] font-mono transition font-black uppercase cursor-pointer ${
                      layoutMode === 'coupled' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    Foldable
                  </button>
                  <button
                    onClick={() => setLayoutMode('separated')}
                    className={`flex-1 text-center py-1 rounded text-[9.5px] font-mono transition font-black uppercase cursor-pointer ${
                      layoutMode === 'separated' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    Dual Sheet
                  </button>
                </div>
              </div>
 
              {/* Card Dimensions Standard vs Compact Size Toggle */}
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-left">
                <span className="text-[10px] uppercase font-black text-zinc-400 font-mono tracking-wider block mb-1.5 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
                  ID Card Size
                </span>
                <div className="flex p-0.5 bg-zinc-200 border border-zinc-300 rounded-md gap-0.5">
                  <button
                    onClick={() => {
                      setBadgeSize('standard');
                      setPrintScale(0.60); // 53.98mm physical standard width
                    }}
                    className={`flex-1 text-center py-1 rounded text-[9.5px] font-mono transition font-black uppercase cursor-pointer ${
                      badgeSize === 'standard' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => {
                      setBadgeSize('compact');
                      setPrintScale(0.73); // 53.98mm physical standard width
                    }}
                    className={`flex-1 text-center py-1 rounded text-[9.5px] font-mono transition font-black uppercase cursor-pointer ${
                      badgeSize === 'compact' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    Compact Badge
                  </button>
                </div>
              </div>
 
              {/* Guidelines toggles */}
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-black text-zinc-400 font-mono tracking-wider block mb-1 flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-zinc-500" />
                  Borders & Crop Bounds
                </span>
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCropMarks}
                      onChange={(e) => setShowCropMarks(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer text-xs"
                    />
                    <span className="text-[9px] font-mono font-bold text-zinc-700 uppercase">Cuts</span>
                  </label>
 
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSheetBorders}
                      onChange={(e) => setShowSheetBorders(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer text-xs"
                    />
                    <span className="text-[9px] font-mono font-bold text-zinc-700 uppercase">Page Outlines</span>
                  </label>
 
                  <div className="flex items-center gap-1 bg-zinc-200 p-0.5 rounded text-[8.5px] font-mono font-black">
                    <button 
                      onClick={() => setPageSizeUnit('A4')} 
                      className={`px-1 rounded uppercase ${pageSizeUnit === 'A4' ? 'bg-zinc-900 text-white' : 'text-zinc-650'}`}
                    >
                      A4
                    </button>
                    <button 
                      onClick={() => setPageSizeUnit('Letter')} 
                      className={`px-1 rounded uppercase ${pageSizeUnit === 'Letter' ? 'bg-zinc-900 text-white' : 'text-zinc-650'}`}
                    >
                      Letter
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Physical Calibration Card */}
              {(() => {
                const currentCardWidthPx = (badgeSize === 'compact' ? 280 : 340) * printScale;
                const currentCardHeightPx = (badgeSize === 'compact' ? 440 : 540) * printScale;
                
                // 96 DPI conversion (3.77953 pixels per millimeter)
                const currentWidthMm = (currentCardWidthPx / 3.77953).toFixed(1);
                const currentHeightMm = (currentCardHeightPx / 3.77953).toFixed(1);

                // Check if current scale aligns with natural actual size
                const isExactStandardCR80 = Math.abs(currentCardWidthPx - 204.0) < 2.0;

                return (
                  <div className="sm:col-span-2 bg-[#1A1A1A] text-zinc-200 p-3.5 rounded-xl border-2 border-zinc-900 text-left mt-1 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-850">
                      <span className="text-[10px] font-mono uppercase font-black tracking-wider text-rose-500 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        📏 Physical Printing Size Calibration
                      </span>
                      {isExactStandardCR80 ? (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[8.5px] font-mono px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          CR80 STANDARD
                        </span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-500 text-[8.5px] font-mono px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          Scaled Fit
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                        <span className="text-[8.5px] font-mono font-medium text-zinc-500 block uppercase tracking-wider">Estimated Width:</span>
                        <span className="text-sm font-mono font-black text-white">{currentWidthMm} <span className="text-[9px] text-zinc-400 uppercase font-bold">mm</span></span>
                        <span className="text-[8px] font-sans text-zinc-500 block leading-none mt-0.5">CR80 target: 54.0 mm</span>
                      </div>
                      <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                        <span className="text-[8.5px] font-mono font-medium text-zinc-500 block uppercase tracking-wider">Estimated Height:</span>
                        <span className="text-sm font-mono font-black text-white">{currentHeightMm} <span className="text-[9px] text-zinc-400 uppercase font-bold">mm</span></span>
                        <span className="text-[8px] font-sans text-zinc-500 block leading-none mt-0.5">CR80 target: 85.6 mm</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 bg-zinc-900/30 p-2 rounded-lg border border-zinc-850/60">
                      <p className="text-[9.5px] font-sans text-zinc-400 leading-normal max-w-[280px]">
                        By default, scale is locked at <strong className="text-white font-mono">{badgeSize === 'compact' ? '73%' : '60%'}</strong> which prints exactly matching standard ID PVC dimensions on A4 paper.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (badgeSize === 'standard') {
                            setPrintScale(0.60);
                          } else {
                            setPrintScale(0.73);
                          }
                        }}
                        disabled={isExactStandardCR80}
                        className={`py-1.5 px-3 rounded-lg font-mono font-black text-[9px] uppercase transition text-center border-2 shrink-0 select-none ${
                          isExactStandardCR80 
                            ? 'opacity-35 cursor-not-allowed bg-zinc-850 text-zinc-500 border-zinc-800'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-white border-2 border-zinc-700 hover:border-zinc-650 cursor-pointer active:translate-y-[1px]'
                        }`}
                      >
                        Lock CR80 Size
                      </button>
                    </div>
                  </div>
                );
              })()}
 
            </div>
          </div>

          <div className="border-t border-zinc-200 mt-4 pt-3 flex items-center justify-between h-8">
            <span className="text-[9.5px] font-mono text-zinc-450 uppercase font-bold tracking-tight">
              DRAG & DROP CARDS DIRECTLY TO REORDER • CLICK ANY CARD TO FOCUS
            </span>
            {localStudents.length !== students.length && (
              <button
                onClick={() => {
                  setLocalStudents(students);
                  setSelectedStudentId(null);
                }}
                className="text-[10px] font-mono font-extrabold text-[#D32F2F] hover:underline cursor-pointer uppercase shrink-0"
              >
                Restore {students.length - localStudents.length} Removed Card(s)
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Component Studio Console (2/5 cols) */}
        <div className="lg:col-span-2 bg-zinc-950 border-2 border-zinc-900 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] text-white flex flex-col justify-between">
          {!selectedStudentId ? (
            <div className="h-full flex flex-col items-center justify-center py-6 text-center select-none">
              <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center mb-2.5">
                <Layers className="w-5 h-5 text-zinc-400" />
              </div>
              <h4 className="text-xs font-mono font-black uppercase text-zinc-300">
                Studio Component Focus
              </h4>
              <p className="text-[10px] text-zinc-550 font-sans mt-1 max-w-[210px] leading-relaxed">
                Click any individual student card in the rendered sheets below to adjust colors, corner cuts, or delete it from the print run.
              </p>
            </div>
          ) : (() => {
            const focusedStudent = localStudents.find(s => s.id === selectedStudentId);
            if (!focusedStudent) {
              setSelectedStudentId(null);
              return null;
            }
            const activeStyle = cardStyles[selectedStudentId] || {};

            const updateActiveStyle = (updates: Partial<typeof activeStyle>) => {
              setCardStyles(prev => ({
                ...prev,
                [selectedStudentId]: {
                  ...prev[selectedStudentId],
                  ...updates
                }
              }));
            };

            return (
              <div className="h-full flex flex-col justify-between text-left select-none">
                {/* Header detail */}
                <div className="border-b border-zinc-800 pb-2 mb-2">
                  <span className="text-[8.5px] font-mono text-rose-500 font-extrabold tracking-widest uppercase block leading-none">
                    CARD CUSTOMIZER STUDIO
                  </span>
                  <h4 className="text-sm font-display font-black text-white uppercase truncate mt-1 leading-tight">
                    {focusedStudent.name}
                  </h4>
                  <span className="text-[9px] font-mono text-zinc-500 block truncate uppercase mt-0.5">
                    CLASS ID / ROLL: {focusedStudent.classRoll || focusedStudent.id}
                  </span>
                </div>

                {/* Customizers list */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {/* Grayscale switch */}
                  <button
                    onClick={() => updateActiveStyle({ grayscale: !activeStyle.grayscale })}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition duration-150 cursor-pointer ${
                      activeStyle.grayscale 
                        ? 'bg-zinc-900 text-yellow-400 border-yellow-400/30' 
                        : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 animate-pulse" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[9px] font-mono font-bold uppercase">Ink-Saver</span>
                      <span className="text-[8px] text-zinc-500 uppercase">{activeStyle.grayscale ? 'Grayscale' : 'Full Color'}</span>
                    </div>
                  </button>

                  {/* Corners sharp switch */}
                  <button
                    onClick={() => updateActiveStyle({ squareCorners: !activeStyle.squareCorners })}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition duration-150 cursor-pointer ${
                      activeStyle.squareCorners 
                        ? 'bg-zinc-900 text-cyan-400 border-cyan-400/30' 
                        : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-2 h-2 rounded bg-cyan-400 shrink-0" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[9px] font-mono font-bold uppercase">Corners</span>
                      <span className="text-[8px] text-zinc-500 uppercase">{activeStyle.squareCorners ? 'Sharp Die-cut' : 'Standard Round'}</span>
                    </div>
                  </button>

                  {/* Border style */}
                  <div className="col-span-2 bg-zinc-900/40 border border-zinc-850 p-1.5 rounded-lg flex flex-col gap-1">
                    <span className="text-[8px] font-mono uppercase font-semibold text-zinc-500">
                      Card Outer Frame Custom Rule
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      {(['none', 'solid', 'dashed', 'double'] as const).map((bStyle) => (
                        <button
                          key={bStyle}
                          onClick={() => updateActiveStyle({ borderStyle: bStyle })}
                          className={`py-0.5 rounded font-mono text-[8.5px] uppercase font-bold transition text-center border cursor-pointer ${
                            (activeStyle.borderStyle || 'none') === bStyle 
                              ? 'bg-[#D32F2F] text-white border-[#D32F2F]' 
                              : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
                          }`}
                        >
                          {bStyle}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Border color selector (if border is active) */}
                  {activeStyle.borderStyle && activeStyle.borderStyle !== 'none' && (
                    <div className="col-span-2 flex items-center justify-between bg-zinc-900/30 p-1.5 rounded border border-zinc-850">
                      <span className="text-[8px] font-mono uppercase text-zinc-550">Frame Tint:</span>
                      <div className="flex gap-1.5">
                        {['#18191b', '#D32F2F', '#1E3A8A', '#15803D', '#EA580C', '#EAB308'].map((color) => (
                          <button
                            key={color}
                            onClick={() => updateActiveStyle({ cardBorderColor: color })}
                            className={`w-3.5 h-3.5 rounded-full border cursor-pointer transition transform hover:scale-110 ${
                              (activeStyle.cardBorderColor || '#18191b') === color ? 'ring-2 ring-white scale-110' : 'border-zinc-800'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Deletion & Clear selection actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setLocalStudents(prev => prev.filter(s => s.id !== selectedStudentId));
                      setSelectedStudentId(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-mono font-black text-[10px] rounded border border-rose-800 shadow transition cursor-pointer uppercase active:translate-y-[0.5px]"
                    title="Remove selected card from printing flow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Card
                  </button>

                  <button
                    onClick={() => setSelectedStudentId(null)}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-bold text-[10px] rounded border border-zinc-700 cursor-pointer uppercase active:translate-y-[0.5px]"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

      </div>

      {/* DETAILED ADVICE BANNER */}
      <div className="max-w-4xl mx-auto mb-6 bg-zinc-100 border-2 border-zinc-900 p-4 rounded-xl text-xs flex gap-3 items-start no-print select-none text-zinc-700 text-left">
        <Info className="w-5 h-5 text-zinc-900 shrink-0 mt-0.5" />
        <div className="font-sans leading-relaxed">
          <span className="font-extrabold text-zinc-900 block uppercase tracking-wider mb-0.5">High-Resolution Production Presets:</span>
          <p className="text-zinc-600 mb-1.5">
            If printing physically, configure your browser settings. Set margins to <strong className="text-zinc-900 font-mono">None</strong> & enable <strong className="text-zinc-900">Background Graphics</strong>, or use our digital generator above to save an offline PDF containing identical dimensions and scaling bounds.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#D32F2F] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#D32F2F] animate-pulse shrink-0" />
            STAGING STATUS: {localStudents.length} OF {students.length} STUDENT CARDS PRINT-READY
          </div>
        </div>
      </div>

      {/* RENDER SHEETS */}
      <div className="w-full flex flex-col items-center gap-8 py-2">
        {localStudents.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-sans select-none no-print">
            No profiles staged. Proceed to back to paste your students sheet.
          </div>
        ) : layoutMode === 'coupled' ? (
          /* -------------------- COUPLED FORMATTED CARDS -------------------- */
          studentPages.map((pageStudents, pageIdx) => (
            <div
              key={`coupled-sheet-${pageIdx}`}
              className="print-sheet-page bg-white print:shadow-none shadow-2xl relative flex flex-col items-center py-4 print-page-break select-none shrink-0"
              style={{
                width: pageSizeUnit === 'A4' ? '210mm' : '215.9mm',
                height: pageSizeUnit === 'A4' ? '297mm' : '279.4mm',
                maxWidth: pageSizeUnit === 'A4' ? '210mm' : '215.9mm',
                maxHeight: pageSizeUnit === 'A4' ? '297mm' : '279.4mm',
                boxSizing: 'border-box',
                padding: pageSizeUnit === 'A4' ? '12mm 5mm' : '10mm 5mm',
                color: '#000000',
                border: showSheetBorders ? '2px border-zinc-900' : 'none',
                marginBottom: '10px'
              }}
            >
              {/* Internal virtual page headers */}
              <div className="w-full text-center text-[10px] font-mono text-slate-400 uppercase border-b border-slate-100 pb-1 mb-3 flex justify-between px-10 no-print">
                <span>School ID Generation — Sheet [{pageIdx + 1} of {studentPages.length}]</span>
                <span className="font-bold uppercase text-zinc-700">Foldable Couple Format ({pageSizeUnit})</span>
              </div>

              {/* Grid block with dynamic customizable gap */}
              <div 
                className="grid grid-cols-1 justify-center justify-items-center items-center h-full w-full"
                style={{ gap: `${cardGap}px` }}
              >
                {pageStudents.map((stud) => {
                  const overallIdx = localStudents.findIndex(s => s.id === stud.id);
                  const isSelected = selectedStudentId === stud.id;
                  const isDragOver = dragOverIdx === overallIdx;
                  const studentStyle = cardStyles[stud.id] || {};

                  return (
                    <div
                      key={`stud-col-${stud.id}-${overallIdx}`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, overallIdx)}
                      onDragOver={(e) => handleDragOver(e, overallIdx)}
                      onDrop={(e) => handleDrop(e, overallIdx)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudentId(stud.id);
                      }}
                      className={`
                        group relative p-1 transition-all duration-200 cursor-grab active:cursor-grabbing select-none
                        ${isSelected ? 'ring-4 ring-rose-500 ring-offset-4 rounded-3xl shadow-xl scale-[1.02] bg-rose-50/20 z-10' : 'hover:scale-[1.01] hover:rounded-3xl hover:bg-zinc-50/50'}
                        ${isDragOver ? 'ring-4 ring-dashed ring-zinc-800 scale-[1.03] bg-zinc-100 rounded-3xl' : ''}
                        ${draggedIdx === overallIdx ? 'opacity-40 scale-95' : ''}
                      `}
                    >
                      {/* Drag handles & index indicators overlays (hidden in print) */}
                      <div className="absolute -top-3 left-4 bg-zinc-900 border border-zinc-700 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-md z-40 flex items-center gap-1.5 no-print uppercase font-bold select-none pointer-events-none">
                        <Grid className="w-3.5 h-3.5 text-[#D32F2F]" />
                        <span>#{overallIdx + 1} Card</span>
                      </div>

                      {/* Selection Ribbon */}
                      {isSelected && (
                        <div className="absolute -top-3 right-4 bg-rose-600 border border-rose-800 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-md z-40 flex items-center gap-1.5 no-print uppercase font-bold animate-pulse">
                          <span>Focus</span>
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}

                      {/* Tiny visual scissor crop line cues */}
                      {showCropMarks && (
                        <>
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 border-t border-slate-350 border-solid no-print" />
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 border-t border-slate-350 border-solid no-print" />
                        </>
                      )}
                      
                      {/* Card Render Container with Custom Dynamic Style settings */}
                      <div 
                        style={{
                          filter: studentStyle.grayscale ? 'grayscale(100%)' : 'none',
                          borderRadius: studentStyle.squareCorners ? '0px' : '24px',
                          border: studentStyle.borderStyle && studentStyle.borderStyle !== 'none' 
                            ? `3px ${studentStyle.borderStyle} ${studentStyle.cardBorderColor || '#18191b'}` 
                            : 'none',
                          overflow: 'hidden'
                        }}
                      >
                        <IDCard
                          student={stud}
                          config={config}
                          scale={printScale} // Dynamic user customisation scale
                          isPrinting={true}
                          forcedSide="both"
                          badgeSize={badgeSize}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          /* -------------------- SEPARATED GRID PAGE FORMAT -------------------- */
          studentPages.map((pageStudents, pageIdx) => {
            const mirroredBackStudents: Student[] = [];
            for (let r = 0; r < pageStudents.length; r += 2) {
              const leftNode = pageStudents[r];
              const rightNode = pageStudents[r + 1];
              if (rightNode) mirroredBackStudents.push(rightNode);
              if (leftNode) mirroredBackStudents.push(leftNode);
            }

            return (
              <React.Fragment key={`separated-sheet-${pageIdx}`}>
                
                {/* A. FRONTS SHEET */}
                <div
                  className="print-sheet-page bg-white print:shadow-none shadow-2xl relative flex flex-col items-center py-4 print-page-break shrink-0"
                  style={{
                    width: pageSizeUnit === 'A4' ? '210mm' : '215.9mm',
                    height: pageSizeUnit === 'A4' ? '297mm' : '279.4mm',
                    boxSizing: 'border-box',
                    padding: pageSizeUnit === 'A4' ? '18mm 12mm' : '15mm 10mm',
                    color: '#000000',
                    border: showSheetBorders ? '2px border-zinc-900' : 'none',
                    marginBottom: '10px'
                  }}
                >
                  <div className="w-full text-center text-[10px] font-mono text-slate-400 uppercase border-b border-slate-100 pb-1 mb-4 flex justify-between px-8 no-print">
                    <span>Batch Production [{pageIdx + 1}] — FRONTS</span>
                    <span className="font-bold text-[#D32F2F]">PVC Page A (Front Faces) - {pageSizeUnit}</span>
                  </div>

                  <div 
                    className="grid grid-cols-2 justify-items-center justify-center w-full h-full pt-1"
                    style={{ rowGap: `${cardGap * 1.5}px`, columnGap: `${cardGap}px` }}
                  >
                    {pageStudents.map((stud) => {
                      const overallIdx = localStudents.findIndex(s => s.id === stud.id);
                      const isSelected = selectedStudentId === stud.id;
                      const isDragOver = dragOverIdx === overallIdx;
                      const studentStyle = cardStyles[stud.id] || {};

                      return (
                        <div 
                          key={`front-cell-${stud.id}-${overallIdx}`} 
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, overallIdx)}
                          onDragOver={(e) => handleDragOver(e, overallIdx)}
                          onDrop={(e) => handleDrop(e, overallIdx)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentId(stud.id);
                          }}
                          className={`
                            group relative p-1.5 transition-all duration-200 cursor-grab active:cursor-grabbing select-none
                            ${isSelected ? 'ring-4 ring-rose-500 ring-offset-4 rounded-3xl shadow-xl scale-[1.02] bg-rose-50/20 z-10' : 'hover:scale-[1.01] hover:rounded-3xl hover:bg-zinc-50/50'}
                            ${isDragOver ? 'ring-4 ring-dashed ring-zinc-800 scale-[1.03] bg-zinc-100 rounded-3xl' : ''}
                            ${draggedIdx === overallIdx ? 'opacity-40 scale-95' : ''}
                          `}
                        >
                          {/* Drag handles & index indicators overlays (hidden in print) */}
                          <div className="absolute -top-3 left-4 bg-zinc-900 border border-zinc-700 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-md z-40 flex items-center gap-1.5 no-print uppercase font-bold select-none pointer-events-none">
                            <Grid className="w-3.5 h-3.5 text-[#D32F2F]" />
                            <span>#{overallIdx + 1} Front</span>
                          </div>

                          {/* Selection Ribbon */}
                          {isSelected && (
                            <div className="absolute -top-3 right-4 bg-rose-600 border border-rose-800 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-md z-40 flex items-center gap-1.5 no-print uppercase font-bold animate-pulse">
                              <span>Focus</span>
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}

                          {/* Card Content with individual style rules */}
                          <div 
                            style={{
                              filter: studentStyle.grayscale ? 'grayscale(100%)' : 'none',
                              borderRadius: studentStyle.squareCorners ? '0px' : '24px',
                              border: studentStyle.borderStyle && studentStyle.borderStyle !== 'none' 
                                ? `3px ${studentStyle.borderStyle} ${studentStyle.cardBorderColor || '#18191b'}` 
                                : 'none',
                              overflow: 'hidden'
                            }}
                          >
                            <IDCard
                              student={stud}
                              config={config}
                              scale={printScale} // Dynamic user fit scale
                              isPrinting={true}
                              forcedSide="front"
                              badgeSize={badgeSize}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* B. BACKS SHEET (Mirrored columns horizontally) */}
                <div
                  className="print-sheet-page bg-white print:shadow-none shadow-2xl relative flex flex-col items-center py-4 print-page-break shrink-0"
                  style={{
                    width: pageSizeUnit === 'A4' ? '210mm' : '215.9mm',
                    height: pageSizeUnit === 'A4' ? '297mm' : '279.4mm',
                    boxSizing: 'border-box',
                    padding: pageSizeUnit === 'A4' ? '18mm 12mm' : '15mm 10mm',
                    color: '#000000',
                    border: showSheetBorders ? '2px border-zinc-900' : 'none',
                    marginBottom: '10px'
                  }}
                >
                  <div className="w-full text-center text-[10px] font-mono text-slate-400 uppercase border-b border-slate-100 pb-1 mb-4 flex justify-between px-8 no-print">
                    <span>Batch Production [{pageIdx + 1}] — REVERSES [Horizontally Mirrored]</span>
                    <span className="font-bold text-indigo-650">PVC Page B (Back Faces) - {pageSizeUnit}</span>
                  </div>

                  <div 
                    className="grid grid-cols-2 justify-items-center justify-center w-full h-full pt-1"
                    style={{ rowGap: `${cardGap * 1.5}px`, columnGap: `${cardGap}px` }}
                  >
                    {mirroredBackStudents.map((stud) => {
                      const overallIdx = localStudents.findIndex(s => s.id === stud.id);
                      const isSelected = selectedStudentId === stud.id;
                      const isDragOver = dragOverIdx === overallIdx;
                      const studentStyle = cardStyles[stud.id] || {};

                      return (
                        <div 
                          key={`back-cell-${stud.id}-${overallIdx}`} 
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, overallIdx)}
                          onDragOver={(e) => handleDragOver(e, overallIdx)}
                          onDrop={(e) => handleDrop(e, overallIdx)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentId(stud.id);
                          }}
                          className={`
                            group relative p-1.5 transition-all duration-200 cursor-grab active:cursor-grabbing select-none
                            ${isSelected ? 'ring-4 ring-rose-500 ring-offset-4 rounded-3xl shadow-xl scale-[1.02] bg-rose-50/20 z-10' : 'hover:scale-[1.01] hover:rounded-3xl hover:bg-zinc-50/50'}
                            ${isDragOver ? 'ring-4 ring-dashed ring-zinc-800 scale-[1.03] bg-zinc-100 rounded-3xl' : ''}
                            ${draggedIdx === overallIdx ? 'opacity-40 scale-95' : ''}
                          `}
                        >
                          {/* Drag handles & index indicators overlays (hidden in print) */}
                          <div className="absolute -top-3 left-4 bg-zinc-900 border border-zinc-700 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-md z-40 flex items-center gap-1.5 no-print uppercase font-bold select-none pointer-events-none">
                            <Grid className="w-3.5 h-3.5 text-[#D32F2F]" />
                            <span>#{overallIdx + 1} Back</span>
                          </div>

                          {/* Selection Ribbon */}
                          {isSelected && (
                            <div className="absolute -top-3 right-4 bg-rose-600 border border-rose-800 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-md z-40 flex items-center gap-1.5 no-print uppercase font-bold animate-pulse">
                              <span>Focus</span>
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}

                          {/* Card Content with individual style rules */}
                          <div 
                            style={{
                              filter: studentStyle.grayscale ? 'grayscale(100%)' : 'none',
                              borderRadius: studentStyle.squareCorners ? '0px' : '24px',
                              border: studentStyle.borderStyle && studentStyle.borderStyle !== 'none' 
                                ? `3px ${studentStyle.borderStyle} ${studentStyle.cardBorderColor || '#18191b'}` 
                                : 'none',
                              overflow: 'hidden'
                            }}
                          >
                            <IDCard
                              student={stud}
                              config={config}
                              scale={printScale} // Dynamic user fit scale
                              isPrinting={true}
                              forcedSide="back"
                              badgeSize={badgeSize}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </React.Fragment>
            );
          })
        )}
      </div>

    </div>
  );
};
