"use client";

import { useEffect, useState, useCallback } from "react";
import { formatMoney } from "@/lib/format";
import { useToast } from "@/components/toast";
import Button from "@/components/button";
import { Modal } from "@/components/modal";

type Operador = { id: number; nombre: string; username: string };

type Cuenta = {
  id: number;
  oficina: string;
  billetera: string;
  nombre: string;
  alias: string | null;
  cbu: string | null;
  estado: string;
  saldoBase: number;
  totalDescargado: number;
  operadorId: number | null;
  operador: Operador | null;
  total: number;
  cantidadMovimientos: number;
};

const emptyForm = {
  oficina: "",
  billetera: "",
  nombre: "",
  alias: "",
  cbu: "",
  total: "0",
};

export default function DescargaPage() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [descargando, setDescargando] = useState<Cuenta | null>(null);
  const [dejarInput, setDejarInput] = useState("0");
  const [transfiriendo, setTransfiriendo] = useState<Cuenta | null>(null);
  const [montoTransferir, setMontoTransferir] = useState("0");
  const [destinoTransferir, setDestinoTransferir] = useState("");
  const [cuentasSeguras, setCuentasSeguras] = useState<{ id: number; nombre: string; alias: string | null }[]>([]);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/cuentas/descarga");
    if (res.ok) setCuentas(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    fetch("/api/cuentas/seguras").then((r) => (r.ok ? r.json() : [])).then(setCuentasSeguras);
  }, []);

  function startEdit(c: Cuenta) {
    setEditingId(c.id);
    setEditForm({
      oficina: c.oficina,
      billetera: c.billetera,
      nombre: c.nombre,
      alias: c.alias || "",
      cbu: c.cbu || "",
      total: String(c.total),
    });
  }

  async function saveEdit(c: Cuenta) {
    setError("");

    const sumaMovimientos = c.total - c.saldoBase;
    const nuevoSaldoBase = Number(editForm.total) - sumaMovimientos;

    const res = await fetch(`/api/cuentas/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oficina: editForm.oficina,
        billetera: editForm.billetera,
        nombre: editForm.nombre,
        alias: editForm.alias,
        cbu: editForm.cbu,
        saldoBase: nuevoSaldoBase,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al guardar");
      return;
    }
    setEditingId(null);
    fetchData();
    showToast("Cuenta actualizada", "success");
  }

  function abrirDescarga(c: Cuenta) {
    setDescargando(c);
    setDejarInput("0");
    setError("");
  }

  async function confirmarDescarga() {
    if (!descargando) return;
    const dejar = Number(dejarInput);
    if (isNaN(dejar) || dejar < 0) {
      setError("Monto a dejar inválido");
      return;
    }
    setError("");
    const res = await fetch(`/api/cuentas/${descargando.id}/descargar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dejar }),
    });
    if (res.ok) {
      setDescargando(null);
      fetchData();
      showToast("Cuenta descargada", "success");
    } else {
      const data = await res.json();
      setError(data.error || "Error al descargar");
    }
  }

  function abrirTransferencia(c: Cuenta) {
    setTransfiriendo(c);
    setMontoTransferir("0");
    setDestinoTransferir("");
    setError("");
  }

  async function confirmarTransferencia() {
    if (!transfiriendo) return;
    const monto = Number(montoTransferir);
    if (isNaN(monto) || monto <= 0) {
      setError("Monto inválido");
      return;
    }
    setError("");
    const res = await fetch(`/api/cuentas/${transfiriendo.id}/bajar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monto,
        motivo: "Transferencia a Cuenta Segura",
        destinoId: destinoTransferir ? Number(destinoTransferir) : undefined,
      }),
    });
    if (res.ok) {
      setTransfiriendo(null);
      fetchData();
      showToast("Transferencia realizada", "success");
    } else {
      const data = await res.json();
      setError(data.error || "Error al transferir");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Descarga de Cuentas</h1>
        <span className="text-xs text-slate-400">Actualiza cada 10s</span>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded p-2">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left p-3">Agente</th>
              <th className="text-left p-3">Billetera</th>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Nro de Cuenta</th>
              <th className="text-left p-3">Operador</th>
              <th className="text-left p-3">Movimientos</th>
              <th className="text-left p-3">Saldo Acumulado</th>
              <th className="text-left p-3">Total Descargado</th>
              <th className="text-left p-3">Acciones</th>
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
            {!loading && cuentas.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  Sin cuentas
                </td>
              </tr>
            )}
            {cuentas.map((c) =>
              editingId === c.id ? (
                <tr key={c.id} className="border-t border-slate-800 bg-slate-900/50">
                  <td className="p-2">
                    <input
                      className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1"
                      value={editForm.oficina}
                      onChange={(e) => setEditForm({ ...editForm, oficina: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1"
                      value={editForm.billetera}
                      onChange={(e) => setEditForm({ ...editForm, billetera: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1"
                      value={editForm.nombre}
                      onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1"
                      value={editForm.cbu}
                      onChange={(e) => setEditForm({ ...editForm, cbu: e.target.value })}
                    />
                  </td>
                  <td className="p-2 text-slate-400">{c.operador?.nombre || "Sin asignar"}</td>
                  <td className="p-2 text-slate-400">{c.cantidadMovimientos}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1 font-mono"
                      value={editForm.total}
                      onChange={(e) => setEditForm({ ...editForm, total: e.target.value })}
                    />
                  </td>
                  <td className="p-2 text-slate-400 font-mono">{formatMoney(c.totalDescargado)}</td>
                  <td className="p-2 flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(c)}>
                      Guardar Cambios
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                      Cancelar
                    </Button>
                  </td>
                </tr>
              ) : (
                <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                  <td className="p-3">{c.oficina}</td>
                  <td className="p-3">{c.billetera}</td>
                  <td className="p-3">{c.nombre}</td>
                  <td className="p-3 font-mono text-xs text-slate-400">{c.cbu || "-"}</td>
                  <td className="p-3 text-slate-400">{c.operador?.nombre || "Sin asignar"}</td>
                  <td className="p-3 text-slate-400">{c.cantidadMovimientos}</td>
                  <td className={`p-3 font-mono font-semibold ${c.total >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatMoney(c.total)}
                  </td>
                  <td className="p-3 font-mono text-slate-400">{formatMoney(c.totalDescargado)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="warning" onClick={() => abrirDescarga(c)}>
                        Descargar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => abrirTransferencia(c)}>
                        Transferir
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!descargando} onClose={() => setDescargando(null)} title="Descargar cuenta">
        {descargando && (
          <>
            <p className="text-sm text-slate-400 mb-4">{descargando.nombre}</p>

            <div className="rounded-md bg-slate-800/60 border border-slate-700 px-3 py-2 mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">Saldo actual</span>
              <span
                className={`font-mono font-semibold ${
                  descargando.total >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatMoney(descargando.total)}
              </span>
            </div>

            <label className="block text-sm text-slate-300 mb-1">
              ¿Cuánto monto querés dejar en la cuenta?
            </label>
            <input
              type="number"
              min="0"
              autoFocus
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={dejarInput}
              onChange={(e) => setDejarInput(e.target.value)}
            />

            {error && (
              <div className="mt-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded p-2">
                {error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDescargando(null)}>
                Cancelar
              </Button>
              <Button variant="warning" onClick={confirmarDescarga}>
                Descargar
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!transfiriendo} onClose={() => setTransfiriendo(null)} title="Transferir a Cuenta Segura">
        {transfiriendo && (
          <>
            <p className="text-sm text-slate-400 mb-4">{transfiriendo.nombre}</p>

            <div className="rounded-md bg-slate-800/60 border border-slate-700 px-3 py-2 mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">Saldo actual</span>
              <span
                className={`font-mono font-semibold ${
                  transfiriendo.total >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatMoney(transfiriendo.total)}
              </span>
            </div>

            <label className="block text-sm text-slate-300 mb-1">Monto a transferir</label>
            <input
              type="number"
              min="0"
              autoFocus
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={montoTransferir}
              onChange={(e) => setMontoTransferir(e.target.value)}
            />

            {cuentasSeguras.length > 0 && (
              <>
                <label className="block text-sm text-slate-300 mt-3 mb-1">Destino (opcional)</label>
                <select
                  className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                  value={destinoTransferir}
                  onChange={(e) => setDestinoTransferir(e.target.value)}
                >
                  <option value="">Cuenta Segura predeterminada</option>
                  {cuentasSeguras.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.nombre} {cs.alias ? `(${cs.alias})` : ""}
                    </option>
                  ))}
                </select>
              </>
            )}

            {error && (
              <div className="mt-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded p-2">
                {error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setTransfiriendo(null)}>
                Cancelar
              </Button>
              <Button onClick={confirmarTransferencia}>Transferir</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
