interface FlagDisplayProps {
  emoji: string
  /** px width of the flag image (default 40) */
  imgWidth?: number
  /** height class, e.g. "h-7" (default "h-7") */
  heightClass?: string
  /** fallback text-size class when emoji is non-flag, e.g. "text-4xl" */
  textClass?: string
  className?: string
}

/**
 * Renders a country flag using flagcdn.com when the emoji is a regional-indicator
 * pair (🇺🇦, 🇬🇧, …) so that flags display correctly on all OSes and browsers.
 * Falls back to a plain <span> for non-flag emoji like 🌐.
 */
export function FlagDisplay({
  emoji,
  imgWidth = 40,
  heightClass = 'h-7',
  textClass = 'text-3xl',
  className = '',
}: FlagDisplayProps) {
  const cps = [...(emoji || '')]

  const isCountryFlag =
    cps.length === 2 &&
    cps.every((c) => {
      const cp = c.codePointAt(0) ?? 0
      return cp >= 0x1f1e6 && cp <= 0x1f1ff
    })

  if (isCountryFlag) {
    const cc = cps
      .map((c) => String.fromCharCode((c.codePointAt(0) ?? 0) - 0x1f1e6 + 65))
      .join('')
      .toLowerCase()

    return (
      <img
        src={`https://flagcdn.com/w${imgWidth}/${cc}.png`}
        alt={cc.toUpperCase()}
        className={`${heightClass} w-auto object-cover rounded ${className}`}
        loading="lazy"
      />
    )
  }

  return <span className={`${textClass} ${className}`}>{emoji || '🌐'}</span>
}
