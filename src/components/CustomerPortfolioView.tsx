/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { CustomerDetail } from "../types";
import { PhoneCountryCodeInput } from "./PhoneCountryCodeInput";
import { CustomerDetailPage } from "./CustomerDetailPage";
import { formatDate } from "../utils";

interface CustomerPortfolioProps {
  customers: CustomerDetail[];
  onCustomersChange: React.Dispatch<React.SetStateAction<CustomerDetail[]>>;
  onUploadImage?: (file: File, clientName: string, subfolder: string, entityId?: string) => Promise<string>;
}

export function CustomerPortfolioView({ customers, onCustomersChange, onUploadImage }: CustomerPortfolioProps) {
  // View states
  const [viewMode, setViewMode] = useState<"list" | "grid" | "compact">("list");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  
  // Search & dynamic enter-key filter states
  const [filterInput, setFilterInput] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
 
  // Row selection & interaction states
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedCustDetail, setSelectedCustDetail] = useState<CustomerDetail | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showBulkActionDropdown, setShowBulkActionDropdown] = useState(false);

  // Pagination states mock (configured for high-fidelity representation of pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add Customer modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<"basic" | "training" | "inspection" | "contact" | "address">("basic");
  
  // New Customer Form State
  const initialFormState = {
    // 1. Basic Info
    companyName: "",
    customerType: "Company",
    status: "Active" as const,
    country: "Saudi Arabia",

    // 2. Training Info
    trainingSiteAddress: "",
    trainingContactPerson: "",
    trainingContactPhone: "",

    // 3. Inspection Info
    inspectionSiteAddress: "",
    inspectionContactPerson: "",
    inspectionContactPhone: "",
    inspectionMobile: "",

    // 4. Primary Contact
    email: "", // email ID
    phone: "", // mobile number
    primaryEmail: "",
    primaryMobile: "",

    // 5. Address Details
    addressLine1: "",
    cityAddress: "",
    addressLine2: "",
    stateProvince: "",
    zipPostalCode: ""
  };

  const [formValues, setFormValues] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Search input: Press enter handler
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

  // Remove a filter tag
  const removeFilter = (filterToRemove: string) => {
    setActiveFilters(activeFilters.filter((f) => f !== filterToRemove));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setFilterInput("");
  };

  const handleRefresh = () => {
    clearAllFilters();
    setSelectedCustomerIds([]);
  };

  // Filter logic: customer matches if they contain ALL active keywords
  const filteredCustomers = customers.filter((cust) => {
    if (activeFilters.length === 0) return true;
    return activeFilters.every((kw) => {
      const criteria = kw.toLowerCase();
      return (
        cust.companyName.toLowerCase().includes(criteria) ||
        cust.country.toLowerCase().includes(criteria) ||
        cust.contactPerson.toLowerCase().includes(criteria) ||
        (cust.customerType || "").toLowerCase().includes(criteria) ||
        (cust.cityAddress || "").toLowerCase().includes(criteria) ||
        (cust.stateProvince || "").toLowerCase().includes(criteria) ||
        cust.id.toLowerCase().includes(criteria)
      );
    });
  });

  // Pagination totals
  const totalItems = filteredCustomers.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Toggle single customer checkout checkbox
  const handleCheckboxChange = (id: string) => {
    if (selectedCustomerIds.includes(id)) {
      setSelectedCustomerIds(selectedCustomerIds.filter((x) => x !== id));
    } else {
      setSelectedCustomerIds([...selectedCustomerIds, id]);
    }
  };

  // Toggle select all on the current page
  const handleSelectAll = () => {
    const pageIds = paginatedCustomers.map((c) => c.id);
    const allSelected = pageIds.every((id) => selectedCustomerIds.includes(id));
    if (allSelected) {
      setSelectedCustomerIds(selectedCustomerIds.filter((id) => !pageIds.includes(id)));
    } else {
      const newIds = [...selectedCustomerIds];
      pageIds.forEach((id) => {
        if (!newIds.includes(id)) newIds.push(id);
      });
      setSelectedCustomerIds(newIds);
    }
  };

  const handleBulkDuplicate = () => {
    const toDuplicate = customers.filter(c => selectedCustomerIds.includes(c.id));
    const duplicated = toDuplicate.map(c => ({
      ...c,
      id: `CUST-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      companyName: `${c.companyName} (Copy)`,
    }));
    onCustomersChange([...duplicated, ...customers]);
    setToastMessage(`✓ Duplicated ${selectedCustomerIds.length} customer records`);
    setSelectedCustomerIds([]);
    setShowBulkActionDropdown(false);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleBulkExport = () => {
    const count = selectedCustomerIds.length;
    setToastMessage(`✓ Exporting ${count} customers to CSV...`);
    
    // Headers matching the fields in add customer popup exactly
    const headers = [
      "Customer Name", "Customer Type", "Country Gateway", "Initial Status",
      "Training Site Address", "Training Contact Person", "Training Contact Phone Number",
      "Inspection Site Address", "Inspection Contact Person", "Contact Phone Number",
      "Mobile Number", "Email ID", "Primary Contact Mobile Number",
      "Address Line 1", "City Address", "Address Line 2", "State / Province", "ZIP / Postal Code"
    ].join(",");

    const rows = customers
      .filter(c => selectedCustomerIds.includes(c.id))
      .map(c => [
        c.companyName, c.customerType, c.country, c.status,
        c.trainingSiteAddress || "", c.trainingContactPerson || "", c.trainingContactPhone || "",
        c.inspectionSiteAddress || "", c.inspectionContactPerson || "", c.inspectionContactPhone || "",
        c.inspectionMobile || "", c.primaryEmail || "", c.primaryMobile || "",
        c.addressLine1 || "", c.cityAddress || "", c.addressLine2 || "", c.stateProvince || "", c.zipPostalCode || ""
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSelectedCustomerIds([]);
    setShowBulkActionDropdown(false);
    setTimeout(() => setToastMessage(""), 3000);
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
          setToastMessage("⚠ CSV file is empty or missing data rows.");
          setTimeout(() => setToastMessage(""), 3000);
          return;
        }

        const csvHeaders = rows[0].map(h => h.trim().toLowerCase());
        const importedCustomers: any[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 0 || !row[0]) continue;

          const getVal = (headerName: string) => {
            const idx = csvHeaders.indexOf(headerName.toLowerCase());
            return idx !== -1 && idx < row.length ? row[idx] : "";
          };

          const companyName = getVal("Customer Name");
          if (!companyName) continue;

          const customer = {
            id: companyName,
            companyName: companyName,
            customerType: getVal("Customer Type") || "Company",
            country: getVal("Country Gateway") || "Saudi Arabia",
            status: getVal("Initial Status") || "Active",
            trainingSiteAddress: getVal("Training Site Address"),
            trainingContactPerson: getVal("Training Contact Person"),
            trainingContactPhone: getVal("Training Contact Phone Number"),
            inspectionSiteAddress: getVal("Inspection Site Address"),
            inspectionContactPerson: getVal("Inspection Contact Person"),
            inspectionContactPhone: getVal("Contact Phone Number"),
            inspectionMobile: getVal("Mobile Number"),
            primaryEmail: getVal("Email ID"),
            primaryMobile: getVal("Primary Contact Mobile Number"),
            addressLine1: getVal("Address Line 1"),
            cityAddress: getVal("City Address"),
            addressLine2: getVal("Address Line 2"),
            stateProvince: getVal("State / Province"),
            zipPostalCode: getVal("ZIP / Postal Code"),
            contactPerson: getVal("Email ID") ? getVal("Email ID").split("@")[0] : "Admin-VIM",
            phone: getVal("Contact Phone Number") || getVal("Primary Contact Mobile Number") || "+966 50 000 0000",
            email: getVal("Email ID") || "info@client.com",
            lastUpdated: new Date().toISOString().split("T")[0]
          };

          importedCustomers.push(customer);
        }

        if (importedCustomers.length > 0) {
          onCustomersChange((prev) => [...importedCustomers, ...prev]);
          setToastMessage(`✓ Successfully imported ${importedCustomers.length} customers.`);
        } else {
          setToastMessage("⚠ No valid customer entries found in the CSV.");
        }
      } catch (err) {
        console.error(err);
        setToastMessage("⚠ Error parsing CSV file.");
      }
      setTimeout(() => setToastMessage(""), 3000);
      e.target.value = "";
    };

    reader.readAsText(file);
  };

  const handleBulkDeleteItems = () => {
    const count = selectedCustomerIds.length;
    // Direct execution without confirm for testing environment bypass, or use a custom UI if needed
    // The user said "not working", so I'll simplify the logic to be 100% direct
    onCustomersChange((prev) => prev.filter(c => !selectedCustomerIds.includes(c.id)));
    setToastMessage(`✓ Successfully deleted ${count} customer records`);
    setSelectedCustomerIds([]);
    setShowBulkActionDropdown(false);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleDeleteCustomer = (id: string) => {
    onCustomersChange((prev) => prev.filter((c) => c.id !== id));
    if (selectedCustDetail?.id === id) {
      setSelectedCustDetail(null);
    }
    setToastMessage(`Customer record deleted successfully`);
    setConfirmDeleteId(null);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Toggle favorite
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Create new customer action
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formValues.companyName.trim()) {
      errors.companyName = "Customer Name is required";
    }
    if (!formValues.customerType.trim()) {
      errors.customerType = "Customer type is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setActiveFormTab("basic"); // route to basic tab
      return;
    }

    // Prepare complete record
    const newId = `CUST-${Math.floor(100 + Math.random() * 900)}`;
    const newCustomer: CustomerDetail = {
      id: formValues.companyName, // In screenshot, ID displays as the Customer Name itself (e.g., Saudi Aramco)
      companyName: formValues.companyName,
      country: formValues.country,
      contactPerson: formValues.primaryEmail ? formValues.primaryEmail.split("@")[0] : "Admin-VIM",
      status: formValues.status,
      phone: formValues.phone || formValues.primaryMobile || "+966 50 000 0000",
      email: formValues.email || formValues.primaryEmail || "info@client.com",
      
      customerType: formValues.customerType,
      lastUpdated: new Date().toISOString().split("T")[0],
      
      trainingSiteAddress: formValues.trainingSiteAddress,
      trainingContactPerson: formValues.trainingContactPerson,
      trainingContactPhone: formValues.trainingContactPhone,

      inspectionSiteAddress: formValues.inspectionSiteAddress,
      inspectionContactPerson: formValues.inspectionContactPerson,
      inspectionContactPhone: formValues.inspectionContactPhone,
      inspectionMobile: formValues.inspectionMobile,

      primaryEmail: formValues.primaryEmail,
      primaryMobile: formValues.primaryMobile,

      addressLine1: formValues.addressLine1,
      cityAddress: formValues.cityAddress,
      addressLine2: formValues.addressLine2,
      stateProvince: formValues.stateProvince,
      zipPostalCode: formValues.zipPostalCode
    };

    onCustomersChange((prev) => [newCustomer, ...prev]);
    setShowAddModal(false);
    setFormValues(initialFormState);
    setFormErrors({});
    setActiveFormTab("basic");
  };

  if (selectedCustDetail) {
    return (
      <CustomerDetailPage
        customer={selectedCustDetail}
        allCustomers={customers}
        onBack={() => setSelectedCustDetail(null)}
        onUploadImage={onUploadImage}
        onSave={(updated) => {
          onCustomersChange((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
          setSelectedCustDetail(updated);
        }}
        onDelete={(id) => {
          onCustomersChange((prev) => prev.filter((c) => c.id !== id));
          setSelectedCustDetail(null);
        }}
        onDuplicate={(custToDup) => {
          const newId = `CUST-${Math.floor(Math.random() * 9000 + 1000)}`;
          const duplicated: CustomerDetail = {
            ...custToDup,
            id: newId,
            companyName: `${custToDup.companyName} (Duplicate)`,
            lastUpdated: new Date().toISOString().split("T")[0]
          };
          onCustomersChange((prev) => [duplicated, ...prev]);
          setSelectedCustDetail(duplicated);
        }}
        onSelectCustomer={(nextCust) => {
          setSelectedCustDetail(nextCust);
        }}
      />
    );
  }

  return (
    <div className="space-y-6" id="portfolio-view-container">
      {/* 1. Header with custom breadcrumbs or identifier */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-[#683EFF] font-bold tracking-wider uppercase">
            <span>Operations Management</span>
            <span className="text-slate-300">/</span>
            <span className="bg-[#F0EBFF] px-2 py-0.5 rounded text-[10px]">Customer list page</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-800 tracking-tight">
            Customer Portfolio
          </h2>
        </div>

        {/* Action Controls Side */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto relative">
          
          {/* Bulk Actions Bar Integrated directly into the row, appeared on the left of dropdown */}
          {selectedCustomerIds.length > 0 && (
            <div className="bg-[#FFF5F5] border border-rose-100 rounded-xl p-1 px-3 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-[11px] font-black uppercase tracking-[0.1em] text-rose-600 whitespace-nowrap">
                SELECTED: {selectedCustomerIds.length}
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

          {/* Custom Select Dropdown matching image perfectly */}
          <div className="relative">
            <button
              id="view-mode-selector-btn"
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
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowViewDropdown(false)} 
                />
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
            onClick={() => document.getElementById("csv-import-customers-input")?.click()}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:border-[#683EFF] hover:text-[#683EFF] rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            title="Import Customers from CSV"
          >
            <Icons.Upload className="w-4 h-4 text-slate-400 hover:text-[#683EFF]" />
            <span>Import</span>
          </button>
          <input
            id="csv-import-customers-input"
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />

          {/* Refresh Button */}
          <button
            id="refresh-portfolio-btn"
            onClick={handleRefresh}
            title="Refresh Grid & Reset Filters"
            className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:text-[#683EFF] hover:border-[#683EFF] hover:bg-slate-50 transition-all shadow-sm"
          >
            <Icons.RotateCw className="w-5 h-5" />
          </button>

          {/* Add Customer Button */}
          <button
            id="add-customer-btn"
            onClick={() => setShowAddModal(true)}
            className="bg-[#683EFF] hover:bg-[#5229E0] text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 text-sm shadow-sm transition-all"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 2. Advanced Search Input Row with Multiple Enter-Key Filters (Jeddah, Construction) */}
      <div className="bg-slate-55 rounded-xl p-3 border border-slate-300 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          
          {/* Main search bar block styled elegantly */}
          <div className="relative flex-1">
            <Icons.Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="portfolio-search-input"
              type="text"
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Press Enter to add filters (e.g. Jeddah, Construction)..."
              className="w-full pl-11 pr-5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] transition-all font-medium text-slate-700"
            />
          </div>

          {/* Filter Dropdown Toggle Button displaying "Filter N" or "Filter" */}
          <div className="relative">
            <button
              id="filter-popover-toggle"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`px-4 py-2.5 text-sm font-bold border rounded-xl flex items-center gap-2 shadow-sm transition-all whitespace-nowrap justify-center ${
                activeFilters.length > 0
                  ? "bg-[#F0EBFF] border-[#683EFF] text-[#683EFF]"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icons.Filter className="w-4 h-4" />
              <span>
                {activeFilters.length > 0 ? `Filter ${activeFilters.length}` : "Filter"}
              </span>
              <Icons.ChevronDown className="w-3.5 h-3.5 opacity-65" />
            </button>

            {showFilterDropdown && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowFilterDropdown(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-300 rounded-xl shadow-xl p-4 z-30 select-none animate-in fade-in slide-in-from-top-3 duration-150">
                  <div className="flex justify-between items-center mb-2.5 border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Criteria Tags</span>
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

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Pressing ENTER after typing any keyword adds a new tag constraint to search dynamically across company name, country, city, type or ID.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Display chips inline underneath search inputs if any exists */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-white py-2 px-3 rounded-xl border border-slate-100">
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

      {/* 3. Core Customer Container rendered conditionally per requested ViewModes */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-white border border-slate-100 shadow-sm min-h-[350px]">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
            <Icons.Inbox className="w-10 h-10" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-800 font-sans">No Records Found</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
            We couldn't find any customers matching the tags: {activeFilters.join(", ") || "(none)"}. Try clearing filters or adding a new customer!
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
              Add New Customer
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* A. LIST VIEW / TABLE (Matches the detailed screenshot layout precisely) */}
          {viewMode === "list" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 text-[10px] font-semibold uppercase tracking-widest select-none font-sans">
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={
                            paginatedCustomers.length > 0 &&
                            paginatedCustomers.every((c) => selectedCustomerIds.includes(c.id))
                          }
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF]"
                        />
                      </th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">CUSTOMER NAME</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">TRAINING SITE ADDRESS</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">ID</th>
                      <th className="p-4 text-slate-600 font-semibold font-sans">LAST UPDATED</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 text-right font-sans">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedCustomers.map((cust) => {
                      const isSelected = selectedCustomerIds.includes(cust.id);
                      return (
                        <tr
                          key={cust.id}
                          onClick={() => setSelectedCustDetail(cust)}
                          className={`hover:bg-slate-55/65 transition-colors cursor-pointer text-xs font-semibold text-slate-700 ${
                            isSelected ? "bg-[#F0EBFF]/20" : ""
                          }`}
                        >
                          {/* Checkbox column */}
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(cust.id)}
                              className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                            />
                          </td>

                          {/* Customer Name */}
                          <td className="p-4">
                            <span className="text-sm font-bold text-slate-800">{cust.companyName}</span>
                          </td>

                          {/* Training Site Address */}
                          <td className="p-4 text-slate-500 max-w-xs truncate">
                            {cust.trainingSiteAddress || cust.companyName}
                          </td>

                          {/* ID Column */}
                          <td className="p-4 text-slate-600 text-xs truncate max-w-[200px]">
                            {cust.id}
                          </td>

                          {/* Last Updated Column */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Icons.Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-slate-600 font-medium">{formatDate(cust.lastUpdated)}</span>
                            </div>
                          </td>

                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedCustDetail(cust); }}
                                className="p-1.5 text-slate-400 hover:text-[#683EFF] hover:bg-[#F0EBFF] rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Icons.Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setConfirmDeleteId(cust.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-right"
                                title="Remove Customer"
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

          {/* B. GRID VIEW */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedCustomers.map((cust) => {
                const isSelected = selectedCustomerIds.includes(cust.id);
                const isLiked = !!favorites[cust.id];
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustDetail(cust)}
                    className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between min-h-[220px] ${
                      isSelected ? "border-[#683EFF] ring-1 ring-[#683EFF]/35" : "border-slate-200"
                    }`}
                  >
                    <div>
                      {/* Top Action Ribbon */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {cust.customerType || "Partner"}
                        </span>
                        
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleCheckboxChange(cust.id)}
                            className="p-1 text-slate-400 hover:text-[#683EFF]"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 text-[#683EFF] border-slate-300 rounded cursor-pointer"
                            />
                          </button>
                        </div>
                      </div>

                      {/* Client Identity details */}
                      <h4 className="text-base font-extrabold text-slate-800 tracking-tight font-sans">
                        {cust.companyName}
                      </h4>
                      <p className="text-xs text-[#683EFF] font-bold mb-2">
                        {cust.country} {cust.cityAddress ? `- ${cust.cityAddress}` : ""}
                      </p>

                      {/* Details lines matching the fields */}
                      <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                        {cust.trainingSiteAddress && (
                          <div className="flex items-start gap-1 text-[11px]">
                            <Icons.Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="truncate">
                              <strong className="text-slate-500 font-bold">Training Site:</strong> {cust.trainingSiteAddress}
                            </span>
                          </div>
                        )}
                        {cust.inspectionSiteAddress && (
                          <div className="flex items-start gap-1 text-[11px]">
                            <Icons.Activity className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="truncate">
                              <strong className="text-slate-500 font-bold">Inspection:</strong> {cust.inspectionSiteAddress}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[11px]">
                          <Icons.Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{cust.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status ribbon */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[10px]">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider">
                        ID: {cust.id.length > 15 ? `${cust.id.slice(0, 15)}...` : cust.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* C. COMPACT VIEW */}
          {viewMode === "compact" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
              {paginatedCustomers.map((cust) => {
                const isSelected = selectedCustomerIds.includes(cust.id);
                const isLiked = !!favorites[cust.id];
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustDetail(cust)}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer gap-2 ${
                      isSelected ? "bg-[#F0EBFF]/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(cust.id)}
                          className="w-4 h-4 text-[#683EFF] border-slate-300 rounded focus:ring-[#683EFF] cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-800 text-sm">{cust.companyName}</h5>
                          <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            {cust.customerType || "Corporation"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">
                          Region: {cust.country} • City: {cust.cityAddress || "N/A"} • ID: {cust.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 self-stretch sm:self-auto justify-between sm:justify-start">
                      <span className="text-slate-400 font-medium">Updated {formatDate(cust.lastUpdated)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. PAGINATION BAR FOOTER BLOCK MATCHING TRAINING JOBS DESIGN */}
          <div className="flex items-center justify-between bg-white px-6 py-4.5 border border-slate-200 rounded-xl shadow-sm select-none">
            <span className="text-xs text-slate-500 font-semibold font-sans">
              Showing <strong className="text-slate-800 font-extrabold">{Math.min(startIndex + 1, totalItems)}</strong> to{" "}
              <strong className="text-slate-800 font-extrabold">{Math.min(startIndex + itemsPerPage, totalItems)}</strong> of{" "}
              <strong className="text-slate-800 font-extrabold">{totalItems}</strong> customers
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

      {/* ========================================================= */}
      {/* 5. ADD CUSTOMER POPUP (MODAL) */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="Add customer popup">
          {/* Backdrop screen */}
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)} />

          {/* Modal box Container */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all border border-slate-100 max-h-[90vh] flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-4 shrink-0">
                <div>
                  <h3 className="text-xl font-bold font-sans text-slate-800">Create New Customer Profile</h3>
                  <p className="text-xs text-slate-400 mt-1">Please fill out the unified customer directory profile for the corporate partner.</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Form implementation with Scrollable single section content */}
              <form onSubmit={handleCreateCustomer} className="flex-1 overflow-y-auto pr-2 space-y-6">
                
                {/* 1. Basic Information Section */}
                <div className="space-y-4">
                  <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-bold flex items-center gap-2 select-none">
                    <Icons.Building className="w-4 h-4" />
                    <span>1. Company Details</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formValues.companyName}
                        onChange={(e) => setFormValues({ ...formValues, companyName: e.target.value })}
                        placeholder="e.g. Saudi Aramco Logistics"
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 ${
                          formErrors.companyName ? "border-rose-400" : "border-slate-300"
                        }`}
                      />
                      {formErrors.companyName && (
                        <p className="text-[11px] text-rose-500 font-bold mt-1">{formErrors.companyName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                        Customer Type *
                      </label>
                      <select
                        value={formValues.customerType}
                        onChange={(e) => setFormValues({ ...formValues, customerType: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] text-slate-700 bg-slate-50"
                      >
                        <option value="Company">Company</option>
                        <option value="Individual">Individual</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Proprietorship">Proprietorship</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                        Country Gateway
                      </label>
                      <select
                        value={formValues.country}
                        onChange={(e) => setFormValues({ ...formValues, country: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] text-slate-700 bg-slate-50"
                      >
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Oman">Oman</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Bahrain">Bahrain</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                        Initial Status
                      </label>
                      <span className="flex items-center gap-2 mt-2">
                        <input
                          type="radio"
                          id="status-active"
                          name="status"
                          checked={formValues.status === "Active"}
                          onChange={() => setFormValues({ ...formValues, status: "Active" })}
                          className="text-[#683EFF] focus:ring-[#683EFF]"
                        />
                        <label htmlFor="status-active" className="text-xs text-slate-600 font-bold cursor-pointer">Enabled / Active</label>
                        
                        <input
                          type="radio"
                          id="status-review"
                          name="status"
                          checked={formValues.status === "Pending Review"}
                          onChange={() => setFormValues({ ...formValues, status: "Pending Review" })}
                          className="text-[#683EFF] focus:ring-[#683EFF] ml-3"
                        />
                        <label htmlFor="status-review" className="text-xs text-slate-600 font-bold cursor-pointer">Pending Review</label>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Office Address Details Section */}
                <div className="space-y-4 pb-2">
                  <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-bold flex items-center gap-2 select-none">
                    <Icons.MapPin className="w-4 h-4" />
                    <span>2. Office Address Details</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={formValues.addressLine1}
                        onChange={(e) => setFormValues({ ...formValues, addressLine1: e.target.value })}
                        placeholder="e.g. Aramco Main HQ Complex, Tower Section B"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                        City Address
                      </label>
                      <input
                        type="text"
                        value={formValues.cityAddress}
                        onChange={(e) => setFormValues({ ...formValues, cityAddress: e.target.value })}
                        placeholder="e.g. Jeddah / Dhahran"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={formValues.addressLine2}
                        onChange={(e) => setFormValues({ ...formValues, addressLine2: e.target.value })}
                        placeholder="e.g. King Abdulaziz Road"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                        State / Province
                      </label>
                      <input
                        type="text"
                        value={formValues.stateProvince}
                        onChange={(e) => setFormValues({ ...formValues, stateProvince: e.target.value })}
                        placeholder="e.g. Eastern Province"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                        ZIP / Postal Code
                      </label>
                      <input
                        type="text"
                        value={formValues.zipPostalCode}
                        onChange={(e) => setFormValues({ ...formValues, zipPostalCode: e.target.value })}
                        placeholder="e.g. 31311"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Training Information Section */}
                <div className="space-y-4">
                  <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-bold flex items-center gap-2 select-none">
                    <Icons.Award className="w-4 h-4" />
                    <span>3. Training Site Details</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                        Training Site Address
                      </label>
                      <textarea
                        rows={2}
                        value={formValues.trainingSiteAddress}
                        onChange={(e) => setFormValues({ ...formValues, trainingSiteAddress: e.target.value })}
                        placeholder="e.g. Highway 40, Training Depot Site Alpha, Jubail"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                          Training Contact Person
                        </label>
                        <input
                          type="text"
                          value={formValues.trainingContactPerson}
                          onChange={(e) => setFormValues({ ...formValues, trainingContactPerson: e.target.value })}
                          placeholder="e.g. Zaid Sulaiman"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                          Training Contact Phone Number
                        </label>
                        <PhoneCountryCodeInput
                          id="training-phone"
                          value={formValues.trainingContactPhone}
                          onChange={(val) => setFormValues({ ...formValues, trainingContactPhone: val })}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Inspection Information Section */}
                <div className="space-y-4">
                  <div className="bg-[#F0EBFF]/30 border border-[#DED3FF] p-3 rounded-lg text-xs text-[#683EFF] font-bold flex items-center gap-2 select-none">
                    <Icons.Activity className="w-4 h-4" />
                    <span>4. Inspection Site Details</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                        Inspection Site Address
                      </label>
                      <textarea
                        rows={2}
                        value={formValues.inspectionSiteAddress}
                        onChange={(e) => setFormValues({ ...formValues, inspectionSiteAddress: e.target.value })}
                        placeholder="e.g. Jetty Wharf 12, Heavy Rigs Terminal, Jebel Ali Freezone"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                          Inspection Contact Person
                        </label>
                        <input
                          type="text"
                          value={formValues.inspectionContactPerson}
                          onChange={(e) => setFormValues({ ...formValues, inspectionContactPerson: e.target.value })}
                          placeholder="e.g. Eng. Tariq"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                          Inspection Contact Phone Number
                        </label>
                        <PhoneCountryCodeInput
                          id="inspection-phone"
                          value={formValues.inspectionContactPhone}
                          onChange={(val) => setFormValues({ ...formValues, inspectionContactPhone: val })}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation and Submit Buttons */}
                <div className="flex justify-end items-center border-t border-slate-150 pt-4 mt-4 shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-slate-300 text-xs font-bold text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#683EFF] hover:bg-[#5229E0] text-white text-xs font-bold py-2 px-5 rounded-lg shadow-sm transition-all"
                  >
                    Create Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. SIDE CUSTOMER DETAIL VIEWER SLIDING DRAWER DIRECTORY PANEL */}
      {/* ========================================================= */}
      {selectedCustDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="customer-detail-drawer">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setSelectedCustDetail(null)} />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col h-full border-l border-slate-200">
              
              {/* Header block with company theme styling */}
              <div className="p-6 bg-[#F0EBFF]/30 border-b border-l border-[#DED3FF] flex flex-col gap-3 relative select-none">
                <button
                  onClick={() => setSelectedCustDetail(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 bg-white hover:bg-slate-100 rounded-full border border-slate-100 transition-colors"
                >
                  <Icons.X className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-[#DED3FF] text-[#683EFF] font-black uppercase text-xl shadow-sm">
                    {selectedCustDetail.companyName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#683EFF] bg-[#F0EBFF] px-2 py-0.5 rounded uppercase tracking-wider">
                      ID: {selectedCustDetail.id}
                    </span>
                    <h3 className="text-xl font-black text-slate-800 mt-1 font-sans leading-tight">
                      {selectedCustDetail.companyName}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Region Location Gateway: <strong>{selectedCustDetail.country}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Enabled / Operational Link
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                    {selectedCustDetail.customerType || "Corporate Contractor"}
                  </span>
                </div>
              </div>

              {/* Scrollable specs drawer panel structured by the 5 directories explicitly */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Basic Information details */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-extrabold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-1.5 select-none uppercase tracking-wider text-xs">
                    <Icons.Building className="w-4 h-4 text-[#683EFF]" />
                    <span>1. Basic Corporate Information</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Corporate Title</p>
                      <p className="font-semibold text-slate-800 mt-1">{selectedCustDetail.companyName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Registration Gateway</p>
                      <p className="font-semibold text-slate-800 mt-1">{selectedCustDetail.country}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Business Sector</p>
                      <p className="font-semibold text-slate-800 mt-1">{selectedCustDetail.customerType || "Construction & Engineering"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Audit Frequency</p>
                      <p className="font-semibold text-slate-800 mt-1">Bi-Monthly Rig Check</p>
                    </div>
                  </div>
                </div>

                {/* 2. Training Information details */}
                <div className="space-y-2.5 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-sm font-extrabold text-slate-700 flex items-center gap-2 border-b border-slate-150 pb-1.5 select-none uppercase tracking-wider text-xs">
                    <Icons.Award className="w-4 h-4 text-[#683EFF]" />
                    <span>2. Safety Training Yard Operations</span>
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Training Site Address</p>
                      <p className="font-semibold text-slate-800 mt-1 bg-white p-2 rounded border border-slate-100">
                        {selectedCustDetail.trainingSiteAddress || "Not Defined Yet"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Safety Officer</p>
                        <p className="font-semibold text-slate-800 mt-1">{selectedCustDetail.trainingContactPerson || "Unavailable"}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Training Hotline</p>
                        <p className="font-semibold text-slate-800 mt-1">{selectedCustDetail.trainingContactPhone || "Unavailable"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Inspection Information details */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-extrabold text-[#683EFF] flex items-center gap-2 border-b border-[#DED3FF] pb-1.5 select-none uppercase tracking-wider text-xs">
                    <Icons.Activity className="w-4 h-4" />
                    <span>3. Load-Test & Machinery Inspection Hub</span>
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Inspection Field Address</p>
                      <p className="font-semibold text-slate-800 mt-1 bg-slate-50 p-2 rounded text-slate-650 leading-relaxed border border-slate-100">
                        {selectedCustDetail.inspectionSiteAddress || "No active field address set"}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Lead Inspector</p>
                        <p className="font-semibold text-slate-800 mt-1">{selectedCustDetail.inspectionContactPerson || "To Assign"}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Audit Hotline</p>
                        <p className="font-semibold text-slate-800 mt-1">{selectedCustDetail.inspectionContactPhone || "N/A"}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Site Mobile</p>
                        <p className="font-semibold text-slate-800 mt-1">{selectedCustDetail.inspectionMobile || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Primary Contact Details details */}
                <div className="space-y-2.5 bg-[#F0EBFF]/10 p-4 rounded-xl border border-[#DED3FF]/40">
                  <h4 className="text-sm font-extrabold text-slate-700 flex items-center gap-2 border-b border-slate-150 pb-1.5 select-none uppercase tracking-wider text-xs">
                    <Icons.Mail className="w-4 h-4 text-[#683EFF]" />
                    <span>4. Primary Communications & Hotlines</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Liaison Email ID</p>
                      <p className="font-semibold text-[#683EFF] mt-1 break-all select-all font-bold">{selectedCustDetail.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Corporate Mobile Number</p>
                      <p className="font-semibold text-slate-800 mt-1 select-all">{selectedCustDetail.phone}</p>
                    </div>
                  </div>
                </div>

                {/* 5. Primary Address Details details */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-extrabold text-slate-700 flex items-center gap-2 border-b border-slate-150 pb-1.5 select-none uppercase tracking-wider text-xs">
                    <Icons.MapPin className="w-4 h-4 text-[#683EFF]" />
                    <span>5. Headquarters Address Details</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">HQ Address Street Line</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedCustDetail.addressLine1 || "Not specified"}</p>
                    </div>
                    {selectedCustDetail.addressLine2 && (
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Address Line 2 (Building/Floor)</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedCustDetail.addressLine2}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3 mt-1">
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">City Address</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedCustDetail.cityAddress || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">State / Province</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedCustDetail.stateProvince || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">ZIP / Postal Code</p>
                        <p className="font-semibold text-slate-800 mt-0.5 font-mono">{selectedCustDetail.zipPostalCode || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Side panel footer action keys */}
              <div className="p-4 border-t border-slate-150 bg-slate-50 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustDetail(null)}
                  className="flex-1 py-2 text-center text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Close Panel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const isFav = !favorites[selectedCustDetail.id];
                    setFavorites((prev) => ({ ...prev, [selectedCustDetail.id]: isFav }));
                  }}
                  className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 justify-center min-w-[120px] ${
                    favorites[selectedCustDetail.id]
                      ? "bg-rose-50 border-rose-200 text-rose-600"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icons.Heart className={`w-3.5 h-3.5 ${favorites[selectedCustDetail.id] ? "fill-rose-500 text-rose-500 animate-ping-once" : ""}`} />
                  <span>{favorites[selectedCustDetail.id] ? "Bookmarked" : "Bookmark"}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      {/* Toast Alert */}
      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                <Icons.AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-sans">Delete Customer?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to permanently delete this customer record? This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCustomer(confirmDeleteId)}
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
        <div className="fixed bottom-5 right-5 z-[100] bg-[#0E1B2D] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-750 animate-slide-in">
          <Icons.Info className="w-4 h-4 text-[#683EFF]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
