"use client";

import { useEffect, useState, useCallback } from "react";
import { formatMoney, formatDateTime } from "@/lib/format";

type Movimiento = {
  id: number;
  tipo: string;
  cliente: string;
  titular: string | null;
  monto: number;
  bono: number;
  estado: string;
  createdAt: string;
  operador: { nombre: string; username: string; oficina: string | null } | null;
  cuenta: { nombre: string; billetera: string; cbu: string | null } | null;
};

type Operador = { id: number; nombre: string; username: string };

const TIPO_STYLES: Record<string, string> = {
  CARGA: "text-emerald-400",
  RETIRO: "text-red-400",
};

export default function HistorialPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [tipo, setTipo] = useState("");
  const [operadorId, setOperadorId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tipo) params.set("tipo", tipo);
    if (operadorId) params.set("operadorId", operadorId);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    params.set("page", String(page));

    const res = await fetch(`/api/movimientos/historial?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setMovimientos(data.movimientos);
      setTotal(data.total);
    }
    setLoading(false);
  }, [tipo, operadorId, desde, hasta, page]);

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

  const totalCargas = movimientos.filter((m) => m.tipo === "CARGA").reduce((acc, m) => acc + m.monto, 0);
  const totalRetiros = movimientos.filter((m) => m.tipo === "RETIRO").reduce((acc, m) => acc + m.monto, 0);
  const totalBono = movimientos.reduce((acc, m) => acc + m.bono, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Historial de Cargas y Retiros</h1>
        <span className="text-xs text-slate-400">{total} registros</span>
      </div>

      <div className="mb-4 p-4 rounded-lg border border-slate-800 bg-slate-900 grid grid-cols-2 md:grid-cols-5 gap-3">
        <select
          className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="CARGA">Carga</option>
          <option value="RETIRO">Retiro</option>
        </select>
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

      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-md bg-slate-800/60 border border-slate-700 px-3 py-2">
          <p className="text-xs text-slate-400">Total Cargas (página)</p>
          <p className="font-mono font-semibold text-emerald-400">{formatMoney(totalCargas)}</p>
        </div>
        <div className="rounded-md bg-slate-800/60 border border-slate-700 px-3 py-2">
          <p className="text-xs text-slate-400">Total Retiros (página)</p>
          <p className="font-mono font-semibold text-red-400">{formatMoney(totalRetiros)}</p>
        </div>
        <div className="rounded-md bg-slate-800/60 border border-slate-700 px-3 py-2">
          <p className="text-xs text-slate-400">Total Bono (página)</p>
          <p className="font-mono font-semibold text-amber-400">{formatMoney(totalBono)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left p-3">Fecha/Hora</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Usuario</th>
              <th className="text-right p-3">Monto</th>
              <th className="text-right p-3">Bono</th>
              <th className="text-left p-3">Cuenta</th>
              <th className="text-left p-3">Operador</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && movimientos.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Sin movimientos
                </td>
              </tr>
            )}
            {movimientos.map((m) => (
              <tr key={m.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                <td className="p-3 whitespace-nowrap text-slate-400">{formatDateTime(m.createdAt)}</td>
                <td className={`p-3 font-semibold ${TIPO_STYLES[m.tipo] || ""}`}>{m.tipo}</td>
                <td className={`p-3 ${m.tipo === "RETIRO" ? "text-red-400" : ""}`}>
                  {m.cliente}
                  {m.titular && <div className="text-xs text-slate-500">{m.titular}</div>}
                </td>
                <td className={`p-3 font-mono text-right ${m.tipo === "RETIRO" ? "text-red-400" : ""}`}>
                  {formatMoney(m.monto)}
                </td>
                <td className="p-3 font-mono text-right text-amber-400">
                  {m.bono > 0 ? formatMoney(m.bono) : "-"}
                </td>
                <td className="p-3 text-slate-400">
                  {m.cuenta ? `${m.cuenta.nombre} (${m.cuenta.billetera})` : "-"}
                </td>
                <td className="p-3">
                  {m.operador ? (
                    <div>
                      <div>{m.operador.nombre}</div>
                      <div className="text-xs text-slate-400">{m.operador.oficina}</div>
                    </div>
                  ) : (
                    "-"
                  )}
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
