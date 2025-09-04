export interface Notification {
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

export const getAgentNotifications = async (agentId: string): Promise<Notification[]> => {
  try {
    const response = await fetch(`/api/agents/${agentId}/notifications`);
    if (!response.ok) throw new Error('Erro ao buscar notificações');
    return response.json();
  } catch (error) {
    console.error('Erro na API de notificações:', error);
    // Retornar array vazio em caso de erro
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
  }
};

export const acceptFeedback = async (feedbackId: string): Promise<void> => {
  try {
    await fetch(`/api/feedbacks/${feedbackId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro ao aceitar feedback:', error);
  }
};

export const rejectFeedback = async (feedbackId: string): Promise<void> => {
  try {
    await fetch(`/api/feedbacks/${feedbackId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro ao rejeitar feedback:', error);
  }
}; 