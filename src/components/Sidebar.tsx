import React, { useState } from "react";
import { Link, useLocation, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Menu, X, Home, Users, LogOut, ChevronLeft, ChevronRight, UserCog, Settings, Folder, List, Upload, Link2, MessageSquare, Target, BarChart3, Bot, FileText } from "lucide-react";
import logoSidebar from "../assets/logo_sidebar.png";
import logoSidebar2 from "../assets/logo_sidebar2.png";

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
  { label: "Desempenho", to: "/agents", icon: <BarChart3 size={20} /> },
  { label: "Feedback", to: "/feedback", icon: <MessageSquare size={20} /> },
  { label: "Seu Guru", to: "/seu-guru", icon: <Bot size={20} /> },
  { label: "Upload de Áudios", to: "/upload", icon: <Upload size={20} /> },
              {
                label: "Relatórios",
                icon: <FileText size={20} />,
                children: [
                  { label: "Dashboard Carteiras", to: "/dashboard-carteiras", icon: <BarChart3 size={18} /> },
                  { label: "Produtividade", to: "/relatorios/produtividade", icon: <BarChart3 size={18} /> },
                  { label: "Notas dos Agentes", to: "/relatorios/notas", icon: <Target size={18} /> },
                  { label: "Acordos Feitos", to: "/relatorios/acordos", icon: <MessageSquare size={18} /> },
                ],
              },
  {
    label: "Gerenciar",
    icon: <Settings size={20} />,
    children: [
      { label: "Usuários", to: "/users", icon: <UserCog size={18} /> },
      { label: "Carteiras & Critérios", to: "/carteira-criterios", icon: <Link2 size={18} /> },
      { label: "Correções de Transcrição", to: "/correcoes", icon: <List size={18} /> },
      { label: "Baixar Áudios", to: "/downloads", icon: <Upload size={18} /> },
      { label: "Base de Conhecimento", to: "/knowledge-base", icon: <Folder size={18} /> },
    ],
  },
];

const agentLinks = (agentId: string): SidebarLink[] => [
  { to: `/agent/${agentId}`, label: "Minha Página", icon: <Home size={20} /> },
  { to: `/feedback`, label: "Feedback", icon: <MessageSquare size={20} /> },
  { to: "/seu-guru", label: "Seu Guru", icon: <Bot size={20} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed: collapsedProp, setCollapsed: setCollapsedProp }) => {
  const [open, setOpen] = useState(false); // mobile
  const [internalCollapsed, setInternalCollapsed] = useState(true); // desktop fallback
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set()); // controla dropdowns abertos
  const collapsed = collapsedProp !== undefined ? collapsedProp : internalCollapsed;
  const setCollapsed = setCollapsedProp !== undefined ? setCollapsedProp : setInternalCollapsed;
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();

  // Detecta se é admin ou agente
  const isAdmin = user?.permissions?.includes("admin");
  const agentPerm = user?.permissions?.find((p) => p.startsWith("agent_"));
  const agentId = agentPerm ? agentPerm.replace("agent_", "") : null;

  // Debug logs temporários
  console.log('🔍 Sidebar debug:', {
    isLoading,
    user: user ? { id: user.id, username: user.username, permissions: user.permissions } : null,
    isAdmin,
    agentPerm,
    agentId
  });

  // Links conforme perfil - aguardar carregamento do usuário
  let links: SidebarLink[] = [];
  
  if (isLoading) {
    console.log('⏳ Ainda carregando, links vazios');
    links = [];
  } else if (!user) {
    console.log('❌ Nenhum usuário logado, links vazios');
    links = [];
  } else if (isAdmin) {
    console.log('✅ Usuário é admin, usando adminLinks');
    links = adminLinks;
  } else if (agentId) {
    console.log('✅ Usuário é agente, usando agentLinks para agentId:', agentId);
    links = agentLinks(agentId);
  } else {
    console.log('⚠️ Usuário logado mas sem permissões reconhecidas. Permissões:', user.permissions);
    // Fallback: mostrar links básicos para usuários logados sem permissões específicas
    links = [
      { label: "Dashboard", to: "/", icon: <Home size={20} /> },
      { label: "Feedback", to: "/feedback", icon: <MessageSquare size={20} /> },
      { label: "Seu Guru", to: "/seu-guru", icon: <Bot size={20} /> },
    ];
  }

  console.log('🔍 Links finais:', { linksCount: links.length, links });



  // Função para controlar dropdowns
  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  // Fecha dropdowns quando sidebar colapsa
  React.useEffect(() => {
    if (collapsed) {
      setOpenDropdowns(new Set());
    }
  }, [collapsed]);

  // Sidebar width
  const sidebarWidth = collapsed ? "w-16" : "w-72";

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
        className={`hidden lg:fixed lg:top-0 lg:left-0 lg:h-full shadow-xl z-40 transition-all duration-300 ease-in-out lg:flex flex-col ${sidebarWidth} backdrop-blur-md`}
        style={{ 
          background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)'
        }}
        onMouseEnter={() => collapsed && setCollapsed(false)}
        onMouseLeave={() => !collapsed && setCollapsed(true)}
      >
        {/* Header do Sidebar - Logo */}
        <div className={`flex items-center justify-center border-b border-slate-200/60 transition-all duration-300 ease-in-out ${collapsed ? 'px-2 py-6' : 'px-4 py-8'}`}>
          {collapsed ? (
            <img 
              src={logoSidebar} 
              alt="Monitoria Dashboard" 
              className="h-16 w-auto transition-all duration-300 ease-in-out object-contain"
            />
          ) : (
            <img 
              src={logoSidebar2} 
              alt="Monitoria Dashboard" 
              className="h-16 w-auto transition-all duration-300 ease-in-out object-contain"
            />
          )}
        </div>
        
        {/* Navegação Principal */}
        <nav className="flex flex-col gap-1 mt-4 px-1 flex-1 group">
          {links.map((link) => {
            const linkWithChildren = link as { label: string; icon: JSX.Element; children: SidebarLink[] };
            const linkWithoutChildren = link as { label: string; to: string; icon: JSX.Element };
            
            if ('children' in link && link.children) {
              return (
                <div key={linkWithChildren.label} className="mb-1 transition-all duration-300 ease-in-out relative">
                  <button
                    onClick={() => toggleDropdown(linkWithChildren.label)}
                    className={`flex items-center gap-3 font-medium rounded-lg transition-all duration-300 ease-in-out ${
                      collapsed ? 'px-2 py-3 w-full justify-center' : 'px-3 py-2.5 w-full text-left'
                    }`}
                    style={{ color: '#374151' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                      e.currentTarget.style.color = '#1f2937';
                      if (!collapsed) {
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${collapsed ? 'w-full flex justify-center' : 'w-6 flex justify-center'}`}>
                      {link.icon}
                    </div>
                    {!collapsed && (
                      <>
                        <span className="flex-1 transition-all duration-300 ease-in-out whitespace-nowrap">{linkWithChildren.label}</span>
                        <ChevronRight 
                          size={16} 
                          className={`transition-all duration-300 ease-in-out flex-shrink-0 ${
                            openDropdowns.has(linkWithChildren.label) ? 'rotate-90' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>
                  
                  {/* Tooltip quando colapsado */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap z-50">
                      {linkWithChildren.label}
                    </div>
                  )}
                  
                  {/* Renderiza subitens com animação */}
                  {!collapsed && (
                    <div 
                      className={`ml-4 overflow-hidden transition-all duration-300 ease-in-out ${
                        openDropdowns.has(linkWithChildren.label) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      {link.children.map((child, idx) => (
                        <NavLink
                          key={child.to ?? `child-${idx}`}
                          to={child.to ?? '#'}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg transition-all duration-300 ease-in-out text-sm ${
                              collapsed ? 'px-2 py-2 w-full justify-center' : 'px-3 py-2'
                            } ${
                              isActive 
                                ? 'bg-slate-200/80 text-slate-900' 
                                : 'hover:bg-slate-100/60'
                            }`
                          }
                          style={{ color: '#4b5563' }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                            e.currentTarget.style.color = '#1f2937';
                            if (!collapsed) {
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '';
                            e.currentTarget.style.color = '#4b5563';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${collapsed ? 'w-full flex justify-center' : 'w-6 flex justify-center'}`}>
                            {child.icon}
                          </div>
                          <span className="transition-all duration-300 ease-in-out whitespace-nowrap">{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div key={linkWithoutChildren.to ?? linkWithoutChildren.label} className="relative">
                  <NavLink
                    to={linkWithoutChildren.to ?? '#'}
                    className={`flex items-center gap-3 rounded-lg transition-all duration-300 ease-in-out font-medium ${
                      collapsed ? 'px-2 py-3 w-full justify-center' : 'px-3 py-2.5'
                    }`}
                    style={{ color: '#374151' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                      e.currentTarget.style.color = '#1f2937';
                      if (!collapsed) {
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${collapsed ? 'w-full flex justify-center' : 'w-6 flex justify-center'}`}>
                      {linkWithoutChildren.icon}
                    </div>
                    {!collapsed && <span className="transition-all duration-300 ease-in-out whitespace-nowrap">{linkWithoutChildren.label}</span>}
                  </NavLink>
                  
                  {/* Tooltip quando colapsado */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap z-50">
                      {linkWithoutChildren.label}
                    </div>
                  )}
                </div>
              );
            }
          })}
        </nav>
        
        {/* Seção de Perfil e Logout - Parte Inferior */}
        <div className={`mt-auto border-t border-slate-200/60 transition-all duration-300 ease-in-out ${collapsed ? 'p-2' : 'p-4'}`}>
          {/* Layout Horizontal: Perfil + Botão de Sair */}
          <div className={`flex items-center transition-all duration-300 ease-in-out ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {/* Perfil do Usuário - Só mostra quando expandido */}
            {!collapsed && (
              <div className="flex items-center gap-3 transition-all duration-300 ease-in-out">
                {/* Avatar com iniciais */}
                <div className="flex items-center justify-center rounded-full text-white font-bold text-sm w-10 h-10 uppercase select-none flex-shrink-0 shadow-lg transition-all duration-300 ease-in-out"
                  style={{ backgroundColor: '#3b82f6' }}>
                  {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0,2) : <UserCog size={18} />}
                </div>
                {/* Nome do usuário */}
                <div className="flex flex-col min-w-0 transition-all duration-300 ease-in-out">
                  <span className="text-sm font-semibold truncate whitespace-nowrap" style={{ color: '#1f2937' }}>
                    {user?.full_name || 'Usuário'}
                  </span>
                  <span className="text-xs text-gray-600 truncate whitespace-nowrap">
                    {user?.username || 'usuário'}
                  </span>
                </div>
              </div>
            )}
            
            {/* Botão de Logout - Sempre visível */}
            <button
              onClick={logout}
              className={`flex items-center justify-center p-2 rounded-lg font-medium transition-all duration-300 ease-in-out hover:bg-red-50 hover:bg-opacity-10 ${
                collapsed ? 'w-full' : ''
              }`}
              title="Sair"
              style={{ color: '#ef4444' }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.color = '#ef4444';
              }}
            >
              <LogOut size={collapsed ? 22 : 20} />
            </button>
          </div>
        </div>
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
          {links.map((link: SidebarLink) => (
            'to' in link && link.to ? (
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
            ) : null
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