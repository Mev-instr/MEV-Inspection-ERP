import React, { useState, useRef, useEffect } from "react";
import * as Icons from "lucide-react";
import { ref, getDownloadURL, uploadBytes, listAll, StorageReference } from "firebase/storage";
import { storage } from "../lib/firebase";

interface ImageUploadPickerProps {
  onImageSelect: (url: string) => void;
  onClose: () => void;
  clientName?: string;
  subfolder?: string;
  fileName?: string;
}

interface SavedImage {
  name: string;
  url: string;
  type: "file" | "folder";
}

export function ImageUploadPicker({ onImageSelect, onClose, clientName = "General", subfolder = "Uploads", fileName }: ImageUploadPickerProps) {
  const [activeTab, setActiveTab] = useState<"local" | "camera" | "saved">("local");
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<SavedImage[]>([]);
  const [currentPath, setCurrentPath] = useState("Signatures");
  const [searchQuery, setSearchQuery] = useState("");
  const [isListing, setIsListing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "saved") {
      fetchItems(currentPath);
    }
  }, [activeTab, currentPath]);

  const fetchItems = async (path: string) => {
    setIsListing(true);
    try {
      const folderRef = ref(storage, path);
      const res = await listAll(folderRef);
      
      const folderItems: SavedImage[] = res.prefixes.map(p => ({
        name: p.name,
        url: p.fullPath,
        type: "folder"
      }));

      const filePromises = res.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return {
          name: item.name,
          url,
          type: "file" as const
        };
      });

      const fileItems = await Promise.all(filePromises);
      setItems([...folderItems, ...fileItems]);
    } catch (error) {
      console.error("Failed to list storage items:", error);
    } finally {
      setIsListing(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavigateBack = () => {
    const parts = currentPath.split("/").filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      setCurrentPath(parts.join("/"));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
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
            
            // Convert canvas to blob for storage upload
            canvas.toBlob(async (blob) => {
              if (!blob) {
                onImageSelect(img.src);
                setIsLoading(false);
                return;
              }

              try {
                const extension = "webp";
                const safeSubfolder = subfolder.trim();
                const finalFileName = fileName ? `${fileName}.${extension}` : `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, "_")}.${extension}`;
                
                const storageRef = ref(storage, `${safeSubfolder}/${finalFileName}`);
                const snapshot = await uploadBytes(storageRef, blob, { contentType: "image/webp" });
                const url = await getDownloadURL(snapshot.ref);
                
                onImageSelect(url);
                setIsLoading(false);
              } catch (uploadError: any) {
                console.error("Storage upload error:", uploadError);
                // Fallback to data URL if storage fails but alert the user
                const dataUrl = canvas.toDataURL("image/webp", 0.8);
                onImageSelect(dataUrl);
                setIsLoading(false);
              }
            }, "image/webp", 0.8);
          } else {
            onImageSelect(img.src);
            setIsLoading(false);
          }
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
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "saved" ? "border-[#683EFF] text-[#683EFF]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <Icons.Image className="w-4 h-4 mx-auto mb-1" />
            Saved
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

          {activeTab === "saved" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {currentPath !== "" && (
                  <button 
                    onClick={handleNavigateBack}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                    title="Go Back"
                  >
                    <Icons.ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="relative flex-1">
                  <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search in current folder..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#683EFF] transition-colors"
                  />
                </div>
              </div>

              {currentPath && (
                <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  Path: {currentPath || "Root"}
                </div>
              )}

              {isListing ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Icons.Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">Scanning Storage...</p>
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 pb-4">
                  {filteredItems.map((item, idx) => (
                    item.type === "folder" ? (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentPath(item.url);
                          setSearchQuery("");
                        }}
                        className="group flex flex-col items-center justify-center aspect-square bg-slate-50 rounded-xl border border-slate-100 hover:border-[#683EFF] hover:bg-slate-100 transition-all p-4"
                      >
                        <Icons.Folder className="w-12 h-12 text-[#683EFF] mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{item.name}</span>
                      </button>
                    ) : (
                      <button
                        key={idx}
                        onClick={() => onImageSelect(item.url)}
                        className="group relative aspect-square bg-slate-50 rounded-xl border border-slate-100 overflow-hidden hover:border-[#683EFF] transition-all"
                      >
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Icons.CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-slate-900/60 text-[8px] text-white font-bold truncate">
                          {item.name}
                        </div>
                      </button>
                    )
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Icons.ImageOff className="w-8 h-8 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">No items found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
