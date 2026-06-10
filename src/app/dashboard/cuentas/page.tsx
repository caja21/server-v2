"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/toast";
import Button from "@/components/button";
import { ConfirmDialog } from "@/components/modal";

type Operador = { id: number; nombre: string; username: string };

type Cuenta = {
  id: number;
  oficina: string;
  billetera: string;
  nombre: string;
  alias: string | null;
  cbu: string | null;
  estado: string;
  esSegura: boolean;
  operadorId: number | null;
  operador: Operador | null;
};

const emptyForm = {
  oficina: "",
  billetera: "",
  nombre: "",
  alias: "",
  cbu: "",
};

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Cuenta | null>(null);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    const [cuentasRes, usuariosRes] = await Promise.all([
      fetch("/api/cuentas"),
      fetch("/api/usuarios"),
    ]);
    if (cuentasRes.ok) setCuentas(await cuentasRes.json());
    if (usuariosRes.ok) {
      const usuarios = await usuariosRes.json();
      setOperadores(usuarios.filter((u: { rol: string }) => u.rol === "OPERADOR"));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function startEdit(c: Cuenta) {
    setEditingId(c.id);
    setEditForm({
      oficina: c.oficina,
      billetera: c.billetera,
      nombre: c.nombre,
      alias: c.alias || "",
      cbu: c.cbu || "",
    });
  }

  async function saveEdit(id: number) {
    setError("");
    const res = await fetch(`/api/cuentas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al guardar");
      return;
    }
    const updated = await res.json();
    setCuentas((prev) => prev.map((c) => (c.id === id ? updated : c)));
    setEditingId(null);
    showToast("Cuenta actualizada", "success");
  }

  async function toggleSegura(c: Cuenta) {
    const res = await fetch(`/api/cuentas/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ esSegura: !c.esSegura }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCuentas((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    }
  }

  async function toggleEstado(c: Cuenta) {
    const nuevoEstado = c.estado === "ACTIVA" ? "INACTIVA" : "ACTIVA";
    const res = await fetch(`/api/cuentas/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCuentas((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    }
  }

  async function asignarOperador(c: Cuenta, operadorId: string) {
    const res = await fetch(`/api/cuentas/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operadorId: operadorId === "" ? null : Number(operadorId) }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCuentas((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    }
  }

  async function crearCuenta() {
    setError("");
    if (!newForm.oficina || !newForm.billetera || !newForm.nombre) {
      setError("Completá oficina, billetera y nombre");
      return;
    }
    const res = await fetch("/api/cuentas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al crear");
      return;
    }
    const created = await res.json();
    setCuentas((prev) => [created, ...prev]);
    setNewForm(emptyForm);
    setShowNew(false);
    showToast("Cuenta creada", "success");
  }

  async function eliminarCuenta() {
    if (!deleting) return;
    const res = await fetch(`/api/cuentas/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      setCuentas((prev) => prev.filter((c) => c.id !== deleting.id));
      showToast("Cuenta eliminada", "success");
    } else {
      showToast("Error al eliminar la cuenta", "error");
    }
    setDeleting(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Cuentas Bancarias</h1>
        <Button variant={showNew ? "secondary" : "primary"} onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Cancelar" : "+ Nueva Cuenta"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded p-2">
          {error}
        </div>
      )}

      {showNew && (
        <div className="mb-4 p-4 rounded-lg border border-slate-800 bg-slate-900 grid grid-cols-2 md:grid-cols-5 gap-3">
          <input
            placeholder="Agente"
            className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.oficina}
            onChange={(e) => setNewForm({ ...newForm, oficina: e.target.value })}
          />
          <input
            placeholder="Billetera"
            className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.billetera}
            onChange={(e) => setNewForm({ ...newForm, billetera: e.target.value })}
          />
          <input
            placeholder="Nombre"
            className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.nombre}
            onChange={(e) => setNewForm({ ...newForm, nombre: e.target.value })}
          />
          <input
            placeholder="Alias"
            className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.alias}
            onChange={(e) => setNewForm({ ...newForm, alias: e.target.value })}
          />
          <input
            placeholder="Nro de Cuenta"
            className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.cbu}
            onChange={(e) => setNewForm({ ...newForm, cbu: e.target.value })}
          />
          <Button onClick={crearCuenta} className="col-span-2 md:col-span-5">
            Guardar
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left p-3">Agente</th>
              <th className="text-left p-3">Billetera</th>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Alias</th>
              <th className="text-left p-3">Nro de Cuenta</th>
              <th className="text-left p-3">Operador</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Segura</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && cuentas.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-slate-400">
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
                      value={editForm.alias}
                      onChange={(e) => setEditForm({ ...editForm, alias: e.target.value })}
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
                  <td className="p-2 text-slate-400">{c.estado}</td>
                  <td className="p-2 text-slate-400">{c.esSegura ? "Sí" : "No"}</td>
                  <td className="p-2 flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(c.id)}>
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
                  <td className="p-3 text-slate-400">{c.alias || "-"}</td>
                  <td className="p-3 font-mono text-xs text-slate-400">{c.cbu || "-"}</td>
                  <td className="p-3">
                    <select
                      className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs"
                      value={c.operadorId ?? ""}
                      onChange={(e) => asignarOperador(c, e.target.value)}
                    >
                      <option value="">Sin Asignar</option>
                      {operadores.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.nombre} ({op.username})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleEstado(c)}
                      className={`px-2 py-1 rounded border text-xs font-medium ${
                        c.estado === "ACTIVA"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : "bg-slate-700/40 text-slate-400 border-slate-600"
                      }`}
                    >
                      {c.estado}
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleSegura(c)}
                      className={`px-2 py-1 rounded border text-xs font-medium ${
                        c.esSegura
                          ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                          : "bg-slate-700/40 text-slate-400 border-slate-600"
                      }`}
                    >
                      {c.esSegura ? "Sí" : "No"}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleting(c)}>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar cuenta"
        message={`¿Eliminar la cuenta "${deleting?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={eliminarCuenta}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
