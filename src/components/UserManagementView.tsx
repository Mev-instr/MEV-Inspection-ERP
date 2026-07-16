import React, { useState } from "react";
import * as Icons from "lucide-react";
import { EmployeeDetail, CustomerDetail } from "../types";
import { auth, functions } from "../lib/firebase";
import { updateProfile } from "firebase/auth";
import { httpsCallable } from "firebase/functions";

interface Props {
  currentUser?: any;
  employees: EmployeeDetail[];
  onEmployeesChange: (employees: EmployeeDetail[]) => void;
  customers: CustomerDetail[];
  onCustomersChange: (customers: CustomerDetail[]) => void;
}

type UserTypeTab = "employees" | "customers" | "admin";

export function UserManagementView({
  employees,
  onEmployeesChange,
  customers,
  onCustomersChange,
  currentUser,
}: Props) {
  const [activeTab, setActiveTab] = useState<UserTypeTab>("employees");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{ id: string, type: UserTypeTab } | null>(null);
  
  // Admin Profile States
  const [adminName, setAdminName] = useState(currentUser?.displayName || "");
  const [adminPhotoUrl, setAdminPhotoUrl] = useState(currentUser?.photoURL || "");
  const [adminUpdating, setAdminUpdating] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState(false);
  
  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setAdminUpdating(true);
    setAdminSuccess(false);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: adminName,
          photoURL: adminPhotoUrl
        });
        setAdminSuccess(true);
        setTimeout(() => setAdminSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setAdminUpdating(false);
    }
  };

  // Filter lists based on hasAccount status
  const employeeUsers = employees.filter((emp) => emp.hasAccount === true);
  const unassignedEmployees = employees.filter((emp) => emp.hasAccount !== true);

  const customerUsers = customers.filter((cust) => cust.hasAccount === true);
  const unassignedCustomers = customers.filter((cust) => cust.hasAccount !== true);

    
  const handleAddUser = async () => {
    if (!auth.currentUser) {
      setErrorMessage("Authentication session lost. Please refresh the page and sign in again.");
      return;
    }
    if (!selectedId) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      let userUid = "";

      if (activeTab === "employees") {
        if (!newEmail) {
          setErrorMessage("Please enter an email address.");
          setLoading(false);
          return;
        }

        const emp = employees.find(e => e.id === selectedId);
        if (!emp) throw new Error("Employee not found");
        
        const createEmployeeUser = httpsCallable(functions, 'createEmployeeUser');

        const result: any = await createEmployeeUser({
          email: newEmail.trim(),
          employeeId: emp.id,
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email || "Employee",
          department: emp.department || "",
          assignedCompanies: [],
          assignedCustomerIds: [],
          assignedCustomerEmails: []
        });

        userUid = result.data.uid;

      } else {
        // Customers/Clients (Email/Password only)
        if (!newEmail || !newPassword) {
          setErrorMessage("Email and password required for client accounts.");
          setLoading(false);
          return;
        }

        const cust = customers.find(c => c.id === selectedId);
        if (!cust) throw new Error("Customer not found");
           
        const createClientUser = httpsCallable(functions, 'createClientUser');

        const result: any = await createClientUser({
          email: newEmail.trim(),
          password: newPassword,
          companyName: cust.companyName || cust.contactPerson || cust.primaryEmail || "Customer",
          customerId: cust.id
        });

        userUid = result.data.uid;
      }

      if (activeTab === "employees") {
        const updatedEmployees = employees.map((emp) => {
          if (emp.id === selectedId) {
            return {
              ...emp,
              email: newEmail.trim() || emp.email,
              hasAccount: true,
              firebaseUid: userUid
            };
          }
          return emp;
        });
        onEmployeesChange(updatedEmployees);
      } else {
        const updatedCustomers = customers.map((cust) => {
          if (cust.id === selectedId) {
            return {
              ...cust,
              email: newEmail.trim() || cust.email || cust.primaryEmail,
              hasAccount: true,
              firebaseUid: userUid,
              portalEmail: newEmail.trim()
            };
          }
          return cust;
        });
        onCustomersChange(updatedCustomers);
      }

      setShowAddModal(false);
      setSelectedId("");
      setNewEmail("");
      setNewPassword("");
    } catch (err: any) {
      console.error("Error creating user account:", err);
      // Clean up Cloud Functions errors which might be wrapped
      let msg = err?.details?.message || err.message || "Failed to create user account. Please try again.";
      if (msg.includes("email-already-in-use")) {
        msg = "This email address is already in use by another account. Please use a different email.";
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteUser = (id, type) => {
    setDeleteConfirmInfo({ id, type });
  };

  const executeDeleteUser = async () => {
    if (!deleteConfirmInfo) return;
    const { id, type } = deleteConfirmInfo;
    setLoading(true);
    setErrorMessage(null);

    try {
      const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');

      let targetUid = null;
      let recordId = id;
      let userType = type === "employees" ? "employee" : "client";

      if (type === "employees") {
        const emp = employees.find(e => e.id === id);
        targetUid = emp?.firebaseUid;
      } else if (type === "customers") {
        const cust = customers.find(c => c.id === id);
        targetUid = cust?.firebaseUid;
      }

      if (targetUid) {
        // Call cloud function to delete from Firebase Auth
        await deleteUserAccount({ uid: targetUid, userType, recordId });
      }

      // Also update local state to reflect UI changes immediately
      if (type === "employees") {
        const updatedEmployees = employees.map((emp) => {
          if (emp.id === id) {
            return {
              ...emp,
              hasAccount: false,
              firebaseUid: null
            };
          }
          return emp;
        });
        onEmployeesChange(updatedEmployees);
      } else if (type === "customers") {
        const updatedCustomers = customers.map((cust) => {
          if (cust.id === id) {
            return {
              ...cust,
              hasAccount: false,
              firebaseUid: null
            };
          }
          return cust;
        });
        onCustomersChange(updatedCustomers);
      }
      setDeleteConfirmInfo(null);
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setErrorMessage(err?.message || "Failed to delete user account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="user-management-view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Icons.UserCog className="w-7 h-7 text-[#683EFF]" />
            User Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage employee and client portal accounts.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            if (activeTab === "employees") {
              if (unassignedEmployees.length > 0) {
                setSelectedId(unassignedEmployees[0].id);
                setNewEmail(unassignedEmployees[0].email || "");
              } else {
                setSelectedId("");
                setNewEmail("");
              }
            } else {
              if (unassignedCustomers.length > 0) {
                setSelectedId(unassignedCustomers[0].id);
                setNewEmail(unassignedCustomers[0].email || unassignedCustomers[0].primaryEmail || "");
              } else {
                setSelectedId("");
                setNewEmail("");
              }
            }
          }}
          className="bg-[#683EFF] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#5b36e5] transition-colors flex items-center gap-2 shadow-sm"
        >
          <Icons.Plus className="w-4 h-4" />
          Add {activeTab === "employees" ? "Employee" : "Client"} Account
        </button>

        {currentUser?.email === 'shahzaibkamran44@gmail.com' && (
          <button
            onClick={() => {
              setActiveTab("admin");
              setShowAddModal(false);
            }}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all ${
              activeTab === "admin"
                ? "border-[#683EFF] text-[#683EFF]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icons.Shield className="w-4 h-4" />
            Admin Profile
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab("employees");
            setShowAddModal(false);
          }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === "employees"
              ? "border-[#683EFF] text-[#683EFF]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Icons.Users className="w-4 h-4" />
          Employee Accounts ({employeeUsers.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("customers");
            setShowAddModal(false);
          }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === "customers"
              ? "border-[#683EFF] text-[#683EFF]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Icons.Building className="w-4 h-4" />
          Client/Customer Accounts ({customerUsers.length})
        </button>
      </div>

      {activeTab === "admin" ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm max-w-2xl">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Icons.User className="w-5 h-5 text-[#683EFF]" />
            Admin Profile Settings
          </h3>
          <form onSubmit={handleUpdateAdminProfile} className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                {adminPhotoUrl ? (
                  <img src={adminPhotoUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                    <Icons.Camera className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={adminPhotoUrl}
                  onChange={(e) => setAdminPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF]"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF]"
                placeholder="Admin Name"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                value={currentUser?.email || ""}
                disabled
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
              />
            </div>
            <div className="pt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={adminUpdating}
                className="px-6 py-2.5 text-sm font-bold bg-[#683EFF] text-white rounded-lg hover:bg-[#5b36e5] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {adminUpdating ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Save className="w-4 h-4" />}
                {adminUpdating ? "Saving..." : "Save Changes"}
              </button>
              {adminSuccess && (
                <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                  <Icons.CheckCircle2 className="w-4 h-4" />
                  Profile updated
                </span>
              )}
            </div>
          </form>
        </div>
      ) : (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">
                  {activeTab === "employees" ? "Employee ID" : "Customer ID"}
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600">Name / Company</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Email</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Role / Type</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === "employees" ? (
                employeeUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No active employee accounts found. Add an account to grant access.
                    </td>
                  </tr>
                ) : (
                  employeeUsers.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{emp.id}</td>
                      <td className="px-6 py-4 text-slate-600">{emp.name || emp.firstName || "N/A"}</td>
                      <td className="px-6 py-4 text-slate-600">{emp.email || "N/A"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold tracking-wider bg-[#F0EBFF] text-[#683EFF] uppercase">
                          {emp.role || emp.designation || "Employee"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => confirmDeleteUser(emp.id, "employees")}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Revoke Access (Leaves Employee Intact)"
                        >
                          <Icons.Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )
              ) : customerUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No active client accounts found. Add an account to grant client portal access.
                  </td>
                </tr>
              ) : (
                customerUsers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{cust.id}</td>
                    <td className="px-6 py-4 text-slate-600">{cust.companyName || "N/A"}</td>
                    <td className="px-6 py-4 text-slate-600">{cust.email || cust.primaryEmail || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold tracking-wider bg-blue-50 text-blue-600 uppercase">
                        {cust.customerType || "Client Portal"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => confirmDeleteUser(cust.id, "customers")}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Revoke Access (Leaves Customer Intact)"
                      >
                        <Icons.Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                Add {activeTab === "employees" ? "Employee" : "Client"} Account
              </h3>
              <button 
                onClick={() => !loading && setShowAddModal(false)} 
                disabled={loading}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs font-semibold leading-normal">
                <Icons.AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {activeTab === "employees" ? (
              unassignedEmployees.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    All existing employees already have user accounts assigned. To grant a new
                    user account, please register them under Employee Details first.
                  </p>
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-sm font-semibold bg-[#683EFF] text-white rounded-lg hover:bg-[#5b36e5] transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Assign to Employee
                    </label>
                    <select
                      value={selectedId}
                      disabled={loading}
                      onChange={(e) => {
                        const empId = e.target.value;
                        setSelectedId(empId);
                        const emp = unassignedEmployees.find((item) => item.id === empId);
                        if (emp) {
                          setNewEmail(emp.email || "");
                        }
                      }}
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-white font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      {unassignedEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name || emp.firstName || "N/A"} ({emp.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      disabled={loading}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] disabled:bg-slate-50"
                      placeholder="employee@example.com"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium flex gap-2 items-center">
                      <Icons.Info className="w-4 h-4" />
                      Google Sign-In
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      The user will be able to sign in securely using this Google account.
                    </p>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setShowAddModal(false)}
                      disabled={loading}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddUser}
                      disabled={loading || !selectedId || !newEmail}
                      className="px-4 py-2 text-sm font-semibold bg-[#683EFF] text-white rounded-lg hover:bg-[#5b36e5] transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                    >
                      {loading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      ) : (
                        "Create User"
                      )}
                    </button>
                  </div>
                </div>
              )
            ) : unassignedCustomers.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  All registered customers already have client accounts. Create a customer entry first
                  in Customer Details to assign an account.
                </p>
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-semibold bg-[#683EFF] text-white rounded-lg hover:bg-[#5b36e5] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Assign to Customer
                  </label>
                  <select
                    value={selectedId}
                    disabled={loading}
                    onChange={(e) => {
                      const custId = e.target.value;
                      setSelectedId(custId);
                      const cust = unassignedCustomers.find((item) => item.id === custId);
                      if (cust) {
                        setNewEmail(cust.email || cust.primaryEmail || "");
                      }
                    }}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] bg-white font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {unassignedCustomers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.companyName} ({cust.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    disabled={loading}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] disabled:bg-slate-50"
                    placeholder="client@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    disabled={loading}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] disabled:bg-slate-50"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-slate-500 mt-1">They will use this to sign in.</p>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    disabled={loading || !selectedId || !newEmail || !newPassword}
                    className="px-4 py-2 text-sm font-semibold bg-[#683EFF] text-white rounded-lg hover:bg-[#5b36e5] transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                  >
                    {loading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    ) : (
                      "Create User"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {deleteConfirmInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                <Icons.AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Confirm Deletion</h3>
                <p className="text-sm text-slate-600">
                  Are you sure you want to revoke this user's access? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmInfo(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteUser}
                className="px-4 py-2 text-sm font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
              >
                Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

