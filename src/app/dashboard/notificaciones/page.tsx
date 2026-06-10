"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/components/toast";
import Button from "@/components/button";
import { ConfirmDialog } from "@/components/modal";

type Notificacion = {
  id: number;
  titulo: string;
  mensaje: string;
  paraRoles: string;
  createdAt: string;
  leida: boolean;
};

type Session = { rol: string };

const emptyForm = { titulo: "", mensaje: "", paraRoles: "todos" };

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Notificacion | null>(null);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/notificaciones");
    if (res.ok) setNotificaciones(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    fetch("/api/usuarios/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setSession(s));
  }, [fetchData]);

  async function marcarLeida(id: number) {
    await fetch(`/api/notificaciones/${id}/leer`, { method: "POST" });
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  }

  async function crearNotificacion() {
    setError("");
    if (!newForm.titulo || !newForm.mensaje) {
      setError("Completá título y mensaje");
      return;
    }
    const res = await fetch("/api/notificaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al crear");
      return;
    }
    setNewForm(emptyForm);
    setShowNew(false);
    showToast("Notificación enviada", "success");
    fetchData();
  }

  async function eliminarNotificacion() {
    if (!deleting) return;
    const res = await fetch(`/api/notificaciones/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      setNotificaciones((prev) => prev.filter((n) => n.id !== deleting.id));
      showToast("Notificación eliminada", "success");
    } else {
      showToast("Error al eliminar", "error");
    }
    setDeleting(null);
  }

  const isAdmin = session?.rol === "ADMIN";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Notificaciones</h1>
        {isAdmin && (
          <Button variant={showNew ? "secondary" : "primary"} onClick={() => setShowNew((v) => !v)}>
            {showNew ? "Cancelar" : "+ Nueva Notificación"}
          </Button>
        )}
      </div>

      {showNew && (
        <div className="mb-4 p-4 rounded-lg border border-slate-800 bg-slate-900 space-y-3">
          {error && (
            <div className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded p-2">
              {error}
            </div>
          )}
          <input
            placeholder="Título"
            className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.titulo}
            onChange={(e) => setNewForm({ ...newForm, titulo: e.target.value })}
          />
          <textarea
            placeholder="Mensaje"
            rows={3}
            className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.mensaje}
            onChange={(e) => setNewForm({ ...newForm, mensaje: e.target.value })}
          />
          <select
            className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.paraRoles}
            onChange={(e) => setNewForm({ ...newForm, paraRoles: e.target.value })}
          >
            <option value="todos">Todos</option>
            <option value="ADMIN">Solo Admins</option>
            <option value="OPERADOR">Solo Operadores</option>
          </select>
          <Button onClick={crearNotificacion}>Enviar</Button>
        </div>
      )}

      <div className="space-y-2">
        {loading && <p className="text-slate-400 p-8 text-center">Cargando...</p>}
        {!loading && notificaciones.length === 0 && (
          <p className="text-slate-400 p-8 text-center">Sin notificaciones</p>
        )}
        {notificaciones.map((n) => (
          <div
            key={n.id}
            className={`rounded-lg border p-4 ${
              n.leida ? "border-slate-800 bg-slate-900" : "border-emerald-700 bg-emerald-950/20"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{n.titulo}</h3>
                <p className="text-sm text-slate-300 mt-1">{n.mensaje}</p>
                <p className="text-xs text-slate-400 mt-2">{formatDateTime(n.createdAt)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!n.leida && (
                  <Button size="sm" variant="ghost" onClick={() => marcarLeida(n.id)}>
                    Marcar leída
                  </Button>
                )}
                {isAdmin && (
                  <Button size="sm" variant="destructive" onClick={() => setDeleting(n)}>
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar notificación"
        message={`¿Eliminar la notificación "${deleting?.titulo}"?`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={eliminarNotificacion}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
