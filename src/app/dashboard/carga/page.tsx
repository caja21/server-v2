"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/toast";
import Button from "@/components/button";

type Cuenta = {
  id: number;
  oficina: string;
  billetera: string;
  nombre: string;
  alias: string | null;
  cbu: string | null;
  estado: string;
};

export default function CargaPage() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [tipo, setTipo] = useState<"CARGA" | "RETIRO">("CARGA");
  const [cliente, setCliente] = useState("");
  const [titular, setTitular] = useState("");
  const [monto, setMonto] = useState("");
  const [bono, setBono] = useState("");
  const [cuentaId, setCuentaId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchCuentas = useCallback(async () => {
    const res = await fetch("/api/cuentas");
    if (res.ok) {
      const data: Cuenta[] = await res.json();
      setCuentas(data.filter((c) => c.estado === "ACTIVA"));
    }
  }, []);

  useEffect(() => {
    fetchCuentas();
  }, [fetchCuentas]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!cliente || !monto || !cuentaId) {
      setError("Completá usuario, monto y cuenta");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo,
        cliente,
        titular: tipo === "RETIRO" ? titular || null : null,
        monto,
        bono: tipo === "CARGA" ? bono || 0 : 0,
        cuentaId,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al registrar");
      return;
    }

    showToast(`${tipo === "CARGA" ? "Carga" : "Retiro"} registrado para ${cliente}`, "success");
    setCliente("");
    setTitular("");
    setMonto("");
    setBono("");
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-4">Carga / Retiro de Fichas</h1>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded p-2">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Tipo de Movimiento</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo("CARGA")}
              className={`rounded-md py-2 text-sm font-semibold transition ${
                tipo === "CARGA"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              Carga
            </button>
            <button
              type="button"
              onClick={() => setTipo("RETIRO")}
              className={`rounded-md py-2 text-sm font-semibold transition ${
                tipo === "RETIRO"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              Retiro
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Usuario del Cliente</label>
          <input
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Ej: juanpitt6576"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Monto</label>
          <input
            type="number"
            min="0"
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0"
          />
        </div>

        {tipo === "RETIRO" && (
          <div>
            <label className="block text-sm text-slate-300 mb-1">Alias o Nombre del Titular</label>
            <input
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              placeholder="Ej: juan.perez"
            />
          </div>
        )}

        {tipo === "CARGA" && (
          <div>
            <label className="block text-sm text-slate-300 mb-1">Bono</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={bono}
              onChange={(e) => setBono(e.target.value)}
              placeholder="0"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-300 mb-1">Cuenta Bancaria</label>
          <select
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={cuentaId}
            onChange={(e) => setCuentaId(e.target.value)}
          >
            <option value="">Seleccionar cuenta...</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} - {c.billetera} {c.cbu ? `- ${c.cbu}` : ""}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          loading={loading}
          variant={tipo === "CARGA" ? "primary" : "warning"}
          className="w-full py-2"
        >
          {tipo === "CARGA" ? "Cargar" : "Retirar"}
        </Button>
      </form>
    </div>
  );
}
