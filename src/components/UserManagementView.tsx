import React, { useState } from "react";
import * as Icons from "lucide-react";
import { EmployeeDetail, CustomerDetail } from "../types";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import firebaseAppletConfig from "../../firebase-applet-config.json";

interface Props {
  employees: EmployeeDetail[];
  onEmployeesChange: (employees: EmployeeDetail[]) => void;
  customers: CustomerDetail[];
  onCustomersChange: (customers: CustomerDetail[]) => void;
}

type UserTypeTab = "employees" | "customers";

export function UserManagementView({
  employees,
  onEmployeesChange,
  customers,
  onCustomersChange,
}: Props) {
  const [activeTab, setActiveTab] = useState<UserTypeTab>("employees");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [useGoogle, setUseGoogle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter lists based on hasAccount status
  const employeeUsers = employees.filter((emp) => emp.hasAccount === true);
  const unassignedEmployees = employees.filter((emp) => emp.hasAccount !== true);

  const customerUsers = customers.filter((cust) => cust.hasAccount === true);
  const unassignedCustomers = customers.filter((cust) => cust.hasAccount !== true);

  const handleAddUser = async () => {
    if (!selectedId) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      if (!useGoogle) {
        if (!newEmail || !newPassword) {
          setErrorMessage("Please enter both email and password.");
          setLoading(false);
          return;
        }

        // Initialize temporary app instance to create user without kicking out current admin
        const tempAppName = `temp-auth-app-${Date.now()}`;
        const tempApp = initializeApp({
          projectId: firebaseAppletConfig.projectId,
          appId: firebaseAppletConfig.appId,
          apiKey: firebaseAppletConfig.apiKey,
          authDomain: firebaseAppletConfig.authDomain,
          messagingSenderId: firebaseAppletConfig.messagingSenderId,
          storageBucket: firebaseAppletConfig.storageBucket || `${firebaseAppletConfig.projectId}.appspot.com`,
        }, tempAppName);
        const tempAuth = getAuth(tempApp);

        try {
          await createUserWithEmailAndPassword(tempAuth, newEmail.trim(), newPassword);
          await signOut(tempAuth);
        } catch (authError: any) {
          console.error("Firebase auth creation error:", authError);
          // If already in use, we can link/associate it anyway
          if (authError.code === "auth/email-already-in-use") {
            console.log("Email already in use in Firebase Auth. Associating local account.");
          } else {
            let friendlyMsg = authError.message;
            if (authError.code === "auth/weak-password") {
              friendlyMsg = "Password must be at least 6 characters long.";
            } else if (authError.code === "auth/invalid-email") {
              friendlyMsg = "The email address is invalid.";
            }
            setErrorMessage(`Firebase Auth error: ${friendlyMsg}`);
            setLoading(false);
            await deleteApp(tempApp);
            return;
          }
        }
        await deleteApp(tempApp);
      }

      if (activeTab === "employees") {
        const updatedEmployees = employees.map((emp) => {
          if (emp.id === selectedId) {
            return {
              ...emp,
              email: newEmail.trim() || emp.email,
              hasAccount: true,
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
      setErrorMessage(err.message || "Failed to create user account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (id: string, type: UserTypeTab) => {
    if (type === "employees") {
      const updatedEmployees = employees.map((emp) => {
        if (emp.id === id) {
          return {
            ...emp,
            hasAccount: false,
          };
        }
        return emp;
      });
      onEmployeesChange(updatedEmployees);
    } else {
      const updatedCustomers = customers.map((cust) => {
        if (cust.id === id) {
          return {
            ...cust,
            hasAccount: false,
          };
        }
        return cust;
      });
      onCustomersChange(updatedCustomers);
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
                          onClick={() => handleDeleteUser(emp.id, "employees")}
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
                        onClick={() => handleDeleteUser(cust.id, "customers")}
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

                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!useGoogle}
                        disabled={loading}
                        onChange={() => setUseGoogle(false)}
                        className="text-[#683EFF] focus:ring-[#683EFF] disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-slate-700">Email/Password</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={useGoogle}
                        disabled={loading}
                        onChange={() => setUseGoogle(true)}
                        className="text-[#683EFF] focus:ring-[#683EFF] disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-slate-700">Google Account</span>
                    </label>
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

                  {!useGoogle && (
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
                  )}

                  {useGoogle && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium flex gap-2 items-center">
                        <Icons.Info className="w-4 h-4" />
                        Google Sign-In
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        The user will be able to sign in securely using this Google account.
                      </p>
                    </div>
                  )}

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
                      disabled={loading || !selectedId || !newEmail || (!useGoogle && !newPassword)}
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

                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!useGoogle}
                      disabled={loading}
                      onChange={() => setUseGoogle(false)}
                      className="text-[#683EFF] focus:ring-[#683EFF] disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-slate-700">Email/Password</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={useGoogle}
                      disabled={loading}
                      onChange={() => setUseGoogle(true)}
                      className="text-[#683EFF] focus:ring-[#683EFF] disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-slate-700">Google Account</span>
                  </label>
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

                {!useGoogle && (
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
                )}

                {useGoogle && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium flex gap-2 items-center">
                      <Icons.Info className="w-4 h-4" />
                      Google Sign-In
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      The customer will be able to sign in securely using this Google account.
                    </p>
                  </div>
                )}

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
                    disabled={loading || !selectedId || !newEmail || (!useGoogle && !newPassword)}
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
    </div>
  );
}
