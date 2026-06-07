import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, CheckCheck, ChevronDown, Search, X } from 'lucide-react'
import useDisclosureTransition from '../../hooks/useDisclosureTransition'

function MultiSelect({ label, options = [], values = [], onChange, placeholder = 'Select...', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)
  const searchRef = useRef(null)
  const { shouldRender, isClosing } = useDisclosureTransition(isOpen, 140)

  const selectedOptions = useMemo(
    () => options.filter((option) => values.includes(option.value)),
    [options, values],
  )
  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  )
  const allSelected = options.length > 0 && options.every((option) => values.includes(option.value))

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setSearch('')
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) closeDropdown()
    }
    window.addEventListener('pointerdown', handleClickOutside)
    return () => window.removeEventListener('pointerdown', handleClickOutside)
  }, [closeDropdown])

  useEffect(() => {
    if (isOpen) window.requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }))
  }, [isOpen])

  function toggleValue(value) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  return (
    <div className="custom-select multi-select" ref={containerRef}>
      {label ? <span className="custom-select-label">{label}</span> : null}
      <button
        type="button"
        className="custom-select-trigger multi-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="multi-select-value">
          {selectedOptions.length
            ? selectedOptions.map((option) => <span key={option.value} className="multi-select-chip">{option.label}</span>)
            : <span className="custom-select-placeholder">{placeholder}</span>}
        </span>
        <ChevronDown size={18} className={isOpen ? 'custom-select-chevron open' : 'custom-select-chevron'} />
      </button>

      {shouldRender ? (
        <div className={`custom-select-menu multi-select-menu${isClosing ? ' closing' : ''}`}>
          <div className="custom-select-search">
            <Search size={15} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              placeholder="Search..."
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') closeDropdown()
              }}
            />
          </div>
          <div className="multi-select-actions">
            <button type="button" onClick={() => onChange(options.map((option) => option.value))} disabled={allSelected}>
              <CheckCheck size={14} />
              Select all
            </button>
            <button type="button" onClick={() => onChange([])} disabled={!values.length}>
              <X size={14} />
              Clear
            </button>
          </div>
          <div className="custom-select-options" role="listbox" aria-multiselectable="true">
            {filteredOptions.length ? filteredOptions.map((option) => {
              const isSelected = values.includes(option.value)
              return (
                <button
                  type="button"
                  key={option.value}
                  className={`custom-select-option${isSelected ? ' selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggleValue(option.value)}
                >
                  <span>{option.label}</span>
                  <span className={`multi-select-check${isSelected ? ' selected' : ''}`}>
                    {isSelected ? <Check size={14} /> : null}
                  </span>
                </button>
              )
            }) : <div className="custom-select-empty">No options found</div>}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MultiSelect
