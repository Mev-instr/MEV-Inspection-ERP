/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { InspectionJob, CustomerDetail, EmployeeDetail } from "../types";
import { initialCustomers as staticCustomers } from "../data";
import { formatDate } from "../utils";

import { InspectionReport } from "../types";

interface InspectionJobsPortfolioProps {
  reports: InspectionReport[];
  onReportsChange: React.Dispatch<React.SetStateAction<InspectionReport[]>>;
  jobs: InspectionJob[];
  onJobsChange: React.Dispatch<React.SetStateAction<InspectionJob[]>>;
  customers?: CustomerDetail[];
  employees?: EmployeeDetail[];
}

export function InspectionJobsPortfolioView({ jobs, onJobsChange, reports, onReportsChange, customers = staticCustomers }: InspectionJobsPortfolioProps) {
  // View states
  const [viewMode, setViewMode] = useState<"list" | "grid" | "compact">("list");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  
  // Search and Enter-key Tag filters
  const [filterInput, setFilterInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Row selection & interaction states
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedJobDetail, setSelectedJobDetail] = useState<InspectionJob | null>(null);

  // Pagination configuration
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add Inspection Job modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<"basic" | "client" | "attention" | "machine">("basic");

  // Autocomplete client dropdown states
  const [showClientAutocomplete, setShowClientAutocomplete] = useState(false);
  const [showDetailClientAutocomplete, setShowDetailClientAutocomplete] = useState(false);

  // New Inspection Job Form State
  const initialFormState = {
    namingSeries: "JO-INS-26", // Pre-filled prefix, editable
    inspectorId: "",
    inspectionStartDate: new Date().toISOString().split("T")[0],
    inspectionEndDate: new Date().toISOString().split("T")[0],
    clientName: "",
    location: "",
    attentionLocation: "",
    attentionPhone: "",
    machineName: "",
    machineCount: "1",
    status: "Scheduled" as const,
  };

  const [formValues, setFormValues] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Timeline / comments state in Detail Sidebar Page
  const [comments, setComments] = useState<Array<{ id: string; author: string; text: string; time: string }>>([
    {
      id: "comment-1",
      author: "ZM",
      text: "Equipment load calculations verified for Dhahran rigs.",
      time: "Recorded Note"
    },
    {
      id: "comment-2",
      author: "MK",
      text: "Client attention phone confirmed compliant and active.",
      time: "Recorded Note"
    }
  ]);
  const [newComment, setNewComment] = useState("");

  // Detail Page active sub tab
  const [activeDetailTab, setActiveDetailTab] = useState<"DETAILS">("DETAILS");

  // Edit in Page status inside Detail layout
  const [isEditingInDetail, setIsEditingInDetail] = useState(false);
  const [editFormValues, setEditFormValues] = useState<InspectionJob | null>(null);
  const [showBulkActionDropdown, setShowBulkActionDropdown] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [operatorRows, setOperatorRows] = useState<{ id: number; card: string; name: string }[]>([]);

  const addOperatorRow = () => {
    setOperatorRows([...operatorRows, { id: Date.now(), card: "", name: "" }]);
  };

  const removeOperatorRow = (id: number) => {
    setOperatorRows(operatorRows.filter(row => row.id !== id));
  };

  const updateOperatorRow = (id: number, field: 'card' | 'name', value: string) => {
    setOperatorRows(operatorRows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleBulkDuplicate = () => {
    const toDuplicate = jobs.filter(j => selectedJobIds.includes(j.id));
    const duplicated = toDuplicate.map(j => ({
      ...j,
      id: `JO-TR-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      assetType: formValues.machineName ? `Simulator: ${formValues.machineName} Inspection` : "General Heavy Machine Inspection",
      inspector: formValues.inspectorId || "Nour Al-Faisal",
      urgency: "Medium",
      scheduledDate: formValues.inspectionEndDate,
    }));
    onJobsChange((prev) => [...duplicated, ...prev]);
    showToast(`✓ Duplicated ${selectedJobIds.length} job orders`);
    setSelectedJobIds([]);
    setShowBulkActionDropdown(false);
  };

  const handleBulkExport = () => {
    const count = selectedJobIds.length;
    showToast(`✓ Exporting ${count} inspection jobs to CSV...`);
    
    const headers = [
      "Naming Series Code prefix", "Inspector ID", "Inspection Date", "Expiration Date",
      "Initial Status", "Client Name", "Equipment Location", "Attention",
      "Phone Number", "Machine Name", "Number of Count"
    ].join(",");

    const rows = jobs
      .filter(j => selectedJobIds.includes(j.id))
      .map(j => [
        j.namingSeries, j.inspectorId, j.inspectionStartDate, j.inspectionEndDate,
        j.status, j.clientName, j.location, j.attentionLocation,
        j.attentionPhone, j.machineName, j.machineCount
      ].map(field => `"${String(field || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inspection_jobs_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSelectedJobIds([]);
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
        const importedJobs: any[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 0 || !row[0]) continue;

          const getVal = (headerName: string) => {
            const idx = csvHeaders.indexOf(headerName.toLowerCase());
            return idx !== -1 && idx < row.length ? row[idx] : "";
          };

          const namingSeries = getVal("Naming Series Code prefix") || "JO-IN-26";
          const clientName = getVal("Client Name");
          if (!clientName) continue;

          const finalId = calculateNextSequenceId(namingSeries);

          const inspectorId = getVal("Inspector ID");
          const inspectionStartDate = getVal("Inspection Date") || new Date().toISOString().split("T")[0];
          const inspectionEndDate = getVal("Expiration Date") || new Date().toISOString().split("T")[0];
          const status = getVal("Initial Status") || "Scheduled";
          const location = getVal("Equipment Location") || "Main Site";
          const attentionLocation = getVal("Attention");
          const attentionPhone = getVal("Phone Number");
          const machineName = getVal("Machine Name") || "Crane Safe Simulator";
          const machineCount = getVal("Number of Count") || "1";

          const job = {
            id: finalId,
            assetType: machineName ? `Simulator: ${machineName} Inspection` : "General Heavy Machine Inspection",
            inspector: inspectorId || "Nour Al-Faisal",
            urgency: "Medium",
            scheduledDate: inspectionEndDate,
            status: status,
            location: location,
            namingSeries: namingSeries,
            inspectorId: inspectorId,
            inspectionStartDate: inspectionStartDate,
            inspectionEndDate: inspectionEndDate,
            clientName: clientName,
            attentionLocation: attentionLocation,
            attentionPhone: attentionPhone,
            machineName: machineName,
            machineCount: machineCount,
            operators: []
          };

          importedJobs.push(job);
        }

        if (importedJobs.length > 0) {
          onJobsChange((prev) => [...importedJobs, ...prev]);
          showToast(`✓ Successfully imported ${importedJobs.length} inspection jobs.`);
        } else {
          showToast("⚠ No valid inspection job entries found in the CSV.");
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
    const count = selectedJobIds.length;
    // Removing window.confirm for direct execution as it might be blocked in the iframe
    onJobsChange((prev) => prev.filter(j => !selectedJobIds.includes(j.id)));
    showToast(`✓ Successfully removed ${count} job records`);
    setSelectedJobIds([]);
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
    setSelectedJobIds([]);
    showToast("✓ Search query and filter tags reset.");
  };

  // Filtering criteria matches
  const filteredJobs = jobs.filter((job) => {
    if (activeFilters.length === 0) return true;
    return activeFilters.every((kw) => {
      const criteria = kw.toLowerCase();
      return (
        job.id.toLowerCase().includes(criteria) ||
        (job.clientName || "").toLowerCase().includes(criteria) ||
        (job.location || "").toLowerCase().includes(criteria) ||
        (job.attentionLocation || "").toLowerCase().includes(criteria) ||
        (job.inspectorId || job.inspector || "").toLowerCase().includes(criteria) ||
        (job.machineName || "").toLowerCase().includes(criteria) ||
        job.status.toLowerCase().includes(criteria)
      );
    });
  });

  // Pagination slices
  const totalItems = filteredJobs.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Toggle checkout checkboxes
  const handleCheckboxChange = (id: string) => {
    if (selectedJobIds.includes(id)) {
      setSelectedJobIds(selectedJobIds.filter((x) => x !== id));
    } else {
      setSelectedJobIds([...selectedJobIds, id]);
    }
  };

  // Select all rows on current page
  const handleSelectAll = () => {
    const pageIds = paginatedJobs.map((j) => j.id);
    const allSelected = pageIds.every((id) => selectedJobIds.includes(id));
    if (allSelected) {
      setSelectedJobIds(selectedJobIds.filter((id) => !pageIds.includes(id)));
    } else {
      const newIds = [...selectedJobIds];
      pageIds.forEach((id) => {
        if (!newIds.includes(id)) newIds.push(id);
      });
      setSelectedJobIds(newIds);
    }
  };

  // Autocomplete search suggestions
  const matchingCustomers = customers.filter((cust) => {
    if (!formValues.clientName.trim()) return true;
    return cust.companyName?.toLowerCase().includes(formValues.clientName.toLowerCase());
  }).slice(0, formValues.clientName.trim() ? undefined : 5);

  // Auto-fill form values on selecting customer
  const handleSelectCustomer = (cust: CustomerDetail) => {
    setFormValues((prev) => ({
      ...prev,
      clientName: cust.companyName || "",
      location: cust.inspectionSiteAddress || "",
      attentionLocation: cust.inspectionContactPerson || "",
      attentionPhone: cust.inspectionContactPhone || ""
    }));
    setShowClientAutocomplete(false);
    showToast(`✓ Client details loaded from "${cust.companyName}". autofilled locations & contacts.`);
  };

  const handleSelectDetailCustomer = (cust: CustomerDetail) => {
    if (editFormValues) {
      setEditFormValues({
        ...editFormValues,
        clientName: cust.companyName || "",
        location: cust.inspectionSiteAddress || "",
        attentionLocation: cust.inspectionContactPerson || "",
        attentionPhone: cust.inspectionContactPhone || ""
      });
    }
    setShowDetailClientAutocomplete(false);
    showToast(`✓ Client details loaded from "${cust.companyName}". autofilled locations & contacts.`);
  };

  // Helper calculation to auto-generate the next JO-INS-26-XXXX sequence
  const calculateNextSequenceId = (seriesInput: string): string => {
    const cleanSeries = seriesInput.trim() || "JO-INS-26";
    
    // If the input matches a manually entered ID other than the default prefix, return it directly.
    if (cleanSeries !== "JO-INS-26") {
      return cleanSeries;
    }

    // Otherwise, find the maximum suffix number in current jobs starting with JO-INS-26
    let maxSuffix = 1100; // Starting baseline suffix count
    const matchingJobs = jobs.filter((j) => j.id.startsWith("JO-INS-26-"));
    matchingJobs.forEach((job) => {
      const parts = job.id.split("-");
      const suffixCode = parts[parts.length - 1];
      const numericVal = parseInt(suffixCode, 10);
      if (!isNaN(numericVal) && numericVal > maxSuffix) {
        maxSuffix = numericVal;
      }
    });

    return `JO-INS-26-${maxSuffix + 1}`;
  };

  // Handle Form Submission / Job Creation
  const handleCreateJob = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formValues.clientName.trim()) {
      errors.clientName = "Client Name is required";
    }
    if (!formValues.location.trim()) {
      errors.location = "Job Equipment Location is required";
    }
    if (!formValues.inspectorId.trim()) {
      errors.inspectorId = "Inspector ID is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Route to correct tab containing the error
      if (errors.inspectorId) setActiveFormTab("basic");
      else if (errors.clientName || errors.location) setActiveFormTab("client");
      return;
    }

    // Generate compliant ID with our Naming series processor
    const finalId = calculateNextSequenceId(formValues.namingSeries);

    const newJob: InspectionJob = {
      id: finalId,
      assetType: formValues.machineName ? `Simulator: ${formValues.machineName} Inspection` : "General Heavy Machine Inspection",
      inspector: formValues.inspectorId || "Nour Al-Faisal",
      urgency: "Medium",
      scheduledDate: formValues.inspectionEndDate,
      status: formValues.status,
      location: formValues.location,

      // High-fidelity fields
      inspectorId: formValues.inspectorId,
      inspectionStartDate: formValues.inspectionStartDate,
      inspectionEndDate: formValues.inspectionEndDate,
      clientName: formValues.clientName,
      attentionLocation: formValues.attentionLocation,
      attentionPhone: formValues.attentionPhone,
      machineName: formValues.machineName || "Crane Safe Simulator",
      machineCount: formValues.machineCount || "1",
      operators: [...operatorRows],
    };

    onJobsChange((prev) => [newJob, ...prev]);
    setShowAddModal(false);
    setFormValues(initialFormState);
    setFormErrors({});
    setActiveFormTab("basic");
    showToast(`✓ Inspection job order ${newJob.id} generated successfully.`);
  };

  // Save changes done in page detail view
  const handleSaveDetailChanges = () => {
    if (!editFormValues) return;
    
    const finalJob = { ...editFormValues, operators: [...operatorRows] };
    // Propagate changes to outer state hook
    onJobsChange((prev) =>
      prev.map((j) => (j.id === finalJob.id ? finalJob : j))
    );
    setSelectedJobDetail(finalJob);
    setIsEditingInDetail(false);
    showToast("✓ Training details updated successfully.");
  };

  // Quick navigation buttons in detail page
  const currentDetailIndex = jobs.findIndex((j) => j.id === selectedJobDetail?.id);
  
  const handlePrevDetail = () => {
    if (currentDetailIndex > 0) {
      setSelectedJobDetail(jobs[currentDetailIndex - 1]);
      setIsEditingInDetail(false);
    } else {
      showToast("First inspection job reached.");
    }
  };

  const handleNextDetail = () => {
    if (currentDetailIndex < jobs.length - 1) {
      setSelectedJobDetail(jobs[currentDetailIndex + 1]);
      setIsEditingInDetail(false);
    } else {
      showToast("Last inspection job reached.");
    }
  };

  // Delete inspection job
  const handleDeleteJob = (id: string) => {
    onJobsChange((prev) => prev.filter((j) => j.id !== id));
    setSelectedJobIds(selectedJobIds.filter((x) => x !== id));
    if (selectedJobDetail?.id === id) {
      setSelectedJobDetail(null);
    }
    showToast("✓ Inspection job order removed from workspace.");
    setConfirmDeleteId(null);
  };

  // Export JSON summary of job
  const handleExportJobJson = (job: InspectionJob) => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(job, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `inspection_job_${job.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("✓ Downloaded inspection job JSON.");
    } catch {
      showToast("Error exporting JSON.");
    }
  };

  // Trigger print document simulator
  const handlePrintJob = (job: InspectionJob) => {
    showToast(`✓ Dispatched printable ticket docket for Inspection Job ID ${job.id}`);
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
    showToast("✓ Added notes to this job's active audit trail.");
  };

  // Initializing edit form state
  useEffect(() => {
    if (selectedJobDetail) {
      setEditFormValues({ ...selectedJobDetail });
      setOperatorRows(selectedJobDetail.operators || []);
    } else {
      setOperatorRows([]);
    }
  }, [selectedJobDetail]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ==========================================
  // RENDER DETAILED PAGE ROUTE IF SELECTED
  // ==========================================
  if (selectedJobDetail) {
    const job = selectedJobDetail;
    const isLiked = !!favorites[job.id];
    
    // We synchronize values if they exists on job. Otherwise map back from assetType/inspectorId to prevent blank states
    const dispClient = job.clientName || "General Partner Client";
    const dispEndDate = job.inspectionEndDate || job.scheduledDate || "N/A";
    const dispStartDate = job.inspectionStartDate || "N/A";
    const dispTrainer = job.inspectorId || job.inspector || "Zaid Mansoor";
    const dispLoc = job.location || "Logistics Yard Site";
    
    const dispAttLoc = job.attentionLocation || "Eastern Province";
    const dispAttPhone = job.attentionPhone || "+966 50 000 0000";
    const dispMachine = job.machineName || "Industrial Crane Simulator";
    const dispMachineCount = job.machineCount || "1";

    return (
      <div className="space-y-6" id="inspection-detail-route">
        
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
              onClick={() => setSelectedJobDetail(null)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#683EFF] hover:border-[#683EFF] transition-all shadow-sm group animate-in fade-in"
              title="Go Back"
            >
              <Icons.ArrowLeft className="w-4.5 h-4.5 group-active:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400 font-medium font-sans">
                <button onClick={() => setSelectedJobDetail(null)} className="hover:text-[#683EFF] font-semibold transition-colors">
                  Inspection Jobs
                </button>
                <Icons.ChevronRight className="w-3 h-3 text-slate-350" />
                <span className="font-bold text-slate-700 truncate max-w-[200px]">{job.id}</span>
              </div>
            </div>
          </div>

          {/* Action Row Sidebar side buttons */}
          <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
            
            {/* Action buttons (Print, Export, Delete) */}
            <button
              onClick={() => handlePrintJob(job)}
              title="Print Order Ticket"
              className="p-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition-colors"
            >
              <Icons.Printer className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleExportJobJson(job)}
              title="Download Job Summary"
              className="p-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition-colors"
            >
              <Icons.Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setConfirmDeleteId(job.id)}
              title="Permamently Delete"
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
                title="Previous inspection job"
              >
                <Icons.ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDetail}
                disabled={currentDetailIndex >= jobs.length - 1}
                className="p-2 hover:bg-slate-50 text-slate-500 disabled:opacity-35 transition-colors"
                title="Next inspection job"
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

        {/* 2. Main Double-column layout identical to CustomerDetailPage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Detail sidebar Left Column */}
          <div id="Detail sidebar" className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center shadow-sm text-center">
            
            {/* Avatar block with JO/Id */}
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-[#683EFF]/15 to-[#683EFF]/5 text-[#683EFF] text-3xl font-black flex items-center justify-center shadow-sm relative shrink-0 font-mono">
              {job.id.substring(0, 2).toUpperCase()}
            </div>

            {/* Client Naming details */}
            <h3 className="font-display font-bold text-slate-800 text-lg mt-4 leading-snug">
              {dispClient}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">Order: {job.id}</p>

            {/* Status interactive selector */}
            <div className="mt-3">
              <select
                value={isEditingInDetail && editFormValues ? editFormValues.status : job.status}
                onChange={(e) => {
                  const val = e.target.value as any;
                  if (isEditingInDetail && editFormValues) {
                    setEditFormValues({ ...editFormValues, status: val });
                  } else {
                    onJobsChange((prev) =>
                      prev.map((item) => (item.id === job.id ? { ...item, status: val } : item))
                    );
                    setSelectedJobDetail((prev) => (prev ? { ...prev, status: val } : null));
                    showToast(`✓ Operational status changed to: ${val}`);
                  }
                }}
                className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer focus:outline-none border transition-colors ${
                  (isEditingInDetail && editFormValues ? editFormValues.status : job.status) === "Completed"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    : (isEditingInDetail && editFormValues ? editFormValues.status : job.status) === "In Progress"
                    ? "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                    : (isEditingInDetail && editFormValues ? editFormValues.status : job.status) === "Cancelled"
                    ? "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                    : "bg-[#F0EBFF] text-[#683EFF] border-[#683EFF]/20 hover:bg-[#E2D9FF]"
                }`}
              >
                <option value="Scheduled">🗓 Scheduled</option>
                <option value="In Progress">⚡ In Progress</option>
                <option value="Completed">✅ Completed</option>
                <option value="Cancelled">❌ Cancelled</option>
              </select>
            </div>

            {/* Static & Dynamic details rows */}
            <div className="w-full mt-6 pt-5 border-t border-slate-100 space-y-3.5 text-left text-xs text-slate-600 font-medium">
              
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <Icons.Key className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 font-medium font-sans">Job Order ID</span>
                    </div>
                    <span className="font-normal font-sans text-slate-800">{job.id}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <Icons.User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 font-medium font-sans">Inspector ID</span>
                    </div>
                    <span className="font-normal font-sans text-slate-800">{dispTrainer}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <Icons.Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 font-medium font-sans">Start Date</span>
                    </div>
                    <span className="font-normal font-sans text-slate-705">{dispStartDate}</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Icons.CalendarCheck className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 font-medium font-sans">End Date</span>
                    </div>
                    <span className="font-normal font-sans text-slate-705">{dispEndDate}</span>
                  </div>

            </div>

            {/* Bookmarks heart trigger button */}
            <div className="w-full mt-5">
              <button
                type="button"
                onClick={(e) => toggleFavorite(job.id, e)}
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
                <span>Series verified in Gulf Logistics</span>
              </p>
              <p className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>Last updated moments ago</span>
              </p>
            </div>
          </div>

          {/* Right side interactive tabbed sheet content */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Tab navigation bar */}
            <div className="border-b border-[#ECECF3] flex gap-6 select-none shrink-0" id="inspection-detail-tabbed-navigation">
              <button
                onClick={() => setActiveDetailTab("DETAILS")}
                className={`pb-3 font-display font-bold text-xs uppercase tracking-wider relative transition-all ${
                  activeDetailTab === "DETAILS" ? "text-[#683EFF]" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <span>Details Tab 1</span>
                {activeDetailTab === "DETAILS" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#683EFF]" />
                )}
              </button>
            </div>

            {/* Tabbed Sheet body - DETAILS tab */}
            {activeDetailTab === "DETAILS" && (
              <div className="space-y-6">
                
                {/* 2.1 Basic information card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 select-none text-slate-700">
                    <Icons.FileText className="w-4 h-4 text-[#683EFF]" />
                    <span>Basic Information</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Naming Series ID *
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.id : job.id}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, id: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-mono font-bold text-slate-700 disabled:opacity-85"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Inspector ID *
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.inspectorId || "" : dispTrainer}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, inspectorId: e.target.value, inspector: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                        placeholder="INSP-ZAID-09"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Inspection Date
                      </label>
                      <input
                        type="date"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.inspectionStartDate || "" : dispStartDate}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, inspectionStartDate: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-mono text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Expiration Date
                      </label>
                      <input
                        type="date"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.inspectionEndDate || "" : dispEndDate}
                        onChange={(e) => {
                          if (editFormValues) {
                            setEditFormValues({ ...editFormValues, inspectionEndDate: e.target.value, scheduledDate: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-mono text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 2.2 Client details card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 select-none text-slate-700">
                    <Icons.Building className="w-4 h-4 text-[#683EFF]" />
                    <span>Client Details</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Client Name
                      </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.clientName || "" : dispClient}
                        onFocus={() => isEditingInDetail && setShowDetailClientAutocomplete(true)}
                        onChange={(e) => {
                          if (editFormValues) {
                            setEditFormValues({ ...editFormValues, clientName: e.target.value });
                            setShowDetailClientAutocomplete(true);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                        placeholder="Saudi Aramco"
                      />
                      {isEditingInDetail && (
                        <Icons.ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      )}
                      
                      {isEditingInDetail && showDetailClientAutocomplete && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowDetailClientAutocomplete(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                            {customers.filter(c => 
                              !editFormValues?.clientName || 
                              c.companyName?.toLowerCase().includes(editFormValues.clientName.toLowerCase())
                            ).length === 0 ? (
                              <div className="px-4 py-3 text-xs italic text-slate-400">
                                No matching clients found
                              </div>
                            ) : (
                              customers
                                .filter(c => 
                                  !editFormValues?.clientName || 
                                  c.companyName?.toLowerCase().includes(editFormValues.clientName.toLowerCase())
                                )
                                .slice(0, editFormValues?.clientName ? undefined : 5)
                                .map((cust) => (
                                <button
                                  key={cust.id}
                                  type="button"
                                  onClick={() => handleSelectDetailCustomer(cust)}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] flex justify-between items-center transition-colors text-left"
                                >
                                  <span>{cust.companyName}</span>
                                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{cust.country || "KSA"}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Location / Site Address
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.location || "" : dispLoc}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, location: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                        placeholder="Saudi Aramco Training Complex"
                      />
                    </div>
                  </div>
                </div>

                {/* 2.3 Attention details card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 select-none text-slate-700">
                    <Icons.Contact className="w-4 h-4 text-[#683EFF]" />
                    <span>Attention Details</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Attention
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.attentionLocation || "" : dispAttLoc}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, attentionLocation: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                        placeholder="e.g. Dhahran / Jeddah"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.attentionPhone || "" : dispAttPhone}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, attentionPhone: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                        placeholder="+966..."
                      />
                    </div>
                  </div>
                </div>

                {/* 2.4 Machine details card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 select-none text-slate-700">
                    <Icons.Cpu className="w-4 h-4 text-[#683EFF]" />
                    <span>Machine Details</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Machine Name
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.machineName || "" : dispMachine}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, machineName: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                        placeholder="Tadano 160T Crane Simulator"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Number of Count
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.machineCount || "" : dispMachineCount}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, machineCount: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                        placeholder="2"
                      />
                    </div>
                  </div>
                </div>

                {/* Operator Machine Details (Moved to main area) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 select-none text-slate-700">
                    <Icons.Users className="w-4 h-4 text-[#683EFF]" />
                    <span>Operator Machine Details</span>
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider font-sans">
                          <th className="p-3 w-10 text-center border-r border-slate-200">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 pointer-events-none" disabled />
                          </th>
                          <th className="p-3 w-12 text-center border-r border-slate-200">No.</th>
                          <th className="p-3 border-r border-slate-200">Operator Card</th>
                          <th className="p-3">Operator</th>
                          <th className="p-3 w-10 text-center">
                            <Icons.Settings className="w-3.5 h-3.5 mx-auto opacity-40" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {operatorRows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-10 text-center bg-white">
                              <div className="flex flex-col items-center gap-2 text-slate-400">
                                <Icons.ClipboardList className="w-10 h-10 opacity-10" />
                                <span className="text-xs font-semibold font-sans uppercase tracking-[0.2em]">No Data</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          operatorRows.map((row, idx) => (
                            <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                              <td className="p-2.5 text-center border-r border-slate-100">
                                <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300" />
                              </td>
                              <td className="p-2.5 text-center border-r border-slate-100 text-[11px] font-medium text-slate-500 font-sans">
                                {idx + 1}
                              </td>
                              <td className="p-2 border-r border-slate-100">
                                <input 
                                  type="text" 
                                  disabled={!isEditingInDetail}
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#683EFF] outline-none font-sans disabled:opacity-75"
                                  placeholder="e.g. CARD-2024-01"
                                  value={row.card}
                                  onChange={(e) => updateOperatorRow(row.id, 'card', e.target.value)}
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="text" 
                                  disabled={!isEditingInDetail}
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#683EFF] outline-none font-sans disabled:opacity-75"
                                  placeholder="Operator Full Name"
                                  value={row.name}
                                  onChange={(e) => updateOperatorRow(row.id, 'name', e.target.value)}
                                />
                              </td>
                              <td className="p-2 text-center">
                                {isEditingInDetail && (
                                  <button 
                                    type="button"
                                    onClick={() => removeOperatorRow(row.id)}
                                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                  >
                                    <Icons.X className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {isEditingInDetail && (
                    <button 
                      onClick={addOperatorRow}
                      className="bg-slate-50 hover:bg-slate-100 text-[#683EFF] text-[11px] font-semibold py-2 px-4 rounded-lg border border-dashed border-[#683EFF]/30 font-sans transition-colors flex items-center gap-2"
                    >
                      <Icons.Plus className="w-3.5 h-3.5" />
                      <span>Add Row</span>
                    </button>
                  )}
                </div>

                {/* 2. Timeline and comments double column layout */}
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
                          <p className="text-xs font-bold text-slate-800">Trainer assignment modified</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">10 minutes ago by MK</p>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-slate-100 text-slate-500 border border-white shadow-sm flex items-center justify-center">
                          <Icons.RefreshCw className="w-2.5 h-2.5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Inspection job verification logs updated</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">22 minutes ago</p>
                        </div>
                      </div>

                      {/* Item 3 */}
                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#F0EBFF] text-[#683EFF] border border-white shadow-sm flex items-center justify-center">
                          <Icons.Paperclip className="w-2.5 h-2.5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Certification document attached</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">1 hour ago</p>
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
                <h3 className="text-lg font-bold text-slate-800 font-sans">Delete Inspection Job?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Are you sure you want to permanently delete this inspection job record? This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6 w-full">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteJob(confirmDeleteId)}
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
    <div className="space-y-6" id="inspection-portfolio-view-container">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0E1B2D] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-755 animate-slide-in">
          <Icons.Info className="w-4 h-4 text-[#683EFF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header with custom tags metadata and Add Inspection Job Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-[#683EFF] font-bold tracking-wider uppercase">
            <span>Operations Management</span>
            <span className="text-slate-300">/</span>
            <span className="bg-[#F0EBFF] px-2 py-0.5 rounded text-[10px]">Inspection list page</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-800 tracking-tight">
            Inspection Jobs Portfolio
          </h2>
        </div>

        {/* Header Action controls */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto relative">
          
          {/* Bulk Actions Bar Integrated directly into the row, appeared on the left of dropdown */}
          {selectedJobIds.length > 0 && (
            <div className="bg-[#FFF5F5] border border-rose-100 rounded-xl p-1 px-3 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-[11px] font-black uppercase tracking-[0.1em] text-rose-600 whitespace-nowrap">
                SELECTED: {selectedJobIds.length}
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
            onClick={() => document.getElementById("csv-import-inspection-input")?.click()}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:border-[#683EFF] hover:text-[#683EFF] rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            title="Import Inspection Jobs from CSV"
          >
            <Icons.Upload className="w-4 h-4 text-slate-400 hover:text-[#683EFF]" />
            <span>Import</span>
          </button>
          <input
            id="csv-import-inspection-input"
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

          {/* Add Inspection Job master trigger */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#683EFF] hover:bg-[#5229E0] text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 text-sm shadow-sm transition-all"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Add Inspection Job</span>
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
              placeholder="Press Enter to add filter keywords (e.g. Aramco, Scheduled, Zaid)..."
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
                    Filtering logic matches target training end dates, ID suffix, simulator machine names or trainer registrations.
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
      {filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-white border border-slate-200 shadow-sm min-h-[350px]">
          <div className="p-4 bg-slate-50 text-slate-450 text-slate-440 rounded-full mb-4">
            <Icons.Inbox className="w-10 h-10 text-slate-405 text-slate-400" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-800 font-sans">No Records Found</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
            We couldn't find any inspection jobs matching: {activeFilters.join(", ") || "(none)"}. Reset filters to see all.
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
              Add Inspection Job
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
                          checked={paginatedJobs.length > 0 && paginatedJobs.every((j) => selectedJobIds.includes(j.id))}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                        />
                      </th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">ID</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">INSPECTION DATE</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">EXPIRY DATE</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">CLIENT NAME</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">LOCATION</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">STATUS</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 text-right font-sans">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedJobs.map((job) => {
                      const isSelected = selectedJobIds.includes(job.id);
                      const isLiked = !!favorites[job.id];
                      
                      const dispClient = job.clientName || (job.id === "TRN-2026-001" || job.id === "JO-INS-26-1100" ? "Saudi Aramco" : job.id === "TRN-2026-002" || job.id === "JO-INS-26-1101" ? "NEOM Construction" : "Red Sea Global");
                      const dispEndDate = job.inspectionEndDate || job.scheduledDate || "N/A";
                      const dispLoc = job.location || "Gulf Yard Hub";
                      
                      // Combined Attention/Phone info
                      const dispAttLoc = job.attentionLocation || (dispClient === "Saudi Aramco" ? "Dhahran" : dispClient === "NEOM Construction" ? "Tabuk" : "Jeddah");
                      const dispAttPhone = job.attentionPhone || (dispClient === "Saudi Aramco" ? "+966 13 874 1122" : dispClient === "NEOM Construction" ? "+966 14 551 4488" : "+966 12 604 1155");

                      return (
                        <tr
                          key={job.id}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${isSelected ? "bg-[#F0EBFF]/20" : ""}`}
                          onClick={() => setSelectedJobDetail(job)}
                        >
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(job.id)}
                              className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                            />
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-mono text-[#683EFF] font-bold">{job.id}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Icons.Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-slate-600 font-medium">{formatDate(job.inspectionStartDate || job.scheduledDate || "N/A")}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Icons.Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-slate-600 font-medium">{formatDate(dispEndDate)}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-bold text-slate-800">{dispClient}</span>
                          </td>
                          <td className="p-4 text-slate-600 text-xs truncate max-w-[200px]" title={dispLoc}>
                            {dispLoc}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                              job.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                              job.status === "In Progress" ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-500"
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedJobDetail(job);
                                }}
                                className="p-1.5 text-slate-400 hover:text-[#683EFF] hover:bg-[#F0EBFF] rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Icons.Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(job.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-right"
                                title="Remove Order"
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
              {paginatedJobs.map((job) => {
                const isSelected = selectedJobIds.includes(job.id);
                const isLiked = !!favorites[job.id];
                
                const dispClient = job.clientName || "General Partner";
                const dispEndDate = job.inspectionEndDate || job.scheduledDate || "N/A";
                const dispLoc = job.location || "Logistics Yard Site";
                const dispMachine = job.machineName || "Safety Crane";

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobDetail(job)}
                    className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between min-h-[220px] ${
                      isSelected ? "border-[#683EFF] ring-1 ring-[#683EFF]/35" : "border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          job.status === "Completed" ? "bg-emerald-50 text-emerald-800" : "bg-[#F0EBFF] text-[#683EFF]"
                        }`}>
                          {job.status}
                        </span>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleCheckboxChange(job.id)} className="p-1 text-slate-400 hover:text-[#683EFF]">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 text-[#683EFF] border-slate-300 rounded cursor-pointer"
                            />
                          </button>
                          <button onClick={(e) => toggleFavorite(job.id, e)} className="p-1">
                            <Icons.Heart
                              className={`w-4 h-4 transition-colors ${
                                isLiked ? "text-rose-500 fill-rose-500" : "text-slate-300 hover:text-slate-500"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-base font-extrabold text-slate-800 tracking-tight font-sans">
                        {dispClient}
                      </h4>
                      <p className="text-xs text-[#683EFF] font-bold font-mono">
                        ID Suffix: {job.id}
                      </p>

                      <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                        <p className="truncate"><strong className="text-slate-500 font-bold">Venue:</strong> {dispLoc}</p>
                        <p className="truncate"><strong className="text-slate-500 font-bold">Machine:</strong> {dispMachine}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[10px]">
                      <span className="text-slate-400 font-bold font-mono uppercase tracking-wider">
                        End Date: {formatDate(dispEndDate)}
                      </span>
                      <span className="text-slate-500 font-bold">Inspector: {job.inspectorId || "Zaid M."}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* C. COMPACT VIEW MODE */}
          {viewMode === "compact" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
              {paginatedJobs.map((job) => {
                const isSelected = selectedJobIds.includes(job.id);
                const isLiked = !!favorites[job.id];
                
                const dispClient = job.clientName || "General Partner";
                const dispEndDate = job.inspectionEndDate || job.scheduledDate || "N/A";
                const dispLoc = job.location || "Logistics Yard Site";

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobDetail(job)}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer gap-2 ${
                      isSelected ? "bg-[#F0EBFF]/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(job.id)}
                          className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-800 text-sm">{dispClient}</h5>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                            {job.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">
                          Target Location: {dispLoc} • End Date: {formatDate(dispEndDate)} • Inspector: {job.inspectorId || "Zaid M."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 self-stretch sm:self-auto justify-between sm:justify-start">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        job.status === "Completed" ? "bg-emerald-50 text-emerald-800" : "bg-[#F0EBFF] text-[#683EFF]"
                      }`}>
                        {job.status}
                      </span>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => toggleFavorite(job.id, e)}>
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
          <div className="flex items-center justify-between bg-white px-6 py-4.5 border border-slate-200 rounded-xl shadow-sm select-none">
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
              {/* ========================================================================= */}
      {/* 4. MODAL ADD TRAINING JOB POPUP WITH MULTI-TAB & AUTOFILL AUTOCOMPLETE    */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header Area */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 select-none">
              <div>
                <h3 className="text-xl font-bold font-sans text-slate-800">Create New Inspection Job order</h3>
                <p className="text-xs text-slate-400 mt-1">Please fill out the unified inspection job directory profile for the corporate partner.</p>
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

            {/* Scrollable Form body */}
            <form onSubmit={handleCreateJob} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="space-y-4">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.FileText className="w-4 h-4" />
                  <span>1. Basic Job Information Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Naming Series Code prefix
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal text-slate-800 font-sans"
                      value={formValues.namingSeries}
                      onChange={(e) => setFormValues({ ...formValues, namingSeries: e.target.value })}
                      placeholder="JO-INS-26"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Inspector ID *
                    </label>
                    <input
                      type="text"
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans ${
                        formErrors.inspectorId ? "border-rose-300 focus:ring-rose-500" : "border-slate-200"
                      }`}
                      value={formValues.inspectorId}
                      onChange={(e) => setFormValues({ ...formValues, inspectorId: e.target.value })}
                      placeholder="e.g. INSP-ZAID-09"
                    />
                    {formErrors.inspectorId && <p className="text-[10px] text-rose-500 font-semibold mt-1">{formErrors.inspectorId}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Inspection Date
                    </label>
                    <input
                      type="date"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.inspectionStartDate}
                      onChange={(e) => setFormValues({ ...formValues, inspectionStartDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.inspectionEndDate}
                      onChange={(e) => setFormValues({ ...formValues, inspectionEndDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Initial Status
                    </label>
                    <select
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none bg-slate-50 font-normal font-sans"
                      value={formValues.status}
                      onChange={(e) => setFormValues({ ...formValues, status: e.target.value as any })}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CLIENT DETAILS */}
              <div className="space-y-4">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.Building className="w-4 h-4" />
                  <span>2. Client Relationship Context</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Client Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans ${
                          formErrors.clientName ? "border-rose-300 focus:ring-rose-500" : "border-slate-200"
                        }`}
                        onFocus={() => setShowClientAutocomplete(true)}
                        value={formValues.clientName}
                        onChange={(e) => {
                          setFormValues({ ...formValues, clientName: e.target.value });
                          setShowClientAutocomplete(true);
                        }}
                        placeholder="Click to show registered corporate clients (e.g. Aramco, NEOM, Red Sea)..."
                      />
                      <Icons.ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {formErrors.clientName && <p className="text-[10px] text-rose-500 font-semibold mt-1">{formErrors.clientName}</p>}

                    {/* Autocomplete Overlay menu */}
                    {showClientAutocomplete && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowClientAutocomplete(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                          {matchingCustomers.length === 0 ? (
                            <div className="px-4 py-3 text-xs italic text-slate-400">
                              No matching clients found in active directory
                            </div>
                          ) : (
                            matchingCustomers.map((cust) => (
                              <button
                                key={cust.id}
                                type="button"
                                onClick={() => handleSelectCustomer(cust)}
                                className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] flex justify-between items-center transition-colors"
                              >
                                <span>{cust.companyName}</span>
                                <span className="text-[10px] text-slate-404 font-mono font-bold uppercase">{cust.country}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Equipment Location *
                    </label>
                    <input
                      type="text"
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans ${
                        formErrors.location ? "border-rose-300 focus:ring-rose-500" : "border-slate-200"
                      }`}
                      value={formValues.location}
                      onChange={(e) => setFormValues({ ...formValues, location: e.target.value })}
                      placeholder="Auto-populated or input manual equipment location..."
                    />
                    {formErrors.location && <p className="text-[10px] text-rose-500 font-semibold mt-1">{formErrors.location}</p>}
                  </div>
                </div>
              </div>

              {/* SECTION 3: ATTENTION DETAILS */}
              <div className="space-y-4">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-bold flex items-center gap-2 select-none">
                  <Icons.Contact className="w-4 h-4" />
                  <span>3. Representative Attention Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Attention
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.attentionLocation}
                      onChange={(e) => setFormValues({ ...formValues, attentionLocation: e.target.value })}
                      placeholder="e.g. Eastern Province / Tabuk / Dubai"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.attentionPhone}
                      onChange={(e) => setFormValues({ ...formValues, attentionPhone: e.target.value })}
                      placeholder="e.g. +966 13 874 1122"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: MACHINE DETAILS */}
              <div className="space-y-4 pb-2">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-bold flex items-center gap-2 select-none font-display">
                  <Icons.Cpu className="w-4 h-4" />
                  <span>4. Dynamic Technical Machine Specifications</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Machine Name
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.machineName}
                      onChange={(e) => setFormValues({ ...formValues, machineName: e.target.value })}
                      placeholder="e.g. Heavy Duty Excavator / Hydraulic Crane Simulator"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Number of Count
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.machineCount}
                      onChange={(e) => setFormValues({ ...formValues, machineCount: e.target.value })}
                      placeholder="e.g. 2"
                    />
                  </div>
                </div>

                {/* OPERATOR TABLE IN MODAL */}
                <div className="space-y-4 pt-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-display">
                    <Icons.Users className="w-3.5 h-3.5" />
                    <span>Operator Assignment</span>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                          <th className="p-3 w-10 text-center border-r border-slate-200">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300" disabled />
                          </th>
                          <th className="p-3 w-12 text-center border-r border-slate-200">No.</th>
                          <th className="p-3 border-r border-slate-200">Operator Card</th>
                          <th className="p-3">Operator</th>
                          <th className="p-3 w-10 text-center">
                            <Icons.Settings className="w-3.5 h-3.5 mx-auto opacity-40" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {operatorRows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-12 text-center bg-white">
                              <div className="flex flex-col items-center gap-2 text-slate-400">
                                <Icons.ClipboardList className="w-10 h-10 opacity-20" />
                                <span className="text-[11px] font-medium font-sans uppercase tracking-widest">No Data</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          operatorRows.map((row, idx) => (
                            <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                               <td className="p-2.5 text-center border-r border-slate-100">
                                 <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300" />
                               </td>
                               <td className="p-2.5 text-center border-r border-slate-100 text-[11px] font-medium text-slate-500 font-sans">
                                 {idx + 1}
                               </td>
                               <td className="p-2 border-r border-slate-100">
                                 <input 
                                   type="text" 
                                   className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#683EFF] outline-none font-sans"
                                   placeholder="e.g. CARD-2024-01"
                                   value={row.card}
                                   onChange={(e) => updateOperatorRow(row.id, 'card', e.target.value)}
                                 />
                               </td>
                               <td className="p-2">
                                 <input 
                                   type="text" 
                                   className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#683EFF] outline-none font-sans"
                                   placeholder="Operator Full Name"
                                   value={row.name}
                                   onChange={(e) => updateOperatorRow(row.id, 'name', e.target.value)}
                                 />
                               </td>
                               <td className="p-2 text-center">
                                 <button 
                                   type="button"
                                   onClick={() => removeOperatorRow(row.id)}
                                   className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                 >
                                   <Icons.X className="w-4 h-4" />
                                 </button>
                               </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button 
                    type="button"
                    onClick={addOperatorRow}
                    className="bg-slate-100 hover:bg-slate-200 text-[#0E1B2D] text-[11px] font-semibold py-2 px-4 rounded-lg transition-colors font-sans flex items-center gap-2"
                  >
                    <Icons.Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
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
                onClick={handleCreateJob}
                className="bg-[#683EFF] hover:bg-[#5229E0] text-white text-xs font-semibold py-2 px-5 rounded-lg shadow-sm transition-all cursor-pointer font-sans"
              >
                Generate Job Order
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
              <h3 className="text-lg font-bold text-slate-800 font-sans">Delete Inspection Job?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to permanently delete this inspection job record? This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteJob(confirmDeleteId)}
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
