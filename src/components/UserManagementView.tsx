import React, { useState } from "react";
import * as Icons from "lucide-react";
import { EmployeeDetail } from "../types";

interface Props {
  employees: EmployeeDetail[];
  onEmployeesChange: (employees: EmployeeDetail[]) => void;
}

export function UserManagementView({ employees, onEmployeesChange }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [useGoogle, setUseGoogle] = useState(false);

  const handleAddUser = () => {
    // Ideally this would hit an API endpoint to create a user in Firebase Auth
    // and also add them to the employees collection in Firestore.
    // For now we just add them to the local employees array.
    const newEmployee: EmployeeDetail = {
      id: "EMP-" + Math.floor(Math.random() * 10000).toString().padStart(4, "0"),
      email: newEmail,
      name: newEmail.split("@")[0],
    };
    onEmployeesChange([...employees, newEmployee]);
    setShowAddModal(false);
    setNewEmail("");
    setNewPassword("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Icons.UserCog className="w-7 h-7 text-[#683EFF]" />
            User Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage employee accounts and access.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#683EFF] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#5b36e5] transition-colors flex items-center gap-2 shadow-sm"
        >
          <Icons.Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">Employee ID</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Email</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Role</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{emp.id}</td>
                  <td className="px-6 py-4 text-slate-600">{emp.name || emp.firstName || "N/A"}</td>
                  <td className="px-6 py-4 text-slate-600">{emp.email || "N/A"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold tracking-wider bg-slate-100 text-slate-600 uppercase">
                      {emp.role || emp.designation || "Employee"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onEmployeesChange(employees.filter(e => e.id !== emp.id))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete User">
                      <Icons.Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={!useGoogle} onChange={() => setUseGoogle(false)} className="text-[#683EFF] focus:ring-[#683EFF]" />
                  <span className="text-sm font-medium text-slate-700">Email/Password</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={useGoogle} onChange={() => setUseGoogle(true)} className="text-[#683EFF] focus:ring-[#683EFF]" />
                  <span className="text-sm font-medium text-slate-700">Google Account</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF]"
                  placeholder="employee@example.com"
                />
              </div>
              
              {!useGoogle && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF]"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-slate-500 mt-1">They will use this to sign in.</p>
                </div>
              )}

              {useGoogle && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium flex gap-2 items-center">
                    <Icons.Info className="w-4 h-4" />
                    Google Sign-In
                  </p>
                  <p className="text-xs text-blue-600 mt-1">The user will be able to sign in securely using this Google account.</p>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!newEmail || (!useGoogle && !newPassword)}
                  className="px-4 py-2 text-sm font-semibold bg-[#683EFF] text-white rounded-lg hover:bg-[#5b36e5] transition-colors disabled:opacity-50"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
