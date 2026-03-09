import { useState, useRef, useCallback } from 'react';

interface StlUploadProps {
  onFileLoad: (file: File) => void;
}

export function StlUpload({ onFileLoad }: StlUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.stl')) return;
      setFileName(file.name);
      onFileLoad(file);
    },
    [onFileLoad],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload STL file"
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
        isDragging
          ? 'border-cyan-400 bg-cyan-500/10'
          : 'border-gray-700 hover:border-gray-500 bg-gray-900/30'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".stl"
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />
      {fileName ? (
        <p className="text-sm text-cyan-300 truncate max-w-full">{fileName}</p>
      ) : (
        <>
          <span className="text-2xl text-gray-400">&#128193;</span>
          <p className="text-xs text-gray-400">
            Drag & drop an STL file or click to browse
          </p>
        </>
      )}
    </div>
  );
}
