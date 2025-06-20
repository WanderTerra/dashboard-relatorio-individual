import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  actions 
}) => {
  const location = useLocation();

  // Breadcrumbs padrão baseado na rota
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/', isActive: location.pathname === '/' }
  ];

  if (location.pathname.includes('/agent/')) {
    defaultBreadcrumbs.push({ 
      label: 'Detalhes do Agente', 
      isActive: true 
    });
  } else if (location.pathname.includes('/call-items')) {
    defaultBreadcrumbs.push({ 
      label: 'Itens de Ligação', 
      isActive: true 
    });
  }

  const finalBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        {finalBreadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Home className="w-4 h-4" />
            {finalBreadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                {item.href && !item.isActive ? (
                  <Link 
                    to={item.href} 
                    className="hover:text-blue-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={item.isActive ? 'text-blue-600 font-medium' : ''}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        
        {/* Título e ações */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 text-lg">
                {subtitle}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="mt-4 lg:mt-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
