/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { CustomerDetail } from "../types";
import { PhoneCountryCodeInput } from "./PhoneCountryCodeInput";

const MONTH_MAP: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
};
const MONTHS_LIST = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface OperationalActivity {
  day: number;
  month: string;
  year: string;
  title: string;
  text: string;
}

const STATIC_ACTIVITIES: OperationalActivity[] = [
  // June 2026
  {
    day: 4,
    month: "June",
    year: "2026",
    title: "Annual Representative Check",
    text: "Ahmad updated the safety and inspect contact person alignment with Saudi prefixes."
  },
  {
    day: 12,
    month: "June",
    year: "2026",
    title: "Commercial VAT Papers Added",
    text: "Scanned commercial validation registration documents were attached successfully."
  },
  {
    day: 18,
    month: "June",
    year: "2026",
    title: "Checklist Profile Saved",
    text: "Primary account details and state validations marked compliant."
  },
  // July 2026
  {
    day: 8,
    month: "July",
    year: "2026",
    title: "Mid-Term Heavy Rigging Review",
    text: "Certification compliance checklists updated for all active mobile crane operators."
  },
  {
    day: 22,
    month: "July",
    year: "2026",
    title: "Security Protocols Audited",
    text: "Jeddah logistics yard validated against GCC security and access standards."
  },
  // August 2026
  {
    day: 14,
    month: "August",
    year: "2026",
    title: "Hydraulics System Re-Calibration",
    text: "Scheduled pressure diagnostics for the Tadano Mobile Crane 45T completed."
  },
  {
    day: 29,
    month: "August",
    year: "2026",
    title: "On-site Safety Drill Logged",
    text: "Documented the emergency crew muster procedure drills at Jubail Terminal 2."
  }
];

const getActivitiesForMonth = (month: string, year: string): { day: number; title: string; text: string }[] => {
  const statics = STATIC_ACTIVITIES.filter(act => act.month === month && act.year === year);
  if (statics.length > 0) {
    return statics.map(s => ({ day: s.day, title: s.title, text: s.text }));
  }

  // Generate deterministic mock activities based on the month/year name (seeded)
  const charSum = month.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + (parseInt(year, 10) || 2026);
  const day1 = (charSum % 10) + 3; // 3 - 12
  const day2 = (charSum % 12) + 16; // 16 - 27

  return [
    {
      day: day1,
      title: `${month} Compliance Alignment Check`,
      text: `Performed verification on state license updates and alignment parameters for ${month} ${year}.`
    },
    {
      day: day2,
      title: `Operational Clearance Update`,
      text: `Validated all physical safety equipment registrations and assigned logistics coordinator tags.`
    }
  ];
};

interface CustomerDetailPageProps {
  customer: CustomerDetail;
  onBack: () => void;
  onSave: (updatedCustomer: CustomerDetail) => void;
  onDelete: (id: string) => void;
  onDuplicate: (customer: CustomerDetail) => void;
  allCustomers: CustomerDetail[];
  onSelectCustomer: (customer: CustomerDetail) => void;
  onUploadImage?: (file: File, clientName: string, subfolder: string, entityId?: string) => Promise<string>;
}

export function CustomerDetailPage({
  customer,
  onBack,
  onSave,
  onDelete,
  onDuplicate,
  allCustomers,
  onSelectCustomer,
  onUploadImage
}: CustomerDetailPageProps) {
  // Tabs: "DETAILS" | "CONTACT_ADDRESS"
  const [activeTab, setActiveTab] = useState<"DETAILS" | "CONTACT_ADDRESS">("DETAILS");
  
  // Local form states matching the fields
  const [companyName, setCompanyName] = useState("");
  const [territory, setTerritory] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [fromLead, setFromLead] = useState("Select lead");
  const [customerGroup, setCustomerGroup] = useState("Regular Customers");
  const [fromOpportunity, setFromOpportunity] = useState("Select opportunity");
  const [accountManager, setAccountManager] = useState("Mohammed Khan");
  const [assignedTo, setAssignedTo] = useState("Mohammed Khan");
  
  // Contacts
  const [trainingContactPerson, setTrainingContactPerson] = useState("");
  const [trainingContactPhone, setTrainingContactPhone] = useState("");
  const [inspectionContactPerson, setInspectionContactPerson] = useState("");
  const [inspectionContactPhone, setInspectionContactPhone] = useState("");
  
  // Contact & Address tab states
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [primaryMobile, setPrimaryMobile] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [cityAddress, setCityAddress] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [zipPostalCode, setZipPostalCode] = useState("");
  const [status, setStatus] = useState<'Active' | 'Pending Review' | 'Suspended'>("Active");

  // Interaction dropdowns
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showAssignedToModal, setShowAssignedToModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"device" | "library" | "link" | "camera" | null>(null);
  const [attachments, setAttachments] = useState<Array<{
    id: string;
    name: string;
    size: string;
    date: string;
    type: string;
    url?: string;
  }>>([
    {
      id: "attach-1",
      name: "Commercial_VAT_Registration_2026.pdf",
      size: "2.4 MB",
      date: "2026-06-12",
      type: "device"
    },
    {
      id: "attach-2",
      name: "GCC_HSE_Policy_Validation.pdf",
      size: "1.8 MB",
      date: "2026-06-04",
      type: "library"
    }
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States for activity, timeline and comments section
  const [selectedMonth, setSelectedMonth] = useState("June");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [comments, setComments] = useState([
    {
      id: "comment-1",
      author: "GA",
      text: "Contract renewed for upcoming certification cycle.",
      time: "Recorded Note"
    },
    {
      id: "comment-2",
      author: "GA",
      text: "Primary inspection coordinator updated to Jeddah office.",
      time: "Recorded Note"
    }
  ]);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const nc = {
      id: `comment-${Date.now()}`,
      author: "MK",
      text: newComment.trim(),
      time: "Just now"
    };
    setComments([nc, ...comments]);
    setNewComment("");
    showToast("✓ Note added to profile comments.");
  };

  const yearNum = parseInt(selectedYear, 10) || 2026;
  const monthIndex = MONTH_MAP[selectedMonth] !== undefined ? MONTH_MAP[selectedMonth] : 5;

  const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
  const startDayOfWeek = new Date(yearNum, monthIndex, 1).getDay();

  const currentMonthActivities = getActivitiesForMonth(selectedMonth, selectedYear);
  const activeDaysMap = new Set(currentMonthActivities.map(a => a.day));

  const handlePrevMonth = () => {
    let prevMonthIndex = monthIndex - 1;
    let prevYear = yearNum;
    if (prevMonthIndex < 0) {
      prevMonthIndex = 11;
      prevYear -= 1;
    }
    const prevMonthName = MONTHS_LIST[prevMonthIndex];
    setSelectedMonth(prevMonthName);
    setSelectedYear(prevYear.toString());
    showToast(`Switched calendar view to ${prevMonthName} ${prevYear}`);
  };

  const handleNextMonth = () => {
    let nextMonthIndex = monthIndex + 1;
    let nextYear = yearNum;
    if (nextMonthIndex > 11) {
      nextMonthIndex = 0;
      nextYear += 1;
    }
    const nextMonthName = MONTHS_LIST[nextMonthIndex];
    setSelectedMonth(nextMonthName);
    setSelectedYear(nextYear.toString());
    showToast(`Switched calendar view to ${nextMonthName} ${nextYear}`);
  };

  // Sync state with incoming customer changes/selection
  useEffect(() => {
    if (customer) {
      setCompanyName(customer.companyName || "");
      setTerritory(customer.country || "Jeddah, KSA");
      setCustomerType(customer.customerType || "Company");
      setStatus(customer.status || "Active");
      
      // Load fallback or existing custom options
      setTrainingContactPerson(customer.trainingContactPerson || "");
      setTrainingContactPhone(customer.trainingContactPhone || "");
      setInspectionContactPerson(customer.inspectionContactPerson || "");
      setInspectionContactPhone(customer.inspectionContactPhone || "");
      
      setPrimaryEmail(customer.email || "");
      setPrimaryMobile(customer.phone || "");
      
      setAddressLine1(customer.addressLine1 || "");
      setAddressLine2(customer.addressLine2 || "");
      setCityAddress(customer.cityAddress || "");
      setStateProvince(customer.stateProvince || "");
      setZipPostalCode(customer.zipPostalCode || "");
    }
  }, [customer]);

  // Toast trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Save changes
  const handleSave = () => {
    const updated: CustomerDetail = {
      ...customer,
      companyName,
      country: territory,
      customerType,
      status,
      trainingContactPerson,
      trainingContactPhone,
      inspectionContactPerson,
      inspectionContactPhone,
      email: primaryEmail,
      phone: primaryMobile,
      addressLine1,
      addressLine2,
      cityAddress,
      stateProvince,
      zipPostalCode,
      lastUpdated: new Date().toISOString().split("T")[0]
    };
    onSave(updated);
    showToast("✓ Customer profile details saved successfully.");
  };

  // Find index in parent list to handle < and > buttons
  const currentIndex = allCustomers.findIndex(c => c.id === customer.id);
  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectCustomer(allCustomers[currentIndex - 1]);
    } else {
      showToast("First customer in database reached.");
    }
  };

  const handleNext = () => {
    if (currentIndex < allCustomers.length - 1) {
      onSelectCustomer(allCustomers[currentIndex + 1]);
    } else {
      showToast("Last customer in database reached.");
    }
  };

  // Actions trigger: Print
  const triggerPrintModel = () => {
    setShowPrintModal(true);
    setShowActionsDropdown(false);
  };

  // Actions trigger: Duplicate
  const triggerDuplicate = () => {
    onDuplicate(customer);
    setShowActionsDropdown(false);
    showToast("✓ Duplicated customer profile created.");
  };

  // Actions trigger: Export JSON
  const triggerExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customer, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `customer_${customer.id}_profile.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("✓ Exported customer profile JSON downloaded.");
    } catch (e) {
      showToast("Error exporting customer profile.");
    }
    setShowActionsDropdown(false);
  };

  // Actions trigger: Delete
  const triggerDeleteConfirm = () => {
    setShowDeleteConfirm(true);
    setShowActionsDropdown(false);
  };

  const confirmDelete = () => {
    onDelete(customer.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-6" id="customer-detail-page-container">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0E1B2D] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-in">
          <Icons.Info className="w-4 h-4 text-[#683EFF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Dialog: Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl z-10 space-y-4">
            <div className="text-center">
              <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icons.Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Delete {companyName}?</h3>
              <p className="text-xs text-slug-400 mt-1.5 leading-relaxed text-slate-500">
                Are you absolutely sure you want to permanently delete this customer profile? This action is irreversible.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 border border-slate-250 text-xs font-bold text-slate-500 rounded-lg bg-white hover:bg-slate-55"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog: Customer Document Attachments Pop up Modal */}
      {showAttachmentsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 select-none">
              <div className="flex items-center gap-2">
                <Icons.Paperclip className="w-5 h-5 text-[#683EFF]" />
                <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase font-mono">
                  CUSTOMER DOCUMENT ATTACHMENTS
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAttachmentsModal(false);
                  setSelectedOption(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-all"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Four selector boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOption("device")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedOption === "device"
                      ? "border-[#683EFF] bg-[#F6F3FF]/40 text-[#683EFF]"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <Icons.Smartphone className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold">From Device</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOption("library")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedOption === "library"
                      ? "border-[#683EFF] bg-[#F6F3FF]/40 text-[#683EFF]"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <Icons.Folder className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold">From Library</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOption("link")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedOption === "link"
                      ? "border-[#683EFF] bg-[#F6F3FF]/40 text-[#683EFF]"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <Icons.Link className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold">Attach Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOption("camera")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedOption === "camera"
                      ? "border-[#683EFF] bg-[#F6F3FF]/40 text-[#683EFF]"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <Icons.Camera className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold">Use Camera</span>
                </button>
              </div>

              {/* Central Viewport Box with custom border styling */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-h-[140px] flex flex-col items-center justify-center transition-all">
                {!selectedOption && (
                  <p className="text-xs font-semibold text-slate-400 text-center">
                    Please select an upload option above to add files to this workspace profile.
                  </p>
                )}

                {selectedOption === "device" && (
                  <div className="w-full max-w-sm text-center space-y-3">
                    <p className="text-xs font-bold text-slate-700">Upload document from device</p>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-slate-400 transition-colors bg-white relative cursor-pointer">
                      <input
                        type="file"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (onUploadImage) {
                              showToast("Uploading document...");
                              try {
                                const url = await onUploadImage(file, customer.companyName || "General", "Portfolio");
                                const newFile = {
                                  id: `attach-${Date.now()}`,
                                  name: file.name,
                                  size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
                                  date: new Date().toISOString().split("T")[0],
                                  type: "device",
                                  url: url
                                };
                                setAttachments(prev => [newFile, ...prev]);
                                setSelectedOption(null);
                                showToast(`✓ Document "${file.name}" uploaded successfully!`);
                              } catch (err) {
                                console.error(err);
                                const newFile = {
                                  id: `attach-${Date.now()}`,
                                  name: file.name,
                                  size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
                                  date: new Date().toISOString().split("T")[0],
                                  type: "device"
                                };
                                setAttachments(prev => [newFile, ...prev]);
                                setSelectedOption(null);
                                showToast(`✓ Attached locally (Drive upload failed).`);
                              }
                            } else {
                              const newFile = {
                                id: `attach-${Date.now()}`,
                                name: file.name,
                                size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
                                date: new Date().toISOString().split("T")[0],
                                type: "device"
                              };
                              setAttachments(prev => [newFile, ...prev]);
                              setSelectedOption(null);
                              showToast(`✓ Document "${file.name}" attached successfully.`);
                            }
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Icons.Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <span className="text-xs text-slate-500 font-semibold block">Click to browse or drag your file here</span>
                      <span className="text-[10px] text-slate-400 block mt-1">PDF, DOCX, PNG, JPG up to 10MB</span>
                    </div>
                  </div>
                )}

                {selectedOption === "library" && (
                  <div className="w-full max-w-lg text-center space-y-3">
                    <p className="text-xs font-bold text-slate-700">Select standard compliance documents</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {[
                        "GCC_HSE_Policy_Aramco.pdf",
                        "Site_Logistics_Manual_2026.docx",
                        "CR_Dammam_Registration_Papers.pdf",
                        "Standard_Commercial_Insurance_Cert.pdf"
                      ].map((docName, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const randSize = (1.2 + idx * 0.7).toFixed(1) + " MB";
                            const newFile = {
                              id: `attach-${Date.now()}-${idx}`,
                              name: docName,
                              size: randSize,
                              date: new Date().toISOString().split("T")[0],
                              type: "library"
                            };
                            setAttachments(prev => [newFile, ...prev]);
                            setSelectedOption(null);
                            showToast(`✓ Library document "${docName}" attached.`);
                          }}
                          className="flex items-center gap-2 text-left p-2.5 bg-white border border-slate-200 rounded-lg hover:border-[#683EFF] hover:bg-[#F6F3FF]/20 transition-all text-xs font-semibold text-slate-605"
                        >
                          <Icons.FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="truncate">{docName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOption === "link" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const linkName = formData.get("linkName") as string;
                      const linkUrl = formData.get("linkUrl") as string;
                      if (!linkUrl) return;

                      const nameToUse = linkName.trim() || linkUrl.replace(/https?:\/\//, '').split('/')[0] || "Web Link";
                      const newFile = {
                        id: `attach-${Date.now()}`,
                        name: nameToUse.endsWith(".url") || nameToUse.includes(".") ? nameToUse : nameToUse + " (Link)",
                        size: "Link",
                        date: new Date().toISOString().split("T")[0],
                        type: "link",
                        url: linkUrl
                      };
                      setAttachments(prev => [newFile, ...prev]);
                      setSelectedOption(null);
                      showToast(`✓ Dynamic network link attached.`);
                    }}
                    className="w-full max-w-sm space-y-3"
                  >
                    <p className="text-xs font-bold text-slate-700">Attach secure web/document link</p>
                    <div className="space-y-2">
                      <input
                        name="linkName"
                        type="text"
                        placeholder="Document Name (e.g. Sharepoint Resource)"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-white font-semibold"
                      />
                      <input
                        name="linkUrl"
                        type="url"
                        required
                        placeholder="Web URL https://..."
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#683EFF] bg-white font-semibold"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#683EFF] hover:bg-[#5730E6] text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Icons.Plus className="w-3.5 h-3.5" /> Attach URL Link
                    </button>
                  </form>
                )}

                {selectedOption === "camera" && (
                  <div className="w-full max-w-sm text-center space-y-3">
                    <p className="text-xs font-bold text-slate-700">Simulated Camera Scanner</p>
                    <div className="aspect-video bg-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-850">
                      <Icons.Camera className="w-8 h-8 text-slate-500 animate-pulse" />
                      <span className="text-[10px] text-slate-400 font-bold mt-2">Ready to scan document...</span>
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-[8px] text-emerald-400 font-mono font-bold uppercase">Live Preview</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newFile = {
                          id: `attach-[${Date.now()}]`,
                          name: `Mobile_Scan_${Math.floor(1000 + Math.random() * 9000)}.jpg`,
                          size: "820 KB",
                          date: new Date().toISOString().split("T")[0],
                          type: "camera"
                        };
                        setAttachments(prev => [newFile, ...prev]);
                        setSelectedOption(null);
                        showToast(`✓ Camera document snapshot captured and attached.`);
                      }}
                      className="w-full bg-[#683EFF] hover:bg-[#5730E6] text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Capture Document Snapshot
                    </button>
                  </div>
                )}
              </div>

              {/* CUSTOMER DOCUMENT PORTFOLIO SECTION */}
              <div className="space-y-3 select-none">
                <p className="text-[10px] font-black text-slate-400 tracking-wider uppercase font-mono">
                  CUSTOMER DOCUMENT PORTFOLIO ({attachments.length})
                </p>

                {attachments.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-205 border-slate-200 rounded-xl p-6 text-center text-slate-400 font-semibold text-xs py-8">
                    No active files attached to this customer record.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {attachments.map((file) => {
                      let fileIcon = <Icons.File className="w-4 h-4 text-slate-400" />;
                      if (file.type === "device" || file.name.endsWith(".pdf")) fileIcon = <Icons.FileText className="w-4 h-4 text-rose-500" />;
                      if (file.type === "link") fileIcon = <Icons.Globe className="w-4 h-4 text-blue-500" />;
                      if (file.type === "camera") fileIcon = <Icons.Camera className="w-4 h-4 text-purple-500" />;

                      return (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/50 transition-colors text-left">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 bg-white rounded-lg border border-slate-200/60 grow-0 shrink-0">
                              {fileIcon}
                            </div>
                            <div className="min-w-0">
                              {file.url ? (
                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-700 hover:text-[#683EFF] hover:underline block truncate">
                                  {file.name}
                                </a>
                              ) : (
                                <span className="text-xs font-bold text-slate-700 block truncate">{file.name}</span>
                              )}
                              <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                                {file.size} • Uploaded {file.date}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAttachments(prev => prev.filter(f => f.id !== file.id));
                              showToast(`✓ Attachment "${file.name}" removed.`);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2 cursor-pointer"
                            title="Delete document attachment"
                          >
                            <Icons.Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Action Dialog: Printable profile report dialog */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowPrintModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-2xl w-full border border-slate-100 shadow-2xl z-10 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3 mb-4 select-none">
              <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Icons.Layers className="w-4 h-4 text-[#683EFF]" />
                <span>Customer Profile Summary - MEV View</span>
              </h3>
              <button className="text-slate-400 p-1 hover:bg-slate-50 rounded" onClick={() => setShowPrintModal(false)}>
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Area */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 printable-section p-4 bg-slate-50 rounded-xl" id="portrait-print-content">
              <div className="border border-slate-250 p-6 bg-white rounded-lg shadow-sm space-y-6 text-slate-800">
                <div className="flex justify-between items-start border-b border-slate-150 pb-4">
                  <div>
                    <h2 className="text-xl font-black">{companyName}</h2>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">{customerType} Profile • id: {customer.id}</p>
                    <p className="text-xs text-slate-500 font-medium">Headquarters Address: {addressLine1 || "not defined"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-[#683EFF]">Middle East VIM</p>
                    <p className="text-[10px] text-slate-400">Date Generated: {new Date().toLocaleDateString()}</p>
                    <span className="inline-block mt-2 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      STATUS: {status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Territory Region</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{territory}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Liaison Contact Person</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{trainingContactPerson || "Unavailable"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Primary Email Address</p>
                    <p className="font-semibold text-[#683EFF] mt-0.5">{primaryEmail}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Hotline Mobile</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{primaryMobile}</p>
                  </div>
                </div>

                <div className="border-t border-slate-150 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest text-[#683EFF]">Training & Site Logistics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-405 font-bold uppercase text-[9px] tracking-wider">Training Site Address</p>
                      <p className="font-semibold text-slate-700 mt-0.5">{customer.trainingSiteAddress || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-slate-405 font-bold uppercase text-[9px] tracking-wider">Site Safety Officer</p>
                      <p className="font-semibold text-slate-700 mt-0.5">{trainingContactPerson || "Unavailable"}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-150 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest text-[#683EFF]">Machinery Loads & Inspection</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-405 font-bold uppercase text-[9px] tracking-wider">Inspection Site Address</p>
                      <p className="font-semibold text-slate-700 mt-0.5">{customer.inspectionSiteAddress || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-slate-405 font-bold uppercase text-[9px] tracking-wider">Lead Safety Auditor</p>
                      <p className="font-semibold text-slate-700 mt-0.5">{inspectionContactPerson || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-150 pt-4 text-center select-none">
                  <p className="text-[10px] text-slate-300"> Middle East VIM operations system report • Verification: SECURE-GULF-SYSTEM</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-150 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 border border-slate-350 text-xs font-bold text-slate-500 rounded-lg hover:bg-slate-50"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="bg-[#683EFF] hover:bg-[#5229E0] text-white font-bold py-2 px-5 rounded-lg flex items-center gap-1.5 text-xs shadow"
              >
                <Icons.Printer className="w-3.5 h-3.5" />
                <span>Trigger Router Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog: Assign To Select Modal */}
      {showAssignedToModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setShowAssignedToModal(false)} />
          <div className="relative bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 z-10 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Assign Account Manager</h3>
            <div className="space-y-2">
              {["Mohammed Khan", "Sarah Ahmed", "Zaid Sulaiman", "Eng. Tariq"].map((teamMember) => (
                <button
                  key={teamMember}
                  onClick={() => {
                    setAssignedTo(teamMember);
                    setAccountManager(teamMember);
                    setShowAssignedToModal(false);
                    showToast(`Assigned account manager switched to: ${teamMember}`);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-slate-150 hover:bg-slate-50 focus:outline-none flex items-center justify-between text-xs font-semibold"
                >
                  <span>{teamMember}</span>
                  {assignedTo === teamMember && <Icons.Check className="w-4 h-4 text-[#683EFF]" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAssignedToModal(false)}
              className="w-full py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-155"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HEADER SECTION WITH BREADCRUMB, ACTIONS AND SAVE CONTROLS */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#ECECF3] pb-4 select-none">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400 font-medium font-sans">
            <button onClick={onBack} className="hover:text-[#683EFF] font-semibold transition-colors">Customer</button>
            <Icons.ChevronRight className="w-3 h-3 text-slate-350" />
            <span className="font-bold text-slate-700 truncate max-w-[200px]">{companyName || "Saudi Aramco"}</span>
          </div>
        </div>

        {/* Action Controls Box */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
          
          {/* Actions Dropdown Button */}
          <div className="relative">
            <button
              id="actions-dropdown-trigger"
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              className="h-[38px] px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm flex items-center justify-between gap-2.5 min-w-[120px] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>Actions</span>
              </div>
              <Icons.ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showActionsDropdown ? "rotate-180" : ""}`} />
            </button>

            {showActionsDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowActionsDropdown(false)} />
                <div className="absolute right-0 mt-1.5 w-[190px] bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-40 overflow-hidden font-medium text-xs select-none">
                  <div className="px-3.5 py-1.5 font-bold text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-100">
                    Actions
                  </div>
                  <button
                    onClick={triggerPrintModel}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-semibold"
                  >
                    <Icons.Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Print Profile</span>
                  </button>
                  <button
                    onClick={triggerDuplicate}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-semibold"
                  >
                    <Icons.Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duplicate Customer</span>
                  </button>
                  <button
                    onClick={triggerExport}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-semibold"
                  >
                    <Icons.Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export Customer Profile</span>
                  </button>
                  <button
                    onClick={triggerDeleteConfirm}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-bold border-t border-slate-100"
                  >
                    <Icons.Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Customer</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Navigation Buttons < > */}
          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm h-[38px]">
            <button
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="p-2 hover:bg-slate-50 text-slate-500 disabled:opacity-30 border-r border-slate-200 transition-colors"
              title="Previous Customer"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= allCustomers.length - 1}
              className="p-2 hover:bg-slate-50 text-slate-500 disabled:opacity-30 transition-colors"
              title="Next Customer"
            >
              <Icons.ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="h-[38px] bg-[#683EFF] hover:bg-[#5229E0] text-white px-5 rounded-lg flex items-center gap-1.5 font-semibold text-sm shadow-sm transition-all font-sans"
            id="customer-detail-save-btn"
          >
            <Icons.CheckSquare className="w-4 h-4" />
            <span>SAVE</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONTENT GRID - LEFT SIDEBAR CARD & RIGHT PROFILE SPEC TABS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFTSIDE PROFILE SIDEBAR COVERS: avatar, enabled, assigned, attachments, tags, meta text */}
        <div id="Detail sidebar" className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center shadow-sm text-center">
          
          {/* Circular avatar banner initial */}
          <div className="h-20 w-20 rounded-2xl bg-[#F0EBFF] text-[#683EFF] text-4xl font-black flex items-center justify-center shadow-sm relative shrink-0">
            {companyName ? companyName.charAt(0).toUpperCase() : "C"}
          </div>

          {/* Company Title Heading */}
          <h3 className="font-display font-bold text-slate-800 text-lg md:text-xl mt-4 leading-snug">
            {companyName || "Saudi Aramco"}
          </h3>

          {/* Interactive enabled badge status dropdown */}
          <div className="mt-2.5">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-full flex items-center justify-center gap-1 cursor-pointer border border-[#80F4C8]/30 focus:outline-none focus:ring-1 focus:ring-[#80F4C8] hover:bg-emerald-100 transition-colors"
            >
              <option value="Active">🟢 Enabled</option>
              <option value="Pending Review">🟡 Pending Review</option>
              <option value="Suspended">🔴 Suspended</option>
            </select>
          </div>

          {/* Attributes properties list */}
          <div className="w-full mt-6 pt-5 border-t border-slate-100 space-y-3.5 text-left text-xs text-slate-600 font-medium">
            
            {/* Assigned to */}
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Icons.User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 font-semibold">Assigned To</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-800">{assignedTo}</span>
                <button
                  onClick={() => setShowAssignedToModal(true)}
                  className="p-1 hover:bg-slate-100 text-slate-500 hover:text-[#683EFF] rounded-md transition-colors"
                  title="Assign Account Representative"
                >
                  <Icons.Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Attachments list with purple visual count clickable */}
            <button
              onClick={() => setShowAttachmentsModal(true)}
              className="flex items-center justify-between py-1 border-b border-slate-50 w-full hover:bg-slate-50 hover:px-1 -mx-1 rounded-md transition-all text-left focus:outline-none"
              title="Click to manage attachments"
            >
              <div className="flex items-center gap-2">
                <Icons.Paperclip className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 font-semibold text-xs">Attachments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-[#683EFF] text-white flex items-center justify-center text-[10px] font-bold">
                  {attachments.length}
                </span>
              </div>
            </button>

            {/* Group with a Users icon and customerGroup */}
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Icons.Users className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 font-semibold">Group</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="bg-[#FAF9FC] border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase">
                  {customerGroup}
                </span>
              </div>
            </div>

            {/* Share profile placeholder */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Icons.Share2 className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 font-semibold">Share Profile</span>
              </div>
              <button
                onClick={() => showToast("Shareable customer portfolio profile link copied.")}
                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-[#683EFF] rounded-md transition-colors"
                title="Copy Share Link"
              >
                <Icons.Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Meta text footer at the bottom */}
          <div className="w-full mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1 text-left">
            <p className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[#683EFF]" />
              <span>You created this customer profile recently</span>
            </p>
            <p className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>You last updated data moments ago</span>
            </p>
          </div>
        </div>

        {/* RIGHTSIDE DETAIL TABBED INPUT SHEETS */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Subheader tab togglers details / contacts */}
          <div className="border-b border-[#ECECF3] flex gap-6 select-none shrink-0" id="customer-detail-tabbed-navigation">
            <button
              onClick={() => setActiveTab("DETAILS")}
              className={`pb-3 font-display font-bold text-xs uppercase tracking-wider relative transition-all ${
                activeTab === "DETAILS" ? "text-[#683EFF]" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <span>Details</span>
              {activeTab === "DETAILS" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#683EFF]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("CONTACT_ADDRESS")}
              className={`pb-3 font-display font-bold text-xs uppercase tracking-wider relative transition-all ${
                activeTab === "CONTACT_ADDRESS" ? "text-[#683EFF]" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <span>Contact & Address</span>
              {activeTab === "CONTACT_ADDRESS" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#683EFF]" />
              )}
            </button>
          </div>

          <div className="space-y-6">
            
            {/* TAB DETAILS VIEW */}
            {activeTab === "DETAILS" && (
              <div className="space-y-6">
                
                {/* A. Customer Information Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-semibold text-[#0E1B2D] uppercase tracking-widest flex items-center gap-1.5 select-none font-display">
                    <Icons.Building className="w-4 h-4 text-[#683EFF]" />
                    <span>Customer Information</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* CUSTOMER NAME * */}
                    <div>
                      <label className="block text-[10px] font-medium text-slate-650 uppercase tracking-widest mb-1.5 text-slate-600 font-sans">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-normal text-slate-700 font-sans"
                        placeholder="e.g. Saudi Aramco Logistics"
                      />
                    </div>

                    {/* TERRITORY */}
                    <div>
                      <label className="block text-[10px] font-medium text-slate-655 uppercase tracking-widest mb-1.5 text-slate-600 font-sans">
                        Territory
                      </label>
                      <select
                        value={territory}
                        onChange={(e) => setTerritory(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-medium text-slate-700"
                      >
                        <option value="Jeddah, KSA">Jeddah, KSA</option>
                        <option value="Riyadh, KSA">Riyadh, KSA</option>
                        <option value="Dammam, KSA">Dammam, KSA</option>
                        <option value="Al Khobar, KSA">Al Khobar, KSA</option>
                        <option value="Jebel Ali, UAE">Jebel Ali, UAE</option>
                        <option value="Abu Dhabi, UAE">Abu Dhabi, UAE</option>
                        <option value="Other Middle East">Other Middle East</option>
                      </select>
                    </div>

                    {/* CUSTOMER TYPE * */}
                    <div>
                      <label className="block text-[10px] font-medium text-slate-655 uppercase tracking-widest mb-1.5 text-slate-600 font-sans">
                        Customer Type *
                      </label>
                      <select
                        value={customerType}
                        onChange={(e) => setCustomerType(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-medium text-slate-700"
                      >
                        <option value="Company">Company</option>
                        <option value="Individual">Individual</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Proprietorship">Proprietorship</option>
                      </select>
                    </div>

                    {/* FROM LEAD */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-655 uppercase tracking-widest mb-1.5 text-slate-600">
                        From Lead
                      </label>
                      <select
                        value={fromLead}
                        onChange={(e) => setFromLead(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-medium text-slate-700"
                      >
                        <option value="Select lead">Select lead</option>
                        <option value="Direct Outreach">Direct Outreach</option>
                        <option value="Referral Operations">Referral Operations</option>
                        <option value="Portal Campaign">Portal Campaign</option>
                        <option value="Trade Fair Gulf">Trade Fair Gulf</option>
                      </select>
                    </div>

                    {/* CUSTOMER GROUP */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-655 uppercase tracking-widest mb-1.5 text-slate-600">
                        Customer Group
                      </label>
                      <select
                        value={customerGroup}
                        onChange={(e) => setCustomerGroup(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-medium text-slate-700"
                      >
                        <option value="Regular Customers">Regular Customers</option>
                        <option value="Corporate Partners">Corporate Partners</option>
                        <option value="Government / Enterprise">Government / Enterprise</option>
                        <option value="VIP Tier-1">VIP Tier-1</option>
                      </select>
                    </div>

                    {/* FROM OPPORTUNITY */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-655 uppercase tracking-widest mb-1.5 text-slate-600">
                        From Opportunity
                      </label>
                      <select
                        value={fromOpportunity}
                        onChange={(e) => setFromOpportunity(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-medium text-slate-700"
                      >
                        <option value="Select opportunity">Select opportunity</option>
                        <option value="Dammam Refinery Lift">Dammam Refinery Lift</option>
                        <option value="Riyadh Subway Ext">Riyadh Subway Ext</option>
                        <option value="Jubail Port Upgrade">Jubail Port Upgrade</option>
                        <option value="Macedon Yard Expansion">Macedon Yard Expansion</option>
                      </select>
                    </div>

                    {/* ACCOUNT MANAGER */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-655 uppercase tracking-widest mb-1.5 text-slate-600">
                        Account Manager
                      </label>
                      <select
                        value={accountManager}
                        onChange={(e) => {
                          setAccountManager(e.target.value);
                          setAssignedTo(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50 font-medium text-slate-700"
                      >
                        <option value="Mohammed Khan">Mohammed Khan</option>
                        <option value="Sarah Ahmed">Sarah Ahmed</option>
                        <option value="Zaid Sulaiman">Zaid Sulaiman</option>
                        <option value="Eng. Tariq">Eng. Tariq</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* B. Contact Representatives Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 select-none text-slate-700">
                    <Icons.Contact className="w-4 h-4 text-[#683EFF]" />
                    <span>Contact Representatives</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* TRAINING CONTACT PERSON */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-widest mb-1.5 text-slate-600">
                        Training Contact Person
                      </label>
                      <div className="relative">
                        <Icons.User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={trainingContactPerson}
                          onChange={(e) => setTrainingContactPerson(e.target.value)}
                          placeholder="Enter representative name"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* INSPECTION CONTACT PERSON */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-widest mb-1.5 text-slate-600">
                        Inspection Contact Person
                      </label>
                      <div className="relative">
                        <Icons.User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={inspectionContactPerson}
                          onChange={(e) => setInspectionContactPerson(e.target.value)}
                          placeholder="Enter representative name"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* TRAINING CONTACT PHONE */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-widest mb-1.5 text-slate-600">
                        Training Contact Phone
                      </label>
                      <PhoneCountryCodeInput
                        id="training-contact-phone-dtl"
                        value={trainingContactPhone}
                        onChange={setTrainingContactPhone}
                        placeholder="Phone number"
                      />
                    </div>

                    {/* INSPECTION CONTACT PHONE */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-widest mb-1.5 text-slate-600">
                        Inspection Contact Phone
                      </label>
                      <PhoneCountryCodeInput
                        id="inspection-contact-phone-dtl"
                        value={inspectionContactPhone}
                        onChange={setInspectionContactPhone}
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* 1. Activity & Operational Overview */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="text-left">
                      <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#683EFF]" />
                        <span>Activity & Operational Overview</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Select month and year to inspect documented transactions, reviews, and inspections.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 text-slate-700 py-1 font-semibold focus:outline-none"
                      >
                        {MONTHS_LIST.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 text-slate-700 py-1 font-semibold focus:outline-none"
                      >
                        {["2025", "2026", "2027", "2028"].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1">
                    {/* Calendar sub-box */}
                    <div className="md:col-span-5 bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        {/* Calendar Nav */}
                        <div className="flex items-center justify-between px-1">
                          <button 
                            className="text-slate-400 p-1 hover:bg-slate-100 rounded animate-none" 
                            type="button" 
                            onClick={handlePrevMonth}
                          >
                            <Icons.ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-bold text-slate-700 tracking-wider font-mono uppercase">
                            {selectedMonth} {selectedYear}
                          </span>
                          <button 
                            className="text-slate-400 p-1 hover:bg-slate-100 rounded animate-none" 
                            type="button" 
                            onClick={handleNextMonth}
                          >
                            <Icons.ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Calendar Grid */}
                        <div>
                          {/* Weekday headers */}
                          <div className="grid grid-cols-7 gap-1 text-center mb-1">
                            {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                              <span key={idx} className="text-[10px] font-extrabold text-slate-400 w-8 h-8 flex items-center justify-center">
                                {d}
                              </span>
                            ))}
                          </div>

                          {/* Dynamic Days list */}
                          <div className="grid grid-cols-7 gap-1 text-center">
                            {/* Start padding days */}
                            {Array.from({ length: startDayOfWeek }).map((_, padIdx) => (
                              <span key={`pad-${padIdx}`} className="w-8 h-8" />
                            ))}
                            
                            {Array.from({ length: daysInMonth }).map((_, dIdx) => {
                              const dayNum = dIdx + 1;
                              const hasActivity = activeDaysMap.has(dayNum);
                              const matchedAct = currentMonthActivities.find(a => a.day === dayNum);
                              
                              return (
                                <button
                                  key={dayNum}
                                  type="button"
                                  onClick={() => {
                                    if (hasActivity && matchedAct) {
                                      showToast(`Operational Check: Day ${dayNum} selected in Log Feed - "${matchedAct.title}"`);
                                    } else {
                                      showToast(`No operational actions archived on date ${selectedMonth} ${dayNum}, ${selectedYear}.`);
                                    }
                                  }}
                                  className={`relative w-8 h-8 text-xs font-bold rounded-full flex flex-col items-center justify-center transition-all ${
                                    hasActivity 
                                      ? "bg-[#683EFF] text-white shadow-sm ring-1 ring-[#683EFF]/30 hover:bg-[#5229E0]" 
                                      : "text-slate-500 border border-transparent hover:border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  <span>{dayNum}</span>
                                  {hasActivity && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-around text-[10px] font-bold text-slate-500 border-t border-slate-150 pt-3 mt-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#683EFF]" />
                          <span>Days with Activity</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full border border-slate-350 bg-white" />
                          <span>No Activity</span>
                        </span>
                      </div>
                    </div>

                    {/* Operational Log feed */}
                    <div className="md:col-span-7 flex flex-col justify-between gap-4">
                      <div className="space-y-3 text-left">
                        <div className="flex justify-between items-center px-1">
                          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                            Operational Log Feed — {selectedMonth} {selectedYear}
                          </p>
                          <span className="text-[10px] bg-[#F0EBFF] text-[#683EFF] font-bold px-2.5 py-0.5 rounded-full">
                            {currentMonthActivities.length} {currentMonthActivities.length === 1 ? "activity" : "activities"}
                          </span>
                        </div>

                        {/* Cards stack */}
                        <div className="space-y-3">
                          {currentMonthActivities.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                              No archived operational actions for this month.
                            </div>
                          ) : (
                            currentMonthActivities.map((act) => (
                              <div key={act.day} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-all text-left">
                                <div className="w-10 h-10 border border-slate-200 rounded-lg shrink-0 flex flex-col items-center justify-center font-mono bg-slate-50/50">
                                  <span className="text-xs font-black text-slate-705">{act.day}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                    {selectedMonth.substring(0, 3)}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800">
                                    {act.title} <span className="text-[10px] text-slate-400 font-normal ml-1">• {selectedMonth} {act.day}, {selectedYear}</span>
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed break-words font-medium">
                                    {act.text}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>



                      {/* Info notice block */}
                      <div className="bg-[#F6F3FF] border border-[#ECE6FF] text-[#683EFF] rounded-xl p-3 text-[11px] font-semibold flex items-center gap-2 text-left">
                        <Icons.Info className="w-4 h-4 shrink-0 text-[#683EFF]" />
                        <span>Operational events align with physical on-site inspections and training validation records.</span>
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
                          <p className="text-xs font-bold text-slate-800">Assigned representative modified</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">10 minutes ago by MK</p>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-slate-100 text-slate-500 border border-white shadow-sm flex items-center justify-center">
                          <Icons.RefreshCw className="w-2.5 h-2.5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Customer verification logs updated</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">22 minutes ago</p>
                        </div>
                      </div>

                      {/* Item 3 */}
                      <div className="relative">
                        <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#F0EBFF] text-[#683EFF] border border-white shadow-sm flex items-center justify-center">
                          <Icons.Paperclip className="w-2.5 h-2.5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Commercial document attached</p>
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

                    {/* Comment field formulation */}
                    <form onSubmit={handleAddComment} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#10B981] text-white font-bold flex items-center justify-center text-[10px] shrink-0 select-none">
                        MK
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
                          className="bg-[#683EFF] hover:bg-[#5229E0] text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors shadow-sm"
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
                            comm.author === "MK" ? "bg-[#10B981]" : "bg-[#4B68FF]"
                          }`}>
                            {comm.author}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800 leading-relaxed break-words">{comm.text}</p>
                            <p className="text-[10px] text-slate-404 text-slate-400 mt-0.5 font-bold">{comm.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTACT & ADDRESS VIEW */}
            {activeTab === "CONTACT_ADDRESS" && (
              <div className="space-y-6 animate-in fade-in duration-100">
                
                {/* C. Primary Contact Details Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 select-none text-slate-700">
                    <Icons.Mail className="w-4 h-4 text-[#683EFF]" />
                    <span>Primary Contact Details</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* PRIMARY EMAIL */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-widest mb-1.5 text-slate-600">
                        Primary Email Address
                      </label>
                      <input
                        type="email"
                        value={primaryEmail}
                        onChange={(e) => setPrimaryEmail(e.target.value)}
                        placeholder="corporate.liaison@client.com"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                      />
                    </div>

                    {/* PRIMARY MOBILE */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-widest mb-1.5 text-slate-600">
                        Primary Mobile / Hotline Number
                      </label>
                      <PhoneCountryCodeInput
                        id="primary-mobile-dtl"
                        value={primaryMobile}
                        onChange={setPrimaryMobile}
                        placeholder="Enter mobile number"
                      />
                    </div>
                  </div>
                </div>

                {/* D. Primary Address Details Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 select-none text-slate-700">
                    <Icons.MapPin className="w-4 h-4 text-[#683EFF]" />
                    <span>Headquarters Address Details</span>
                  </h4>

                  <div className="space-y-4">
                    {/* ADDRESS LINE 1 */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-widest mb-1.5 text-slate-600">
                        Address Line 1 / Street details
                      </label>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="Aramco Main HQ Complex, Tower Section B"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CITY */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-widest mb-1.5 text-slate-600">
                          City Address
                        </label>
                        <input
                          type="text"
                          value={cityAddress}
                          onChange={(e) => setCityAddress(e.target.value)}
                          placeholder="Jeddah / Dhahran"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                        />
                      </div>

                      {/* ADDRESS LINE 2 */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-widest mb-1.5 text-slate-600">
                          Address Line 2 (Building / Floor)
                        </label>
                        <input
                          type="text"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          placeholder="King Abdulaziz Road"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                        />
                      </div>

                      {/* STATE / PROVINCE */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-widest mb-1.5 text-slate-600">
                          State / Province
                        </label>
                        <input
                          type="text"
                          value={stateProvince}
                          onChange={(e) => setStateProvince(e.target.value)}
                          placeholder="Eastern Province"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                        />
                      </div>

                      {/* ZIP / POSTAL CODE */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-widest mb-1.5 text-slate-600">
                          ZIP / Postal Code
                        </label>
                        <input
                          type="text"
                          value={zipPostalCode}
                          onChange={(e) => setZipPostalCode(e.target.value)}
                          placeholder="31311"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
