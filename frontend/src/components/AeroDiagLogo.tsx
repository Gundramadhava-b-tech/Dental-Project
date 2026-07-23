interface AeroDiagLogoProps {
  size?: number;
  className?: string;
}

export function AeroDiagLogo({ size = 40, className = "" }: AeroDiagLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer ring */}
      <circle cx="20" cy="20" r="19" stroke="hsl(175,100%,38%)" strokeWidth="1.2" strokeOpacity="0.4" />

      {/* Background fill */}
      <circle cx="20" cy="20" r="18" fill="hsl(175,100%,38%)" fillOpacity="0.08" />

      {/* Airway cross-section — outer boundary */}
      <ellipse cx="20" cy="20" r="12" ry="11" stroke="hsl(175,100%,55%)" strokeWidth="1.5" fill="none" />

      {/* Airway cross-section — inner lumen (patent airway) */}
      <ellipse cx="20" cy="20" rx="7" ry="6.5"
        stroke="hsl(175,100%,70%)" strokeWidth="1" fill="hsl(175,100%,38%)" fillOpacity="0.15" />

      {/* Cartilage arcs (C-rings of trachea) */}
      <path
        d="M 13.5 17 Q 20 13.5 26.5 17"
        stroke="hsl(175,100%,65%)" strokeWidth="1.2" fill="none"
        strokeLinecap="round" strokeOpacity="0.7"
      />
      <path
        d="M 13.5 23 Q 20 26.5 26.5 23"
        stroke="hsl(175,100%,65%)" strokeWidth="1.2" fill="none"
        strokeLinecap="round" strokeOpacity="0.7"
      />

      {/* ECG pulse line cutting across the logo */}
      <polyline
        points="4,20 8,20 10.5,20 12,16.5 13.5,23.5 15,14.5 16.5,25.5 18,20 22,20 24,20 25,17.5 26,22 27.5,20 36,20"
        stroke="hsl(175,100%,80%)" strokeWidth="1.3"
        strokeLinecap="round" strokeLinejoin="round"
        fill="none" strokeOpacity="0.9"
      />

      {/* Center dot — minimum lumen point */}
      <circle cx="20" cy="20" r="1.8" fill="hsl(175,100%,75%)" fillOpacity="0.9" />

      {/* Glow dot */}
      <circle cx="20" cy="20" r="3.5" fill="hsl(175,100%,65%)" fillOpacity="0.2" />
    </svg>
  );
}
