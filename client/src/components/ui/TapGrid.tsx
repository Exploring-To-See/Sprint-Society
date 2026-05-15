interface TapGridOption {
  value: string;
  label: string;
  icon?: string;
}

interface TapGridProps {
  options: TapGridOption[];
  selected: string | string[];
  onSelect: (value: string) => void;
  columns?: 2 | 3 | 4;
  multi?: boolean;
}

export function TapGrid({ options, selected, onSelect, columns = 3, multi = false }: TapGridProps) {
  const isSelected = (value: string) => {
    if (multi && Array.isArray(selected)) return selected.includes(value);
    return selected === value;
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-2`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={`p-3 rounded-lg border transition-all duration-100 flex flex-col items-center gap-1.5 active:scale-[0.95]
            ${isSelected(option.value)
              ? 'border-accent bg-accent/5 text-accent'
              : 'border-bg-tertiary bg-bg-secondary text-zinc-400 hover:border-zinc-600'
            }`}
        >
          {option.icon && <span className="text-xl">{option.icon}</span>}
          <span className="text-xs font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
