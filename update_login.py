import os

filename = "src/components/LoginPage.tsx"
with open(filename, "r") as f:
    content = f.read()

# Add employees prop
prop_sig = """interface LoginPageProps {
  onSuccess: (user: any) => void;
  triggerCloudToast: (msg: string) => void;
}"""

new_prop_sig = """import { EmployeeDetail } from "../types";

interface LoginPageProps {
  onSuccess: (user: any) => void;
  triggerCloudToast: (msg: string) => void;
  employees: EmployeeDetail[];
}"""

content = content.replace(prop_sig, new_prop_sig)

func_sig = "export function LoginPage({ onSuccess, triggerCloudToast }: LoginPageProps) {"
new_func_sig = "export function LoginPage({ onSuccess, triggerCloudToast, employees }: LoginPageProps) {"

content = content.replace(func_sig, new_func_sig)

# Add check function
check_func = """
  const checkAuthorization = (user: any) => {
    if (user.email === "shahzaibkamran44@gmail.com") return true;
    const isEmployee = employees.some(e => e.email && e.email.toLowerCase() === user.email.toLowerCase());
    return isEmployee;
  };
"""

content = content.replace("  const [errorMessage, setErrorMessage] = useState<string | null>(null);", "  const [errorMessage, setErrorMessage] = useState<string | null>(null);\n" + check_func)

auth_success = """      triggerCloudToast(`✓ Signed in successfully as ${userCred.user.displayName || userCred.user.email}`);
      onSuccess(userCred.user);"""

new_auth_success = """      if (!checkAuthorization(userCred.user)) {
        setErrorMessage("You are not authorized to access this system. Please contact the administrator.");
        return;
      }
      triggerCloudToast(`✓ Signed in successfully as ${userCred.user.displayName || userCred.user.email}`);
      onSuccess(userCred.user);"""

content = content.replace(auth_success, new_auth_success)

google_success = """      triggerCloudToast(`✓ Signed in successfully via Google!`);
      onSuccess(res.user);"""

new_google_success = """      if (!checkAuthorization(res.user)) {
        setErrorMessage("You are not authorized to access this system. Please contact the administrator.");
        return;
      }
      triggerCloudToast(`✓ Signed in successfully via Google!`);
      onSuccess(res.user);"""

content = content.replace(google_success, new_google_success)

with open(filename, "w") as f:
    f.write(content)
