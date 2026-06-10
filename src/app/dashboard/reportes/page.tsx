"use client";

import { useEffect, useState, useCallback } from "react";
import { formatMoney } from "@/lib/format";

type ReporteOperador = {
  id: number;
  nombre: string;
  username: string;
  oficina: string | null;
  cantidadCargas: number;
  totalCargado: number;
  totalBono: number;
};

export default function ReportesPage() {
  const [reportes, setReportes] = useState<ReporteOperador[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/reportes/operadores");
    if (res.ok) setReportes(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalGeneral = reportes.reduce((acc, r) => acc + r.totalCargado, 0);
  const totalBonoGeneral = reportes.reduce((acc, r) => acc + r.totalBono, 0);
  const totalCantidad = reportes.reduce((acc, r) => acc + r.cantidadCargas, 0);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Reporte de Cargas por Operador</h1>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left p-3">Operador</th>
              <th className="text-left p-3">Agente</th>
              <th className="text-left p-3">Cantidad de Cargas</th>
              <th className="text-left p-3">Total Cargado</th>
              <th className="text-left p-3">Total Bono</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && reportes.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Sin operadores
                </td>
              </tr>
            )}
            {reportes.map((r) => (
              <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                <td className="p-3">
                  <div>{r.nombre}</div>
                  <div className="text-xs text-slate-400">{r.username}</div>
                </td>
                <td className="p-3 text-slate-400">{r.oficina || "-"}</td>
                <td className="p-3">{r.cantidadCargas}</td>
                <td className="p-3 font-mono text-emerald-400">
                  {formatMoney(r.totalCargado)}
                </td>
                <td className="p-3 font-mono text-amber-400">
                  {formatMoney(r.totalBono)}
                </td>
              </tr>
            ))}
          </tbody>
          {!loading && reportes.length > 0 && (
            <tfoot>
              <tr className="border-t border-slate-700 bg-slate-900 font-semibold">
                <td className="p-3" colSpan={2}>
                  Total General
                </td>
                <td className="p-3">{totalCantidad}</td>
                <td className="p-3 font-mono text-emerald-400">
                  {formatMoney(totalGeneral)}
                </td>
                <td className="p-3 font-mono text-amber-400">
                  {formatMoney(totalBonoGeneral)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
