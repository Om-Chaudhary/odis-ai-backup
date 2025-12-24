import { cn } from '@odis-ai/shared/ui/extension';

interface MenuBarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const MenuBarHeader = ({ isCollapsed, onToggleCollapse }: MenuBarHeaderProps) => (
  <div
    className={cn(
      'flex min-h-[36px] items-center justify-between px-4 py-2',
      isCollapsed && 'min-h-[28px] flex-nowrap gap-1.5 px-3 py-0.5',
    )}>
    <div className={cn('flex items-center gap-2', isCollapsed && 'justify-start gap-1.5 whitespace-nowrap')}>
      <span
        className="text-primary flex h-5 w-5 items-center justify-center rounded-full bg-white text-[12px] font-extrabold leading-none"
        style={{ color: '#31aba3' }} // Force text color
        aria-hidden="true">
        O
      </span>
      {!isCollapsed && (
        <span className="text-[15px] font-bold tracking-wide text-white shadow-sm drop-shadow-sm">ODIS</span>
      )}
      <span
        className={cn(
          'rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white',
          isCollapsed && 'px-1.5 text-[10px]',
        )}>
        Neo
      </span>
    </div>
    <button
      className="flex h-7 w-7 items-center justify-center rounded-md border border-white/25 bg-white/15 text-white transition-all hover:scale-105 hover:border-white/40 hover:bg-white/25 active:scale-95"
      onClick={onToggleCollapse}
      title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
      aria-label={isCollapsed ? 'Expand menu' : 'Collapse menu'}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className={cn('transition-transform duration-300 ease-out', isCollapsed && 'rotate-180')}>
        <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  </div>
);
