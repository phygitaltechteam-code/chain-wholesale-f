import React from 'react';
import {X} from 'lucide-react';

interface ImageModalProps {
  selectedImage: string | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  selectedImage,
  onClose,
}) => {
  if (!selectedImage) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] max-w-[92vw] overflow-hidden rounded-2xl bg-white p-3 shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-red-500 p-1.5 text-white transition-colors hover:bg-red-600"
        >
          <X size={18} />
        </button>
        <img
          src={selectedImage}
          alt="Job Detail Preview"
          className="max-h-[82vh] max-w-[88vw] rounded-xl object-contain"
        />
      </div>
    </div>
  );
};

export default ImageModal;
