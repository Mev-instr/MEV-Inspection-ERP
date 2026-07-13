/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import * as Icons from "lucide-react";
import { MachineDetail } from "../types";
import { formatDate } from "../utils";

interface MachineDetailsPortfolioProps {
  machines: MachineDetail[];
  onMachinesChange: React.Dispatch<React.SetStateAction<MachineDetail[]>>;
}

export function MachineDetailsPortfolioView({ machines, onMachinesChange }: MachineDetailsPortfolioProps) {
  // View states
  const [viewMode, setViewMode] = useState<"list" | "grid" | "compact">("list");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  
  // Search and Enter-key Tag filters
  const [filterInput, setFilterInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Row selection & interaction states
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedMachineDetail, setSelectedMachineDetail] = useState<MachineDetail | null>(null);

  // Pagination configuration
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(event.target as Node)) {
        setShowPageSizeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
    setShowPageSizeDropdown(false);
  };

  // Add Machine modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<"basic" | "technical" | "status">("basic");

  // New Machine Form State
  const initialFormState = {
    machineId: "",
    machineName: "",
    model: "",
    manufacturer: "",
    yearOfManufacture: new Date().getFullYear().toString(),
    serialNumber: "",
    currentLocation: "",
    workingHours: "0",
    status: "Operational" as const,
    department: "Heavy Equipment Fleet",
    lastServiceDate: new Date().toISOString().split("T")[0],
    swl: "",
    maxOutreach: "",
    bucketCapacity: "",
    enginePower: "",
    boomLength: "",
    wheelType: "",
    maxPlatformHeight: "",
    heoBucketCapacity: "",
    engineSpeed: "",
    angleOfSpan: "",
    personAllowed: "",
  };

  const [formValues, setFormValues] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Timeline / comments state in Detail Sidebar Page
  const [comments, setComments] = useState<Array<{ id: string; author: string; text: string; time: string }>>([
    {
      id: "comment-1",
      author: "ZM",
      text: "Annual safety certificate verification scheduled.",
      time: "Recorded Note"
    },
    {
      id: "comment-2",
      author: "MK",
      text: "Fleet hydraulic seals checked during routine maintenance cycle.",
      time: "Recorded Note"
    }
  ]);
  const [newComment, setNewComment] = useState("");

  // Detail Page active sub tab
  const [activeDetailTab, setActiveDetailTab] = useState<"DETAILS">("DETAILS");

  // Edit in Page status inside Detail layout
  const [isEditingInDetail, setIsEditingInDetail] = useState(false);
  const [editFormValues, setEditFormValues] = useState<MachineDetail | null>(null);
  const [showBulkActionDropdown, setShowBulkActionDropdown] = useState(false);

  // CSV Import Mapping states
  const [showImportMappingModal, setShowImportMappingModal] = useState(false);
  const [importStep, setImportStep] = useState<"map" | "confirm" | "done">("map");
  const [importedPreviewList, setImportedPreviewList] = useState<MachineDetail[]>([]);
  const [csvMappingData, setCsvMappingData] = useState<{
    headers: string[];
    sampleRow: string[];
    allRows: string[][];
    mappings: Record<string, string>;
  } | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleBulkDuplicate = () => {
    const toDuplicate = machines.filter(m => selectedMachineIds.includes(m.id));
    const duplicated = toDuplicate.map(m => ({
      ...m,
      id: `MACH-26-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      machineName: `${m.machineName} (Copy)`,
    }));
    onMachinesChange((prev) => [...duplicated, ...prev]);
    showToast(`✓ Duplicated ${selectedMachineIds.length} machines`);
    setSelectedMachineIds([]);
    setShowBulkActionDropdown(false);
  };

  const handleBulkExport = () => {
    const count = selectedMachineIds.length;
    showToast(`✓ Exporting ${count} machines to CSV...`);
    
    const headers = [
      "Machine ID", "Machine name", "S.W.L", "Maximum Horizontal Outreach",
      "Max Bucket Capacity", "Manufacturer", "Engine Power", "Boom Length",
      "Wheel Type", "Max Platform Height", "Hoe Bucket Capacity", "Engine Speed",
      "Angle of Span", "Person Allowed"
    ].join(",");

    const rows = machines
      .filter(m => selectedMachineIds.includes(m.id))
      .map(m => [
        m.id, m.machineName, m.swl, m.maxOutreach, m.bucketCapacity, m.manufacturer,
        m.enginePower, m.boomLength, m.wheelType, m.maxPlatformHeight, m.heoBucketCapacity,
        m.engineSpeed, m.angleOfSpan, m.personAllowed
      ].map(field => `"${String(field || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `machines_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSelectedMachineIds([]);
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

    const smartMap = (header: string): string => {
      const h = header.trim().toLowerCase();
      if (h === "id" || h === "machine id" || h === "mach_id" || h === "machineid") return "id";
      if (h === "machine name" || h === "name" || h === "title") return "machineName";
      if (h === "model" || h === "machine model") return "model";
      if (h === "manufacturer" || h === "brand" || h === "make") return "manufacturer";
      if (h === "year" || h === "year of manufacture" || h === "manufacture year" || h === "yearofmanufacture") return "yearOfManufacture";
      if (h === "serial number" || h === "serial" || h === "sn" || h === "serial_number" || h === "serialnumber") return "serialNumber";
      if (h === "location" || h === "current location" || h === "current_location" || h === "currentlocation") return "currentLocation";
      if (h === "status" || h === "state") return "status";
      if (h === "working hours" || h === "hours" || h === "working_hours" || h === "workinghours") return "workingHours";
      if (h === "department" || h === "dept") return "department";
      if (h === "last service date" || h === "service_date" || h === "last_service" || h === "lastservicedate") return "lastServiceDate";
      if (h === "s.w.l" || h === "swl" || h === "safe working load") return "swl";
      if (h === "maximum horizontal outreach" || h === "max outreach" || h === "outreach" || h === "maximum_horizontal_outreach" || h === "maxoutreach") return "maxOutreach";
      if (h === "max bucket capacity" || h === "bucket capacity" || h === "bucket_capacity" || h === "bucketcapacity") return "bucketCapacity";
      if (h === "engine power" || h === "power" || h === "engine_power" || h === "enginepower") return "enginePower";
      if (h === "boom length" || h === "boom_length" || h === "boomlength") return "boomLength";
      if (h === "wheel type" || h === "wheel_type" || h === "wheeltype") return "wheelType";
      if (h === "max platform height" || h === "platform height" || h === "max_platform_height" || h === "maxplatformheight") return "maxPlatformHeight";
      if (h === "hoe bucket capacity" || h === "hoe_bucket_capacity" || h === "heobucketcapacity") return "heoBucketCapacity";
      if (h === "engine speed" || h === "engine_speed" || h === "enginespeed") return "engineSpeed";
      if (h === "angle of span" || h === "angle_of_span" || h === "angleofspan") return "angleOfSpan";
      if (h === "person allowed" || h === "persons" || h === "person_allowed" || h === "personallowed") return "personAllowed";
      return ""; // Default: Ignore
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

        const csvHeaders = rows[0].map(h => h.trim());
        const csvSampleRow = rows[1] || [];
        const csvAllRows = rows.slice(1);

        // Compute initial intelligent mapping
        const initialMappings: Record<string, string> = {};
        csvHeaders.forEach((header) => {
          initialMappings[header] = smartMap(header);
        });

        setCsvMappingData({
          headers: csvHeaders,
          sampleRow: csvSampleRow,
          allRows: csvAllRows,
          mappings: initialMappings
        });
        setImportStep("map");
        setImportedPreviewList([]);
        setShowImportMappingModal(true);
      } catch (err) {
        console.error(err);
        showToast("⚠ Error parsing CSV file.");
      }
      e.target.value = "";
    };

    reader.readAsText(file);
  };

  const handleGoToConfirmation = () => {
    if (!csvMappingData) return;

    const { headers, allRows, mappings } = csvMappingData;
    const importedMachines: MachineDetail[] = [];

    // Base number for ML- ID generation
    let nextNum = 1;
    const regex = /^ML-(\d+)$/i;
    machines.forEach((m) => {
      const match = m.id.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextNum) {
          nextNum = num + 1;
        }
      }
    });

    const getValMapped = (row: string[], colHeaders: string[], activeMappings: Record<string, string>, targetField: string) => {
      // Find all CSV headers mapped to this target field
      const csvHeader = colHeaders.find(h => activeMappings[h] === targetField);
      if (!csvHeader) return "";
      const idx = colHeaders.indexOf(csvHeader);
      return idx !== -1 && idx < row.length ? row[idx].trim() : "";
    };

    allRows.forEach((row) => {
      if (row.length === 0) return;

      const getVal = (targetField: string) => {
        return getValMapped(row, headers, mappings, targetField);
      };

      const machineName = getVal("machineName") || getVal("model") || "Unnamed Asset";
      if (!machineName || machineName === "Unnamed Asset") {
        // Skip completely blank rows
        const hasAnyContent = row.some(val => val.trim().length > 0);
        if (!hasAnyContent) return;
      }

      let rawId = getVal("id").trim();
      let customPart = rawId.replace(/^ML-?/i, "");
      let finalId = "";
      if (customPart) {
        finalId = `ML-${customPart}`;
      } else {
        const padded = String(nextNum).padStart(3, "0");
        finalId = `ML-${padded}`;
        nextNum++;
      }

      const generatedSn = getVal("serialNumber") || ("SN-" + Math.floor(100000 + Math.random() * 900000));

      const machine: MachineDetail = {
        id: finalId,
        machineName: machineName,
        model: getVal("model") || machineName,
        manufacturer: getVal("manufacturer") || "General Manufacturer",
        yearOfManufacture: parseInt(getVal("yearOfManufacture"), 10) || new Date().getFullYear(),
        serialNumber: generatedSn,
        currentLocation: getVal("currentLocation") || "HQ Fleet",
        status: (getVal("status") as any) || "Operational",
        workingHours: parseFloat(getVal("workingHours")) || 0,
        department: getVal("department") || "Heavy Equipment Fleet",
        lastServiceDate: getVal("lastServiceDate") || new Date().toISOString().split("T")[0],
        swl: getVal("swl") || undefined,
        maxOutreach: getVal("maxOutreach") || undefined,
        bucketCapacity: getVal("bucketCapacity") || undefined,
        enginePower: getVal("enginePower") || undefined,
        boomLength: getVal("boomLength") || undefined,
        wheelType: getVal("wheelType") || undefined,
        maxPlatformHeight: getVal("maxPlatformHeight") || undefined,
        heoBucketCapacity: getVal("heoBucketCapacity") || undefined,
        engineSpeed: getVal("engineSpeed") || undefined,
        angleOfSpan: getVal("angleOfSpan") || undefined,
        personAllowed: getVal("personAllowed") || undefined
      };

      importedMachines.push(machine);
    });

    if (importedMachines.length > 0) {
      setImportedPreviewList(importedMachines);
      setImportStep("confirm");
    } else {
      showToast("⚠ No valid machine entries found to map. Please map fields first.");
    }
  };

  const handleExecuteImport = () => {
    if (importedPreviewList.length === 0) return;

    onMachinesChange((prev) => [...importedPreviewList, ...prev]);
    showToast(`✓ Successfully imported ${importedPreviewList.length} machine models.`);
    setImportStep("done");
  };

  const handleBulkDeleteItems = () => {
    const count = selectedMachineIds.length;
    onMachinesChange((prev) => prev.filter(m => !selectedMachineIds.includes(m.id)));
    showToast(`✓ Successfully removed ${count} machine records`);
    setSelectedMachineIds([]);
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
    setSelectedMachineIds([]);
    showToast("✓ Search query and filter tags reset.");
  };

  // Filtering criteria matches
  const filteredMachines = machines.filter((machine) => {
    if (activeFilters.length === 0) return true;
    return activeFilters.every((kw) => {
      const criteria = kw.toLowerCase();
      return (
        machine.id.toLowerCase().includes(criteria) ||
        (machine.machineName || "").toLowerCase().includes(criteria) ||
        (machine.model || "").toLowerCase().includes(criteria) ||
        (machine.manufacturer || "").toLowerCase().includes(criteria) ||
        (machine.serialNumber || "").toLowerCase().includes(criteria) ||
        (machine.currentLocation || "").toLowerCase().includes(criteria) ||
        (machine.status || "").toLowerCase().includes(criteria) ||
        (machine.department || "").toLowerCase().includes(criteria)
      );
    });
  });

  // Pagination slices
  const totalItems = filteredMachines.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const sortedMachines = [...filteredMachines].sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: "base" }));
  const paginatedMachines = sortedMachines.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const getPageNumbers = (current: number, total: number): (number | string)[] => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, "..."];
    }
    if (current >= total - 2) {
      return [1, "...", total - 3, total - 2, total - 1, total];
    }
    return [1, "...", current - 1, current, current + 1, "..."];
  };

  // Toggle checkboxes
  const handleCheckboxChange = (id: string) => {
    if (selectedMachineIds.includes(id)) {
      setSelectedMachineIds(selectedMachineIds.filter((x) => x !== id));
    } else {
      setSelectedMachineIds([...selectedMachineIds, id]);
    }
  };

  // Select all rows on current page
  const handleSelectAll = () => {
    const pageIds = paginatedMachines.map((m) => m.id);
    const allSelected = pageIds.every((id) => selectedMachineIds.includes(id));
    if (allSelected) {
      setSelectedMachineIds(selectedMachineIds.filter((id) => !pageIds.includes(id)));
    } else {
      const newIds = [...selectedMachineIds];
      pageIds.forEach((id) => {
        if (!newIds.includes(id)) newIds.push(id);
      });
      setSelectedMachineIds(newIds);
    }
  };

  // Helper calculation to auto-generate the next MACH-26-XXXX sequence
  const calculateNextSequenceId = (seriesInput: string): string => {
    const cleanSeries = seriesInput.trim() || "MACH-26";
    
    if (cleanSeries !== "MACH-26") {
      return cleanSeries;
    }

    let maxSuffix = 1000; // Starting baseline suffix count
    const matchingMachines = machines.filter((m) => m.id.startsWith("MACH-26-"));
    matchingMachines.forEach((m) => {
      const parts = m.id.split("-");
      const suffixCode = parts[parts.length - 1];
      const numericVal = parseInt(suffixCode, 10);
      if (!isNaN(numericVal) && numericVal > maxSuffix) {
        maxSuffix = numericVal;
      }
    });

    return `MACH-26-${maxSuffix + 1}`;
  };

  // Handle Form Submission / Machine Creation
  const handleCreateMachine = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formValues.machineName.trim()) {
      errors.machineName = "Machine Name is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    let customPart = formValues.machineId.trim();
    // Strip starting "ML-" case-insensitive, optional dash
    customPart = customPart.replace(/^ML-?/i, "");

    let finalId = "";
    if (customPart) {
      finalId = `ML-${customPart}`;
    } else {
      let nextNum = 1;
      const regex = /^ML-(\d+)$/i;
      machines.forEach((m) => {
        const match = m.id.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= nextNum) {
            nextNum = num + 1;
          }
        }
      });
      const padded = String(nextNum).padStart(3, "0");
      finalId = `ML-${padded}`;
    }

    const generatedSn = "SN-" + Math.floor(100000 + Math.random() * 900000);

    const newMachine: MachineDetail = {
      id: finalId,
      machineName: formValues.machineName,
      model: formValues.machineName,
      manufacturer: formValues.manufacturer || "General Manufacturer",
      yearOfManufacture: new Date().getFullYear(),
      serialNumber: generatedSn,
      currentLocation: "HQ Fleet",
      status: "Operational",
      workingHours: 0,
      department: "Heavy Equipment Fleet",
      lastServiceDate: new Date().toISOString().split("T")[0],
      swl: formValues.swl,
      maxOutreach: formValues.maxOutreach,
      bucketCapacity: formValues.bucketCapacity,
      enginePower: formValues.enginePower,
      boomLength: formValues.boomLength,
      wheelType: formValues.wheelType,
      maxPlatformHeight: formValues.maxPlatformHeight,
      heoBucketCapacity: formValues.heoBucketCapacity,
      engineSpeed: formValues.engineSpeed,
      angleOfSpan: formValues.angleOfSpan,
      personAllowed: formValues.personAllowed,
    };

    onMachinesChange((prev) => [newMachine, ...prev]);
    setShowAddModal(false);
    setFormValues(initialFormState);
    setFormErrors({});
    setActiveFormTab("basic");
    showToast(`✓ Machine asset ${newMachine.id} generated successfully.`);
  };

  // Save changes done in page detail view
  const handleSaveDetailChanges = () => {
    if (!editFormValues) return;
    
    onMachinesChange((prev) =>
      prev.map((m) => (m.id === editFormValues.id ? editFormValues : m))
    );
    setSelectedMachineDetail(editFormValues);
    setIsEditingInDetail(false);
    showToast("✓ Machine details updated successfully.");
  };

  // Quick navigation buttons in detail page
  const currentDetailIndex = machines.findIndex((m) => m.id === selectedMachineDetail?.id);
  
  const handlePrevDetail = () => {
    if (currentDetailIndex > 0) {
      setSelectedMachineDetail(machines[currentDetailIndex - 1]);
      setIsEditingInDetail(false);
    } else {
      showToast("First machine record reached.");
    }
  };

  const handleNextDetail = () => {
    if (currentDetailIndex < machines.length - 1) {
      setSelectedMachineDetail(machines[currentDetailIndex + 1]);
      setIsEditingInDetail(false);
    } else {
      showToast("Last machine record reached.");
    }
  };

  // Delete machine
  const handleDeleteMachine = (id: string) => {
    onMachinesChange((prev) => prev.filter((m) => m.id !== id));
    setSelectedMachineIds(selectedMachineIds.filter((x) => x !== id));
    if (selectedMachineDetail?.id === id) {
      setSelectedMachineDetail(null);
    }
    showToast("✓ Machine record removed from workspace.");
    setConfirmDeleteId(null);
  };

  // Export JSON summary of machine
  const handleExportMachineJson = (machine: MachineDetail) => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(machine, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `machine_${machine.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("✓ Downloaded machine JSON.");
    } catch {
      showToast("Error exporting JSON.");
    }
  };

  // Trigger print document simulator
  const handlePrintMachine = (machine: MachineDetail) => {
    showToast(`✓ Dispatched printable specification docket for Machine ID ${machine.id}`);
  };

  // Timeline comment logging
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment = {
      id: `comment-${Date.now()}`,
      author: "MD",
      text: newComment.trim(),
      time: "Just now"
    };
    setComments([comment, ...comments]);
    setNewComment("");
    showToast("✓ Added notes to this machine's active audit trail.");
  };

  // Initializing edit form state
  useEffect(() => {
    if (selectedMachineDetail) {
      setEditFormValues({ ...selectedMachineDetail });
    }
  }, [selectedMachineDetail]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ==========================================
  // RENDER DETAILED PAGE ROUTE IF SELECTED
  // ==========================================
  if (selectedMachineDetail) {
    const machine = selectedMachineDetail;
    const isLiked = !!favorites[machine.id];
    
    const dispName = machine.machineName || "Industrial Heavy Asset";
    const dispModel = machine.model || "N/A";
    const dispMfg = machine.manufacturer || "N/A";
    const dispYear = machine.yearOfManufacture || "N/A";
    const dispLoc = machine.currentLocation || "N/A";
    const dispSerial = machine.serialNumber || "N/A";
    const dispHours = (machine as any).workingHours || 0;
    const dispDept = (machine as any).department || "Heavy Equipment Fleet";
    const dispService = (machine as any).lastServiceDate || "N/A";

    return (
      <div className="space-y-6" id="machine-detail-route">
        
        {/* Toast Alerts */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#0E1B2D] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-750 animate-slide-in">
            <Icons.Info className="w-4 h-4 text-[#683EFF]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Header with Breadcrumbs, actions and navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#ECECF3] pb-4 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedMachineDetail(null)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#683EFF] hover:border-[#683EFF] transition-all shadow-sm group animate-in fade-in"
              title="Go Back"
            >
              <Icons.ArrowLeft className="w-4.5 h-4.5 group-active:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400 font-medium font-sans">
                <button onClick={() => setSelectedMachineDetail(null)} className="hover:text-[#683EFF] font-semibold transition-colors">
                  Machine models list page
                </button>
                <Icons.ChevronRight className="w-3 h-3 text-slate-350" />
                <span className="font-bold text-slate-700 truncate max-w-[200px]">{machine.id}</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-800 tracking-tight">
                Machine models detail page
              </h2>
            </div>
          </div>

          {/* Action Row Sidebar side buttons */}
          <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
            
            {/* Action buttons (Print, Export, Delete) */}
            <button
              onClick={() => handlePrintMachine(machine)}
              title="Print Specification Docket"
              className="p-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition-colors"
            >
              <Icons.Printer className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleExportMachineJson(machine)}
              title="Download Machine Summary"
              className="p-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition-colors"
            >
              <Icons.Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setConfirmDeleteId(machine.id)}
              title="Permanent Delete"
              className="p-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
            >
              <Icons.Trash2 className="w-4 h-4" />
            </button>

            {/* Pagination Controls between records */}
            <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm h-[36px]">
              <button
                onClick={handlePrevDetail}
                disabled={currentDetailIndex <= 0}
                className="p-2 hover:bg-slate-50 text-slate-500 disabled:opacity-35 border-r border-slate-200 transition-colors"
                title="Previous machine"
              >
                <Icons.ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDetail}
                disabled={currentDetailIndex >= machines.length - 1}
                className="p-2 hover:bg-slate-50 text-slate-500 disabled:opacity-35 transition-colors"
                title="Next machine"
              >
                <Icons.ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle edit in page or save directly */}
            {isEditingInDetail ? (
              <button
                onClick={handleSaveDetailChanges}
                className="bg-[#683EFF] hover:bg-[#5229E0] text-white px-5 py-2 rounded-lg flex items-center gap-1.5 font-bold text-sm shadow-sm transition-all"
              >
                <Icons.Save className="w-4 h-4" />
                <span>SAVE</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditingInDetail(true)}
                className="bg-[#683EFF] hover:bg-[#5229E0] text-white px-5 py-2 rounded-lg flex items-center gap-1.5 font-bold text-sm shadow-sm transition-all"
              >
                <Icons.Edit className="w-4 h-4" />
                <span>EDIT DETAILS</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Main Double-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Detail sidebar Left Column */}
          <div id="Detail sidebar" className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center shadow-sm text-center">
            
            {/* Avatar block with MA/Id */}
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-[#683EFF]/15 to-[#683EFF]/5 text-[#683EFF] text-3xl font-black flex items-center justify-center shadow-sm relative shrink-0 font-mono">
              {machine.id.substring(0, 4).toUpperCase()}
            </div>

            {/* Machine Name */}
            <h3 className="font-display font-bold text-slate-800 text-lg mt-4 leading-snug">
              {dispName}
            </h3>

            {/* Static & Dynamic details rows */}
            <div className="w-full mt-6 pt-5 border-t border-slate-100 space-y-3.5 text-left text-xs text-slate-600 font-medium">
              
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <Icons.Key className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 font-medium font-sans">Asset ID</span>
                    </div>
                    <span className="font-mono text-[#683EFF] font-bold">{machine.id}</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Icons.Cpu className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 font-medium font-sans">Manufacturer</span>
                    </div>
                    <span className="font-semibold font-sans text-slate-800">{dispMfg}</span>
                  </div>

            </div>

            {/* Bookmarks heart trigger button */}
            <div className="w-full mt-5">
              <button
                type="button"
                onClick={(e) => toggleFavorite(machine.id, e)}
                className={`w-full py-2 border rounded-xl hover:bg-slate-50 transition text-xs font-bold font-sans flex items-center justify-center gap-2 cursor-pointer ${
                  isLiked ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                <Icons.Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                <span>{isLiked ? "Bookmarked" : "Add to Bookmarks"}</span>
              </button>
            </div>

            {/* Audit log indicator underneath */}
            <div className="w-full mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1 text-left">
              <p className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#683EFF]" />
                <span>Asset registered in Central Fleet</span>
              </p>
              <p className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>Specifications verified today</span>
              </p>
            </div>
          </div>

          {/* Right side interactive tabbed sheet content */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Tab navigation bar */}
            <div className="border-b border-[#ECECF3] flex gap-6 select-none shrink-0" id="machine-detail-tabbed-navigation">
              <button
                onClick={() => setActiveDetailTab("DETAILS")}
                className={`pb-3 font-display font-bold text-xs uppercase tracking-wider relative transition-all ${
                  activeDetailTab === "DETAILS" ? "text-[#683EFF]" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <span>Specification Details</span>
                {activeDetailTab === "DETAILS" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#683EFF]" />
                )}
              </button>
            </div>

            {/* Tabbed Sheet body - DETAILS tab */}
            {activeDetailTab === "DETAILS" && (
              <div className="space-y-6">
                
                {/* 2.1 Machine Model Specifications Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 select-none text-slate-700">
                    <Icons.FileText className="w-4 h-4 text-[#683EFF]" />
                    <span>Machine Model Specifications</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Machine ID */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Machine ID
                      </label>
                      <input
                        type="text"
                        disabled={true}
                        value={machine.id}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-500 disabled:opacity-85"
                      />
                    </div>

                    {/* 2. Machine name */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Machine name *
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.machineName || "" : dispName}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, machineName: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    {/* 3. S.W.L */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        S.W.L
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.swl || "" : (machine.swl || "")}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, swl: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    {/* 4. Maximum Horizontal Outreach */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Maximum Horizontal Outreach
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.maxOutreach || "" : (machine.maxOutreach || "")}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, maxOutreach: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    {/* 5. Max Bucket Capacity */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Max Bucket Capacity
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.bucketCapacity || "" : (machine.bucketCapacity || "")}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, bucketCapacity: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    {/* 6. Manufacturer */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.manufacturer || "" : dispMfg}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, manufacturer: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    {/* 7. Engine Power */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Engine Power
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.enginePower || "" : (machine.enginePower || "")}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, enginePower: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    {/* 8. Boom Length */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Boom Length
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.boomLength || "" : (machine.boomLength || "")}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, boomLength: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    {/* 9. Wheel Type */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Wheel Type
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.wheelType || "" : (machine.wheelType || "")}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, wheelType: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    {/* 10. Max Platform Height */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Max Platform Height
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.maxPlatformHeight || "" : (machine.maxPlatformHeight || "")}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, maxPlatformHeight: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    {/* 11. Hoe Bucket Capacity */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Hoe Bucket Capacity
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.heoBucketCapacity || "" : (machine.heoBucketCapacity || "")}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, heoBucketCapacity: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    {/* 12. Engine Speed */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Engine Speed
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.engineSpeed || "" : (machine.engineSpeed || "")}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, engineSpeed: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    {/* 13. Angle of Span */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Angle of Span
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.angleOfSpan || "" : (machine.angleOfSpan || "")}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, angleOfSpan: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    {/* 14. Person Allowed */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Person Allowed
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.personAllowed || "" : (machine.personAllowed || "")}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, personAllowed: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 2.3 Activity Timeline and Comments Double-Column Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  
                  {/* Left: Activity Timeline */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-3 text-slate-700">
                      <Icons.Activity className="w-4 h-4 text-[#683EFF]" />
                      <span>Activity Timeline</span>
                    </h3>
                    
                    <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 text-left">
                      
                      {/* Item 1 */}
                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#F0EBFF] text-[#683EFF] border border-white shadow-sm flex items-center justify-center">
                          <Icons.Plus className="w-2.5 h-2.5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Machine deploy site updated</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">12 minutes ago by MK</p>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-slate-100 text-slate-500 border border-white shadow-sm flex items-center justify-center">
                          <Icons.RefreshCw className="w-2.5 h-2.5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Routine service checklists synchronized</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">35 minutes ago</p>
                        </div>
                      </div>

                      {/* Item 3 */}
                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#F0EBFF] text-[#683EFF] border border-white shadow-sm flex items-center justify-center">
                          <Icons.Paperclip className="w-2.5 h-2.5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Calibration certificate document attached</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Profile Comments */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-3 text-slate-700">
                      <Icons.MessageSquare className="w-4 h-4 text-[#683EFF]" />
                      <span>Profile Comments</span>
                    </h3>

                    {/* Comment input form */}
                    <form onSubmit={handleAddComment} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#10B981] text-white font-bold flex items-center justify-center text-[10px] shrink-0 select-none">
                        MD
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Type a fast note or comment..."
                          className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] font-semibold text-slate-700 placeholder-slate-400"
                        />
                        <button
                          type="submit"
                          className="bg-[#683EFF] hover:bg-[#5229E0] text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors shadow-sm cursor-pointer"
                        >
                          Post
                        </button>
                      </div>
                    </form>

                    {/* Comments list feed */}
                    <div className="space-y-4 pt-1 max-h-[160px] overflow-y-auto pr-1">
                      {comments.map((comm) => (
                        <div key={comm.id} className="flex gap-3 items-start text-left">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 select-none text-white ${
                            comm.author === "MD" ? "bg-[#10B981]" : comm.author === "MK" ? "bg-amber-500" : "bg-[#4B68FF]"
                          }`}>
                            {comm.author}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800 leading-relaxed break-words">{comm.text}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">{comm.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

        {confirmDeleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                  <Icons.AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 font-sans">Delete Machine Asset?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Are you sure you want to permanently delete this heavy machine asset record? This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6 w-full">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteMachine(confirmDeleteId)}
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

  // ==========================================
  // RENDER MASTER PORTFOLIO LIST VIEW DEFAULT
  // ==========================================
  return (
    <div className="space-y-6" id="machine-portfolio-view-container">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0E1B2D] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-755 animate-slide-in">
          <Icons.Info className="w-4 h-4 text-[#683EFF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header with custom tags metadata and Add Machine Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-[#683EFF] font-bold tracking-wider uppercase">
            <span>Operations Management</span>
            <span className="text-slate-300">/</span>
            <span className="bg-[#F0EBFF] px-2 py-0.5 rounded text-[10px]">Machine models list page</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-800 tracking-tight">
            Machine models list page
          </h2>
        </div>

        {/* Header Action controls */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto relative">
          
          {/* Bulk Actions Bar Integrated directly into the row, appeared on the left of dropdown */}
          {selectedMachineIds.length > 0 && (
            <div className="bg-[#FFF5F5] border border-rose-100 rounded-xl p-1 px-3 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-[11px] font-black uppercase tracking-[0.1em] text-rose-600 whitespace-nowrap">
                SELECTED: {selectedMachineIds.length}
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

          {/* View selector dropdown matches Customer list */}
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
                  <button
                    onClick={() => {
                      setViewMode("list");
                      setShowViewDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 ${viewMode === "list" ? "bg-[#F0EBFF] text-[#683EFF]" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Icons.List className="w-3.5 h-3.5" />
                    <span>List View</span>
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("grid");
                      setShowViewDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 ${viewMode === "grid" ? "bg-[#F0EBFF] text-[#683EFF]" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Icons.Grid className="w-3.5 h-3.5" />
                    <span>Grid View</span>
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("compact");
                      setShowViewDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 ${viewMode === "compact" ? "bg-[#F0EBFF] text-[#683EFF]" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Icons.Rows3 className="w-3.5 h-3.5" />
                    <span>Compact View</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Import CSV Button */}
          <button
            onClick={() => document.getElementById("csv-import-machines-input")?.click()}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:border-[#683EFF] hover:text-[#683EFF] rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            title="Import Machine Models from CSV"
          >
            <Icons.Upload className="w-4 h-4 text-slate-400 hover:text-[#683EFF]" />
            <span>Import</span>
          </button>
          <input
            id="csv-import-machines-input"
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />

          {/* Refresh Action Trigger */}
          <button
            onClick={handleRefresh}
            title="Reset active query filter parameters"
            className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:text-[#683EFF] hover:border-[#683EFF] hover:bg-slate-50 transition-all shadow-sm"
          >
            <Icons.RotateCw className="w-5 h-5" />
          </button>

          {/* Add Machine Detail master trigger */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#683EFF] hover:bg-[#5229E0] text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 text-sm shadow-sm transition-all"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Add machine Model</span>
          </button>
        </div>
      </div>

      {/* 2. Advanced search input row with active Enter tags selector */}
      <div className="bg-slate-55 rounded-xl p-3 border border-slate-300 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          
          {/* Input textbox */}
          <div className="relative flex-1">
            <Icons.Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Press Enter to add filter keywords (e.g. Tadano, Operational, Dhahran, Model)..."
              className="w-full pl-11 pr-5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] transition-all font-medium text-slate-700"
            />
          </div>

          {/* Popover Filter menu button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`px-4 py-2.5 text-sm font-bold border rounded-xl flex items-center gap-2 shadow-sm transition-all whitespace-nowrap justify-center ${
                activeFilters.length > 0
                  ? "bg-[#F0EBFF] border-[#683EFF] text-[#683EFF]"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icons.Filter className="w-4 h-4" />
              <span>{activeFilters.length > 0 ? `Tags ${activeFilters.length}` : "Filter"}</span>
              <Icons.ChevronDown className="w-3.5 h-3.5 opacity-65" />
            </button>

            {showFilterDropdown && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowFilterDropdown(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-300 rounded-xl shadow-xl p-4 z-30 select-none animate-in fade-in slide-in-from-top-3 duration-150">
                  <div className="flex justify-between items-center mb-2.5 border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Search Keywords Tags</span>
                    {activeFilters.length > 0 && (
                      <button 
                        onClick={clearAllFilters} 
                        className="text-[10px] text-rose-500 hover:underline font-bold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {activeFilters.length === 0 ? (
                    <div className="text-center py-5 text-slate-400">
                      <p className="text-xs italic">No active search tags. Press Enter in the search bar above to generate filter chips.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                      {activeFilters.map((tag) => (
                        <span 
                          key={tag} 
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#F0EBFF] text-[#683EFF] rounded-md text-xs font-bold"
                        >
                          <span>{tag}</span>
                          <button 
                            onClick={() => removeFilter(tag)} 
                            className="p-0.5 hover:bg-white/50 rounded text-[#683EFF]"
                          >
                            <Icons.X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 leading-normal">
                    Filtering matches machine names, maker manufacturer, model versions, serial IDs, departments or locations.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Display tags Chips inline */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-white py-2 px-3 rounded-xl border border-slate-205">
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

      {/* 3. Main Data Container Content */}
      {filteredMachines.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-white border border-slate-200 shadow-sm min-h-[350px]">
          <div className="p-4 bg-slate-50 text-slate-450 rounded-full mb-4">
            <Icons.Inbox className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-800 font-sans">No Records Found</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
            We couldn't find any heavy machine assets matching: {activeFilters.join(", ") || "(none)"}. Reset filters to see all.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#683EFF] text-xs font-bold text-white rounded-lg hover:bg-[#5229E0] transition-colors"
            >
              Add machine Model
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* A. LIST VIEW / TABLE MODE */}
          {viewMode === "list" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 text-[10px] font-semibold uppercase tracking-widest select-none font-sans">
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={paginatedMachines.length > 0 && paginatedMachines.every((m) => selectedMachineIds.includes(m.id))}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                        />
                      </th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">MACHINE ID</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">MACHINE NAME</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">MANUFACTURER / MODEL</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">S.W.L</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">MAXIMUM HORIZONTAL OUTREACH</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 text-right font-sans">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedMachines.map((m, index) => {
                      const isSelected = selectedMachineIds.includes(m.id);
                      
                      const dispName = m.machineName || "Industrial Heavy Asset";
                      const dispModel = m.model || "N/A";
                      const dispMfg = m.manufacturer || "N/A";
                      const dispSWL = m.swl || "N/A";
                      const dispOutreach = m.maxOutreach || "N/A";

                      return (
                        <tr
                          key={`${m.id}-${index}`}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${isSelected ? "bg-[#F0EBFF]/20" : ""}`}
                          onClick={() => setSelectedMachineDetail(m)}
                        >
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(m.id)}
                              className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                            />
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-mono text-[#683EFF] font-bold">{m.id}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-bold text-slate-800">{dispName}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col text-sm font-medium text-slate-600">
                              <span>{dispMfg}</span>
                              <span className="text-[10px] text-slate-400 font-sans mt-0.5">Model: {dispModel}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-semibold text-slate-700">{dispSWL}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-semibold text-slate-700">{dispOutreach}</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMachineDetail(m);
                                }}
                                className="p-1.5 text-slate-400 hover:text-[#683EFF] hover:bg-[#F0EBFF] rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Icons.Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(m.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-right"
                                title="Remove Machine"
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

          {/* B. GRID VIEW MODE */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedMachines.map((m, index) => {
                const isSelected = selectedMachineIds.includes(m.id);
                const isLiked = !!favorites[m.id];
                
                const dispName = m.machineName || "Industrial Heavy Asset";
                const dispModel = m.model || "N/A";
                const dispMfg = m.manufacturer || "N/A";
                const dispLoc = m.currentLocation || "HQ Fleet";
                const dispHours = m.workingHours || 0;

                return (
                  <div
                    key={`${m.id}-${index}`}
                    onClick={() => setSelectedMachineDetail(m)}
                    className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between min-h-[220px] ${
                      isSelected ? "border-[#683EFF] ring-1 ring-[#683EFF]/35" : "border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          m.status === "Operational" ? "bg-emerald-50 text-emerald-800" : "bg-[#F0EBFF] text-[#683EFF]"
                        }`}>
                          {m.status}
                        </span>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleCheckboxChange(m.id)} className="p-1 text-slate-400 hover:text-[#683EFF]">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 text-[#683EFF] border-slate-300 rounded cursor-pointer"
                            />
                          </button>
                          <button onClick={(e) => toggleFavorite(m.id, e)} className="p-1">
                            <Icons.Heart
                              className={`w-4 h-4 transition-colors ${
                                isLiked ? "text-rose-500 fill-rose-500" : "text-slate-300 hover:text-slate-500"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-base font-extrabold text-slate-800 tracking-tight font-sans line-clamp-1 leading-snug">
                        {dispName}
                      </h4>
                      <p className="text-xs text-[#683EFF] font-bold font-mono">
                        Asset ID: {m.id}
                      </p>

                      <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                        <p className="truncate"><strong className="text-slate-500 font-bold">Manufacturer:</strong> {dispMfg}</p>
                        <p className="truncate"><strong className="text-slate-500 font-bold">Model Version:</strong> {dispModel}</p>
                        <p className="truncate"><strong className="text-slate-500 font-bold">Deploy Venue:</strong> {dispLoc}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[10px]">
                      <span className="text-slate-400 font-bold font-mono uppercase tracking-wider">
                        S/N: {m.serialNumber}
                      </span>
                      <span className="text-slate-500 font-bold">Hours Logged: {dispHours} hrs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* C. COMPACT VIEW MODE */}
          {viewMode === "compact" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
              {paginatedMachines.map((m, index) => {
                const isSelected = selectedMachineIds.includes(m.id);
                const isLiked = !!favorites[m.id];
                
                const dispName = m.machineName || "Industrial Heavy Asset";
                const dispLoc = m.currentLocation || "HQ Fleet";
                const dispHours = m.workingHours || 0;

                return (
                  <div
                    key={`${m.id}-${index}`}
                    onClick={() => setSelectedMachineDetail(m)}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer gap-2 ${
                      isSelected ? "bg-[#F0EBFF]/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(m.id)}
                          className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-800 text-sm">{dispName}</h5>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                            {m.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">
                          Location: {dispLoc} • Working Hours: {dispHours} hrs • S/N: {m.serialNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 self-stretch sm:self-auto justify-between sm:justify-start">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        m.status === "Operational" ? "bg-emerald-50 text-emerald-800" : "bg-[#F0EBFF] text-[#683EFF]"
                      }`}>
                        {m.status}
                      </span>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => toggleFavorite(m.id, e)}>
                          <Icons.Heart className={`w-4 h-4 ${isLiked ? "text-rose-500 fill-rose-500" : "text-slate-300"}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* D. PAGINATION BAR FOOTER BLOCK */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4.5 border border-slate-200 rounded-xl shadow-sm select-none relative">
            <div className="flex items-center gap-2" ref={pageSizeDropdownRef}>
              <span className="text-xs text-slate-500 font-semibold font-sans">
                Entries Per Page:
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                  className="flex items-center justify-between gap-3 px-3.5 py-1.5 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer min-w-[75px]"
                >
                  <span>{itemsPerPage}</span>
                  {showPageSizeDropdown ? (
                    <Icons.ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <Icons.ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>

                {showPageSizeDropdown && (
                  <div className="absolute left-0 bottom-full mb-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[100px] animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {[50, 100, 200].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleItemsPerPageChange(size)}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-xs text-slate-700 font-semibold transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>{size}</span>
                        {itemsPerPage === size && (
                          <Icons.Check className="w-3.5 h-3.5 text-[#683EFF]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3.5 font-sans">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                title="Go to previous page"
              >
                <Icons.ChevronLeft className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-center gap-1.5">
                {getPageNumbers(currentPage, totalPages).map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="h-8 w-8 flex items-center justify-center text-xs font-bold text-slate-400 select-none"
                      >
                        ...
                      </span>
                    );
                  }

                  const isCurrent = currentPage === p;
                  return (
                    <button
                      key={`page-${p}`}
                      onClick={() => setCurrentPage(p as number)}
                      className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                        isCurrent
                          ? "bg-slate-100 text-slate-800 font-extrabold shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                title="Go to next page"
              >
                <Icons.ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL ADD MACHINE POPUP WITH MULTI-TAB                                 */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header Area */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 select-none">
              <div>
                <h3 className="text-xl font-bold font-sans text-slate-800">Add Machine Model</h3>
                <p className="text-xs text-slate-400 mt-1">Please configure the technical specifications and operational site parameters for this machine model.</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormErrors({});
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-all"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form body with only the 13 specified fields */}
            <form onSubmit={handleCreateMachine} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Machine ID */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Machine ID</label>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 focus-within:ring-1 focus-within:ring-[#683EFF] focus-within:border-[#683EFF]">
                  <span className="bg-slate-100 px-3 py-2.5 text-xs text-slate-500 font-mono border-r border-slate-200 flex items-center select-none">
                    ML-
                  </span>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 bg-transparent border-0 focus:outline-none font-normal font-sans text-slate-800"
                    value={formValues.machineId}
                    onChange={(e) => setFormValues({ ...formValues, machineId: e.target.value })}
                  />
                </div>
              </div>

              {/* Machine Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Machine name *</label>
                <input
                  type="text"
                  className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans ${
                    formErrors.machineName ? "border-rose-300 focus:ring-rose-500" : "border-slate-200"
                  }`}
                  value={formValues.machineName}
                  onChange={(e) => {
                    setFormValues({ ...formValues, machineName: e.target.value });
                    if (formErrors.machineName) setFormErrors({ ...formErrors, machineName: "" });
                  }}
                />
                {formErrors.machineName && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1">{formErrors.machineName}</p>
                )}
              </div>

              {/* Grid of specifications */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">S.W.L</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.swl}
                    onChange={(e) => setFormValues({ ...formValues, swl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Maximum Horizontal Outreach</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.maxOutreach}
                    onChange={(e) => setFormValues({ ...formValues, maxOutreach: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Max Bucket Capacity</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.bucketCapacity}
                    onChange={(e) => setFormValues({ ...formValues, bucketCapacity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Manufacturer</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.manufacturer}
                    onChange={(e) => setFormValues({ ...formValues, manufacturer: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Engine Power</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.enginePower}
                    onChange={(e) => setFormValues({ ...formValues, enginePower: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Boom Length</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.boomLength}
                    onChange={(e) => setFormValues({ ...formValues, boomLength: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Wheel Type</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.wheelType}
                    onChange={(e) => setFormValues({ ...formValues, wheelType: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Max Platform Height</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.maxPlatformHeight}
                    onChange={(e) => setFormValues({ ...formValues, maxPlatformHeight: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Hoe Bucket Capacity</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.heoBucketCapacity}
                    onChange={(e) => setFormValues({ ...formValues, heoBucketCapacity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Engine Speed</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.engineSpeed}
                    onChange={(e) => setFormValues({ ...formValues, engineSpeed: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Angle of Span</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.angleOfSpan}
                    onChange={(e) => setFormValues({ ...formValues, angleOfSpan: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-sans">Person Allowed</label>
                  <input
                    type="text"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.personAllowed}
                    onChange={(e) => setFormValues({ ...formValues, personAllowed: e.target.value })}
                  />
                </div>
              </div>

            </form>

            {/* Footer Form Button Controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5 select-none shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-slate-300 text-xs font-semibold text-slate-550 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer font-sans"
              >
                Close Dialog
              </button>
              <button
                type="button"
                onClick={() => handleCreateMachine()}
                className="bg-[#683EFF] hover:bg-[#5229E0] text-white text-xs font-semibold py-2 px-5 rounded-lg shadow-sm transition-all cursor-pointer font-sans"
              >
                Add machine Model
              </button>
            </div>

          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                <Icons.AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-sans">Delete Machine Asset?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to permanently delete this heavy machine asset record? This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMachine(confirmDeleteId)}
                  className="flex-1 px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-all shadow-md shadow-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportMappingModal && csvMappingData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowImportMappingModal(false); setCsvMappingData(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-250">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 font-sans flex items-center gap-2">
                    <Icons.FileSpreadsheet className="w-5.5 h-5.5 text-[#683EFF]" />
                    Import machine models via CSV
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    WooCommerce-inspired multi-step CSV importer configuration. Map headers, preview, and confirm data records.
                  </p>
                </div>
                <button
                  onClick={() => { setShowImportMappingModal(false); setCsvMappingData(null); }}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Steps Progress Bar */}
            <div className="px-6 pt-5 pb-3 bg-slate-50 border-b border-slate-100 shrink-0 select-none">
              <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${importStep === "map" ? "bg-[#683EFF] text-white" : "bg-emerald-500 text-white"}`}>
                    {importStep === "map" ? "1" : "✓"}
                  </span>
                  <span className={`text-xs font-bold ${importStep === "map" ? "text-slate-800" : "text-slate-400"}`}>Map Fields</span>
                </div>
                <div className="w-12 h-0.5 bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${importStep === "confirm" ? "bg-[#683EFF] text-white" : importStep === "done" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {importStep === "done" ? "✓" : "2"}
                  </span>
                  <span className={`text-xs font-bold ${importStep === "confirm" ? "text-slate-800" : "text-slate-400"}`}>Confirm Preview</span>
                </div>
                <div className="w-12 h-0.5 bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${importStep === "done" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                    3
                  </span>
                  <span className={`text-xs font-bold ${importStep === "done" ? "text-slate-800" : "text-slate-400"}`}>Import Complete</span>
                </div>
              </div>
            </div>

            {/* Mappings / Confirmation Panel Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {importStep === "map" && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-550 w-1/2">
                            Column name
                          </th>
                          <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-550 w-1/2">
                            Map to field
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {csvMappingData.headers.map((header, idx) => {
                          const sampleVal = csvMappingData.sampleRow[idx] || "N/A";
                          const currentSelected = csvMappingData.mappings[header] || "";

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-4">
                                <div className="text-xs font-bold text-slate-800">{header}</div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-sm">
                                  Sample: <span className="text-slate-550 italic font-sans">{sampleVal}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <select
                                  value={currentSelected}
                                  onChange={(e) => {
                                    const newMappings = { ...csvMappingData.mappings, [header]: e.target.value };
                                    setCsvMappingData({ ...csvMappingData, mappings: newMappings });
                                  }}
                                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] focus:border-[#683EFF] font-semibold text-slate-700 hover:border-slate-300 transition-all cursor-pointer"
                                >
                                  <option value="" className="text-slate-400">Do not import (Ignore)</option>
                                  <option value="id">Machine ID</option>
                                  <option value="machineName">Machine Name</option>
                                  <option value="model">Model</option>
                                  <option value="manufacturer">Manufacturer</option>
                                  <option value="yearOfManufacture">Year of Manufacture</option>
                                  <option value="serialNumber">Serial Number</option>
                                  <option value="currentLocation">Current Location</option>
                                  <option value="status">Status</option>
                                  <option value="workingHours">Working Hours</option>
                                  <option value="department">Department</option>
                                  <option value="lastServiceDate">Last Service Date</option>
                                  <option value="swl">S.W.L</option>
                                  <option value="maxOutreach">Maximum Horizontal Outreach</option>
                                  <option value="bucketCapacity">Max Bucket Capacity</option>
                                  <option value="enginePower">Engine Power</option>
                                  <option value="boomLength">Boom Length</option>
                                  <option value="wheelType">Wheel Type</option>
                                  <option value="maxPlatformHeight">Max Platform Height</option>
                                  <option value="heoBucketCapacity">Hoe Bucket Capacity</option>
                                  <option value="engineSpeed">Engine Speed</option>
                                  <option value="angleOfSpan">Angle of Span</option>
                                  <option value="personAllowed">Person Allowed</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Informative Stats */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icons.Info className="w-4 h-4 text-[#683EFF]" />
                      <span className="text-[11px] text-slate-500 font-medium">
                        Found <strong className="text-slate-700">{csvMappingData.allRows.length}</strong> total data rows in the CSV file.
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Smart mapped: {Object.values(csvMappingData.mappings).filter(Boolean).length} / {csvMappingData.headers.length} fields
                    </span>
                  </div>
                </div>
              )}

              {importStep === "confirm" && (
                <div className="space-y-5">
                  <div className="p-5 bg-[#683EFF]/5 border border-[#683EFF]/20 rounded-2xl flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#683EFF]/10 flex items-center justify-center shrink-0">
                      <Icons.Database className="w-6 h-6 text-[#683EFF]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">You are ready to run the import engine</h4>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        We mapped <strong className="text-slate-700">{Object.values(csvMappingData.mappings).filter(Boolean).length}</strong> CSV headers and processed <strong className="text-slate-700">{importedPreviewList.length}</strong> machine model rows. These will be appended safely to your MEV Asset Registry.
                      </p>
                    </div>
                  </div>

                  {/* Preview Cards Grid */}
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Import Preview (First 3 Items)</span>
                      <span className="text-[10px] font-semibold text-[#683EFF] bg-[#683EFF]/5 px-2 py-0.5 rounded-full">WooCommerce Verified</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {importedPreviewList.slice(0, 3).map((item, index) => (
                        <div key={index} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{item.machineName}</span>
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.id}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                              <span>Model: <strong className="text-slate-600 font-medium">{item.model}</strong></span>
                              <span>Manufacturer: <strong className="text-slate-600 font-medium">{item.manufacturer}</strong></span>
                              <span>Year: <strong className="text-slate-600 font-medium">{item.yearOfManufacture}</strong></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-[10px]">
                              {item.status}
                            </span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {item.workingHours} Hours
                            </span>
                          </div>
                        </div>
                      ))}
                      {importedPreviewList.length > 3 && (
                        <div className="text-center text-[11px] text-slate-400 italic py-1 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                          ... and {importedPreviewList.length - 3} more machine records
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning Notice */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-xs">
                    <Icons.AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-800 font-bold block">Please Note:</strong>
                      <span className="text-amber-700 leading-relaxed mt-0.5 block">
                        Imported values cannot be automatically rolled back. Ensure serial numbers and technical values are populated correctly.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {importStep === "done" && (
                <div className="py-12 flex flex-col items-center text-center max-w-md mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-100">
                    <Icons.CheckCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">WooCommerce product import completed!</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      All systems green. Successfully registered <strong className="text-[#683EFF] font-bold">{importedPreviewList.length} new heavy machine assets</strong> into the MEV Inspections fleet workspace.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl w-full text-xs text-slate-550 font-medium flex justify-around">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-extrabold text-slate-700">{importedPreviewList.length}</span>
                      <span>Records Created</span>
                    </div>
                    <div className="w-px bg-slate-200 self-stretch" />
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-extrabold text-slate-700">0</span>
                      <span>Failed / Skipped</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              {importStep === "map" && (
                <>
                  <button
                    type="button"
                    onClick={() => { setShowImportMappingModal(false); setCsvMappingData(null); }}
                    className="px-4 py-2 border border-slate-300 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGoToConfirmation}
                    className="bg-[#683EFF] hover:bg-[#5229E0] text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer font-sans flex items-center gap-1.5"
                  >
                    <span>Continue to Confirmation</span>
                    <Icons.ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {importStep === "confirm" && (
                <>
                  <button
                    type="button"
                    onClick={() => setImportStep("map")}
                    className="px-4 py-2 border border-slate-300 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer font-sans flex items-center gap-1.5"
                  >
                    <Icons.ArrowLeft className="w-4 h-4" />
                    <span>Back to Mapping</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer font-sans flex items-center gap-1.5"
                  >
                    <Icons.Check className="w-4 h-4" />
                    <span>Run the Importer</span>
                  </button>
                </>
              )}

              {importStep === "done" && (
                <button
                  type="button"
                  onClick={() => { setShowImportMappingModal(false); setCsvMappingData(null); }}
                  className="bg-[#683EFF] hover:bg-[#5229E0] text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all cursor-pointer font-sans"
                >
                  View Mapped Assets
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
