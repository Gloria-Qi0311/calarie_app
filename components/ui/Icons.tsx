import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function TargetIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-orange-600" {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.8" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-pink-600" {...props}>
      <path
        d="m13.5 2.6-9 10.2a1 1 0 0 0 .8 1.6h4.1l-1 6.8a.9.9 0 0 0 1.6.7l9-10.2a1 1 0 0 0-.8-1.6H14l1-6.8a.9.9 0 0 0-1.6-.7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-amber-600" {...props}>
      <path
        d="M12 20.2 4.5 12.9a5.2 5.2 0 1 1 7.5-7.2 5.2 5.2 0 1 1 7.5 7.2L12 20.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
