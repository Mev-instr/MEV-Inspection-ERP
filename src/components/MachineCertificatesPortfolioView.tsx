import { LoadChartDataEditor } from "./LoadChartDataEditor";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { MachineCertificate, InspectionReport, MachineDetail, EmployeeDetail, CustomerDetail } from "../types";
import { initialCustomers as staticCustomers } from "../data";
import { formatDate } from "../utils";
import { PrintMachineCertificatePreview } from "./PrintMachineCertificatePreview";
import { ImageUploadPicker } from "./ImageUploadPicker";

interface MachineCertificatesPortfolioProps {
  employees: EmployeeDetail[];
  customers?: CustomerDetail[];
  certificates: MachineCertificate[];
  onCertificatesChange: React.Dispatch<React.SetStateAction<MachineCertificate[]>>;
  inspectionReports?: InspectionReport[];
  machineDetails?: MachineDetail[];
  onUploadImage?: (file: File, clientName: string, subfolder: string, entityId?: string) => Promise<string>;
  allCertificateIds?: string[];
}

export function MachineCertificatesPortfolioView({ employees, customers = staticCustomers, certificates, onCertificatesChange, inspectionReports = [], machineDetails = [], onUploadImage, allCertificateIds = [] }: MachineCertificatesPortfolioProps) {
  // View states
  const [viewMode, setViewMode] = useState<"list" | "grid" | "compact">("list");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  
  // Search and Enter-key Tag filters
  const [filterInput, setFilterInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Row selection & interaction states
  const [selectedCertificateIds, setSelectedCertificateIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedCertificateDetail, setSelectedCertificateDetail] = useState<MachineCertificate | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Pagination configuration
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add Machine Certificate modal states
  const [showAddModal, setShowAddModal] = useState(false);

  // Autocomplete client dropdown states
  const [showClientAutocomplete, setShowClientAutocomplete] = useState(false);
  const [showReportAutocomplete, setShowReportAutocomplete] = useState(false);
  const [showMachineAutocomplete, setShowMachineAutocomplete] = useState(false);

  // New Machine Certificate Form State
  const initialFormState = {
    namingSeries: "MEV-CRT-26",
    inspectionReportNo: "",
    jobNumber: "",
    equipmentName: "",
    stickerNumber: "",
    timeSheetNumber: "",
    result: "",
    validity: "",
    checkList: "",
    clientName: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    location: "",
    expirationDate: "",
    equipmentLocation: "",
    typeOfInspection: "",
    nextInspectionDate: "",
    referenceStandard: "",
    inspectedBy: "",
    inspectedBySignature: "",
    authorizedBy: "",
    authorizedBySignature: "",
    recommendation: "",
    status: "Scheduled" as const,
    loadChartData: [],
    // Equipment Details
    machineId: "",
    manufacturer: "",
    modelName: "",
    serialNumber: "",
    dateOfMfg: "",
    ownerId: "",
    // Technical Details
    loadLimit: "",
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
  const [editFormValues, setEditFormValues] = useState<MachineCertificate | null>(null);
  const [showBulkActionDropdown, setShowBulkActionDropdown] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<{ field: "inspectedBySignature" | "authorizedBySignature", mode: "edit" | "create" } | null>(null);
  
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
    const toDuplicate = certificates.filter(j => selectedCertificateIds.includes(j.id));
    const duplicated = toDuplicate.map(j => ({
      ...j,
      id: `MEV-CRT-26-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      equipmentName: `${j.equipmentName} (Copy)`,
    }));
    onCertificatesChange((prev) => [...duplicated, ...prev]);
    showToast(`✓ Duplicated ${selectedCertificateIds.length} certificate orders`);
    setSelectedCertificateIds([]);
    setShowBulkActionDropdown(false);
  };

  const handleBulkExport = () => {
    const count = selectedCertificateIds.length;
    showToast(`✓ Exporting ${count} machine certificates to CSV...`);
    
    const headers = [
      "Naming Series Code prefix", "Inspection Report No", "Job Number", "Equipment Name",
      "Sticker Number", "Time Sheet Number", "Result", "Validity",
      "Check List", "Initial Status", "Client Name", "Location",
      "Equipment Location", "Inspection Date", "Expiration Date", "Type of Inspection",
      "Next Inspection Date", "Reference Standard", "Authorized By", "Inspected By",
      "Recommendation"
    ].join(",");

    const rows = certificates
      .filter(j => selectedCertificateIds.includes(j.id))
      .map(j => [
        j.namingSeries, j.inspectionReportNo, j.jobNumber, j.equipmentName,
        j.stickerNumber, j.timeSheetNumber, j.result, j.validity,
        j.checkList, j.status, j.clientName, j.location,
        j.equipmentLocation, j.inspectionDate, j.expirationDate, j.typeOfInspection,
        j.nextInspectionDate, j.referenceStandard, j.authorizedBy, j.inspectedBy,
        j.recommendation
      ].map(field => `"${String(field || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `machine_certificates_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSelectedCertificateIds([]);
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
        const importedCertificates: any[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 0 || !row[0]) continue;

          const getVal = (headerName: string) => {
            const idx = csvHeaders.indexOf(headerName.toLowerCase());
            return idx !== -1 && idx < row.length ? row[idx] : "";
          };

          const namingSeries = getVal("Naming Series Code prefix") || "MEV-MC-26";
          const clientName = getVal("Client Name");
          if (!clientName) continue;

          const finalId = calculateNextSequenceId(namingSeries);

          const inspectionReportNo = getVal("Inspection Report No");
          const jobNumber = getVal("Job Number");
          const equipmentName = getVal("Equipment Name") || "Heavy Machine";
          const stickerNumber = getVal("Sticker Number");
          const timeSheetNumber = getVal("Time Sheet Number");
          const result = getVal("Result") || "Pass";
          const validity = getVal("Validity");
          const checkList = getVal("Check List");
          const status = getVal("Initial Status") || "Active";
          const location = getVal("Location");
          const equipmentLocation = getVal("Equipment Location");
          const inspectionDate = getVal("Inspection Date") || new Date().toISOString().split("T")[0];
          const expirationDate = getVal("Expiration Date") || new Date().toISOString().split("T")[0];
          const typeOfInspection = getVal("Type of Inspection");
          const nextInspectionDate = getVal("Next Inspection Date");
          const referenceStandard = getVal("Reference Standard");
          const authorizedBy = getVal("Authorized By");
          const inspectedBy = getVal("Inspected By");
          const recommendation = getVal("Recommendation");

          const certificate = {
            id: finalId,
            namingSeries: namingSeries,
            inspectionReportNo: inspectionReportNo,
            jobNumber: jobNumber,
            equipmentName: equipmentName,
            stickerNumber: stickerNumber,
            timeSheetNumber: timeSheetNumber,
            result: result,
            validity: validity,
            checkList: checkList,
            clientName: clientName,
            inspectionDate: inspectionDate,
            location: location,
            expirationDate: expirationDate,
            equipmentLocation: equipmentLocation,
            typeOfInspection: typeOfInspection,
            nextInspectionDate: nextInspectionDate,
            referenceStandard: referenceStandard,
            inspectedBy: inspectedBy,
            inspectedBySignature: "",
            authorizedBy: authorizedBy,
            authorizedBySignature: "",
            recommendation: recommendation,
            status: status,
            operators: [],
            loadChartData: []
          };

          importedCertificates.push(certificate);
        }

        if (importedCertificates.length > 0) {
          onCertificatesChange((prev) => [...importedCertificates, ...prev]);
          showToast(`✓ Successfully imported ${importedCertificates.length} certificates.`);
        } else {
          showToast("⚠ No valid certificate entries found in the CSV.");
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
    const count = selectedCertificateIds.length;
    // Removing window.confirm for direct execution as it might be blocked in the iframe
    onCertificatesChange((prev) => prev.filter(j => !selectedCertificateIds.includes(j.id)));
    showToast(`✓ Successfully removed ${count} certificate records`);
    setSelectedCertificateIds([]);
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
    setSelectedCertificateIds([]);
    showToast("✓ Search query and filter tags reset.");
  };

  // Filtering criteria matches
  const filteredCertificates = certificates.filter((certificate) => {
    if (activeFilters.length === 0) return true;
    return activeFilters.every((kw) => {
      const criteria = kw.toLowerCase();
      return (
        certificate.id.toLowerCase().includes(criteria) ||
        (certificate.clientName || "").toLowerCase().includes(criteria) ||
        (certificate.location || "").toLowerCase().includes(criteria) ||
        (certificate.equipmentLocation || "").toLowerCase().includes(criteria) ||
        (certificate.inspectedBy || certificate.authorizedBy || "").toLowerCase().includes(criteria) ||
        (certificate.equipmentName || "").toLowerCase().includes(criteria) ||
        certificate.status.toLowerCase().includes(criteria)
      );
    });
  });

  // Pagination slices
  const totalItems = filteredCertificates.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCertificates = filteredCertificates.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Toggle checkout checkboxes
  const handleCheckboxChange = (id: string) => {
    if (selectedCertificateIds.includes(id)) {
      setSelectedCertificateIds(selectedCertificateIds.filter((x) => x !== id));
    } else {
      setSelectedCertificateIds([...selectedCertificateIds, id]);
    }
  };

  // Select all rows on current page
  const handleSelectAll = () => {
    const pageIds = paginatedCertificates.map((j) => j.id);
    const allSelected = pageIds.every((id) => selectedCertificateIds.includes(id));
    if (allSelected) {
      setSelectedCertificateIds(selectedCertificateIds.filter((id) => !pageIds.includes(id)));
    } else {
      const newIds = [...selectedCertificateIds];
      pageIds.forEach((id) => {
        if (!newIds.includes(id)) newIds.push(id);
      });
      setSelectedCertificateIds(newIds);
    }
  };

  // Autocomplete search suggestions
  const matchingCustomers = customers.filter((cust) => {
    if (!formValues.clientName.trim()) return true;
    return cust.companyName.toLowerCase().includes(formValues.clientName.toLowerCase());
  });

  // Auto-fill form values on selecting customer
  const handleSelectCustomer = (cust: typeof customers[0], isEditMode: boolean = false) => {
    const updates = {
      clientName: cust.companyName,
      location: cust.inspectionSiteAddress || "",
      equipmentLocation: cust.inspectionContactPerson || "",
      timeSheetNumber: cust.inspectionContactPhone || ""
    };
    if (isEditMode && editFormValues) {
      setEditFormValues(prev => prev ? ({ ...prev, ...updates }) : prev);
    } else {
      setFormValues((prev) => ({ ...prev, ...updates }));
    }
    setShowClientAutocomplete(false);
    showToast(`✓ Client details loaded from "${cust.companyName}". autofilled locations & contacts.`);
  };

  const handleSelectReport = (report: InspectionReport, isEditMode: boolean = false) => {
    let nextDate = "";
    if (report.expirationDate) {
      const expDate = new Date(report.expirationDate);
      if (!isNaN(expDate.getTime())) {
        expDate.setDate(expDate.getDate() + 1);
        nextDate = expDate.toISOString().split("T")[0];
      }
    }

    const updates = {
      inspectionReportNo: report.id,
      jobNumber: report.jobNumber || "",
      equipmentName: report.equipmentName || report.assetTested || "",
      stickerNumber: report.stickerNo || "",
      timeSheetNumber: report.timeSheetNumber || "",
      result: report.finalResult || report.status || "",
      validity: report.validity || "",
      checkList: report.checklistNumber || "",
      clientName: report.clientName || "",
      inspectionDate: report.inspectionDate || report.testDate || "",
      location: report.location || "",
      expirationDate: report.expirationDate || "",
      equipmentLocation: report.equipmentLocation || "",
      typeOfInspection: report.typeOfInspection || "",
      nextInspectionDate: nextDate
    };
    if (isEditMode && editFormValues) {
      setEditFormValues(prev => prev ? ({ ...prev, ...updates }) : prev);
    } else {
      setFormValues((prev) => ({ ...prev, ...updates }));
    }
    setShowReportAutocomplete(false);
    showToast(`✓ Fetched data from inspection report "${report.id}".`);
  };

  // Autocomplete machine suggestions
  const matchingMachines = (machineDetails || []).filter((m) => {
    if (!formValues.machineId.trim()) return true;
    return m.id.toLowerCase().includes(formValues.machineId.toLowerCase());
  }).slice(0, 5);

  const handleSelectMachine = (m: MachineDetail, isEditMode: boolean = false) => {
    const updates = {
      machineId: m.id,
      equipmentName: m.machineName || "",
      manufacturer: m.manufacturer || "",
      modelName: "", // Explicitly blank as requested
      serialNumber: "", // Explicitly blank as requested
      dateOfMfg: "", // Explicitly blank as requested
      // Technical
      loadLimit: m.swl || "",
      maxOutreach: m.maxOutreach || "",
      bucketCapacity: m.bucketCapacity || "",
      enginePower: m.enginePower || "",
      boomLength: m.boomLength || "",
      wheelType: m.wheelType || "",
      maxPlatformHeight: m.maxPlatformHeight || "",
      heoBucketCapacity: m.heoBucketCapacity || "",
      engineSpeed: m.engineSpeed || "",
      angleOfSpan: m.angleOfSpan || "",
      personAllowed: m.personAllowed || "",
    };
    if (isEditMode && editFormValues) {
      setEditFormValues(prev => prev ? ({ ...prev, ...updates }) : prev);
    } else {
      setFormValues((prev) => ({ ...prev, equipmentName: m.machineName || prev.equipmentName, ...updates }));
    }
    setShowMachineAutocomplete(false);
    showToast(`✓ Machine model details loaded for "${m.id}". Equipment details (Model/Serial/Mfg) left blank for manual entry.`);
  };

  // Helper calculation to auto-generate the next MEV-CRT-26-XXXX sequence
  const calculateNextSequenceId = (seriesInput: string): string => {
    const cleanSeries = seriesInput.trim() || "MEV-CRT-26";
    
    // If the input matches a manually entered ID other than the default prefix, return it directly.
    if (cleanSeries !== "MEV-CRT-26") {
      return cleanSeries;
    }

    // Otherwise, find the maximum suffix number in current certificates starting with MEV-CRT-26
    let maxSuffix = 1000; // Starting baseline suffix count
    const matchingIds = allCertificateIds.length > 0 ? allCertificateIds.filter((id) => id.startsWith("MEV-CRT-26-")) : certificates.map(c => c.id).filter((id) => id.startsWith("MEV-CRT-26-"));
    matchingIds.forEach((id) => {
      const parts = id.split("-");
      const suffixCode = parts[parts.length - 1];
      const numericVal = parseInt(suffixCode, 10);
      if (!isNaN(numericVal) && numericVal > maxSuffix) {
        maxSuffix = numericVal;
      }
    });

    return `MEV-CRT-26-${maxSuffix + 1}`;
  };

  // Handle Form Submission / Certificate Creation
  const handleCreateCertificate = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formValues.clientName.trim()) {
      errors.clientName = "Client Name is required";
    }
    if (!formValues.location.trim()) {
      errors.location = "Location is required";
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

    const newCertificate: MachineCertificate = {
      id: finalId,
      namingSeries: formValues.namingSeries,
      inspectionReportNo: formValues.inspectionReportNo,
      jobNumber: formValues.jobNumber,
      equipmentName: formValues.equipmentName,
      stickerNumber: formValues.stickerNumber,
      timeSheetNumber: formValues.timeSheetNumber,
      result: formValues.result,
      validity: formValues.validity,
      checkList: formValues.checkList,
      clientName: formValues.clientName,
      inspectionDate: formValues.inspectionDate,
      location: formValues.location,
      expirationDate: formValues.expirationDate,
      equipmentLocation: formValues.equipmentLocation,
      typeOfInspection: formValues.typeOfInspection,
      nextInspectionDate: formValues.nextInspectionDate,
      referenceStandard: formValues.referenceStandard,
      inspectedBy: formValues.inspectedBy,
      inspectedBySignature: formValues.inspectedBySignature,
      authorizedBy: formValues.authorizedBy,
      authorizedBySignature: formValues.authorizedBySignature,
      recommendation: formValues.recommendation,
      status: formValues.status,
      // Equipment Details
      manufacturer: formValues.manufacturer,
      modelName: formValues.modelName,
      serialNumber: formValues.serialNumber,
      dateOfMfg: formValues.dateOfMfg,
      ownerId: formValues.ownerId,
      // Technical Details
      loadLimit: formValues.loadLimit,
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

    onCertificatesChange((prev) => [newCertificate, ...prev]);
    setShowAddModal(false);
    setFormValues(initialFormState);
    setFormErrors({});
    showToast(`✓ Machine certificate ${newCertificate.id} generated successfully.`);
  };

  // Save changes done in page detail view
  const handleSaveDetailChanges = () => {
    if (!editFormValues) return;
    
    const finalCertificate = { ...editFormValues, operators: [...operatorRows] };
    // Propagate changes to outer state hook
    onCertificatesChange((prev) =>
      prev.map((j) => (j.id === finalCertificate.id ? finalCertificate : j))
    );
    setSelectedCertificateDetail(finalCertificate);
    setIsEditingInDetail(false);
    showToast("✓ Training details updated successfully.");
  };

  // Quick navigation buttons in detail page
  const currentDetailIndex = certificates.findIndex((j) => j.id === selectedCertificateDetail?.id);
  
  const handlePrevDetail = () => {
    if (currentDetailIndex > 0) {
      setSelectedCertificateDetail(certificates[currentDetailIndex - 1]);
      setIsEditingInDetail(false);
    } else {
      showToast("First machine certificate reached.");
    }
  };

  const handleNextDetail = () => {
    if (currentDetailIndex < certificates.length - 1) {
      setSelectedCertificateDetail(certificates[currentDetailIndex + 1]);
      setIsEditingInDetail(false);
    } else {
      showToast("Last machine certificate reached.");
    }
  };

  // Delete machine certificate
  const handleDeleteCertificate = (id: string) => {
    onCertificatesChange((prev) => prev.filter((j) => j.id !== id));
    setSelectedCertificateIds(selectedCertificateIds.filter((x) => x !== id));
    if (selectedCertificateDetail?.id === id) {
      setSelectedCertificateDetail(null);
    }
    showToast("✓ Training certificate order removed from workspace.");
    setConfirmDeleteId(null);
  };

  // Export JSON summary of certificate
  const handleExportCertificateJson = (certificate: MachineCertificate) => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(certificate, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `training_certificate_${certificate.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("✓ Downloaded machine certificate JSON.");
    } catch {
      showToast("Error exporting JSON.");
    }
  };

  // Trigger print document simulator
  const handlePrintCertificate = (certificate: MachineCertificate) => {
    setShowPrintPreview(true);
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
    showToast("✓ Added notes to this certificate's active audit trail.");
  };

  // Initializing edit form state
  useEffect(() => {
    if (selectedCertificateDetail) {
      setEditFormValues({ ...selectedCertificateDetail });
      setOperatorRows(selectedCertificateDetail.operators || []);
    } else {
      setOperatorRows([]);
    }
  }, [selectedCertificateDetail]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ==========================================
  // RENDER DETAILED PAGE ROUTE IF SELECTED
  // ==========================================
  if (selectedCertificateDetail) {
    if (showPrintPreview) {
      return <PrintMachineCertificatePreview certificate={selectedCertificateDetail} onClose={() => setShowPrintPreview(false)} />;
    }

    const certificate = selectedCertificateDetail;
    const isLiked = !!favorites[certificate.id];
    
    // We synchronize values if they exists on certificate. Otherwise map back from courseTitle/trainerId to prevent blank states
    const dispClient = certificate.clientName || "General Partner Client";
    const dispEndDate = certificate.expirationDate || certificate.nextInspectionDate || "N/A";
    const dispStartDate = certificate.inspectionDate || "N/A";
    const dispTrainer = certificate.inspectedBy || "Zaid Mansoor";
    const dispLoc = certificate.location || "Logistics Yard Site";
    
    const dispAttLoc = certificate.equipmentLocation || "Eastern Province";
    const dispAttPhone = certificate.timeSheetNumber || "TS-000";
    const dispMachine = certificate.equipmentName || "Industrial Crane Simulator";
    const dispMachineCount = certificate.machineCount || "1";

    return (
      <div className="space-y-6" id="training-detail-route">
        
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
              onClick={() => setSelectedCertificateDetail(null)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#683EFF] hover:border-[#683EFF] transition-all shadow-sm group animate-in fade-in"
              title="Go Back"
            >
              <Icons.ArrowLeft className="w-4.5 h-4.5 group-active:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400 font-medium font-sans">
                <button onClick={() => setSelectedCertificateDetail(null)} className="hover:text-[#683EFF] font-semibold transition-colors">
                  Machine Certificates
                </button>
                <Icons.ChevronRight className="w-3 h-3 text-slate-350" />
                <span className="font-bold text-slate-700 truncate max-w-[200px]">{certificate.id}</span>
              </div>
            </div>
          </div>

          {/* Action Row Sidebar side buttons */}
          <div className="flex items-center flex-wrap gap-2 self-stretch md:self-auto justify-end">
            
            {/* Action buttons (Print, Export, Delete) */}
            <button
              onClick={() => handlePrintCertificate(certificate)}
              className="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-xs font-bold"
            >
              <Icons.Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={() => setConfirmDeleteId(certificate.id)}
              title="Permamently Delete"
              className="px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
            >
              <Icons.Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            {/* Pagination Controls between records */}
            <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm h-[36px]">
              <button
                onClick={handlePrevDetail}
                disabled={currentDetailIndex <= 0}
                className="p-2 hover:bg-slate-50 text-slate-500 disabled:opacity-35 border-r border-slate-200 transition-colors"
                title="Previous machine certificate"
              >
                <Icons.ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDetail}
                disabled={currentDetailIndex >= certificates.length - 1}
                className="p-2 hover:bg-slate-50 text-slate-500 disabled:opacity-35 transition-colors"
                title="Next machine certificate"
              >
                <Icons.ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle edit in page or save directly */}
            {isEditingInDetail ? (
              <button
                onClick={handleSaveDetailChanges}
                className="bg-[#683EFF] hover:bg-[#5229E0] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold text-sm shadow-sm transition-all w-full md:w-auto"
              >
                <Icons.Save className="w-4 h-4" />
                <span>SAVE</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditingInDetail(true)}
                className="bg-[#683EFF] hover:bg-[#5229E0] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold text-sm shadow-sm transition-all w-full md:w-auto"
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
              {certificate.id.substring(0, 2).toUpperCase()}
            </div>

            {/* Client Naming details */}
            <h3 className="font-display font-bold text-slate-800 text-lg mt-4 leading-snug">
              {dispClient}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">Order: {certificate.id}</p>

            {/* Result interactive selector */}
            <div className="mt-3">
              <select
                value={isEditingInDetail && editFormValues ? editFormValues.result : certificate.result}
                onChange={(e) => {
                  const val = e.target.value as any;
                  if (isEditingInDetail && editFormValues) {
                    setEditFormValues({ ...editFormValues, result: val });
                  } else {
                    onCertificatesChange((prev) =>
                      prev.map((item) => (item.id === certificate.id ? { ...item, result: val } : item))
                    );
                    setSelectedCertificateDetail((prev) => (prev ? { ...prev, result: val } : null));
                    showToast(`✓ Inspection result changed to: ${val}`);
                  }
                }}
                className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer focus:outline-none border transition-colors ${
                  (isEditingInDetail && editFormValues ? editFormValues.result : certificate.result) === "Pass"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    : (isEditingInDetail && editFormValues ? editFormValues.result : certificate.result) === "Fail"
                    ? "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                    : "bg-[#F0EBFF] text-[#683EFF] border-[#683EFF]/20 hover:bg-[#E2D9FF]"
                }`}
              >
                <option value="Pass">✅ Pass</option>
                <option value="Fail">❌ Fail</option>
              </select>
            </div>

            {/* Static & Dynamic details rows */}
            <div className="w-full mt-6 pt-5 border-t border-slate-100 space-y-3.5 text-left text-xs text-slate-600 font-medium">
              
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <Icons.Key className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 font-medium font-sans">Report No</span>
                    </div>
                    <span className="font-normal font-sans text-slate-800">{certificate.inspectionReportNo || "N/A"}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <Icons.Hash className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 font-medium font-sans">Job Number</span>
                    </div>
                    <span className="font-normal font-sans text-slate-800">{certificate.jobNumber || "N/A"}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <Icons.UserCheck className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 font-medium font-sans">Inspected By</span>
                    </div>
                    <span className="font-normal font-sans text-slate-800">{dispTrainer}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <Icons.Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 font-medium font-sans">Inspection Date</span>
                    </div>
                    <span className="font-normal font-sans text-slate-705">{dispStartDate}</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Icons.CalendarCheck className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 font-medium font-sans">Expiration Date</span>
                    </div>
                    <span className="font-normal font-sans text-slate-705">{certificate.expirationDate || "N/A"}</span>
                  </div>

            </div>

            {/* Bookmarks heart trigger button */}
            <div className="w-full mt-5">
              <button
                type="button"
                onClick={(e) => toggleFavorite(certificate.id, e)}
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
            <div className="border-b border-[#ECECF3] flex gap-6 select-none shrink-0" id="training-detail-tabbed-navigation">
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
                
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="space-y-6">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.FileText className="w-4 h-4" />
                  <span>1. Machine Certificate Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Naming Series Code prefix
                    </label>
                    <input
                        disabled={!isEditingInDetail}
                      type="text"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal text-slate-800 font-sans"
                      value={isEditingInDetail && editFormValues ? editFormValues.namingSeries || "" : certificate.namingSeries || ""}
                      onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, namingSeries: e.target.value }); }}
                      placeholder="MEV-CRT-26"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Inspection Report No
                    </label>
                    <div className="relative">
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans pr-8"
                        value={isEditingInDetail && editFormValues ? editFormValues.inspectionReportNo || "" : certificate.inspectionReportNo || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, inspectionReportNo: e.target.value });
                          setShowReportAutocomplete(true);
                        }}
                        onFocus={() => setShowReportAutocomplete(true)}
                        placeholder="Search inspection reports..."
                      />
                      <Icons.ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    
                    {/* Autocomplete Overlay menu */}
                    {showReportAutocomplete && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowReportAutocomplete(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                          {inspectionReports.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-slate-500 italic text-center">
                              No reports found.
                            </div>
                          ) : (
                            inspectionReports
                              .filter((report) => report.id.toLowerCase().includes((isEditingInDetail && editFormValues ? editFormValues.inspectionReportNo : certificate.inspectionReportNo).toLowerCase()))
                              .map((report) => (
                                <button
                                  key={report.id}
                                  type="button"
                                  onClick={() => handleSelectReport(report, true)}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] flex justify-between items-center transition-colors"
                                >
                                  <span>{report.id}</span>
                                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{report.jobNumber || "N/A"}</span>
                                </button>
                              ))
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Job Number
                    </label>
                    <input
                        disabled={!isEditingInDetail}
                      type="text"
                      
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={isEditingInDetail && editFormValues ? editFormValues.jobNumber || "" : certificate.jobNumber || ""}
                      onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, jobNumber: e.target.value }); }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Equipment Name *
                    </label>
                    <input
                        disabled={!isEditingInDetail}
                      type="text"
                      
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans border-slate-200`}
                      value={isEditingInDetail && editFormValues ? editFormValues.equipmentName || "" : certificate.equipmentName || ""}
                      onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, equipmentName: e.target.value }); }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Sticker Number
                    </label>
                    <input
                        disabled={!isEditingInDetail}
                      type="text"
                      
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={isEditingInDetail && editFormValues ? editFormValues.stickerNumber || "" : certificate.stickerNumber || ""}
                      onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, stickerNumber: e.target.value }); }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Time Sheet Number
                    </label>
                    <input
                        disabled={!isEditingInDetail}
                      type="text"
                      
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={isEditingInDetail && editFormValues ? editFormValues.timeSheetNumber || "" : certificate.timeSheetNumber || ""}
                      onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, timeSheetNumber: e.target.value }); }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Result
                    </label>
                    <input
                        disabled={!isEditingInDetail}
                      type="text"
                      
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={isEditingInDetail && editFormValues ? editFormValues.result || "" : certificate.result || ""}
                      onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, result: e.target.value }); }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Validity
                    </label>
                    <input
                        disabled={!isEditingInDetail}
                      type="text"
                      
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={isEditingInDetail && editFormValues ? editFormValues.validity || "" : certificate.validity || ""}
                      onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, validity: e.target.value }); }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Check List
                    </label>
                    <input
                        disabled={!isEditingInDetail}
                      type="text"
                      
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={isEditingInDetail && editFormValues ? editFormValues.checkList || "" : certificate.checkList || ""}
                      onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, checkList: e.target.value }); }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Initial Status
                    </label>
                    <select
                        disabled={!isEditingInDetail}
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none bg-slate-50 font-normal font-sans"
                      value={isEditingInDetail && editFormValues ? editFormValues.status || "" : certificate.status || ""}
                      onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, status: e.target.value as any }) }}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* SECTION 3: INSPECTION DATES & DETAILS (Relocated to Basic tab) */}
                <div className="space-y-4 mt-6">
                  <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-bold flex items-center gap-2 select-none">
                    <Icons.Calendar className="w-4 h-4" />
                    <span>2. Inspection Dates & Specifications</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Inspection Date
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="date"
                        
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.inspectionDate || "" : certificate.inspectionDate || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, inspectionDate: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Expiration Date
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="date"
                        
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.expirationDate || "" : certificate.expirationDate || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, expirationDate: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Type of Inspection
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.typeOfInspection || "" : certificate.typeOfInspection || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, typeOfInspection: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Next Inspection Date
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="date"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.nextInspectionDate || "" : certificate.nextInspectionDate || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, nextInspectionDate: e.target.value }); }}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Reference Standard
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.referenceStandard || "" : certificate.referenceStandard || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, referenceStandard: e.target.value }); }}
                        placeholder="e.g. ANSI/ASME B30.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CLIENT & LOCATION DETAILS */}
              <div className="space-y-4">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.Building className="w-4 h-4" />
                  <span>3. Client & Location Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Client Name *
                    </label>
                    <div className="relative">
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        
                        className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans border-slate-200`}
                        onFocus={() => setShowClientAutocomplete(true)}
                        value={isEditingInDetail && editFormValues ? editFormValues.clientName || "" : certificate.clientName || ""}
                        onChange={(e) => {
                          if (editFormValues) setEditFormValues({ ...editFormValues, clientName: e.target.value });
                          setShowClientAutocomplete(true);
                        }}
                        placeholder="e.g. Aramco, NEOM..."
                      />
                      <Icons.ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

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
                                onClick={() => handleSelectCustomer(cust, true)}
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
                      Location *
                    </label>
                    <input
                        disabled={!isEditingInDetail}
                      type="text"
                      
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans border-slate-200`}
                      value={isEditingInDetail && editFormValues ? editFormValues.location || "" : certificate.location || ""}
                      onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, location: e.target.value }); }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Equipment Location
                    </label>
                    <input
                        disabled={!isEditingInDetail}
                      type="text"
                      
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={isEditingInDetail && editFormValues ? editFormValues.equipmentLocation || "" : certificate.equipmentLocation || ""}
                      onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, equipmentLocation: e.target.value }); }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Equipment details */}
              <div className="space-y-6">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.Settings className="w-4 h-4" />
                  <span>4. Equipment details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Machine ID
                      </label>
                      <div className="relative">
                        <input
                        disabled={!isEditingInDetail}
                          type="text"
                          className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                          value={isEditingInDetail && editFormValues ? editFormValues.machineId || "" : certificate.machineId || ""}
                          onChange={(e) => {
                            if (editFormValues) setEditFormValues({ ...editFormValues, machineId: e.target.value });
                            setShowMachineAutocomplete(true);
                          }}
                          onFocus={() => setShowMachineAutocomplete(true)}
                          placeholder="Search machine ID..."
                        />
                        <Icons.ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>

                      {showMachineAutocomplete && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowMachineAutocomplete(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                            {matchingMachines.length === 0 ? (
                              <div className="px-4 py-3 text-xs italic text-slate-400 text-center">
                                No machine models found.
                              </div>
                            ) : (
                              matchingMachines.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleSelectMachine(m, true)}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] flex justify-between items-center transition-colors"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-bold">{m.id}</span>
                                    <span className="text-[10px] text-slate-400">{m.machineName}</span>
                                  </div>
                                  <Icons.ArrowRight className="w-3 h-3 text-slate-300" />
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Equipment Name
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.equipmentName || "" : certificate.equipmentName || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, equipmentName: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Manufacturer
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.manufacturer || "" : certificate.manufacturer || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, manufacturer: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Model
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.modelName || "" : certificate.modelName || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, modelName: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Serial Number
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.serialNumber || "" : certificate.serialNumber || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, serialNumber: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Date of Mfg
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.dateOfMfg || "" : certificate.dateOfMfg || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, dateOfMfg: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Owner ID / Plate No.
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.ownerId || "" : certificate.ownerId || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, ownerId: e.target.value }); }}
                      />
                    </div>
                  </div>
                </div>

              {/* SECTION 4: Technical details */}
              <div className="space-y-6">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.Cpu className="w-4 h-4" />
                  <span>5. Technical details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3 relative">
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Machine ID
                      </label>
                      <div className="relative">
                        <input
                        disabled={!isEditingInDetail}
                          type="text"
                          className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                          value={isEditingInDetail && editFormValues ? editFormValues.machineId || "" : certificate.machineId || ""}
                          onChange={(e) => {
                            if (editFormValues) setEditFormValues({ ...editFormValues, machineId: e.target.value });
                            setShowMachineAutocomplete(true);
                          }}
                          onFocus={() => setShowMachineAutocomplete(true)}
                          placeholder="Search machine ID..."
                        />
                        <Icons.ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>

                      {showMachineAutocomplete && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowMachineAutocomplete(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                            {matchingMachines.length === 0 ? (
                              <div className="px-4 py-3 text-xs italic text-slate-400 text-center">
                                No machine models found.
                              </div>
                            ) : (
                              matchingMachines.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleSelectMachine(m, true)}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] flex justify-between items-center transition-colors"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-bold">{m.id}</span>
                                    <span className="text-[10px] text-slate-400">{m.machineName}</span>
                                  </div>
                                  <Icons.ArrowRight className="w-3 h-3 text-slate-300" />
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Load Limit (S.W.L)
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.loadLimit || "" : certificate.loadLimit || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, loadLimit: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Max Horizontal Outreach
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.maxOutreach || "" : certificate.maxOutreach || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, maxOutreach: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Bucket Capacity
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.bucketCapacity || "" : certificate.bucketCapacity || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, bucketCapacity: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Engine Power
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.enginePower || "" : certificate.enginePower || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, enginePower: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Boom Length
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.boomLength || "" : certificate.boomLength || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, boomLength: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Wheel Type
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.wheelType || "" : certificate.wheelType || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, wheelType: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Max Platform Height
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.maxPlatformHeight || "" : certificate.maxPlatformHeight || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, maxPlatformHeight: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Hoe Bucket Capacity
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.heoBucketCapacity || "" : certificate.heoBucketCapacity || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, heoBucketCapacity: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Engine Speed
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.engineSpeed || "" : certificate.engineSpeed || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, engineSpeed: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Angle of Span
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.angleOfSpan || "" : certificate.angleOfSpan || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, angleOfSpan: e.target.value }); }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Person Allowed
                      </label>
                      <input
                        disabled={!isEditingInDetail}
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={isEditingInDetail && editFormValues ? editFormValues.personAllowed || "" : certificate.personAllowed || ""}
                        onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, personAllowed: e.target.value }); }}
                      />
                    </div>
                  </div>
                </div>

              {/* SECTION 6: RECOMMENDATIONS & DATA */}
              <div className="space-y-6">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.FileText className="w-4 h-4" />
                  <span>6. Recommendations & Data</span>
                </div>

                <div className="grid grid-cols-1 gap-6 pt-2">
                  <div className="mt-4">
                    <LoadChartDataEditor
                      data={(isEditingInDetail && editFormValues ? editFormValues.loadChartData : certificate.loadChartData) || []}
                      onChange={(data) => { if (editFormValues) setEditFormValues({ ...editFormValues, loadChartData: data }) }}
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Recommendation
                    </label>
                    <textarea
                        disabled={!isEditingInDetail}
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans min-h-[80px]"
                      value={isEditingInDetail && editFormValues ? editFormValues.recommendation || "" : certificate.recommendation || ""}
                      onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, recommendation: e.target.value }); }}
                      placeholder="Enter recommendations..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 7: AUTHORIZED & INSPECTED SIGNATURES */}
              <div className="space-y-6">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.PenTool className="w-4 h-4" />
                  <span>7. Authorized and Inspected Signatures</span>
                </div>

                <div className="grid grid-cols-1 gap-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Authorized By Section */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                          Authorized By
                        </label>
                        <input
                        disabled={!isEditingInDetail}
                          type="text"
                          className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                          value={isEditingInDetail && editFormValues ? editFormValues.authorizedBy || "" : certificate.authorizedBy || ""}
                          onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, authorizedBy: e.target.value }); }}
                        />
                      </div>

                      {/* Authorized Signature Box */}
                      <div className="bg-white border rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] relative w-full group overflow-hidden border-slate-200">
                        <Icons.Upload className="w-5 h-5 text-slate-400 mb-2 opacity-50 relative z-10" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Authorized Signature</span>
                        {(isEditingInDetail && editFormValues ? editFormValues.authorizedBySignature : certificate.authorizedBySignature) ? (
                          <div className="relative group/sig">
                            <img src={(isEditingInDetail && editFormValues ? editFormValues.authorizedBySignature : certificate.authorizedBySignature)} alt="Authorized" className="max-h-16 object-contain mt-2 z-10 relative" />
                            {isEditingInDetail && (<button type="button" onClick={(e) => { e.stopPropagation(); if (editFormValues) setEditFormValues({ ...editFormValues, authorizedBySignature: "" }); showToast("✓ Signature removed."); }} className="absolute -top-1 -right-1 p-1.5 bg-rose-500 text-white rounded-full shadow-lg z-30 hover:bg-rose-600 transition-colors"><Icons.X className="w-3 h-3" /></button>)}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold relative z-10 mt-1">Upload Signature</span>
                        )}
                        <div onClick={() => { if (isEditingInDetail) setPickerTarget({ field: "authorizedBySignature", mode: "edit" }); }} className="absolute inset-0 z-20 cursor-pointer"></div>
                      </div>
                    </div>

                    {/* Inspected By Section */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                          Inspected By
                        </label>
                        <input
                        list="employees-list"
                        disabled={!isEditingInDetail}
                          type="text"
                          className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                          value={isEditingInDetail && editFormValues ? editFormValues.inspectedBy || "" : certificate.inspectedBy || ""}
                          onChange={(e) => { if (editFormValues) setEditFormValues({ ...editFormValues, inspectedBy: e.target.value }); }}
                          placeholder="Search employee..."
                        />
                        <datalist id="employees-list">
                          {employees?.map(e => <option key={e.id} value={e.name || e.firstName || e.id}>{e.id} - {e.role || e.designation}</option>)}
                        </datalist>
                      </div>

                      {/* Inspected Signature Box */}
                      <div className="bg-white border rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] relative w-full group overflow-hidden border-slate-200">
                        <Icons.Upload className="w-5 h-5 text-slate-400 mb-2 opacity-50 relative z-10" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Inspected Signature</span>
                        {(isEditingInDetail && editFormValues ? editFormValues.inspectedBySignature : certificate.inspectedBySignature) ? (
                          <div className="relative group/sig">
                            <img src={(isEditingInDetail && editFormValues ? editFormValues.inspectedBySignature : certificate.inspectedBySignature)} alt="Inspected" className="max-h-16 object-contain mt-2 z-10 relative" />
                            {isEditingInDetail && (<button type="button" onClick={(e) => { e.stopPropagation(); if (editFormValues) setEditFormValues({ ...editFormValues, inspectedBySignature: "" }); showToast("✓ Signature removed."); }} className="absolute -top-1 -right-1 p-1.5 bg-rose-500 text-white rounded-full shadow-lg z-30 hover:bg-rose-600 transition-colors"><Icons.X className="w-3 h-3" /></button>)}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold relative z-10 mt-1">Upload Signature</span>
                        )}
                        <div onClick={() => { if (isEditingInDetail) setPickerTarget({ field: "inspectedBySignature", mode: "edit" }); }} className="absolute inset-0 z-20 cursor-pointer"></div>
                      </div>
                    </div>
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
                          <p className="text-xs font-bold text-slate-800">Training certificate verification logs updated</p>
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
                <h3 className="text-lg font-bold text-slate-800 font-sans">Delete Machine Certificate?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Are you sure you want to permanently delete this machine certificate record? This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6 w-full">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteCertificate(confirmDeleteId)}
                    className="flex-1 px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-all shadow-md shadow-rose-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {pickerTarget && (
          <ImageUploadPicker
            clientName={pickerTarget.mode === "edit" ? (editFormValues?.clientName || "General") : (formValues.clientName || "General")}
            subfolder="Machine Certificate"
            onClose={() => setPickerTarget(null)}
            onImageSelect={(url) => {
              if (pickerTarget.mode === "edit" && editFormValues) {
                setEditFormValues({ ...editFormValues, [pickerTarget.field]: url });
              } else {
                setFormValues({ ...formValues, [pickerTarget.field]: url });
              }
              setPickerTarget(null);
              showToast(`✓ Signature selected successfully!`);
            }}
          />
        )}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#0E1B2D] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-750 animate-slide-in">
            <Icons.Info className="w-4 h-4 text-[#683EFF]" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER MASTER PORTFOLIO LIST VIEW DEFAULT
  // ==========================================
  return (
    <div className="space-y-6" id="training-portfolio-view-container">

      {/* 1. Header with custom tags metadata and Add Machine Certificate Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-[#683EFF] font-bold tracking-wider uppercase">
            <span>Operations Management</span>
            <span className="text-slate-300">/</span>
            <span className="bg-[#F0EBFF] px-2 py-0.5 rounded text-[10px]">Training list page</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-800 tracking-tight">
            Machine Certificates Portfolio
          </h2>
        </div>

        {/* Header Action controls */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto relative">
          
          {/* Bulk Actions Bar Integrated directly into the row, appeared on the left of dropdown */}
          {selectedCertificateIds.length > 0 && (
            <div className="bg-[#FFF5F5] border border-rose-100 rounded-xl p-1 px-3 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-[11px] font-black uppercase tracking-[0.1em] text-rose-600 whitespace-nowrap">
                SELECTED: {selectedCertificateIds.length}
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
            onClick={() => document.getElementById("csv-import-certificates-input")?.click()}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:border-[#683EFF] hover:text-[#683EFF] rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            title="Import Machine Certificates from CSV"
          >
            <Icons.Upload className="w-4 h-4 text-slate-400 hover:text-[#683EFF]" />
            <span>Import</span>
          </button>
          <input
            id="csv-import-certificates-input"
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

          {/* Add Machine Certificate master trigger */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#683EFF] hover:bg-[#5229E0] text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 text-sm shadow-sm transition-all"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Add Machine Certificate</span>
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
      {filteredCertificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-white border border-slate-200 shadow-sm min-h-[350px]">
          <div className="p-4 bg-slate-50 text-slate-450 text-slate-440 rounded-full mb-4">
            <Icons.Inbox className="w-10 h-10 text-slate-405 text-slate-400" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-800 font-sans">No Records Found</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
            We couldn't find any machine certificates matching: {activeFilters.join(", ") || "(none)"}. Reset filters to see all.
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
              Add Machine Certificate
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
                          checked={paginatedCertificates.length > 0 && paginatedCertificates.every((j) => selectedCertificateIds.includes(j.id))}
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
                    {paginatedCertificates.map((certificate) => {
                      const isSelected = selectedCertificateIds.includes(certificate.id);
                      const isLiked = !!favorites[certificate.id];
                      
                      const dispClient = certificate.clientName || (certificate.id === "TRN-2026-001" || certificate.id === "CERT-2026-1100" ? "Saudi Aramco" : certificate.id === "TRN-2026-002" || certificate.id === "CERT-2026-1101" ? "NEOM Construction" : "Red Sea Global");
                      const dispEndDate = certificate.expirationDate || certificate.nextInspectionDate || "N/A";
                      const dispLoc = certificate.location || "Gulf Yard Hub";
                      
                      // Combined Attention Location/Phone info
                      const dispAttLoc = certificate.equipmentLocation || (dispClient === "Saudi Aramco" ? "Dhahran" : dispClient === "NEOM Construction" ? "Tabuk" : "Jeddah");
                      const dispAttPhone = certificate.timeSheetNumber || (dispClient === "Saudi Aramco" ? "TS-101" : dispClient === "NEOM Construction" ? "TS-102" : "TS-103");

                      return (
                        <tr
                          key={certificate.id}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${isSelected ? "bg-[#F0EBFF]/20" : ""}`}
                          onClick={() => setSelectedCertificateDetail(certificate)}
                        >
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(certificate.id)}
                              className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                            />
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-mono text-[#683EFF] font-bold">{certificate.id}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Icons.Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-slate-600 font-medium">{formatDate(certificate.inspectionDate || "N/A")}</span>
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
                              certificate.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                              certificate.status === "In Progress" ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-500"
                            }`}>
                              {certificate.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCertificateDetail(certificate);
                                }}
                                className="p-1.5 text-slate-400 hover:text-[#683EFF] hover:bg-[#F0EBFF] rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Icons.Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(certificate.id);
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
              {paginatedCertificates.map((certificate) => {
                const isSelected = selectedCertificateIds.includes(certificate.id);
                const isLiked = !!favorites[certificate.id];
                
                const dispClient = certificate.clientName || "General Partner";
                const dispEndDate = certificate.expirationDate || certificate.nextInspectionDate || "N/A";
                const dispLoc = certificate.location || "Logistics Yard Site";
                const dispMachine = certificate.equipmentName || "Safety Crane";

                return (
                  <div
                    key={certificate.id}
                    onClick={() => setSelectedCertificateDetail(certificate)}
                    className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between min-h-[220px] ${
                      isSelected ? "border-[#683EFF] ring-1 ring-[#683EFF]/35" : "border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          certificate.status === "Completed" ? "bg-emerald-50 text-emerald-800" : "bg-[#F0EBFF] text-[#683EFF]"
                        }`}>
                          {certificate.status}
                        </span>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleCheckboxChange(certificate.id)} className="p-1 text-slate-400 hover:text-[#683EFF]">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 text-[#683EFF] border-slate-300 rounded cursor-pointer"
                            />
                          </button>
                          <button onClick={(e) => toggleFavorite(certificate.id, e)} className="p-1">
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
                        ID Suffix: {certificate.id}
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
                      <span className="text-slate-500 font-bold">Inspected by: {certificate.inspectedBy || "Zaid M."}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* C. COMPACT VIEW MODE */}
          {viewMode === "compact" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
              {paginatedCertificates.map((certificate) => {
                const isSelected = selectedCertificateIds.includes(certificate.id);
                const isLiked = !!favorites[certificate.id];
                
                const dispClient = certificate.clientName || "General Partner";
                const dispEndDate = certificate.expirationDate || certificate.nextInspectionDate || "N/A";
                const dispLoc = certificate.location || "Logistics Yard Site";

                return (
                  <div
                    key={certificate.id}
                    onClick={() => setSelectedCertificateDetail(certificate)}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer gap-2 ${
                      isSelected ? "bg-[#F0EBFF]/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(certificate.id)}
                          className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-800 text-sm">{dispClient}</h5>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                            {certificate.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">
                          Target Location: {dispLoc} • End Date: {formatDate(dispEndDate)} • Inspector: {certificate.inspectedBy || "Zaid M."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 self-stretch sm:self-auto justify-between sm:justify-start">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        certificate.status === "Completed" ? "bg-emerald-50 text-emerald-800" : "bg-[#F0EBFF] text-[#683EFF]"
                      }`}>
                        {certificate.status}
                      </span>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => toggleFavorite(certificate.id, e)}>
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
      {/* 4. MODAL ADD MACHINE_CERTIFICATE JOB POPUP WITH MULTI-TAB & AUTOFILL AUTOCOMPLETE    */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header Area */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 select-none">
              <div>
                <h3 className="text-xl font-bold font-sans text-slate-800">Create New Machine Certificate order</h3>
                <p className="text-xs text-slate-400 mt-1">Please fill out the unified machine certificate directory profile for the corporate partner.</p>
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
            <form onSubmit={handleCreateCertificate} className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="space-y-6">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.FileText className="w-4 h-4" />
                  <span>1. Machine Certificate Details</span>
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
                      placeholder="MEV-CRT-26"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Inspection Report No
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans pr-8"
                        value={formValues.inspectionReportNo}
                        onChange={(e) => {
                          setFormValues({ ...formValues, inspectionReportNo: e.target.value });
                          setShowReportAutocomplete(true);
                        }}
                        onFocus={() => setShowReportAutocomplete(true)}
                        placeholder="Search inspection reports..."
                      />
                      <Icons.ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    
                    {/* Autocomplete Overlay menu */}
                    {showReportAutocomplete && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowReportAutocomplete(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                          {inspectionReports.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-slate-500 italic text-center">
                              No reports found.
                            </div>
                          ) : (
                            inspectionReports
                              .filter((report) => report.id.toLowerCase().includes(formValues.inspectionReportNo.toLowerCase()))
                              .map((report) => (
                                <button
                                  key={report.id}
                                  type="button"
                                  onClick={() => handleSelectReport(report)}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] flex justify-between items-center transition-colors"
                                >
                                  <span>{report.id}</span>
                                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{report.jobNumber || "N/A"}</span>
                                </button>
                              ))
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Job Number
                    </label>
                    <input
                      type="text"
                      
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.jobNumber}
                      onChange={(e) => setFormValues({ ...formValues, jobNumber: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Equipment Name *
                    </label>
                    <input
                      type="text"
                      
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans ${
                        formErrors.equipmentName ? "border-rose-300 focus:ring-rose-500" : "border-slate-200"
                      }`}
                      value={formValues.equipmentName}
                      onChange={(e) => setFormValues({ ...formValues, equipmentName: e.target.value })}
                    />
                    {formErrors.equipmentName && <p className="text-[10px] text-rose-500 font-semibold mt-1">{formErrors.equipmentName}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Sticker Number
                    </label>
                    <input
                      type="text"
                      
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.stickerNumber}
                      onChange={(e) => setFormValues({ ...formValues, stickerNumber: e.target.value })}
                    />
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
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Result
                    </label>
                    <input
                      type="text"
                      
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.result}
                      onChange={(e) => setFormValues({ ...formValues, result: e.target.value })}
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
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                      Check List
                    </label>
                    <input
                      type="text"
                      
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                      value={formValues.checkList}
                      onChange={(e) => setFormValues({ ...formValues, checkList: e.target.value })}
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

                {/* SECTION 3: INSPECTION DATES & DETAILS (Relocated to Basic tab) */}
                <div className="space-y-4 mt-6">
                  <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-bold flex items-center gap-2 select-none">
                    <Icons.Calendar className="w-4 h-4" />
                    <span>2. Inspection Dates & Specifications</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Inspection Date
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
                        Expiration Date
                      </label>
                      <input
                        type="date"
                        
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.expirationDate}
                        onChange={(e) => setFormValues({ ...formValues, expirationDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Type of Inspection
                      </label>
                      <input
                        type="text"
                        
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.typeOfInspection}
                        onChange={(e) => setFormValues({ ...formValues, typeOfInspection: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Next Inspection Date
                      </label>
                      <input
                        type="date"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.nextInspectionDate}
                        onChange={(e) => setFormValues({ ...formValues, nextInspectionDate: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Reference Standard
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.referenceStandard}
                        onChange={(e) => setFormValues({ ...formValues, referenceStandard: e.target.value })}
                        placeholder="e.g. ANSI/ASME B30.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CLIENT & LOCATION DETAILS */}
              <div className="space-y-4">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.Building className="w-4 h-4" />
                  <span>3. Client & Location Details</span>
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
                        placeholder="e.g. Aramco, NEOM..."
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
                      Location *
                    </label>
                    <input
                      type="text"
                      
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans ${
                        formErrors.location ? "border-rose-300 focus:ring-rose-500" : "border-slate-200"
                      }`}
                      value={formValues.location}
                      onChange={(e) => setFormValues({ ...formValues, location: e.target.value })}
                    />
                    {formErrors.location && <p className="text-[10px] text-rose-500 font-semibold mt-1">{formErrors.location}</p>}
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
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Equipment details */}
              <div className="space-y-6">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.Settings className="w-4 h-4" />
                  <span>4. Equipment details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Machine ID
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                          value={formValues.machineId}
                          onChange={(e) => {
                            setFormValues({ ...formValues, machineId: e.target.value });
                            setShowMachineAutocomplete(true);
                          }}
                          onFocus={() => setShowMachineAutocomplete(true)}
                          placeholder="Search machine ID..."
                        />
                        <Icons.ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>

                      {showMachineAutocomplete && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowMachineAutocomplete(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                            {matchingMachines.length === 0 ? (
                              <div className="px-4 py-3 text-xs italic text-slate-400 text-center">
                                No machine models found.
                              </div>
                            ) : (
                              matchingMachines.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleSelectMachine(m)}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] flex justify-between items-center transition-colors"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-bold">{m.id}</span>
                                    <span className="text-[10px] text-slate-400">{m.machineName}</span>
                                  </div>
                                  <Icons.ArrowRight className="w-3 h-3 text-slate-300" />
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Equipment Name
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.equipmentName}
                        onChange={(e) => setFormValues({ ...formValues, equipmentName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.manufacturer}
                        onChange={(e) => setFormValues({ ...formValues, manufacturer: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Model
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.modelName}
                        onChange={(e) => setFormValues({ ...formValues, modelName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.serialNumber}
                        onChange={(e) => setFormValues({ ...formValues, serialNumber: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Date of Mfg
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.dateOfMfg}
                        onChange={(e) => setFormValues({ ...formValues, dateOfMfg: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Owner ID / Plate No.
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.ownerId}
                        onChange={(e) => setFormValues({ ...formValues, ownerId: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

              {/* SECTION 4: Technical details */}
              <div className="space-y-6">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.Cpu className="w-4 h-4" />
                  <span>5. Technical details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3 relative">
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Machine ID
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                          value={formValues.machineId}
                          onChange={(e) => {
                            setFormValues({ ...formValues, machineId: e.target.value });
                            setShowMachineAutocomplete(true);
                          }}
                          onFocus={() => setShowMachineAutocomplete(true)}
                          placeholder="Search machine ID..."
                        />
                        <Icons.ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>

                      {showMachineAutocomplete && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowMachineAutocomplete(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 overflow-hidden text-left max-h-48 overflow-y-auto">
                            {matchingMachines.length === 0 ? (
                              <div className="px-4 py-3 text-xs italic text-slate-400 text-center">
                                No machine models found.
                              </div>
                            ) : (
                              matchingMachines.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleSelectMachine(m)}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0EBFF] hover:text-[#683EFF] flex justify-between items-center transition-colors"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-bold">{m.id}</span>
                                    <span className="text-[10px] text-slate-400">{m.machineName}</span>
                                  </div>
                                  <Icons.ArrowRight className="w-3 h-3 text-slate-300" />
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Load Limit (S.W.L)
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.loadLimit}
                        onChange={(e) => setFormValues({ ...formValues, loadLimit: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Max Horizontal Outreach
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.maxOutreach}
                        onChange={(e) => setFormValues({ ...formValues, maxOutreach: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Bucket Capacity
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.bucketCapacity}
                        onChange={(e) => setFormValues({ ...formValues, bucketCapacity: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Engine Power
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.enginePower}
                        onChange={(e) => setFormValues({ ...formValues, enginePower: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Boom Length
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.boomLength}
                        onChange={(e) => setFormValues({ ...formValues, boomLength: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Wheel Type
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.wheelType}
                        onChange={(e) => setFormValues({ ...formValues, wheelType: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Max Platform Height
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.maxPlatformHeight}
                        onChange={(e) => setFormValues({ ...formValues, maxPlatformHeight: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Hoe Bucket Capacity
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.heoBucketCapacity}
                        onChange={(e) => setFormValues({ ...formValues, heoBucketCapacity: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Engine Speed
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.engineSpeed}
                        onChange={(e) => setFormValues({ ...formValues, engineSpeed: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Angle of Span
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.angleOfSpan}
                        onChange={(e) => setFormValues({ ...formValues, angleOfSpan: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2 font-sans">
                        Person Allowed
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                        value={formValues.personAllowed}
                        onChange={(e) => setFormValues({ ...formValues, personAllowed: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

              {/* SECTION 6: RECOMMENDATIONS & DATA */}
              <div className="space-y-6">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.FileText className="w-4 h-4" />
                  <span>6. Recommendations & Data</span>
                </div>

                <div className="grid grid-cols-1 gap-6 pt-2">
                  <div className="mt-4">
                    <LoadChartDataEditor
                      data={formValues.loadChartData || []}
                      onChange={(data) => setFormValues({ ...formValues, loadChartData: data })}
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Recommendation
                    </label>
                    <textarea
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans min-h-[80px]"
                      value={formValues.recommendation}
                      onChange={(e) => setFormValues({ ...formValues, recommendation: e.target.value })}
                      placeholder="Enter recommendations..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 7: AUTHORIZED & INSPECTED SIGNATURES */}
              <div className="space-y-6">
                <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-semibold flex items-center gap-2 select-none font-display">
                  <Icons.PenTool className="w-4 h-4" />
                  <span>7. Authorized and Inspected Signatures</span>
                </div>

                <div className="grid grid-cols-1 gap-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Authorized By Section */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                          Authorized By
                        </label>
                        <input
                          type="text"
                          className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                          value={formValues.authorizedBy}
                          onChange={(e) => setFormValues({ ...formValues, authorizedBy: e.target.value })}
                        />
                      </div>

                      {/* Authorized Signature Box */}
                      <div className="bg-white border rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] relative w-full group overflow-hidden border-slate-200">
                        <Icons.Upload className="w-5 h-5 text-slate-400 mb-2 opacity-50 relative z-10" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Authorized Signature</span>
                        {formValues.authorizedBySignature ? (
                          <div className="relative group/sig">
                            <img src={formValues.authorizedBySignature} alt="Authorized" className="max-h-16 object-contain mt-2 z-10 relative" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormValues({ ...formValues, authorizedBySignature: "" });
                                showToast("✓ Authorized signature removed.");
                              }}
                              className="absolute -top-1 -right-1 p-1.5 bg-rose-500 text-white rounded-full shadow-lg z-30 hover:bg-rose-600 transition-colors"
                            >
                              <Icons.X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold relative z-10 mt-1">Upload Signature</span>
                        )}
                        <div onClick={() => setPickerTarget({ field: "authorizedBySignature", mode: "create" })} className="absolute inset-0 z-20 cursor-pointer"></div>
                      </div>
                    </div>

                    {/* Inspected By Section */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                          Inspected By
                        </label>
                        <input
                          type="text"
                          list="employees-list"
                          className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-slate-50 font-normal font-sans"
                          value={formValues.inspectedBy}
                          onChange={(e) => setFormValues({ ...formValues, inspectedBy: e.target.value })}
                          placeholder="Search employee..."
                        />
                        <datalist id="employees-list">
                          {employees?.map(e => <option key={e.id} value={e.name || e.firstName || e.id}>{e.id} - {e.role || e.designation}</option>)}
                        </datalist>
                      </div>

                      {/* Inspected Signature Box */}
                      <div className="bg-white border rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] relative w-full group overflow-hidden border-slate-200">
                        <Icons.Upload className="w-5 h-5 text-slate-400 mb-2 opacity-50 relative z-10" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Inspected Signature</span>
                        {formValues.inspectedBySignature ? (
                          <div className="relative group/sig">
                            <img src={formValues.inspectedBySignature} alt="Inspected" className="max-h-16 object-contain mt-2 z-10 relative" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormValues({ ...formValues, inspectedBySignature: "" });
                                showToast("✓ Inspected signature removed.");
                              }}
                              className="absolute -top-1 -right-1 p-1.5 bg-rose-500 text-white rounded-full shadow-lg z-30 hover:bg-rose-600 transition-colors"
                            >
                              <Icons.X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold relative z-10 mt-1">Upload Signature</span>
                        )}
                        <div onClick={() => setPickerTarget({ field: "inspectedBySignature", mode: "create" })} className="absolute inset-0 z-20 cursor-pointer"></div>
                      </div>
                    </div>
                  </div>
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
                onClick={handleCreateCertificate}
                className="bg-[#683EFF] hover:bg-[#5229E0] text-white text-xs font-semibold py-2 px-5 rounded-lg shadow-sm transition-all cursor-pointer font-sans"
              >
                Generate Certificate Order
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
              <h3 className="text-lg font-bold text-slate-800 font-sans">Delete Machine Certificate?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to permanently delete this machine certificate record? This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCertificate(confirmDeleteId)}
                  className="flex-1 px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-all shadow-md shadow-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0E1B2D] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-755 animate-slide-in">
          <Icons.Info className="w-4 h-4 text-[#683EFF]" />
          <span>{toastMessage}</span>
        </div>
      )}
      {pickerTarget && (
        <ImageUploadPicker
          clientName={pickerTarget.mode === "edit" ? (editFormValues?.clientName || "General") : (formValues.clientName || "General")}
          subfolder="Machine Certificate"
          onClose={() => setPickerTarget(null)}
          onImageSelect={(url) => {
            if (pickerTarget.mode === "edit" && editFormValues) {
              setEditFormValues({ ...editFormValues, [pickerTarget.field]: url });
            } else {
              setFormValues({ ...formValues, [pickerTarget.field]: url });
            }
            setPickerTarget(null);
            showToast(`✓ Signature selected successfully!`);
          }}
        />
      )}
    </div>
  );
}
