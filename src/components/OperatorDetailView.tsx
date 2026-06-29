import React, { useState } from "react";
import * as Icons from "lucide-react";
import { OperatorCard } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { PrintCardPreview } from "./PrintCardPreview";
import { ImageUploadPicker } from "./ImageUploadPicker";

interface OperatorDetailViewProps {
  operator: OperatorCard;
  onBack: () => void;
  onUpdate: (updated: OperatorCard) => void;
  onDelete: (id: string) => void;
  onUploadImage?: (file: File, clientName: string, subfolder: string, entityId?: string) => Promise<string>;
}

export function OperatorDetailView({ operator, onBack, onUpdate, onDelete, onUploadImage }: OperatorDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<OperatorCard>({ ...operator });
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"photoAttachment" | "authorizedBySignature" | "trainedBySignature" | null>(null);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleSave = () => {
    onUpdate(editedFields);
    setIsEditing(false);
    triggerToast("✓ Operator details updated successfully.");
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(operator.id);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  if (showPrintPreview) {
    return <PrintCardPreview operator={operator} onClose={() => setShowPrintPreview(false)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#0E1B2D] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 font-bold text-xs"
          >
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Context Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#683EFF] hover:border-[#683EFF] transition-all shadow-sm group"
          >
            <Icons.ArrowLeft className="w-5 h-5 group-active:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Operator Profile</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{operator.id}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold text-[#683EFF] uppercase tracking-widest">
                {isEditing ? "Editing Mode" : "Registry Verified"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
              >
                <Icons.Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setShowPrintPreview(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
              >
                <Icons.Printer className="w-4 h-4" />
                Print Card
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all shadow-sm"
              >
                <Icons.Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2 bg-[#683EFF] text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-[#522CD9] active:scale-95 transition-all"
              >
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile Main Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Visual & Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm flex flex-col items-center">
            <div className="relative group">
              <div className="w-48 h-48 bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center relative">
                {operator.photoAttachment ? (
                  <img src={operator.photoAttachment} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <Icons.User className="w-20 h-20" />
                    <span className="text-[10px] font-black uppercase tracking-widest">No Portrait</span>
                  </div>
                )}
                
                {isEditing && (
                  <div onClick={() => setPickerTarget("photoAttachment")} className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="text-white flex flex-col items-center gap-1">
                      <Icons.Upload className="w-6 h-6" />
                      <span className="text-[10px] font-bold">Update Photo</span>
                    </div>
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg ${
                operator.status === "Fully Certified" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              }`}>
                {operator.status}
              </div>
            </div>

            <div className="mt-10 text-center">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedFields.operatorName || ""}
                    onChange={(e) => setEditedFields({ ...editedFields, operatorName: e.target.value })}
                    className="text-center w-full bg-slate-50 border-b border-[#683EFF] focus:outline-none focus:ring-0 px-2 py-1"
                  />
                ) : (
                  operator.operatorName
                )}
              </h3>
              <p className="text-sm font-bold text-[#683EFF] mt-1">{operator.machineOperator || "Field Operator"}</p>
            </div>

          </div>
        </div>

        {/* Right Columns: Data Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-widest mb-8">
              <Icons.Info className="w-4 h-4 text-[#683EFF]" />
              Detailed Registration Record
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Naming Series ID</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedFields.namingSeries || ""}
                    onChange={(e) => setEditedFields({ ...editedFields, namingSeries: e.target.value })}
                    className="w-full text-sm font-bold text-slate-700 bg-slate-50 border-b border-slate-200 focus:border-[#683EFF] focus:outline-none p-1"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-700 font-mono">{operator.namingSeries || "N/A"}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedFields.idNumber || ""}
                    onChange={(e) => setEditedFields({ ...editedFields, idNumber: e.target.value })}
                    className="w-full text-sm font-bold text-slate-700 bg-slate-50 border-b border-slate-200 focus:border-[#683EFF] focus:outline-none p-1"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-700">{operator.idNumber || "N/A"}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Operator Name</label>
                {isEditing ? (
                   <input
                    type="text"
                    value={editedFields.operatorName || ""}
                    onChange={(e) => setEditedFields({ ...editedFields, operatorName: e.target.value })}
                    className="w-full text-sm font-bold text-slate-700 bg-slate-50 border-b border-slate-200 focus:border-[#683EFF] focus:outline-none p-1"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-700">{operator.operatorName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Machine Operator</label>
                {isEditing ? (
                   <input
                    type="text"
                    value={editedFields.machineOperator || ""}
                    onChange={(e) => setEditedFields({ ...editedFields, machineOperator: e.target.value })}
                    className="w-full text-sm font-bold text-slate-700 bg-slate-50 border-b border-slate-200 focus:border-[#683EFF] focus:outline-none p-1"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-700">{operator.machineOperator || "N/A"}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Company</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedFields.company || ""}
                    onChange={(e) => setEditedFields({ ...editedFields, company: e.target.value })}
                    className="w-full text-sm font-bold text-slate-700 bg-slate-50 border-b border-slate-200 focus:border-[#683EFF] focus:outline-none p-1"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-700">{operator.company || "N/A"}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Level / Type</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedFields.levelType || ""}
                    onChange={(e) => setEditedFields({ ...editedFields, levelType: e.target.value })}
                    className="w-full text-sm font-bold text-slate-700 bg-slate-50 border-b border-slate-200 focus:border-[#683EFF] focus:outline-none p-1"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-700">{operator.levelType || "N/A"}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trained By</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedFields.trainedBy || ""}
                    onChange={(e) => setEditedFields({ ...editedFields, trainedBy: e.target.value })}
                    className="w-full text-sm font-bold text-slate-700 bg-slate-50 border-b border-slate-200 focus:border-[#683EFF] focus:outline-none p-1"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-700">{operator.trainedBy || "N/A"}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Issue Date</label>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <Icons.Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedFields.issueDate || ""}
                      onChange={(e) => setEditedFields({ ...editedFields, issueDate: e.target.value })}
                      className="text-sm font-bold text-slate-700 bg-slate-50 border-b border-slate-200 focus:border-[#683EFF] focus:outline-none"
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-700">{formatDate(operator.issueDate)}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expiry Date</label>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F0EBFF] rounded-lg">
                    <Icons.Calendar className="w-4 h-4 text-[#683EFF]" />
                  </div>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedFields.licenseExpiry || ""}
                      onChange={(e) => setEditedFields({ ...editedFields, licenseExpiry: e.target.value })}
                      className="text-sm font-bold text-slate-700 bg-slate-50 border-b border-slate-200 focus:border-[#683EFF] focus:outline-none"
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-700">{formatDate(operator.licenseExpiry)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="mt-10 pt-8 border-t border-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Authorized By Signature */}
              <div className="bg-white border rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] relative w-full group overflow-hidden border-slate-200">
                {isEditing ? (
                  <>
                    <Icons.Upload className="w-5 h-5 text-slate-400 mb-2 opacity-50 relative z-10" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Authorized By</span>
                    {editedFields.authorizedBySignature ? (
                      <img src={editedFields.authorizedBySignature} alt="Authorized By" className="max-h-16 object-contain mt-2 z-10 relative" />
                    ) : (
                      <span className="text-xs text-slate-400 font-bold relative z-10 mt-1">Upload Signature</span>
                    )}
                  {isEditing && (
                    <div onClick={() => setPickerTarget("authorizedBySignature")} className="absolute inset-0 z-20 cursor-pointer"></div>
                  )}
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute top-4 left-4">Authorized By</span>
                    {operator.authorizedBySignature ? (
                      <img src={operator.authorizedBySignature} alt="Authorized By" className="max-h-16 object-contain mt-4" />
                    ) : (
                      <span className="text-sm font-bold text-slate-400 mt-4">No Signature</span>
                    )}
                  </>
                )}
              </div>

              {/* Trained By Signature */}
              <div className="bg-white border rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] relative w-full group overflow-hidden border-slate-200">
                {isEditing ? (
                  <>
                    <Icons.Upload className="w-5 h-5 text-slate-400 mb-2 opacity-50 relative z-10" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Trained By</span>
                    {editedFields.trainedBySignature ? (
                      <img src={editedFields.trainedBySignature} alt="Trained By" className="max-h-16 object-contain mt-2 z-10 relative" />
                    ) : (
                      <span className="text-xs text-slate-400 font-bold relative z-10 mt-1">Upload Signature</span>
                    )}
                  {isEditing && (
                    <div onClick={() => setPickerTarget("trainedBySignature")} className="absolute inset-0 z-20 cursor-pointer"></div>
                  )}
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute top-4 left-4">Trained By</span>
                    {operator.trainedBySignature ? (
                      <img src={operator.trainedBySignature} alt="Trained By" className="max-h-16 object-contain mt-4" />
                    ) : (
                      <span className="text-sm font-bold text-slate-400 mt-4">No Signature</span>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
      
      {/* Hidden Print Layout (Used by window.print()) */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-20">
         <div className="w-[85.6mm] h-[53.98mm] border-2 border-[#0E1B2D] rounded-[3mm] p-6 relative overflow-hidden mx-auto shadow-none">
            {/* ID Card Front Design */}
            <div className="flex items-start gap-4">
               <div className="w-24 h-28 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                  {operator.photoAttachment && <img src={operator.photoAttachment} alt="Print" className="w-full h-full object-cover" />}
               </div>
               <div className="flex-1 space-y-1">
                  <p className="text-[6px] font-black text-[#683EFF] uppercase tracking-[0.2em] mb-2">OPERATOR CERTIFICATION</p>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">{operator.operatorName}</h3>
                  <p className="text-[7px] font-bold text-slate-500">{operator.machineOperator || "Operator"}</p>
                  
                  <div className="pt-4 grid grid-cols-2 gap-2">
                     <div>
                        <p className="text-[5px] font-black text-slate-400 uppercase">Registry ID</p>
                        <p className="text-[6px] font-bold text-slate-800 font-mono tracking-tighter">{operator.id}</p>
                     </div>
                     <div>
                        <p className="text-[5px] font-black text-slate-400 uppercase">Expiry Date</p>
                        <p className="text-[6px] font-bold text-slate-800">{formatDate(operator.licenseExpiry)}</p>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
               <div>
                  <p className="text-[5px] font-black text-[#0E1B2D] uppercase tracking-widest">MIDDLE EAST VIM ERP</p>
                  <p className="text-[4px] text-slate-400">Verifiable Operational Security Standard</p>
               </div>
               <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded p-1">
                  <Icons.QrCode className="w-full h-full text-slate-400" />
               </div>
            </div>
         </div>
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                <Icons.AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Delete Operator?</h3>
              <p className="text-sm font-bold text-slate-500">
                This action is permanent and cannot be undone. All operator records, history, and training compliance will be erased.
              </p>
            </div>
            <div className="p-4 bg-slate-50 flex items-center gap-3 justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 font-bold text-xs text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 font-bold text-xs text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {pickerTarget && (
        <ImageUploadPicker
          clientName={editedFields.company || "General"}
          subfolder="Operator Directory"
          onClose={() => setPickerTarget(null)}
          onImageSelect={(url) => {
            setEditedFields({ ...editedFields, [pickerTarget]: url });
            setPickerTarget(null);
            triggerToast(`✓ Image selected successfully!`);
          }}
        />
      )}
    </div>
  );
}
