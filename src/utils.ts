/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a YYYY-MM-DD date string to DD/MM/YYYY
 */
export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "-";
  
  // Handle ISO strings or YYYY-MM-DD
  const pureDate = dateString.split("T")[0];
  const parts = pureDate.split("-");
  
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  
  return dateString;
};
