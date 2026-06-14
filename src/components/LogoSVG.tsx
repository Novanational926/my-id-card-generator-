/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const LogoSVG: React.FC<LogoProps> = ({ className = '', size = 100 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`select-none ${className}`}
      id="school-logo-svg"
    >
      <defs>
        {/* Curved path for school name (centered arc on top) */}
        <path
          id="namePath"
          d="M 23,100 A 77,77 0 1,1 177,100"
          fill="none"
        />
        {/* Curved path for ESTD and motto on bottom */}
        <path
          id="bottomPath"
          d="M 177,100 A 77,77 0 0,1 23,100"
          fill="none"
        />
      </defs>

      {/* Outer Ring */}
      <circle cx="100" cy="100" r="95" fill="#000000" />
      <circle cx="100" cy="100" r="92" fill="none" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#94A3B8" strokeWidth="1.5" />

      {/* Inner White Arena */}
      <circle cx="100" cy="100" r="72" fill="#FFFFFF" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="#E2E8F0" strokeWidth="1" />

      {/* Top Banner Text: DOBOKA SENIOR SECONDARY SCHOOL */}
      <text fill="#FFFFFF" fontSize="10.8" fontWeight="800" fontFamily='"Space Grotesk", sans-serif' letterSpacing="0.8">
        <textPath href="#namePath" startOffset="50%" textAnchor="middle">
          DOBOKA SENIOR SECONDARY SCHOOL
        </textPath>
      </text>

      {/* Bottom Banner Text: ESTD : 2013 */}
      <text fill="#FFFFFF" fontSize="9.5" fontWeight="800" fontFamily='"Space Grotesk", sans-serif' letterSpacing="1.2">
        <textPath href="#bottomPath" startOffset="50%" textAnchor="middle">
          ★ ESTD : 2013 ★
        </textPath>
      </text>

      {/* Inner Laurel Wreath Vectors */}
      <g stroke="#2D3748" strokeWidth="1" fill="none" transform="translate(100, 107) scale(0.85)">
        {/* Left Laurel */}
        <path d="M -15,10 C -45,-15 -35,-55 -5,-65" strokeWidth="2" strokeLinecap="round" />
        <path d="M -23,-3 Q -34,-2 -30,-8 Z" fill="#2D3748" />
        <path d="M -27,-13 Q -38,-14 -33,-20 Z" fill="#2D3748" />
        <path d="M -28,-25 Q -38,-30 -31,-34 Z" fill="#2D3748" />
        <path d="M -25,-38 Q -33,-43 -26,-48 Z" fill="#2D3748" />
        <path d="M -18,-50 Q -24,-55 -17,-60 Z" fill="#2D3748" />
        <path d="M -8,-58 Q -12,-63 -6,-67 Z" fill="#2D3748" />

        {/* Right Laurel */}
        <path d="M 15,10 C 45,-15 45,-55 5,-65" strokeWidth="2" strokeLinecap="round" />
        <path d="M 23,-3 Q 34,-2 30,-8 Z" fill="#2D3748" />
        <path d="M 27,-13 Q 38,-14 33,-20 Z" fill="#2D3748" />
        <path d="M 28,-25 Q 38,-30 31,-34 Z" fill="#2D3748" />
        <path d="M 25,-38 Q 33,-43 26,-48 Z" fill="#2D3748" />
        <path d="M 18,-50 Q 24,-55 17,-60 Z" fill="#2D3748" />
        <path d="M 8,-58 Q 12,-63 6,-67 Z" fill="#2D3748" />
      </g>

      {/* Middle Shield */}
      <g transform="translate(100, 95) scale(0.9)">
        {/* Outer shield frame */}
        <path
          d="M -25,-32 L 25,-32 C 25,-32 28,5 25,15 C 21,27 0,42 0,42 C 0,42 -21,27 -25,15 C -28,5 -25,-32 -25,-32 Z"
          fill="#1A202C"
          stroke="#4D5562"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Inner shield fill */}
        <path
          d="M -21,-28 L 21,-28 C 21,-28 24,5 21,13 C 18,23 0,36 0,36 C 0,36 -18,23 -21,13 C -24,5 -21,-28 -21,-28 Z"
          fill="#2D3748"
        />

        {/* Open Book Vector in the Shield */}
        <g fill="#FFFFFF" stroke="#1A202C" strokeWidth="1" transform="translate(0, -5) scale(0.85)">
          {/* Left page */}
          <path d="M -18,-15 C -10,-18 -2,-12 -2,-1 L -2,12 C -2,2 -10,-4 -18,-2 Z" />
          {/* Right page */}
          <path d="M 18,-15 C 10,-18 2,-12 2,-1 L 2,12 C 2,2 10,-4 18,-2 Z" />
          {/* Lines on left page */}
          <line x1="-14" y1="-8" x2="-6" y2="-8" stroke="#718096" strokeWidth="1" />
          <line x1="-14" y1="-3" x2="-6" y2="-3" stroke="#718096" strokeWidth="1" />
          <line x1="-14" y1="2" x2="-6" y2="2" stroke="#718096" strokeWidth="1" />
          {/* Lines on right page */}
          <line x1="14" y1="-8" x2="6" y2="-8" stroke="#718096" strokeWidth="1" />
          <line x1="14" y1="-3" x2="6" y2="-3" stroke="#718096" strokeWidth="1" />
          <line x1="14" y1="2" x2="6" y2="2" stroke="#718096" strokeWidth="1" />
        </g>
        {/* Achievement Chevron on top of shield */}
        <path d="M -15,-22 L 0,-14 L 15,-22" fill="none" stroke="#CBD5E0" strokeWidth="2.5" />
      </g>

      {/* Curved ribbon at the bottom */}
      <path
        d="M 23,150 C 40,172 160,172 177,150 L 187,162 C 160,192 40,192 13,162 Z"
        fill="#000000"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Ribbon end accents */}
      <path d="M 23,150 L 13,162 L 30,162 Z" fill="#000000" stroke="#FFFFFF" strokeWidth="1.2" />
      <path d="M 177,150 L 187,162 L 170,162 Z" fill="#000000" stroke="#FFFFFF" strokeWidth="1.2" />

      {/* Ribbon text: LEARN LIKE A PRO SCORE LIKE A LEGEND */}
      <text
        fill="#FFFFFF"
        fontSize="5.8"
        fontWeight="800"
        fontFamily='"Space Grotesk", sans-serif'
        letterSpacing="0.4"
        id="motto-text-element"
      >
        <textPath href="#bottomPath" startOffset="50%" textAnchor="middle" dy="-3">
          LEARN LIKE A PRO SCORE LIKE A LEGEND
        </textPath>
      </text>
    </svg>
  );
};

export const SignatureSVG: React.FC<LogoProps & { strokeColor?: string }> = ({
  className = '',
  size = 120,
  strokeColor = '#1e293b'
}) => {
  return (
    <svg
      width={size * 2}
      height={size}
      viewBox="0 0 300 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      id="principal-signature-svg"
    >
      {/* High-quality calligraphic stroke representation of "Yasir Arafat" signature */}
      <path
        d="M 20,45 
           C 25,18   45,15   50,40
           C 53,55   45,85   32,85
           C 23,85   35,60   48,45
           C 54,38   65,25   70,45
           C 72,55   58,80   68,80
           C 72,80   78,65   82,58
           C 85,52   90,48   91,52
           C 92,58   88,72   94,72
           C 96,72   100,65  104,58
           M 85,42 C 86,41  87,41   87,42 M 85,42 A 1.5,1.5 0 1 1 85,42.1
           
           M 103,50 C 110,48  118,48  122,54
           C 125,58  120,72  116,72
           C 112,72  115,62  124,55
           C 132,48  140,55  136,70
           C 135,74  124,75  130,75
           
           M 148,42 
           C 152,30  160,12  168,10
           C 173,8   178,25  174,40
           C 171,52  162,75  155,75
           C 149,75  158,55  171,45
           C 178,38  185,25  192,42
           C 196,52  185,75  194,75
           C 198,75  204,65  208,58
           M 160,42 L 182,40
           
           M 204,58
           C 210,50  218,50  222,58
           C 225,64  218,75  214,75
           C 210,75  214,64  222,58
           C 228,52  235,52  238,65
           C 239,70  232,75  242,75
           
           M 244,45
           C 245,28  255,18  262,18
           C 266,18  268,28  264,45
           C 260,60  245,75  240,75
           C 235,75  245,55  262,40
           C 272,32  285,32  292,40
           
           M 170,78 
           C 190,75  215,68  240,65
           C 260,62  285,60  295,62"
        stroke={strokeColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
