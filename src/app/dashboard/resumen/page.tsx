"use client";

import { useEffect, useState, useCallback } from "react";
import { formatMoney } from "@/lib/format";

type Bloque = {
  cargas: { cantidad: number; total: number; totalBono: number };
  retiros: { cantidad: number; total: number };
};

type Resumen = {
  hoy: Bloque;
  semana: Bloque;
  mes: Bloque;
};

function Tarjeta({ titulo, datos }: { titulo: string; datos: Bloque }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-sm font-semibold text-slate-400 mb-4">{titulo}</h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Cargas</p>
            <p className="text-xs text-slate-500">{datos.cargas.cantidad} movimientos</p>
          </div>
          <p className="font-mono text-lg font-bold text-emerald-400">
            {formatMoney(datos.cargas.total)}
          </p>
        </div>

        {datos.cargas.totalBono > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Bono Cargado</p>
            <p className="font-mono text-sm text-amber-400">
              {formatMoney(datos.cargas.totalBono)}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <div>
            <p className="text-xs text-slate-400">Retiros</p>
            <p className="text-xs text-slate-500">{datos.retiros.cantidad} movimientos</p>
          </div>
          <p className="font-mono text-lg font-bold text-red-400">
            {formatMoney(datos.retiros.total)}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <p className="text-xs text-slate-400">Balance Neto</p>
          <p
            className={`font-mono text-lg font-bold ${
              datos.cargas.total - datos.retiros.total >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatMoney(datos.cargas.total - datos.retiros.total)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResumenPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/reportes/resumen");
    if (res.ok) setResumen(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <span className="text-xs text-slate-400">Actualiza cada 30s</span>
      </div>

      {loading && <p className="text-slate-400">Cargando...</p>}

      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tarjeta titulo="Hoy" datos={resumen.hoy} />
          <Tarjeta titulo="Esta Semana" datos={resumen.semana} />
          <Tarjeta titulo="Este Mes" datos={resumen.mes} />
        </div>
      )}
    </div>
  );
}
