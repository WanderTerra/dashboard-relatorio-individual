import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import logoSrc from '../assets/logo.png';

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
  logoHref?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  actions,
  logoHref = '/',
}) => {
  const location = useLocation();

  // Se breadcrumbs for fornecido (mesmo vazio), não usar fallback
  const finalBreadcrumbs = breadcrumbs;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Breadcrumbs */}
        {finalBreadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            <Home className="w-3 h-3 sm:w-4 sm:h-4" />
            {finalBreadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />}
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
        
        {/* Logo, Título e ações - tudo na mesma linha */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          {/* Logo e Título */}
          <div className="flex items-center space-x-2 sm:space-x-4">            <Link to={logoHref} className="flex-shrink-0">
              <img 
                src={logoSrc} 
                alt="Logo da Empresa" 
                className="h-24 sm:h-32 lg:h-40 w-auto"
                onError={(e) => {
                  // Fallback para texto se a logo não carregar
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                                      parent.innerHTML = `
                    <div class="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <span class="text-white font-bold text-sm sm:text-base lg:text-lg">LOGO</span>
                    </div>
                  `;
                  }
                }}
              />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {actions && (
            <div className="mt-3 sm:mt-4 lg:mt-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
