declare module 'lucide-react/dist/esm/icons/*.mjs' {
  import type { ForwardRefExoticComponent, RefAttributes } from 'react';
  import type { LucideProps } from 'lucide-react';

  const icon: ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;

  export default icon;
}