import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

export interface FilterDropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  /** Unique key used to control which dropdown is open (pass the same `openId`/`onOpenChange` to all siblings) */
  id: string;
  /** Placeholder label shown in the trigger when `value === 'All'` */
  label: string;
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  /** Currently open dropdown id — controlled externally so only one is open at a time */
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  /** Highlights the border when a non-default filter is active */
  active?: boolean;
  style?: CSSProperties;
  width?: number | string;
  /** Renders a search box at the top of the panel (useful for long lists) */
  searchable?: boolean;
}

export default function FilterDropdown({
  id,
  label,
  value,
  options,
  onChange,
  openId,
  onOpenChange,
  active = false,
  style,
  width,
  searchable = false,
}: FilterDropdownProps) {
  const isOpen = openId === id;
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [search, setSearch] = useState('');
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, minWidth: 100 });
  const [ready, setReady] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelPos({ top: rect.bottom + 4, left: rect.left, minWidth: rect.width });
  }, []);

  const toggleOpen = () => {
    if (isOpen) {
      onOpenChange(null);
      return;
    }

    if (triggerRef.current && !isMobile) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + 4, left: rect.left, minWidth: rect.width });
      setReady(true);
    }

    onOpenChange(id);
  };

  useEffect(() => {
    if (!isOpen) {
      setReady(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isMobile) return;
    updatePos();
  }, [isOpen, isMobile, updatePos]);

  useEffect(() => {
    if (!isOpen || isMobile) return;
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [isOpen, isMobile, updatePos]);

  // Close on click outside (desktop only — mobile handled by overlay)
  useEffect(() => {
    if (!isOpen || isMobile) return;

    let handler: ((e: MouseEvent | TouchEvent) => void) | null = null;

    const rafId = requestAnimationFrame(() => {
      handler = (e: MouseEvent | TouchEvent) => {
        const target = e.target as Node;
        if (triggerRef.current?.contains(target)) return;
        if (panelRef.current?.contains(target)) return;
        if ((target as HTMLElement).closest?.(`[data-dropdown-id="${id}"]`)) return;
        onOpenChange(null);
      };

      document.addEventListener('mousedown', handler);
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (handler) {
        document.removeEventListener('mousedown', handler);
      }
    };
  }, [isOpen, isMobile, onOpenChange, id]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(null); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onOpenChange]);

  // Search state cleanup + autofocus
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      return;
    }

    if (searchable) {
      setTimeout(() => searchRef.current?.focus(), 30);
    }
  }, [isOpen, searchable]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isMobile]);

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = value === 'All' || !selectedOption ? label : selectedOption.label;

  const filteredOptions = searchable && search.trim()
    ? options.filter(o => o.value === 'All' || o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectOption = (val: string) => { onChange(val); onOpenChange(null); };

  const OptionList = () => (
    <>
      {filteredOptions.length === 0 ? (
        <div style={{ padding: '10px 12px', fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center' }}>No results</div>
      ) : (
        filteredOptions.map(option => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected}
              onMouseDown={e => e.stopPropagation()}
              onClick={() => selectOption(option.value)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%',
                padding: isMobile ? '14px 16px' : '8px 12px',
                fontSize: isMobile ? '0.92rem' : '0.8rem',
                minHeight: isMobile ? 48 : undefined,
                  background: selected ? 'var(--acid-soft)' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: selected ? 'var(--acid)' : 'var(--text-secondary)',
                textAlign: 'left', fontFamily: 'inherit',
                  fontWeight: selected ? 600 : 400,
                borderBottom: isMobile ? '1px solid var(--border)' : 'none',
                  borderLeft: selected ? '2px solid var(--acid)' : '2px solid transparent',
                  transition: 'all 0.12s ease',
              }}
              onMouseEnter={e => {
                  if (!selected) {
                    e.currentTarget.style.background = 'var(--bg-surface)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.paddingLeft = isMobile ? '18px' : '14px';
                  }
              }}
              onMouseLeave={e => {
                  if (!selected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.paddingLeft = isMobile ? '16px' : '12px';
                  }
              }}
            >
              <span>{option.label}</span>
              {selected && <Check size={isMobile ? 14 : 11} style={{ flexShrink: 0, marginLeft: 6, color: 'var(--acid)' }} />}
            </button>
          );
        })
      )}
    </>
  );

  // ── MOBILE: bottom sheet ───────────────────────────────
  const mobilePanel = isOpen && isMobile ? (
    <>
      <div className="bottom-sheet-overlay" onClick={() => onOpenChange(null)} />
      <div className="bottom-sheet" role="dialog" aria-label={`Select ${label}`}>
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-header">
          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{label}</span>
          <button
            onClick={() => onOpenChange(null)}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>
        {searchable && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              style={{
                width: '100%', height: 40, fontSize: '0.9rem',
                background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '0 12px', color: 'var(--text-secondary)',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>
        )}
        <div className="bottom-sheet-body" style={{ padding: 0 }} role="listbox">
          <OptionList />
        </div>
      </div>
    </>
  ) : null;

  const desktopPanel = isOpen && !isMobile && ready ? (
    <div
      ref={panelRef}
      data-dropdown-id={id}
      role="listbox"
      style={{
        position: 'fixed',
        top: panelPos.top,
        left: panelPos.left,
        minWidth: panelPos.minWidth,
        width: searchable ? Math.max(panelPos.minWidth, 220) : panelPos.minWidth,
        zIndex: 10001,
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.08s ease both',
      }}
    >
      {searchable && (
        <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onMouseDown={e => e.stopPropagation()}
            placeholder="Search companies…"
            style={{
              width: '100%', height: 28, fontSize: '0.75rem',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '0 8px', color: 'var(--text-secondary)',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
      )}
      <div style={{ overflowY: 'auto', maxHeight: searchable ? 240 : 280 }}>
        <OptionList />
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        style={{
          position: 'relative', display: 'inline-block',
          width: width ?? 'auto',
          minWidth: typeof width === 'number' ? width : undefined,
          ...style,
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleOpen}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`${label}: ${displayLabel}`}
          style={{
            height: 34, fontSize: '0.76rem',
            color: active ? 'var(--acid)' : 'var(--text-secondary)',
            background: active ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
            border: `1.5px solid ${active ? 'var(--acid)' : 'var(--border)'}`,
            borderRadius: 8, paddingLeft: 10, paddingRight: 28,
            outline: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            width: '100%', textAlign: 'left', position: 'relative', fontFamily: 'inherit',
            transition: 'all 0.2s ease',
            fontWeight: active ? 600 : 400,
          }}
        >
          <span
            style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--acid)', flexShrink: 0 }} />}
            {displayLabel}
          </span>
          <ChevronDown
            size={12}
            style={{
              position: 'absolute', right: 8, top: '50%',
              transform: `translateY(-50%) rotate(${isOpen ? 180 : 0}deg)`,
              transition: 'transform 0.18s', color: active ? 'var(--acid)' : 'var(--text-muted)', pointerEvents: 'none',
            }}
          />
        </button>
      </div>
      {mobilePanel && createPortal(mobilePanel, document.body)}
      {desktopPanel && createPortal(desktopPanel, document.body)}
    </>
  );
}
