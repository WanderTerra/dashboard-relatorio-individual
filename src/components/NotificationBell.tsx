import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAgentNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  type Notification 
} from '../lib/notifications-api';
import { formatDateTime } from '../lib/format';

interface NotificationBellProps {
  agentId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ agentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Buscar notificações do agente
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', agentId],
    queryFn: () => getAgentNotifications(agentId),
    refetchInterval: 30000, // Refetch a cada 30 segundos
    staleTime: 10000, // 10 segundos
  });

  // Sincronizar notificações locais com as da API
  useEffect(() => {
    if (notifications && notifications.length !== localNotifications.length) {
      setLocalNotifications(notifications);
    }
  }, [notifications, localNotifications.length]);

  // Mutação para marcar notificação como lida
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', agentId] });
    },
  });

  // Mutação para marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(agentId),
    onSuccess: () => {
      // Invalidar query para sincronizar com o servidor
      queryClient.invalidateQueries({ queryKey: ['notifications', agentId] });
    },
    onError: (error) => {
      console.error('❌ Erro ao marcar todas as notificações como lidas:', error);
    }
  });

  // Usar notificações locais para renderização
  const displayNotifications = localNotifications;
  const unreadCount = displayNotifications.filter(n => !n.isRead).length;

  // Debug removido para melhorar performance

  // Efeito de piscar quando há notificações não lidas
  useEffect(() => {
    if (unreadCount > 0) {
      setIsBlinking(true);
      const timer = setTimeout(() => {
        setIsBlinking(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsBlinking(false);
    }
  }, [unreadCount]);

  // Função para marcar notificação como lida
  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  // Função para marcar todas como lidas
  const markAllAsRead = () => {
    // Atualizar estado local imediatamente (otimista)
    setLocalNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, isRead: true }));
      return updated;
    });
    
    // Chamar API
    markAllAsReadMutation.mutate();
  };

  // Função para navegar para feedback específico
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
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
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    disabled={markAllAsReadMutation.isPending}
                  >
                    {markAllAsReadMutation.isPending ? 'Marcando...' : 'Marcar todas como lidas'}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nenhuma notificação
              </div>
            ) : (
              displayNotifications.map((notification) => (
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
                        {formatDateTime(notification.date)}
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