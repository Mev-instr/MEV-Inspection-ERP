/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import * as Icons from "lucide-react";
import { InspectionReport, InspectionJob, CustomerDetail } from "../types";
import { formatDate } from "../utils";
import { fetchCollection, saveDocument } from "../lib/firestoreSync";

interface InspectionReportsPortfolioProps {
  reports: InspectionReport[];
  customers: CustomerDetail[];
  onReportsChange: React.Dispatch<React.SetStateAction<InspectionReport[]>>;
  inspectionJobs: InspectionJob[];
}

export function InspectionReportsPortfolioView({ reports, customers, onReportsChange, inspectionJobs }: InspectionReportsPortfolioProps) {
  // View states
  const [viewMode, setViewMode] = useState<"list" | "grid" | "compact">("list");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  
  // Search and Enter-key Tag filters
  const [filterInput, setFilterInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Row selection & interaction states
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedReportDetail, setSelectedReportDetail] = useState<InspectionReport | null>(null);

  // Pagination states
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

  // Add Inspection Report modal states
  const [showAddModal, setShowAddModal] = useState(false);

  // Autocomplete client dropdown states
  const [showClientAutocomplete, setShowClientAutocomplete] = useState(false);
  const [showDetailClientAutocomplete, setShowDetailClientAutocomplete] = useState(false);
  const [showJobAutocomplete, setShowJobAutocomplete] = useState(false);
  const [showDetailJobAutocomplete, setShowDetailJobAutocomplete] = useState(false);
  const [showTypeAutocomplete, setShowTypeAutocomplete] = useState(false);
  const [showDetailTypeAutocomplete, setShowDetailTypeAutocomplete] = useState(false);
  const [customInspectionTypes, setCustomInspectionTypes] = useState<string[]>([]);

  useEffect(() => {
    async function loadCustomTypes() {
      try {
        const types = await fetchCollection("inspectionTypes");
        if (types && types.length > 0) {
          const names = types.map(t => t.name).filter(Boolean);
          setCustomInspectionTypes(names);
        }
      } catch (e) {
        console.error("Failed to load custom inspection types:", e);
      }
    }
    loadCustomTypes();
  }, []);

  // New Inspection Report Form State
  const initialFormState = {
    namingSeries: "IR-", // Pre-filled prefix, editable
    checklistNumber: "",
    stickerNo: "",
    finalResult: "Pass",
    jobNumber: "",
    equipmentName: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    expirationData: "",
    travelToFrom: "",
    timeSheetNumber: "",
    validity: "",
    typeOfInspection: "",
    clientName: "",
    address: "",
    equipmentLocation: "",
    recommendation: "",
    // Legacy internal state fallbacks for table & detail view compatibility:
    trainerId: "",
    inspectionStartDate: new Date().toISOString().split("T")[0],
    inspectionEndDate: new Date().toISOString().split("T")[0],
    location: "",
    attentionLocation: "",
    attentionPhone: "",
    machineName: "",
    machineCount: "1",
    status: "Completed" as const,
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
  const [editFormValues, setEditFormValues] = useState<InspectionReport | null>(null);
  const [showBulkActionDropdown, setShowBulkActionDropdown] = useState(false);

  // CSV Import Mapping states
  const [showImportMappingModal, setShowImportMappingModal] = useState(false);
  const [csvMappingData, setCsvMappingData] = useState<{
    headers: string[];
    sampleRow: string[];
    allRows: string[][];
    mappings: Record<string, string>;
  } | null>(null);

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
    const toDuplicate = reports.filter(j => selectedReportIds.includes(j.id));
    const duplicated = toDuplicate.map(j => ({
      ...j,
      id: `JO-TR-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      reportName: `${j.reportName} (Copy)`,
    }));
    onReportsChange((prev) => [...duplicated, ...prev]);
    showToast(`✓ Duplicated ${selectedReportIds.length} report orders`);
    setSelectedReportIds([]);
    setShowBulkActionDropdown(false);
  };

  const handleBulkExport = () => {
    const count = selectedReportIds.length;
    showToast(`✓ Exporting ${count} inspection reports to CSV...`);
    
    const headers = [
      "Naming Series ID", "Checklist Number", "Sticker no", "Job Number",
      "Time Sheet Number", "Type of inspection", "Equipment name", "Equipment Location",
      "Client name", "Address", "Inspection date", "Expiration data",
      "Validity", "Travel to/from", "Final Result", "Recommendation"
    ].join(",");

    const rows = reports
      .filter(j => selectedReportIds.includes(j.id))
      .map(j => [
        j.namingSeries, j.checklistNumber, j.stickerNo, j.jobNumber,
        j.timeSheetNumber, j.typeOfInspection, j.equipmentName, j.equipmentLocation,
        j.clientName, j.address, j.inspectionDate, j.expirationData,
        j.validity, j.travelToFrom, j.finalResult, j.recommendation
      ].map(field => `"${String(field || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inspection_reports_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSelectedReportIds([]);
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
      if (h === "id" || h === "report id" || h === "inspection report id") return "id";
      if (h === "naming series id" || h === "naming series" || h === "prefix") return "namingSeries";
      if (h === "client name" || h === "client" || h === "customer") return "clientName";
      if (h === "checklist number" || h === "checklist") return "checklistNumber";
      if (h === "sticker no" || h === "sticker number" || h === "sticker") return "stickerNo";
      if (h === "job number" || h === "job_number") return "jobNumber";
      if (h === "time sheet number" || h === "timesheet") return "timeSheetNumber";
      if (h === "type of inspection" || h === "inspection_type") return "typeOfInspection";
      if (h === "equipment name" || h === "machine name" || h === "equipment") return "equipmentName";
      if (h === "equipment location" || h === "location") return "equipmentLocation";
      if (h === "address") return "address";
      if (h === "inspection date" || h === "start date" || h === "date") return "inspectionDate";
      if (h === "expiration data" || h === "expiration date" || h === "expiry_date") return "expirationData";
      if (h === "validity") return "validity";
      if (h === "travel to/from" || h === "travel") return "travelToFrom";
      if (h === "final result" || h === "result" || h === "status") return "finalResult";
      if (h === "recommendation" || h === "recommendations") return "recommendation";
      return "";
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
        setShowImportMappingModal(true);
      } catch (err) {
        console.error(err);
        showToast("⚠ Error parsing CSV file.");
      }
      e.target.value = "";
    };

    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!csvMappingData) return;

    const { headers, allRows, mappings } = csvMappingData;
    const importedReports: InspectionReport[] = [];

    const getValMapped = (row: string[], colHeaders: string[], activeMappings: Record<string, string>, targetField: string) => {
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

      const clientName = getVal("clientName") || "General Partner";
      const namingSeries = getVal("namingSeries") || "MEV-IR-26";
      const equipmentName = getVal("equipmentName") || "Heavy Machine";

      const hasAnyContent = row.some(val => val.trim().length > 0);
      if (!hasAnyContent) return;

      const finalId = getVal("id") || calculateNextSequenceId(namingSeries);
      const checklistNumber = getVal("checklistNumber");
      const stickerNo = getVal("stickerNo");
      const jobNumber = getVal("jobNumber");
      const timeSheetNumber = getVal("timeSheetNumber");
      const typeOfInspection = getVal("typeOfInspection");
      const equipmentLocation = getVal("equipmentLocation");
      const address = getVal("address");
      const inspectionDate = getVal("inspectionDate") || new Date().toISOString().split("T")[0];
      const expirationData = getVal("expirationData") || new Date().toISOString().split("T")[0];
      const validity = getVal("validity");
      const travelToFrom = getVal("travelToFrom");
      const finalResult = getVal("finalResult") || "Pass";
      const recommendation = getVal("recommendation");

      const report: InspectionReport = {
        id: finalId,
        reportName: equipmentName ? `Equipment: ${equipmentName} Inspection` : "General Heavy Machine Inspection",
        inspector: checklistNumber || "Inspector",
        testDate: expirationData || inspectionDate,
        complianceScore: 100,
        status: finalResult === "Pass" ? "Completed" : finalResult === "Fail" ? "Cancelled" : "In Progress",
        location: equipmentLocation || address || "",
        namingSeries: namingSeries,
        checklistNumber: checklistNumber,
        stickerNo: stickerNo,
        finalResult: finalResult,
        jobNumber: jobNumber,
        equipmentName: equipmentName,
        inspectionDate: inspectionDate,
        expirationData: expirationData,
        expirationDate: expirationData,
        travelToFrom: travelToFrom,
        timeSheetNumber: timeSheetNumber,
        validity: validity,
        typeOfInspection: typeOfInspection,
        clientName: clientName,
        address: address,
        equipmentLocation: equipmentLocation,
        recommendation: recommendation,
        loadChartData: []
      };

      importedReports.push(report);
    });

    if (importedReports.length > 0) {
      onReportsChange((prev) => [...importedReports, ...prev]);
      showToast(`✓ Successfully imported ${importedReports.length} inspection reports.`);
    } else {
      showToast("⚠ No valid inspection report entries found in the CSV based on current mapping.");
    }

    setShowImportMappingModal(false);
    setCsvMappingData(null);
  };

  const handleBulkDeleteItems = () => {
    const count = selectedReportIds.length;
    // Removing window.confirm for direct execution as it might be blocked in the iframe
    onReportsChange((prev) => prev.filter(j => !selectedReportIds.includes(j.id)));
    showToast(`✓ Successfully removed ${count} report records`);
    setSelectedReportIds([]);
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
    setSelectedReportIds([]);
    showToast("✓ Search query and filter tags reset.");
  };

  // Filtering criteria matches
  const filteredReports = reports.filter((report) => {
    if (activeFilters.length === 0) return true;
    return activeFilters.every((kw) => {
      const criteria = kw.toLowerCase();
      return (
        report.id.toLowerCase().includes(criteria) ||
        (report.clientName || "").toLowerCase().includes(criteria) ||
        (report.location || "").toLowerCase().includes(criteria) ||
        (report.attentionLocation || "").toLowerCase().includes(criteria) ||
        (report.inspector || report.trainerId || "").toLowerCase().includes(criteria) ||
        (report.machineName || "").toLowerCase().includes(criteria) ||
        report.status.toLowerCase().includes(criteria)
      );
    });
  });

  // Pagination slices
  const totalItems = filteredReports.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const sortedReports = [...filteredReports].sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: "base" }));
  const paginatedReports = sortedReports.slice(startIndex, startIndex + itemsPerPage);
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

  // Toggle checkout checkboxes
  const handleCheckboxChange = (id: string) => {
    if (selectedReportIds.includes(id)) {
      setSelectedReportIds(selectedReportIds.filter((x) => x !== id));
    } else {
      setSelectedReportIds([...selectedReportIds, id]);
    }
  };

  // Select all rows on current page
  const handleSelectAll = () => {
    const pageIds = paginatedReports.map((j) => j.id);
    const allSelected = pageIds.every((id) => selectedReportIds.includes(id));
    if (allSelected) {
      setSelectedReportIds(selectedReportIds.filter((id) => !pageIds.includes(id)));
    } else {
      const newIds = [...selectedReportIds];
      pageIds.forEach((id) => {
        if (!newIds.includes(id)) newIds.push(id);
      });
      setSelectedReportIds(newIds);
    }
  };

  // Auto-calculate validity
  useEffect(() => {
    if (formValues.inspectionDate && formValues.expirationData) {
      const start = new Date(formValues.inspectionDate);
      const end = new Date(formValues.expirationData);
      const diffInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      if (diffInMonths >= 0) {
        setFormValues((prev) => ({ ...prev, validity: `${diffInMonths} months` }));
      }
    }
  }, [formValues.inspectionDate, formValues.expirationData]);

  const matchingJobs = inspectionJobs.filter((job) => {
    if (!formValues.jobNumber.trim()) return true;
    return job.id.toLowerCase().includes(formValues.jobNumber.toLowerCase());
  }).slice(0, formValues.jobNumber.trim() ? undefined : 5);

  const matchingDetailJobs = inspectionJobs.filter((job) => {
    const searchVal = editFormValues?.jobNumber || "";
    if (!searchVal.trim()) return true;
    return job.id.toLowerCase().includes(searchVal.toLowerCase());
  }).slice(0, (editFormValues?.jobNumber || "").trim() ? undefined : 5);

  const handleSelectJob = (job: InspectionJob) => {
    setFormValues((prev) => ({
      ...prev,
      jobNumber: job.id,
      equipmentName: job.machineName || "",
      inspectionDate: job.inspectionStartDate || "",
      expirationData: job.inspectionEndDate || "",
      clientName: job.clientName || "",
      address: job.location || "",
      equipmentLocation: job.location || "",
    }));
    setShowJobAutocomplete(false);
    showToast(`✓ Job ${job.id} details loaded.`);
  };

  const handleSelectDetailJob = (job: InspectionJob) => {
    if (editFormValues) {
      setEditFormValues({
        ...editFormValues,
        jobNumber: job.id,
        equipmentName: job.machineName || "",
        inspectionDate: job.inspectionStartDate || "",
        expirationData: job.inspectionEndDate || "",
        clientName: job.clientName || "",
        address: job.location || "",
        equipmentLocation: job.location || "",
      });
    }
    setShowDetailJobAutocomplete(false);
    showToast(`✓ Job ${job.id} details loaded.`);
  };
  const matchingCustomers = customers.filter((cust) => {
    if (!formValues.clientName.trim()) return true;
    return cust.companyName?.toLowerCase().includes(formValues.clientName.toLowerCase());
  }).slice(0, formValues.clientName.trim() ? undefined : 5);

  // Auto-fill form values on selecting customer
  const handleSelectCustomer = (cust: CustomerDetail) => {
    setFormValues((prev) => ({
      ...prev,
      clientName: cust.companyName || "",
      address: cust.inspectionSiteAddress || "",
      equipmentLocation: cust.inspectionContactPerson || "",
      location: cust.inspectionSiteAddress || "",
      attentionLocation: cust.inspectionContactPerson || "",
      attentionPhone: cust.inspectionContactPhone || ""
    }));
    setShowClientAutocomplete(false);
    showToast(`✓ Client details loaded from "${cust.companyName}". autofilled address & locations.`);
  };

  // Inspection type autocomplete suggestions
  const predefinedTypes = ["Periodic and Visual Inspection", "Load Testing Inspection"];
  const uniqueInspectionTypes = Array.from(new Set([
    ...predefinedTypes,
    ...reports.map(r => r.typeOfInspection).filter(Boolean) as string[],
    ...customInspectionTypes
  ]));

  const matchingTypes = uniqueInspectionTypes.filter(t => {
    if (!formValues.typeOfInspection.trim()) return true;
    return t.toLowerCase().includes(formValues.typeOfInspection.toLowerCase());
  }).slice(0, formValues.typeOfInspection.trim() ? undefined : 5);

  const showAddCustomOption = formValues.typeOfInspection.trim() && 
    !uniqueInspectionTypes.some(t => t.toLowerCase() === formValues.typeOfInspection.trim().toLowerCase());

  const matchingDetailTypes = uniqueInspectionTypes.filter(t => {
    const searchVal = editFormValues?.typeOfInspection || "";
    if (!searchVal.trim()) return true;
    return t.toLowerCase().includes(searchVal.toLowerCase());
  }).slice(0, (editFormValues?.typeOfInspection || "").trim() ? undefined : 5);

  const showAddCustomDetailOption = (editFormValues?.typeOfInspection || "").trim() && 
    !uniqueInspectionTypes.some(t => t.toLowerCase() === (editFormValues?.typeOfInspection || "").trim().toLowerCase());

  const handleSaveCustomType = async (newType: string) => {
    if (!newType) return;
    const cleanType = newType.trim();
    if (!cleanType) return;
    
    if (!customInspectionTypes.some(t => t.toLowerCase() === cleanType.toLowerCase())) {
      const updatedTypes = [...customInspectionTypes, cleanType];
      setCustomInspectionTypes(updatedTypes);
      
      try {
        const typeId = cleanType.toLowerCase().replace(/[^a-z0-9]/g, "-");
        await saveDocument("inspectionTypes", typeId, { name: cleanType });
        showToast(`✓ Custom inspection type "${cleanType}" saved for future use.`);
      } catch (err) {
        console.error("Failed to save custom type to Firestore:", err);
      }
    }
    
    setFormValues(prev => ({ ...prev, typeOfInspection: cleanType }));
    setShowTypeAutocomplete(false);
  };

  const handleSaveCustomDetailType = async (newType: string) => {
    if (!newType) return;
    const cleanType = newType.trim();
    if (!cleanType) return;
    
    if (!customInspectionTypes.some(t => t.toLowerCase() === cleanType.toLowerCase())) {
      const updatedTypes = [...customInspectionTypes, cleanType];
      setCustomInspectionTypes(updatedTypes);
      
      try {
        const typeId = cleanType.toLowerCase().replace(/[^a-z0-9]/g, "-");
        await saveDocument("inspectionTypes", typeId, { name: cleanType });
        showToast(`✓ Custom inspection type "${cleanType}" saved for future use.`);
      } catch (err) {
        console.error("Failed to save custom type to Firestore:", err);
      }
    }
    
    if (editFormValues) {
      setEditFormValues({ ...editFormValues, typeOfInspection: cleanType });
    }
    setShowDetailTypeAutocomplete(false);
  };

  const handleSelectType = (type: string) => {
    setFormValues({ ...formValues, typeOfInspection: type });
    setShowTypeAutocomplete(false);
  };

  const handleSelectDetailType = (type: string) => {
    if (editFormValues) {
      setEditFormValues({ ...editFormValues, typeOfInspection: type });
    }
    setShowDetailTypeAutocomplete(false);
  };

  const matchingDetailCustomers = customers.filter((cust) => {
    const searchVal = editFormValues?.clientName || "";
    if (!searchVal.trim()) return true;
    return cust.companyName?.toLowerCase().includes(searchVal.toLowerCase());
  }).slice(0, (editFormValues?.clientName || "").trim() ? undefined : 5);

  const handleSelectDetailCustomer = (cust: CustomerDetail) => {
    if (editFormValues) {
      setEditFormValues({
        ...editFormValues,
        clientName: cust.companyName || "",
        address: cust.inspectionSiteAddress || "",
        equipmentLocation: cust.inspectionContactPerson || "",
        location: cust.inspectionSiteAddress || "",
        attentionLocation: cust.inspectionContactPerson || "",
        attentionPhone: cust.inspectionContactPhone || ""
      });
    }
    setShowDetailClientAutocomplete(false);
    showToast(`✓ Client details loaded from "${cust.companyName}". autofilled address & locations.`);
  };

  // Helper calculation to auto-generate the next IR-XXXX sequence
  const calculateNextSequenceId = (seriesInput: string): string => {
    const cleanSeries = seriesInput.trim() || "IR-";
    
    // If the input matches a manually entered ID other than the default prefix, return it directly.
    if (cleanSeries !== "IR-") {
      return cleanSeries;
    }

    // Otherwise, find the maximum suffix number in current reports starting with IR-
    let maxSuffix = 1100; // Starting baseline suffix count
    const matchingReports = reports.filter((j) => j.id.startsWith("IR-"));
    matchingReports.forEach((report) => {
      const parts = report.id.split("-");
      const suffixCode = parts[parts.length - 1];
      const numericVal = parseInt(suffixCode, 10);
      if (!isNaN(numericVal) && numericVal > maxSuffix) {
        maxSuffix = numericVal;
      }
    });

    return `IR-${maxSuffix + 1}`;
  };

  // Handle Form Submission / Report Creation
  const handleCreateReport = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formValues.clientName.trim()) {
      errors.clientName = "Client Name is required";
    }
    if (!formValues.equipmentName.trim()) {
      errors.equipmentName = "Equipment Name is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Generate compliant ID with our Naming series processor
    const finalId = calculateNextSequenceId(formValues.namingSeries);

    const newReport: InspectionReport = {
      id: finalId,
      reportName: formValues.equipmentName ? `Equipment: ${formValues.equipmentName} Inspection` : "General Heavy Machine Inspection",
      inspector: formValues.checklistNumber || "Inspector",
      testDate: formValues.expirationData || formValues.inspectionDate,
      complianceScore: 100,
      status: formValues.finalResult === "Pass" ? "Completed" : formValues.finalResult === "Fail" ? "Cancelled" : "In Progress",
      location: formValues.equipmentLocation || formValues.address || "",

      // High-fidelity requested fields
      checklistNumber: formValues.checklistNumber,
      stickerNo: formValues.stickerNo,
      finalResult: formValues.finalResult,
      jobNumber: formValues.jobNumber,
      equipmentName: formValues.equipmentName,
      inspectionDate: formValues.inspectionDate,
      expirationData: formValues.expirationData,
      expirationDate: formValues.expirationData,
      travelToFrom: formValues.travelToFrom,
      timeSheetNumber: formValues.timeSheetNumber,
      validity: formValues.validity,
      typeOfInspection: formValues.typeOfInspection,
      clientName: formValues.clientName,
      address: formValues.address,
      equipmentLocation: formValues.equipmentLocation,
      recommendation: formValues.recommendation,

      // legacy fallbacks
      trainerId: formValues.checklistNumber || "Zaid M.",
      inspectionStartDate: formValues.inspectionDate,
      inspectionEndDate: formValues.expirationData || formValues.inspectionDate,
      attentionLocation: formValues.equipmentLocation,
      attentionPhone: "",
      machineName: formValues.equipmentName || "Crane Safe Simulator",
      machineCount: "1",
      operators: [],
    };

    onReportsChange((prev) => [newReport, ...prev]);

    // Auto-save typed custom inspection type to Firestore so it's persisted for the future
    const typedType = formValues.typeOfInspection.trim();
    if (typedType && !uniqueInspectionTypes.some(t => t.toLowerCase() === typedType.toLowerCase())) {
      handleSaveCustomType(typedType);
    }

    setShowAddModal(false);
    setFormValues(initialFormState);
    setFormErrors({});
    showToast(`✓ Inspection report order ${newReport.id} generated successfully.`);
  };

  // Save changes done in page detail view
  const handleSaveDetailChanges = () => {
    if (!editFormValues) return;
    
    const finalReport = { ...editFormValues, operators: [...operatorRows] };
    // Propagate changes to outer state hook
    onReportsChange((prev) =>
      prev.map((j) => (j.id === finalReport.id ? finalReport : j))
    );

    // Auto-save typed custom inspection type to Firestore so it's persisted for the future
    const typedTypeDetail = (editFormValues.typeOfInspection || "").trim();
    if (typedTypeDetail && !uniqueInspectionTypes.some(t => t.toLowerCase() === typedTypeDetail.toLowerCase())) {
      handleSaveCustomDetailType(typedTypeDetail);
    }

    setSelectedReportDetail(finalReport);
    setIsEditingInDetail(false);
    showToast("✓ Inspection details updated successfully.");
  };

  // Quick navigation buttons in detail page
  const currentDetailIndex = reports.findIndex((j) => j.id === selectedReportDetail?.id);
  
  const handlePrevDetail = () => {
    if (currentDetailIndex > 0) {
      setSelectedReportDetail(reports[currentDetailIndex - 1]);
      setIsEditingInDetail(false);
    } else {
      showToast("First inspection report reached.");
    }
  };

  const handleNextDetail = () => {
    if (currentDetailIndex < reports.length - 1) {
      setSelectedReportDetail(reports[currentDetailIndex + 1]);
      setIsEditingInDetail(false);
    } else {
      showToast("Last inspection report reached.");
    }
  };

  // Delete inspection report
  const handleDeleteReport = (id: string) => {
    onReportsChange((prev) => prev.filter((j) => j.id !== id));
    setSelectedReportIds(selectedReportIds.filter((x) => x !== id));
    if (selectedReportDetail?.id === id) {
      setSelectedReportDetail(null);
    }
    showToast("✓ Inspection report order removed from workspace.");
    setConfirmDeleteId(null);
  };

  // Export JSON summary of report
  const handleExportReportJson = (report: InspectionReport) => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `inspection_report_${report.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("✓ Downloaded inspection report JSON.");
    } catch {
      showToast("Error exporting JSON.");
    }
  };

  // Trigger print document simulator
  const handlePrintReport = (report: InspectionReport) => {
    showToast(`✓ Dispatched printable ticket docket for Inspection Report ID ${report.id}`);
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
    showToast("✓ Added notes to this report's active audit trail.");
  };

  // Initializing edit form state
  useEffect(() => {
    if (selectedReportDetail) {
      setEditFormValues({ ...selectedReportDetail });
      setOperatorRows(selectedReportDetail.operators || []);
    } else {
      setOperatorRows([]);
    }
  }, [selectedReportDetail]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ==========================================
  // RENDER DETAILED PAGE ROUTE IF SELECTED
  // ==========================================
  if (selectedReportDetail) {
    const report = selectedReportDetail;
    const isLiked = !!favorites[report.id];
    
    const matchingJob = inspectionJobs.find((j) => j.id === report.jobNumber);
    
    // We synchronize values if they exists on report. Otherwise map back from reportName/inspector to prevent blank states
    const dispClient = matchingJob?.clientName || report.clientName || "General Partner Client";
    const dispEndDate = matchingJob?.inspectionEndDate || report.inspectionEndDate || report.testDate || "N/A";
    const dispStartDate = matchingJob?.inspectionStartDate || report.inspectionStartDate || "N/A";
    const dispInspector = matchingJob?.inspector || report.inspector || "Zaid Mansoor";
    const dispLoc = matchingJob?.location || report.location || "Logistics Yard Site";
    
    const dispAttLoc = matchingJob?.attentionLocation || report.attentionLocation || "Eastern Province";
    const dispAttPhone = matchingJob?.attentionPhone || report.attentionPhone || "+966 50 000 0000";
    const dispMachine = matchingJob?.machineName || report.machineName || "Industrial Crane Simulator";
    const dispMachineCount = matchingJob?.machineCount || report.machineCount || "1";

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
              onClick={() => setSelectedReportDetail(null)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#683EFF] hover:border-[#683EFF] transition-all shadow-sm group animate-in fade-in"
              title="Go Back"
            >
              <Icons.ArrowLeft className="w-4.5 h-4.5 group-active:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400 font-medium font-sans">
                <button onClick={() => setSelectedReportDetail(null)} className="hover:text-[#683EFF] font-semibold transition-colors">
                  Inspection Reports
                </button>
                <Icons.ChevronRight className="w-3 h-3 text-slate-350" />
                <span className="font-bold text-slate-700 truncate max-w-[200px]">{report.id}</span>
              </div>
            </div>
          </div>

          {/* Action Row Sidebar side buttons */}
          <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
            
            {/* Action buttons (Print, Export, Delete) */}
            <button
              onClick={() => handlePrintReport(report)}
              title="Print Order Ticket"
              className="p-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition-colors"
            >
              <Icons.Printer className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleExportReportJson(report)}
              title="Download Report Summary"
              className="p-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition-colors"
            >
              <Icons.Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setConfirmDeleteId(report.id)}
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
                title="Previous inspection report"
              >
                <Icons.ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDetail}
                disabled={currentDetailIndex >= reports.length - 1}
                className="p-2 hover:bg-slate-50 text-slate-500 disabled:opacity-35 transition-colors"
                title="Next inspection report"
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
              {report.id.substring(0, 2).toUpperCase()}
            </div>

            {/* Client Naming details */}
            <h3 className="font-display font-bold text-slate-800 text-lg mt-4 leading-snug">
              {dispClient}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">Order: {report.id}</p>

            {/* Status interactive selector */}
            <div className="mt-3">
              <select
                value={isEditingInDetail && editFormValues ? editFormValues.status : report.status}
                onChange={(e) => {
                  const val = e.target.value as any;
                  if (isEditingInDetail && editFormValues) {
                    setEditFormValues({ ...editFormValues, status: val });
                  } else {
                    onReportsChange((prev) =>
                      prev.map((item) => (item.id === report.id ? { ...item, status: val } : item))
                    );
                    setSelectedReportDetail((prev) => (prev ? { ...prev, status: val } : null));
                    showToast(`✓ Operational status changed to: ${val}`);
                  }
                }}
                className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer focus:outline-none border transition-colors ${
                  (isEditingInDetail && editFormValues ? editFormValues.status : report.status) === "Completed"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    : (isEditingInDetail && editFormValues ? editFormValues.status : report.status) === "In Progress"
                    ? "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                    : (isEditingInDetail && editFormValues ? editFormValues.status : report.status) === "Cancelled"
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
                      <span className="text-slate-500 font-medium font-sans">Report Order ID</span>
                    </div>
                    <span className="font-normal font-sans text-slate-800">{report.id}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <Icons.User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 font-medium font-sans">Inspector</span>
                    </div>
                    <span className="font-normal font-sans text-slate-800">{dispInspector}</span>
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
                onClick={(e) => toggleFavorite(report.id, e)}
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
                        Naming Series ID
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.namingSeries || "" : report.namingSeries || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, namingSeries: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-mono font-bold text-[#683EFF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Checklist Number
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.checklistNumber || "" : report.checklistNumber || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, checklistNumber: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Sticker no
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.stickerNo || "" : report.stickerNo || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, stickerNo: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Final Result
                      </label>
                      <select
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.finalResult || "" : report.finalResult || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, finalResult: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      >
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        <option value="Satisfactory">Satisfactory</option>
                        <option value="Requires Attention">Requires Attention</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Job Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          disabled={!isEditingInDetail}
                          value={isEditingInDetail && editFormValues ? editFormValues.jobNumber || "" : report.jobNumber || ""}
                          onChange={(e) => {
                            if (editFormValues) {
                              setEditFormValues({ ...editFormValues, jobNumber: e.target.value });
                              setShowDetailJobAutocomplete(true);
                            }
                          }}
                          onFocus={() => { if (isEditingInDetail) setShowDetailJobAutocomplete(true); }}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                        />
                        {isEditingInDetail && (
                          <Icons.ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        )}
                        
                        {/* Autocomplete Overlay menu */}
                        {showDetailJobAutocomplete && isEditingInDetail && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowDetailJobAutocomplete(false)} />
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                              {matchingDetailJobs.length === 0 ? (
                                <div className="px-4 py-3 text-xs italic text-slate-400">
                                  No matching jobs found
                                </div>
                              ) : (
                                matchingDetailJobs.map((job) => (
                                  <button
                                    key={job.id}
                                    type="button"
                                    onClick={() => handleSelectDetailJob(job)}
                                    className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] flex justify-between items-center transition-colors"
                                  >
                                    <span>{job.id}</span>
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
                        Equipment Name
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        readOnly={false}
                        value={isEditingInDetail && editFormValues ? editFormValues.equipmentName || "" : report.equipmentName || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, equipmentName: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Inspection Date
                      </label>
                      <input
                        type="date"
                        disabled={!isEditingInDetail}
                        readOnly={false}
                        value={isEditingInDetail && editFormValues ? editFormValues.inspectionDate || "" : report.inspectionDate || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, inspectionDate: e.target.value });
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
                        readOnly={false}
                        value={isEditingInDetail && editFormValues ? editFormValues.expirationData || "" : report.expirationData || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, expirationData: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-mono text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Travel to/from
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.travelToFrom || "" : report.travelToFrom || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, travelToFrom: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Time Sheet Number
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.timeSheetNumber || "" : report.timeSheetNumber || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, timeSheetNumber: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Validity
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.validity || "" : report.validity || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, validity: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Type of inspection
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          disabled={!isEditingInDetail}
                          value={isEditingInDetail && editFormValues ? editFormValues.typeOfInspection || "" : report.typeOfInspection || ""}
                          onFocus={() => { if (isEditingInDetail) setShowDetailTypeAutocomplete(true); }}
                          onChange={(e) => {
                            if (editFormValues) {
                              setEditFormValues({ ...editFormValues, typeOfInspection: e.target.value });
                              setShowDetailTypeAutocomplete(true);
                            }
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = (editFormValues?.typeOfInspection || "").trim();
                              if (val) {
                                await handleSaveCustomDetailType(val);
                              } else {
                                setShowDetailTypeAutocomplete(false);
                              }
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                          placeholder="e.g. Periodic and Visual Inspection"
                        />
                        {isEditingInDetail && (
                          <Icons.ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        )}
                      </div>
                      
                      {/* Autocomplete Overlay menu */}
                      {showDetailTypeAutocomplete && isEditingInDetail && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowDetailTypeAutocomplete(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                            {showAddCustomDetailOption && (
                              <button
                                type="button"
                                onClick={() => handleSaveCustomDetailType((editFormValues?.typeOfInspection || "").trim())}
                                className="w-full px-4 py-2 text-xs font-bold text-[#683EFF] hover:bg-[#F0EBFF] text-left transition-colors flex items-center gap-1.5 border-b border-slate-100"
                              >
                                <Icons.Plus className="w-3.5 h-3.5" />
                                Add Custom Type: "{(editFormValues?.typeOfInspection || "").trim()}"
                              </button>
                            )}
                            {matchingDetailTypes.length === 0 ? (
                              !showAddCustomDetailOption && (
                                <div className="px-4 py-3 text-xs text-slate-500 font-medium">
                                  Press Enter or save to add "{editFormValues?.typeOfInspection}"
                                </div>
                              )
                            ) : (
                              matchingDetailTypes.map((type, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSelectDetailType(type)}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] text-left transition-colors"
                                >
                                  {type}
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Client Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          disabled={!isEditingInDetail}
                          onFocus={() => { if (isEditingInDetail) setShowDetailClientAutocomplete(true); }}
                          value={isEditingInDetail && editFormValues ? editFormValues.clientName || "" : report.clientName || ""}
                          onChange={(e) => {
                            if (editFormValues) {
                              setEditFormValues({ ...editFormValues, clientName: e.target.value });
                              setShowDetailClientAutocomplete(true);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                          placeholder="Click or type client name (e.g. Aramco, NEOM)..."
                        />
                        {isEditingInDetail && (
                          <Icons.ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        )}
                      </div>

                      {/* Autocomplete Overlay menu */}
                      {showDetailClientAutocomplete && isEditingInDetail && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowDetailClientAutocomplete(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                            {matchingDetailCustomers.length === 0 ? (
                              <div className="px-4 py-3 text-xs italic text-slate-400">
                                No matching clients found in active directory
                              </div>
                            ) : (
                              matchingDetailCustomers.map((cust) => (
                                <button
                                  key={cust.id}
                                  type="button"
                                  onClick={() => handleSelectDetailCustomer(cust)}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] flex justify-between items-center transition-colors text-left"
                                >
                                  <span>{cust.companyName}</span>
                                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{cust.country}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Address
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        readOnly={false}
                        value={isEditingInDetail && editFormValues ? editFormValues.address || "" : report.address || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, address: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Equipment Location
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingInDetail}
                        readOnly={false}
                        value={isEditingInDetail && editFormValues ? editFormValues.equipmentLocation || "" : report.equipmentLocation || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, equipmentLocation: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Recommendation
                      </label>
                      <textarea
                        disabled={!isEditingInDetail}
                        value={isEditingInDetail && editFormValues ? editFormValues.recommendation || "" : report.recommendation || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, recommendation: e.target.value });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-semibold text-slate-700"
                        rows={4}
                      />
                    </div>
                  </div>
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
                          <p className="text-xs font-bold text-slate-800">Inspection report verification logs updated</p>
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
                <h3 className="text-lg font-bold text-slate-800 font-sans">Delete Inspection Report?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Are you sure you want to permanently delete this inspection report record? This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6 w-full">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteReport(confirmDeleteId)}
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

      {/* 1. Header with custom tags metadata and Add Inspection Report Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-[#683EFF] font-bold tracking-wider uppercase">
            <span>Operations Management</span>
            <span className="text-slate-300">/</span>
            <span className="bg-[#F0EBFF] px-2 py-0.5 rounded text-[10px]">Inspection list page</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-800 tracking-tight">
            Inspection Reports Portfolio
          </h2>
        </div>

        {/* Header Action controls */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto relative">
          
          {/* Bulk Actions Bar Integrated directly into the row, appeared on the left of dropdown */}
          {selectedReportIds.length > 0 && (
            <div className="bg-[#FFF5F5] border border-rose-100 rounded-xl p-1 px-3 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-[11px] font-black uppercase tracking-[0.1em] text-rose-600 whitespace-nowrap">
                SELECTED: {selectedReportIds.length}
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
            onClick={() => document.getElementById("csv-import-reports-input")?.click()}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:border-[#683EFF] hover:text-[#683EFF] rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            title="Import Inspection Reports from CSV"
          >
            <Icons.Upload className="w-4 h-4 text-slate-400 hover:text-[#683EFF]" />
            <span>Import</span>
          </button>
          <input
            id="csv-import-reports-input"
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

          {/* Add Inspection Report master trigger */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#683EFF] hover:bg-[#5229E0] text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 text-sm shadow-sm transition-all"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Add Inspection Report</span>
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
                    Filtering logic matches target inspection end dates, ID suffix, simulator machine names or trainer registrations.
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
      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-white border border-slate-200 shadow-sm min-h-[350px]">
          <div className="p-4 bg-slate-50 text-slate-450 text-slate-440 rounded-full mb-4">
            <Icons.Inbox className="w-10 h-10 text-slate-405 text-slate-400" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-800 font-sans">No Records Found</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
            We couldn't find any inspection reports matching: {activeFilters.join(", ") || "(none)"}. Reset filters to see all.
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
              Add Inspection Report
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
                          checked={paginatedReports.length > 0 && paginatedReports.every((j) => selectedReportIds.includes(j.id))}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                        />
                      </th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">ID</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">START DATE</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">END DATE</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">CLIENT NAME</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">LOCATION</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">STATUS</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 text-right font-sans">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedReports.map((report) => {
                      const isSelected = selectedReportIds.includes(report.id);
                      const isLiked = !!favorites[report.id];
                      
                      const dispClient = report.clientName || (report.id === "REP-2026-001" || report.id === "REP-INS-26-1100" ? "Saudi Aramco" : report.id === "REP-2026-002" || report.id === "REP-INS-26-1101" ? "NEOM Construction" : "Red Sea Global");
                      const dispEndDate = report.inspectionEndDate || report.testDate || "N/A";
                      const dispLoc = report.location || "Gulf Yard Hub";
                      
                      // Combined Attention Location/Phone info
                      const dispAttLoc = report.attentionLocation || (dispClient === "Saudi Aramco" ? "Dhahran" : dispClient === "NEOM Construction" ? "Tabuk" : "Jeddah");
                      const dispAttPhone = report.attentionPhone || (dispClient === "Saudi Aramco" ? "+966 13 874 1122" : dispClient === "NEOM Construction" ? "+966 14 551 4488" : "+966 12 604 1155");

                      return (
                        <tr
                          key={report.id}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${isSelected ? "bg-[#F0EBFF]/20" : ""}`}
                          onClick={() => setSelectedReportDetail(report)}
                        >
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(report.id)}
                              className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                            />
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-mono text-[#683EFF] font-bold">{report.id}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Icons.Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-slate-600 font-medium">{formatDate(report.inspectionStartDate || "N/A")}</span>
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
                              report.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                              report.status === "In Progress" ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-500"
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReportDetail(report);
                                }}
                                className="p-1.5 text-slate-400 hover:text-[#683EFF] hover:bg-[#F0EBFF] rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Icons.Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(report.id);
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
              {paginatedReports.map((report) => {
                const isSelected = selectedReportIds.includes(report.id);
                const isLiked = !!favorites[report.id];
                
                const dispClient = report.clientName || "General Partner";
                const dispEndDate = report.inspectionEndDate || report.testDate || "N/A";
                const dispLoc = report.location || "Logistics Yard Site";
                const dispMachine = report.machineName || "Safety Crane";

                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReportDetail(report)}
                    className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between min-h-[220px] ${
                      isSelected ? "border-[#683EFF] ring-1 ring-[#683EFF]/35" : "border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          report.status === "Completed" ? "bg-emerald-50 text-emerald-800" : "bg-[#F0EBFF] text-[#683EFF]"
                        }`}>
                          {report.status}
                        </span>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleCheckboxChange(report.id)} className="p-1 text-slate-400 hover:text-[#683EFF]">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 text-[#683EFF] border-slate-300 rounded cursor-pointer"
                            />
                          </button>
                          <button onClick={(e) => toggleFavorite(report.id, e)} className="p-1">
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
                        ID Suffix: {report.id}
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
                      <span className="text-slate-500 font-bold">Trainer: {report.trainerId || "Zaid M."}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* C. COMPACT VIEW MODE */}
          {viewMode === "compact" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
              {paginatedReports.map((report) => {
                const isSelected = selectedReportIds.includes(report.id);
                const isLiked = !!favorites[report.id];
                
                const dispClient = report.clientName || "General Partner";
                const dispEndDate = report.inspectionEndDate || report.testDate || "N/A";
                const dispLoc = report.location || "Logistics Yard Site";

                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReportDetail(report)}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer gap-2 ${
                      isSelected ? "bg-[#F0EBFF]/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(report.id)}
                          className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-800 text-sm">{dispClient}</h5>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                            {report.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">
                          Target Location: {dispLoc} • End Date: {formatDate(dispEndDate)} • Trainer: {report.trainerId || "Zaid M."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 self-stretch sm:self-auto justify-between sm:justify-start">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        report.status === "Completed" ? "bg-emerald-50 text-emerald-800" : "bg-[#F0EBFF] text-[#683EFF]"
                      }`}>
                        {report.status}
                      </span>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => toggleFavorite(report.id, e)}>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4.5 border border-slate-200 rounded-xl shadow-sm select-none relative mt-6">
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
      {/* 4. MODAL ADD TRAINING JOB POPUP WITH MULTI-TAB & AUTOFILL AUTOCOMPLETE    */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header Area */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 select-none">
              <div>
                <h3 className="text-xl font-bold font-sans text-slate-800">Create New Inspection Report order</h3>
                <p className="text-xs text-slate-400 mt-1">Please fill out the unified inspection report directory profile for the corporate partner.</p>
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
            <form onSubmit={handleCreateReport} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* SECTION 1: IDENTIFICATION & SERIES */}
              <div className="space-y-4">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.FileText className="w-4 h-4" />
                  <span>1. Identification & Series ID</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Naming Series ID
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-mono font-bold text-[#683EFF]"
                      value={formValues.namingSeries}
                      onChange={(e) => setFormValues({ ...formValues, namingSeries: e.target.value })}
                      placeholder="IR-"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Checklist Number
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.checklistNumber}
                      onChange={(e) => setFormValues({ ...formValues, checklistNumber: e.target.value })}
                      placeholder="e.g. CHK-1092"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Sticker no
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.stickerNo}
                      onChange={(e) => setFormValues({ ...formValues, stickerNo: e.target.value })}
                      placeholder="e.g. STK-8841"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Job Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.jobNumber}
                        onChange={(e) => {
                          setFormValues({ ...formValues, jobNumber: e.target.value });
                          setShowJobAutocomplete(true);
                        }}
                        placeholder="Click or type job ID..."
                      />
                      <Icons.ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Autocomplete Overlay menu */}
                    {showJobAutocomplete && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowJobAutocomplete(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                          {matchingJobs.length === 0 ? (
                            <div className="px-4 py-3 text-xs italic text-slate-400">
                              No matching jobs found
                            </div>
                          ) : (
                            matchingJobs.map((job) => (
                              <button
                                key={job.id}
                                type="button"
                                onClick={() => handleSelectJob(job)}
                                className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] flex justify-between items-center transition-colors"
                              >
                                <span>{job.id}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Time Sheet Number
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.timeSheetNumber}
                      onChange={(e) => setFormValues({ ...formValues, timeSheetNumber: e.target.value })}
                      placeholder="e.g. TS-9921"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Type of inspection
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        onFocus={() => setShowTypeAutocomplete(true)}
                        value={formValues.typeOfInspection}
                        onChange={(e) => {
                          setFormValues({ ...formValues, typeOfInspection: e.target.value });
                          setShowTypeAutocomplete(true);
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = formValues.typeOfInspection.trim();
                            if (val) {
                              await handleSaveCustomType(val);
                            } else {
                              setShowTypeAutocomplete(false);
                            }
                          }
                        }}
                        placeholder="e.g. Periodic and Visual Inspection"
                      />
                      <Icons.ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Autocomplete Overlay menu */}
                    {showTypeAutocomplete && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowTypeAutocomplete(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                          {showAddCustomOption && (
                            <button
                              type="button"
                              onClick={() => handleSaveCustomType(formValues.typeOfInspection.trim())}
                              className="w-full px-4 py-2 text-xs font-bold text-[#683EFF] hover:bg-[#F0EBFF] text-left transition-colors flex items-center gap-1.5 border-b border-slate-100"
                            >
                              <Icons.Plus className="w-3.5 h-3.5" />
                              Add Custom Type: "{formValues.typeOfInspection.trim()}"
                            </button>
                          )}
                          {matchingTypes.length === 0 ? (
                            !showAddCustomOption && (
                              <div className="px-4 py-3 text-xs text-slate-500 font-medium">
                                Press Enter or save to add "{formValues.typeOfInspection}"
                              </div>
                            )
                          ) : (
                            matchingTypes.map((type, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectType(type)}
                                className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] text-left transition-colors"
                              >
                                {type}
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: EQUIPMENT & LOCATION */}
              <div className="space-y-4">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.Cpu className="w-4 h-4" />
                  <span>2. Equipment & Site Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Equipment name *
                    </label>
                    <input
                      type="text"
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans ${
                        formErrors.equipmentName ? "border-rose-300 focus:ring-rose-500" : "border-slate-200"
                      }`}
                      value={formValues.equipmentName}
                      onChange={(e) => setFormValues({ ...formValues, equipmentName: e.target.value })}
                      placeholder="e.g. Hydraulic Crawler Crane 50T"
                    />
                    {formErrors.equipmentName && <p className="text-[10px] text-rose-500 font-semibold mt-1">{formErrors.equipmentName}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Equipment Location
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.equipmentLocation}
                      onChange={(e) => setFormValues({ ...formValues, equipmentLocation: e.target.value })}
                      placeholder="e.g. Yard B, Berth 4"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Client name *
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
                        placeholder="Click or type client name (e.g. Aramco, NEOM)..."
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
                                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{cust.country}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Address
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.address}
                      onChange={(e) => setFormValues({ ...formValues, address: e.target.value })}
                      placeholder="e.g. Dhahran North Camp, Gate 3"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: SCHEDULE & OUTCOME */}
              <div className="space-y-4">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.Calendar className="w-4 h-4" />
                  <span>3. Inspection Schedule & Outcome</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Inspection date
                    </label>
                    <input
                      type="date"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.inspectionDate}
                      onChange={(e) => setFormValues({ ...formValues, inspectionDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Expiration data
                    </label>
                    <input
                      type="date"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.expirationData}
                      onChange={(e) => setFormValues({ ...formValues, expirationData: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Validity
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.validity}
                      onChange={(e) => setFormValues({ ...formValues, validity: e.target.value })}
                      placeholder="e.g. 1 Year / 6 Months"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Travel to/from
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.travelToFrom}
                      onChange={(e) => setFormValues({ ...formValues, travelToFrom: e.target.value })}
                      placeholder="e.g. Khobar to Dhahran HQ"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Final Result
                    </label>
                    <select
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-semibold text-slate-800 font-sans"
                      value={formValues.finalResult}
                      onChange={(e) => setFormValues({ ...formValues, finalResult: e.target.value })}
                    >
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                      <option value="Satisfactory">Satisfactory</option>
                      <option value="Requires Attention">Requires Attention</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: RECOMMENDATION */}
              <div className="space-y-4">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.ClipboardCheck className="w-4 h-4" />
                  <span>4. Inspector Recommendation & Notes</span>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                    Recommendation (Text area)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                    value={formValues.recommendation}
                    onChange={(e) => setFormValues({ ...formValues, recommendation: e.target.value })}
                    placeholder="Enter detailed technical recommendation, safety advisories, or operational remarks..."
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
                onClick={handleCreateReport}
                className="bg-[#683EFF] hover:bg-[#5229E0] text-white text-xs font-semibold py-2 px-5 rounded-lg shadow-sm transition-all cursor-pointer font-sans"
              >
                Generate Report Order
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
              <h3 className="text-lg font-bold text-slate-800 font-sans">Delete Inspection Report?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to permanently delete this inspection report record? This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteReport(confirmDeleteId)}
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
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 font-sans flex items-center gap-2">
                    <Icons.FileSpreadsheet className="w-5.5 h-5.5 text-[#683EFF]" />
                    Map CSV fields to inspection reports
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select fields from your CSV file to map against inspection report fields, or to ignore during import.
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

            {/* Mappings Table */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
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
                              <option value="id">Report ID / Reference</option>
                              <option value="namingSeries">Naming Series Prefix</option>
                              <option value="clientName">Client Name</option>
                              <option value="checklistNumber">Checklist Number</option>
                              <option value="stickerNo">Sticker Number</option>
                              <option value="jobNumber">Job Number</option>
                              <option value="timeSheetNumber">Time Sheet Number</option>
                              <option value="typeOfInspection">Type of Inspection</option>
                              <option value="equipmentName">Equipment Name</option>
                              <option value="equipmentLocation">Equipment Location</option>
                              <option value="address">Address</option>
                              <option value="inspectionDate">Inspection Date</option>
                              <option value="expirationData">Expiration Date (Expiry)</option>
                              <option value="validity">Validity Period</option>
                              <option value="travelToFrom">Travel To / From</option>
                              <option value="finalResult">Final Result (Pass/Fail)</option>
                              <option value="recommendation">Recommendation Details</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Informative Stats */}
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
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

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowImportMappingModal(false); setCsvMappingData(null); }}
                className="px-4 py-2 border border-slate-300 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="bg-[#683EFF] hover:bg-[#5229E0] text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer font-sans flex items-center gap-1.5"
              >
                <Icons.Check className="w-4 h-4" />
                Confirm & Import
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
