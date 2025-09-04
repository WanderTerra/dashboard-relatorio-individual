import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'feedback' | 'evaluation' | 'achievement';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  isAccepted?: boolean;
  feedbackId?: string;
  callId?: string;
  evaluationDate?: string;
}

interface NotificationBellProps {
  agentId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ agentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const navigate = useNavigate();

  // ✅ Mock temporário de notificações
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'feedback',
      title: 'Feedback da Ligação #6598',
      message: 'Você tem um novo feedback para revisar sobre sua performance na ligação de hoje.',
      date: new Date().toISOString(),
      isRead: false,
      callId: '6598',
      evaluationDate: new Date().toISOString().split('T')[0]
    },
    {
      id: '2',
      type: 'evaluation',
      title: 'Avaliação Semanal',
      message: 'Sua avaliação semanal está disponível para consulta.',
      date: new Date(Date.now() - 86400000).toISOString(),
      isRead: false,
      evaluationDate: new Date(Date.now() - 86400000).toISOString().split('T')[0]
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Nova Conquista Desbloqueada!',
      message: 'Parabéns! Você desbloqueou a conquista "Primeira Semana".',
      date: new Date(Date.now() - 172800000).toISOString(),
      isRead: true
    }
  ]);

  // Contar notificações não lidas
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Efeito de piscar quando há notificações não lidas
  useEffect(() => {
    if (unreadCount > 0) {
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Função para marcar notificação como lida
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  // Função para navegar para feedback específico
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.type === 'feedback' && notification.callId) {
      navigate(`/feedback?callId=${notification.callId}&date=${notification.evaluationDate}`);
    } else if (notification.type === 'evaluation') {
      navigate(`/feedback?date=${notification.evaluationDate}`);
    }
    
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Sino de Notificação */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all duration-200 ${
          isBlinking 
            ? 'bg-red-100 text-red-600 animate-pulse' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {notification.type === 'feedback' ? (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      ) : notification.type === 'evaluation' ? (
                        <Clock className="w-5 h-5 text-green-500" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 