"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/toast";
import Button from "@/components/button";
import { ConfirmDialog, Modal } from "@/components/modal";
import { formatDateTime } from "@/lib/format";

type Usuario = {
  id: number;
  username: string;
  nombre: string;
  rol: string;
  oficina: string | null;
  activo: boolean;
  createdAt: string;
};

type Sesion = {
  id: number;
  createdAt: string;
  ip: string | null;
};

const emptyForm = {
  username: "",
  password: "",
  nombre: "",
  rol: "OPERADOR",
  oficina: "",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState<Record<number, string>>({});
  const [deleting, setDeleting] = useState<Usuario | null>(null);
  const [verSesiones, setVerSesiones] = useState<Usuario | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/usuarios");
    if (res.ok) setUsuarios(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function crearUsuario() {
    setError("");
    if (!newForm.username || !newForm.password || !newForm.nombre) {
      setError("Completá usuario, contraseña y nombre");
      return;
    }
    const res = await fetch("/api/usuarios", {
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
    setUsuarios((prev) => [...prev, created]);
    setNewForm(emptyForm);
    setShowNew(false);
    showToast("Usuario creado", "success");
  }

  async function toggleActivo(u: Usuario) {
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !u.activo }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    }
  }

  async function cambiarRol(u: Usuario, rol: string) {
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    }
  }

  async function abrirSesiones(u: Usuario) {
    setVerSesiones(u);
    setLoadingSesiones(true);
    const res = await fetch(`/api/sesiones?operadorId=${u.id}`);
    if (res.ok) setSesiones((await res.json()).sesiones);
    setLoadingSesiones(false);
  }

  async function cambiarPassword(u: Usuario) {
    const password = passwords[u.id];
    if (!password) return;
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPasswords((prev) => ({ ...prev, [u.id]: "" }));
      showToast("Contraseña actualizada", "success");
    } else {
      showToast("Error al actualizar contraseña", "error");
    }
  }

  async function eliminarUsuario() {
    if (!deleting) return;
    const res = await fetch(`/api/usuarios/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsuarios((prev) => prev.filter((u) => u.id !== deleting.id));
      showToast("Usuario eliminado", "success");
    } else {
      const data = await res.json();
      showToast(data.error || "Error al eliminar usuario", "error");
    }
    setDeleting(null);
  }

  async function cambiarOficina(u: Usuario, oficina: string) {
    if (oficina === (u.oficina || "")) return;
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oficina }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      showToast("Agente actualizado", "success");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Usuarios</h1>
        <Button variant={showNew ? "secondary" : "primary"} onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Cancelar" : "+ Nuevo Usuario"}
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
            placeholder="Usuario"
            className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.username}
            onChange={(e) => setNewForm({ ...newForm, username: e.target.value })}
          />
          <input
            placeholder="Contraseña"
            type="password"
            className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.password}
            onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
          />
          <input
            placeholder="Nombre"
            className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.nombre}
            onChange={(e) => setNewForm({ ...newForm, nombre: e.target.value })}
          />
          <select
            className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.rol}
            onChange={(e) => setNewForm({ ...newForm, rol: e.target.value })}
          >
            <option value="OPERADOR">Operador</option>
            <option value="ADMIN">Admin</option>
          </select>
          <input
            placeholder="Agente"
            className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.oficina}
            onChange={(e) => setNewForm({ ...newForm, oficina: e.target.value })}
          />
          <Button onClick={crearUsuario} className="col-span-2 md:col-span-5">
            Guardar
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left p-3">Usuario</th>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Rol</th>
              <th className="text-left p-3">Agente</th>
              <th className="text-left p-3">Creación</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Contraseña</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                <td className="p-3">
                  <button onClick={() => abrirSesiones(u)} className="text-emerald-400 hover:underline">
                    {u.username}
                  </button>
                </td>
                <td className="p-3">
                  <button onClick={() => abrirSesiones(u)} className="hover:underline">
                    {u.nombre}
                  </button>
                </td>
                <td className="p-3">
                  <select
                    className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs"
                    value={u.rol}
                    onChange={(e) => cambiarRol(u, e.target.value)}
                  >
                    <option value="OPERADOR">Operador</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="p-3">
                  <input
                    defaultValue={u.oficina || ""}
                    onBlur={(e) => cambiarOficina(u, e.target.value)}
                    placeholder="Agente"
                    className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-300"
                  />
                </td>
                <td className="p-3 text-slate-400">
                  {formatDateTime(u.createdAt)}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleActivo(u)}
                    className={`px-2 py-1 rounded border text-xs font-medium ${
                      u.activo
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-slate-700/40 text-slate-400 border-slate-600"
                    }`}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Nueva contraseña"
                      value={passwords[u.id] || ""}
                      onChange={(e) => setPasswords((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs"
                    />
                    <Button size="sm" variant="ghost" onClick={() => cambiarPassword(u)}>
                      Guardar
                    </Button>
                  </div>
                </td>
                <td className="p-3">
                  <Button size="sm" variant="destructive" onClick={() => setDeleting(u)}>
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!verSesiones}
        onClose={() => setVerSesiones(null)}
        title={`Inicios de sesión - ${verSesiones?.nombre || ""}`}
      >
        {loadingSesiones ? (
          <p className="text-slate-400 text-center py-6">Cargando...</p>
        ) : sesiones.length === 0 ? (
          <p className="text-slate-400 text-center py-6">Sin registros</p>
        ) : (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400 sticky top-0">
                <tr>
                  <th className="text-left p-2">Fecha/Hora</th>
                  <th className="text-left p-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {sesiones.map((s) => (
                  <tr key={s.id} className="border-t border-slate-800">
                    <td className="p-2 whitespace-nowrap text-slate-400">{formatDateTime(s.createdAt)}</td>
                    <td className="p-2 font-mono text-xs text-slate-400">{s.ip || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar usuario"
        message={`¿Eliminar al usuario "${deleting?.nombre}" (${deleting?.username})? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={eliminarUsuario}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
