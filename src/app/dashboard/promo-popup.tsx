"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/button";
import { formatDateTime } from "@/lib/format";

type Promocion = {
  id: number;
  titulo: string;
  mensaje: string;
  createdAt: string;
};

export const LOGOUT_CHECK_EVENT = "casino:check-logout-promos";

export default function PromoPopup() {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [completing, setCompleting] = useState<number | null>(null);
  const pendingLogout = useRef(false);
  const router = useRouter();

  async function fetchPendientes() {
    const res = await fetch("/api/promociones/pendientes");
    return res.ok ? ((await res.json()) as Promocion[]) : [];
  }

  async function doLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    async function poll() {
      const data = await fetchPendientes();
      setPromociones(data);
    }
    poll();
    const interval = setInterval(poll, 30000);

    async function onLogoutCheck() {
      const data = await fetchPendientes();
      if (data.length === 0) {
        await doLogout();
        return;
      }
      pendingLogout.current = true;
      setPromociones(data);
    }

    window.addEventListener(LOGOUT_CHECK_EVENT, onLogoutCheck);
    return () => {
      clearInterval(interval);
      window.removeEventListener(LOGOUT_CHECK_EVENT, onLogoutCheck);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function completar(id: number) {
    setCompleting(id);
    await fetch(`/api/promociones/${id}/completar`, { method: "POST" });
    const restantes = promociones.filter((p) => p.id !== id);
    setPromociones(restantes);
    setCompleting(null);
    if (restantes.length === 0 && pendingLogout.current) {
      pendingLogout.current = false;
      await doLogout();
    }
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
        {pendingLogout.current && (
          <p className="text-xs text-amber-400 mt-2">
            Completá los recordatorios pendientes para cerrar sesión.
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
