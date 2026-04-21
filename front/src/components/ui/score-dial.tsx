"use client"

import React, { useEffect, useRef, useState } from "react"

interface ScoreDialProps {
  value: number       // 0–100
  size?: number       // overall width in px (default 200)
  label?: string      // text below the score number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export function ScoreDial({ value, size = 200, label }: ScoreDialProps) {
  const [animated, setAnimated] = useState(0)
  const rafRef = useRef<number>(0)
  const clamped = Math.max(0, Math.min(100, value))

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    let startTime: number | null = null
    const duration = 1200

    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const t = Math.min((ts - startTime) / duration, 1)
      setAnimated(clamped * easeOutBack(t))
      if (t < 1) rafRef.current = requestAnimationFrame(step)
      else setAnimated(clamped) // snap to exact value at end
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [clamped])

  // ── Layout ───────────────────────────────────────────────────────────────
  const W  = size
  const H  = Math.round(size * 0.64)
  const cx = W / 2
  const cy = H - Math.round(size * 0.05)   // pivot near the bottom edge

  const R  = Math.round(size * 0.38)        // arc radius
  const sw = Math.round(size * 0.068)       // track stroke width

  // ── Arc geometry ──────────────────────────────────────────────────────────
  // Semicircle: from (cx-R, cy) → top → (cx+R, cy), sweep counterclockwise
  const arcD = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`
  const circumference = Math.PI * R
  const dashOffset    = circumference * (1 - animated / 100)

  // ── Needle geometry ───────────────────────────────────────────────────────
  // 0% → angle π (left), 100% → angle 0 (right)
  const needleAngle = Math.PI * (1 - animated / 100)
  const nLen  = R - sw * 0.55              // tip sits just inside the arc rim
  const nTail = size * 0.05               // small tail behind center for balance
  const tipX  = cx + nLen  * Math.cos(needleAngle)
  const tipY  = cy - nLen  * Math.sin(needleAngle)
  const baseX = cx - nTail * Math.cos(needleAngle)
  const baseY = cy + nTail * Math.sin(needleAngle)

  // ── Color (dynamic, matches gradient) ────────────────────────────────────
  const color =
    animated < 40 ? "#ef4444" :
    animated < 70 ? "#f97316" : "#22c55e"

  // ── Unique SVG IDs (safe for multiple dials per page) ─────────────────────
  const uid    = `sd-${Math.round(cx)}-${Math.round(cy)}`
  const gradId = `${uid}-grad`
  const glowId = `${uid}-glow`
  const maskId = `${uid}-mask`

  // ── Ticks ─────────────────────────────────────────────────────────────────
  const majorTicks = [0, 25, 50, 75, 100]
  const minorTicks = [10, 20, 30, 40, 60, 70, 80, 90]

  function tickPoint(t: number, r: number) {
    const a = Math.PI * (1 - t / 100)
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }
  }

  const outerR = R + sw * 0.6 + size * 0.018
  const innerMajor = R - sw * 0.6 - size * 0.006
  const innerMinor = R - sw * 0.6 - size * 0.001
  const labelR = outerR + size * 0.062

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      overflow="visible"
      role="img"
      aria-label={`${label ?? "Score"}: ${Math.round(animated)}%`}
    >
      <defs>
        {/* Red → orange → yellow → green gradient along the arc */}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ef4444" />
          <stop offset="38%"  stopColor="#f97316" />
          <stop offset="65%"  stopColor="#eab308" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>

        {/* Soft glow for the leading edge of the arc */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={sw * 0.55} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Clip mask so glow cap doesn't bleed outside the arc area */}
        <clipPath id={maskId}>
          <rect x={cx - R - sw * 2} y={cy - R - sw * 2} width={R * 2 + sw * 4} height={R + sw * 3} />
        </clipPath>
      </defs>

      {/* ── Track (background arc) ──────────────────────────────────────── */}
      <path
        d={arcD}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={sw}
        strokeLinecap="round"
      />

      {/* ── Inner track shadow line ─────────────────────────────────────── */}
      <path
        d={arcD}
        fill="none"
        stroke="#d1d5db"
        strokeWidth={sw * 0.08}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={0}
        opacity={0.6}
      />

      {/* ── Coloured fill arc ───────────────────────────────────────────── */}
      <path
        d={arcD}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
      />

      {/* ── Glow dot at the leading edge of the fill ───────────────────── */}
      {animated > 1 && (
        <circle
          cx={tipX}
          cy={tipY}
          r={sw * 0.62}
          fill={color}
          opacity={0.55}
          filter={`url(#${glowId})`}
          clipPath={`url(#${maskId})`}
        />
      )}

      {/* ── Minor tick marks ────────────────────────────────────────────── */}
      {minorTicks.map(t => {
        const o = tickPoint(t, outerR - size * 0.004)
        const i = tickPoint(t, innerMinor)
        return (
          <line
            key={`minor-${t}`}
            x1={o.x} y1={o.y} x2={i.x} y2={i.y}
            stroke="#d1d5db"
            strokeWidth={1}
            strokeLinecap="round"
          />
        )
      })}

      {/* ── Major tick marks + labels ────────────────────────────────────── */}
      {majorTicks.map(t => {
        const o = tickPoint(t, outerR)
        const i = tickPoint(t, innerMajor)
        const l = tickPoint(t, labelR)
        return (
          <g key={`major-${t}`}>
            <line
              x1={o.x} y1={o.y} x2={i.x} y2={i.y}
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <text
              x={l.x}
              y={l.y + size * 0.018}
              textAnchor="middle"
              fontSize={size * 0.047}
              fill="#9ca3af"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {t}
            </text>
          </g>
        )
      })}

      {/* ── Needle ──────────────────────────────────────────────────────── */}
      {/* Shadow */}
      <line
        x1={baseX} y1={baseY + size * 0.004}
        x2={tipX}  y2={tipY  + size * 0.004}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={size * 0.014}
        strokeLinecap="round"
      />
      {/* Needle body */}
      <line
        x1={baseX} y1={baseY}
        x2={tipX}  y2={tipY}
        stroke="#1e293b"
        strokeWidth={size * 0.012}
        strokeLinecap="round"
      />

      {/* ── Center cap ──────────────────────────────────────────────────── */}
      <circle cx={cx} cy={cy} r={sw * 0.56} fill="white" stroke="#e5e7eb" strokeWidth={size * 0.01} />
      <circle cx={cx} cy={cy} r={sw * 0.28} fill={color} />

      {/* ── Score text ──────────────────────────────────────────────────── */}
      <text
        x={cx}
        y={cy - R * 0.36}
        textAnchor="middle"
        fontSize={size * 0.21}
        fontWeight="800"
        fill={color}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {Math.round(animated)}%
      </text>

      {/* ── Optional label ──────────────────────────────────────────────── */}
      {label && (
        <text
          x={cx}
          y={cy - R * 0.36 + size * 0.14}
          textAnchor="middle"
          fontSize={size * 0.058}
          fill="#9ca3af"
          letterSpacing="0.03em"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {label.toUpperCase()}
        </text>
      )}
    </svg>
  )
}
