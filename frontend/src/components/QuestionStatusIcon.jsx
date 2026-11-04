import React from 'react';

/**
 * QuestionStatusIcon
 * Renders authentic NTA/JEE CBT examination question palette icons
 * exactly matching the standard exam panel template.
 * 
 * Status Types:
 * - ANSWERED: Green upward-pointed roof shape (white text)
 * - NOT_ANSWERED: Red-orange downward-pointed shield shape (white text)
 * - NOT_VISITED: Light silver/grey rounded box (dark text)
 * - MARKED: Royal purple circle (white text)
 * - ANSWERED_MARKED: Royal purple circle with small green badge at bottom right (white text)
 */
export default function QuestionStatusIcon({
  status = 'NOT_VISITED',
  number,
  className = 'w-9 h-9',
  title,
}) {
  let normStatus = (status || 'NOT_VISITED').toUpperCase();
  if (normStatus === 'REVIEW' || normStatus === 'MARKED_FOR_REVIEW') normStatus = 'MARKED';
  if (normStatus === 'ANSWERED_REVIEW' || normStatus === 'REVIEW_ANSWERED' || normStatus === 'ANSWERED_AND_MARKED') normStatus = 'ANSWERED_MARKED';
  
  const numStr = number !== undefined && number !== null ? String(number) : '';
  
  // Dynamic font size depending on number of digits
  const fontSize = numStr.length >= 3 ? 11 : numStr.length === 2 ? 13 : 15;

  return (
    <svg
      viewBox="0 0 40 40"
      className={`inline-block select-none overflow-visible ${className}`}
      aria-label={title || normStatus}
    >
      <defs>
        {/* Gradients matching authentic NTA / JEE CBT theme */}
        <linearGradient id="qsi-answered-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6bb316" />
          <stop offset="100%" stopColor="#449d21" />
        </linearGradient>

        <linearGradient id="qsi-not-answered-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ea4e1d" />
          <stop offset="100%" stopColor="#b62a04" />
        </linearGradient>

        <linearGradient id="qsi-not-visited-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f3f4f6" />
          <stop offset="100%" stopColor="#d9dde2" />
        </linearGradient>

        <linearGradient id="qsi-review-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c469a" />
          <stop offset="100%" stopColor="#4f246f" />
        </linearGradient>

        <linearGradient id="qsi-badge-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6bb316" />
          <stop offset="100%" stopColor="#449d21" />
        </linearGradient>

        {/* Drop shadow filter for subtle depth */}
        <filter id="qsi-shadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.7" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* 1. ANSWERED: Green Upward Pointed Roof */}
      {normStatus === 'ANSWERED' && (
        <g filter="url(#qsi-shadow)">
          <path
            d="M 18 3.5 L 4.5 10.5 A 3 3 0 0 0 2 13 L 2 36 A 3 3 0 0 0 5 39 L 35 39 A 3 3 0 0 0 38 36 L 38 13 A 3 3 0 0 0 35.5 10.5 L 22 3.5 A 3.5 3.5 0 0 0 18 3.5 Z"
            fill="url(#qsi-answered-grad)"
            stroke="#347813"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {numStr && (
            <text
              x="20"
              y="25"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              fontWeight="700"
              fontSize={fontSize}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {numStr}
            </text>
          )}
        </g>
      )}

      {/* 2. NOT ANSWERED: Red-Orange Downward Pointed Shield */}
      {normStatus === 'NOT_ANSWERED' && (
        <g filter="url(#qsi-shadow)">
          <path
            d="M 5 2 L 35 2 A 3 3 0 0 1 38 5 L 38 27 A 3 3 0 0 1 35.5 29.5 L 22 37.5 A 3.5 3.5 0 0 1 18 37.5 L 4.5 29.5 A 3 3 0 0 1 2 27 L 2 5 A 3 3 0 0 1 5 2 Z"
            fill="url(#qsi-not-answered-grad)"
            stroke="#8c1b00"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {numStr && (
            <text
              x="20"
              y="17"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              fontWeight="700"
              fontSize={fontSize}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {numStr}
            </text>
          )}
        </g>
      )}

      {/* 3. NOT VISITED: Light Silver/Grey Rounded Square */}
      {normStatus === 'NOT_VISITED' && (
        <g filter="url(#qsi-shadow)">
          <rect
            x="2.5"
            y="2.5"
            width="35"
            height="35"
            rx="5"
            ry="5"
            fill="url(#qsi-not-visited-grad)"
            stroke="#9fa5ae"
            strokeWidth="1.2"
          />
          {numStr && (
            <text
              x="20"
              y="20.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#1e293b"
              fontWeight="700"
              fontSize={fontSize}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {numStr}
            </text>
          )}
        </g>
      )}

      {/* 4. MARKED FOR REVIEW: Royal Purple Circle */}
      {normStatus === 'MARKED' && (
        <g filter="url(#qsi-shadow)">
          <circle
            cx="20"
            cy="20"
            r="17.5"
            fill="url(#qsi-review-grad)"
            stroke="#3f1b5b"
            strokeWidth="1.2"
          />
          {numStr && (
            <text
              x="20"
              y="20.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              fontWeight="700"
              fontSize={fontSize}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {numStr}
            </text>
          )}
        </g>
      )}

      {/* 5. ANSWERED & MARKED FOR REVIEW: Royal Purple Circle + Green Badge at bottom-right */}
      {normStatus === 'ANSWERED_MARKED' && (
        <g filter="url(#qsi-shadow)">
          <circle
            cx="20"
            cy="20"
            r="17.5"
            fill="url(#qsi-review-grad)"
            stroke="#3f1b5b"
            strokeWidth="1.2"
          />
          {numStr && (
            <text
              x="18"
              y="18.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              fontWeight="700"
              fontSize={numStr.length >= 2 ? 12 : 14}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {numStr}
            </text>
          )}
          {/* Small green badge at bottom right */}
          <g transform="translate(22, 22)">
            <rect
              x="0"
              y="0"
              width="15"
              height="15"
              rx="3"
              ry="3"
              fill="url(#qsi-badge-grad)"
              stroke="#ffffff"
              strokeWidth="1.3"
            />
            {/* Miniature evaluation/document symbol */}
            <rect
              x="3"
              y="3"
              width="9"
              height="9"
              rx="1.2"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.9"
            />
            <line x1="4.8" y1="6" x2="10.2" y2="6" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="4.8" y1="8.5" x2="10.2" y2="8.5" stroke="#ffffff" strokeWidth="0.8" />
          </g>
        </g>
      )}
    </svg>
  );
}
