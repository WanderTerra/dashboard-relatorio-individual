import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, type LoginRequest } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import auditaaiLogo from '../assets/logo_sem_fundo.png';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginRequest>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await login(credentials);
      console.log('🔍 Resposta completa do login:', response);
      console.log('🔍 Usuario requires_password_change:', response.user.requires_password_change);
      
      // Update the auth context with user info
      authLogin(response.user);
      console.log('🔐 AuthContext atualizado com usuário:', response.user);
      
      if (response.user.requires_password_change) {
        console.log('⚠️ Usuário precisa trocar senha, mostrando tela de troca');
        setShowPasswordChange(true);
      } else {
        console.log('✅ Login completo, redirecionando para dashboard');
        // Successful login, redirect to dashboard
        navigate('/');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Usuário ou senha incorretos');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Erro ao conectar. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeComplete = () => {
    console.log('🔄 Senha alterada com sucesso, ocultando tela de troca e redirecionando');
    setShowPasswordChange(false);
    // Note: The user info should already be set in authLogin above
    navigate('/');
  };

  if (showPasswordChange) {
    return <PasswordChangeForm onComplete={handlePasswordChangeComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex items-center justify-center" style={{height: '10rem'}}>
            <img src={auditaaiLogo} alt="Logo AuditaAi" className="h-32 w-32 object-contain" style={{background: 'transparent'}} />
          </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-400">
            Monitoria Inteligente
            </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Faça login para acessar o sistema
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Usuário
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-full focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="usuario.sobrenome"
                value={credentials.username}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-full focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={credentials.password}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Usuário padrão: <strong>admin.sistema</strong><br />
              Senha padrão: <strong>Temp@2025</strong>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

// Password Change Component
const PasswordChangeForm: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [passwords, setPasswords] = useState({
    current_password: 'Temp@2025', // Pre-fill the temporary password
    new_password: '',
    confirm_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwords.new_password !== passwords.confirm_password) {
      setError('As senhas não coincidem');
      return;
    }

    if (passwords.new_password.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const { changePassword } = await import('../lib/api');
      await changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });
      
      // Update user info in localStorage to reflect password change
      const userInfo = localStorage.getItem('user_info');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        user.requires_password_change = false;
        localStorage.setItem('user_info', JSON.stringify(user));
      }
      
      onComplete();
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Erro ao alterar senha. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-orange-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Alterar Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            É necessário alterar sua senha temporária
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                Senha Atual
              </label>
              <input
                id="current_password"
                name="current_password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                value={passwords.current_password}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                Nova Senha
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mínimo 8 caracteres"
                value={passwords.new_password}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Confirmar Nova Senha
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Repita a nova senha"
                value={passwords.confirm_password}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Alterando...
                </div>
              ) : (
                'Alterar Senha'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
