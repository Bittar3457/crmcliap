import React from 'react'

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  monochrome?: boolean
}

/**
 * CliapIcon - Símbolo oficial da Cliap
 * Círculo azul-ardósia e duas folhas/brotos sobrepostos (terracota e verde-sálvia)
 */
export function CliapIcon({ className = 'h-8 w-8', monochrome = false, ...props }: LogoProps) {
  if (monochrome) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <circle cx="50" cy="22" r="14" fill="currentColor" />
        <path
          d="M 50 82 C 40 80, 26 64, 25 43 C 38 41, 48 49, 52 74 Z"
          fill="currentColor"
          opacity="0.9"
        />
        <path
          d="M 46 75 C 47 48, 59 39, 74 38 C 76 60, 62 78, 50 82 Z"
          fill="currentColor"
          opacity="0.75"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" {...props}>
      {/* Círculo superior azul-ardósia */}
      <circle cx="50" cy="22" r="14" fill="#44586C" />
      {/* Folha terracota */}
      <path d="M 50 82 C 40 80, 26 64, 25 43 C 38 41, 48 49, 52 74 Z" fill="#B06A5E" />
      {/* Folha verde-sálvia com sobreposição */}
      <path
        d="M 46 75 C 47 48, 59 39, 74 38 C 76 60, 62 78, 50 82 Z"
        fill="#8A9A82"
        style={{ mixBlendMode: 'multiply', opacity: 0.95 }}
      />
    </svg>
  )
}

interface CliapLogoProps {
  className?: string
  iconSize?: string
  variant?: 'light' | 'dark' | 'auto'
  orientation?: 'horizontal' | 'vertical'
  subtitle?: boolean
}

/**
 * CliapLogo - Logo completo com símbolo + CLIAP + Pediatria e Imunização
 */
export function CliapLogo({
  className = '',
  iconSize = 'h-9 w-9',
  variant = 'auto',
  orientation = 'horizontal',
  subtitle = true,
}: CliapLogoProps) {
  const isDark = variant === 'dark' // para fundos escuros

  return (
    <div
      className={`flex ${
        orientation === 'vertical'
          ? 'flex-col items-center text-center space-y-2'
          : 'items-center space-x-3'
      } ${className}`}
    >
      <div className="shrink-0 flex items-center justify-center">
        {variant === 'dark' ? (
          <div className="p-1 rounded-xl bg-white/10 backdrop-blur-sm">
            <CliapIcon className={iconSize} />
          </div>
        ) : (
          <CliapIcon className={iconSize} />
        )}
      </div>

      <div className={orientation === 'vertical' ? 'text-center' : 'leading-tight'}>
        <div className="flex items-center">
          <span
            className={`font-serif tracking-[0.14em] font-bold text-lg md:text-xl ${
              isDark ? 'text-white' : 'text-[#1F3A4D]'
            }`}
            style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
          >
            CLIAP
          </span>
        </div>
        {subtitle && (
          <span
            className={`block text-[9.5px] uppercase font-medium tracking-[0.22em] ${
              isDark ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Pediatria e Imunização
          </span>
        )}
      </div>
    </div>
  )
}
