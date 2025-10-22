'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface MinimalSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function MinimalSelect({ value, onChange, options, placeholder = 'Select an option', className = '', disabled = false }: MinimalSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && selected) {
      const idx = options.findIndex((o) => o.value === selected.value);
      setActiveIndex(idx);
    } else if (!isOpen) {
      setActiveIndex(-1);
    }
  }, [isOpen, selected, options]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (activeIndex >= 0) {
        onChange(options[activeIndex].value);
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full text-left minimal-select pr-10 disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`block truncate ${selected ? 'text-black' : 'text-gray-500'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <ChevronDown className={`w-5 h-5 ${isOpen ? 'rotate-180' : ''} transition-transform text-gray-500`} />
        </span>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-2 w-full max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl focus:outline-none"
        >
          {options.map((opt, idx) => {
            const isActive = idx === activeIndex;
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  buttonRef.current?.focus();
                }}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  isActive ? 'bg-gray-100' : ''
                } ${isSelected ? 'font-semibold text-black' : 'text-gray-800'}`}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
