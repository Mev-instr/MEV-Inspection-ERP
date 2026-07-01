/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { OperatorCard } from "../types";
import { formatDate } from "../utils";

interface OperatorDirectoryProps {
  operators: OperatorCard[];
  onOperatorsChange: React.Dispatch<React.SetStateAction<OperatorCard[]>>;
  onViewOperator: (id: string) => void;
  onUploadImage?: (file: File, clientName: string, subfolder: string, entityId?: string) => Promise<string>;
  onDeleteImage?: (url: string) => Promise<void>;
}

export function OperatorDirectoryView({ operators, onOperatorsChange, onViewOperator, onUploadImage, onDeleteImage }: OperatorDirectoryProps) {
  // View states
  const [viewMode, setViewMode] = useState<"list" | "grid" | "compact">("list");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  
  // Search and Enter-key Tag filters
  const [filterInput, setFilterInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Row selection & interaction states
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [showBulkActionDropdown, setShowBulkActionDropdown] = useState(false);

  // Pagination configuration
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add Operator form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, name: string} | null>(null);
  const [formValues, setFormValues] = useState({
    namingSeries: "MEV-OC-26-",
    machineOperator: "",
    operatorName: "",
    idNumber: "",
    company: "",
    issueDate: new Date().toISOString().split("T")[0],
    licenseExpiry: "",
    levelType: "",
    trainedBy: "",
    photoAttachment: undefined as string | undefined,
    authorizedBySignature: undefined as string | undefined,
    trainedBySignature: undefined as string | undefined,
    status: "Fully Certified" as OperatorCard["status"],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Helper to generate next ID
  const getNextId = (prefix: string) => {
    const relevant = operators.filter(o => o.id.startsWith(prefix));
    if (relevant.length === 0) return `${prefix}1100`;
    
    const ids = relevant.map(o => {
      const parts = o.id.split("-");
      const last = parts[parts.length - 1];
      return parseInt(last, 10);
    }).filter(n => !isNaN(n));

    if (ids.length === 0) return `${prefix}1100`;
    const max = Math.max(...ids);
    return `${prefix}${max + 1}`;
  };

  const handleCreateOperator = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formValues.operatorName) errors.operatorName = "Name is required";
    if (!formValues.idNumber) errors.idNumber = "ID Number is required";
    if (!formValues.licenseExpiry) errors.licenseExpiry = "Expiry Date is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Determine ID
    let finalId = formValues.namingSeries;
    const prefix = "MEV-OC-26-";
    
    // If user didn't change from prefix or it's just prefix, auto-generate
    if (!finalId || finalId === prefix) {
      finalId = getNextId(prefix);
    }

    const newOp: OperatorCard = {
      id: finalId,
      operatorName: formValues.operatorName,
      badgeNumber: formValues.idNumber, // mapping ID Number to badgeNumber for historical compatibility
      authorizedEquipment: [formValues.levelType].filter(Boolean),
      safetyIndex: 100,
      licenseExpiry: formValues.licenseExpiry,
      status: formValues.status,
      photoAttachment: formValues.photoAttachment || undefined,
      machineOperator: formValues.machineOperator,
      idNumber: formValues.idNumber,
      company: formValues.company,
      issueDate: formValues.issueDate,
      levelType: formValues.levelType,
      trainedBy: formValues.trainedBy,
      authorizedBySignature: formValues.authorizedBySignature || undefined,
      trainedBySignature: formValues.trainedBySignature || undefined
    };

    onOperatorsChange(prev => [newOp, ...prev]);
    showToast(`✓ Operator ${newOp.operatorName} created successfully with ID ${newOp.id}`);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormValues({
      namingSeries: "MEV-OC-26-",
      machineOperator: "",
      operatorName: "",
      idNumber: "",
      company: "",
      issueDate: new Date().toISOString().split("T")[0],
      licenseExpiry: "",
      levelType: "",
      trainedBy: "",
      photoAttachment: undefined,
      authorizedBySignature: undefined,
      trainedBySignature: undefined,
      status: "Fully Certified",
    });
    setFormErrors({});
  };

  const [isUploading, setIsUploading] = useState<string | null>(null);

  const handleFileChange = async (field: "photoAttachment" | "authorizedBySignature" | "trainedBySignature", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onUploadImage) {
        setIsUploading(field);
        showToast(`Uploading ${field === "photoAttachment" ? "photo" : "signature"}...`);
        try {
          const fileName = field === "photoAttachment" 
            ? `${(formValues.operatorName || "unnamed").replace(/\s+/g, "-").toLowerCase()}-img`
            : field === "authorizedBySignature"
              ? `${(formValues.operatorName || "unnamed").replace(/\s+/g, "-").toLowerCase()}-auth-img`
              : `${(formValues.operatorName || "unnamed").replace(/\s+/g, "-").toLowerCase()}-trained-img`;
          const url = await onUploadImage(file, formValues.company || "General", "operator-card", fileName);
          setFormValues(prev => ({ ...prev, [field]: url }));
          showToast(`✓ Uploaded successfully!`);
        } catch (err) {
          console.error(err);
          showToast(`❌ Upload failed.`);
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormValues(prev => ({ ...prev, [field]: reader.result as string }));
          };
          reader.readAsDataURL(file);
        } finally {
          setIsUploading(null);
        }
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormValues(prev => ({ ...prev, [field]: reader.result as string }));
          showToast(`✓ File attached.`);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleDeleteOperator = (id: string, name: string) => {
    setDeleteConfirmId({ id, name });
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onOperatorsChange(prev => prev.filter(op => op.id !== deleteConfirmId.id));
      showToast(`✓ Operator ${deleteConfirmId.name} has been removed from registry.`);
      setDeleteConfirmId(null);
    }
  };

  const handleBulkDuplicate = () => {
    const toDuplicate = operators.filter(o => selectedOperatorIds.includes(o.id));
    const duplicated = toDuplicate.map(o => ({
      ...o,
      id: `OP-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      operatorName: `${o.operatorName} (Copy)`,
    }));
    onOperatorsChange((prev) => [...duplicated, ...prev]);
    showToast(`✓ Duplicated ${selectedOperatorIds.length} operator records`);
    setSelectedOperatorIds([]);
    setShowBulkActionDropdown(false);
  };

  const handleBulkExport = () => {
    const count = selectedOperatorIds.length;
    showToast(`✓ Exporting ${count} operators to CSV...`);
    
    const headers = [
      "Naming Series ID", "ID Number", "Full Operator Name", "Machine Operator",
      "Company", "Level / Type", "Trained By", "Issue Date (Official)", "Expiry Date (Certification)"
    ].join(",");

    const rows = operators
      .filter(o => selectedOperatorIds.includes(o.id))
      .map(o => [
        o.namingSeries || "", o.idNumber || "", o.operatorName || "", o.machineOperator || "",
        o.company || "", o.levelType || "", o.trainedBy || "", o.issueDate || "", o.licenseExpiry || ""
      ].map(field => `"${String(field || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `operators_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSelectedOperatorIds([]);
    setShowBulkActionDropdown(false);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const parseCSV = (text: string): string[][] => {
      const lines = text.split(/\r?\n/);
      return lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(parseCSVLine);
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const rows = parseCSV(text);
        if (rows.length < 2) {
          showToast("⚠ CSV file is empty or missing data rows.");
          return;
        }

        const csvHeaders = rows[0].map(h => h.trim().toLowerCase());
        const importedOperators: any[] = [];

        // Helper to generate next ID inside loop safely
        const localGetNextId = (prefix: string, offset: number) => {
          const relevant = operators.filter(o => o.id.startsWith(prefix));
          let startBase = 1100;
          if (relevant.length > 0) {
            const ids = relevant.map(o => {
              const parts = o.id.split("-");
              const last = parts[parts.length - 1];
              return parseInt(last, 10);
            }).filter(n => !isNaN(n));
            if (ids.length > 0) {
              startBase = Math.max(...ids) + 1;
            }
          }
          return `${prefix}${startBase + offset}`;
        };

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 0 || !row[0]) continue;

          const getVal = (headerName: string) => {
            const idx = csvHeaders.indexOf(headerName.toLowerCase());
            return idx !== -1 && idx < row.length ? row[idx] : "";
          };

          const namingSeries = getVal("Naming Series ID") || "MEV-OC-26-";
          const idNumber = getVal("ID Number");
          const operatorName = getVal("Full Operator Name");
          if (!operatorName || !idNumber) continue;

          let finalId = namingSeries;
          const prefix = "MEV-OC-26-";
          if (!finalId || finalId === prefix) {
            finalId = localGetNextId(prefix, importedOperators.length);
          }

          const machineOperator = getVal("Machine Operator");
          const company = getVal("Company");
          const levelType = getVal("Level / Type");
          const trainedBy = getVal("Trained By");
          const issueDate = getVal("Issue Date (Official)") || new Date().toISOString().split("T")[0];
          const licenseExpiry = getVal("Expiry Date (Certification)") || new Date().toISOString().split("T")[0];

          const operator = {
            id: finalId,
            operatorName: operatorName,
            badgeNumber: idNumber,
            authorizedEquipment: [levelType].filter(Boolean),
            safetyIndex: 100,
            licenseExpiry: licenseExpiry,
            status: "Fully Certified",
            photoAttachment: undefined,
            machineOperator: machineOperator,
            idNumber: idNumber,
            company: company,
            issueDate: issueDate,
            levelType: levelType,
            trainedBy: trainedBy,
            authorizedBySignature: undefined,
            trainedBySignature: undefined
          };

          importedOperators.push(operator);
        }

        if (importedOperators.length > 0) {
          onOperatorsChange((prev) => [...importedOperators, ...prev]);
          showToast(`✓ Successfully imported ${importedOperators.length} operators.`);
        } else {
          showToast("⚠ No valid operator entries found in the CSV.");
        }
      } catch (err) {
        console.error(err);
        showToast("⚠ Error parsing CSV file.");
      }
      e.target.value = "";
    };

    reader.readAsText(file);
  };

  const handleBulkDeleteItems = () => {
    const count = selectedOperatorIds.length;
    onOperatorsChange((prev) => prev.filter(o => !selectedOperatorIds.includes(o.id)));
    showToast(`✓ Successfully removed ${count} operator records`);
    setSelectedOperatorIds([]);
    setShowBulkActionDropdown(false);
  };

  // Search input keydown handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = filterInput.trim();
      if (val && !activeFilters.includes(val)) {
        setActiveFilters([...activeFilters, val]);
        setFilterInput("");
      }
    }
  };

  const removeFilter = (filterToRemove: string) => {
    setActiveFilters(activeFilters.filter((f) => f !== filterToRemove));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setFilterInput("");
  };

  const handleRefresh = () => {
    clearAllFilters();
    setSelectedOperatorIds([]);
    showToast("✓ Search query and filter tags reset.");
  };

  // Filtering criteria matches
  const filteredOperators = operators.filter((op) => {
    if (activeFilters.length === 0) return true;
    return activeFilters.every((kw) => {
      const criteria = kw.toLowerCase();
      return (
        op.id.toLowerCase().includes(criteria) ||
        op.operatorName.toLowerCase().includes(criteria) ||
        op.badgeNumber.toLowerCase().includes(criteria) ||
        op.status.toLowerCase().includes(criteria) ||
        (Array.isArray(op.authorizedEquipment) ? op.authorizedEquipment : []).some(eq => eq.toLowerCase().includes(criteria))
      );
    });
  });

  // Pagination slices
  const totalItems = filteredOperators.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOperators = filteredOperators.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Toggle checkout checkboxes
  const handleCheckboxChange = (id: string) => {
    if (selectedOperatorIds.includes(id)) {
      setSelectedOperatorIds(selectedOperatorIds.filter((x) => x !== id));
    } else {
      setSelectedOperatorIds([...selectedOperatorIds, id]);
    }
  };

  // Select all rows on current page
  const handleSelectAll = () => {
    const pageIds = paginatedOperators.map((o) => o.id);
    const allSelected = pageIds.every((id) => selectedOperatorIds.includes(id));
    if (allSelected) {
      setSelectedOperatorIds(selectedOperatorIds.filter((id) => !pageIds.includes(id)));
    } else {
      const newIds = [...selectedOperatorIds];
      pageIds.forEach((id) => {
        if (!newIds.includes(id)) newIds.push(id);
      });
      setSelectedOperatorIds(newIds);
    }
  };

  // ==========================================
  // RENDER MASTER PORTFOLIO LIST VIEW DEFAULT
  // ==========================================
  return (
    <div className="space-y-6" id="operator-directory-view-container">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0E1B2D] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Icons.Info className="w-4 h-4 text-[#683EFF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header with custom tags metadata and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-[#683EFF] font-bold tracking-wider uppercase">
            <span>Certification Hub</span>
            <span className="text-slate-300">/</span>
            <span className="bg-[#F0EBFF] px-2 py-0.5 rounded text-[10px]">Operator Directory</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-800 tracking-tight">
            Operator Directory
          </h2>
        </div>

        {/* Header Action controls */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto relative">
          
          {/* Bulk Actions Bar */}
          {selectedOperatorIds.length > 0 && (
            <div className="bg-[#FFF5F5] border border-rose-100 rounded-xl p-1 px-3 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-[11px] font-black uppercase tracking-[0.1em] text-rose-600 whitespace-nowrap">
                SELECTED: {selectedOperatorIds.length}
              </span>
              
              <div className="relative">
                <button 
                  onClick={() => setShowBulkActionDropdown(!showBulkActionDropdown)}
                  className="bg-white border border-rose-200 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm min-w-[110px]"
                >
                  <span className="text-sm font-bold text-rose-700">Actions</span>
                  <Icons.ChevronDown className={`w-3.5 h-3.5 text-rose-500 transition-transform ${showBulkActionDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showBulkActionDropdown && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowBulkActionDropdown(false)} />
                    <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-[70] overflow-hidden animate-in zoom-in-95 duration-100">
                      <div className="p-1 px-3 bg-slate-400 text-white text-[9px] font-bold uppercase tracking-widest py-1.5">Actions</div>
                      <button 
                        onClick={handleBulkDuplicate}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors border-b border-slate-50"
                      >
                        Duplicate
                      </button>
                      <button 
                        onClick={handleBulkExport}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors border-b border-slate-50"
                      >
                        Export
                      </button>
                      <button 
                        onClick={handleBulkDeleteItems}
                        className="w-full text-left px-4 py-2.5 text-[12px] font-black text-[#D32F2F] hover:bg-rose-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* View selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowViewDropdown(!showViewDropdown)}
              className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:border-slate-400 transition-colors flex items-center justify-between gap-5 min-w-[140px]"
            >
              <span>
                {viewMode === "list" && "List View"}
                {viewMode === "grid" && "Grid View"}
                {viewMode === "compact" && "Compact View"}
              </span>
              <Icons.ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showViewDropdown ? "rotate-180" : ""}`} />
            </button>

            {showViewDropdown && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowViewDropdown(false)} />
                <div className="absolute right-0 mt-1.5 w-[140px] bg-white border border-slate-300 rounded-lg shadow-lg py-1 z-30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100">
                  {["list", "grid", "compact"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setViewMode(mode as any);
                        setShowViewDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 ${viewMode === mode ? "bg-[#F0EBFF] text-[#683EFF]" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {mode === "list" && <Icons.List className="w-3.5 h-3.5" />}
                      {mode === "grid" && <Icons.Grid className="w-3.5 h-3.5" />}
                      {mode === "compact" && <Icons.Rows3 className="w-3.5 h-3.5" />}
                      <span className="capitalize">{mode} View</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Import CSV Button */}
          <button
            onClick={() => document.getElementById("csv-import-operators-input")?.click()}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:border-[#683EFF] hover:text-[#683EFF] rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            title="Import Operators from CSV"
          >
            <Icons.Upload className="w-4 h-4 text-slate-400 hover:text-[#683EFF]" />
            <span>Import</span>
          </button>
          <input
            id="csv-import-operators-input"
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />

          <button
            onClick={handleRefresh}
            className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:text-[#683EFF] hover:border-[#683EFF] hover:bg-slate-50 transition-all shadow-sm"
          >
            <Icons.RotateCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#683EFF] hover:bg-[#5229E0] text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 text-sm shadow-sm transition-all"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Add Operator</span>
          </button>
        </div>
      </div>

      {/* 2. Advanced Search Input Row */}
      <div className="bg-slate-55 rounded-xl p-3 border border-slate-300 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          <div className="relative flex-1">
            <Icons.Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Press Enter to add keywords (e.g. Crane, B-101)..."
              className="w-full pl-11 pr-5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] transition-all font-medium text-slate-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Icons.Filter className="w-4 h-4 text-[#683EFF]" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex items-center gap-3 pt-1 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">Active Filters:</span>
            <div className="flex flex-wrap gap-1.5">
              {activeFilters.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#F0EBFF] text-[#683EFF] rounded-full text-xs font-bold shadow-sm"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => removeFilter(tag)}
                    className="hover:bg-[#683EFF]/15 rounded-full p-0.5 text-[#683EFF] transition-colors ml-1"
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-500 font-bold hover:text-rose-700 ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Data Container */}
      {filteredOperators.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-white border border-slate-200 shadow-sm min-h-[350px]">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
            <Icons.Inbox className="w-10 h-10" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-800 font-sans">No Records Found</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
            We couldn't find any operators matching your criteria.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {viewMode === "list" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 text-[10px] font-semibold uppercase tracking-widest select-none font-sans">
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={paginatedOperators.length > 0 && paginatedOperators.every((o) => selectedOperatorIds.includes(o.id))}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                        />
                      </th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">ID</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">MACHINE OPERATOR</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">NAME</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">ID NUMBER</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">ISSUE DATE</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">EXPIRY DATE</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 text-right font-sans">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedOperators.map((op) => {
                      const isSelected = selectedOperatorIds.includes(op.id);
                      return (
                        <tr
                          key={op.id}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${isSelected ? "bg-[#F0EBFF]/20" : ""}`}
                          onClick={() => onViewOperator(op.id)}
                        >
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(op.id)}
                              className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF]"
                            />
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-mono text-[#683EFF] font-bold">{op.id}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-semibold text-slate-600">
                              {op.machineOperator || "General Operator"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-bold text-slate-800">{op.operatorName}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                              {op.idNumber || op.badgeNumber}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Icons.Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs font-bold text-slate-700">
                                {formatDate(op.issueDate)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Icons.Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs font-bold text-slate-700">{formatDate(op.licenseExpiry)}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2 transition-opacity">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewOperator(op.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-[#683EFF] hover:bg-[#F0EBFF] rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Icons.Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOperator(op.id, op.operatorName);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-right"
                                title="Delete Operator"
                              >
                                <Icons.Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedOperators.map((op) => {
                const isSelected = selectedOperatorIds.includes(op.id);
                return (
                  <div
                    key={op.id}
                    onClick={() => onViewOperator(op.id)}
                    className={`bg-white rounded-xl border p-5 shadow-sm group hover:border-[#683EFF] cursor-pointer transition-all relative ${
                      isSelected ? "border-[#683EFF] bg-[#F0EBFF]/5" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-mono text-[#683EFF] font-bold">{op.id}</span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(op.id)}
                          className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Role / Designation</span>
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                          {op.machineOperator || "General Operator"}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Operator Name</span>
                          <p className="text-xs font-bold text-slate-700 truncate">{op.operatorName}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">ID Number</span>
                          <p className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg truncate">
                            {op.idNumber || op.badgeNumber}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Issue Date</span>
                          <div className="flex items-center gap-1.5">
                            <Icons.Calendar className="w-3 h-3 text-slate-300" />
                            <span className="text-xs font-bold text-slate-700">{formatDate(op.issueDate)}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Expiry Date</span>
                          <div className="flex items-center gap-1.5">
                            <Icons.Calendar className="w-3 h-3 text-[#683EFF]" />
                            <span className="text-xs font-bold text-slate-700">{formatDate(op.licenseExpiry)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewOperator(op.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#683EFF] hover:bg-[#F0EBFF] rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Icons.Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOperator(op.id, op.operatorName);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Operator"
                          >
                            <Icons.Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          op.status === "Fully Certified" ? "bg-emerald-50 text-emerald-700" :
                          op.status === "Grace Period" ? "bg-amber-50 text-amber-700" :
                          "bg-rose-50 text-rose-700"
                        }`}>
                          {op.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === "compact" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-widest select-none">
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={paginatedOperators.length > 0 && paginatedOperators.every((o) => selectedOperatorIds.includes(o.id))}
                          onChange={handleSelectAll}
                          className="w-3.5 h-3.5 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                        />
                      </th>
                      <th className="p-3 text-slate-500 font-sans">ID</th>
                      <th className="p-3 text-slate-500 font-sans">NAME</th>
                      <th className="p-3 text-slate-500 font-sans">ISSUE</th>
                      <th className="p-3 text-slate-500 font-sans">EXPIRY</th>
                      <th className="p-3 text-slate-500 font-sans text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedOperators.map((op) => {
                      const isSelected = selectedOperatorIds.includes(op.id);
                      return (
                        <tr
                          key={op.id}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isSelected ? "bg-[#F0EBFF]/10" : ""}`}
                          onClick={() => onViewOperator(op.id)}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(op.id)}
                              className="w-3.5 h-3.5 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF]"
                            />
                          </td>
                          <td className="p-3">
                            <span className="text-sm font-mono text-[#683EFF] font-bold">{op.id}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm font-bold text-slate-800">{op.operatorName}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-xs font-semibold text-slate-600">{formatDate(op.issueDate)}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-xs font-semibold text-slate-900">{formatDate(op.licenseExpiry)}</span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOperator(op.id, op.operatorName);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                title="Delete"
                              >
                                <Icons.Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="flex items-center justify-between bg-white px-6 py-4 border border-slate-200 rounded-xl shadow-sm select-none mt-6">
            <span className="text-xs text-slate-500 font-semibold font-sans">
              Showing <strong className="text-slate-800 font-extrabold">{Math.min(startIndex + 1, totalItems)}</strong> to{" "}
              <strong className="text-slate-800 font-extrabold">{Math.min(startIndex + itemsPerPage, totalItems)}</strong> of{" "}
              <strong className="text-slate-800 font-extrabold">{totalItems}</strong> entries
            </span>

            <div className="flex items-center gap-2 font-sans">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-250 bg-white rounded-lg text-xs font-bold text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                title="Go to previous page"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-8 w-8 rounded-lg text-xs font-extrabold flex items-center justify-center transition-all ${
                      currentPage === i + 1
                        ? "bg-[#683EFF] text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-250 bg-white rounded-lg text-xs font-bold text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                title="Go to next page"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* 5. ADD OPERATOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Area */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F0EBFF] rounded-xl flex items-center justify-center text-[#683EFF]">
                  <Icons.UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-sans text-slate-800">New Machine Operator Registration</h3>
                  <p className="text-sm text-slate-400 mt-0.5">Define new equipment operator profile with automated naming series.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-all"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form id="add-operator-form" onSubmit={handleCreateOperator} className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30">
              
              {/* Profile Photo Attachment Row */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3 flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-48 h-48 bg-white border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner relative transition-colors group-hover:border-[#683EFF]/50">
                      {formValues.photoAttachment ? (
                        <img src={formValues.photoAttachment} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <Icons.Camera className="w-10 h-10 mb-2 opacity-50" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Upload Photo</span>
                        </div>
                      )}
                      
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileChange("photoAttachment", e)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    {formValues.photoAttachment && (
                      <button 
                        type="button"
                        onClick={() => {
                          if (onDeleteImage && formValues.photoAttachment) onDeleteImage(formValues.photoAttachment);
                          setFormValues(prev => ({ ...prev, photoAttachment: undefined }))
                        }}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                      >
                        <Icons.X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-4 text-center px-4">
                    Authorized profile photo will be used for official badge generation. Maximum 5MB.
                  </p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                  {/* ID Field with Naming Series logic */}
                  <div className="col-span-1 md:col-span-2">
                    <div className="p-4 bg-[#F0EBFF]/30 border border-[#DED3FF] rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Icons.Fingerprint className="w-4 h-4 text-[#683EFF]" />
                        <span className="text-xs font-bold text-[#683EFF] uppercase tracking-wider">Identification Registry</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Naming Series ID</label>
                          <input
                            type="text"
                            value={formValues.namingSeries}
                            onChange={(e) => setFormValues({ ...formValues, namingSeries: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF]"
                            placeholder="MEV-OC-26-XXXX"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ID Number *</label>
                          <input
                            type="text"
                            value={formValues.idNumber}
                            onChange={(e) => setFormValues({ ...formValues, idNumber: e.target.value })}
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 ${formErrors.idNumber ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-[#683EFF]"}`}
                            placeholder="e.g. 28182910"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Operator Name *</label>
                    <div className="relative">
                      <Icons.User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={formValues.operatorName}
                        onChange={(e) => setFormValues({ ...formValues, operatorName: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 ${formErrors.operatorName ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-[#683EFF]"}`}
                        placeholder="Operator Legal Name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Machine Operator</label>
                    <div className="relative">
                      <Icons.Cpu className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={formValues.machineOperator}
                        onChange={(e) => setFormValues({ ...formValues, machineOperator: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF]"
                        placeholder="e.g. Rough Terrain Crane"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Company</label>
                    <div className="relative">
                      <Icons.Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={formValues.company}
                        onChange={(e) => setFormValues({ ...formValues, company: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF]"
                        placeholder="e.g. MEV Logistics Hub"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Level / Type</label>
                    <input
                      type="text"
                      value={formValues.levelType}
                      onChange={(e) => setFormValues({ ...formValues, levelType: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF]"
                      placeholder="e.g. Advanced Rigger"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Trained By</label>
                    <input
                      type="text"
                      value={formValues.trainedBy}
                      onChange={(e) => setFormValues({ ...formValues, trainedBy: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF]"
                      placeholder="e.g. Khalid Amir Hussain"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Issue Date (Official)</label>
                    <div className="relative">
                      <Icons.Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={formValues.issueDate}
                        onChange={(e) => setFormValues({ ...formValues, issueDate: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Expiry Date (Certification) *</label>
                    <div className="relative">
                      <Icons.Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#683EFF]" />
                      <input
                        type="date"
                        value={formValues.licenseExpiry}
                        onChange={(e) => setFormValues({ ...formValues, licenseExpiry: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 ${formErrors.licenseExpiry ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-[#683EFF]"}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="border-t border-slate-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Authorized By Signature */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icons.Signature className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Authorized By</span>
                      </div>
                      {formValues.authorizedBySignature && (
                        <button 
                          type="button"
                          onClick={() => {
                            if (onDeleteImage && formValues.authorizedBySignature) onDeleteImage(formValues.authorizedBySignature);
                            setFormValues(prev => ({ ...prev, authorizedBySignature: undefined }))
                            showToast("✓ Authorized signature removed.");
                          }}
                          className="text-[10px] font-bold text-rose-500 z-10 hover:text-rose-600 relative"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="p-8 flex flex-col items-center justify-center min-h-[120px] relative transition-all bg-slate-50/20 group hover:bg-slate-50/50">
                      {formValues.authorizedBySignature ? (
                        <img src={formValues.authorizedBySignature} alt="Authorized By" className="max-h-20 object-contain" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <Icons.Edit3 className="w-6 h-6 mb-2 opacity-30" />
                          <span className="text-[10px] font-bold text-slate-400 tracking-wide text-center">Upload Signature</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileChange("authorizedBySignature", e)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-0"
                      />
                    </div>
                  </div>

                  {/* Trained By Signature */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icons.Signature className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Trained By</span>
                      </div>
                      {formValues.trainedBySignature && (
                        <button 
                          type="button"
                          onClick={() => {
                            if (onDeleteImage && formValues.trainedBySignature) onDeleteImage(formValues.trainedBySignature);
                            setFormValues(prev => ({ ...prev, trainedBySignature: undefined }))
                            showToast("✓ Trained signature removed.");
                          }}
                          className="text-[10px] font-bold text-rose-500 z-10 hover:text-rose-600 relative"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="p-8 flex flex-col items-center justify-center min-h-[120px] relative transition-all bg-slate-50/20 group hover:bg-slate-50/50">
                      {formValues.trainedBySignature ? (
                        <img src={formValues.trainedBySignature} alt="Trained By" className="max-h-20 object-contain" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <Icons.Edit3 className="w-6 h-6 mb-2 opacity-30" />
                          <span className="text-[10px] font-bold text-slate-400 tracking-wide text-center">Upload Signature</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileChange("trainedBySignature", e)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-0"
                      />
                    </div>
                  </div>

                </div>
              </div>

            </form>

            {/* Footer buttons */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <button 
                type="button"
                onClick={resetForm}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Reset Configuration
              </button>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 border border-slate-250 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all font-sans"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  form="add-operator-form"
                  className="px-8 py-2.5 bg-[#683EFF] hover:bg-[#5229E0] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#683EFF]/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Icons.Save className="w-4 h-4" />
                  <span>Finalize Operator Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                <Icons.AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-sans">Delete Operator?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to permanently delete this operator record? This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-all shadow-md shadow-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
