import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Menu, X, Home, Users, LogOut, ChevronLeft, ChevronRight, UserCog } from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

const adminLinks = [
  { to: "/", label: "Dashboard", icon: <Home size={20} /> },
  { to: "/agents", label: "Agentes", icon: <Users size={20} /> },
  { to: "/users", label: "Usuários", icon: <UserCog size={20} /> },
  // Adicione mais links para admin aqui se desejar
];

const agentLinks = (agentId: string) => [
  { to: `/agent/${agentId}`, label: "Minha Página", icon: <Home size={20} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed: collapsedProp, setCollapsed: setCollapsedProp }) => {
  const [open, setOpen] = useState(false); // mobile
  const [internalCollapsed, setInternalCollapsed] = useState(true); // desktop fallback
  const collapsed = collapsedProp !== undefined ? collapsedProp : internalCollapsed;
  const setCollapsed = setCollapsedProp !== undefined ? setCollapsedProp : setInternalCollapsed;
  const { user, logout } = useAuth();
  const location = useLocation();

  // Detecta se é admin ou agente
  const isAdmin = user?.permissions?.includes("admin");
  const agentPerm = user?.permissions?.find((p) => p.startsWith("agent_"));
  const agentId = agentPerm ? agentPerm.replace("agent_", "") : null;

  // Links conforme perfil
  const links = isAdmin
    ? adminLinks
    : agentId
    ? agentLinks(agentId)
    : [];

  // Sidebar width
  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <>
      {/* Botão hambúrguer para mobile */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-white rounded-full p-2 shadow"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu />
      </button>

      {/* Sidebar Desktop/Tablet */}
      <aside
        className={`hidden lg:fixed lg:top-0 lg:left-0 lg:h-full bg-blue-900 shadow-lg z-40 transition-all duration-200 lg:flex flex-col ${sidebarWidth}`}
        onMouseEnter={() => collapsed && setCollapsed(false)}
        onMouseLeave={() => !collapsed && setCollapsed(true)}
      >
        <div className={`flex items-center justify-between px-2 py-4 border-b ${collapsed ? 'justify-center' : ''}`}>
          <span className={`font-bold text-xl text-white transition-all duration-200 ${collapsed ? 'hidden' : 'block'}`}>Monitoria</span>
          <button
            className={`hidden lg:block rounded-full p-1 border ${collapsed ? 'mx-auto' : ''}`}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
          >
            {collapsed ? <ChevronRight size={20} color="#fff" /> : <ChevronLeft size={20} color="#fff" />}
          </button>
        </div>
        <nav className="flex flex-col gap-2 mt-4 px-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-2 py-2 rounded-lg font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-blue-700 text-white"
                  : "text-white hover:bg-blue-800 hover:text-white"
              } ${collapsed ? 'justify-center' : ''}`}
              title={link.label}
            >
              <span className="flex items-center">{React.cloneElement(link.icon, { color: "#fff" })}</span>
              <span className={`transition-all duration-200 ${collapsed ? 'hidden' : 'inline'}`}>{link.label}</span>
            </Link>
          ))}
          <button
            onClick={logout}
            className={`flex items-center gap-3 px-2 py-2 rounded-lg font-medium text-white hover:bg-red-700 hover:text-white transition-colors mt-4 ${collapsed ? 'justify-center' : ''}`}
            title="Sair"
          >
            <LogOut size={20} color="#fff" />
            <span className={`transition-all duration-200 ${collapsed ? 'hidden' : 'inline'}`}>Sair</span>
          </button>
        </nav>
      </aside>

      {/* Sidebar Mobile (overlay) */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-200 lg:hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <span className="font-bold text-xl text-blue-900">Monitoria</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X />
          </button>
        </div>
        <nav className="flex flex-col gap-2 mt-4 px-4">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-blue-100 text-blue-900"
                  : "text-gray-700 hover:bg-blue-50"
              }`}
              onClick={() => setOpen(false)}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors mt-4"
          >
            <LogOut size={20} />
            Sair
          </button>
        </nav>
      </aside>

      {/* Overlay para mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}; 