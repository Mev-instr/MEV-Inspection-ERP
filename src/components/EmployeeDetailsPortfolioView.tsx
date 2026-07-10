import React, { useState } from "react";
import { createPortal } from "react-dom";
import * as Icons from "lucide-react";
import { EmployeeDetail } from "../types";
import { formatDate } from "../utils";
import { PhoneCountryCodeInput } from "./PhoneCountryCodeInput";

interface EmployeePortfolioProps {
  employees: EmployeeDetail[];
  onEmployeesChange: React.Dispatch<React.SetStateAction<EmployeeDetail[]>>;
  onUploadImage?: (file: File, clientName: string, subfolder: string, entityId?: string) => Promise<string>;
}

export function EmployeeDetailsPortfolioView({ employees, onEmployeesChange, onUploadImage }: EmployeePortfolioProps) {
  // View states
  const [viewMode, setViewMode] = useState<"list" | "grid" | "compact">("list");
  
  // Search
  const [filterInput, setFilterInput] = useState("");
  
  const [toastMessage, setToastMessage] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formValues, setFormValues] = useState({
    name: "",
    designation: "",
    department: "",
    email: "",
    phone: "",
    iqamaNumber: "",
    joiningDate: new Date().toISOString().split("T")[0],
    status: "Active"
  });

  const [isEditingInDetail, setIsEditingInDetail] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const selectedDetail = employees.find(e => e.id === selectedDetailId) || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const calculateNextId = () => {
    let maxId = 0;
    employees.forEach(e => {
      const parts = e.id.split('-');
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxId) maxId = num;
      }
    });
    return `EMP-${String(maxId + 1).padStart(3, '0')}`;
  };

  const handleCreateSubmit = () => {
    const newEmp: EmployeeDetail = {
      id: calculateNextId(),
      name: formValues.name,
      designation: formValues.designation,
      department: formValues.department,
      email: formValues.email,
      phone: formValues.phone,
      iqamaNumber: formValues.iqamaNumber,
      joiningDate: formValues.joiningDate,
      status: formValues.status,
      hasAccount: false,
    };
    onEmployeesChange([newEmp, ...employees]);
    setShowAddModal(false);
    setFormValues({
      name: "",
      designation: "",
      department: "",
      email: "",
      phone: "",
      iqamaNumber: "",
      joiningDate: new Date().toISOString().split("T")[0],
      status: "Active"
    });
    showToast(`✓ Employee ${newEmp.id} added successfully`);
  };

  const handleDelete = (id: string) => {
    onEmployeesChange(employees.filter(e => e.id !== id));
    setConfirmDeleteId(null);
    showToast(`✓ Employee deleted`);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(employees.map(c => c.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(x => x !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const filteredEmployees = employees.filter(e => {
    const term = filterInput.toLowerCase();
    if (!term) return true;
    return (
      (e.name || "").toLowerCase().includes(term) ||
      (e.email || "").toLowerCase().includes(term) ||
      (e.id || "").toLowerCase().includes(term) ||
      (e.department || "").toLowerCase().includes(term) ||
      (e.designation || "").toLowerCase().includes(term) ||
      (e.iqamaNumber || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 bg-slate-50 min-h-0 overflow-hidden flex flex-col relative z-0">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-1/2 translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Icons.CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 z-10 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
              <Icons.Users className="w-6 h-6 text-[#683EFF]" />
              Employee Details
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Manage and track employee records</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#683EFF] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#5b36e5] transition-all flex items-center gap-2 shadow-sm hover:shadow active:scale-95"
            >
              <Icons.Plus className="w-4 h-4" />
              Add Employee
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-2xl">
              <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                placeholder="Search employees by name, ID, email, etc..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8 z-0 relative">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-[#683EFF] focus:ring-[#683EFF]"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredEmployees.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Emp ID</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Full Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Designation</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Department</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
                    setSelectedDetailId(emp.id);
                  }}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-[#683EFF] focus:ring-[#683EFF]"
                        checked={selectedIds.includes(emp.id)}
                        onChange={() => toggleSelect(emp.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{emp.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{emp.name || emp.firstName || "-"}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.designation || "-"}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.department || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                        emp.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                      }`}>
                        {emp.status || "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setConfirmDeleteId(emp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Icons.Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No employees found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#F0EBFF] rounded-lg">
                  <Icons.UserPlus className="w-5 h-5 text-[#683EFF]" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Add New Employee</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formValues.name}
                    onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] font-semibold text-slate-700 border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Designation Role
                  </label>
                  <input
                    type="text"
                    value={formValues.designation}
                    onChange={(e) => setFormValues({ ...formValues, designation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] font-semibold text-slate-700 border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formValues.department}
                    onChange={(e) => setFormValues({ ...formValues, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] font-semibold text-slate-700 border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] font-semibold text-slate-700 border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Phone Number
                  </label>
                  <PhoneCountryCodeInput
                    value={formValues.phone}
                    onChange={(val) => setFormValues({ ...formValues, phone: val })}
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Iqama Number
                  </label>
                  <input
                    type="text"
                    value={formValues.iqamaNumber}
                    onChange={(e) => setFormValues({ ...formValues, iqamaNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] font-semibold text-slate-700 border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formValues.joiningDate}
                    onChange={(e) => setFormValues({ ...formValues, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] font-semibold text-slate-700 border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Status
                  </label>
                  <select
                    value={formValues.status}
                    onChange={(e) => setFormValues({ ...formValues, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] font-semibold text-slate-700 border-slate-300"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                className="px-6 py-2 text-sm font-semibold bg-[#683EFF] text-white rounded-lg hover:bg-[#5b36e5] transition-colors shadow-sm"
              >
                Save Employee
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <Icons.AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Employee?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete this employee? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Detail Popup Modal */}
      {selectedDetail && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" id="employee-detail-modal">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Employee Details</h2>
              <button
                onClick={() => setSelectedDetailId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">
                  {(selectedDetail.name || selectedDetail.firstName || "E")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedDetail.name || selectedDetail.firstName || "-"}</h3>
                  <p className="text-sm text-slate-500">{selectedDetail.designation || "Employee"}</p>
                  <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                     selectedDetail.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                   }`}>
                     {selectedDetail.status || "Active"}
                   </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Emp ID</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedDetail.id}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Department</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedDetail.department || "-"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Iqama Number</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedDetail.iqamaNumber || "-"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Joining Date</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedDetail.joiningDate ? formatDate(selectedDetail.joiningDate) : "-"}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg col-span-2 flex items-center gap-3">
                  <Icons.Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Email</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedDetail.email || "-"}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg col-span-2 flex items-center gap-3">
                  <Icons.Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Phone</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedDetail.phone || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDetailId(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
