"use client";

import { useEffect, useState, useCallback } from "react";
import { formatMoney, formatDateTime } from "@/lib/format";

type Sesion = {
  id: number;
  estado: string;
  saldoInicial: number;
  saldoFinal: number | null;
  totalCargas: number;
  totalRetiros: number;
  saldoTeoricoCierre: number | null;
  saldoRealCierre: number | null;
  diferencia: number | null;
  startTime: string;
  endTime: string | null;
  operador: { nombre: string; username: string };
};

type Operador = { id: number; nombre: string; username: string };

export default function SesionesPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [operadorId, setOperadorId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("all", "1");
    if (operadorId) params.set("operadorId", operadorId);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    params.set("page", String(page));

    const res = await fetch(`/api/turnos?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setSesiones(data.turnos);
      setTotal(data.total);
    }
    setLoading(false);
  }, [operadorId, desde, hasta, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch("/api/usuarios")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Operador[]) => setOperadores(data));
  }, []);

  function aplicarFiltros() {
    setPage(1);
    fetchData();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Historial de Sesiones</h1>
        <span className="text-xs text-slate-400">{total} sesiones</span>
      </div>

      <div className="mb-4 p-4 rounded-lg border border-slate-800 bg-slate-900 grid grid-cols-2 md:grid-cols-4 gap-3">
        <select
          className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
          value={operadorId}
          onChange={(e) => setOperadorId(e.target.value)}
        >
          <option value="">Todos los operadores</option>
          {operadores.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre} ({o.username})
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
        />
        <input
          type="date"
          className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
        />
        <button
          onClick={aplicarFiltros}
          className="rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-3 py-1.5"
        >
          Filtrar
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left p-3">Operador</th>
              <th className="text-left p-3">Inicio</th>
              <th className="text-left p-3">Cierre</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-right p-3">Cargas</th>
              <th className="text-right p-3">Retiros</th>
              <th className="text-right p-3">Saldo Teórico</th>
              <th className="text-right p-3">Saldo Real</th>
              <th className="text-right p-3">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && sesiones.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  Sin sesiones
                </td>
              </tr>
            )}
            {sesiones.map((s) => (
              <tr key={s.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                <td className="p-3">
                  <div>{s.operador.nombre}</div>
                  <div className="text-xs text-slate-400">{s.operador.username}</div>
                </td>
                <td className="p-3 text-slate-400 whitespace-nowrap">{formatDateTime(s.startTime)}</td>
                <td className="p-3 text-slate-400 whitespace-nowrap">
                  {s.endTime ? formatDateTime(s.endTime) : "-"}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      s.estado === "ABIERTO"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-700/40 text-slate-400"
                    }`}
                  >
                    {s.estado}
                  </span>
                </td>
                <td className="p-3 font-mono text-right text-emerald-400">{formatMoney(s.totalCargas)}</td>
                <td className="p-3 font-mono text-right text-red-400">{formatMoney(s.totalRetiros)}</td>
                <td className="p-3 font-mono text-right">{formatMoney(s.saldoTeoricoCierre || 0)}</td>
                <td className="p-3 font-mono text-right">{formatMoney(s.saldoRealCierre || 0)}</td>
                <td
                  className={`p-3 font-mono text-right font-semibold ${
                    Math.abs(s.diferencia || 0) > 0.01 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {s.diferencia !== null ? formatMoney(s.diferencia) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-slate-400">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
