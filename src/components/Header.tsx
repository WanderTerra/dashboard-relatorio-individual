import React from 'react';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard de Avaliação de Ligações</h1>
            <p className="text-blue-100 mt-1">Monitoramento de desempenho e qualidade</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <div className="bg-blue-600 rounded-lg px-4 py-2 flex items-center">
              <span className="mr-2">Data:</span>
              <span className="font-semibold">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
