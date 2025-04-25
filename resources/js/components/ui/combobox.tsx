import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Check, ChevronsUpDown, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const Combobox = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    options?: Array<{ value: string | null; label: string; disabled?: boolean }>;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    initialDisplayCount?: number; // Tambahan prop untuk membatasi item yang ditampilkan
}
>(({
       value,
       onValueChange,
       options = [],
       placeholder = "Select an option",
       searchPlaceholder = "Search...",
       emptyMessage = "No options found",
       disabled = false,
       initialDisplayCount = 0, // Default ke 0 (tidak terbatas)
       className,
       ...props
   }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const [showAll, setShowAll] = React.useState(false) // State untuk menampilkan semua item
    const inputRef = React.useRef<HTMLInputElement>(null)
    const optionRefs = React.useRef<HTMLDivElement[]>([])

    // Ensure options is array
    const safeOptions = Array.isArray(options) ? options : []

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
        if (!search) return safeOptions
        return safeOptions.filter(option =>
            option.label.toLowerCase().includes(search.toLowerCase())
        )
    }, [safeOptions, search])

    // Menentukan options yang akan ditampilkan
    const displayedOptions = React.useMemo(() => {
        // Jika ada pencarian, tampilkan semua hasil pencarian
        if (search) return filteredOptions

        // Jika showAll aktif, tampilkan semua options
        if (showAll) return safeOptions

        // Jika tidak ada pencarian dan tidak showAll, batasi jumlah item
        return initialDisplayCount > 0 ? safeOptions.slice(0, initialDisplayCount) : safeOptions
    }, [filteredOptions, safeOptions, search, showAll, initialDisplayCount])

    // Find selected option and its index
    const selectedOption = React.useMemo(() => {
        return safeOptions.find(option => option.value === value)
    }, [safeOptions, value])

    const selectedIndex = React.useMemo(() => {
        return displayedOptions.findIndex(option => option.value === value)
    }, [displayedOptions, value])

    // Reset state saat dropdown ditutup
    React.useEffect(() => {
        if (!open) {
            setShowAll(false)
            setSearch('')
        }
    }, [open])

    // Initialize highlighted index when dropdown opens
    React.useEffect(() => {
        if (open) {
            // If there's a selected value, start at that index
            if (selectedIndex >= 0) {
                setHighlightedIndex(selectedIndex)
            } else {
                // Otherwise start at the first item
                setHighlightedIndex(displayedOptions.length > 0 ? 0 : -1)
            }
        } else {
            setHighlightedIndex(-1)
        }
    }, [open, selectedIndex, displayedOptions.length])

    // Handle option selection
    const handleSelect = React.useCallback((optionValue: string) => {
        if (onValueChange) {
            onValueChange(optionValue)
        }
        setOpen(false)
        setSearch('')
        setShowAll(false)
    }, [onValueChange])

    // Handle keyboard navigation
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
        if (!open) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setHighlightedIndex(prev => {
                    const nextIndex = prev + 1 >= displayedOptions.length ? 0 : prev + 1
                    // Skip disabled options
                    if (displayedOptions[nextIndex]?.disabled) {
                        return prev + 2 >= displayedOptions.length ? 0 : prev + 2
                    }
                    return nextIndex
                })
                break

            case 'ArrowUp':
                e.preventDefault()
                setHighlightedIndex(prev => {
                    const nextIndex = prev - 1 < 0 ? displayedOptions.length - 1 : prev - 1
                    // Skip disabled options
                    if (displayedOptions[nextIndex]?.disabled) {
                        const prevIndex = nextIndex - 1 < 0 ? displayedOptions.length - 1 : nextIndex - 1
                        return prevIndex
                    }
                    return nextIndex
                })
                break

            case 'Enter':
                e.preventDefault()
                if (highlightedIndex >= 0 && highlightedIndex < displayedOptions.length) {
                    handleSelect(displayedOptions[highlightedIndex].value)
                }
                break

            case 'Escape':
                e.preventDefault()
                setOpen(false)
                break

            default:
                break
        }
    }, [open, displayedOptions, highlightedIndex, handleSelect])

    // Scroll highlighted option into view
    React.useEffect(() => {
        if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
            optionRefs.current[highlightedIndex].scrollIntoView({
                block: 'nearest',
            })
        }
    }, [highlightedIndex])

    // Reset optionRefs when displayed options change
    React.useEffect(() => {
        optionRefs.current = optionRefs.current.slice(0, displayedOptions.length)
    }, [displayedOptions])

    // Focus input when opened
    React.useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus()
            }, 0)
        }
    }, [open])

    return (
        <div
            ref={ref}
            className={cn('relative w-full', className)}
            {...props}
            onKeyDown={handleKeyDown}
        >
            <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
                <PopoverPrimitive.Trigger asChild disabled={disabled}>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                        disabled={disabled}
                    >
                        <span className="line-clamp-1">
                          {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                        className="relative z-50 w-[--radix-popover-trigger-width] min-w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                        sideOffset={5}
                        align="start"
                        style={{ width: 'var(--radix-popover-trigger-width)' }}
                    >
                        <div className="flex items-center border-b px-3 py-2">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Input
                                ref={inputRef}
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8 border-0 bg-transparent p-1 text-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-1">
                            {displayedOptions.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    {emptyMessage}
                                </div>
                            ) : (
                                <>
                                    {displayedOptions.map((option, index) => (
                                        <div
                                            key={option.value}
                                            ref={el => {
                                                if (el) optionRefs.current[index] = el
                                            }}
                                            className={cn(
                                                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-hidden",
                                                "hover:bg-accent hover:text-accent-foreground",
                                                "focus:bg-accent focus:text-accent-foreground",
                                                (option.value === value || index === highlightedIndex) && "bg-accent text-accent-foreground",
                                                option.disabled && "pointer-events-none opacity-50"
                                            )}
                                            onClick={() => {
                                                if (!option.disabled) {
                                                    handleSelect(option.value)
                                                }
                                            }}
                                            role="option"
                                            aria-selected={option.value === value}
                                            data-highlighted={index === highlightedIndex}
                                            tabIndex={-1}
                                        >
                                            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                              {option.value === value && <Check className="h-4 w-4" />}
                                            </span>
                                            <span>{option.label}</span>
                                        </div>
                                    ))}

                                    {/* Tombol "Show All" hanya muncul jika:
                                        1. Tidak ada kueri pencarian
                                        2. Belum menampilkan semua item
                                        3. Ada lebih banyak item daripada yang ditampilkan
                                    */}
                                    {!search && !showAll && initialDisplayCount > 0 && safeOptions.length > initialDisplayCount && (
                                        <button
                                            className="w-full text-center py-2 px-2 text-sm text-blue-600 hover:bg-slate-50 rounded-sm mt-1"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowAll(true);
                                            }}
                                        >
                                            Show all {safeOptions.length} items...
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>
        </div>
    )
})
Combobox.displayName = 'Combobox'

export { Combobox }
