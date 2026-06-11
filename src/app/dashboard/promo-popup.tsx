"use client";

import { useEffect, useState } from "react";
import Button from "@/components/button";
import { formatDateTime } from "@/lib/format";

type Promocion = {
  id: number;
  titulo: string;
  mensaje: string;
  createdAt: string;
};

export default function PromoPopup() {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [completing, setCompleting] = useState<number | null>(null);

  useEffect(() => {
    function fetchPendientes() {
      fetch("/api/promociones/pendientes")
        .then((r) => (r.ok ? r.json() : []))
        .then((data: Promocion[]) => setPromociones(data));
    }
    fetchPendientes();
    const interval = setInterval(fetchPendientes, 30000);
    return () => clearInterval(interval);
  }, []);

  async function completar(id: number) {
    setCompleting(id);
    await fetch(`/api/promociones/${id}/completar`, { method: "POST" });
    setPromociones((prev) => prev.filter((p) => p.id !== id));
    setCompleting(null);
  }

  if (promociones.length === 0) return null;

  const promo = promociones[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-lg border border-emerald-700 bg-slate-900 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🔔</span>
          <h2 className="text-lg font-bold text-emerald-400">{promo.titulo}</h2>
        </div>
        <p className="text-sm text-slate-200 whitespace-pre-wrap">{promo.mensaje}</p>
        <p className="text-xs text-slate-500 mt-2">{formatDateTime(promo.createdAt)}</p>
        {promociones.length > 1 && (
          <p className="text-xs text-slate-400 mt-2">
            +{promociones.length - 1} recordatorio(s) más pendiente(s)
          </p>
        )}
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => completar(promo.id)}
            loading={completing === promo.id}
          >
            Completar
          </Button>
        </div>
      </div>
    </div>
  );
}
