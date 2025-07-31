import React, { useState } from "react";
import { Link, useLocation, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Menu, X, Home, Users, LogOut, ChevronLeft, ChevronRight, UserCog, Settings, Folder, List } from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

// Definição de tipo segura para os links da sidebar

type SidebarLink =
  | { label: string; to: string; icon: JSX.Element; children?: undefined }
  | { label: string; icon: JSX.Element; children: SidebarLink[]; to?: undefined };

const adminLinks: SidebarLink[] = [
  { label: "Dashboard", to: "/", icon: <Home size={20} /> },
  { label: "Agentes", to: "/agents", icon: <Users size={20} /> },
  { label: "Usuários", to: "/users", icon: <UserCog size={20} /> },
  {
    label: "Gerenciar",
    icon: <Settings size={20} />,
    children: [
      { label: "Carteiras", to: "/carteiras", icon: <Folder size={18} /> },
      { label: "Critérios", to: "/criterios", icon: <List size={18} /> },
    ],
  },
];

const agentLinks = (agentId: string): SidebarLink[] => [
  { to: `/agent/${agentId}`, label: "Minha Página", icon: <Home size={20} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed: collapsedProp, setCollapsed: setCollapsedProp }) => {
  const [open, setOpen] = useState(false); // mobile
  const [internalCollapsed, setInternalCollapsed] = useState(true); // desktop fallback
  const [openDropdown, setOpenDropdown] = useState<string | null>(null); // Controla dropdowns
  const collapsed = collapsedProp !== undefined ? collapsedProp : internalCollapsed;
  const setCollapsed = setCollapsedProp !== undefined ? setCollapsedProp : setInternalCollapsed;
  const { user, logout } = useAuth();
  const location = useLocation();

  // Detecta se é admin ou agente
  const isAdmin = user?.permissions?.includes("admin");
  const agentPerm = user?.permissions?.find((p) => p.startsWith("agent_"));
  const agentId = agentPerm ? agentPerm.replace("agent_", "") : null;

  // Links conforme perfil
  const links: SidebarLink[] = isAdmin
    ? adminLinks
    : agentId
    ? agentLinks(agentId)
    : [];

  // Sidebar width
  const sidebarWidth = collapsed ? "w-19" : "w-64";

  // Toggle dropdown
  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

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
        className={`hidden lg:fixed lg:top-0 lg:left-0 lg:h-full shadow-lg z-40 transition-all duration-200 lg:flex flex-col ${sidebarWidth} bg-white border-r border-gray-200`}
        onMouseEnter={() => collapsed && setCollapsed(false)}
        onMouseLeave={() => !collapsed && setCollapsed(true)}
      >
        <div className={`flex items-center justify-between px-4 py-4 border-b border-gray-200 ${collapsed ? 'justify-center' : ''}`}>
          {/* Logo e nome do usuário */}
          <div className={`flex items-center gap-3 transition-all duration-200 ${collapsed ? 'justify-center w-full' : ''}`}>
            {/* Logo/Avatar - sempre visível */}
            <div className="flex items-center justify-center rounded-full bg-gray-300 text-gray-700 font-bold text-sm w-10 h-10 uppercase select-none">
              {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0,2) : 'U'}
            </div>
            {/* Informações do usuário - só quando expandido */}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.username}</p>
              </div>
            )}
          </div>
        </div>
        <nav className="flex flex-col gap-1 mt-4 px-2">
          {links.map((link: SidebarLink) => {
            if ('children' in link && link.children) {
              return (
                <div key={link.label} className="mb-1">
                  <button
                    onClick={() => toggleDropdown(link.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${collapsed ? 'justify-center' : 'justify-between'} text-gray-700 hover:bg-gray-100`}
                  >
                    <div className="flex items-center gap-3">
                      {link.icon}
                      {!collapsed && <span>{link.label}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronRight 
                        size={16} 
                        className={`transition-transform duration-200 text-gray-500 ${openDropdown === link.label ? 'rotate-90' : ''}`}
                      />
                    )}
                  </button>
                  {/* Renderiza subitens SOMENTE se o dropdown está aberto e o sidebar expandido */}
                  {!collapsed && openDropdown === link.label && (
                    <div className="ml-6 mt-1 space-y-1">
                      {link.children.map((child: SidebarLink, idx: number) => (
                        <NavLink
                          key={'to' in child ? child.to : `child-${idx}`}
                          to={'to' in child ? child.to : '#'}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`
                          }
                          onClick={() => setOpenDropdown(null)} // Fecha dropdown ao clicar em um item
                        >
                          {child.icon}
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <NavLink
                  key={'to' in link ? link.to : link.label}
                  to={'to' in link ? link.to : '#'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                >
                  {link.icon}
                  {!collapsed && <span>{link.label}</span>}
                </NavLink>
              );
            }
          })}
          <button
            onClick={logout}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors mt-4 text-gray-700 hover:bg-gray-100 ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? "Sair" : undefined}
          >
            <LogOut size={20} />
            {!collapsed && <span>Sair</span>}
          </button>
        </nav>
      </aside>

      {/* Sidebar Mobile (overlay) */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-200 lg:hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <span className="font-bold text-xl text-gray-900">AuditaAI</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-700" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 mt-4 px-4">
          {links.map((link: SidebarLink) => {
            if ('children' in link && link.children) {
              return (
                <div key={link.label}>
                  <button
                    onClick={() => toggleDropdown(link.label)}
                    className="w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium transition-colors text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      {link.icon}
                      {link.label}
                    </div>
                    <ChevronRight 
                      size={16} 
                      className={`transition-transform duration-200 text-gray-500 ${openDropdown === link.label ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {openDropdown === link.label && (
                    <div className="ml-6 mt-1 space-y-1">
                      {link.children.map((child: SidebarLink, idx: number) => (
                        <Link
                          key={'to' in child ? child.to : `child-${idx}`}
                          to={'to' in child ? child.to : '#'}
                          className="flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors text-gray-600 hover:bg-gray-100"
                          onClick={() => {
                            setOpenDropdown(null);
                            setOpen(false);
                          }}
                        >
                          {child.icon}
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <Link
                  key={'to' in link ? link.to : link.label}
                  to={'to' in link ? link.to : '#'}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                    location.pathname === ('to' in link ? link.to : '')
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            }
          })}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors mt-4"
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