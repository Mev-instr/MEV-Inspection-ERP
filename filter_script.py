import os

filename = "src/App.tsx"
with open(filename, "r") as f:
    content = f.read()

# Add currentEmployee computation below isAdmin
admin_line = "  const isAdmin = currentUser?.email === \"shahzaibkamran44@gmail.com\";"
employee_line = "  const currentEmployee = employees.find(e => e.email === currentUser?.email);"

content = content.replace(admin_line, admin_line + "\n" + employee_line)

# Replace the data props passed to the views with filtered versions.
# For trainingJobs -> filteredTrainingJobs
# For inspectionJobs -> filteredInspectionJobs
# For inspectionReports -> filteredInspectionReports
# For machineCertificates -> filteredMachineCertificates
# For liftingToolCerts -> filteredLiftingToolCerts
# For operators -> filteredOperators

filter_logic = """
  // Role-Based Filtering
  const filteredTrainingJobs = isAdmin ? trainingJobs : trainingJobs.filter(j => 
    j.trainerId === currentEmployee?.id || j.trainerId === currentEmployee?.name || j.trainerId === currentEmployee?.firstName || j.instructor === currentEmployee?.name
  );

  const filteredInspectionJobs = isAdmin ? inspectionJobs : inspectionJobs.filter(j => 
    j.inspectorId === currentEmployee?.id || j.inspectorId === currentEmployee?.name || j.inspectorId === currentEmployee?.firstName || j.inspector === currentEmployee?.name
  );

  const filteredInspectionReports = isAdmin ? inspectionReports : inspectionReports.filter(j => 
    j.trainerId === currentEmployee?.id || j.inspector === currentEmployee?.name || j.inspector === currentEmployee?.firstName || j.inspector === currentEmployee?.id
  );

  const filteredMachineCertificates = isAdmin ? machineCertificates : machineCertificates.filter(j => 
    j.inspectedBy === currentEmployee?.id || j.inspectedBy === currentEmployee?.name || j.inspectedBy === currentEmployee?.firstName
  );

  const filteredLiftingToolCerts = isAdmin ? liftingToolCerts : liftingToolCerts.filter(j => 
    j.inspectedBy === currentEmployee?.id || j.inspectedBy === currentEmployee?.name || j.inspectedBy === currentEmployee?.firstName
  );

  const filteredOperators = isAdmin ? operators : operators.filter(o => 
    o.trainedBy === currentEmployee?.id || o.trainedBy === currentEmployee?.name || o.trainedBy === currentEmployee?.firstName
  );

"""

# Insert filter_logic before `// Dynamic state-linked card badges`
badge_line = "  // Dynamic state-linked card badges"
content = content.replace(badge_line, filter_logic + badge_line)

# Replace the passed props
content = content.replace("trainingJobs={trainingJobs}", "trainingJobs={filteredTrainingJobs}")
content = content.replace("inspectionJobs={inspectionJobs}", "inspectionJobs={filteredInspectionJobs}")
content = content.replace("inspectionReports={inspectionReports}", "inspectionReports={filteredInspectionReports}")
content = content.replace("certificates={machineCertificates}", "certificates={filteredMachineCertificates}")
content = content.replace("certificates={liftingToolCerts}", "certificates={filteredLiftingToolCerts}")
content = content.replace("operators={operators}", "operators={filteredOperators}")

# Replace the passed counts
content = content.replace("return trainingJobs.length;", "return filteredTrainingJobs.length;")
content = content.replace("return inspectionJobs.length;", "return filteredInspectionJobs.length;")
content = content.replace("return inspectionReports.length;", "return filteredInspectionReports.length;")
content = content.replace("return machineCertificates.length;", "return filteredMachineCertificates.length;")
content = content.replace("return liftingToolCerts.length;", "return filteredLiftingToolCerts.length;")
content = content.replace("return operators.length;", "return filteredOperators.length;")

with open(filename, "w") as f:
    f.write(content)
