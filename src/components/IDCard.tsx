/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LogoSVG, SignatureSVG } from './LogoSVG';
import { Student, CardConfig } from '../types';
import { Trash2, Plus, Move, AlignLeft, RefreshCw, Type, Eye, Layers, ChevronUp, ChevronDown, EyeOff, Image, QrCode, Grid, Check } from 'lucide-react';

interface IDCardProps {
  student: Student;
  config: CardConfig;
  setConfig?: React.Dispatch<React.SetStateAction<CardConfig>>;
  scale?: number;
  isPrinting?: boolean;
  forcedSide?: 'front' | 'back' | 'both';
  designerMode?: boolean;
  onUpdateStudent?: (id: string, updatedFields: Partial<Student>) => void;
  badgeSize?: 'standard' | 'compact';
}

export const IDCard: React.FC<IDCardProps> = ({
  student,
  config,
  setConfig,
  scale = 1,
  isPrinting = false,
  forcedSide,
  designerMode = false,
  onUpdateStudent,
  badgeSize = 'standard',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [activeDragKey, setActiveDragKey] = useState<string | null>(null);

  const [mousePos, setMousePos] = useState({ x: 50, y: 50, isHovered: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y, isHovered: true });
  };

  const handleMouseLeave = () => {
    setMousePos(prev => ({ ...prev, isHovered: false }));
  };

  const renderTextureOverlay = () => {
    const texture = config.cardTexture || 'none';
    if (texture === 'none' || isPrinting) return null;

    if (texture === 'matte') {
      return (
        <div 
          className="absolute inset-0 pointer-events-none z-45 mix-blend-overlay opacity-60 rounded-3xl"
          style={{
            backgroundImage: `
              radial-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 1px),
              radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '2.5px 2.5px',
            backgroundPosition: '0 0, 1.25px 1.25px',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.06)'
          }}
        />
      );
    }

    if (texture === 'glossy') {
      const activeX = mousePos.isHovered ? mousePos.x : 50;
      const activeY = mousePos.isHovered ? mousePos.y : 50;
      const gradientAngle = 135 + (activeX - 50) * 0.15;
      const gradientCenter = activeX * 0.7 + activeY * 0.3;
      return (
        <div 
          className="absolute inset-0 pointer-events-none z-45 overflow-hidden rounded-3xl"
          style={{
            background: `
              linear-gradient(${gradientAngle}deg, 
                rgba(255,255,255,0) 0%, 
                rgba(255,255,255,0.02) ${gradientCenter - 25}%, 
                rgba(255,255,255,0.22) ${gradientCenter - 10}%, 
                rgba(255,255,255,0.48) ${gradientCenter}%, 
                rgba(255,255,255,0.22) ${gradientCenter + 10}%, 
                rgba(255,255,255,0.02) ${gradientCenter + 25}%, 
                rgba(255,255,255,0) 100%)
            `,
            mixBlendMode: 'screen',
            opacity: mousePos.isHovered ? 0.92 : 0.65,
            transition: 'opacity 0.3s ease',
            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)'
          }}
        />
      );
    }

    if (texture === 'holographic') {
      const activeX = mousePos.isHovered ? mousePos.x : 50;
      const activeY = mousePos.isHovered ? mousePos.y : 50;
      const angle = 110 + (activeX - 50) * 0.4;
      const center = activeX * 0.6 + activeY * 0.4;

      const rainbowGradient = `
        linear-gradient(${angle}deg, 
          rgba(255, 0, 128, 0.15) ${center - 40}%, 
          rgba(255, 128, 0, 0.15) ${center - 25}%, 
          rgba(220, 220, 0, 0.15) ${center - 10}%, 
          rgba(0, 225, 128, 0.15) ${center}%, 
          rgba(0, 128, 255, 0.15) ${center + 15}%, 
          rgba(128, 0, 255, 0.15) ${center + 30}%, 
          rgba(255, 0, 128, 0.15) ${center + 45}%)
      `;

      const foilHighlight = `
        linear-gradient(${angle + 25}deg, 
          rgba(255,255,255,0) 0%, 
          rgba(255,255,255,0.05) ${center - 15}%, 
          rgba(255,255,255,0.35) ${center}%, 
          rgba(255,255,255,0.05) ${center + 15}%, 
          rgba(255,255,255,0) 100%)
      `;

      return (
        <div 
          className="absolute inset-0 pointer-events-none z-45 overflow-hidden rounded-3xl"
          style={{
            backgroundImage: `${foilHighlight}, ${rainbowGradient}`,
            mixBlendMode: 'color-dodge',
            opacity: mousePos.isHovered ? 0.88 : 0.60,
            transition: 'opacity 0.35s ease',
            boxShadow: 'inset 0 0 25px rgba(255,255,255,0.2)'
          }}
        />
      );
    }

    return null;
  };

  let currentRenderSide = 'front';

  // Dynamic map of fallback text values synchronized during render
  const fallbackValuesRef = useRef<Record<string, string>>({});

  // For Inline Double-Click Editing
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Floating alignment guidelines and smart dimensions states
  const [showVGuide, setShowVGuide] = useState(false);
  const [dragSpacingText, setDragSpacingText] = useState<string | null>(null);

  // Sizing definitions matching defaults
  const isCompact = badgeSize === 'compact';
  const scaleSize = (isCompact ? 0.82 : 1.0) * (config.globalTextScale ?? 1.0);

  const sizes = {
    schoolLogo: (config.textStyles?.schoolLogo?.customSize ?? config.sizes?.schoolLogo ?? 52) * scaleSize,
    schoolNameLine1: (config.textStyles?.schoolNameLine1?.customSize ?? config.sizes?.schoolNameLine1 ?? 19) * scaleSize,
    schoolNameLine2: (config.textStyles?.schoolNameLine2?.customSize ?? config.sizes?.schoolNameLine2 ?? 19) * scaleSize,
    studentPhoto: (config.textStyles?.studentPhoto?.customSize ?? config.sizes?.studentPhoto ?? 172) * scaleSize,
    studentName: (config.textStyles?.studentName?.customSize ?? config.sizes?.studentName ?? 26) * scaleSize,
    studentMeta: (config.textStyles?.studentMeta?.customSize ?? config.sizes?.studentMeta ?? 14.5) * scaleSize,
    sideStripeText: (config.textStyles?.sideStripeText?.customSize ?? config.sizes?.sideStripeText ?? 19) * scaleSize,
    backLogo: (config.textStyles?.backLogo?.customSize ?? config.sizes?.backLogo ?? 72) * scaleSize,
    backTermsTitle: (config.textStyles?.backTermsTitle?.customSize ?? config.sizes?.backTermsTitle ?? 15.5) * scaleSize,
    backTermsText: (config.textStyles?.backTermsText?.customSize ?? config.sizes?.backTermsText ?? 11.2) * scaleSize,
    principalSign: (config.textStyles?.principalSign?.customSize ?? config.sizes?.principalSign ?? 50) * scaleSize,
    principalName: (config.textStyles?.principalName?.customSize ?? config.sizes?.principalName ?? 11) * scaleSize,
    fieldLabels: (config.textStyles?.fieldLabels?.customSize ?? config.sizes?.fieldLabels ?? 14.5) * scaleSize,
    fieldRollVal: (config.textStyles?.fieldRollVal?.customSize ?? config.sizes?.fieldRollVal ?? 14.5) * scaleSize,
    fieldClassVal: (config.textStyles?.fieldClassVal?.customSize ?? config.sizes?.fieldClassVal ?? 14.5) * scaleSize,
    fieldPhoneVal: (config.textStyles?.fieldPhoneVal?.customSize ?? config.sizes?.fieldPhoneVal ?? 14.5) * scaleSize,
    fieldAddressVal: (config.textStyles?.fieldAddressVal?.customSize ?? config.sizes?.fieldAddressVal ?? 14.5) * scaleSize,
    fieldFatherNameVal: (config.textStyles?.fieldFatherNameVal?.customSize ?? config.sizes?.fieldFatherNameVal ?? 14.5) * scaleSize,
    fieldDobVal: (config.textStyles?.fieldDobVal?.customSize ?? config.sizes?.fieldDobVal ?? 14.5) * scaleSize,
  };

  const baseWidth = isCompact ? 280 : 340;
  const baseHeight = isCompact ? 440 : 540;

  // Swatch Accent Palette
  const expandedColors = [
    { name: 'Scarlet Ruby', hex: '#D32F2F' },
    { name: 'Imperial Maroon', hex: '#800000' },
    { name: 'Oxford Navy', hex: '#1E3A8A' },
    { name: 'Forest Emerald', hex: '#15803D' },
    { name: 'Carbon Black', hex: '#1A1A1A' },
    { name: 'Goldenrod Amber', hex: '#D97706' },
    { name: 'Sunset Tangerine', hex: '#EA580C' },
    { name: 'Royal Indigo', hex: '#4F46E5' },
    { name: 'Classic Teal', hex: '#0D9488' },
    { name: 'Fuchsia Velvet', hex: '#D946EF' },
    { name: 'Soft Rosewood', hex: '#9F1239' },
    { name: 'Platinum Steel', hex: '#64748B' },
    { name: 'Cyberpunk Neon', hex: '#84CC16' },
    { name: 'Deep Amethyst', hex: '#7C3AED' },
    { name: 'Copper Rust', hex: '#9A3412' },
    { name: 'Olympic Sky Blue', hex: '#0284C7' }
  ];

  // SVG-based 10 Technical Draft guidelines background rules
  const renderDraftGridOverlay = (gridType?: string) => {
    if (!gridType || gridType === 'none') return null;

    const fillStroke = gridType === 'blueprint' ? '#38bdf8' : gridType === 'matrix' ? '#10b981' : '#cbd5e1';
    const fillOpacity = gridType === 'blueprint' ? '0.25' : gridType === 'matrix' ? '0.2' : '0.4';

    switch (gridType) {
      case 'double-rule':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: fillOpacity }} xmlns="http://www.w3.org/2000/svg">
            <line x1={baseWidth / 2} y1="0" x2={baseWidth / 2} y2={baseHeight} stroke={fillStroke} strokeWidth="1" />
            <line x1="0" y1={baseHeight / 2} x2={baseWidth} y2={baseHeight / 2} stroke={fillStroke} strokeWidth="1" />
            <line x1={baseWidth / 4} y1="0" x2={baseWidth / 4} y2={baseHeight} stroke={fillStroke} strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1={(baseWidth * 3) / 4} y1="0" x2={(baseWidth * 3) / 4} y2={baseHeight} stroke={fillStroke} strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="0" y1={baseHeight / 4} x2={baseWidth} y2={baseHeight / 4} stroke={fillStroke} strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="0" y1={(baseHeight * 3) / 4} x2={baseWidth} y2={(baseHeight * 3) / 4} stroke={fillStroke} strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>
        );

      case 'blueprint':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 bg-sky-950/20" style={{ opacity: 0.8 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-bp" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#2563eb" strokeWidth="0.5" strokeOpacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-bp)" />
            <rect x="8" y="8" width={baseWidth - 16} height={baseHeight - 16} fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="5 5" />
          </svg>
        );

      case 'crosshair':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: fillOpacity }} xmlns="http://www.w3.org/2000/svg">
            <line x1={baseWidth / 2} y1="0" x2={baseWidth / 2} y2={baseHeight} stroke={fillStroke} strokeWidth="1" />
            <line x1="0" y1={baseHeight / 2} x2={baseWidth} y2={baseHeight / 2} stroke={fillStroke} strokeWidth="1" />
            <circle cx={baseWidth / 2} cy={baseHeight / 2} r="50" fill="none" stroke={fillStroke} strokeWidth="1" strokeDasharray="4 4" />
            <circle cx={baseWidth / 2} cy={baseHeight / 2} r="100" fill="none" stroke={fillStroke} strokeWidth="0.5" />
            {/* Corner crosshairs */}
            <path d="M 20,30 L 20,20 L 30,20" fill="none" stroke={fillStroke} strokeWidth="1" />
            <path d="M 320,30 L 320,20 L 310,20" fill="none" stroke={fillStroke} strokeWidth="1" />
            <path d="M 20,510 L 20,520 L 30,520" fill="none" stroke={fillStroke} strokeWidth="1" />
            <path d="M 320,510 L 320,520 L 310,520" fill="none" stroke={fillStroke} strokeWidth="1" />
          </svg>
        );

      case 'radial':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: fillOpacity }} xmlns="http://www.w3.org/2000/svg">
            <circle cx={baseWidth / 2} cy={baseHeight / 2} r="40" fill="none" stroke={fillStroke} strokeWidth="0.75" />
            <circle cx={baseWidth / 2} cy={baseHeight / 2} r="80" fill="none" stroke={fillStroke} strokeWidth="0.5" />
            <circle cx={baseWidth / 2} cy={baseHeight / 2} r="120" fill="none" stroke={fillStroke} strokeWidth="0.5" />
            <circle cx={baseWidth / 2} cy={baseHeight / 2} r="160" fill="none" stroke={fillStroke} strokeWidth="0.5" />
            <circle cx={baseWidth / 2} cy={baseHeight / 2} r="220" fill="none" stroke={fillStroke} strokeWidth="0.25" strokeDasharray="3 3" />
            <line x1="0" y1="0" x2={baseWidth} y2={baseHeight} stroke={fillStroke} strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1={baseWidth} y1="0" x2="0" y2={baseHeight} stroke={fillStroke} strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>
        );

      case 'isometric':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: fillOpacity }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-iso" width="30" height="17.32" patternUnits="userSpaceOnUse">
                <path d="M 0,0 L 15,8.66 L 30,0 L 15,17.32 Z" fill="none" stroke={fillStroke} strokeWidth="0.5" strokeDasharray="1 3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-iso)" />
          </svg>
        );

      case 'golden':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.22 }} xmlns="http://www.w3.org/2000/svg">
            {/* Translucent Golden Ratio spiral layout guide */}
            <rect x="0" y="0" width={baseWidth} height={baseHeight} fill="none" stroke={fillStroke} strokeWidth="1" />
            <line x1={baseWidth * 0.618} y1="0" x2={baseWidth * 0.618} y2={baseHeight} stroke={fillStroke} strokeWidth="0.75" />
            <line x1="0" y1={baseHeight * 0.618} x2={baseWidth} y2={baseHeight * 0.618} stroke={fillStroke} strokeWidth="0.75" />
            <path d={`M 0,0 
                      A ${baseWidth},${baseWidth} 0 0,0 ${baseWidth},${baseWidth} 
                      A ${baseHeight - baseWidth},${baseHeight - baseWidth} 0 0,0 ${baseWidth * 0.618},${baseHeight}
                      A ${baseWidth * 0.382},${baseWidth * 0.382} 0 0,0 ${baseWidth * 0.618},${baseHeight * 0.618}`} 
               fill="none" stroke={fillStroke} strokeWidth="1.5" />
          </svg>
        );

      case 'bounds':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.8 }} xmlns="http://www.w3.org/2000/svg">
            {/* Bleeds at 3mm margin (11px at standard density) */}
            <rect x="11" y="11" width={baseWidth - 22} height={baseHeight - 22} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
            {/* Center safety box */}
            <rect x="25" y="25" width={baseWidth - 50} height={baseHeight - 50} fill="none" stroke="#22c55e" strokeWidth="0.5" />
            {/* Corner markers */}
            <path d="M 0,15 L 15,15" stroke="#ef4444" strokeWidth="1" />
            <path d="M 15,0 L 15,15" stroke="#ef4444" strokeWidth="1" />
            <path d="M 340,15 L 325,15" stroke="#ef4444" strokeWidth="1" />
            <path d="M 325,0 L 325,15" stroke="#ef4444" strokeWidth="1" />
          </svg>
        );

      case 'matrix':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 bg-zinc-950/5" style={{ opacity: 0.7 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-mx" width="16" height="16" patternUnits="userSpaceOnUse">
                <rect width="1" height="1" fill="#10b981" fillOpacity="0.3" />
                <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#10b981" strokeWidth="0.3" strokeOpacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-mx)" />
          </svg>
        );

      case 'graph':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.6 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="graph-minor" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#94a3b8" strokeWidth="0.3" strokeOpacity="0.2" />
              </pattern>
              <pattern id="graph-major" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="url(#graph-minor)" />
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#475569" strokeWidth="0.6" strokeOpacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#graph-major)" />
          </svg>
        );

      case 'double-rule' as any: // Fallback pattern grid
      default:
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.4 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-basic" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-basic)" />
          </svg>
        );
    }
  };

  // Reusable dynamic student fields grid for robust year-2090 data layout with no camo or hidden text
  const renderStudentInfoTable = (textColorClass = 'text-zinc-950', labelColorClass = 'text-zinc-500') => {
    const items = [
      { label: 'ROLL NO', value: student.rollNo || '---', key: 'fieldRollVal' },
      { label: 'CLASS', value: student.class || '---', key: 'fieldClassVal' },
      { label: 'FATHER\'S NAME', value: student.fatherName || '---', key: 'fieldFatherNameVal' },
      { label: 'DOB', value: student.dob || '---', key: 'fieldDobVal' },
      { label: 'PHONE NO', value: student.phone || '---', key: 'fieldPhoneVal' },
    ];

    if (student.extraFields) {
      Object.entries(student.extraFields).forEach(([k, v]) => {
        const valStr = String(v || '');
        if (valStr.trim() !== '') {
          items.push({ label: k.toUpperCase(), value: valStr, key: `studentMeta-${k}` });
        }
      });
    }

    return (
      <div className="w-full flex flex-col gap-1.5 text-[9.5px] font-mono leading-none border-t border-zinc-200/60 pt-2 text-left shrink-0 z-10" id="preset-student-info-grid">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col min-w-0">
              {renderDraggable(
                item.key,
                item.key.startsWith('studentMeta-') ? 'studentMeta' : item.key,
                item.label,
                item.value,
                (val, styleObj) => {
                  const baseSize = typeof styleObj.fontSize === 'string' ? parseFloat(styleObj.fontSize) : (styleObj.fontSize || 14);
                  return (
                    <div style={{ ...styleObj, fontSize: undefined }} className="flex flex-col text-left">
                      <span className={`font-extrabold tracking-wider ${labelColorClass} uppercase truncate`} style={{ fontSize: `${baseSize * 0.6}px`, color: styleObj.color }}>
                        {item.label}
                      </span>
                      <span className={`font-black uppercase truncate mt-0.5 ${textColorClass}`} style={{ fontSize: `${baseSize}px`, color: styleObj.color, fontFamily: styleObj.fontFamily }}>
                        {val}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col min-w-0 mt-1 border-t border-zinc-150/50 pt-1.5">
          {renderDraggable(
            'fieldAddressVal',
            'fieldAddressVal',
            'ADDRESS',
            student.address || '---',
            (val, styleObj) => {
              const baseSize = typeof styleObj.fontSize === 'string' ? parseFloat(styleObj.fontSize) : (styleObj.fontSize || 13);
              return (
                <div style={{ ...styleObj, fontSize: undefined }} className="flex flex-col text-left">
                  <span className={`font-extrabold tracking-wider ${labelColorClass} uppercase`} style={{ fontSize: `${baseSize * 0.6}px`, color: styleObj.color }}>
                    ADDRESS
                  </span>
                  <span className={`font-bold mt-0.5 leading-tight break-all line-clamp-2 uppercase ${textColorClass}`} style={{ fontSize: `${baseSize}px`, color: styleObj.color, fontFamily: styleObj.fontFamily }}>
                    {val}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  };

  // Unified dragging engine for BOTH mouse and touch inputs supporting dynamic lock/unlock
  const handleStartDrag = (key: string, e: React.MouseEvent | React.TouchEvent) => {
    if (isPrinting || !setConfig || !designerMode) return;

    // Reject dragging if we are currently editing the text fields inline!
    if (editingElementId !== null) return;

    const isTouch = 'touches' in e;
    if (isTouch) {
      if (e.cancelable) e.preventDefault();
    } else {
      e.preventDefault();
    }
    e.stopPropagation();

    setSelectedElement(key);
    setActiveDragKey(key);

    const clientX = isTouch ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = isTouch ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const startX = clientX;
    const startY = clientY;

    // Check if dragging a custom text box
    const isCustomBox = key.startsWith('customTextBox-');
    let currX = 0;
    let currY = 0;

    if (isCustomBox) {
      const boxId = key.replace('customTextBox-', '');
      const box = config.customTextBoxes?.find(b => b.id === boxId);
      currX = box?.offsetX ?? 0;
      currY = box?.offsetY ?? 0;
    } else {
      const styles = config.textStyles || {};
      const currentStyle = styles[key] || {};
      currX = currentStyle.offsetX || 0;
      currY = currentStyle.offsetY || 0;
    }

    const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      const isMoveTouch = 'touches' in moveEvent;
      if (isMoveTouch && moveEvent.cancelable) {
        moveEvent.preventDefault();
      }

      const moveClientX = isMoveTouch ? (moveEvent.touches[0]?.clientX ?? clientX) : (moveEvent as MouseEvent).clientX;
      const moveClientY = isMoveTouch ? (moveEvent.touches[0]?.clientY ?? clientY) : (moveEvent as MouseEvent).clientY;

      const dx = (moveClientX - startX) / scale;
      const dy = (moveClientY - startY) / scale;

      let targetX = currX + dx;
      let targetY = currY + dy;

      // Magnetic Snapping Feel
      const snapThreshold = 6;
      let snapsV = false;

      if (Math.abs(targetX) < snapThreshold) {
        targetX = 0;
        snapsV = true;
      }

      setShowVGuide(snapsV);
      setDragSpacingText((Math.abs(targetY) / 32).toFixed(1));

      if (isCustomBox) {
        const boxId = key.replace('customTextBox-', '');
        setConfig(prev => {
          const boxes = prev.customTextBoxes || [];
          return {
            ...prev,
            customTextBoxes: boxes.map(b => 
              b.id === boxId 
                ? { ...b, offsetX: targetX, offsetY: targetY } 
                : b
            )
          };
        });
      } else {
        setConfig(prev => {
          const textStyles = prev.textStyles || {};
          return {
            ...prev,
            textStyles: {
              ...textStyles,
              [key]: {
                ...textStyles[key],
                offsetX: targetX,
                offsetY: targetY,
              }
            }
          };
        });
      }
    };

    const handleDragEnd = () => {
      setActiveDragKey(null);
      setShowVGuide(false);
      setDragSpacingText(null);
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove, { capture: true });
      window.removeEventListener('touchend', handleDragEnd, { capture: true });
      window.removeEventListener('touchcancel', handleDragEnd, { capture: true });
    };

    if (isTouch) {
      window.addEventListener('touchmove', handleDragMove, { passive: false, capture: true });
      window.addEventListener('touchend', handleDragEnd, { capture: true });
      window.addEventListener('touchcancel', handleDragEnd, { capture: true });
    } else {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }
  };

  const saveTextOverride = (itemKey: string, val: string) => {
    if (!setConfig) return;

    if (itemKey.startsWith('schoolTitleLine-')) {
      const lineId = itemKey.replace('schoolTitleLine-', '');
      setConfig(prev => {
        const lines = prev.schoolTitleLines || [];
        return {
          ...prev,
          schoolTitleLines: lines.map(l => l.id === lineId ? { ...l, text: val } : l)
        };
      });
    } else if (itemKey.startsWith('customTextBox-')) {
      const boxId = itemKey.replace('customTextBox-', '');
      setConfig(prev => {
        const boxes = prev.customTextBoxes || [];
        return {
          ...prev,
          customTextBoxes: boxes.map(b => b.id === boxId ? { ...b, value: val } : b)
        };
      });
    } else if (itemKey === 'studentName' && onUpdateStudent) {
      onUpdateStudent(student.id, { name: val });
    } else if (itemKey === 'motto') {
      setConfig(prev => ({ ...prev, motto: val }));
    } else if (itemKey === 'session') {
      setConfig(prev => ({ ...prev, session: val }));
    } else if (itemKey === 'principalName') {
      setConfig(prev => ({ ...prev, principalName: val }));
    } else if (itemKey === 'fieldRollVal' && onUpdateStudent) {
      onUpdateStudent(student.id, { rollNo: val });
    } else if (itemKey === 'fieldClassVal' && onUpdateStudent) {
      onUpdateStudent(student.id, { class: val });
    } else if (itemKey === 'fieldPhoneVal' && onUpdateStudent) {
      onUpdateStudent(student.id, { phone: val });
    } else if (itemKey === 'fieldAddressVal' && onUpdateStudent) {
      onUpdateStudent(student.id, { address: val });
    } else if (itemKey === 'fieldFatherNameVal' && onUpdateStudent) {
      onUpdateStudent(student.id, { fatherName: val });
    } else if (itemKey === 'fieldDobVal' && onUpdateStudent) {
      onUpdateStudent(student.id, { dob: val });
    } else {
      setConfig(prev => {
        const styles = prev.textStyles || {};
        return {
          ...prev,
          textStyles: {
            ...styles,
            [itemKey]: {
              ...styles[itemKey],
              overrideValue: val
            }
          }
        };
      });
    }
  };

  // Helper extractor to read custom styles from textStyles, custom schoolTitleLines, or custom text boxes
  const getItemTextValue = (key: string, defaultValue: string): string => {
    if (key.startsWith('schoolTitleLine-')) {
      const lineId = key.replace('schoolTitleLine-', '');
      return config.schoolTitleLines?.find(l => l.id === lineId)?.text ?? defaultValue;
    }
    if (key.startsWith('customTextBox-')) {
      const boxId = key.replace('customTextBox-', '');
      return config.customTextBoxes?.find(b => b.id === boxId)?.value ?? defaultValue;
    }
    if (key === 'studentName') return student.name || defaultValue;
    if (key === 'fieldRollVal') return student.rollNo || defaultValue;
    if (key === 'fieldClassVal') return student.class || defaultValue;
    if (key === 'fieldPhoneVal') return student.phone || defaultValue;
    if (key === 'fieldAddressVal') return student.address || defaultValue;
    if (key === 'motto') return config.motto || defaultValue;
    if (key === 'session') return config.session || defaultValue;
    if (key === 'principalName') return config.principalName || defaultValue;

    return config.textStyles?.[key]?.overrideValue ?? fallbackValuesRef.current[key] ?? defaultValue;
  };

  // Drag element wrappers matching parameters
  const renderDraggable = (
    key: string,
    baseSizeKey: string,
    label: string,
    fallbackTextValue: string,
    childrenRenderer: (val: string, styleObj: React.CSSProperties) => React.ReactNode,
    extraStyles?: React.CSSProperties
  ) => {
    if (key === 'studentMeta') {
      return null;
    }
    const isCustomBox = key.startsWith('customTextBox-');
    const isSchoolTitleLine = key.startsWith('schoolTitleLine-');
    
    let customStyle: any = {};
    let finalSize = 14;
    let finalOffset = { x: 0, y: 0 };
    let fontFamily = 'Inter';
    let bold = false;
    let italic = false;
    let underline = false;
    let letterSpacing = 'normal';
    let lineHeight = 'normal';

    if (isCustomBox) {
      const boxId = key.replace('customTextBox-', '');
      const box = config.customTextBoxes?.find(b => b.id === boxId);
      if (box) {
        finalSize = (box.fontSize ?? 13) * (config.globalTextScale ?? 1.0);
        finalOffset = { x: box.offsetX ?? 0, y: box.offsetY ?? 0 };
        customStyle.color = box.color;
        bold = box.bold ?? false;
        italic = box.italic ?? false;
        underline = box.underline ?? false;
        fontFamily = box.fontFamily ?? 'Inter';
        letterSpacing = box.letterSpacing ?? 'normal';
      }
    } else if (isSchoolTitleLine) {
      const lineId = key.replace('schoolTitleLine-', '');
      const line = config.schoolTitleLines?.find(l => l.id === lineId);
      if (line) {
        finalSize = (line.fontSize ?? 14) * (config.globalTextScale ?? 1.0);
        customStyle.color = line.color;
        bold = line.bold ?? false;
        italic = line.italic ?? false;
        underline = line.underline ?? false;
        fontFamily = line.fontFamily ?? 'Inter';
        letterSpacing = line.letterSpacing ?? 'normal';
        lineHeight = line.lineHeight ?? 'normal';
      }
      const styles = config.textStyles?.[key] || {};
      finalOffset = { x: styles.offsetX ?? 0, y: styles.offsetY ?? 0 };
    } else {
      const styles = config.textStyles?.[key] || {};
      if (styles.customSize !== undefined) {
        finalSize = styles.customSize * (isCompact ? 0.82 : 1.0) * (config.globalTextScale ?? 1.0);
      } else {
        finalSize = sizes[baseSizeKey as keyof typeof sizes] || (14 * scaleSize);
      }
      finalOffset = { x: styles.offsetX ?? 0, y: styles.offsetY ?? 0 };
      customStyle.color = styles.color;
      bold = styles.bold ?? false;
      italic = styles.italic ?? false;
      underline = styles.underline ?? false;
      fontFamily = styles.fontFamily ?? 'Inter';
      letterSpacing = styles.letterSpacing ?? 'normal';
      lineHeight = styles.lineHeight ?? 'normal';
    }

    const isHidden = config.textStyles?.[key]?.hidden ?? (key === 'studentMeta');
    if (isHidden) {
      if (designerMode && !isPrinting) {
        return (
          <div
            id={`card-element-hidden-${key}`}
            onClick={(e) => {
              if (!designerMode) return;
              e.stopPropagation();
              setSelectedElement(key);
            }}
            className="border-2 border-dashed border-red-500/85 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 flex items-center justify-center rounded select-none text-[8.5px] text-red-700 hover:text-red-900 font-mono tracking-tight cursor-pointer no-print font-bold shrink-0 z-40 transition-all duration-150"
            title="Hidden Layer. Click to select/style or unhide."
            style={{
              transform: `translate(${finalOffset.x}px, ${finalOffset.y}px)`,
              margin: '2px',
            }}
          >
            ❌ {label} (Hidden)
          </div>
        );
      }
      return null;
    }

    fallbackValuesRef.current[key] = fallbackTextValue;
    const payloadText = getItemTextValue(key, fallbackTextValue);

    // Apply inline text style parameters
    const textStyle: React.CSSProperties = {
      transform: `translate(${finalOffset.x}px, ${finalOffset.y}px)`,
      color: customStyle.color || undefined,
      fontSize: baseSizeKey !== 'studentPhoto' && baseSizeKey !== 'schoolLogo' && baseSizeKey !== 'principalSign' ? `${finalSize}px` : undefined,
      fontFamily: fontFamily,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal',
      textDecoration: underline ? 'underline' : 'none',
      letterSpacing: letterSpacing === 'wide' ? '0.06em' : letterSpacing === 'widest' ? '0.12em' : letterSpacing === 'tight' ? '-0.02em' : 'normal',
      lineHeight: lineHeight === 'tight' ? '1.1' : lineHeight === 'none' ? '1' : lineHeight === 'relaxed' ? '1.4' : 'normal',
      ...extraStyles,
    };

    // Quick visual toggle hide-photo check
    if (key === 'studentPhoto' && (config as any).hidePhoto) {
      if (designerMode && !isPrinting) {
        return (
          <div
            id="card-element-studentPhoto"
            onClick={(e) => {
              if (!designerMode) return;
              e.stopPropagation();
              setSelectedElement(key);
            }}
            className={`border-2 border-dashed border-zinc-400 bg-zinc-50 select-none flex flex-col items-center justify-center p-2 text-center rounded transition ${selectedElement === 'studentPhoto' ? 'ring-2 ring-zinc-900 shadow-md bg-zinc-100' : 'hover:bg-zinc-100 hover:outline hover:outline-dashed hover:outline-zinc-400'}`}
            style={{
              transform: `translate(${finalOffset.x}px, ${finalOffset.y}px)`,
              width: '130px',
              height: '140px',
              margin: '0 auto',
            }}
          >
            <EyeOff className="w-5 h-5 text-zinc-400 mb-1" />
            <span className="text-[8px] font-mono font-black text-zinc-500 leading-none">STAGED PHOTO</span>
            <span className="text-[7px] font-mono text-zinc-400 mt-1 uppercase leading-none">[Currently Hidden]</span>
          </div>
        );
      }
      return null;
    }

    if (isPrinting) {
      return (
        <div style={textStyle}>
          {childrenRenderer(payloadText, textStyle)}
        </div>
      );
    }

    const isSelected = selectedElement === key;
    const isDragging = activeDragKey === key;
    const isEditing = editingElementId === key;

    const draggableClassName = `relative transition-all duration-100 rounded select-none group ${
      designerMode
        ? `cursor-grab ${isDragging ? 'cursor-grabbing opacity-85 scale-102 z-50' : ''} ${
            isSelected
              ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-lg'
              : 'hover:outline hover:outline-1 hover:outline-dashed hover:outline-blue-400 hover:bg-blue-500/5'
          }`
        : ''
    }`;

    return (
      <div
        id={`card-element-${key}`}
        onMouseDown={(e) => {
          if (isEditing) return;
          handleStartDrag(key, e);
        }}
        onTouchStart={(e) => {
          if (isEditing) return;
          handleStartDrag(key, e);
        }}
        onClick={(e) => {
          if (!designerMode) return;
          e.stopPropagation();
          setSelectedElement(key);
        }}
        onDoubleClick={(e) => {
          if (!designerMode) return;
          e.stopPropagation();
          setEditingElementId(key);
          setEditingText(payloadText);
        }}
        className={draggableClassName}
        style={{
          transform: !isEditing ? textStyle.transform : undefined,
          touchAction: designerMode ? 'none' : 'auto',
          zIndex: isSelected ? 40 : 'auto'
        }}
        title={designerMode ? "Single-click to Style. Double-click to Edit text. Drag to move." : undefined}
      >
        {isEditing ? (
          <input
            type="text"
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onBlur={() => {
              saveTextOverride(key, editingText);
              setEditingElementId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveTextOverride(key, editingText);
                setEditingElementId(null);
              }
              if (e.key === 'Escape') {
                setEditingElementId(null);
              }
            }}
            className="bg-white border-2 border-zinc-950 font-sans font-black text-black px-1.5 py-0.5 rounded shadow-xl z-55 text-xs outline-none uppercase tracking-wide inline-block"
            style={{ width: '160px', transform: 'scale(1)' }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            {designerMode && (
              <span className="absolute -top-4 left-0 bg-zinc-900 border border-zinc-800 text-[8px] font-mono text-white px-1 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-40 select-none uppercase tracking-wider whitespace-nowrap pointer-events-none">
                {label} ✥
              </span>
            )}
            {childrenRenderer(payloadText, { ...textStyle, transform: undefined })}
          </>
        )}
      </div>
    );
  };

  // Vector Barcode helper component
  const BarcodeSVG: React.FC<{ className?: string }> = ({ className }) => {
    if (currentRenderSide === 'front') {
      return null;
    }
    if ((config as any).hideBarcode) {
      if (designerMode && !isPrinting) {
        return (
          <div className={`border-2 border-dashed border-zinc-400 bg-zinc-50/55 h-8 w-40 mx-auto flex items-center justify-center text-[7px] font-mono font-black text-zinc-500 rounded select-none ${className || ''}`} style={{ transform: 'scale(0.85)' }}>
            [BARCODE/QR CODE HIDDEN]
          </div>
        );
      }
      return null;
    }
    return (
      <svg className={`h-8 w-40 text-black mx-auto ${className || ''}`} viewBox="0 0 100 24" fill="currentColor">
        <rect x="0" y="0" width="2" height="24" />
        <rect x="3" y="0" width="1" height="24" />
        <rect x="5" y="0" width="3" height="24" />
        <rect x="9" y="0" width="1" height="24" />
        <rect x="11" y="0" width="2" height="24" />
        <rect x="14" y="0" width="4" height="24" />
        <rect x="19" y="0" width="1" height="24" />
        <rect x="21" y="0" width="3" height="24" />
        <rect x="25" y="0" width="2" height="24" />
        <rect x="28" y="0" width="1" height="24" />
        <rect x="30" y="0" width="4" height="24" />
        <rect x="35" y="0" width="2" height="24" />
        <rect x="38" y="0" width="1" height="24" />
        <rect x="40" y="0" width="3" height="24" />
        <rect x="44" y="0" width="2" height="24" />
        <rect x="47" y="0" width="1" height="24" />
        <rect x="49" y="0" width="4" height="24" />
        <rect x="54" y="0" width="2" height="24" />
        <rect x="57" y="0" width="1" height="24" />
        <rect x="59" y="0" width="3" height="24" />
        <rect x="63" y="0" width="2" height="24" />
        <rect x="66" y="0" width="4" height="24" />
        <rect x="71" y="0" width="1" height="24" />
        <rect x="73" y="0" width="3" height="24" />
        <rect x="77" y="0" width="2" height="24" />
        <rect x="80" y="0" width="1" height="24" />
        <rect x="82" y="0" width="4" height="24" />
        <rect x="87" y="0" width="2" height="24" />
        <rect x="90" y="0" width="1" height="24" />
        <rect x="92" y="0" width="3" height="24" />
        <rect x="96" y="0" width="2" height="24" />
      </svg>
    );
  };

  const renderPolicyLine = (color?: string) => {
    const text = config.policyLine || '';
    if (!text) return null;
    return (
      <div className="z-20 mt-1.5 select-none text-center px-4 w-full">
        <p 
          className="text-[7.5px] font-sans font-medium tracking-tight h-auto line-clamp-2 leading-tight"
          style={{ color: color || 'inherit', opacity: 0.7 }}
        >
          {text}
        </p>
      </div>
    );
  };

  const renderPrincipalSignaturePlace = (textColor?: string, lineColor?: string, signColor?: string) => {
    return (
      <div className="flex flex-col items-center justify-center pt-2 select-none z-10 w-full">
        <div className="relative flex flex-col items-center justify-center min-h-[48px] w-[180px]">
          {/* Handwritten Principal Signature */}
          {config.principalSign ? (
            <img
              src={config.principalSign}
              alt="Principal Signature"
              className="max-w-[130px] max-h-[42px] object-contain drop-shadow"
              referrerPolicy="no-referrer"
            />
          ) : (
            <SignatureSVG size={45} className="pointer-events-none drop-shadow" strokeColor={signColor || config.themeColor} />
          )}
          {/* Signature Line */}
          <div className={`w-full border-t border-dashed mt-1 ${lineColor || 'border-zinc-350'}`} />
        </div>
        {/* Signature Label */}
        <span className={`text-[8px] font-mono tracking-wider font-extrabold uppercase mt-1 leading-none text-center ${textColor || 'text-zinc-600'}`}>
          {config.principalName || 'PRINCIPAL SIGNATURE'}
        </span>
        <span className="text-[6.5px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5 text-center leading-none">
          PRINCIPAL / BADGE ISSUING AUTHORITY
        </span>
      </div>
    );
  };

  const renderBackMainContent = (textColor?: string, lineColor?: string, signColor?: string) => {
    const displayTerms = config.terms || [];
    return (
      <div className="flex-1 flex flex-col justify-between w-full h-full select-none gap-1.5 py-1">
        {/* Terms and Conditions Section */}
        <div className="text-left w-full px-4 pt-1 z-10 flex-1 flex flex-col justify-start">
          {renderDraggable(
            'backTermsTitle',
            'backTermsTitle',
            'Terms Header',
            'Terms & Conditions',
            (val, styleObj) => (
              <h3 
                className="font-display font-black uppercase tracking-widest text-[#18191b] text-center border-b pb-0.5 mb-1"
                style={{ 
                  color: styleObj.color || config.themeColor || '#111', 
                  borderColor: lineColor ? 'currentColor' : '#e4e4e7',
                  ...styleObj 
                }}
              >
                {val}
              </h3>
            )
          )}
          {displayTerms.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-1 text-center">
              <span className="text-[8px] font-mono font-black text-zinc-400 uppercase tracking-wider block">No terms specified</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1 pr-1">
              {displayTerms.map((term, idx) => (
                <div key={term.id || `term-${idx}`} className="leading-tight font-sans text-left">
                  {renderDraggable(
                    `backTermsText-${term.id}`,
                    'backTermsText',
                    `Rule Bullet #${idx + 1}`,
                    term.text,
                    (val, styleObj) => (
                      <div className="flex items-start gap-1">
                        <span className="font-extrabold uppercase select-none shrink-0" style={{ color: styleObj.color || config.themeColor || '#111', fontSize: styleObj.fontSize }}>▪</span>
                        <p className="text-left" style={styleObj}>
                          <span className="font-extrabold pr-0.5 uppercase" style={{ color: styleObj.color || (textColor ? 'inherit' : '#111') }}>{term.label}:</span>
                          <span style={{ color: styleObj.color || (textColor ? 'inherit' : '#4b5563') }}>{val}</span>
                        </p>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signature Area */}
        <div className="mt-1 pb-1 text-center flex flex-col items-center shrink-0">
          {renderDraggable(
            'principalSign',
            'principalSign',
            'Signature PNG',
            '',
            (val, styleObj) => (
              <div 
                className="flex items-center justify-center relative mb-0.5 mx-auto"
                style={{ width: `${sizes.principalSign * 3.5}px`, height: `${sizes.principalSign}px` }}
              >
                {config.principalSign ? (
                  <img
                    src={config.principalSign}
                    alt="Authorized Sign"
                    className="max-w-full max-h-full object-contain filter drop-shadow font-sans text-2xs text-zinc-400"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <SignatureSVG size={sizes.principalSign} className="-mt-1 pointer-events-none" strokeColor={signColor || config.themeColor} />
                )}
              </div>
            )
          )}
          <div className="w-[140px] border-t border-solid mx-auto" style={{ borderColor: lineColor ? 'currentColor' : 'rgba(0,0,0,0.2)' }} />
          {renderDraggable(
            'principalName',
            'principalName',
            'Principal Name Text',
            config.principalName,
            (val, styleObj) => (
              <span style={styleObj} className={`font-mono tracking-wider font-extrabold uppercase mt-0.5 block ${textColor || 'text-zinc-850'}`}>
                {val}
              </span>
            )
          )}
        </div>
      </div>
    );
  };

  const FrontSide = () => {
    currentRenderSide = 'front';
    const layout = config.layoutStyle || 'academic';

    switch (layout) {
      case 'pathway': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between p-5 select-none"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-front-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 340 540" fill="none">
              <path d="M 120 0 Q 220 30, 340 130 L 340 0 Z" fill={config.themeColor} />
              <path d="M 80 0 Q 180 50, 340 180 L 340 0 Z" fill={config.themeColor} opacity="0.25" />
              <path d="M 0 440 C 60 430, 160 480, 220 540 L 0 540 Z" fill={config.themeColor} />
              <path d="M 0 395 C 80 390, 190 460, 260 540 L 0 540 Z" fill={config.themeColor} opacity="0.2" />
            </svg>

            <div className="flex items-center gap-2.5 z-10">
              {renderDraggable(
                'schoolLogo',
                'schoolLogo',
                'School Logo',
                '',
                (val, styleObj) => (
                  <button className="focus:outline-none shrink-0" style={styleObj}>
                    {config.schoolLogo ? (
                      <img
                        src={config.schoolLogo}
                        alt="Logo"
                        className="object-contain"
                        style={{ width: `${sizes.schoolLogo}px`, height: `${sizes.schoolLogo}px` }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <svg className="w-11 h-11 text-white fill-current drop-shadow-sm" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    )}
                  </button>
                )
              )}

              <div className="leading-[1.1] flex flex-col justify-center flex-1 pr-1 text-white">
                {config.schoolTitleLines && config.schoolTitleLines.length > 0 ? (
                  config.schoolTitleLines.map((line) => (
                    <div key={line.id} className="w-full">
                      {renderDraggable(
                        `schoolTitleLine-${line.id}`,
                        'schoolNameLine1',
                        `Title Line`,
                        line.text,
                        (val, styleObj) => (
                          <div style={{ ...styleObj, color: styleObj.color || '#ffffff' }} className="uppercase break-words font-display tracking-wide font-black text-left">
                            {val}
                          </div>
                        )
                      )}
                    </div>
                  ))
                ) : (
                  <>
                    <h2 className="font-display font-black uppercase text-sm tracking-wide text-white font-sans">PATHWAY PARTNERS</h2>
                    <p className="font-sans font-bold text-[9px] uppercase tracking-widest text-[#FFF2E2]">LEADER SERVICES</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 flex items-center justify-between relative z-10 w-full mt-4">
              <div className="w-[70px] flex flex-col items-center justify-center gap-4 py-2 shrink-0">
                <span className="bg-[#1a1c1d] text-white border border-zinc-900 font-mono font-extrabold text-[9px] tracking-widest px-3 py-1 rounded-sm uppercase whitespace-nowrap shadow-md shrink-0">
                  STUDENT
                </span>

                {renderDraggable(
                  'studentName',
                  'studentName',
                  'Student Name',
                  student.name,
                  (val, styleObj) => (
                    <div
                      className="font-display font-black tracking-widest uppercase whitespace-nowrap text-center select-none"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        color: styleObj.color || '#1A1C1D',
                        fontSize: styleObj.fontSize ? `${styleObj.fontSize * 0.75}px` : '20px',
                        height: '210px',
                      }}
                    >
                      {val}
                    </div>
                  )
                )}
              </div>

              <div className="flex-1 flex justify-center py-2 relative pr-2">
                {renderDraggable(
                  'studentPhoto',
                  'studentPhoto',
                  'Photo Container',
                  '',
                  (val, styleObj) => (
                    <div
                      className="bg-zinc-50 overflow-hidden shrink-0 shadow-xl flex items-center justify-center border-4"
                      style={{
                        ...styleObj,
                        width: `${(145 / 172) * sizes.studentPhoto}px`,
                        height: `${(185 / 172) * sizes.studentPhoto}px`,
                        borderRadius: '24px 8px 16px 24px',
                        borderColor: config.themeColor,
                        transform: undefined
                      }}
                    >
                      {student.photo ? (
                        <img
                          src={student.photo}
                          alt={student.name}
                          className="w-full h-full object-cover select-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400">
                          <span className="text-[10px] uppercase font-mono tracking-widest">NO IMAGE</span>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="w-full z-10 px-2 pb-2">
              {renderStudentInfoTable('text-zinc-950', 'text-amber-800')}
            </div>
          </div>
        );
      }
      case 'ingoude-kimberly': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between select-none"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-front-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            
            <div className="absolute top-0 inset-x-0 h-[240px] bg-zinc-900 pointer-events-none z-0" style={{ backgroundColor: config.themeColor !== '#D32F2F' ? config.themeColor : '#18181b' }}>
              <svg className="absolute bottom-0 left-0 w-full h-[60px]" viewBox="0 0 340 60" preserveAspectRatio="none">
                <polygon points="0,0 340,0 340,30 0,60" fill="currentColor" className="text-zinc-900" style={{ color: config.themeColor !== '#D32F2F' ? config.themeColor : '#18181b' }} />
                <polygon points="0,60 340,30 340,60" fill="#ffffff" />
              </svg>
            </div>

            <div className="absolute top-0 right-0 w-36 h-36 bg-zinc-850 opacity-20 transform rotate-12 -translate-y-5 translate-x-5 pointer-events-none" />

            <div className="pt-6 px-6 text-center z-10 text-white">
              <div className="flex justify-center mb-1"><LogoSVG size={32} className="text-white fill-current" /></div>
              {renderDraggable(
                'schoolNameLine1',
                'schoolNameLine1',
                'School Title L1',
                'INGOUDE COMPANY',
                (val, styleObj) => (
                  <h2 className="font-display font-black text-xs uppercase tracking-[0.2em] text-white" style={styleObj}>{val}</h2>
                )
              )}
            </div>

            <div className="flex justify-center z-10 -mt-2">
              {renderDraggable(
                'studentPhoto',
                'studentPhoto',
                'Photo Container',
                '',
                (val, styleObj) => (
                  <div
                    className="bg-zinc-50 overflow-hidden shrink-0 shadow-lg flex items-center justify-center border-4 border-white rounded-full"
                    style={{
                      ...styleObj,
                      width: `${(124 / 172) * sizes.studentPhoto}px`,
                      height: `${(124 / 172) * sizes.studentPhoto}px`,
                      transform: undefined
                    }}
                  >
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-200 text-zinc-400">
                        <span className="text-[9px] uppercase font-mono tracking-widest">PHOTO</span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            <div className="flex-1 px-6 pb-4 pt-1 flex flex-col justify-between items-center text-center z-10 bg-transparent text-zinc-900">
              <div>
                {renderDraggable(
                  'studentName',
                  'studentName',
                  'Student Name',
                  student.name,
                  (val, styleObj) => (
                    <h2 className="font-display font-black text-base uppercase text-zinc-950 tracking-wider mb-0.5" style={styleObj}>
                      {val}
                    </h2>
                  )
                )}

                {renderDraggable(
                  'studentMeta',
                  'studentMeta',
                  'Sub-Classification',
                  'PROGRAM COORDINATOR',
                  (val, styleObj) => (
                    <span className="text-[9px] font-mono uppercase tracking-[0.15em] font-extrabold text-zinc-400 block" style={styleObj}>
                      {val}
                    </span>
                  )
                )}
              </div>

              <div className="w-full max-w-[240px]">
                {renderStudentInfoTable('text-zinc-950', 'text-zinc-400')}
              </div>

              <div className="w-full pt-1">
                <BarcodeSVG />
              </div>
            </div>
          </div>
        );
      }
      case 'ingoude-francois': {
        return (
          <div
            className="absolute inset-0 bg-zinc-950 shadow-lg overflow-hidden flex flex-col justify-between select-none"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-front-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            
            <div className="absolute top-0 inset-x-0 h-[210px] bg-white pointer-events-none z-0">
              <svg className="absolute bottom-0 left-0 w-full h-[50px]" viewBox="0 0 340 50" preserveAspectRatio="none">
                <polygon points="0,0 340,30 340,50 0,50" fill={config.themeColor} />
                <polygon points="0,0 340,0 340,30" fill="#ffffff" />
              </svg>
              <svg className="absolute top-0 inset-x-0 w-full h-12 text-amber-500 opacity-30 pointer-events-none" viewBox="0 0 340 60" fill="none">
                <path d="M 0 0 L 120 40 L 0 50 Z" fill="currentColor" style={{ color: config.themeColor }} />
                <path d="M 340 0 L 220 40 L 340 50 Z" fill="currentColor" style={{ color: config.themeColor }} />
              </svg>
            </div>

            <div className="pt-5 px-6 text-center z-10 text-zinc-900">
              <div className="flex justify-center mb-0.5"><LogoSVG size={28} className="text-zinc-900 fill-current" /></div>
              {renderDraggable(
                'schoolNameLine1',
                'schoolNameLine1',
                'School Title L1',
                'Ingoude Company',
                (val, styleObj) => (
                  <h2 className="font-display font-extrabold text-sm text-zinc-950 tracking-tight" style={styleObj}>{val}</h2>
                )
              )}
            </div>

            <div className="flex justify-center z-10 mt-6">
              {renderDraggable(
                'studentPhoto',
                'studentPhoto',
                'Photo Container',
                '',
                (val, styleObj) => (
                  <div
                    className="bg-zinc-50 overflow-hidden shrink-0 shadow-lg flex items-center justify-center border-4 border-white rounded-full"
                    style={{
                      ...styleObj,
                      width: `${(120 / 172) * sizes.studentPhoto}px`,
                      height: `${(120 / 172) * sizes.studentPhoto}px`,
                      transform: undefined
                    }}
                  >
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-200 text-zinc-400">
                        <span className="text-[10px] uppercase font-mono">NO PHOTO</span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            <div className="flex-1 px-5 pb-5 flex flex-col justify-between items-center text-center z-10 bg-transparent text-white pt-2">
              <div>
                {renderDraggable(
                  'studentName',
                  'studentName',
                  'Student Name',
                  student.name,
                  (val, styleObj) => (
                    <h2 className="font-display font-extrabold text-base uppercase text-white tracking-wide mb-1" style={styleObj}>
                      {val}
                    </h2>
                  )
                )}

                <div className="inline-block mx-auto">
                  {renderDraggable(
                    'studentMeta',
                    'studentMeta',
                    'Classification Badge',
                    'Corporate Planner',
                    (val, styleObj) => (
                      <span className="px-4 py-0.5 bg-amber-600 font-sans font-black text-[9px] uppercase tracking-wider rounded-full text-white inline-block border border-amber-500" style={{ ...styleObj, backgroundColor: config.themeColor }}>
                        {val}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="w-full max-w-[220px]">
                {renderStudentInfoTable('text-white', 'text-zinc-500')}
              </div>

              <div className="w-full bg-white p-1 rounded border border-zinc-850 shadow-inner mt-1">
                <BarcodeSVG />
              </div>
            </div>
          </div>
        );
      }
      case 'energized': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between py-6 px-5 select-none text-blue-900"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-front-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 340 540" fill="none">
              <path d="M 140 0 C 260 0, 340 100, 340 260 C 340 420, 200 480, 0 460 L 0 540 L 340 540 L 340 0 Z" fill={config.themeColor} opacity="0.08" />
              <path d="M -20 -20 Q 220 0, 340 320 C 340 480, 220 540, 60 540 L -20 540 Z" fill={config.themeColor} opacity="0.12" />
              <path d="M 0 510 C 140 515, 260 480, 340 400 L 340 540 L 0 540 Z" fill={config.themeColor} />
            </svg>

            <div className="flex justify-between items-center z-10 w-full">
              <div className="flex items-center gap-1.5 text-blue-900 leading-none">
                <div className="w-6 h-6 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: config.themeColor }}>⚡</div>
                {renderDraggable(
                  'schoolNameLine1',
                  'schoolNameLine1',
                  'School Title L1',
                  'ENERGIZED',
                  (val, styleObj) => (
                    <span className="font-sans font-black text-xs uppercase tracking-widest text-[#1E3A8A] text-left" style={{ ...styleObj, color: config.themeColor }}>{val}</span>
                  )
                )}
              </div>
              <span className="text-[9px] font-mono font-black text-white uppercase bg-blue-900/90 py-0.5 px-2 rounded-sm shadow-sm" style={{ backgroundColor: config.themeColor }}>EVENT PASS</span>
            </div>

            <div className="flex justify-center z-10 mt-4">
              {renderDraggable(
                'studentPhoto',
                'studentPhoto',
                'Photo Container',
                '',
                (val, styleObj) => (
                  <div
                    className="bg-zinc-50 overflow-hidden shrink-0 shadow-lg flex items-center justify-center border-4 rounded-full"
                    style={{
                      ...styleObj,
                      width: `${(135 / 172) * sizes.studentPhoto}px`,
                      height: `${(135 / 172) * sizes.studentPhoto}px`,
                      borderColor: config.themeColor,
                      transform: undefined
                    }}
                  >
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400">
                        <span className="text-[10px] uppercase font-mono">IMAGE</span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            <div className="flex-1 text-center flex flex-col justify-around z-10 text-[#1E3A8A] mt-2 mb-1">
              <div>
                {renderDraggable(
                  'studentName',
                  'studentName',
                  'Student Name',
                  student.name,
                  (val, styleObj) => (
                    <h2 className="font-display font-black text-lg uppercase tracking-tight leading-none text-center" style={{ ...styleObj, color: config.themeColor }}>
                      {val}
                    </h2>
                  )
                )}

                {renderDraggable(
                  'studentMeta',
                  'studentMeta',
                  'Sub-Classification',
                  'EVENT ORGANIZER',
                  (val, styleObj) => (
                    <p className="text-[9px] font-mono tracking-[0.2em] text-[#1E3A8A]/70 uppercase font-black mt-1 text-center" style={styleObj}>{val}</p>
                  )
                )}
              </div>

              <div className="w-full max-w-[240px] mx-auto">
                {renderStudentInfoTable('text-zinc-950', 'text-zinc-400')}
              </div>

              <div className="w-full pt-1">
                <BarcodeSVG className="mx-auto" />
              </div>
            </div>

            <div className="w-full py-1 border border-zinc-950 rounded-full z-10 text-center shadow-lg" style={{ backgroundColor: config.themeColor }}>
              <span className="text-[9px] font-mono font-black text-white tracking-widest uppercase text-center block">
                {config.motto || 'WWW.REALLYGREATSITE.COM'}
              </span>
            </div>
          </div>
        );
      }
      case 'shodwe-cia': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between p-5 select-none"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-front-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 340 540" fill="none">
              <polygon points="0,0 220,0 0,160" fill={config.themeColor} />
              <polygon points="340,540 120,540 340,380" fill="#18181b" />
              <line x1="0" y1="160" x2="220" y2="0" stroke="#18181b" strokeWidth="2" opacity="0.3" />
            </svg>

            <div className="flex items-center gap-2 z-10 text-white">
              <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center border border-zinc-950 font-bold text-xs" style={{ color: config.themeColor }}>S</div>
              {renderDraggable(
                'schoolNameLine1',
                'schoolNameLine1',
                'School Title L1',
                'STUDIO SHODWE',
                (val, styleObj) => (
                  <span className="font-display font-black text-xs uppercase tracking-wide text-white text-left" style={styleObj}>{val}</span>
                )
              )}
            </div>

            <div className="flex justify-center z-10 mt-6">
              {renderDraggable(
                'studentPhoto',
                'studentPhoto',
                'Photo Container',
                '',
                (val, styleObj) => (
                  <div
                    className="bg-zinc-50 overflow-hidden shrink-0 shadow-lg flex items-center justify-center border-4 border-zinc-950 rounded-xl"
                    style={{
                      ...styleObj,
                      width: `${(130 / 172) * sizes.studentPhoto}px`,
                      height: `${(165 / 172) * sizes.studentPhoto}px`,
                    }}
                  >
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-150 text-zinc-400">
                        <span className="text-[9px] uppercase font-mono">IMAGE</span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between items-center text-center z-10 text-zinc-900 pt-3">
              <div>
                {renderDraggable(
                  'studentName',
                  'studentName',
                  'Student Name',
                  student.name,
                  (val, styleObj) => (
                    <h2 className="font-display font-black text-base uppercase tracking-wider text-center" style={{ ...styleObj, color: config.themeColor }}>
                      {val}
                    </h2>
                  )
                )}

                {renderDraggable(
                  'studentMeta',
                  'studentMeta',
                  'Sub-Classification',
                  'DESIGN MANAGER',
                  (val, styleObj) => (
                    <p className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-extrabold mt-0.5 text-center" style={styleObj}>{val}</p>
                  )
                )}
              </div>

              <div className="w-full max-w-[210px]">
                {renderStudentInfoTable('text-zinc-950', 'text-zinc-400')}
              </div>

              <div className="w-full pt-1.5 flex justify-center">
                <BarcodeSVG />
              </div>
            </div>
          </div>
        );
      }
      case 'ingoude-morgan': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between select-none border-4 border-yellow-400"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-front-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            
            <div className="absolute top-0 inset-x-0 h-[65px] pointer-events-none z-0" style={{ backgroundColor: config.themeColor }} />
            
            <div className="pt-4 px-5 text-center z-10 text-white flex justify-center items-center gap-2">
              <span className="text-xs">🏢</span>
              {renderDraggable(
                'schoolNameLine1',
                'schoolNameLine1',
                'School Title L1',
                'Ingoude Company',
                (val, styleObj) => (
                  <h2 className="font-display font-black text-sm uppercase text-white tracking-wide text-center" style={styleObj}>{val}</h2>
                )
              )}
            </div>

            <div className="flex justify-center z-10 mt-10">
              {renderDraggable(
                'studentPhoto',
                'studentPhoto',
                'Photo Container',
                '',
                (val, styleObj) => (
                  <div
                    className="bg-zinc-50 overflow-hidden shrink-0 shadow-lg flex items-center justify-center border-4"
                    style={{
                      ...styleObj,
                      width: `${(125 / 172) * sizes.studentPhoto}px`,
                      height: `${(155 / 172) * sizes.studentPhoto}px`,
                      borderColor: config.themeColor,
                      boxShadow: '4px 4px 0px 0px rgba(250,204,21,1)',
                      transform: undefined
                    }}
                  >
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400">
                        <span className="text-[10px] uppercase font-mono">PHOTO</span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            <div className="flex-1 px-5 pb-5 pt-3 flex flex-col justify-between items-center text-center z-10 text-zinc-900 bg-transparent animate-fade-in">
              <div>
                {renderDraggable(
                  'studentName',
                  'studentName',
                  'Student Name',
                  student.name,
                  (val, styleObj) => (
                    <h2 className="font-display font-black text-base uppercase text-zinc-950 tracking-tight leading-none mb-1.5 text-center" style={styleObj}>
                      {val}
                    </h2>
                  )
                )}

                <div className="inline-block mx-auto">
                  {renderDraggable(
                    'studentMeta',
                    'studentMeta',
                    'Classification Badge',
                    'Project Manager',
                    (val, styleObj) => (
                      <span className="px-3.5 py-0.5 bg-yellow-400 font-sans font-black text-[9px] uppercase tracking-wider rounded-sm text-zinc-900 inline-block border border-zinc-950">
                        {val}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="w-full max-w-[210px]">
                {renderStudentInfoTable('text-zinc-950', 'text-zinc-400')}
              </div>

              <div className="w-full pt-1 bg-white border border-dashed border-zinc-200">
                <BarcodeSVG />
              </div>
            </div>
          </div>
        );
      }
      case 'studio-marceline': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between select-none"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-front-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            
            <div className="absolute top-0 inset-x-0 h-[190px] pointer-events-none z-0" style={{ backgroundColor: config.themeColor }}>
              <svg className="absolute bottom-0 left-0 w-full h-[70px] text-white fill-current" viewBox="0 0 340 70" preserveAspectRatio="none">
                <path d="M0,0 C120,60 220,60 340,0 L340,70 L0,70 Z" />
              </svg>
            </div>

            <div className="pt-6 px-6 text-center z-10 text-white leading-normal">
              {renderDraggable(
                'schoolNameLine1',
                'schoolNameLine1',
                'School Title L1',
                'STUDIO SHODWE',
                (val, styleObj) => (
                  <h2 className="font-display font-black text-xs uppercase tracking-[0.25em] text-white text-center" style={styleObj}>{val}</h2>
                )
              )}
            </div>

            <div className="flex justify-center z-10 mt-20">
              {renderDraggable(
                'studentPhoto',
                'studentPhoto',
                'Photo Container',
                '',
                (val, styleObj) => (
                  <div
                    className="bg-zinc-50 overflow-hidden shrink-0 shadow-lg flex items-center justify-center border-4 border-zinc-900 rounded-full"
                    style={{
                      ...styleObj,
                      width: `${(115 / 172) * sizes.studentPhoto}px`,
                      height: `${(115 / 172) * sizes.studentPhoto}px`,
                      transform: undefined
                    }}
                  >
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-150 text-zinc-400">
                        <span className="text-[9px] uppercase font-mono">PHOTO</span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            <div className="flex-1 px-5 pb-5 pt-2.5 flex flex-col justify-between items-center text-center z-10 bg-transparent text-zinc-900">
              <div>
                {renderDraggable(
                  'studentName',
                  'studentName',
                  'Student Name',
                  student.name,
                  (val, styleObj) => (
                    <h2 className="font-display font-black text-base uppercase text-zinc-950 tracking-wider mb-0.5 leading-tight text-center" style={styleObj}>
                      {val}
                    </h2>
                  )
                )}

                {renderDraggable(
                  'studentMeta',
                  'studentMeta',
                  'Sub-Classification',
                  'Director',
                  (val, styleObj) => (
                    <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-extrabold block text-center" style={styleObj}>
                      {val}
                    </span>
                  )
                )}
              </div>

              <div className="w-full max-w-[210px]">
                {renderStudentInfoTable('text-zinc-950', 'text-zinc-400')}
              </div>

              <div className="w-full pt-1">
                <BarcodeSVG />
              </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 h-2 bg-zinc-900" style={{ backgroundColor: config.themeColor }} />
          </div>
        );
      }
      case 'hexagonal-gallego': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between select-none"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-front-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 340 540" fill="none">
              <polygon points="0,0 340,0 340,195 0,260" fill="#1e3a8a" />
              <polygon points="340,230 340,540 0,540" fill={config.themeColor} opacity="0.08" />
              <line x1="0" y1="260" x2="340" y2="195" stroke={config.themeColor} strokeWidth="4" />
            </svg>

            <div className="pt-5 px-6 block text-left z-10 text-white">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-5 h-5 bg-green-500 rounded-sm flex items-center justify-center font-bold text-[10px] text-white" style={{ backgroundColor: config.themeColor }}>S</div>
                {renderDraggable(
                  'schoolNameLine1',
                  'schoolNameLine1',
                  'School Title L1',
                  'Shodwe Company',
                  (val, styleObj) => (
                    <span className="font-display font-black text-sm uppercase text-white tracking-tight text-left" style={styleObj}>{val}</span>
                  )
                )}
              </div>
            </div>

            <div className="flex justify-center z-10 mt-6 md:mt-8">
              {renderDraggable(
                'studentPhoto',
                'studentPhoto',
                'Photo Container',
                '',
                (val, styleObj) => (
                  <div
                    className="overflow-hidden shrink-0 shadow-lg flex items-center justify-center relative p-1 bg-white border-2 border-zinc-900"
                    style={{
                      ...styleObj,
                      width: `${(135 / 172) * sizes.studentPhoto}px`,
                      height: `${(135 / 172) * sizes.studentPhoto}px`,
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      transform: undefined,
                    }}
                  >
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-full h-full object-cover select-none"
                        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-200 text-zinc-400">
                        <span className="text-[10px] uppercase font-mono">HEX</span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            <div className="flex-1 px-5 pb-5 pt-3.5 flex flex-col justify-between items-center text-center z-10 text-[#1e3a8a] bg-transparent">
              <div>
                {renderDraggable(
                  'studentName',
                  'studentName',
                  'Student Name',
                  student.name,
                  (val, styleObj) => (
                    <h2 className="font-display font-black text-base uppercase text-zinc-950 tracking-wide mb-1 leading-none text-center" style={styleObj}>
                      {val}
                    </h2>
                  )
                )}

                <div className="inline-block mx-auto">
                  {renderDraggable(
                    'studentMeta',
                    'studentMeta',
                    'Sub-Classification',
                    'Project Manager',
                    (val, styleObj) => (
                      <span className="px-4 py-0.5 bg-green-700 font-sans font-black text-[9px] uppercase tracking-wider rounded-full text-white inline-block border border-green-600" style={{ ...styleObj, backgroundColor: config.themeColor }}>
                        {val}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="w-full max-w-[210px]">
                {renderStudentInfoTable('text-zinc-950', 'text-zinc-400')}
              </div>

              <div className="w-full pt-1.5 flex justify-center">
                <BarcodeSVG />
              </div>
            </div>
          </div>
        );
      }
      case 'larana-navy': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between p-6 select-none text-zinc-900"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-front-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}

            {/* Top wavy line pattern */}
            <div className="absolute top-0 inset-x-0 h-[100px] pointer-events-none z-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 340 100" preserveAspectRatio="none">
                <g stroke="#000000" strokeWidth="0.5" fill="none">
                  <path d="M-20,10 Q60,30 140,5 C220,-20 300,40 380,20" />
                  <path d="M-20,20 Q60,40 140,15 C220,-10 300,50 380,30" />
                  <path d="M-20,30 Q60,50 140,25 C220,0 300,60 380,40" />
                  <path d="M-20,40 Q60,60 140,35 C220,10 300,70 380,50" />
                </g>
              </svg>
            </div>

            {/* Bottom Navy Wave Segment */}
            <div className="absolute bottom-0 inset-x-0 h-[280px] pointer-events-none z-0" style={{ backgroundColor: config.themeColor }}>
              <svg className="absolute -top-[50px] inset-x-0 w-full h-[50px]" viewBox="0 0 340 50" preserveAspectRatio="none">
                <path d="M0,50 C100,-20 240,10 340,30 L340,50 L0,50 Z" fill={config.themeColor} />
              </svg>
            </div>

            {/* Header: Institution & Logo */}
            <div className="z-10 flex flex-col items-center pt-2">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                {config.schoolLogo ? (
                  <img src={config.schoolLogo} alt="Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <LogoSVG size={24} className="text-zinc-850 fill-current" />
                )}
                {renderDraggable(
                  'schoolNameLine1',
                  'schoolNameLine1',
                  'School Title L1',
                  'Larana. Inc',
                  (val, styleObj) => (
                    <h2 className="font-display font-black text-sm uppercase tracking-wider text-zinc-950 font-serif" style={styleObj}>{val}</h2>
                  )
                )}
              </div>
            </div>

            {/* Profile Photo */}
            <div className="flex justify-center z-10 mt-2">
              {renderDraggable(
                'studentPhoto',
                'studentPhoto',
                'Photo Container',
                '',
                (val, styleObj) => (
                  <div
                    className="bg-white overflow-hidden shrink-0 shadow-lg flex items-center justify-center border-4 rounded-full"
                    style={{
                      ...styleObj,
                      width: `${(120 / 172) * sizes.studentPhoto}px`,
                      height: `${(120 / 172) * sizes.studentPhoto}px`,
                      borderColor: '#ffffff',
                      transform: undefined,
                    }}
                  >
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-300">👤</div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Details Content on Dark Navy Backdrop */}
            <div className="z-10 flex flex-col items-center text-center text-white mt-1">
              {renderDraggable(
                'studentName',
                'studentName',
                'Student Name',
                student.name,
                (val, styleObj) => (
                  <h1 className="font-display font-black text-[18px] uppercase tracking-wide leading-tight text-white mb-0.5 font-serif" style={styleObj}>
                    {val}
                  </h1>
                )
              )}
              {renderDraggable(
                'studentDesignation',
                'studentDesignation',
                'Designation',
                student.role || 'CEO',
                (val, styleObj) => (
                  <span className="font-mono text-[9px] uppercase tracking-widest font-extrabold text-white/70 block mb-3.5" style={styleObj}>
                    {val}
                  </span>
                )
              )}

              <div className="w-full max-w-[210px] mx-auto mb-2">
                {renderStudentInfoTable('text-white', 'text-white/65')}
              </div>

              {/* Barcode SVG */}
              <div className="bg-white p-0.5 rounded shadow-sm text-center w-full max-w-[210px] mx-auto mt-1 mb-2">
                <BarcodeSVG />
              </div>

              {/* Footer url */}
              <span className="text-[7.5px] font-mono tracking-widest uppercase text-white/40 block">
                WWW.REALLYGREATSITE.COM
              </span>
            </div>
          </div>
        );
      }
      case 'ginyard-shawn': {
        return (
          <div
            className="absolute inset-0 bg-zinc-950 shadow-lg overflow-hidden flex flex-col justify-between select-none"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-front-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            
            <div className="absolute top-0 inset-x-0 h-[170px] bg-sky-500 pointer-events-none z-0" style={{ backgroundColor: config.themeColor }}>
              <svg className="absolute bottom-0 left-0 w-full h-[60px]" viewBox="0 0 340 60" preserveAspectRatio="none">
                <path d="M0,40 C140,80 220,-20 340,40 L340,60 L0,60 Z" fill="#090a0f" />
              </svg>
            </div>

            <div className="pt-5 px-5 z-10 flex gap-2.5 items-center justify-center text-white">
              <span className="text-lg">🏢</span>
              {renderDraggable(
                'schoolNameLine1',
                'schoolNameLine1',
                'School Title L1',
                'Ginyard International Co.',
                (val, styleObj) => (
                  <h2 className="font-display font-black text-xs uppercase tracking-tight text-white text-center" style={styleObj}>{val}</h2>
                )
              )}
            </div>

            <div className="flex justify-center z-10 mt-16">
              {renderDraggable(
                'studentPhoto',
                'studentPhoto',
                'Photo Container',
                '',
                (val, styleObj) => (
                  <div
                    className="bg-zinc-50 overflow-hidden shrink-0 shadow-lg flex items-center justify-center border-4 rounded-full"
                    style={{
                      ...styleObj,
                      width: `${(120 / 172) * sizes.studentPhoto}px`,
                      height: `${(120 / 172) * sizes.studentPhoto}px`,
                      borderColor: config.themeColor,
                      transform: undefined,
                    }}
                  >
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500">
                        <span className="text-[10px] uppercase font-mono">IMAGE</span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            <div className="flex-1 px-5 pb-5 pt-3.5 flex flex-col justify-between items-center text-center z-10 text-white bg-transparent">
              <div>
                {renderDraggable(
                  'studentName',
                  'studentName',
                  'Student Name',
                  student.name,
                  (val, styleObj) => (
                    <h2 className="font-display font-black text-base uppercase text-white tracking-widest leading-none mb-1.5 text-center" style={styleObj}>
                      {val}
                    </h2>
                  )
                )}

                {renderDraggable(
                  'studentMeta',
                  'studentMeta',
                  'Sub-Classification',
                  'MARKETING',
                  (val, styleObj) => (
                    <span className="text-[10px] font-mono tracking-[0.3em] font-extrabold text-[#0ea5e9] uppercase block text-center" style={{ ...styleObj, color: config.themeColor }}>
                      {val}
                    </span>
                  )
                )}
              </div>

              <div className="w-full max-w-[210px]">
                {renderStudentInfoTable('text-white', 'text-zinc-500')}
              </div>

              <div className="w-full bg-white p-1 rounded mt-1">
                <BarcodeSVG />
              </div>
            </div>
          </div>
        );
      }
      default: {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex select-none"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-front-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
      
            <div className="flex-1 flex flex-col justify-between py-5 pl-5 pr-2 relative h-full z-10">
              <div className="flex items-center gap-2">
                {renderDraggable(
                  'schoolLogo',
                  'schoolLogo',
                  'School Logo',
                  '',
                  (val, styleObj) => (
                    <button className="focus:outline-none shrink-0" style={styleObj}>
                      {config.schoolLogo ? (
                        <img
                          src={config.schoolLogo}
                          alt="Logo"
                          className="object-contain"
                          style={{ width: `${sizes.schoolLogo}px`, height: `${sizes.schoolLogo}px` }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <LogoSVG size={sizes.schoolLogo} className="flex-shrink-0" />
                      )}
                    </button>
                  )
                )}
      
                <div className="leading-[1.1] flex flex-col justify-center flex-1 pr-1">
                  {config.schoolTitleLines && config.schoolTitleLines.length > 0 ? (
                    config.schoolTitleLines.map((line) => (
                      <div key={line.id} className="w-full">
                        {renderDraggable(
                          `schoolTitleLine-${line.id}`,
                          'schoolNameLine1',
                          `Title Line`,
                          line.text,
                          (val, styleObj) => (
                            <div style={styleObj} className="uppercase break-words font-display tracking-tight text-left">
                              {val}
                            </div>
                          )
                        )}
                      </div>
                    ))
                  ) : (
                    <>
                      {renderDraggable(
                        'schoolNameLine1',
                        'schoolNameLine1',
                        'School Title L1',
                        `${config.schoolNamePre || 'DOBOKA'} ${config.schoolNameSuf || 'SR.'}`,
                        (val, styleObj) => (
                          <div style={styleObj} className="font-extrabold uppercase break-words text-left flex gap-1 font-display leading-tight">
                            {val}
                          </div>
                        )
                      )}
                      {renderDraggable(
                        'schoolNameLine2',
                        'schoolNameLine2',
                        'School Title L2',
                        `${config.schoolNameLine2Pre || 'SEC. SCH'} ${config.schoolNameLine2Suf || 'OOL'}`,
                        (val, styleObj) => (
                          <div style={styleObj} className="font-extrabold uppercase break-words text-left text-zinc-650 flex gap-1 font-display leading-tight">
                            {val}
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>
              </div>
      
              <div className="flex justify-center my-2 relative">
                {renderDraggable(
                  'studentPhoto',
                  'studentPhoto',
                  'Photo Container',
                  '',
                  (val, styleObj) => (
                    <div
                      className="bg-zinc-50 overflow-hidden relative shrink-0 shadow-inner flex items-center justify-center border-3 border-zinc-900"
                      style={{
                        ...styleObj,
                        width: `${sizes.studentPhoto}px`,
                        height: `${sizes.studentPhoto * 1.25}px`,
                        borderRadius: '20px',
                        borderColor: config.themeColor,
                        transform: undefined
                      }}
                    >
                      {student.photo ? (
                        <img
                          src={student.photo}
                          alt={student.name}
                          className="w-full h-full object-cover select-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400">
                          <svg style={{ width: `${sizes.studentPhoto * 0.4}px`, height: `${sizes.studentPhoto * 0.4}px` }} className="opacity-70" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                          <span className="uppercase font-mono tracking-wider font-semibold text-[8px] text-zinc-500 mt-2 select-none">
                            No Photo Loaded
                          </span>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
      
              <div className="flex flex-col pl-1 z-10 w-full text-zinc-900 leading-tight">
                {renderDraggable(
                  'studentName',
                  'studentName',
                  'Student Name',
                  student.name,
                  (val, styleObj) => (
                    <h2
                      className="font-display font-black leading-none uppercase mb-2 mr-3 max-h-[55px] overflow-hidden break-words line-clamp-2 text-left"
                      style={{ ...styleObj, color: styleObj.color || config.themeColor }}
                    >
                      {val}
                    </h2>
                  )
                )}
      
                <div className="mr-3 pr-2 border-t border-zinc-150 pt-1">
                  {renderStudentInfoTable('text-zinc-950', 'text-zinc-500')}
                </div>
      
                <div className="flex flex-col gap-1 mt-2">
                  {config.customTextBoxes && config.customTextBoxes.filter(b => b.side === 'front').map(box => (
                    <div key={box.id} className="w-full text-left">
                      {renderDraggable(
                        `customTextBox-${box.id}`,
                        'studentMeta',
                        `${box.label} Box`,
                        box.value,
                        (val, styleObj) => (
                          <div style={styleObj} className="font-sans leading-none flex items-center text-xs">
                            <span className="font-black pr-1.5 uppercase tracking-wide text-zinc-500 text-[10px] shrink-0 font-mono">{box.label}:</span>
                            <span className="font-bold text-zinc-900">{val}</span>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
      
              <div className="absolute bottom-0 left-0 w-12 h-12 pointer-events-none z-0">
                <div className="absolute bottom-0 left-0 w-7 h-7 rounded-tr-lg" style={{ backgroundColor: config.themeColor }} />
              </div>
            </div>
      
            <div
              className="w-[60px] h-full relative flex items-center justify-center select-none shrink-0"
              style={{ backgroundColor: config.themeColor }}
            >
              {renderDraggable(
                'sideStripeText',
                'sideStripeText',
                'Front Vertical Strap',
                "STUDENT'S IDENTITY CARD",
                (val, styleObj) => (
                  <div
                    className="transform rotate-90 whitespace-nowrap font-display font-black tracking-[0.14em] text-white uppercase text-center"
                    style={{
                      width: '400px',
                      transformOrigin: 'center center',
                      fontSize: styleObj.fontSize,
                      letterSpacing: styleObj.letterSpacing,
                      color: '#ffffff'
                    }}
                  >
                    {val}
                  </div>
                )
              )}
            </div>
          </div>
        );
      }
    }
  };

  const BackSide = () => {
    currentRenderSide = 'back';
    const layout = config.layoutStyle || 'academic';

    switch (layout) {
      case 'pathway': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between p-5 select-none text-zinc-900"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-back-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            
            <svg className="absolute inset-x-0 bottom-0 w-full h-[155px] pointer-events-none z-0" viewBox="0 0 340 155" fill="none">
              <path d="M 0 100 Q 140 150, 340 80 L 340 155 L 0 155 Z" fill={config.themeColor} />
              <path d="M 0 85 Q 160 110, 340 60 L 340 155 L 0 155 Z" fill={config.themeColor} opacity="0.3" />
            </svg>

            <div className="flex justify-between items-center z-10 border-b border-zinc-150 pb-2">
              <LogoSVG size={45} className="text-zinc-800 fill-current" />
              <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold text-zinc-400">Campus Code Regulation System</span>
            </div>

            {/* Centered space for our beautiful Principal Signature Place or Terms */}
            <div className="flex-1 flex flex-col justify-center items-center z-10 pt-4 w-full">
              {renderBackMainContent('text-zinc-800', 'border-zinc-350')}
            </div>

            {renderPolicyLine('rgba(0,0,0,0.6)')}

            <div className="flex justify-between items-end z-10 pt-2 text-white">
              <span className="bg-[#1A1C1D] text-white border border-[#2D1B13]/30 font-mono font-extrabold text-[8px] tracking-wider px-3 py-1 rounded-full uppercase truncate shadow-lg">
                @REALLYGREATSITE
              </span>
              <div className="w-16 h-8 opacity-45 select-none pointer-events-none">
                <BarcodeSVG />
              </div>
            </div>
          </div>
        );
      }
      case 'ingoude-kimberly': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between select-none text-zinc-900"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-back-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            {/* Top dark stripe */}
            <div className="absolute top-0 inset-x-0 h-[100px] bg-zinc-900 pointer-events-none z-0" style={{ backgroundColor: config.themeColor !== '#D32F2F' ? config.themeColor : '#18181b' }}>
              <div className="absolute bottom-4 inset-x-0 text-center text-white/40 font-mono text-[9px] tracking-widest uppercase font-bold">SECURE CREDENTIALS RECORD</div>
            </div>
            
            <div className="mt-[110px] text-center px-5 flex-1 flex flex-col justify-between z-10 select-none w-full">
              <div className="flex-1 flex flex-col justify-center items-center w-full">
                {renderBackMainContent('text-zinc-850', 'border-zinc-300')}
              </div>

              {renderPolicyLine('rgba(0,0,0,0.6)')}

              <div className="border-t border-zinc-150 pt-2 pb-3">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[7.5px] font-mono text-zinc-400 uppercase tracking-widest leading-none font-black truncate">INC. VERIFIED TRUST</span>
                  <BarcodeSVG />
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'ingoude-francois': {
        return (
          <div
            className="absolute inset-0 bg-zinc-950 shadow-lg overflow-hidden flex flex-col justify-between p-6 select-none text-white"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-back-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            {/* Top decorative accent border */}
            <div className="absolute top-0 inset-x-0 h-2" style={{ backgroundColor: config.themeColor }} />
            
            <div className="p-4 flex-1 flex flex-col justify-between z-10 text-center select-none w-full">
              <div className="flex-1 flex flex-col justify-center items-center w-full">
                {renderBackMainContent('text-white', 'border-zinc-800/80', '#ffffff')}
              </div>

              {renderPolicyLine('rgba(255,255,255,0.7)')}

              <div className="pt-3 border-t border-zinc-800">
                <div className="bg-white p-1 rounded max-w-[200px] mx-auto mb-2">
                  <BarcodeSVG />
                </div>
                <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest block">INGOUDE CORP SECURE ID v2.09</span>
              </div>
            </div>
          </div>
        );
      }
      case 'energized': {
        return (
          <div
            className="absolute inset-0 shadow-lg overflow-hidden flex flex-col justify-between py-6 px-5 select-none text-white"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              backgroundColor: config.themeColor,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-back-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 font-display font-black text-[120px] select-none pointer-events-none uppercase">⚡</div>

            <div className="z-10 flex justify-between items-center border-b border-white/20 pb-2 select-none">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span>⚡</span>
                <span className="font-display font-black tracking-widest uppercase text-white">ENERGIZED ACCESS</span>
              </div>
              <span className="font-mono text-[8px] font-black uppercase text-white/70">REGULATION PANEL</span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center z-10 w-full">
              {renderBackMainContent('text-white', 'border-white/20', '#ffffff')}
            </div>

            {renderPolicyLine('rgba(255,255,255,0.85)')}

            <div className="z-10 bg-white p-1 rounded-lg shadow-inner">
              <BarcodeSVG className="mx-auto" />
            </div>
          </div>
        );
      }
      case 'shodwe-cia': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between p-5 select-none text-zinc-900"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: config.themeColor || '#18191b',
              borderRadius: '24px',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
              boxSizing: 'border-box',
            }}
            id={`card-back-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-full opacity-60 pointer-events-none transform translate-x-10 -translate-y-10" />
            
            {/* Elegant Top Decorative Stripe mimicking a realistic print-friendly badge */}
            <div className="absolute top-0 inset-x-0 h-2 z-20 pointer-events-none" style={{ backgroundColor: config.themeColor }} />

            <div className="z-10 border-b-2 border-zinc-900 pb-2 flex justify-between items-center select-none">
              <div className="flex items-center gap-1 font-bold text-xs tracking-wider uppercase font-display text-zinc-900">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.themeColor }} />
                <span>STUDIO SHODWE</span>
              </div>
              <span className="font-mono text-[8px] font-extrabold uppercase text-zinc-400">AUTHORITY CODES</span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center z-10 pt-4 w-full">
              {renderBackMainContent('text-zinc-800', 'border-zinc-350')}
            </div>

            {renderPolicyLine('rgba(0,0,0,0.6)')}

            <div className="z-10 flex justify-between items-center border-t border-zinc-150 pt-2.5 select-none">
              <span className="text-[7.5px] font-mono text-zinc-400 font-extrabold tracking-wider uppercase">SHODWE SECURITY SYSTEMS</span>
              <BarcodeSVG />
            </div>
          </div>
        );
      }
      case 'ingoude-morgan': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between p-6 select-none text-zinc-900"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-back-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            {/* Top color bar */}
            <div className="absolute top-0 inset-x-0 h-4" style={{ backgroundColor: config.themeColor }} />
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-100 font-display font-black text-[100px] pointer-events-none select-none uppercase">INGOUDE</div>

            <div className="z-10 flex justify-between items-center border-b border-zinc-200 pb-2 select-none">
              <LogoSVG size={28} className="text-zinc-850 fill-current" />
              <span className="font-mono text-[9px] uppercase tracking-widest font-black text-zinc-400">CREDENTIAL POLICY</span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center z-10 pt-4 w-full">
              {renderBackMainContent('text-zinc-800', 'border-zinc-350')}
            </div>

            {renderPolicyLine('rgba(0,0,0,0.6)')}

            <div className="z-10 flex flex-col items-center pt-2.5 border-t border-zinc-150 select-none">
              <BarcodeSVG />
              <span className="text-[7px] font-mono uppercase tracking-[0.2em] text-zinc-400 mt-1">ID CODES COMPLIANT</span>
            </div>
          </div>
        );
      }
      case 'studio-marceline': {
        return (
          <div
            className="absolute inset-0 bg-zinc-900 shadow-lg overflow-hidden flex flex-col justify-between p-6 select-none text-white"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-back-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            <div className="absolute inset-0 bg-stripes-zinc-800 opacity-10 pointer-events-none" />

            <div className="z-10 border-b border-white/10 pb-2 flex justify-between items-center select-none">
              <LogoSVG size={28} className="text-white fill-current" />
              <span className="font-mono text-[9px] uppercase tracking-widest font-black text-zinc-500">STUDIO SHODWE MEMBERSHIP</span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center z-10 pt-4 w-full">
              {renderBackMainContent('text-white', 'border-zinc-800/85', '#ffffff')}
            </div>

            {renderPolicyLine('rgba(255,255,255,0.73)')}

            <div className="z-10 bg-white p-1 rounded max-w-[210px] mx-auto shadow-md select-none">
              <BarcodeSVG />
            </div>
          </div>
        );
      }
      case 'hexagonal-gallego': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between p-6 select-none text-zinc-900"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-back-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            {/* Hexagonal decorative background vector */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="hex-grid-back" width="10" height="17.32" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
                  <path d="M5 0 L10 2.89 L10 8.66 L5 11.55 L0 8.66 L0 2.89 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                  <path d="M5 17.32 L10 14.43 L10 8.66 L5 5.77 L0 8.66 L0 14.43 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#hex-grid-back)" />
            </svg>

            {/* Accent color bar */}
            <div className="absolute top-0 inset-x-0 h-4" style={{ backgroundColor: config.themeColor }} />

            <div className="z-10 flex justify-between items-center border-b border-zinc-200 pb-2 select-none">
              <LogoSVG size={28} className="text-zinc-800 fill-current" />
              <span className="font-mono text-[9px] uppercase tracking-widest font-extrabold text-zinc-400">CORPORATE BACKING</span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center z-10 pt-4 w-full">
              {renderBackMainContent('text-zinc-800', 'border-zinc-300')}
            </div>

            {renderPolicyLine('rgba(0,0,0,0.6)')}

            <div className="z-10 flex flex-col items-center justify-center pt-2.5 border-t border-zinc-150 select-none">
              <BarcodeSVG />
              <span className="text-[7px] font-mono uppercase tracking-[0.2em] text-zinc-400 mt-1">SECURE ACCESS TOKEN</span>
            </div>
          </div>
        );
      }
      case 'larana-navy': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between p-6 select-none text-zinc-900"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-back-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}

            {/* Top dark stripe */}
            <div className="absolute top-0 inset-x-0 h-[100px] pointer-events-none z-0 flex flex-col items-center justify-center p-4 text-white" style={{ backgroundColor: config.themeColor }}>
              <div className="flex items-center gap-1.5 justify-center mb-1">
                {config.schoolLogo ? (
                  <img src={config.schoolLogo} alt="Logo" className="w-6 h-6 object-contain invert brightness-0" referrerPolicy="no-referrer" />
                ) : (
                  <LogoSVG size={22} className="text-white fill-current" />
                )}
                <span className="font-display font-black text-sm uppercase tracking-wider text-white font-serif">Larana. Inc</span>
              </div>
            </div>

            <div className="mt-[110px] text-center px-5 flex-1 flex flex-col justify-between z-10 select-none w-full">
              <div className="flex-1 flex flex-col justify-center items-center w-full">
                {renderBackMainContent('text-zinc-850', 'border-zinc-300')}
              </div>

              {renderPolicyLine('rgba(0,0,0,0.6)')}

              <div className="border-t border-zinc-150 pt-3 pb-3">
                <span className="text-[7.5px] font-mono tracking-widest uppercase text-zinc-400 block mb-1">
                  WWW.REALLYGREATSITE.COM
                </span>
                <span className="text-[6.5px] font-mono text-zinc-350 uppercase block">SECURITY SYSTEM REGISTERED</span>
              </div>
            </div>
          </div>
        );
      }
      case 'ginyard-shawn': {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex flex-col justify-between p-5 select-none text-zinc-900"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: config.themeColor || '#18191b',
              borderRadius: '24px',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
              boxSizing: 'border-box',
            }}
            id={`card-back-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
            
            {/* Bottom themed printing-ready badge accent bar */}
            <div className="absolute bottom-0 inset-x-0 h-2 z-20 pointer-events-none" style={{ backgroundColor: config.themeColor }} />
            
            <div className="absolute top-0 inset-x-0 h-[100px] bg-slate-50 pointer-events-none z-0 border-b border-zinc-100 flex items-center justify-center">
              <span className="text-zinc-300 font-display font-black text-[50px] uppercase opacity-20">GINYARD</span>
            </div>

            <div className="mt-[110px] z-10 flex-1 flex flex-col justify-between text-center select-none w-full">
              <div className="flex-1 flex flex-col justify-center items-center w-full">
                {renderBackMainContent('text-zinc-855', 'border-zinc-300')}
              </div>

              {renderPolicyLine('rgba(0,0,0,0.6)')}

              <div className="flex justify-between items-center border-t border-zinc-150 pt-3">
                <span className="text-[8px] font-mono text-zinc-400 uppercase font-black leading-none">VERIFIED MEMBER</span>
                <BarcodeSVG />
              </div>
            </div>
          </div>
        );
      }
      default: {
        return (
          <div
            className="absolute inset-0 bg-white shadow-lg overflow-hidden flex select-none"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              borderRadius: '24px',
              border: '1px solid #18191b',
              boxSizing: 'border-box',
              boxShadow: isPrinting ? 'none' : '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
            }}
            id={`card-back-${student.id}`}
          >
            {renderDraftGridOverlay(config.draftGridType)}
      
            <div
              className="w-[60px] h-full relative flex items-center justify-center select-none shrink-0"
              style={{ backgroundColor: config.themeColor }}
            >
              {renderDraggable(
                'sideStripeText',
                'sideStripeText',
                'Back Vertical Strap',
                `ACADEMIC YEAR: ${config.session}`,
                (val, styleObj) => (
                  <div
                    className="transform -rotate-90 whitespace-nowrap font-display font-black tracking-[0.14em] text-white uppercase text-center"
                    style={{
                      width: '400px',
                      transformOrigin: 'center center',
                      fontSize: styleObj.fontSize,
                      letterSpacing: styleObj.letterSpacing,
                      color: '#ffffff'
                    }}
                  >
                    {val}
                  </div>
                )
              )}
            </div>
      
            <div className="flex-1 flex flex-col justify-between p-5 relative h-full z-10 text-zinc-900">
              
              <div className="flex justify-center mt-2 pb-1.5 border-b border-zinc-200 border-dashed">
                {renderDraggable(
                  'backLogo',
                  'backLogo',
                  'Back Logo Seal',
                  '',
                  (val, styleObj) => (
                    <div 
                      className="bg-white p-1 rounded-full shadow-sm flex items-center justify-center border border-zinc-200"
                      style={{ width: `${sizes.backLogo + 8}px`, height: `${sizes.backLogo + 8}px` }}
                    >
                      {config.schoolLogo ? (
                        <img
                          src={config.schoolLogo}
                          alt="Logo"
                          className="object-contain"
                          style={{ width: `${sizes.backLogo}px`, height: `${sizes.backLogo}px` }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <LogoSVG size={sizes.backLogo} />
                      )}
                    </div>
                  )
                )}
              </div>
      
              <div className="text-left flex-1 pt-2.5">
                {renderDraggable(
                  'backTermsTitle',
                  'backTermsTitle',
                  'Terms Header',
                  'TERMS & Campus Code',
                  (val, styleObj) => (
                    <h3 style={styleObj} className="text-center font-display font-black text-zinc-950 uppercase tracking-widest mb-2 border-b border-zinc-300 pb-0.5">
                      {val}
                    </h3>
                  )
                )}
                <div className="flex flex-col gap-2">
                  {(config.terms || []).map((term, idx) => (
                    <div key={term.id || `term-${idx}`}>
                      {renderDraggable(
                        `backTermsText-${term.id}`,
                        'backTermsText',
                        `Rule Bullet #${idx + 1}`,
                        term.text,
                        (val, styleObj) => (
                          <div className="leading-[1.25] font-sans text-left flex items-start gap-1" style={styleObj}>
                            <span className="font-extrabold pr-0.5 uppercase select-none shrink-0" style={{ color: styleObj.color || config.themeColor || '#111', fontSize: styleObj.fontSize }}>▪</span>
                            <p className="text-left" style={styleObj}>
                              <span className="font-extrabold pr-1 uppercase text-zinc-800" style={{ color: styleObj.color || 'inherit' }}>
                                {term.label}:
                              </span>
                              <span style={{ color: styleObj.color || '#4b5563' }}>{val}</span>
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
      
                <div className="flex flex-col gap-1 mt-3 text-left">
                  {config.customTextBoxes && config.customTextBoxes.filter(b => b.side === 'back').map(box => (
                    <div key={box.id} className="w-full">
                      {renderDraggable(
                        `customTextBox-${box.id}`,
                        'studentMeta',
                        `${box.label} Box`,
                        box.value,
                        (val, styleObj) => (
                          <div style={styleObj} className="font-sans leading-none flex items-center text-xs text-left">
                            <span className="font-black pr-1.5 uppercase tracking-wide text-zinc-500 text-[9px] shrink-0 font-mono text-left">{box.label}:</span>
                            <span className="font-bold text-zinc-900 text-left">{val}</span>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
      
              </div>
      
              {renderPolicyLine('rgba(0,0,0,0.6)')}

              <div className="mt-1 text-center flex flex-col items-center">
                {renderDraggable(
                  'principalSign',
                  'principalSign',
                  'Signature PNG',
                  '',
                  (val, styleObj) => (
                    <div 
                      className="flex items-center justify-center relative mb-0.5"
                      style={{ width: `${sizes.principalSign * 3.5}px`, height: `${sizes.principalSign}px` }}
                    >
                      {config.principalSign ? (
                        <img
                          src={config.principalSign}
                          alt="Authorized Sign"
                          className="max-w-full max-h-full object-contain filter drop-shadow font-sans text-2xs text-zinc-400"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <SignatureSVG size={sizes.principalSign} className="-mt-1 pointer-events-none" strokeColor={config.themeColor} />
                      )}
                    </div>
                  )
                )}
                <div className="w-[170px] border-t border-zinc-900/60 border-solid" />
                {renderDraggable(
                  'principalName',
                  'principalName',
                  'Principal Name Text',
                  config.principalName,
                  (val, styleObj) => (
                    <span style={styleObj} className="font-mono tracking-wider font-extrabold text-zinc-800 uppercase mt-0.5 block">
                      {val}
                    </span>
                  )
                )}
              </div>
      
              <div className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none z-0">
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-tl-lg" style={{ backgroundColor: config.themeColor }} />
              </div>
            </div>
          </div>
        );
      }
    }
  };

  const wrapStyle: React.CSSProperties = {
    width: `${baseWidth * scale}px`,
    height: `${baseHeight * scale}px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexShrink: 0,
    pageBreakInside: 'avoid',
  };

  const scaledInnerStyle: React.CSSProperties = {
    width: `${baseWidth}px`,
    height: `${baseHeight}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    flexShrink: 0,
  };

  // NEW DIRECT RE-ORDERING, DELETIONS, ADDING & DYNAMIC TEXT BOXES CONTROLLERS inline editor toolbar
  const renderStyleToolbar = () => {
    if (isPrinting || !designerMode || !selectedElement || !setConfig) return null;

    const isCustomBox = selectedElement.startsWith('customTextBox-');
    const isSchoolTitleLine = selectedElement.startsWith('schoolTitleLine-');

    const displayName = selectedElement.replace(/([A-Z])/g, ' $1').trim().replace('schoolTitleLine-', 'Line ').replace('customTextBox-', 'Box: ').toUpperCase();

    // Get current formatting configurations
    let customStyle: any = {
      bold: false,
      italic: false,
      underline: false,
      color: '',
      fontSize: 14,
      fontFamily: 'Inter',
      letterSpacing: 'normal',
      lineHeight: 'normal',
      offsetX: 0,
      offsetY: 0
    };

    if (isCustomBox) {
      const boxId = selectedElement.replace('customTextBox-', '');
      const box = config.customTextBoxes?.find(b => b.id === boxId);
      if (box) {
        customStyle = {
          bold: box.bold,
          italic: box.italic,
          underline: box.underline,
          color: box.color ?? '',
          fontSize: box.fontSize ?? 13,
          fontFamily: box.fontFamily ?? 'Inter',
          letterSpacing: box.letterSpacing ?? 'normal',
          offsetX: box.offsetX,
          offsetY: box.offsetY
        };
      }
    } else if (isSchoolTitleLine) {
      const lineId = selectedElement.replace('schoolTitleLine-', '');
      const line = config.schoolTitleLines?.find(l => l.id === lineId);
      if (line) {
        customStyle = {
          bold: line.bold,
          italic: line.italic,
          underline: line.underline,
          color: line.color ?? '',
          fontSize: line.fontSize ?? 14,
          fontFamily: line.fontFamily ?? 'Inter',
          letterSpacing: line.letterSpacing ?? 'normal',
          lineHeight: line.lineHeight ?? 'normal'
        };
      }
      const styles = config.textStyles?.[selectedElement] || {};
      customStyle.offsetX = styles.offsetX ?? 0;
      customStyle.offsetY = styles.offsetY ?? 0;
    } else {
      const styles = config.textStyles?.[selectedElement] || {};
      const fallbackSizesUnscaled: Record<string, number> = {
        schoolLogo: 52,
        schoolNameLine1: 19,
        schoolNameLine2: 19,
        studentPhoto: 172,
        studentName: 26,
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
        fieldFatherNameVal: 14.5,
        fieldDobVal: 14.5,
      };
      let baseKey = selectedElement;
      if (selectedElement.startsWith('backTermsText-')) {
        baseKey = 'backTermsText';
      } else if (selectedElement.startsWith('studentMeta-')) {
        baseKey = 'studentMeta';
      }
      const defSize = config.sizes?.[baseKey as keyof typeof config.sizes] ?? fallbackSizesUnscaled[baseKey] ?? 14;
      customStyle = {
        bold: styles.bold ?? false,
        italic: styles.italic ?? false,
        underline: styles.underline ?? false,
        color: styles.color ?? '',
        fontSize: styles.customSize ?? defSize,
        fontFamily: styles.fontFamily ?? 'Inter',
        letterSpacing: styles.letterSpacing ?? 'normal',
        lineHeight: styles.lineHeight ?? 'normal',
        offsetX: styles.offsetX ?? 0,
        offsetY: styles.offsetY ?? 0
      };
    }

    const handleToggleStyle = (styleKey: 'bold' | 'italic' | 'underline') => {
      if (isCustomBox) {
        const boxId = selectedElement.replace('customTextBox-', '');
        setConfig(prev => ({
          ...prev,
          customTextBoxes: (prev.customTextBoxes || []).map(b => 
            b.id === boxId ? { ...b, [styleKey]: !b[styleKey] } : b
          )
        }));
      } else if (isSchoolTitleLine) {
        const lineId = selectedElement.replace('schoolTitleLine-', '');
        setConfig(prev => ({
          ...prev,
          schoolTitleLines: (prev.schoolTitleLines || []).map(l => 
            l.id === lineId ? { ...l, [styleKey]: !l[styleKey] } : l
          )
        }));
      } else {
        setConfig(prev => {
          const styles = prev.textStyles || {};
          return {
            ...prev,
            textStyles: {
              ...styles,
              [selectedElement]: {
                ...styles[selectedElement],
                [styleKey]: !styles[selectedElement]?.[styleKey],
              }
            }
          };
        });
      }
    };

    const handleColorChange = (hex?: string) => {
      if (isCustomBox) {
        const boxId = selectedElement.replace('customTextBox-', '');
        setConfig(prev => ({
          ...prev,
          customTextBoxes: (prev.customTextBoxes || []).map(b => 
            b.id === boxId ? { ...b, color: hex } : b
          )
        }));
      } else if (isSchoolTitleLine) {
        const lineId = selectedElement.replace('schoolTitleLine-', '');
        setConfig(prev => ({
          ...prev,
          schoolTitleLines: (prev.schoolTitleLines || []).map(l => 
            l.id === lineId ? { ...l, color: hex } : l
          )
        }));
      } else {
        setConfig(prev => {
          const styles = prev.textStyles || {};
          return {
            ...prev,
            textStyles: {
              ...styles,
              [selectedElement]: {
                ...styles[selectedElement],
                color: hex,
              }
            }
          };
        });
      }
    };

    const handleSizeSlider = (sz: number) => {
      if (isCustomBox) {
        const boxId = selectedElement.replace('customTextBox-', '');
        setConfig(prev => ({
          ...prev,
          customTextBoxes: (prev.customTextBoxes || []).map(b => 
            b.id === boxId ? { ...b, fontSize: sz } : b
          )
        }));
      } else if (isSchoolTitleLine) {
        const lineId = selectedElement.replace('schoolTitleLine-', '');
        setConfig(prev => ({
          ...prev,
          schoolTitleLines: (prev.schoolTitleLines || []).map(l => 
            l.id === lineId ? { ...l, fontSize: sz } : l
          )
        }));
      } else {
        setConfig(prev => {
          const styles = prev.textStyles || {};
          return {
            ...prev,
            textStyles: {
              ...styles,
              [selectedElement]: {
                ...styles[selectedElement],
                customSize: sz,
              }
            }
          };
        });
      }
    };

    const handleFontFamilySlider = (family: string) => {
      if (isCustomBox) {
        const boxId = selectedElement.replace('customTextBox-', '');
        setConfig(prev => ({
          ...prev,
          customTextBoxes: (prev.customTextBoxes || []).map(b => 
            b.id === boxId ? { ...b, fontFamily: family } : b
          )
        }));
      } else if (isSchoolTitleLine) {
        const lineId = selectedElement.replace('schoolTitleLine-', '');
        setConfig(prev => ({
          ...prev,
          schoolTitleLines: (prev.schoolTitleLines || []).map(l => 
            l.id === lineId ? { ...l, fontFamily: family } : l
          )
        }));
      } else {
        setConfig(prev => {
          const styles = prev.textStyles || {};
          return {
            ...prev,
            textStyles: {
              ...styles,
              [selectedElement]: {
                ...styles[selectedElement],
                fontFamily: family,
              }
            }
          };
        });
      }
    };

    const handleSpacingSlider = (spacing: string) => {
      if (isCustomBox) {
        const boxId = selectedElement.replace('customTextBox-', '');
        setConfig(prev => ({
          ...prev,
          customTextBoxes: (prev.customTextBoxes || []).map(b => 
            b.id === boxId ? { ...b, letterSpacing: spacing } : b
          )
        }));
      } else if (isSchoolTitleLine) {
        const lineId = selectedElement.replace('schoolTitleLine-', '');
        setConfig(prev => ({
          ...prev,
          schoolTitleLines: (prev.schoolTitleLines || []).map(l => 
            l.id === lineId ? { ...l, letterSpacing: spacing } : l
          )
        }));
      } else {
        setConfig(prev => {
          const styles = prev.textStyles || {};
          return {
            ...prev,
            textStyles: {
              ...styles,
              [selectedElement]: {
                ...styles[selectedElement],
                letterSpacing: spacing,
              }
            }
          };
        });
      }
    };

    const handleLineHeightSlider = (lh: string) => {
      if (isSchoolTitleLine) {
        const lineId = selectedElement.replace('schoolTitleLine-', '');
        setConfig(prev => ({
          ...prev,
          schoolTitleLines: (prev.schoolTitleLines || []).map(l => 
            l.id === lineId ? { ...l, lineHeight: lh } : l
          )
        }));
      } else if (!isCustomBox) {
        setConfig(prev => {
          const styles = prev.textStyles || {};
          return {
            ...prev,
            textStyles: {
              ...styles,
              [selectedElement]: {
                ...styles[selectedElement],
                lineHeight: lh,
              }
            }
          };
        });
      }
    };

    const handleNudgeOffset = (dx: number, dy: number) => {
      if (isCustomBox) {
        const boxId = selectedElement.replace('customTextBox-', '');
        setConfig(prev => ({
          ...prev,
          customTextBoxes: (prev.customTextBoxes || []).map(b => 
            b.id === boxId 
              ? { ...b, offsetX: (b.offsetX ?? 0) + dx, offsetY: (b.offsetY ?? 0) + dy } 
              : b
          )
        }));
      } else {
        setConfig(prev => {
          const styles = prev.textStyles || {};
          return {
            ...prev,
            textStyles: {
              ...styles,
              [selectedElement]: {
                ...styles[selectedElement],
                offsetX: (styles[selectedElement]?.offsetX ?? 0) + dx,
                offsetY: (styles[selectedElement]?.offsetY ?? 0) + dy,
              }
            }
          };
        });
      }
    };

    // For re-ordering and deletions of custom lines and text boxes
    const handleDeleteElement = () => {
      if (isCustomBox) {
        const boxId = selectedElement.replace('customTextBox-', '');
        setConfig(prev => ({
          ...prev,
          customTextBoxes: (prev.customTextBoxes || []).filter(b => b.id !== boxId)
        }));
        setSelectedElement(null);
      } else if (isSchoolTitleLine) {
        const lineId = selectedElement.replace('schoolTitleLine-', '');
        setConfig(prev => ({
          ...prev,
          schoolTitleLines: (prev.schoolTitleLines || []).filter(l => l.id !== lineId)
        }));
        setSelectedElement(null);
      } else {
        // Reset coordinate default coordinates instead
        setConfig(prev => {
          const styles = prev.textStyles || {};
          return {
            ...prev,
            textStyles: {
              ...styles,
              [selectedElement]: {
                bold: false,
                italic: false,
                underline: false,
                color: undefined,
                customSize: undefined,
                offsetX: 0,
                offsetY: 0,
                fontFamily: 'Inter',
                letterSpacing: 'normal',
                lineHeight: 'normal'
              }
            }
          };
        });
        setSelectedElement(null);
        alert(`Reset formatting constraints and positions for active row.`);
      }
    };

    const handleReorderTitleLine = (direction: 'up' | 'down') => {
      if (!isSchoolTitleLine) return;
      const lineId = selectedElement.replace('schoolTitleLine-', '');
      const lines = [...(config.schoolTitleLines || [])];
      const index = lines.findIndex(l => l.id === lineId);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= lines.length) return;

      // Swap indexes
      const temp = lines[index];
      lines[index] = lines[newIndex];
      lines[newIndex] = temp;

      setConfig(prev => ({
        ...prev,
        schoolTitleLines: lines
      }));
    };

    const isLargeElement = selectedElement === 'schoolLogo' || selectedElement === 'principalSign' || selectedElement === 'studentPhoto' || selectedElement === 'backLogo';
    const minVal = isLargeElement ? 10 : 6;
    const maxVal = isLargeElement ? 300 : 72;

    return (
      <div className="mt-4 bg-zinc-950 border-2 border-zinc-900 text-white rounded-xl p-4.5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] text-[11px] font-mono w-full flex flex-col gap-3 z-30 relative animate-fade-in no-print text-left" id="card-contextual-inspector">
        
        {/* Title layer label */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <span className="font-extrabold text-xs flex items-center gap-1.5 text-zinc-300 uppercase">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Layer: <strong className="text-white bg-blue-600 px-2 py-0.5 rounded text-[10px] tracking-wide font-black">{displayName}</strong>
          </span>
          <div className="flex items-center gap-2">
            {isSchoolTitleLine && (
              <div className="flex items-center bg-zinc-900 rounded border border-zinc-800 shrink-0">
                <button
                  onClick={() => handleReorderTitleLine('up')}
                  className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Move Title Line Up in layout hierarchy"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-3 bg-zinc-800" />
                <button
                  onClick={() => handleReorderTitleLine('down')}
                  className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Move Title Line Down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={() => setSelectedElement(null)}
              className="text-zinc-550 hover:text-white transition uppercase text-[10px] font-black cursor-pointer bg-zinc-900 border border-zinc-800 px-2 py-1 rounded"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Direct Text Editor content rewriting input */}
        {selectedElement !== 'schoolLogo' && selectedElement !== 'principalSign' && selectedElement !== 'studentPhoto' && selectedElement !== 'barcode' && (
          <div className="bg-zinc-900 border border-zinc-805 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest block font-black">Re-write Text Component:</span>
              <span className="text-[8px] text-blue-400 font-mono font-bold uppercase tracking-wider">On-Card Sync</span>
            </div>
            <input
              type="text"
              value={getItemTextValue(selectedElement, '')}
              onChange={(e) => saveTextOverride(selectedElement, e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded px-2.5 py-1.5 text-xs font-bold font-sans focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Type custom text contents here..."
            />
            <p className="text-[8.5px] text-zinc-550 leading-normal">
              Direct editing dynamically update text values on the respective label, student details or design rows.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* FORMAT CONTROLS & FONTS */}
          <div className="flex flex-col gap-3">
            {/* Inline button formats */}
            <div>
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest block mb-1.5">Aesthetic Formatters:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleToggleStyle('bold')}
                  className={`px-3 py-1.5 rounded text-xs transition cursor-pointer font-black border border-zinc-800 ${
                    customStyle.bold ? 'bg-white text-zinc-950 font-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                  title="Toggle Bold"
                >
                  B
                </button>
                <button
                  onClick={() => handleToggleStyle('italic')}
                  className={`px-3 py-1.5 rounded text-xs italic transition cursor-pointer font-serif border border-zinc-800 ${
                    customStyle.italic ? 'bg-white text-zinc-950 font-extrabold' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                  title="Toggle Italic"
                >
                  I
                </button>
                <button
                  onClick={() => handleToggleStyle('underline')}
                  className={`px-3 py-1.5 rounded text-xs underline transition cursor-pointer border border-zinc-800 ${
                    customStyle.underline ? 'bg-white text-zinc-950 font-extrabold' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                  title="Toggle Underline"
                >
                  U
                </button>

                <div className="w-[1px] h-6 bg-zinc-800 mx-1 self-center" />

                {/* Sizing Slider */}
                <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-850 rounded px-2 gap-2">
                  <span className="text-[9px] text-zinc-400 font-bold shrink-0">SIZE:</span>
                  <button
                    type="button"
                    onClick={() => handleSizeSlider(Math.max(minVal, customStyle.fontSize - 1))}
                    className="p-1 px-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 text-[10px] font-mono rounded font-black cursor-pointer leading-none text-zinc-300"
                    title="Zoom Out Font (Decrease)"
                  >
                    A⁻
                  </button>
                  <input
                    type="range"
                    min={minVal}
                    max={maxVal}
                    value={customStyle.fontSize}
                    onChange={(e) => handleSizeSlider(parseInt(e.target.value))}
                    className="flex-1 accent-white h-1 bg-zinc-800 rounded appearance-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleSizeSlider(Math.min(maxVal, customStyle.fontSize + 1))}
                    className="p-1 px-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 text-[10px] font-mono rounded font-black cursor-pointer leading-none text-zinc-300"
                    title="Zoom In Font (Increase)"
                  >
                    A⁺
                  </button>
                  <span className="text-[10px] font-black text-white shrink-0 min-w-[28px] text-right">{customStyle.fontSize}px</span>
                </div>
              </div>
            </div>

            {/* Font family selection */}
            <div>
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest block mb-1.5">Font Family Selection:</span>
              <select
                value={customStyle.fontFamily}
                onChange={(e) => handleFontFamilySlider(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded p-1.5 text-xs font-mono focus:outline-none cursor-pointer"
              >
                <option value="Inter">Inter (General Corporate Sans-Serif)</option>
                <option value="Space Grotesk">Space Grotesk (Tech-forward Modernist)</option>
                <option value="JetBrains Mono">JetBrains Mono (Digital Developer Code)</option>
                <option value="Playfair Display">Playfair Display (Premium Calligraphy Serif)</option>
                <option value="Cinzel">Cinzel (Historic Monumental Rome Serif)</option>
              </select>
            </div>

            {/* Spacing alignment parameters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest block mb-1">Letter Spacing:</span>
                <select
                  value={customStyle.letterSpacing}
                  onChange={(e) => handleSpacingSlider(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded p-1 text-2xs focus:outline-none cursor-pointer"
                >
                  <option value="normal">Normal Style</option>
                  <option value="tight">Tight Narrow (-2%)</option>
                  <option value="wide">Wide Span (+6%)</option>
                  <option value="widest">Extreme Span (+12%)</option>
                </select>
              </div>

              <div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest block mb-1">Line Height:</span>
                <select
                  value={customStyle.lineHeight}
                  onChange={(e) => handleLineHeightSlider(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded p-1 text-2xs focus:opacity-100 disabled:opacity-40 cursor-pointer"
                  disabled={isCustomBox}
                >
                  <option value="normal">Normal Height</option>
                  <option value="none">No Margin (1)</option>
                  <option value="tight">Tight Height</option>
                  <option value="relaxed">Relaxed Height</option>
                </select>
              </div>
            </div>

          </div>

          {/* COORDINATE STEERING & ACTIONS */}
          <div className="flex flex-col justify-between gap-3">
            
            {/* Position coordinate slider & steering arrow pads */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest">Fine Coordinate Grid Steering:</span>
                <span className="text-[9px] text-zinc-500 font-bold">X: {Math.round(customStyle.offsetX)}px | Y: {Math.round(customStyle.offsetY)}px</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Arrow-pad steering cluster */}
                <div className="grid grid-cols-3 gap-1 w-24 shrink-0 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
                  <div />
                  <button
                    onClick={() => handleNudgeOffset(0, -2)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-1 rounded text-center cursor-pointer font-bold select-none text-[10px]"
                    title="Nudge Up"
                  >
                    ▲
                  </button>
                  <div />
                  <button
                    onClick={() => handleNudgeOffset(-2, 0)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-1 rounded text-center cursor-pointer font-bold select-none text-[10px]"
                    title="Nudge Left"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => handleNudgeOffset(0, 0)} // Reset coordinate shortcut
                    onClickCapture={() => handleNudgeOffset(-customStyle.offsetX, -customStyle.offsetY)}
                    className="bg-red-950 font-sans text-red-400 p-1 rounded text-center cursor-pointer text-[8px] font-black"
                    title="Reset to Core Center"
                  >
                    ⌖
                  </button>
                  <button
                    onClick={() => handleNudgeOffset(2, 0)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-1 rounded text-center cursor-pointer font-bold select-none text-[10px]"
                    title="Nudge Right"
                  >
                    ▶
                  </button>
                  <div />
                  <button
                    onClick={() => handleNudgeOffset(0, 2)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-1 rounded text-center cursor-pointer font-bold select-none text-[10px]"
                    title="Nudge Down"
                  >
                    ▼
                  </button>
                </div>

                <div className="flex-1 flex flex-col gap-1.5 text-[2xs]">
                  {/* Hide or Show Element Toggle Button */}
                  <button
                    onClick={() => {
                      const isHidden = config.textStyles?.[selectedElement]?.hidden ?? false;
                      setConfig(prev => {
                        const styles = prev.textStyles || {};
                        return {
                          ...prev,
                          textStyles: {
                            ...styles,
                            [selectedElement]: {
                              ...styles[selectedElement],
                              hidden: !isHidden
                            }
                          }
                        };
                      });
                    }}
                    className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border transition font-black uppercase text-[9px] tracking-wide cursor-pointer ${
                      config.textStyles?.[selectedElement]?.hidden
                        ? 'bg-emerald-950 hover:bg-emerald-900 border-emerald-900 text-emerald-200'
                        : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-350 hover:text-white'
                    }`}
                  >
                    {config.textStyles?.[selectedElement]?.hidden ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Show (Add back)
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                        Hide (Remove)
                      </>
                    )}
                  </button>

                  {/* Absolute Delete element trigger */}
                  <button
                    onClick={handleDeleteElement}
                    className="w-full flex items-center justify-center gap-1.5 bg-red-950/60 hover:bg-red-900 border border-red-900 text-red-200 py-1.5 px-2.5 rounded-lg transition font-black uppercase text-[9px] tracking-wide cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isCustomBox || isSchoolTitleLine ? 'Delete Layer' : 'Reset Coords'}
                  </button>
                </div>
              </div>
            </div>

            {/* Custom color swatches */}
            <div>
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest block mb-1">Swatch Fill Overrides:</span>
              <div className="flex flex-wrap items-center gap-1">
                {expandedColors.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => handleColorChange(col.hex)}
                    className="w-4 h-4 rounded-full border border-zinc-800 transition cursor-pointer hover:scale-120"
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {customStyle.color === col.hex && (
                      <span className="text-[8px] text-white font-extrabold flex items-center justify-center filter drop-shadow">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => handleColorChange(undefined)}
                  className="w-4 h-4 rounded-full border border-zinc-800 bg-transparent relative shrink-0 transition hover:scale-120 cursor-pointer"
                  title="Remove override / Default Color"
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] text-red-500 font-extrabold">✕</span>
                </button>
                <input
                  type="color"
                  value={customStyle.color || '#000000'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0 outline-0 bg-transparent shrink-0"
                  title="Custom Color Spectrum Picker"
                />
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  };

  const renderVisualTestingToolbar = () => {
    return null; // Disabled by user request
    if (isPrinting || !setConfig) return null;

    const hasPhoto = !(config as any).hidePhoto;
    const hasBarcode = !(config as any).hideBarcode;

    const togglePhoto = () => {
      setConfig(prev => ({
        ...prev,
        hidePhoto: !prev.hidePhoto
      }));
    };

    const toggleBarcode = () => {
      setConfig(prev => ({
        ...prev,
        hideBarcode: !prev.hideBarcode
      }));
    };

    const toggleDraftGrid = () => {
      const grids: ('none' | 'blueprint' | 'crosshair' | 'radial' | 'isometric' | 'matrix')[] = [
        'none', 'blueprint', 'crosshair', 'radial', 'isometric', 'matrix'
      ];
      const current = config.draftGridType || 'none';
      const currentIndex = grids.indexOf(current as any);
      const nextIndex = (currentIndex + 1) % grids.length;
      setConfig(prev => ({
        ...prev,
        draftGridType: grids[nextIndex]
      }));
    };

    const selectThemeColor = (colorHex: string) => {
      setConfig(prev => ({
        ...prev,
        themeColor: colorHex
      }));
    };

    const swatchColors = [
      '#D32F2F', // Doboka Crimson
      '#1E3A8A', // Oxford Navy
      '#15803D', // Forest Emerald
      '#1A1A1A', // Carbon Black
      '#EA580C', // Sunset Tangerine
      '#7C3AED', // Deep Amethyst
    ];

    return (
      <div 
        className="w-full max-w-[340px] mt-4 mb-2 p-3 bg-white border-2 border-zinc-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex flex-col gap-2.5 select-none animate-fade-in text-left no-print z-30 relative"
      >
        <div className="flex items-center justify-between border-b pb-1.5 border-zinc-150">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-zinc-900 font-extrabold uppercase leading-none">
              VISUAL TEST BAR
            </span>
          </div>
          <span className="text-[8px] font-mono font-extrabold text-[#D32F2F] bg-[#D32F2F]/5 border border-[#D32F2F]/20 px-1.5 py-0.5 rounded uppercase">
            Interactive
          </span>
        </div>

        {/* Action Toggles Row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Cover Photo Toggle */}
          <button
            onClick={togglePhoto}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border-2 font-mono font-black text-[10px] uppercase transition cursor-pointer active:translate-y-[1px] select-none ${
              hasPhoto
                ? 'bg-[#D32F2F] text-white border-red-950 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-400 border-zinc-300'
            }`}
            title="Rapidly toggle profile photo to test placeholder/blank scenarios"
          >
            {hasPhoto ? <Image className="w-3.5 h-3.5 text-white" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-400" />}
            <span>Photo: {hasPhoto ? 'SHOWING' : 'HIDDEN'}</span>
          </button>

          {/* Barcode/QR Toggle */}
          <button
            onClick={toggleBarcode}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border-2 font-mono font-black text-[10px] uppercase transition cursor-pointer active:translate-y-[1px] select-none ${
              hasBarcode
                ? 'bg-[#D32F2F] text-white border-red-950 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-400 border-zinc-300'
            }`}
            title="Rapidly toggle Barcode / QR lines visibility"
          >
            {hasBarcode ? <QrCode className="w-3.5 h-3.5 text-white" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-400" />}
            <span>QR-Code: {hasBarcode ? 'SHOWING' : 'HIDDEN'}</span>
          </button>
        </div>

        {/* Alignment Grid Multi-state Cycler & Quick Flippers */}
        <div className="flex items-center justify-between border-t border-b py-2 border-zinc-150 gap-2">
          {/* Grid lines prompt */}
          <button
            onClick={toggleDraftGrid}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded font-mono font-bold text-[9px] uppercase cursor-pointer transition select-none active:translate-y-[1px]"
            title="Cycle alignment draft grid lines overlay (blueprint, crosshair, isometric, matrix, etc)"
          >
            <Grid className="w-3.5 h-3.5 text-zinc-650" />
            <span>Grid: <span className="font-black text-[#D32F2F]">{config.draftGridType || 'none'}</span></span>
          </button>

          {/* Quick Flip if 2D style is active (or toggle flipped view) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded font-mono font-bold text-[9px] uppercase cursor-pointer transition select-none active:translate-y-[1px]"
            title="Flip preview card face"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-655" />
            <span>Face: <span className="font-extrabold">{isFlipped ? 'Back ↻' : 'Front ↺'}</span></span>
          </button>
        </div>

        {/* Institutional Color Samplers */}
        <div className="flex items-center justify-between text-[9px] font-mono leading-none pt-0.5">
          <span className="text-zinc-500 font-extrabold uppercase">Brand Theme:</span>
          <div className="flex items-center gap-1">
            {swatchColors.map((color) => (
              <button
                key={color}
                onClick={() => selectThemeColor(color)}
                className={`w-3.5 h-3.5 rounded-full border transition hover:scale-120 cursor-pointer ${
                  config.themeColor === color ? 'border-zinc-900 ring-1 ring-zinc-500' : 'border-zinc-350'
                }`}
                style={{ backgroundColor: color }}
                title={`Instantly apply ${color}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isPrinting || forcedSide === 'both') {
    return (
      <div className="flex flex-row items-center gap-4 justify-center bg-transparent print:gap-2">
        <div style={wrapStyle}>
          <div 
            className="relative overflow-hidden rounded-3xl" 
            style={scaledInnerStyle}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {FrontSide()}
            {renderTextureOverlay()}
          </div>
        </div>
        <div style={wrapStyle}>
          <div 
            className="relative overflow-hidden rounded-3xl" 
            style={scaledInnerStyle}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {BackSide()}
            {renderTextureOverlay()}
          </div>
        </div>
      </div>
    );
  }

  if (forcedSide === 'front') {
    return (
      <div className="flex flex-col items-center relative">
        <div style={wrapStyle} onClick={(e) => e.stopPropagation()} className="relative">
          {/* Alignment Guides and dimension spacing banners for professional workspace design look */}
          {showVGuide && (
            <div className="absolute left-[170px] top-0 bottom-0 w-[1.5px] bg-pink-500/80 dashed z-50 pointer-events-none animate-pulse" />
          )}
          {dragSpacingText && (
            <div className="absolute top-2 right-2 bg-pink-600 text-white text-[8px] font-mono font-black py-0.5 px-1.5 rounded shadow z-50 pointer-events-none tracking-widest uppercase">
              GRID: {dragSpacingText}
            </div>
          )}
          <div 
            className="relative overflow-hidden rounded-3xl" 
            style={scaledInnerStyle}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {FrontSide()}
            {renderTextureOverlay()}
          </div>
        </div>
        {renderVisualTestingToolbar()}
        {renderStyleToolbar()}
      </div>
    );
  }

  if (forcedSide === 'back') {
    return (
      <div className="flex flex-col items-center relative">
        <div style={wrapStyle} onClick={(e) => e.stopPropagation()} className="relative">
          {showVGuide && (
            <div className="absolute left-[170px] top-0 bottom-0 w-[1.5px] bg-pink-500/80 dashed z-50 pointer-events-none animate-pulse" />
          )}
          {dragSpacingText && (
            <div className="absolute top-2 right-2 bg-pink-600 text-white text-[8px] font-mono font-black py-0.5 px-1.5 rounded shadow z-50 pointer-events-none tracking-widest uppercase">
              GRID: {dragSpacingText}
            </div>
          )}
          <div 
            className="relative overflow-hidden rounded-3xl" 
            style={scaledInnerStyle}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {BackSide()}
            {renderTextureOverlay()}
          </div>
        </div>
        {renderVisualTestingToolbar()}
        {renderStyleToolbar()}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="group relative"
        style={{
          width: `${baseWidth * scale}px`,
          height: `${baseHeight * scale}px`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
        onClick={() => {
          if (!designerMode) {
            setIsFlipped(!isFlipped);
          }
        }}
      >
        <div
          style={{
            width: `${baseWidth}px`,
            height: `${baseHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            perspective: '1500px',
          }}
        >
          <div
            className="relative w-full h-full transition-transform duration-700 ease-out preserve-3d"
            style={{
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front preview card */}
            <div 
              className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden" 
              style={{ transform: 'rotateY(0deg)' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {FrontSide()}
              {renderTextureOverlay()}
              {!designerMode && (
                <div className="absolute bottom-3 right-5 bg-slate-900/65 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-mono font-medium tracking-wide shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-40">
                  Click inside card to Flip Back ↻
                </div>
              )}
            </div>

            {/* Back preview card */}
            <div 
              className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden" 
              style={{ transform: 'rotateY(180deg)' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {BackSide()}
              {renderTextureOverlay()}
              {!designerMode && (
                <div className="absolute bottom-3 left-5 bg-slate-900/65 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-mono font-medium tracking-wide shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-40">
                  Click inside card to Flip Front ↺
                </div>
              )}
            </div>
          </div>
        </div>

        {designerMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
            className="absolute -bottom-1 focus:outline-none bg-zinc-900 font-mono hover:bg-zinc-800 text-white font-bold text-[9px] px-3.5 py-1.5 rounded-full border border-zinc-950 shadow-md transition uppercase cursor-pointer select-none leading-none z-40 animate-bounce"
            title="Press to flip card layout side"
          >
            Flip Card Face: {isFlipped ? 'Front ↺' : 'Back ↻'}
          </button>
        )}
      </div>

      {renderVisualTestingToolbar()}
      {renderStyleToolbar()}
    </div>
  );
};
