import { motion } from 'framer-motion';

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
    <div className={`grid ${gridCols[columns]} gap-3`}>
      {options.map((option) => (
        <motion.button
          key={option.value}
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => onSelect(option.value)}
          className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2
            ${isSelected(option.value)
              ? 'border-accent-green bg-accent-green/10 shadow-[0_0_15px_rgba(57,255,20,0.2)]'
              : 'border-white/10 bg-bg-secondary hover:border-white/20'
            }`}
        >
          {option.icon && <span className="text-2xl">{option.icon}</span>}
          <span className={`text-sm font-medium ${isSelected(option.value) ? 'text-accent-green' : 'text-white/80'}`}>
            {option.label}
          </span>
          {isSelected(option.value) && (
            <motion.div
              layoutId="selected-indicator"
              className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-green"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
