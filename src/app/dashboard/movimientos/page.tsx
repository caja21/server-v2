"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

const TIPO_STYLES: Record<string, string> = {
  CARGA: "text-emerald-400",
  RETIRO: "text-red-400",
};

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const knownIds = useRef<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/movimientos");
    if (res.ok) {
      const data: Movimiento[] = await res.json();

      if (knownIds.current.size > 0) {
        const fresh = data.filter((m) => !knownIds.current.has(m.id)).map((m) => m.id);
        if (fresh.length > 0) {
          setNewIds((prev) => new Set([...prev, ...fresh]));
          fresh.forEach((id) => {
            setTimeout(() => {
              setNewIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
            }, 2000);
          });
        }
      }
      knownIds.current = new Set(data.map((m) => m.id));
      setMovimientos(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Movimientos en Vivo</h1>
        <span className="text-xs text-slate-400">Última hora · actualiza cada 5s</span>
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
                <td colSpan={7} className="p-4 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && movimientos.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Sin movimientos en la última hora
                </td>
              </tr>
            )}
            {movimientos.map((m) => (
              <tr
                key={m.id}
                className={`border-t border-slate-800 hover:bg-slate-900/50 ${
                  newIds.has(m.id) ? "row-highlight" : ""
                }`}
              >
                <td className="p-3 whitespace-nowrap text-slate-400">
                  {formatDateTime(m.createdAt)}
                </td>
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
    </div>
  );
}
