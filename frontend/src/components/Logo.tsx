import { Link } from 'react-router-dom'

interface LogoProps {
  className?: string
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="none"
        className="w-8 h-8"
      >
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <text x="16" y="23" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" className="fill-primary-foreground" textAnchor="middle">V</text>
      </svg>
      <span className="text-xl font-bold text-foreground">Validate it</span>
    </Link>
  )
}
