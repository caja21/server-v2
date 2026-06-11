"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionPayload } from "@/lib/auth";

const links = [
  { href: "/dashboard/resumen", label: "Dashboard", roles: ["ADMIN", "OPERADOR"] },
  { href: "/dashboard/carga", label: "Carga / Retiro", roles: ["ADMIN", "OPERADOR"] },
  { href: "/dashboard/movimientos", label: "Movimientos en Vivo", roles: ["ADMIN", "OPERADOR"] },
  { href: "/dashboard/cuentas", label: "Cuentas Bancarias", roles: ["ADMIN", "OPERADOR"] },
  { href: "/dashboard/descarga", label: "Descarga de Cuentas", roles: ["ADMIN", "OPERADOR"] },
  { href: "/dashboard/turnos", label: "Turnos", roles: ["ADMIN"] },
  { href: "/dashboard/notificaciones", label: "Notificaciones", roles: ["ADMIN", "OPERADOR"] },
  { href: "/dashboard/historial", label: "Historial de Cargas", roles: ["ADMIN"] },
  { href: "/dashboard/sesiones", label: "Historial de Sesiones", roles: ["ADMIN"] },
  { href: "/dashboard/reportes", label: "Reporte de Operadores", roles: ["ADMIN"] },
  { href: "/dashboard/auditoria", label: "Auditoría", roles: ["ADMIN"] },
  { href: "/dashboard/usuarios", label: "Usuarios", roles: ["ADMIN"] },
];

function initials(nombre: string) {
  return nombre
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Sidebar({ session }: { session: SessionPayload }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function fetchUnread() {
      fetch("/api/notificaciones/no-leidas")
        .then((r) => (r.ok ? r.json() : { count: 0 }))
        .then((d) => setUnread(d.count || 0));
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const visibleLinks = links.filter((l) => l.roles.includes(session.rol));

  const content = (
    <>
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold">
          Panel<span className="text-emerald-500">Casino</span>
        </h2>
        <div className="flex items-center gap-2 mt-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold">
            {initials(session.nombre)}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-200 truncate">{session.nombre}</p>
            <p className="text-xs text-slate-400">
              {session.rol}
              {session.oficina ? ` · ${session.oficina}` : ""}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`block rounded-md px-3 py-2 text-sm transition ${
              pathname.startsWith(l.href)
                ? "bg-emerald-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center justify-between">
              {l.label}
              {l.href === "/dashboard/notificaciones" && unread > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold">
                  {unread}
                </span>
              )}
            </span>
          </Link>
        ))}
      </nav>

      <div className="p-2 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full text-sm text-slate-300 hover:bg-slate-800 rounded-md px-3 py-2 text-left"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-30">
        <h2 className="text-base font-bold">
          Panel<span className="text-emerald-500">Casino</span>
        </h2>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="p-2 rounded-md hover:bg-slate-800 text-slate-200"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex-col">
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative w-64 max-w-[80%] bg-slate-900 border-r border-slate-800 flex flex-col">
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="absolute top-3 right-3 p-1 rounded-md hover:bg-slate-800 text-slate-400"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
