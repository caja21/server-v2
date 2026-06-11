"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/components/toast";
import Button from "@/components/button";
import { ConfirmDialog } from "@/components/modal";

type Promocion = {
  id: number;
  titulo: string;
  mensaje: string;
  paraRoles: string;
  activa: boolean;
  intervaloMinutos: number | null;
  createdAt: string;
  creadoPor: { nombre: string; username: string } | null;
  completadas: { usuarioId: number; completadaAt: string; usuario: { nombre: string; username: string } }[];
};

const emptyForm = { titulo: "", mensaje: "", paraRoles: "OPERADOR", intervaloMinutos: "" };

function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const restante = Math.max(0, target - now);
  if (restante === 0) return <span className="text-amber-400">Pendiente de reaparecer</span>;

  const totalSeg = Math.ceil(restante / 1000);
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;

  return (
    <span>
      Vuelve a sonar en {min}:{seg.toString().padStart(2, "0")}
    </span>
  );
}

export default function PromocionesPage() {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Promocion | null>(null);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/promociones");
    if (res.ok) setPromociones(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function crearPromocion() {
    setError("");
    if (!newForm.titulo || !newForm.mensaje) {
      setError("Completá título y mensaje");
      return;
    }
    const res = await fetch("/api/promociones", {
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
    showToast("Recordatorio creado", "success");
    fetchData();
  }

  async function eliminarPromocion() {
    if (!deleting) return;
    const res = await fetch(`/api/promociones/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      setPromociones((prev) => prev.filter((p) => p.id !== deleting.id));
      showToast("Recordatorio eliminado", "success");
    } else {
      showToast("Error al eliminar", "error");
    }
    setDeleting(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Promociones</h1>
        <Button variant={showNew ? "secondary" : "primary"} onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Cancelar" : "+ Nuevo Recordatorio"}
        </Button>
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
            placeholder="Mensaje / recordatorio"
            rows={3}
            className="w-full rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
            value={newForm.mensaje}
            onChange={(e) => setNewForm({ ...newForm, mensaje: e.target.value })}
          />
          <div className="flex gap-3">
            <select
              className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
              value={newForm.paraRoles}
              onChange={(e) => setNewForm({ ...newForm, paraRoles: e.target.value })}
            >
              <option value="OPERADOR">Solo Operadores</option>
              <option value="ADMIN">Solo Admins</option>
              <option value="todos">Todos</option>
            </select>
            <input
              type="number"
              min={1}
              placeholder="Repetir cada (min)"
              className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm w-40"
              value={newForm.intervaloMinutos}
              onChange={(e) => setNewForm({ ...newForm, intervaloMinutos: e.target.value })}
            />
          </div>
          <p className="text-xs text-slate-500">
            Si indicás un intervalo, el recordatorio volverá a aparecer cada esa cantidad de minutos hasta que se desactive.
          </p>
          <Button onClick={crearPromocion}>Enviar</Button>
        </div>
      )}

      <div className="space-y-2">
        {loading && <p className="text-slate-400 p-8 text-center">Cargando...</p>}
        {!loading && promociones.length === 0 && (
          <p className="text-slate-400 p-8 text-center">Sin recordatorios</p>
        )}
        {promociones.map((p) => (
          <div key={p.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{p.titulo}</h3>
                <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{p.mensaje}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {formatDateTime(p.createdAt)} · Para: {p.paraRoles}
                  {p.intervaloMinutos ? ` · Repite cada ${p.intervaloMinutos} min` : ""}
                </p>
                {p.completadas.length > 0 && (
                  <div className="text-xs text-emerald-400 mt-2 space-y-1">
                    {p.completadas.map((c) => (
                      <p key={c.usuarioId}>
                        Completado por {c.usuario.nombre} a las {formatDateTime(c.completadaAt)}
                        {p.intervaloMinutos && (
                          <>
                            {" · "}
                            <Countdown
                              target={new Date(c.completadaAt).getTime() + p.intervaloMinutos * 60000}
                            />
                          </>
                        )}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="destructive" onClick={() => setDeleting(p)}>
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar recordatorio"
        message={`¿Eliminar el recordatorio "${deleting?.titulo}"?`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={eliminarPromocion}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
