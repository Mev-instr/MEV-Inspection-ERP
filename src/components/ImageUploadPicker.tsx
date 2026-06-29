import React, { useState, useRef } from "react";
import * as Icons from "lucide-react";

interface ImageUploadPickerProps {
  onImageSelect: (url: string) => void;
  onClose: () => void;
  clientName?: string;
  subfolder?: string;
}

export function ImageUploadPicker({ onImageSelect, onClose, clientName = "General", subfolder = "Uploads" }: ImageUploadPickerProps) {
  const [activeTab, setActiveTab] = useState<"local" | "camera">("local");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            onImageSelect(dataUrl);
          } else {
            onImageSelect(img.src);
          }
          setIsLoading(false);
        };
        img.onerror = () => {
          console.error("Failed to load image");
          setIsLoading(false);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        console.error("Failed to read file");
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-slate-800">Select Image</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 shrink-0">
          <button
            onClick={() => setActiveTab("local")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "local" ? "border-[#683EFF] text-[#683EFF]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <Icons.Upload className="w-4 h-4 mx-auto mb-1" />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "camera" ? "border-[#683EFF] text-[#683EFF]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <Icons.Camera className="w-4 h-4 mx-auto mb-1" />
            Camera
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "local" && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full py-4 border-2 border-dashed border-[#683EFF]/30 rounded-xl flex flex-col items-center justify-center text-[#683EFF] hover:bg-[#683EFF]/5 transition-colors"
              >
                {isLoading ? <Icons.Loader2 className="w-8 h-8 animate-spin mb-2" /> : <Icons.UploadCloud className="w-8 h-8 mb-2" />}
                <span className="font-medium">{isLoading ? "Uploading..." : "Click to select a file"}</span>
              </button>
            </div>
          )}

          {activeTab === "camera" && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileUpload} />
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isLoading}
                className="w-full py-4 border-2 border-dashed border-[#683EFF]/30 rounded-xl flex flex-col items-center justify-center text-[#683EFF] hover:bg-[#683EFF]/5 transition-colors"
              >
                {isLoading ? <Icons.Loader2 className="w-8 h-8 animate-spin mb-2" /> : <Icons.Camera className="w-8 h-8 mb-2" />}
                <span className="font-medium">{isLoading ? "Uploading..." : "Take a photo"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
