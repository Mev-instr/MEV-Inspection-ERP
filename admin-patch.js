const fs = require('fs');
const content = fs.readFileSync('src/components/UserManagementView.tsx', 'utf8');

let newContent = content.replace(
  `interface Props {`,
  `import { updateProfile } from "firebase/auth";\n\ninterface Props {\n  currentUser?: any;`
);

newContent = newContent.replace(
  `type UserTypeTab = "employees" | "customers";`,
  `type UserTypeTab = "employees" | "customers" | "admin";`
);

newContent = newContent.replace(
  `export function UserManagementView({
  employees,
  onEmployeesChange,
  customers,
  onCustomersChange,
}: Props) {`,
  `export function UserManagementView({
  employees,
  onEmployeesChange,
  customers,
  onCustomersChange,
  currentUser,
}: Props) {`
);

newContent = newContent.replace(
  `const [errorMessage, setErrorMessage] = useState<string | null>(null);`,
  `const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      const auth = getAuth();
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
  };`
);

newContent = newContent.replace(
  `const handleDeleteUser = (id: string, type: UserTypeTab) => {
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
  };`,
  `const confirmDeleteUser = (id: string, type: UserTypeTab) => {
    setDeleteConfirmInfo({ id, type });
  };

  const executeDeleteUser = () => {
    if (!deleteConfirmInfo) return;
    const { id, type } = deleteConfirmInfo;
    
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
    } else if (type === "customers") {
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
    setDeleteConfirmInfo(null);
  };`
);

newContent = newContent.replace(
  `onClick={() => handleDeleteUser(emp.id, "employees")}`,
  `onClick={() => confirmDeleteUser(emp.id, "employees")}`
);

newContent = newContent.replace(
  `onClick={() => handleDeleteUser(cust.id, "customers")}`,
  `onClick={() => confirmDeleteUser(cust.id, "customers")}`
);

const adminTabBtn = `
        {currentUser?.email === 'shahzaibkamran44@gmail.com' && (
          <button
            onClick={() => {
              setActiveTab("admin");
              setShowAddModal(false);
            }}
            className={\`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all \${
              activeTab === "admin"
                ? "border-[#683EFF] text-[#683EFF]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }\`}
          >
            <Icons.Shield className="w-4 h-4" />
            Admin Profile
          </button>
        )}
      </div>`;

newContent = newContent.replace(`</button>\n      </div>`, `</button>${adminTabBtn}`);

const adminTabContent = `{activeTab === "admin" ? (
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
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">`;

newContent = newContent.replace(
  `<div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">`,
  adminTabContent
);

// We need to close the `)` at the very end of activeTab === "admin" condition before the final add modal logic.
// The easiest way is to find the end of the tabs section (which is just before `{showAddModal && (`)
newContent = newContent.replace(
  `      {showAddModal && (`,
  `      )}

      {showAddModal && (`
);

// Finally, add the delete confirmation modal at the end.
const deleteModal = `
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
}`;

newContent = newContent.replace(/    <\/div>\s* \);\s*}/g, deleteModal);

fs.writeFileSync('src/components/UserManagementView.tsx', newContent);
