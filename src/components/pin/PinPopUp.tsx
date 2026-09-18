import React, {useState, useRef, useEffect} from 'react';
import {X, Lock} from 'lucide-react';
import toast from 'react-hot-toast';

interface PinPopUpProps {
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

const PinPopUp: React.FC<PinPopUpProps> = ({
  onSuccess,
  onClose,
  title = 'Security PIN Verification',
  description = 'Please enter your 4-digit security PIN to proceed.',
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const fullPin = pin.join('');
    if (fullPin.length !== 4) {
      toast.error('Please enter complete 4-digit PIN');
      return;
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-[#d3c4af]/20 bg-white p-6 shadow-2xl dark:bg-slate-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#785600]/10 text-[#785600] dark:bg-amber-400/10 dark:text-amber-400">
            <Lock size={24} />
          </div>
          <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1a1c1b] dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-xs text-[#4f4535] dark:text-slate-400">
            {description}
          </p>

          <div className="my-6 flex justify-center gap-3">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-12 w-12 rounded-xl border border-[#d3c4af]/40 text-center text-lg font-bold text-[#1a1c1b] shadow-sm transition-all focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            ))}
          </div>

          <div className="flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#d3c4af]/30 py-2.5 text-sm font-medium text-[#4f4535] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#785600] to-[#986d00] py-2.5 text-sm font-medium text-white shadow-md shadow-[#785600]/20 transition-all hover:brightness-105"
            >
              Verify PIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinPopUp;
