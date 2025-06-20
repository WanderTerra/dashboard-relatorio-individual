import React from 'react';
import logoSrc from '../assets/auditaai-logo.svg';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-center">
          {/* Logo e Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <img 
                src={logoSrc} 
                alt="auditaAI Logo" 
                className="h-14 w-auto"
                onError={(e) => {
                  // Fallback para texto se a logo não carregar
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="flex items-center space-x-2">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <span class="text-white font-bold text-xl">AI</span>
                        </div>
                        <div>
                          <span class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                            auditaAI
                          </span>
                        </div>
                      </div>
                    `;
                  }
                }}
              />
            </div>
            
            {/* Separador vertical */}
            <div className="hidden lg:block w-px h-12 bg-gray-300"></div>
            
            {/* Título do Dashboard */}
            <div className="text-left">
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-800">
                Dashboard de Avaliação
              </h1>
              <p className="text-sm text-gray-600">
                Monitoramento de qualidade de ligações
              </p>
            </div>
          </div>
          
          {/* Informações laterais */}
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            {/* Status indicador */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Online</span>
            </div>
            
            {/* Data atual */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
