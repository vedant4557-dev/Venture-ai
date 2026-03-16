/**
 * UploadZone Component
 * Drag-and-drop + click-to-browse PDF upload area.
 * Provides real-time visual feedback for drag states and upload progress.
 */

import React, { useCallback, useRef, useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  uploadProgress: number;
}

export default function UploadZone({
  onFileSelect,
  isLoading,
  uploadProgress,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Only PDF files are supported.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError("File too large. Maximum size is 50MB.");
        return;
      }
      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onClick={() => !isLoading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed cursor-pointer
          transition-all duration-300 p-12 text-center
          ${isDragging
            ? "border-gold-400 bg-gold-400/5 scale-[1.01]"
            : "border-slate-600/50 hover:border-gold-500/60 hover:bg-gold-400/3"
          }
          ${isLoading ? "cursor-not-allowed opacity-60" : ""}
        `}
      >
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-50" />

        {/* Scanning animation during loading */}
        {isLoading && (
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent animate-scan" />
        )}

        <div className="relative z-10 flex flex-col items-center gap-5">
          {/* Icon */}
          <div
            className={`
            p-4 rounded-2xl border transition-all duration-300
            ${isDragging
              ? "border-gold-400/50 bg-gold-400/10"
              : "border-slate-600/30 bg-obsidian-800"
            }
          `}
          >
            {selectedFile ? (
              <FileText className="w-8 h-8 text-gold-400" />
            ) : (
              <Upload
                className={`w-8 h-8 transition-colors ${isDragging ? "text-gold-400" : "text-slate-400"}`}
              />
            )}
          </div>

          {/* Text */}
          {selectedFile && !isLoading ? (
            <div>
              <p className="font-display text-gold-400 font-semibold text-lg">
                {selectedFile.name}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to change
              </p>
            </div>
          ) : isLoading ? (
            <div className="w-full max-w-xs">
              <p className="text-slate-300 font-medium mb-3">
                {uploadProgress < 100
                  ? `Uploading… ${uploadProgress}%`
                  : "Analyzing pitch deck…"}
              </p>
              {/* Progress bar */}
              <div className="h-1.5 bg-obsidian-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all duration-500"
                  style={{ width: `${uploadProgress < 100 ? uploadProgress : 100}%` }}
                />
              </div>
              <p className="text-slate-500 text-xs mt-2">
                {uploadProgress >= 100
                  ? "AI is reading the deck — this takes 30–60 seconds"
                  : "Sending to server…"}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-slate-300 font-medium text-lg">
                Drop your pitch deck here
              </p>
              <p className="text-slate-500 text-sm mt-1">
                or{" "}
                <span className="text-gold-400 underline underline-offset-2">
                  browse files
                </span>{" "}
                · PDF only · Max 50MB
              </p>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-crimson-400 text-sm bg-crimson-500/10 border border-crimson-500/20 rounded-lg px-4 py-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
