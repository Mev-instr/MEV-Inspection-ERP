import fs from 'fs';
let content = fs.readFileSync('src/components/UserManagementView.tsx', 'utf8');

const regex = /const executeDeleteUser = \(\) => \{\n\s*if \(\!deleteConfirmInfo\) return;\n\s*const \{ id, type \} = deleteConfirmInfo;[\s\S]*?setDeleteConfirmInfo\(null\);\n\s*\};/m;

const replacement = `const executeDeleteUser = async () => {
    if (!deleteConfirmInfo) return;
    const { id, type } = deleteConfirmInfo;
    setLoading(true);
    setErrorMessage(null);

    try {
      const { getFunctions, httpsCallable } = await import("firebase/functions");
      const functions = getFunctions();
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
  };`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/UserManagementView.tsx', content);
