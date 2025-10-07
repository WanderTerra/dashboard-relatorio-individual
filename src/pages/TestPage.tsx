import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900">Página de Teste</h1>
        <p className="text-gray-600 mt-2">Se você está vendo isso, as rotas estão funcionando!</p>
      </div>
    </div>
  );
};

export default TestPage;
