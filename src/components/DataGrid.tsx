/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, Trash2, Download, AlertCircle, FileText, CheckCircle2, UserPlus, Image } from 'lucide-react';
import { Student, ColumnMap } from '../types';

interface DataGridProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  columnMap: ColumnMap;
  setColumnMap: React.Dispatch<React.SetStateAction<ColumnMap>>;
  onProceedToBranding?: () => void;
  onProceedToPrint?: () => void;
  customFieldKeys: string[];
  setCustomFieldKeys: React.Dispatch<React.SetStateAction<string[]>>;
}

export const DataGrid: React.FC<DataGridProps> = ({
  students,
  setStudents,
  columnMap,
  setColumnMap,
  onProceedToBranding,
  onProceedToPrint,
  customFieldKeys,
  setCustomFieldKeys,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [headers, setHeaders] = useState<string[]>([]);
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [isMapping, setIsMapping] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [bulkPhotoMsg, setBulkPhotoMsg] = useState<{ status: 'success' | 'info'; text: string } | null>(null);

  // Download Sample Excel Template
  const downloadTemplate = () => {
    const templateData = [
      {
        'Full Name': 'Jonathan Patterson',
        'Roll No': '0012',
        'Class': 'X',
        'Phone Number': '+123-456-7890',
        'Father\'s Name': 'Robert Patterson',
        'DOB': '12-05-2011',
        'Address': 'Sardar Gaon, Hojai : Assam : 782440',
      },
      {
        'Full Name': 'Sarah Connor',
        'Roll No': '0013',
        'Class': 'X',
        'Phone Number': '+123-999-8888',
        'Father\'s Name': 'Marcus Connor',
        'DOB': '23-08-2011',
        'Address': 'Bazar Road, Doboka : Assam : 782440',
      },
      {
        'Full Name': 'David Gupta',
        'Roll No': '0014',
        'Class': 'XII',
        'Phone Number': '+91-9876543210',
        'Father\'s Name': 'Sanjay Gupta',
        'DOB': '05-11-2009',
        'Address': 'Nirmal Gaon, Lanka : Assam : 782446',
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Template');
    XLSX.writeFile(workbook, 'School_Students_Template.xlsx');
  };

  // Process Excel/CSV File
  const handleSheetLoad = (file: File) => {
    setParseError(null);
    setBulkPhotoMsg(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('Could not read binary stream.');

        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with raw headers
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rawRows.length === 0) {
          throw new Error('This spreadsheet appears to be empty.');
        }

        const rawHeaders = (rawRows[0] as string[]).map(h => String(h || '').trim());
        setHeaders(rawHeaders);

        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setUploadedData(jsonData);

        // Perform smart auto-mapping search
        const initialMap: ColumnMap = { name: '', rollNo: '', class: '', phone: '', address: '', photo: '', fatherName: '', dob: '' };
        
        rawHeaders.forEach((header) => {
          const lH = header.toLowerCase();
          if (lH.includes('name') || lH.includes('student') || lH.includes('full')) {
            initialMap.name = header;
          } else if (lH.includes('roll') || lH.includes('no') || lH.includes('id')) {
            initialMap.rollNo = header;
          } else if (lH.includes('class') || lH.includes('grade') || lH.includes('standard')) {
            initialMap.class = header;
          } else if (lH.includes('phone') || lH.includes('mobile') || lH.includes('contact') || lH.includes('tel')) {
            initialMap.phone = header;
          } else if (lH.includes('father') || lH.includes('parent') || lH.includes('guardian')) {
            initialMap.fatherName = header;
          } else if (lH.includes('dob') || lH.includes('birth') || lH.includes('date')) {
            initialMap.dob = header;
          } else if (lH.includes('address') || lH.includes('location') || lH.includes('residence')) {
            initialMap.address = header;
          } else if (lH.includes('photo') || lH.includes('image') || lH.includes('pic')) {
            initialMap.photo = header;
          }
        });

        // Ensure default fallbacks if not auto-detected
        if (!initialMap.name) initialMap.name = rawHeaders[0] || '';
        if (!initialMap.rollNo) initialMap.rollNo = rawHeaders[1] || '';
        if (!initialMap.class) initialMap.class = rawHeaders[2] || '';
        if (!initialMap.phone) initialMap.phone = rawHeaders[3] || '';
        if (!initialMap.fatherName) {
          initialMap.fatherName = rawHeaders.find(h => h.toLowerCase().includes('father')) || '';
        }
        if (!initialMap.dob) {
          initialMap.dob = rawHeaders.find(h => h.toLowerCase().includes('dob') || h.toLowerCase().includes('birth')) || '';
        }
        if (!initialMap.address) initialMap.address = rawHeaders[4] || '';

        setColumnMap(initialMap);
        setIsMapping(true);
      } catch (err: any) {
        setParseError(err?.message || 'Error parsing excel file. Please upload a valid .xlsx or .csv sheet.');
        console.error(err);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const applyMappingAndInject = () => {
    if (!columnMap.name) {
      alert('Please at least map the Full Name column to continue.');
      return;
    }

    const compiledStudents: Student[] = uploadedData.map((row, index) => {
      const extraFieldsObj: Record<string, string> = {};
      customFieldKeys.forEach((k) => {
        extraFieldsObj[k] = row[k] ? String(row[k]).trim() : '';
      });
      return {
        id: `auto-${Date.now()}-${index}`,
        name: String(row[columnMap.name] || '').trim(),
        rollNo: String(row[columnMap.rollNo] || '').trim(),
        class: String(row[columnMap.class] || '').trim(),
        phone: String(row[columnMap.phone] || '').trim(),
        address: String(row[columnMap.address] || '').trim(),
        fatherName: columnMap.fatherName ? String(row[columnMap.fatherName] || '').trim() : '',
        dob: columnMap.dob ? String(row[columnMap.dob] || '').trim() : '',
        photo: columnMap.photo ? String(row[columnMap.photo] || '').trim() : undefined,
        extraFields: extraFieldsObj,
      };
    }).filter(s => s.name.length > 0);

    setStudents(compiledStudents);
    setIsMapping(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSheetLoad(e.dataTransfer.files[0]);
    }
  };

  // Add empty manual student
  const addStudentRow = () => {
    const extraEmpty: Record<string, string> = {};
    customFieldKeys.forEach(k => {
      extraEmpty[k] = '';
    });
    const newStud: Student = {
      id: `manual-${Date.now()}`,
      name: '',
      rollNo: '',
      class: '',
      phone: '',
      address: '',
      fatherName: '',
      dob: '',
      extraFields: extraEmpty
    };
    setStudents(prev => [newStud, ...prev]);
  };

  // Inline cell editor supporting standard & custom fields
  const handleCellChange = (id: string, field: string, value: string) => {
    setStudents(prev => {
      return prev.map(s => {
        if (s.id === id) {
          if (field === 'fatherName' || field === 'dob') {
            return { ...s, [field]: value };
          } else if (['name', 'rollNo', 'class', 'phone', 'address', 'photo'].includes(field)) {
            return { ...s, [field as any]: value };
          } else {
            const extra = s.extraFields ? { ...s.extraFields } : {};
            extra[field] = value;
            return { ...s, extraFields: extra };
          }
        }
        return s;
      });
    });
  };

  // Delete student row
  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  // Single Student Picture Upload inside the table cell
  const handleSinglePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, sId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const r = new FileReader();
    r.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        handleCellChange(sId, 'photo', ev.target.result);
      }
    };
    r.readAsDataURL(file);
  };

  // Bulk Photos Drop / Matcher: matches file names like "0012.jpg" or "david_gupta.png"
  const handleBulkPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let matchedCount = 0;
    const filesArray = Array.from(files) as File[];

    filesArray.forEach((file) => {
      const fileNameRaw = file.name.substring(0, file.name.lastIndexOf('.'));
      const cleanFileName = fileNameRaw.trim().toLowerCase();

      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64Url = ev.target?.result as string;
        if (!base64Url) return;

        setStudents((prev) => {
          let matched = false;
          const updated = prev.map((s) => {
            const cleanRoll = s.rollNo.trim().toLowerCase();
            const cleanName = s.name.trim().toLowerCase();
            const rollMatches = cleanRoll && cleanRoll === cleanFileName;
            const nameMatches = cleanName && cleanName.replace(/[^a-z0-9]/g, '') === cleanFileName.replace(/[^a-z0-9]/g, '');

            if (rollMatches || nameMatches) {
              matched = true;
              return { ...s, photo: base64Url };
            }
            return s;
          });

          if (matched) matchedCount++;
          return updated;
        });
      };
      
      reader.readAsDataURL(file);
    });

    // Short delayed check to show summary
    setTimeout(() => {
      setBulkPhotoMsg({
        status: 'success',
        text: `Processed photos load. Check the records grid below for associated pictures matching filenames (based on Roll No or Exact Student Name).`
      });
    }, 800);
  };

  return (
    <div className="bg-white border-2 border-zinc-900 rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]" id="data-editor-container">
      
      {/* SECTOR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-zinc-900 pb-5 mb-5">
        <div>
          <h3 className="text-xl font-display font-black tracking-wide text-zinc-900 uppercase flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-zinc-900" />
            Students Roster Manager & Parser
          </h3>
          <p className="text-sm font-sans text-zinc-500 mt-1 select-none">
            Upload your excel list, map headers, edit rows inline, and map photos in bulk automatically.
          </p>
        </div>
        
        {/* ACTION PANEL */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download sample */}
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-sm text-xs font-mono font-bold uppercase border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition cursor-pointer"
            title="Download formatted columns for excel list upload"
            id="btn-download-template"
          >
            <Download className="w-3.5 h-3.5" />
            Excel Template
          </button>
          
          {/* Freehand Manual add */}
          <button
            type="button"
            onClick={addStudentRow}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-sm text-xs font-mono font-bold uppercase border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition cursor-pointer"
            id="btn-add-manual-row"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>

          {/* Add custom field */}
          <button
            type="button"
            onClick={() => {
              const fieldName = prompt("Enter custom field name (e.g. Email, Blood Group, Card ID):");
              if (fieldName) {
                const cleanKey = fieldName.trim();
                if (cleanKey) {
                  const upperKey = cleanKey.toUpperCase();
                  if (customFieldKeys.includes(upperKey)) {
                    alert("This field already exists.");
                    return;
                  }
                  if (['STUDENTS NAME', 'ROLL NO', 'PHONE NO', "FATHER'S NAME", 'ADDRESS', 'DOB', 'CLASS'].includes(upperKey) ||
                      ['NAME', 'ROLLNO', 'CLASS', 'PHONE', 'ADDRESS', 'FATHERNAME', 'DOB'].includes(upperKey.replace(/\s/g, ''))) {
                    alert("This is a built-in standard field. No need to add it as a custom field!");
                    return;
                  }
                  setCustomFieldKeys(prev => [...prev, cleanKey]);
                }
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-xs font-mono font-bold uppercase border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition cursor-pointer"
            id="btn-add-custom-field-col"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Field
          </button>
        </div>
      </div>

      {/* DRAG AND DROP EXCEL/CSV SHEET */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        
        {/* DRAG-TARGET */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition relative group ${
            dragActive
              ? 'border-zinc-900 bg-zinc-100'
              : 'border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-900'
          }`}
          id="dropzone-excel"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleSheetLoad(e.target.files[0])}
          />
          <div className="bg-zinc-100 p-3 rounded-md border-2 border-zinc-900 group-hover:scale-105 transition duration-300">
            <Upload className="w-6 h-6 text-zinc-900" />
          </div>
          <span className="text-sm font-sans font-bold text-zinc-900 mt-3 block">
            Drag & Drop Students Sheet here
          </span>
          <span className="text-xs font-sans text-zinc-500 mt-1 block">
            Supports Microsoft Excel (.xlsx, .xls) and CSV lists
          </span>
          {parseError && (
            <div className="mt-3 flex items-center justify-center gap-1 text-red-700 text-xs font-semibold bg-red-50 px-3 py-1.5 rounded-lg border border-red-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {parseError}
            </div>
          )}
        </div>

        {/* BULK PHOTOS MATCHING */}
        <div
          onClick={() => photoInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-900 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition relative group"
          id="dropzone-bulk-photos"
        >
          <input
            ref={photoInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleBulkPhotos}
          />
          <div className="bg-zinc-100 p-3 rounded-md border-2 border-zinc-900 group-hover:scale-105 transition duration-300">
            <Image className="w-6 h-6 text-zinc-900" />
          </div>
          <span className="text-sm font-sans font-bold text-zinc-900 mt-3 block">
            Bulk Upload Student Photos
          </span>
          <span className="text-xs font-sans text-zinc-500 mt-1 block">
            Tip: Name photo files matching Roll No (e.g. <span className="font-mono text-zinc-900 font-bold text-[11px] underline">0012.jpg</span>, <span className="font-mono text-zinc-900 font-bold text-[11px] underline">0013.png</span>)
          </span>
          {bulkPhotoMsg && (
            <div className="mt-3 flex items-center gap-1.5 text-green-800 text-xs bg-green-50 px-3.5 py-1.5 rounded-lg border border-green-300">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-600" />
              <span>{bulkPhotoMsg.text}</span>
            </div>
          )}
        </div>

      </div>

      {/* INTERACTIVE COLUMN MAPPING DIALOG PANEL (Conditional inline render) */}
      {isMapping && (
        <div className="bg-zinc-900 text-white border-2 border-zinc-900 p-5 rounded-xl mb-6 shadow-md shadow-zinc-950 animation-fade-in" id="column-mapper-panel">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-white" />
            <h4 className="text-base font-display font-bold text-white uppercase tracking-wider">
              Configure Spreadsheet Columns Mapping
            </h4>
          </div>
          <p className="text-xs font-sans text-zinc-400 mb-4 leading-relaxed select-none">
            We read the sheet. Verify or select which column names in your uploaded spreadsheet correspond to each data card field. Column fields without a match will fall back to editable default text blocks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-4 text-zinc-900">
            {/* NAME FIELD */}
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">Student Name</label>
              <select
                value={columnMap.name}
                onChange={(e) => setColumnMap(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-zinc-800 text-white border border-zinc-700 rounded p-2 text-xs focus:ring-1 focus:ring-zinc-400 focus:outline-none appearance-none"
              >
                <option value="" className="bg-zinc-800 text-white">-- Ignore / Default --</option>
                {headers.map(h => <option key={h} value={h} className="bg-zinc-800 text-white">{h}</option>)}
              </select>
            </div>

            {/* ROLL NO FIELD */}
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">Roll Number</label>
              <select
                value={columnMap.rollNo}
                onChange={(e) => setColumnMap(prev => ({ ...prev, rollNo: e.target.value }))}
                className="w-full bg-zinc-800 text-white border border-zinc-700 rounded p-2 text-xs focus:ring-1 focus:ring-zinc-400 focus:outline-none appearance-none"
              >
                <option value="" className="bg-zinc-800 text-white">-- Ignore / Default --</option>
                {headers.map(h => <option key={h} value={h} className="bg-zinc-800 text-white">{h}</option>)}
              </select>
            </div>

            {/* CLASS FIELD */}
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">Class / Standard</label>
              <select
                value={columnMap.class}
                onChange={(e) => setColumnMap(prev => ({ ...prev, class: e.target.value }))}
                className="w-full bg-zinc-800 text-white border border-zinc-700 rounded p-2 text-xs focus:ring-1 focus:ring-zinc-400 focus:outline-none appearance-none"
              >
                <option value="" className="bg-zinc-800 text-white">-- Ignore / Default --</option>
                {headers.map(h => <option key={h} value={h} className="bg-zinc-800 text-white">{h}</option>)}
              </select>
            </div>

            {/* PHONE FIELD */}
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">Phone / Mobile</label>
              <select
                value={columnMap.phone}
                onChange={(e) => setColumnMap(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-zinc-800 text-white border border-zinc-700 rounded p-2 text-xs focus:ring-1 focus:ring-zinc-400 focus:outline-none appearance-none"
              >
                <option value="" className="bg-zinc-800 text-white">-- Ignore / Default --</option>
                {headers.map(h => <option key={h} value={h} className="bg-zinc-800 text-white">{h}</option>)}
              </select>
            </div>

            {/* FATHER'S NAME FIELD */}
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">Father's Name</label>
              <select
                value={columnMap.fatherName || ''}
                onChange={(e) => setColumnMap(prev => ({ ...prev, fatherName: e.target.value }))}
                className="w-full bg-zinc-800 text-white border border-zinc-700 rounded p-2 text-xs focus:ring-1 focus:ring-zinc-400 focus:outline-none appearance-none"
              >
                <option value="" className="bg-zinc-800 text-white">-- Ignore / Default --</option>
                {headers.map(h => <option key={h} value={h} className="bg-zinc-800 text-white">{h}</option>)}
              </select>
            </div>

            {/* DOB FIELD */}
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">Date of Birth</label>
              <select
                value={columnMap.dob || ''}
                onChange={(e) => setColumnMap(prev => ({ ...prev, dob: e.target.value }))}
                className="w-full bg-zinc-800 text-white border border-zinc-700 rounded p-2 text-xs focus:ring-1 focus:ring-zinc-400 focus:outline-none appearance-none"
              >
                <option value="" className="bg-zinc-800 text-white">-- Ignore / Default --</option>
                {headers.map(h => <option key={h} value={h} className="bg-zinc-800 text-white">{h}</option>)}
              </select>
            </div>

            {/* ADDRESS FIELD */}
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">Home Address</label>
              <select
                value={columnMap.address}
                onChange={(e) => setColumnMap(prev => ({ ...prev, address: e.target.value }))}
                className="w-full bg-zinc-800 text-white border border-zinc-700 rounded p-2 text-xs focus:ring-1 focus:ring-zinc-400 focus:outline-none appearance-none"
              >
                <option value="" className="bg-zinc-800 text-white">-- Ignore / Default --</option>
                {headers.map(h => <option key={h} value={h} className="bg-zinc-800 text-white">{h}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-zinc-800">
            <button
              onClick={() => setIsMapping(false)}
              className="px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={applyMappingAndInject}
              className="px-4 py-1.5 rounded bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-mono font-black transition cursor-pointer"
              id="btn-confirm-mapping"
            >
              Confirm & Load Records
            </button>
          </div>
        </div>
      )}

      {/* STUDENT GRID SPREADSHEET */}
      <div className="overflow-x-auto rounded-xl border-2 border-zinc-900 bg-white">
        <table className="w-full text-left font-sans border-collapse" id="students-editable-table">
          <thead>
            <tr className="border-b-2 border-zinc-900 bg-zinc-50 text-xs font-mono font-black tracking-wider text-zinc-700 uppercase">
              <th className="py-3.5 px-4 w-[65px] select-none text-center">Photo</th>
              <th className="py-3.5 px-4 w-[180px]">Student Name</th>
              <th className="py-3.5 px-4 w-[100px]">Roll No</th>
              <th className="py-3.5 px-4 w-[100px]">Class</th>
              <th className="py-3.5 px-4 w-[140px]">Phone</th>
              <th className="py-3.5 px-4 w-[160px]">Father's Name</th>
              <th className="py-3.5 px-4 w-[110px]">DOB</th>
              <th className="py-3.5 px-4 min-w-[200px]">Address</th>
              {customFieldKeys.map(key => (
                <th key={key} className="py-3.5 px-4 min-w-[130px] bg-zinc-100/50 relative group">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate">{key}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the custom field "${key}"? All student data for this field will be lost.`)) {
                          setCustomFieldKeys(prev => prev.filter(k => k !== key));
                          setStudents(prev => prev.map(s => {
                            if (s.extraFields) {
                              const updated = { ...s.extraFields };
                              delete updated[key];
                              return { ...s, extraFields: updated };
                            }
                            return s;
                          }));
                        }
                      }}
                      className="text-red-500 hover:text-red-700 cursor-pointer font-black text-xs font-sans pl-1"
                      title="Delete column"
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
              <th className="py-3.5 px-4 w-[60px] text-center select-none">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {students.length === 0 ? (
              <tr>
                <td colSpan={8 + customFieldKeys.length} className="py-12 text-center text-zinc-500 select-none">
                  <div className="flex flex-col items-center justify-center p-3">
                     <FileText className="w-10 h-10 text-zinc-300 mb-2" />
                     <span className="text-sm font-bold text-zinc-800">No students in registry list yet</span>
                     <span className="text-xs text-zinc-500 mt-1">Upload an Excel sheet or add rows using the panel above.</span>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const uniqueInputId = `photo-col-${student.id}`;
                return (
                  <tr
                    key={student.id}
                    className="hover:bg-zinc-50/70 text-sm text-zinc-950 transition whitespace-nowrap align-middle"
                  >
                    {/* PHOTO INPUT COLUMN */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center relative group">
                        <label htmlFor={uniqueInputId} className="cursor-pointer relative">
                          <div className="w-10 h-12 rounded bg-zinc-50 border-2 border-zinc-900 hover:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 relative shadow-inner">
                            {student.photo ? (
                              <img
                                src={student.photo}
                                alt="Student"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Upload className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition" />
                            )}
                            {/* Fast Action Shade overlay on hover */}
                            <div className="absolute inset-0 bg-zinc-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Plus className="w-3.5 h-3.5 text-white bg-zinc-900 rounded p-[2px]" />
                            </div>
                          </div>
                        </label>
                        <input
                           id={uniqueInputId}
                           type="file"
                           accept="image/*"
                           className="hidden"
                           onChange={(e) => handleSinglePhotoUpload(e, student.id)}
                        />
                      </div>
                    </td>

                    {/* NAME SPREADSHEET INPUT */}
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={student.name}
                        placeholder="e.g. JONATHAN PATTERSON"
                        onChange={(e) => handleCellChange(student.id, 'name', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-350 text-zinc-900 rounded p-1.5 text-xs font-bold focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                      />
                    </td>

                    {/* ROLL NO INPUT */}
                    <td className="py-2.5 px-4 font-mono">
                      <input
                        type="text"
                        value={student.rollNo}
                        placeholder="e.g. 0012"
                        onChange={(e) => handleCellChange(student.id, 'rollNo', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-350 text-zinc-900 rounded p-1.5 text-xs font-bold font-mono focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                      />
                    </td>

                    {/* CLASS INPUT */}
                    <td className="py-2.5 px-4 font-mono">
                      <input
                        type="text"
                        value={student.class}
                        placeholder="e.g. X"
                        onChange={(e) => handleCellChange(student.id, 'class', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-350 text-zinc-900 rounded p-1.5 text-xs font-bold font-mono focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                      />
                    </td>

                    {/* PHONE INPUT */}
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={student.phone}
                        placeholder="e.g. +123-456-7890"
                        onChange={(e) => handleCellChange(student.id, 'phone', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-350 text-zinc-900 rounded p-1.5 text-xs font-bold focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                      />
                    </td>

                    {/* FATHER'S NAME INPUT */}
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={student.fatherName || ''}
                        placeholder="e.g. Robert Patterson"
                        onChange={(e) => handleCellChange(student.id, 'fatherName', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-350 text-zinc-900 rounded p-1.5 text-xs font-bold focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                      />
                    </td>

                    {/* DOB INPUT */}
                    <td className="py-2.5 px-4 font-mono">
                      <input
                        type="text"
                        value={student.dob || ''}
                        placeholder="e.g. 15-08-2010"
                        onChange={(e) => handleCellChange(student.id, 'dob', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-350 text-zinc-900 rounded p-1.5 text-xs font-bold font-mono focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                      />
                    </td>

                    {/* ADDRESS INPUT */}
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={student.address}
                        placeholder="e.g. Sardar Gaon..."
                        onChange={(e) => handleCellChange(student.id, 'address', e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-350 text-zinc-900 rounded p-1.5 text-xs font-bold focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950 focus:outline-none text-left"
                      />
                    </td>

                    {/* DYNAMIC CUSTOM FIELDS INPUT */}
                    {customFieldKeys.map(key => {
                      const val = student.extraFields?.[key] || '';
                      return (
                        <td key={key} className="py-2.5 px-4">
                          <input
                            type="text"
                            value={val}
                            placeholder={`e.g. ${key}`}
                            onChange={(e) => handleCellChange(student.id, key, e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-350 text-zinc-900 rounded p-1.5 text-xs font-bold focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                          />
                        </td>
                      );
                    })}

                    {/* DELETE ACTION BUTTON */}
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="p-1.5 bg-zinc-100 hover:bg-red-50 text-zinc-500 hover:text-red-650 border border-zinc-300 hover:border-red-300 rounded transition duration-200 cursor-pointer"
                        title="Remove student row from list"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {students.length > 0 && (
        <div className="mt-8 p-6 bg-white border-2 border-zinc-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in text-left select-none" id="data-grid-proceed-section">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono tracking-widest text-[#D32F2F] font-black uppercase bg-[#D32F2F]/5 px-2 py-0.5 rounded border border-[#D32F2F]/20">
                LEDGER ACTIVE
              </span>
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-extrabold uppercase">
                {students.length} Records Staged
              </span>
            </div>
            <h3 className="text-base font-display font-black text-zinc-900 uppercase">Proceed to Bulk Card Generation</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
              Your school student spreadsheet sheet is parsed and loaded into browser memory. You edit names and upload photos in the table above. You can now adjust design details or load of the batch print suite.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            {onProceedToBranding && (
              <button
                onClick={onProceedToBranding}
                className="px-4.5 py-3 bg-zinc-50 hover:bg-zinc-100 border-2 border-zinc-900 text-zinc-900 text-xs font-mono font-black uppercase rounded-lg shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] hover:scale-[1.01]"
              >
                1. Review Customizations
              </button>
            )}
            {onProceedToPrint && (
              <button
                onClick={onProceedToPrint}
                className="px-5 py-3 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-mono font-black uppercase rounded-lg shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer inline-flex items-center justify-center gap-2 active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] hover:scale-[1.01]"
              >
                🚀 2. Print & Generate PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
