"use client";

import { useEffect, useState, useCallback } from "react";
import { formatMoney, formatDateTime } from "@/lib/format";
import { useToast } from "@/components/toast";
import Button from "@/components/button";
import { Modal } from "@/components/modal";

type TurnoActivo = {
  id: number;
  saldoInicial: number;
  totalCargas: number;
  totalRetiros: number;
  startTime: string;
  saldoTeorico: number;
  saldoReal: number;
  diferencia: number;
};

type TurnoHistorial = {
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

export default function TurnosPage() {
  const [activo, setActivo] = useState<TurnoActivo | null>(null);
  const [historial, setHistorial] = useState<TurnoHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cerrando, setCerrando] = useState(false);
  const [saldoFinal, setSaldoFinal] = useState("0");
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    const [activoRes, historialRes] = await Promise.all([
      fetch("/api/turnos/activo"),
      fetch("/api/turnos"),
    ]);
    if (activoRes.ok) setActivo(await activoRes.json());
    if (historialRes.ok) setHistorial(await historialRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function iniciarTurno() {
    setError("");
    const res = await fetch("/api/turnos/iniciar", { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al iniciar turno");
      return;
    }
    showToast("Turno iniciado", "success");
    fetchData();
  }

  function abrirCierre() {
    setSaldoFinal("0");
    setError("");
    setCerrando(true);
  }

  async function confirmarCierre() {
    setError("");
    const res = await fetch("/api/turnos/cerrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saldoFinal: Number(saldoFinal) }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al cerrar turno");
      return;
    }
    setCerrando(false);
    showToast("Turno cerrado", "success");
    fetchData();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Turnos de Caja</h1>
        <span className="text-xs text-slate-400">Actualiza cada 15s</span>
      </div>

      {error && !cerrando && (
        <div className="mb-4 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded p-2">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 p-8 text-center">Cargando...</p>
      ) : activo ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400">
              Turno abierto · iniciado {formatDateTime(activo.startTime)}
            </h2>
            <Button variant="warning" onClick={abrirCierre}>
              Cerrar Turno
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Saldo Inicial</p>
              <p className="font-mono text-lg font-bold">{formatMoney(activo.saldoInicial)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Cargas del turno</p>
              <p className="font-mono text-lg font-bold text-emerald-400">{formatMoney(activo.totalCargas)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Retiros del turno</p>
              <p className="font-mono text-lg font-bold text-red-400">{formatMoney(activo.totalRetiros)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Saldo Teórico</p>
              <p className="font-mono text-lg font-bold">{formatMoney(activo.saldoTeorico)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Saldo Real</p>
              <p className="font-mono text-lg font-bold">{formatMoney(activo.saldoReal)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Diferencia</p>
              <p className={`font-mono text-lg font-bold ${Math.abs(activo.diferencia) > 0.01 ? "text-red-400" : "text-emerald-400"}`}>
                {formatMoney(activo.diferencia)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5 mb-6 flex items-center justify-between">
          <p className="text-slate-400 text-sm">No tenés un turno abierto.</p>
          <Button onClick={iniciarTurno}>Iniciar Turno</Button>
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-400 mb-2">Historial de Turnos</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left p-3">Operador</th>
              <th className="text-left p-3">Inicio</th>
              <th className="text-left p-3">Cierre</th>
              <th className="text-right p-3">Cargas</th>
              <th className="text-right p-3">Retiros</th>
              <th className="text-right p-3">Saldo Teórico</th>
              <th className="text-right p-3">Saldo Real</th>
              <th className="text-right p-3">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {!loading && historial.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Sin turnos cerrados
                </td>
              </tr>
            )}
            {historial.map((t) => (
              <tr key={t.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                <td className="p-3">
                  <div>{t.operador.nombre}</div>
                  <div className="text-xs text-slate-400">{t.operador.username}</div>
                </td>
                <td className="p-3 text-slate-400 whitespace-nowrap">{formatDateTime(t.startTime)}</td>
                <td className="p-3 text-slate-400 whitespace-nowrap">
                  {t.endTime ? formatDateTime(t.endTime) : "-"}
                </td>
                <td className="p-3 font-mono text-right text-emerald-400">{formatMoney(t.totalCargas)}</td>
                <td className="p-3 font-mono text-right text-red-400">{formatMoney(t.totalRetiros)}</td>
                <td className="p-3 font-mono text-right">{formatMoney(t.saldoTeoricoCierre || 0)}</td>
                <td className="p-3 font-mono text-right">{formatMoney(t.saldoRealCierre || 0)}</td>
                <td className={`p-3 font-mono text-right font-semibold ${Math.abs(t.diferencia || 0) > 0.01 ? "text-red-400" : "text-emerald-400"}`}>
                  {formatMoney(t.diferencia || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={cerrando} onClose={() => setCerrando(false)} title="Cerrar turno">
        <p className="text-sm text-slate-400 mb-4">
          Ingresá el efectivo físico contado para registrar el cierre del turno.
        </p>
        <label className="block text-sm text-slate-300 mb-1">Efectivo declarado</label>
        <input
          type="number"
          min="0"
          autoFocus
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={saldoFinal}
          onChange={(e) => setSaldoFinal(e.target.value)}
        />
        {error && (
          <div className="mt-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded p-2">
            {error}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCerrando(false)}>
            Cancelar
          </Button>
          <Button variant="warning" onClick={confirmarCierre}>
            Cerrar Turno
          </Button>
        </div>
      </Modal>
    </div>
  );
}
