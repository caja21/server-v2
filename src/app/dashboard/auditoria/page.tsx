"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDateTime } from "@/lib/format";

type LogEntry = {
  id: number;
  accion: string;
  detalles: string | null;
  ip: string | null;
  createdAt: string;
  usuario: { nombre: string; username: string } | null;
};

const ACCION_STYLES: Record<string, string> = {
  CERRAR_TURNO: "text-amber-400",
  TRANSFERENCIA_CUENTA: "text-sky-400",
  ELIMINAR_NOTIFICACION: "text-red-400",
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/auditoria");
    if (res.ok) setLogs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Auditoría</h1>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left p-3">Fecha/Hora</th>
              <th className="text-left p-3">Usuario</th>
              <th className="text-left p-3">Acción</th>
              <th className="text-left p-3">Detalles</th>
              <th className="text-left p-3">IP</th>
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
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Sin registros
                </td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                <td className="p-3 whitespace-nowrap text-slate-400">{formatDateTime(l.createdAt)}</td>
                <td className="p-3">
                  {l.usuario ? (
                    <>
                      <div>{l.usuario.nombre}</div>
                      <div className="text-xs text-slate-400">{l.usuario.username}</div>
                    </>
                  ) : (
                    "-"
                  )}
                </td>
                <td className={`p-3 font-mono font-semibold ${ACCION_STYLES[l.accion] || ""}`}>{l.accion}</td>
                <td className="p-3 text-slate-300">{l.detalles || "-"}</td>
                <td className="p-3 text-slate-400 font-mono text-xs">{l.ip || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
