import React from 'react'

interface AvatarProps {
  seed?: string
  size?: number
  className?: string
}

const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return h >>> 0
}

const pick = <T,>(h: number, arr: T[]) => arr[h % arr.length]

const palettes = [
  { bg1: '#FFD166', bg2: '#EF476F', stroke: '#0F172A', accents: ['#06D6A0', '#118AB2', '#8B5CF6'] },
  { bg1: '#FDE68A', bg2: '#FCA5A5', stroke: '#0F172A', accents: ['#22C55E', '#60A5FA', '#FB7185'] },
  { bg1: '#A7F3D0', bg2: '#93C5FD', stroke: '#0F172A', accents: ['#F59E0B', '#EF4444', '#8E44AD'] },
  { bg1: '#FBCFE8', bg2: '#C7D2FE', stroke: '#0F172A', accents: ['#34D399', '#4ECCA3', '#F59E0B'] },
  { bg1: '#FCD34D', bg2: '#9CA3AF', stroke: '#0F172A', accents: ['#2563EB', '#10B981', '#EC4899'] }
]

const Avatar: React.FC<AvatarProps> = ({ seed = 'user', size = 40, className }) => {
  const h = hash(seed)
  const p = pick(h, palettes)
  const r1 = 18 + (h % 8)
  const r2 = 10 + ((h >> 2) % 6)
  const r3 = 8 + ((h >> 3) % 6)
  const c1x = 22 + ((h >> 4) % 16)
  const c1y = 24 + ((h >> 5) % 12)
  const c2x = 40 - ((h >> 6) % 14)
  const c2y = 38 - ((h >> 7) % 10)
  const rx = 6 + ((h >> 8) % 6)
  const w = 20 + ((h >> 9) % 12)
  const qx = ((h >> 10) % 12) - 6
  const qy = ((h >> 11) % 10) - 5
  const tx = ((h >> 12) % 14) - 7
  const ty = ((h >> 13) % 12) - 6
  const dots = 5 + ((h >> 14) % 4)
  const rot = (h >> 15) % 360

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="a">
          <circle cx="32" cy="32" r="32" />
        </clipPath>
        <radialGradient id="g" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor={p.bg1} />
          <stop offset="100%" stopColor={p.bg2} />
        </radialGradient>
      </defs>
      <g clipPath="url(#a)">
        <rect width="64" height="64" fill="url(#g)" />
        <circle cx="32" cy="32" r="31" stroke={p.stroke} strokeWidth="2.5" fill="none" />
        <circle cx={c1x} cy={c1y} r={r1} fill={p.accents[0]} opacity="0.9" />
        <circle cx={c2x} cy={c2y} r={r2} fill={p.accents[1]} opacity="0.9" />
        <rect x={32 - w / 2} y={20} width={w} height={r3 * 2} rx={rx} fill={p.accents[2]} opacity="0.85" transform={`rotate(${rot} 32 32)`} />
        <path d={`M ${20 + ((h >> 16) % 8)} ${44 - ((h >> 17) % 6)} q ${qx} ${qy} ${12 + ((h >> 18) % 10)} ${8 + ((h >> 19) % 8)} t ${tx} ${ty}`} stroke={p.stroke} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
        {[...Array(dots)].map((_, i) => {
          const dx = 10 + ((h >> (20 + i)) % 44)
          const dy = 10 + ((h >> (24 + i)) % 44)
          const rr = 1.8 + ((h >> (28 + i)) % 2)
          const col = pick(h >> (30 + i), p.accents)
          return <circle key={i} cx={dx} cy={dy} r={rr} fill={col} opacity="0.9" />
        })}
        <polygon points={`${32},${14} ${36},${22} ${45},${23} ${39},${29} ${41},${38} ${32},${34} ${23},${38} ${25},${29} ${19},${23} ${28},${22}`} fill={p.accents[(h >> 3) % 3]} opacity="0.8" transform={`rotate(${rot / 2} 32 32)`} />
      </g>
    </svg>
  )
}

export default Avatar