/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  phone: string;
  address: string;
  photo?: string; // Base64 data URL or external URL
  fatherName?: string;
  dob?: string;
  extraFields?: Record<string, string>;
}

export interface CardConfig {
  layoutStyle?: string; // Optional layout ID preset (e.g. 'academic', 'pathway', 'ingoude-kimberly', etc)
  schoolNamePre: string; // Left text line 1, fallback
  schoolNameSuf: string; // Right accent line 1, fallback
  schoolNameLine2Pre: string; // Left text line 2, fallback
  schoolNameLine2Suf: string; // Right accent line 2, fallback
  schoolLogo: string; // SVG or image Base64/DataURL
  principalName: string; // Printed name of the principal
  principalSign: string; // SVG signature or image Base64/DataURL
  session: string; // e.g. "2026-2027"
  defaultClass: string; // e.g. "X"
  estd: string; // e.g. "2013"
  motto: string; // e.g. "LEARN LIKE A PRO"
  themeColor: string; // Brand accent color
  gridBackground: boolean; // General backdrop helper
  draftGridType?: 'blueprint' | 'double-rule' | 'crosshair' | 'radial' | 'isometric' | 'golden' | 'bounds' | 'matrix' | 'graph' | 'none';
  policyLine?: string; // Bottom single footer policy line or disclaimer
  schoolTitleLines?: {
    id: string;
    text: string;
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    letterSpacing?: string; // 'normal' | 'wide' | 'widest' | 'tight'
    lineHeight?: string; // 'none' | 'tight' | 'normal' | 'relaxed'
  }[];
  customTextBoxes?: {
    id: string;
    label: string;
    value: string;
    side: 'front' | 'back';
    offsetX: number;
    offsetY: number;
    fontSize?: number;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontFamily?: string;
    letterSpacing?: string;
  }[];
  sizes?: {
    schoolLogo?: number;
    schoolNameLine1?: number;
    schoolNameLine2?: number;
    studentPhoto?: number;
    studentName?: number;
    studentMeta?: number;
    sideStripeText?: number;
    backLogo?: number;
    backTermsTitle?: number;
    backTermsText?: number;
    principalSign?: number;
    principalName?: number;
    fieldLabels?: number;
    fieldRollVal?: number;
    fieldClassVal?: number;
    fieldPhoneVal?: number;
    fieldAddressVal?: number;
  };
  textStyles?: {
    [key: string]: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      color?: string;
      customSize?: number;
      offsetX?: number;
      offsetY?: number;
      fontFamily?: string;
      letterSpacing?: string;
      lineHeight?: string;
      hidden?: boolean;
    }
  };
  globalTextScale?: number;
  showTermsOnBack?: boolean;
  terms: {
    id: string;
    label: string;
    text: string;
  }[];
  cardTexture?: 'matte' | 'glossy' | 'holographic' | 'none';
}

export interface ColumnMap {
  name: string;
  rollNo: string;
  class: string;
  phone: string;
  address: string;
  photo: string;
  fatherName?: string;
  dob?: string;
}

export interface SavedTemplate {
  id: string;
  name: string;
  timestamp: string;
  config: CardConfig;
  isSystem?: boolean;
  category?: string; // e.g. "Vintage", "Minimalist", "Neon Tech", etc.
}

