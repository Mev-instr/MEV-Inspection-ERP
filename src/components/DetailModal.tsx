/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { ERPCategory } from "../types";
import { formatDate } from "../utils";

interface DetailModalProps {
  category: ERPCategory | null;
  onClose: () => void;
  state: {
    customers: any[];
    setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
    employees: any[];
    setEmployees: React.Dispatch<React.SetStateAction<any[]>>;
    trainingJobs: any[];
    setTrainingJobs: React.Dispatch<React.SetStateAction<any[]>>;
    inspectionJobs: any[];
    setInspectionJobs: React.Dispatch<React.SetStateAction<any[]>>;
    inspectionReports: any[];
    setInspectionReports: React.Dispatch<React.SetStateAction<any[]>>;
    machineCertificates: any[];
    setMachineCertificates: React.Dispatch<React.SetStateAction<any[]>>;
    liftingToolCerts: any[];
    setLiftingToolCerts: React.Dispatch<React.SetStateAction<any[]>>;
    machineDetails: any[];
    setMachineDetails: React.Dispatch<React.SetStateAction<any[]>>;
    operators: any[];
    setOperators: React.Dispatch<React.SetStateAction<any[]>>;
    incrementCardCount: (cat: ERPCategory) => void;
  };
}

// Simple Helper to dynamically render a Lucide Icon
export function LucideIcon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) {
    return <Icons.HelpCircle className={className} />;
  }
  return <IconComponent className={className} />;
}

export function DetailModal({ category, onClose, state }: DetailModalProps) {
  if (!category) return null;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Form Inputs State
  const [customerForm, setCustomerForm] = useState({ companyName: "", country: "Saudi Arabia", contactPerson: "", status: "Active" as any, phone: "", email: "" });
  const [employeeForm, setEmployeeForm] = useState({ name: "", role: "", department: "Quality Assurance", status: "Active" as any, email: "", phone: "", joiningDate: new Date().toISOString().split('T')[0] });
  const [trainingForm, setTrainingForm] = useState({ courseTitle: "", instructor: "", targetDate: new Date().toISOString().split('T')[0], registeredCandidates: 10, status: "Scheduled" as any, location: "" });
  const [inspectionJobForm, setInspectionJobForm] = useState({ assetType: "", inspector: "", location: "", urgency: "Medium" as any, status: "Pending" as any, scheduledDate: new Date().toISOString().split('T')[0] });
  const [reportForm, setReportForm] = useState({ reportName: "", assetTested: "", inspector: "Nour Al-Faisal", complianceScore: 100, status: "Draft" as any });
  const [machineForm, setMachineForm] = useState({ name: "", model: "", serialNumber: "", department: "Heavy Equipment Fleet", workingHours: 100, status: "Operational" as any, location: "" });
  const [certForm, setCertForm] = useState({ machineName: "", certificateNo: "", issuingBody: "VIM Inspection Services Group", issueDate: new Date().toISOString().split('T')[0], expiryDate: "", status: "Valid" as any });
  const [liftingCertForm, setLiftingCertForm] = useState({ toolName: "", serialNumber: "", safeWorkingLoad: "5T", testStandard: "BS EN 13889", lastTestedDate: new Date().toISOString().split('T')[0], expiryDate: "", status: "Valid" as any });
  const [operatorForm, setOperatorForm] = useState({ operatorName: "", badgeNumber: "", authorizedEquipment: "", safetyIndex: 98, licenseExpiry: "", status: "Fully Certified" as any, trainedBy: "" });

  // Get current state array matching the active category
  const getCurrentRecords = () => {
    switch (category) {
      case ERPCategory.CUSTOMER_DETAILS: return state.customers;
      case ERPCategory.EMPLOYEE_DETAILS: return state.employees;
      case ERPCategory.TRAINING_JOB_ORDER_CARD: return state.trainingJobs;
      case ERPCategory.INSPECTION_JOB_ORDER_CARD: return state.inspectionJobs;
      case ERPCategory.INSPECTION_REPORT: return state.inspectionReports;
      case ERPCategory.MACHINE_CERTIFICATES: return state.machineCertificates;
      case ERPCategory.LIFTING_TOOL_CERTIFICATE: return state.liftingToolCerts;
      case ERPCategory.MACHINE_DETAILS: return state.machineDetails;
      case ERPCategory.OPERATOR_CARD: return state.operators;
      default: return [];
    }
  };

  const currentRecords = getCurrentRecords();

  // Search and filter logic
  const filteredRecords = currentRecords.filter((record: any) => {
    let matchesSearch = false;
    let matchesFilter = true;

    // Search mapping
    if (category === ERPCategory.CUSTOMER_DETAILS) {
      matchesSearch = record.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.country.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterStatus !== "ALL") matchesFilter = record.status === filterStatus;
    } else if (category === ERPCategory.EMPLOYEE_DETAILS) {
      matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.department.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterStatus !== "ALL") matchesFilter = record.status === filterStatus;
    } else if (category === ERPCategory.TRAINING_JOB_ORDER_CARD) {
      matchesSearch = record.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.location.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterStatus !== "ALL") matchesFilter = record.status === filterStatus;
    } else if (category === ERPCategory.INSPECTION_JOB_ORDER_CARD) {
      matchesSearch = record.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.location.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterStatus !== "ALL") matchesFilter = record.status === filterStatus;
    } else if (category === ERPCategory.INSPECTION_REPORT) {
      matchesSearch = record.reportName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.assetTested.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.inspector.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterStatus !== "ALL") matchesFilter = record.status === filterStatus;
    } else if (category === ERPCategory.MACHINE_CERTIFICATES) {
      matchesSearch = record.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.certificateNo.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterStatus !== "ALL") matchesFilter = record.status === filterStatus;
    } else if (category === ERPCategory.LIFTING_TOOL_CERTIFICATE) {
      matchesSearch = record.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterStatus !== "ALL") matchesFilter = record.status === filterStatus;
    } else if (category === ERPCategory.MACHINE_DETAILS) {
      matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterStatus !== "ALL") matchesFilter = record.status === filterStatus;
    } else if (category === ERPCategory.OPERATOR_CARD) {
      matchesSearch = record.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      record.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterStatus !== "ALL") matchesFilter = record.status === filterStatus;
    }

    return matchesSearch && matchesFilter;
  });

  const getCategoryThemeColor = () => {
    return "text-[#683EFF] bg-[#F0EBFF] border-[#DED3FF]";
  };

  const getCategoryIcon = () => {
    switch (category) {
      case ERPCategory.CUSTOMER_DETAILS: return "Building";
      case ERPCategory.EMPLOYEE_DETAILS: return "Users";
      case ERPCategory.TRAINING_JOB_ORDER_CARD: return "FileText";
      case ERPCategory.INSPECTION_JOB_ORDER_CARD: return "CheckSquare";
      case ERPCategory.INSPECTION_REPORT: return "ClipboardCheck";
      case ERPCategory.MACHINE_CERTIFICATES: return "Shield";
      case ERPCategory.LIFTING_TOOL_CERTIFICATE: return "Anchor";
      case ERPCategory.MACHINE_DETAILS: return "Award";
      case ERPCategory.OPERATOR_CARD: return "FileSpreadsheet";
      default: return "Settings";
    }
  };

  // Submit operations
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const uniqueId = `NEW-${Math.floor(1000 + Math.random() * 9000)}`;

    if (category === ERPCategory.CUSTOMER_DETAILS) {
      state.setCustomers(prev => [...prev, { ...customerForm, id: uniqueId }]);
      setCustomerForm({ companyName: "", country: "Saudi Arabia", contactPerson: "", status: "Active", phone: "", email: "" });
    } else if (category === ERPCategory.EMPLOYEE_DETAILS) {
      state.setEmployees(prev => [...prev, { ...employeeForm, id: uniqueId }]);
      setEmployeeForm({ name: "", role: "", department: "Quality Assurance", status: "Active", email: "", phone: "", joiningDate: new Date().toISOString().split('T')[0] });
    } else if (category === ERPCategory.TRAINING_JOB_ORDER_CARD) {
      state.setTrainingJobs(prev => [...prev, { ...trainingForm, id: uniqueId, registeredCandidates: Number(trainingForm.registeredCandidates) }]);
      setTrainingForm({ courseTitle: "", instructor: "", targetDate: new Date().toISOString().split('T')[0], registeredCandidates: 10, status: "Scheduled", location: "" });
    } else if (category === ERPCategory.INSPECTION_JOB_ORDER_CARD) {
      state.setInspectionJobs(prev => [...prev, { ...inspectionJobForm, id: uniqueId }]);
      setInspectionJobForm({ assetType: "", inspector: "", location: "", urgency: "Medium", status: "Pending", scheduledDate: new Date().toISOString().split('T')[0] });
    } else if (category === ERPCategory.INSPECTION_REPORT) {
      state.setInspectionReports(prev => [...prev, {
        ...reportForm,
        id: uniqueId,
        testDate: new Date().toISOString().split('T')[0],
        checklist: [
          { id: "chk-new-1", task: "General Physical Structure Scan", status: "Pass" },
          { id: "chk-new-2", task: "Connection Joints Fatigue Check", status: "Pass" },
          { id: "chk-new-3", task: "Emergency Cut-off Verification", status: "Pass" },
        ]
      }]);
      setReportForm({ reportName: "", assetTested: "", inspector: "Nour Al-Faisal", complianceScore: 100, status: "Draft" });
    } else if (category === ERPCategory.MACHINE_CERTIFICATES) {
      state.setMachineCertificates(prev => [...prev, { ...certForm, id: uniqueId }]);
      setCertForm({ machineName: "", certificateNo: "", issuingBody: "VIM Inspection Services Group", issueDate: new Date().toISOString().split('T')[0], expiryDate: "", status: "Valid" });
    } else if (category === ERPCategory.LIFTING_TOOL_CERTIFICATE) {
      state.setLiftingToolCerts(prev => [...prev, { ...liftingCertForm, id: uniqueId }]);
      setLiftingCertForm({ toolName: "", serialNumber: "", safeWorkingLoad: "5T", testStandard: "BS EN 13889", lastTestedDate: new Date().toISOString().split('T')[0], expiryDate: "", status: "Valid" });
    } else if (category === ERPCategory.MACHINE_DETAILS) {
      state.setMachineDetails(prev => [...prev, { ...machineForm, id: uniqueId, workingHours: Number(machineForm.workingHours) }]);
      setMachineForm({ name: "", model: "", serialNumber: "", department: "Heavy Equipment Fleet", workingHours: 100, status: "Operational", location: "" });
    } else if (category === ERPCategory.OPERATOR_CARD) {
      state.setOperators(prev => [...prev, { ...operatorForm, id: uniqueId, authorizedEquipment: operatorForm.authorizedEquipment.split(",").map(s => s.trim()) }]);
      setOperatorForm({ operatorName: "", badgeNumber: "", authorizedEquipment: "", safetyIndex: 98, licenseExpiry: "", status: "Fully Certified", trainedBy: "" });
    }

    state.incrementCardCount(category);
    setShowAddForm(false);
  };

  // Toggle report checklist status
  const toggleChecklistStatus = (reportId: string, itemKeysId: string) => {
    state.setInspectionReports(prev => prev.map(report => {
      if (report.id === reportId) {
        const updatedChecklist = report.checklist.map((item: any) => {
          if (item.id === itemKeysId) {
            const nextStatus: any = item.status === "Pass" ? "Fail" : item.status === "Fail" ? "N/A" : "Pass";
            return { ...item, status: nextStatus };
          }
          return item;
        });

        // Compute new compliance score
        const totalEvaluated = updatedChecklist.filter((c: any) => c.status !== "N/A").length;
        const totalPassed = updatedChecklist.filter((c: any) => c.status === "Pass").length;
        const newScore = totalEvaluated > 0 ? Math.round((totalPassed / totalEvaluated) * 100) : 100;

        return { ...report, checklist: updatedChecklist, complianceScore: newScore };
      }
      return report;
    }));
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status.toUpperCase();
    if (["ACTIVE", "VALID", "OPERATIONAL", "APPROVED", "FULLY CERTIFIED", "PASS"].includes(s)) {
      return "bg-emerald-50 text-emerald-700 border border-emerald-200/65 text-xs font-semibold px-2 py-0.5 rounded-full";
    }
    if (["PENDING REVIEW", "ON LEAVE", "UNDER REVIEW", "SCHEDULED", "DRAFT", "GRACE PERIOD", "EXPIRING SOON", "IN PROGRESS"].includes(s)) {
      return "bg-amber-50 text-amber-700 border border-amber-200/65 text-xs font-semibold px-2 py-0.5 rounded-full";
    }
    if (["SUSPENDED", "EXPIRED", "BREAKDOWN", "REQUIRES FIX", "FAIL", "CANCELLED"].includes(s)) {
      return "bg-rose-50 text-rose-700 border border-rose-200/65 text-xs font-semibold px-2 py-0.5 rounded-full";
    }
    return "bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold px-2 py-0.5 rounded-full";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-slate-900/40 backdrop-blur-sm" id="modal-container">
        {/* Backdrop close area */}
        <div className="absolute inset-0" onClick={onClose} id="modal-backdrop-close" />

        {/* Content slide panel */}
        <motion.div
          initial={{ x: "100%", opacity: 0.95 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative z-10 flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl border-l border-slate-100"
          id="modal-sliding-content"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${getCategoryThemeColor()}`}>
                <LucideIcon name={getCategoryIcon()} className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-slate-800" id="modal-title">{category}</h2>
                <p className="text-sm text-slate-400">Total metrics records: <span className="font-semibold text-slate-700">{currentRecords.length}</span></p>
              </div>
            </div>
            <button
              id="modal-close-btn"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            >
              <Icons.X className="h-6 h-6" />
            </button>
          </div>

          {/* Sub Header / Control Actions */}
          <div className="flex flex-col gap-4 border-b border-slate-50 bg-slate-50/50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 min-w-[280px] sm:flex-row">
              {/* Search */}
              <div className="relative flex-1">
                <Icons.Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="modal-search-field"
                  type="text"
                  placeholder={`Search ${category}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-4 pl-9 text-sm text-slate-700 placeholder-slate-400 focus:border-[#683EFF] focus:outline-none focus:ring-1 focus:ring-[#683EFF]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Status Filter dropdown */}
              <select
                id="modal-filter-dropdown"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-[#683EFF] focus:outline-none focus:ring-1 focus:ring-[#683EFF]"
              >
                <option value="ALL">All Statuses</option>
                {category === ERPCategory.CUSTOMER_DETAILS && (
                  <>
                    <option value="Active">Active</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Suspended">Suspended</option>
                  </>
                )}
                {category === ERPCategory.EMPLOYEE_DETAILS && (
                  <>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                  </>
                )}
                {category === ERPCategory.TRAINING_JOB_ORDER_CARD && (
                  <>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </>
                )}
                {category === ERPCategory.INSPECTION_JOB_ORDER_CARD && (
                  <>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Completed">Completed</option>
                  </>
                )}
                {category === ERPCategory.INSPECTION_REPORT && (
                  <>
                    <option value="Approved">Approved</option>
                    <option value="Requires Fix">Requires Fix</option>
                    <option value="Draft">Draft</option>
                  </>
                )}
                {category === ERPCategory.MACHINE_CERTIFICATES && (
                  <>
                    <option value="Valid">Valid</option>
                    <option value="Expired">Expired</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                  </>
                )}
                {category === ERPCategory.LIFTING_TOOL_CERTIFICATE && (
                  <>
                    <option value="Valid">Valid</option>
                    <option value="Expired">Expired</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                  </>
                )}
                {category === ERPCategory.MACHINE_DETAILS && (
                  <>
                    <option value="Operational">Operational</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Breakdown">Breakdown</option>
                  </>
                )}
                {category === ERPCategory.OPERATOR_CARD && (
                  <>
                    <option value="Fully Certified">Fully Certified</option>
                    <option value="Grace Period">Grace Period</option>
                    <option value="Suspended">Suspended</option>
                  </>
                )}
              </select>
            </div>

            <button
              id="modal-add-form-toggle-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-1 rounded-lg bg-[#683EFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#522CD9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#683EFF] focus:ring-offset-2 shadow-sm"
            >
              {showAddForm ? <Icons.Eye className="h-4 w-4" /> : <Icons.Plus className="h-4 w-4" />}
              <span>{showAddForm ? "Show Records" : "Add Record"}</span>
            </button>
          </div>

          {/* Core Body Section (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6" id="modal-workspace-body">
            {/* ADD RECORD FORM (Collapsible overlay) */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-8 overflow-hidden rounded-xl border border-[#E0E7FF] bg-[#F5F7FF] p-6 text-slate-700"
                  id="add-record-form"
                >
                  <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center space-x-2">
                    <Icons.PlusCircle className="w-5 h-5 text-[#683EFF]" />
                    <span>Create New {category} Entry</span>
                  </h3>
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* CUSTOMER FORM */}
                    {category === ERPCategory.CUSTOMER_DETAILS && (
                      <>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Company Name</label>
                          <input required type="text" value={customerForm.companyName} onChange={e => setCustomerForm({...customerForm, companyName: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700" placeholder="e.g. Saudi Aramco Tech" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Country</label>
                          <select value={customerForm.country} onChange={e => setCustomerForm({...customerForm, country: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700">
                            <option>Saudi Arabia</option>
                            <option>United Arab Emirates</option>
                            <option>Qatar</option>
                            <option>Oman</option>
                            <option>Kuwait</option>
                            <option>Bahrain</option>
                          </select>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Contact Person</label>
                          <input required type="text" value={customerForm.contactPerson} onChange={e => setCustomerForm({...customerForm, contactPerson: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700" placeholder="Eng. Fahad" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Contact Email</label>
                          <input required type="email" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700" placeholder="contact@company.com" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Contact Phone</label>
                          <input required type="text" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700" placeholder="+966 50 123 4567" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Status</label>
                          <select value={customerForm.status} onChange={e => setCustomerForm({...customerForm, status: e.target.value as any})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700">
                            <option>Active</option>
                            <option>Pending Review</option>
                            <option>Suspended</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* EMPLOYEE FORM */}
                    {category === ERPCategory.EMPLOYEE_DETAILS && (
                      <>
                        <div className="flex flex-col col-span-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                          <input required type="text" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700" placeholder="Employee Display Name" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Designation Role</label>
                          <input required type="text" value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700" placeholder="e.g. Safety Inspector" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Department</label>
                          <select value={employeeForm.department} onChange={e => setEmployeeForm({...employeeForm, department: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700">
                            <option>Quality Assurance</option>
                            <option>Operations & HSE</option>
                            <option>Logistics</option>
                            <option>Executive Office</option>
                          </select>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Email</label>
                          <input required type="email" value={employeeForm.email} onChange={e => setEmployeeForm({...employeeForm, email: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700" placeholder="xyz@me-vim.com" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Status</label>
                          <select value={employeeForm.status} onChange={e => setEmployeeForm({...employeeForm, status: e.target.value as any})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700">
                            <option>Active</option>
                            <option>On Leave</option>
                            <option>Suspended</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* TRAINING JOB FORM */}
                    {category === ERPCategory.TRAINING_JOB_ORDER_CARD && (
                      <>
                        <div className="flex flex-col col-span-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Course Title</label>
                          <input required type="text" value={trainingForm.courseTitle} onChange={e => setTrainingForm({...trainingForm, courseTitle: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700" placeholder="e.g. Scaffolding Inspection Level 3" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Lead Instructor</label>
                          <input required type="text" value={trainingForm.instructor} onChange={e => setTrainingForm({...trainingForm, instructor: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700" placeholder="Instructor Name" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Registered Candidates</label>
                          <input required type="number" value={trainingForm.registeredCandidates} onChange={e => setTrainingForm({...trainingForm, registeredCandidates: Number(e.target.value)})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700" min="1" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Target Date</label>
                          <input required type="date" value={trainingForm.targetDate} onChange={e => setTrainingForm({...trainingForm, targetDate: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Training Location</label>
                          <input required type="text" value={trainingForm.location} onChange={e => setTrainingForm({...trainingForm, location: e.target.value})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700" placeholder="e.g. Dahran HQ A3" />
                        </div>
                        <div className="flex flex-col col-span-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Status</label>
                          <select value={trainingForm.status} onChange={e => setTrainingForm({...trainingForm, status: e.target.value as any})} className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-[#374151]">
                            <option>Scheduled</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* INSPECTION JOB FORM */}
                    {category === ERPCategory.INSPECTION_JOB_ORDER_CARD && (
                      <>
                        <div className="flex flex-col col-span-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Asset Type / Machine For Inspection</label>
                          <input required type="text" value={inspectionJobForm.assetType} onChange={e => setInspectionJobForm({...inspectionJobForm, assetType: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-[#374151]" placeholder="e.g. Tadano 50-Ton Mobile Crane" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Inspector Name</label>
                          <input required type="text" value={inspectionJobForm.inspector} onChange={e => setInspectionJobForm({...inspectionJobForm, inspector: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-[#374151]" placeholder="Assigned Inspector" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Location Site</label>
                          <input required type="text" value={inspectionJobForm.location} onChange={e => setInspectionJobForm({...inspectionJobForm, location: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-[#374151]" placeholder="Site address/port" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Scheduled Date</label>
                          <input required type="date" value={inspectionJobForm.scheduledDate} onChange={e => setInspectionJobForm({...inspectionJobForm, scheduledDate: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Urgency</label>
                          <select value={inspectionJobForm.urgency} onChange={e => setInspectionJobForm({...inspectionJobForm, urgency: e.target.value as any})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700">
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                          </select>
                        </div>
                        <div className="flex flex-col col-span-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Status</label>
                          <select value={inspectionJobForm.status} onChange={e => setInspectionJobForm({...inspectionJobForm, status: e.target.value as any})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700">
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Under Review</option>
                            <option>Completed</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* INSPECTION REPORT FORM */}
                    {category === ERPCategory.INSPECTION_REPORT && (
                      <>
                        <div className="flex flex-col col-span-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Report Description Name</label>
                          <input required type="text" value={reportForm.reportName} onChange={e => setReportForm({...reportForm, reportName: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" placeholder="e.g. Spreader Beam Loading Audit 2026" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Asset Tested</label>
                          <input required type="text" value={reportForm.assetTested} onChange={e => setReportForm({...reportForm, assetTested: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-[#374151]" placeholder="Target Asset (S/N)" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Auditor Inspector</label>
                          <input required type="text" value={reportForm.inspector} onChange={e => setReportForm({...reportForm, inspector: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-[#374151]" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Initial Status</label>
                          <select value={reportForm.status} onChange={e => setReportForm({...reportForm, status: e.target.value as any})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700">
                            <option>Draft</option>
                            <option>Approved</option>
                            <option>Requires Fix</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* MACHINE CERTIFICATES FORM */}
                    {category === ERPCategory.MACHINE_CERTIFICATES && (
                      <>
                        <div className="flex flex-col col-span-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Machine Asset Class</label>
                          <input required type="text" value={certForm.machineName} onChange={e => setCertForm({...certForm, machineName: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" placeholder="e.g. Tadano Mobile Crane 30T" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Certificate Serial No.</label>
                          <input required type="text" value={certForm.certificateNo} onChange={e => setCertForm({...certForm, certificateNo: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" placeholder="ME-VIM-2026-XXXX" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Expiry Date</label>
                          <input required type="date" value={certForm.expiryDate} onChange={e => setCertForm({...certForm, expiryDate: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-[#374151]" />
                        </div>
                        <div className="flex flex-col col-span-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Status</label>
                          <select value={certForm.status} onChange={e => setCertForm({...certForm, status: e.target.value as any})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700">
                            <option>Valid</option>
                            <option>Expired</option>
                            <option>Expiring Soon</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* LIFTING TOOL CERTIFICATE FORM */}
                    {category === ERPCategory.LIFTING_TOOL_CERTIFICATE && (
                      <>
                        <div className="flex flex-col col-span-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Tool Accessories Name</label>
                          <input required type="text" value={liftingCertForm.toolName} onChange={e => setLiftingCertForm({...liftingCertForm, toolName: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" placeholder="e.g. Crosby Safety Shackle" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Serial Number</label>
                          <input required type="text" value={liftingCertForm.serialNumber} onChange={e => setLiftingCertForm({...liftingCertForm, serialNumber: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" placeholder="SH-XXXXX" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Safe Working Load (SWL)</label>
                          <input required type="text" value={liftingCertForm.safeWorkingLoad} onChange={e => setLiftingCertForm({...liftingCertForm, safeWorkingLoad: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" placeholder="e.g. 5T or 12T" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Expiry Date</label>
                          <input required type="date" value={liftingCertForm.expiryDate} onChange={e => setLiftingCertForm({...liftingCertForm, expiryDate: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-[#374151]" />
                        </div>
                        <div className="flex flex-col text-slate-700">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Lifting Standard</label>
                          <input type="text" value={liftingCertForm.testStandard} onChange={e => setLiftingCertForm({...liftingCertForm, testStandard: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm" />
                        </div>
                      </>
                    )}

                    {/* MACHINE DETAILS */}
                    {category === ERPCategory.MACHINE_DETAILS && (
                      <>
                        <div className="flex flex-col col-span-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Machine Name</label>
                          <input required type="text" value={machineForm.name} onChange={e => setMachineForm({...machineForm, name: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" placeholder="e.g. Kato Heavy Hydraulic Crane" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Maker / Model</label>
                          <input required type="text" value={machineForm.model} onChange={e => setMachineForm({...machineForm, model: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-[#374151]" placeholder="e.g. TR-500-Series" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Serial Number</label>
                          <input required type="text" value={machineForm.serialNumber} onChange={e => setMachineForm({...machineForm, serialNumber: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" placeholder="K-SER-XXXX" />
                        </div>
                        <div className="flex flex-col text-slate-700">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Running Working Hours</label>
                          <input required type="number" value={machineForm.workingHours} onChange={e => setMachineForm({...machineForm, workingHours: Number(e.target.value)})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm" min="0" />
                        </div>
                        <div className="flex flex-col text-slate-700">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Current Deploy Site</label>
                          <input required type="text" value={machineForm.location} onChange={e => setMachineForm({...machineForm, location: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm" placeholder="Location Site" />
                        </div>
                        <div className="flex flex-col col-span-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Working Condition Status</label>
                          <select value={machineForm.status} onChange={e => setMachineForm({...machineForm, status: e.target.value as any})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700">
                            <option>Operational</option>
                            <option>Maintenance</option>
                            <option>Breakdown</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* OPERATOR CARD FORM */}
                    {category === ERPCategory.OPERATOR_CARD && (
                      <>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Operator Display Name</label>
                          <input required type="text" value={operatorForm.operatorName} onChange={e => setOperatorForm({...operatorForm, operatorName: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" placeholder="Operator Name" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Badge ID Number</label>
                          <input required type="text" value={operatorForm.badgeNumber} onChange={e => setOperatorForm({...operatorForm, badgeNumber: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" placeholder="MEV-XXXX" />
                        </div>
                        <div className="flex flex-col col-span-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Authorized Heavy Equipments (Comma separated)</label>
                          <input required type="text" value={operatorForm.authorizedEquipment} onChange={e => setOperatorForm({...operatorForm, authorizedEquipment: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" placeholder="e.g. Mobile Cranes, Forklifts, Tower Cranes" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Safety Audit Index (%)</label>
                          <input required type="number" value={operatorForm.safetyIndex} onChange={e => setOperatorForm({...operatorForm, safetyIndex: Number(e.target.value)})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-[#374151]" min="1" max="100" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">Trained By</label>
                          <input type="text" value={operatorForm.trainedBy} onChange={e => setOperatorForm({...operatorForm, trainedBy: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" placeholder="e.g. Khalid Amir Hussain" />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-500 mb-1">License Expiry Date</label>
                          <input required type="date" value={operatorForm.licenseExpiry} onChange={e => setOperatorForm({...operatorForm, licenseExpiry: e.target.value})} className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700" />
                        </div>
                      </>
                    )}

                    <div className="mt-2 flex justify-end col-span-1 sm:col-span-2 space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-[#683EFF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#522CD9] transition-colors hover:shadow"
                      >
                        Add Record Entry
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty States */}
            {filteredRecords.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-slate-700">
                <Icons.Inbox className="h-12 w-12 text-[#683EFF]/30 mb-3" />
                <h4 className="text-sm font-bold text-slate-800">Empty Page</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {currentRecords.length === 0 
                    ? "This category is currently empty. Later you can tell me what to add here."
                    : "Try adjusting your search terms or status filter"}
                </p>
              </div>
            )}

            {/* List and Tables depending on categories */}
            {filteredRecords.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm scrollbar-thin">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 select-none">
                      {category === ERPCategory.CUSTOMER_DETAILS && (
                        <>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">ID</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Company</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Contact Person</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Country</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                        </>
                      )}
                      {category === ERPCategory.EMPLOYEE_DETAILS && (
                        <>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">ID</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Employee</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Department</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Contacts</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                        </>
                      )}
                      {category === ERPCategory.TRAINING_JOB_ORDER_CARD && (
                        <>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">ID</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Course / Instructor</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Date</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Reg</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                        </>
                      )}
                      {category === ERPCategory.INSPECTION_JOB_ORDER_CARD && (
                        <>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Order ID</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Asset for Inspection</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Inspector / Site</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Urgency</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                        </>
                      )}
                      {category === ERPCategory.INSPECTION_REPORT && (
                        <>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Report ID</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Audit Report Name</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Inspector</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Compliance %</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Checklist</th>
                        </>
                      )}
                      {category === ERPCategory.MACHINE_CERTIFICATES && (
                        <>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Cert No.</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Machine Detail</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Issued By</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Expiry</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                        </>
                      )}
                      {category === ERPCategory.LIFTING_TOOL_CERTIFICATE && (
                        <>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Tool S/N</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Lifting Gear Tool</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">SWL Capacity</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Expiry</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                        </>
                      )}
                      {category === ERPCategory.MACHINE_DETAILS && (
                        <>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Machine ID</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Equipment Fleet</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Site Deploy Space</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Operating Hours</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                        </>
                      )}
                      {category === ERPCategory.OPERATOR_CARD && (
                        <>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Badge ID</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Operator</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Authorizations</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Safety Rating</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record: any, index: number) => (
                      <React.Fragment key={record.id}>
                        <tr className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0 transition-colors text-slate-700">
                          {/* CUSTOMERS */}
                          {category === ERPCategory.CUSTOMER_DETAILS && (
                            <>
                              <td className="p-3 font-mono text-xs font-bold text-[#683EFF]">{record.id}</td>
                              <td className="p-3">
                                <p className="text-sm font-semibold text-slate-800">{record.companyName}</p>
                              </td>
                              <td className="p-3">
                                <p className="text-xs text-slate-600 font-medium">{record.contactPerson}</p>
                                <p className="text-[11px] text-slate-400">{record.email}</p>
                              </td>
                              <td className="p-3 text-sm text-slate-600 font-medium">{record.country}</td>
                              <td className="p-3">
                                <span className={getStatusBadgeClass(record.status)}>{record.status}</span>
                              </td>
                            </>
                          )}

                          {/* EMPLOYEES */}
                          {category === ERPCategory.EMPLOYEE_DETAILS && (
                            <>
                              <td className="p-3 font-mono text-xs text-[#683EFF] font-bold">{record.id}</td>
                              <td className="p-3">
                                <p className="text-sm font-bold text-slate-800">{record.name}</p>
                                <p className="text-xs text-[#683EFF] font-medium">{record.role}</p>
                              </td>
                              <td className="p-3">
                                <p className="text-xs text-slate-600 font-medium">{record.department}</p>
                                <p className="text-[10px] text-slate-300">Joined: {formatDate(record.joiningDate)}</p>
                              </td>
                              <td className="p-3 text-xs">
                                <p className="text-slate-600 font-medium">{record.email}</p>
                                <p className="text-slate-400">{record.phone}</p>
                              </td>
                              <td className="p-3">
                                <span className={getStatusBadgeClass(record.status)}>{record.status}</span>
                              </td>
                            </>
                          )}

                          {/* TRAINING JOBS */}
                          {category === ERPCategory.TRAINING_JOB_ORDER_CARD && (
                            <>
                              <td className="p-3 font-mono text-xs text-[#683EFF] font-bold">{record.id}</td>
                              <td className="p-3">
                                <p className="text-sm font-bold text-slate-800">{record.courseTitle}</p>
                                <p className="text-xs text-slate-500 flex items-center">
                                  <Icons.User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                  <span>Instructor: {record.instructor}</span>
                                </p>
                              </td>
                              <td className="p-3">
                                <p className="text-xs text-slate-600 font-semibold">{formatDate(record.targetDate)}</p>
                                <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{record.location}</p>
                              </td>
                              <td className="p-3 text-sm font-bold text-[#683EFF]">
                                {record.registeredCandidates}
                              </td>
                              <td className="p-3">
                                <span className={getStatusBadgeClass(record.status)}>{record.status}</span>
                              </td>
                            </>
                          )}

                          {/* INSPECTION JOBS */}
                          {category === ERPCategory.INSPECTION_JOB_ORDER_CARD && (
                            <>
                              <td className="p-3 font-mono text-xs text-[#683EFF] font-bold">{record.id}</td>
                              <td className="p-3">
                                <p className="text-sm font-bold text-slate-800">{record.assetType}</p>
                                <p className="text-[10px] text-slate-400">Scheduled: {formatDate(record.scheduledDate)}</p>
                              </td>
                              <td className="p-3 text-xs">
                                <p className="text-slate-600 font-semibold">Inspector: {record.inspector}</p>
                                <p className="text-slate-400 flex items-center">
                                  <Icons.MapPin className="w-3 h-3 mr-0.5 text-slate-300" />
                                  <span>{record.location}</span>
                                </p>
                              </td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ring-1 ${
                                  record.urgency === "High" ? "bg-red-50 text-red-600 ring-red-100" :
                                  record.urgency === "Medium" ? "bg-amber-50 text-amber-600 ring-amber-100" :
                                  "bg-slate-50 text-slate-600 ring-slate-100"
                                }`}>
                                  {record.urgency}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={getStatusBadgeClass(record.status)}>{record.status}</span>
                              </td>
                            </>
                          )}

                          {/* INSPECTION REPORTS */}
                          {category === ERPCategory.INSPECTION_REPORT && (
                            <>
                              <td className="p-3 font-mono text-xs text-[#683EFF] font-bold">{record.id}</td>
                              <td className="p-3">
                                <p className="text-sm font-bold text-slate-800">{record.reportName}</p>
                                <p className="text-xs text-slate-400">Asset: {record.assetTested}</p>
                              </td>
                              <td className="p-3 text-xs">
                                <p className="text-slate-600 font-semibold">{record.inspector}</p>
                                <p className="text-[10px] text-slate-300">Audited: {formatDate(record.testDate)}</p>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center space-x-1.5">
                                  <span className={`text-xs font-bold ${record.complianceScore >= 95 ? 'text-emerald-600' : record.complianceScore >= 80 ? 'text-amber-500' : 'text-rose-600'}`}>
                                    {record.complianceScore}%
                                  </span>
                                  <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${record.complianceScore >= 95 ? 'bg-emerald-500' : record.complianceScore >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${record.complianceScore}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={getStatusBadgeClass(record.status)}>{record.status}</span>
                              </td>
                              <td className="p-3">
                                <button
                                  id={`report-checklist-toggle-${record.id}`}
                                  onClick={() => setExpandedReportId(expandedReportId === record.id ? null : record.id)}
                                  className="flex items-center space-x-1 text-xs font-bold text-[#683EFF] hover:text-[#522CD9]"
                                >
                                  {expandedReportId === record.id ? (
                                    <>
                                      <span>Close</span>
                                      <Icons.ChevronUp className="w-3.5 h-3.5" />
                                    </>
                                  ) : (
                                    <>
                                      <span>View Tasks</span>
                                      <Icons.ChevronDown className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </button>
                              </td>
                            </>
                          )}

                          {/* MACHINE CERTIFICATES */}
                          {category === ERPCategory.MACHINE_CERTIFICATES && (
                            <>
                              <td className="p-3 font-mono text-xs text-[#683EFF] font-bold">{record.certificateNo}</td>
                              <td className="p-3">
                                <p className="text-sm font-bold text-slate-800">{record.machineName}</p>
                                <p className="text-[10px] text-slate-400">Issued: {formatDate(record.issueDate)}</p>
                              </td>
                              <td className="p-3 text-xs text-slate-600 font-medium">{record.issuingBody}</td>
                              <td className="p-3 text-xs text-slate-600 font-bold">{formatDate(record.expiryDate)}</td>
                              <td className="p-3">
                                <span className={getStatusBadgeClass(record.status)}>{record.status}</span>
                              </td>
                            </>
                          )}

                          {/* LIFTING TOOL CERTIFICATES */}
                          {category === ERPCategory.LIFTING_TOOL_CERTIFICATE && (
                            <>
                              <td className="p-3 font-mono text-xs text-[#683EFF] font-bold">{record.serialNumber}</td>
                              <td className="p-3">
                                <p className="text-sm font-bold text-slate-800">{record.toolName}</p>
                                <p className="text-[10px] text-slate-400">Std: {record.testStandard}</p>
                              </td>
                              <td className="p-3 text-xs font-bold text-[#683EFF]">{record.safeWorkingLoad}</td>
                              <td className="p-3 text-xs">
                                <p className="text-slate-600 font-semibold">Exp: {formatDate(record.expiryDate)}</p>
                                <p className="text-[10px] text-slate-300">Test: {formatDate(record.lastTestedDate)}</p>
                              </td>
                              <td className="p-3">
                                <span className={getStatusBadgeClass(record.status)}>{record.status}</span>
                              </td>
                            </>
                          )}

                          {/* MACHINE DETAILS */}
                          {category === ERPCategory.MACHINE_DETAILS && (
                            <>
                              <td className="p-3 font-mono text-xs text-[#683EFF] font-bold">{record.id}</td>
                              <td className="p-3">
                                <p className="text-sm font-bold text-slate-800">{record.name}</p>
                                <p className="text-xs text-slate-400">Model: {record.model} | S/N: {record.serialNumber}</p>
                              </td>
                              <td className="p-3">
                                <p className="text-xs text-slate-600 font-semibold">{record.location}</p>
                                <p className="text-[10px] text-slate-400">{record.department}</p>
                              </td>
                              <td className="p-3 text-xs font-mono text-slate-600 font-bold">
                                {record.workingHours.toLocaleString()} Hrs
                              </td>
                              <td className="p-3">
                                <span className={getStatusBadgeClass(record.status)}>{record.status}</span>
                              </td>
                            </>
                          )}

                          {/* OPERATOR CARDS */}
                          {category === ERPCategory.OPERATOR_CARD && (
                            <>
                              <td className="p-3 font-mono text-xs text-[#683EFF] font-bold">{record.badgeNumber}</td>
                              <td className="p-3">
                                <p className="text-sm font-bold text-slate-800">{record.operatorName}</p>
                                <p className="text-[10px] text-slate-300">License Exp: {formatDate(record.licenseExpiry)}</p>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1 max-w-[220px]">
                                  {record.authorizedEquipment.map((eq: string, idx: number) => (
                                    <span key={idx} className="bg-[#F0EBFF] text-[#683EFF] text-[9px] px-1.5 py-0.5 rounded-sm border border-[#DED3FF] font-medium">
                                      {eq}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center space-x-1">
                                  <span className={`text-xs font-bold ${record.safetyIndex >= 95 ? "text-emerald-600" : "text-amber-500"}`}>{record.safetyIndex}%</span>
                                  <Icons.ShieldAlert className={`w-3.5 h-3.5 ${record.safetyIndex >= 95 ? "text-emerald-500" : "text-amber-500"}`} />
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={getStatusBadgeClass(record.status)}>{record.status}</span>
                              </td>
                            </>
                          )}
                        </tr>

                        {/* Expandable Safety Checklist for reports */}
                        {category === ERPCategory.INSPECTION_REPORT && expandedReportId === record.id && (
                          <tr className="bg-slate-50/75 select-none" id={`checklist-row-${record.id}`}>
                            <td colSpan={6} className="p-5 border-b border-[#DED3FF]">
                              <div className="rounded-lg border border-[#DED3FF] bg-white p-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#683EFF] mb-3 flex items-center space-x-1">
                                  <Icons.ClipboardList className="w-4 h-4" />
                                  <span>Dynamic Safety Audit Checklist items (Tap Status to Toggle)</span>
                                </h4>
                                <div className="space-y-2">
                                  {record.checklist?.map((chkItem: any) => (
                                    <div
                                      key={chkItem.id}
                                      className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-2 last:pb-0"
                                    >
                                      <div>
                                        <p className="text-xs font-bold text-slate-700">{chkItem.task}</p>
                                        {chkItem.comments && (
                                          <p className="text-[10px] text-rose-500 italic mt-0.5">Note: {chkItem.comments}</p>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => toggleChecklistStatus(record.id, chkItem.id)}
                                        className="focus:outline-none"
                                      >
                                        <span className={getStatusBadgeClass(chkItem.status)}>
                                          {chkItem.status}
                                        </span>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
