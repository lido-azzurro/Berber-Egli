import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  containerClassName?: string;
};

export default function PasswordInput({ containerClassName, className, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${containerClassName ?? ''}`}>
      <input
        type={visible ? 'text' : 'password'}
        className={`${className ?? ''} pr-11`}
        {...inputProps}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-gold transition-colors"
        tabIndex={-1}
        aria-label={visible ? 'Fsheh fjalëkalimin' : 'Shfaq fjalëkalimin'}
      >
        {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}
