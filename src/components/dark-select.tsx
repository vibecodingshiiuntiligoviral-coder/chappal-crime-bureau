"use client";

import { useEffect, useRef, useState } from "react";

interface DarkSelectOption<Value extends string> {
  value: Value;
  label: string;
}

interface DarkSelectProps<Value extends string> {
  value: Value;
  options: Array<DarkSelectOption<Value>>;
  onChange: (value: Value) => void;
  disabled?: boolean;
}

export function DarkSelect<Value extends string>({
  value,
  options,
  onChange,
  disabled = false,
}: DarkSelectProps<Value>) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  const selectedOption = options[selectedIndex] ?? options[0];

  function commitSelection(nextValue: Value) {
    onChange(nextValue);
    setOpen(false);
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        return;
      }

      setActiveIndex((current) => Math.min(current + 1, options.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        return;
      }

      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      if (!open) {
        setOpen(true);
      }
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      if (!open) {
        setOpen(true);
      }
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (open) {
        commitSelection(options[activeIndex]?.value ?? selectedOption.value);
        return;
      }

      setOpen(true);
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="bureau-dropdown">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => {
              if (!current) {
                setActiveIndex(selectedIndex);
              }

              return !current;
            });
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className="bureau-dropdown-trigger"
        data-open={open ? "true" : "false"}
      >
        <span>{selectedOption?.label}</span>
        <span className={`bureau-dropdown-caret ${open ? "bureau-dropdown-caret-open" : ""}`} />
      </button>

      {open ? (
        <div role="listbox" className="bureau-dropdown-menu">
          {options.map((option, index) => {
            const isActive = index === activeIndex;
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commitSelection(option.value)}
                className="bureau-dropdown-option"
                data-active={isActive ? "true" : "false"}
                data-selected={isSelected ? "true" : "false"}
              >
                <span>{option.label}</span>
                {isSelected ? <span className="bureau-dropdown-check">Selected</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
