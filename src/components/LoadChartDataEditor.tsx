import React from 'react';
import * as Icons from 'lucide-react';

interface LoadChartData {
  boom: string;
  radius: string;
  testLoad: string;
  swl: string;
}

interface LoadChartDataEditorProps {
  data?: LoadChartData[];
  onChange?: (data: LoadChartData[]) => void;
  disabled?: boolean;
}

export function LoadChartDataEditor({ data = [], onChange, disabled = false }: LoadChartDataEditorProps) {
  const handleAddRow = () => {
    if (onChange) {
      onChange([...data, { boom: "", radius: "", testLoad: "", swl: "" }]);
    }
  };

  const handleUpdateRow = (index: number, field: keyof LoadChartData, value: string) => {
    if (onChange) {
      const newData = [...data];
      newData[index] = { ...newData[index], [field]: value };
      onChange(newData);
    }
  };

  const handleDeleteRow = (index: number) => {
    if (onChange) {
      const newData = [...data];
      newData.splice(index, 1);
      onChange(newData);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Load Chart Data</label>
        {!disabled && (
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-[#683EFF]/10 hover:bg-[#683EFF]/20 text-[#683EFF] rounded-lg transition-colors uppercase tracking-widest"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            Add Row
          </button>
        )}
      </div>
      
      {data.length > 0 ? (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">No.</th>
                  <th className="px-4 py-3">Boom (Meter)</th>
                  <th className="px-4 py-3">Radius(Meter)</th>
                  <th className="px-4 py-3">Test Load(Tonne)</th>
                  <th className="px-4 py-3">S.W.L(Tonne)</th>
                  {!disabled && (
                    <th className="px-4 py-3 w-16 text-center">
                      <Icons.Settings className="w-3.5 h-3.5 mx-auto text-slate-400" />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.boom}
                        onChange={(e) => handleUpdateRow(idx, 'boom', e.target.value)}
                        disabled={disabled}
                        className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-[#683EFF] rounded px-2 py-1 text-slate-700 focus:outline-none transition-colors disabled:hover:border-transparent"
                        placeholder="-"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.radius}
                        onChange={(e) => handleUpdateRow(idx, 'radius', e.target.value)}
                        disabled={disabled}
                        className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-[#683EFF] rounded px-2 py-1 text-slate-700 focus:outline-none transition-colors disabled:hover:border-transparent"
                        placeholder="-"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.testLoad}
                        onChange={(e) => handleUpdateRow(idx, 'testLoad', e.target.value)}
                        disabled={disabled}
                        className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-[#683EFF] rounded px-2 py-1 text-slate-700 focus:outline-none transition-colors disabled:hover:border-transparent"
                        placeholder="-"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.swl}
                        onChange={(e) => handleUpdateRow(idx, 'swl', e.target.value)}
                        disabled={disabled}
                        className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-[#683EFF] rounded px-2 py-1 text-slate-700 focus:outline-none transition-colors disabled:hover:border-transparent"
                        placeholder="-"
                      />
                    </td>
                    {!disabled && (
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Icons.Trash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-300 rounded-xl bg-slate-50">
          <p className="text-slate-400 text-xs font-medium">No load chart data entered.</p>
        </div>
      )}
    </div>
  );
}
