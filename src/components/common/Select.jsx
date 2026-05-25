import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import useDisclosureTransition from '../../hooks/useDisclosureTransition'

const Select = forwardRef(function Select(
  { label, options = [], value, onChange, placeholder = 'Select...', disabled = false },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const optionRefs = useRef([])
  const { shouldRender, isClosing } = useDisclosureTransition(isOpen, 140)

  useImperativeHandle(ref, () => triggerRef.current)

  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  )
  const selectedOption = options.find((option) => option.value === value)

  const openDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(true)
    }
  }, [disabled])

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setSearch('')
    setActiveIndex(-1)
  }, [])

  const moveActive = useCallback((delta) => {
    if (!filteredOptions.length) {
      return
    }

    setActiveIndex((current) => {
      const next = current < 0 ? 0 : current + delta
      if (next < 0) return filteredOptions.length - 1
      if (next >= filteredOptions.length) return 0
      return next
    })
  }, [filteredOptions.length])

  const selectOption = useCallback((option) => {
    onChange(option.value)
    closeDropdown()
    triggerRef.current?.focus()
  }, [closeDropdown, onChange])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        closeDropdown()
      }
    }

    window.addEventListener('pointerdown', handleClickOutside)
    return () => window.removeEventListener('pointerdown', handleClickOutside)
  }, [closeDropdown])

  useEffect(() => {
    if (!shouldRender) {
      setSearch('')
      setActiveIndex(-1)
    }
  }, [shouldRender])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const selectedIndex = filteredOptions.findIndex((option) => option.value === value)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    window.requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }))
  }, [filteredOptions, isOpen, value])

  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, isOpen])

  return (
    <div className="custom-select" ref={containerRef}>
      {label ? <span className="custom-select-label">{label}</span> : null}

      <button
        type="button"
        ref={triggerRef}
        className="custom-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            closeDropdown()
          }

          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            if (!isOpen) {
              openDropdown()
              return
            }
            moveActive(event.key === 'ArrowDown' ? 1 : -1)
          }

          if (event.key === 'Enter' && isOpen && activeIndex >= 0 && filteredOptions[activeIndex]) {
            event.preventDefault()
            selectOption(filteredOptions[activeIndex])
          }
        }}
      >
        <span className={selectedOption ? 'custom-select-value' : 'custom-select-placeholder'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className={isOpen ? 'custom-select-chevron open' : 'custom-select-chevron'} />
      </button>

      {shouldRender ? (
        <div className={`custom-select-menu${isClosing ? ' closing' : ''}`}>
          <div className="custom-select-search">
            <Search size={15} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              placeholder="Search..."
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  closeDropdown()
                }

                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  moveActive(event.key === 'ArrowDown' ? 1 : -1)
                }

                if (event.key === 'Enter' && activeIndex >= 0 && filteredOptions[activeIndex]) {
                  event.preventDefault()
                  selectOption(filteredOptions[activeIndex])
                }
              }}
            />
          </div>

          <div className="custom-select-options" role="listbox">
            {filteredOptions.length ? (
              filteredOptions.map((option, index) => (
                <button
                  type="button"
                  key={option.value}
                  ref={(element) => {
                    optionRefs.current[index] = element
                  }}
                  className={`custom-select-option${index === activeIndex ? ' active' : ''}${value === option.value ? ' selected' : ''}`}
                  role="option"
                  aria-selected={value === option.value}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  <span>{option.label}</span>
                  {value === option.value ? <Check size={16} /> : null}
                </button>
              ))
            ) : (
              <div className="custom-select-empty">No options found</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
})

export default Select
