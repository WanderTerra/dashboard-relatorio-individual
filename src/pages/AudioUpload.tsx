import * as React from 'react';
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, FileAudio, X, CheckCircle, AlertCircle, Loader2, Music, User } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Combobox } from '../components/ui/combobox';
import { toast } from 'sonner';
import { getAllCarteiras } from '../lib/api';
import axios from 'axios';
import ScribeDiarizedTranscription from '../components/ScribeDiarizedTranscription';
import AvaliacaoResultados from '../components/AvaliacaoResultados';
import { useAvaliacaoAutomatica } from '../hooks/use-avaliacao-automatica';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const AudioUpload: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCarteira, setSelectedCarteira] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFileId, setUploadFileId] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadCallId, setUploadCallId] = useState<string | null>(null);
  const [uploadAvaliacaoId, setUploadAvaliacaoId] = useState<number | null>(null);
  const pollingRef = useRef<any>(null);

  // Estado para transcrição com Scribe
  const [transcription, setTranscription] = useState<any>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Hook para avaliação automática
  const {
    selectedCarteira: selectedCarteiraAvaliacao,
    setSelectedCarteira: setSelectedCarteiraAvaliacao,
    avaliacaoResult,
    isAprovada,
    criteriosCarteira,
    isLoadingCriterios,
    isAvaliando,
    avaliarTranscricao,
    limparResultado,
    error: avaliacaoError
  } = useAvaliacaoAutomatica();

  // Buscar carteiras disponíveis
  const { data: carteiras = [] } = useQuery({
    queryKey: ['carteiras'],
    queryFn: getAllCarteiras,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Buscar usuários ativos da tabela users (excluindo administradores)
  const { data: agents = [], isLoading: agentsLoading, error: agentsError } = useQuery({
    queryKey: ['active-users-agents-no-admin'],
    queryFn: async () => {
      try {
        // Usar a função getActiveUsers que busca usuários ativos da tabela users
        const { getActiveUsers, getUserPermissions } = await import('../lib/api');
        const response = await getActiveUsers();
        console.log('✅ Usuários ativos da tabela users:', response);
        
        // Verificar se a resposta tem a estrutura esperada
        let users = [];
        if (response && Array.isArray(response)) {
          users = response;
        } else if (response && response.users && Array.isArray(response.users)) {
          users = response.users;
        } else if (response && response.data && Array.isArray(response.data)) {
          users = response.data;
        } else {
          console.warn('⚠️ Estrutura de resposta inesperada:', response);
          return [];
        }
        
        // Filtrar usuários que NÃO são administradores
        const nonAdminUsers = [];
        for (const user of users) {
          try {
            const userPermissions = await getUserPermissions(user.id);
            console.log(`🔍 Usuário ${user.full_name} (ID: ${user.id}) - Permissões:`, userPermissions);
            
            // Verificar se o usuário tem permissões administrativas
            const isAdmin = userPermissions.some(permission => 
              permission.toLowerCase().includes('admin') ||
              permission.toLowerCase().includes('administrador') ||
              permission.toLowerCase().includes('system') ||
              permission.toLowerCase().includes('sistema')
            );
            
            if (!isAdmin) {
              nonAdminUsers.push(user);
              console.log(`✅ Usuário ${user.full_name} adicionado (não é admin)`);
            } else {
              console.log(`❌ Usuário ${user.full_name} filtrado (é admin)`);
            }
          } catch (permissionError) {
            console.warn(`⚠️ Erro ao buscar permissões do usuário ${user.id}:`, permissionError);
            // Se não conseguir verificar permissões, incluir o usuário por segurança
            nonAdminUsers.push(user);
          }
        }
        
        console.log('✅ Usuários não-administradores filtrados:', nonAdminUsers);
        return nonAdminUsers;
        
      } catch (error) {
        console.error('❌ Erro ao buscar usuários ativos da tabela users:', error);
        return [];
      }
    },
    enabled: true, // Sempre habilitado, não depende da carteira
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Atualizar carteira de avaliação quando a carteira de upload for selecionada
  React.useEffect(() => {
    if (selectedCarteira && carteiras.length > 0) {
      const carteira = carteiras.find((c: any) => c.nome === selectedCarteira);
      if (carteira) {
        setSelectedCarteiraAvaliacao(carteira.id);
      }
    }
    // Não limpar mais o agente, pois os agentes não dependem da carteira
  }, [selectedCarteira, carteiras, setSelectedCarteiraAvaliacao]);

  // Converter carteiras para o formato do Combobox
  const carteiraOptions = carteiras.map((carteira: any) => ({
    value: carteira.nome,
    label: carteira.nome
  }));

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    // Verificar se uma carteira foi selecionada
    if (!selectedCarteira) {
      toast.error('Por favor, selecione uma carteira antes de fazer upload');
      return;
    }

    // Verificar se um usuário foi selecionado
    if (!selectedAgent) {
      toast.error('Por favor, selecione um usuário antes de fazer upload');
      return;
    }

    // Verificar se já existe um arquivo
    if (uploadedFile) {
      toast.error('Remova o arquivo atual antes de enviar outro');
      return;
    }

    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3') || 
      file.name.toLowerCase().endsWith('.wav') || file.name.toLowerCase().endsWith('.m4a')
    );

    if (audioFiles.length === 0) {
      toast.error('Nenhum arquivo de áudio válido selecionado');
      return;
    }

    // Pegar apenas o primeiro arquivo
    const file = audioFiles[0];
    const newFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading'
    };

    setUploadedFile(newFile);
    try {
      console.log('[UPLOAD] Arquivo selecionado:', file.name, 'bytes:', file.size);
      void uploadSelectedFile(files[0], newFile);
    } catch (e:any) {
      console.error('[UPLOAD] Falha ao iniciar upload:', e);
      toast.error('Falha ao iniciar upload: ' + (e?.message || 'erro'));
    }
  };

  // Real upload to backend via /uploads/audio and start polling
  const uploadSelectedFile = async (fileObj: File, uiFile: UploadedFile) => {
    try {
      setIsUploading(true);
      setUploadStatus(null);
      setUploadFileId(null);
      setUploadAvaliacaoId(null);
      setUploadCallId(null);

      const formData = new FormData();
      formData.append('file', fileObj);
      formData.append('agent_id', selectedAgent);
      formData.append('carteira_id', String(selectedCarteiraAvaliacao || ''));

      const token = localStorage.getItem('auth_token');
      const res = await axios.post('/api/uploads/audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = res.data as any;
      if (data?.status === 'duplicate' && data?.avaliacao_id) {
        setUploadStatus('duplicate');
        setUploadCallId(data.call_id || null);
        setUploadAvaliacaoId(data.avaliacao_id);
        setUploadedFile(prev => prev ? { ...prev, progress: 100, status: 'success' } : prev);
        toast.success('Áudio já processado. Reutilizando avaliação existente.');
        return;
      }

      if (!data?.file_id) {
        throw new Error('Resposta inválida do servidor (sem file_id)');
      }

      setUploadFileId(data.file_id);
      setUploadCallId(data.call_id || null);
      setUploadStatus(data.status || 'pending');
      setUploadedFile(prev => prev ? { ...prev, progress: 100, status: 'success' } : prev);
      toast.success('Upload iniciado. Processando áudio...');

      startPollingStatus(data.file_id);
    } catch (err: any) {
      console.error('❌ Erro no upload:', err);
      setUploadStatus('error');
      setUploadedFile(prev => prev ? { ...prev, status: 'error', error: err?.response?.data?.detail || err.message } : prev);
      toast.error('Erro ao enviar: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const startPollingStatus = (fileId: number) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await axios.get(`/api/uploads/${fileId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = res.data as any;
        setUploadStatus(data?.status || null);
        if (data?.call_id) setUploadCallId(data.call_id);
        if (data?.avaliacao_id) {
          setUploadAvaliacaoId(data.avaliacao_id);
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          toast.success(`Processamento concluído. Avaliação #${data.avaliacao_id}`);
        }
        if (data?.status === 'failed') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          toast.error('Falha no processamento: ' + (data?.error_msg || 'Erro desconhecido'));
        }
      } catch (e: any) {
        console.warn('⚠️ Erro ao consultar status do upload:', e?.message);
      }
    }, 2500);
  };



  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Remove file
  const removeFile = () => {
    setUploadedFile(null);
    setTranscription(null);
    limparResultado();
  };

  // Clear carteira selection
  const clearCarteira = () => {
    setSelectedCarteira('');
    setSelectedAgent('');
    setUploadedFile(null);
    setTranscription(null);
    limparResultado();
  };

  // Transcrever arquivo
  const handleTranscribe = async () => {
    if (!uploadedFile) {
      toast.error('Nenhum arquivo para transcrever');
      return;
    }
    
    setIsTranscribing(true);
    setTranscription(null);
    
    try {
      const input = fileInputRef.current;
      if (!input || !input.files || input.files.length === 0) {
        toast.error('Arquivo de áudio não encontrado');
        return;
      }
      
      const file = input.files[0];
      console.log('🎙️ Iniciando transcrição...');
      
      const formData = new FormData();
      formData.append('arquivo', file);
      
      const token = localStorage.getItem('auth_token');
      const res = await axios.post('/api/transcricao/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      console.log('✅ Transcrição concluída:', res.data);
      const responseData = res.data as any;
      setTranscription(responseData.transcricao);
      toast.success('Transcrição concluída com sucesso!');
      
    } catch (err: any) {
      console.error('❌ Erro na transcrição:', err);
      toast.error('Erro ao transcrever: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setIsTranscribing(false);
    }
  };

  // Avaliar com IA
  const handleEvaluate = async () => {
    if (!transcription || !selectedCarteira) {
      toast.error('Transcrição ou carteira não disponível');
      return;
    }
    
    try {
      const carteira = carteiras.find((c: any) => c.nome === selectedCarteira);
      if (carteira) {
        console.log('🤖 Iniciando avaliação automática...');
        const transcricaoTexto = transcription.text || JSON.stringify(transcription);
        await avaliarTranscricao(transcricaoTexto, carteira.id);
        toast.success('Avaliação iniciada!');
      }
    } catch (err: any) {
      console.error('❌ Erro na avaliação:', err);
      toast.error('Erro ao iniciar avaliação: ' + err.message);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Upload de Áudios" 
        subtitle="Envie um arquivo de áudio para transcrição e avaliação com IA"
        actions={
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={clearCarteira}
              disabled={isUploading || isTranscribing || isAvaliando}
              className="border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <X className="w-4 h-4 mr-2" />
              Limpar Tudo
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !selectedCarteira || !selectedAgent || !!uploadedFile}
              className="bg-slate-600 hover:bg-slate-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivo
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 via-white to-slate-50 min-h-screen">
        {/* Carteira Selection */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
              <div className="p-2 bg-slate-100 rounded-lg">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
              </div>
              Seleção de Carteira
            </CardTitle>
            <CardDescription className="text-gray-600">
              Escolha a carteira de destino para o arquivo de áudio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Seleção de Carteira */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carteira *
                </label>
                <Combobox
                  options={carteiraOptions}
                  value={selectedCarteira}
                  onChange={(value) => setSelectedCarteira(value)}
                  placeholder="Selecionar carteira"
                  emptyMessage="Nenhuma carteira encontrada"
                />
                {selectedCarteira && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-200 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-600">Carteira Selecionada</p>
                        <p className="text-sm font-semibold text-slate-800">{selectedCarteira}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Seleção de Usuário/Agente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agente *
                </label>
                <div className="relative">
                  <Combobox
                    options={agents.map((agent: any) => {
                      const option = {
                        value: agent.id.toString(),
                        label: agent.full_name || agent.username || `Usuário ${agent.id}`
                      };
                      console.log('🔍 Opção criada:', option);
                      return option;
                    })}
                    value={selectedAgent}
                    onChange={(value) => {
                      console.log('🎯 Agente selecionado:', value);
                      setSelectedAgent(value);
                    }}
                    placeholder={agentsLoading ? "Carregando usuários..." : !selectedCarteira ? "Selecione uma carteira primeiro" : "Selecionar usuário"}
                    emptyMessage={agentsError ? "Erro ao carregar usuários" : "Nenhum usuário encontrado"}
                  />
                </div>

                {/* Mostrar erro se houver */}
                {agentsError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-red-100 rounded-lg">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-red-700">
                          Erro ao carregar usuários
                        </p>
                        <p className="text-xs text-red-600">
                          {agentsError.message || 'Erro desconhecido'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mostrar loading se estiver carregando */}
                {agentsLoading && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-200 rounded-lg">
                        <Loader2 className="w-3 h-3 animate-spin text-gray-600" />
                      </div>
                      <p className="text-xs font-medium text-gray-700">
                        Carregando usuários...
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedAgent && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-200 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">
                          Usuário Selecionado
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {(() => {
                            const selectedUser = agents.find((a: any) => a.id.toString() === selectedAgent);
                            if (selectedUser) {
                              return selectedUser.full_name || selectedUser.username || `Usuário ${selectedAgent}`;
                            }
                            return `Usuário ${selectedAgent}`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area - Só aparece se não há arquivo */}
        {!uploadedFile && (
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                Upload de Arquivo
              </CardTitle>
              <CardDescription className="text-gray-600">
                {selectedCarteira && selectedAgent
                  ? 'Arraste e solte um arquivo de áudio aqui ou clique para selecionar'
                  : !selectedCarteira
                    ? 'Selecione uma carteira primeiro para fazer upload'
                    : 'Selecione um usuário para fazer upload'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 ${
                  !selectedCarteira || !selectedAgent
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                    : isDragging 
                      ? 'border-slate-400 bg-slate-100 shadow-sm' 
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => selectedCarteira && selectedAgent && fileInputRef.current?.click()}
              >
                <div className={`w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                  !selectedCarteira || !selectedAgent
                    ? 'bg-gray-200 text-gray-400' 
                    : isDragging 
                      ? 'bg-slate-300 text-slate-600' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                  <Music className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {!selectedCarteira 
                    ? 'Selecione uma carteira primeiro'
                    : !selectedAgent
                      ? 'Selecione um usuário para fazer upload'
                      : isDragging 
                        ? 'Solte o arquivo aqui' 
                        : 'Clique ou arraste um arquivo aqui'
                  }
                </p>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  {selectedCarteira && selectedAgent
                    ? 'Formatos aceitos: MP3, WAV, M4A'
                    : !selectedCarteira
                      ? 'Você precisa selecionar uma carteira antes de fazer upload'
                      : 'Usuários ativos (não-administradores) são carregados da tabela users'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Arquivo Enviado */}
        {uploadedFile && (
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Arquivo Enviado
              </CardTitle>
              <CardDescription className="text-gray-600">
                Arquivo pronto para transcrição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-5 border border-slate-200 rounded-lg bg-slate-50">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-slate-200 rounded-lg">
                    <FileAudio className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 truncate">
                      {uploadedFile.name}
                    </p>
                    <p className="text-sm text-slate-600 font-medium">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  {uploadedFile.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                  {uploadedFile.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {uploadedFile.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}

                  {/* Progress Bar */}
                  <div className="w-24">
                    <Progress value={uploadedFile.progress} className="h-2" />
                  </div>

                  {/* Status Badge */}
                  <Badge 
                    variant={
                      uploadedFile.status === 'success' ? 'default' :
                      uploadedFile.status === 'error' ? 'destructive' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {uploadedFile.status === 'uploading' ? 'Enviando' :
                     uploadedFile.status === 'success' ? 'Concluído' : 'Erro'}
                  </Badge>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    disabled={uploadedFile.status === 'uploading'}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Botão removido - upload é automático após seleção do arquivo */}

              {/* Status do processamento server-side */}
              {(uploadStatus || uploadCallId || uploadAvaliacaoId) && (
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  {uploadCallId && (
                    <div>call_id: <span className="font-mono">{uploadCallId}</span></div>
                  )}
                  {uploadStatus && (
                    <div>status: <span className="font-semibold">{uploadStatus}</span></div>
                  )}
                  {uploadAvaliacaoId && (
                    <div>avaliacao_id: <span className="font-semibold">{uploadAvaliacaoId}</span></div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Área de Carregamento */}
        {isTranscribing && (
          <Card className="bg-gradient-to-r from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                <div className="p-3 bg-blue-200 rounded-full">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-700" />
                </div>
                <div>
                  <p className="text-base font-semibold text-blue-800">Transcrevendo arquivo...</p>
                  <p className="text-sm text-blue-600">Isso pode levar alguns segundos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transcrição */}
        {transcription && (
          <Card className="bg-gradient-to-r from-white to-indigo-50 rounded-2xl shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-2xl">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-white">
                <div className="p-2 bg-white/20 rounded-lg">
                  📝
                </div>
                Transcrição
              </CardTitle>
              <CardDescription className="text-indigo-100 text-base">
                Transcrição do arquivo de áudio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScribeDiarizedTranscription
                transcription={transcription}
                isLoading={false}
                showTimestamps={true}
                showSpeakerStats={true}
              />
              
              {/* Botão Avaliar com IA */}
              <div className="mt-4">
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
                  onClick={handleEvaluate}
                  disabled={isAvaliando}
                  size="lg"
                >
                  {isAvaliando ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Avaliando com IA...
                    </>
                  ) : (
                    <>
                      <div className="mr-3 p-1 bg-white/20 rounded-lg">
                        🤖
                      </div>
                      Avaliar com IA
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status da Avaliação */}
        {isAvaliando && (
          <Card className="bg-gradient-to-r from-white to-purple-50 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-sm">
                <div className="p-3 bg-purple-200 rounded-full">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-700" />
                </div>
                <div>
                  <p className="text-base font-semibold text-purple-800">Avaliando transcrição com IA...</p>
                  <p className="text-sm text-purple-600">Isso pode levar alguns segundos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados da Avaliação */}
        {avaliacaoResult && (
          <Card className="bg-gradient-to-r from-white to-emerald-50 rounded-2xl shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-2xl">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-white">
                <div className="p-2 bg-white/20 rounded-lg">
                  🎯
                </div>
                Resultados da Avaliação
              </CardTitle>
              <CardDescription className="text-emerald-100 text-base">
                Avaliação realizada automaticamente com IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvaliacaoResultados
                avaliacao={avaliacaoResult}
                isLoading={isAvaliando}
              />
              
              {/* Botão para limpar resultado */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={limparResultado}
                  disabled={isAvaliando}
                  size="sm"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar Resultado
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Erro de Avaliação */}
        {avaliacaoError && (
          <Card className="bg-gradient-to-r from-white to-red-50 rounded-2xl shadow-lg border border-red-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="p-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-200 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-700" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-red-800">Erro na Avaliação</p>
                    <p className="text-sm text-red-700">
                      {avaliacaoError?.message || 'Erro desconhecido na avaliação automática'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default AudioUpload; 