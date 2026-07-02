import React from 'react';
import * as Icons from "lucide-react";

export interface AccessoryData {
  no: number;
  idNo: string;
  description: string;
  type: string;
  swl: string;
  sizeWidth: string;
  length: string;
  color: string;
  result: string;
  remark: string;
}

interface AccessoriesDataEditorProps {
  data: AccessoryData[];
  onChange: (data: AccessoryData[]) => void;
  disabled?: boolean;
}

export function AccessoriesDataEditor({ data, onChange, disabled = false }: AccessoriesDataEditorProps) {
  const handleAddRow = () => {
    if (disabled) return;
    const nextNo = data.length > 0 ? Math.max(...data.map(d => d.no)) + 1 : 1;
    onChange([...data, {
      no: nextNo,
      idNo: "",
      description: "",
      type: "",
      swl: "",
      sizeWidth: "",
      length: "",
      color: "",
      result: "",
      remark: ""
    }]);
  };

  const handleRemoveRow = (index: number) => {
    if (disabled) return;
    const newData = [...data];
    newData.splice(index, 1);
    
    // Recalculate No sequentially
    const updatedData = newData.map((item, i) => ({ ...item, no: i + 1 }));
    onChange(updatedData);
  };

  const handleChange = (index: number, field: keyof AccessoryData, value: string) => {
    if (disabled) return;
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <Icons.Layers className="w-4 h-4 text-[#683EFF]" />
          Accessories Description Data
        </h4>
        {!disabled && (
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-[#683EFF] bg-[#F0EBFF] hover:bg-[#E2D9FF] transition-colors rounded-full"
          >
            <Icons.Plus className="w-3 h-3" />
            Add Row
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-2 w-12 text-center">No</th>
              <th className="px-3 py-2">ID No/TAG No</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">S.W.L</th>
              <th className="px-3 py-2">Size/Width</th>
              <th className="px-3 py-2">Length</th>
              <th className="px-3 py-2">Color</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-3 py-2">Remark</th>
              {!disabled && <th className="px-3 py-2 w-12 text-center">Act</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={disabled ? 10 : 11} className="px-4 py-8 text-center text-slate-400 text-xs italic">
                  No accessories data added yet.
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2 py-2 text-center">
                    <span className="text-[10px] font-bold text-slate-500">{row.no}</span>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled={disabled}
                      value={row.idNo}
                      onChange={(e) => handleChange(index, 'idNo', e.target.value)}
                      placeholder="TAG No"
                      className="w-full bg-transparent border border-slate-200 rounded px-2 py-1 text-xs focus:border-[#683EFF] focus:ring-1 focus:ring-[#683EFF] outline-none disabled:opacity-75 disabled:border-transparent"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled={disabled}
                      value={row.description}
                      onChange={(e) => handleChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full bg-transparent border border-slate-200 rounded px-2 py-1 text-xs focus:border-[#683EFF] focus:ring-1 focus:ring-[#683EFF] outline-none disabled:opacity-75 disabled:border-transparent"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled={disabled}
                      value={row.type}
                      onChange={(e) => handleChange(index, 'type', e.target.value)}
                      placeholder="Type"
                      className="w-full bg-transparent border border-slate-200 rounded px-2 py-1 text-xs focus:border-[#683EFF] focus:ring-1 focus:ring-[#683EFF] outline-none disabled:opacity-75 disabled:border-transparent"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled={disabled}
                      value={row.swl}
                      onChange={(e) => handleChange(index, 'swl', e.target.value)}
                      placeholder="SWL"
                      className="w-full bg-transparent border border-slate-200 rounded px-2 py-1 text-xs focus:border-[#683EFF] focus:ring-1 focus:ring-[#683EFF] outline-none disabled:opacity-75 disabled:border-transparent"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled={disabled}
                      value={row.sizeWidth}
                      onChange={(e) => handleChange(index, 'sizeWidth', e.target.value)}
                      placeholder="Size/Width"
                      className="w-full bg-transparent border border-slate-200 rounded px-2 py-1 text-xs focus:border-[#683EFF] focus:ring-1 focus:ring-[#683EFF] outline-none disabled:opacity-75 disabled:border-transparent"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled={disabled}
                      value={row.length}
                      onChange={(e) => handleChange(index, 'length', e.target.value)}
                      placeholder="Length"
                      className="w-full bg-transparent border border-slate-200 rounded px-2 py-1 text-xs focus:border-[#683EFF] focus:ring-1 focus:ring-[#683EFF] outline-none disabled:opacity-75 disabled:border-transparent"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled={disabled}
                      value={row.color}
                      onChange={(e) => handleChange(index, 'color', e.target.value)}
                      placeholder="Color"
                      className="w-full bg-transparent border border-slate-200 rounded px-2 py-1 text-xs focus:border-[#683EFF] focus:ring-1 focus:ring-[#683EFF] outline-none disabled:opacity-75 disabled:border-transparent"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled={disabled}
                      value={row.result}
                      onChange={(e) => handleChange(index, 'result', e.target.value)}
                      placeholder="Result"
                      className="w-full bg-transparent border border-slate-200 rounded px-2 py-1 text-xs focus:border-[#683EFF] focus:ring-1 focus:ring-[#683EFF] outline-none disabled:opacity-75 disabled:border-transparent"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled={disabled}
                      value={row.remark}
                      onChange={(e) => handleChange(index, 'remark', e.target.value)}
                      placeholder="Remark"
                      className="w-full bg-transparent border border-slate-200 rounded px-2 py-1 text-xs focus:border-[#683EFF] focus:ring-1 focus:ring-[#683EFF] outline-none disabled:opacity-75 disabled:border-transparent"
                    />
                  </td>
                  {!disabled && (
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Remove row"
                      >
                        <Icons.X className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
