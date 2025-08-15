import * as React from 'react';
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, FileAudio, X, CheckCircle, AlertCircle, Loader2, Music } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Combobox } from '../components/ui/select-simple';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Atualizar carteira de avaliação quando a carteira de upload for selecionada
  React.useEffect(() => {
    if (selectedCarteira && carteiras.length > 0) {
      const carteira = carteiras.find((c: any) => c.nome === selectedCarteira);
      if (carteira) {
        setSelectedCarteiraAvaliacao(carteira.id);
      }
    }
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
    simulateUpload(newFile);
  };

  // Simulate upload process
  const simulateUpload = (file: UploadedFile) => {
    setIsUploading(true);
    
    const interval = setInterval(() => {
      setUploadedFile(prev => {
        if (!prev) return null;
        
        const newProgress = prev.progress + Math.random() * 20;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          toast.success('Arquivo enviado com sucesso!');
          return { ...prev, progress: 100, status: 'success' as const };
        }
        return { ...prev, progress: newProgress };
      });
    }, 200);

    // Simulate completion
    setTimeout(() => {
      setIsUploading(false);
    }, 3000);
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
              className="border-gray-300 hover:bg-gray-50"
            >
              Limpar Tudo
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !selectedCarteira || !!uploadedFile}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivo
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Carteira Selection */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              📁 Seleção de Carteira
            </CardTitle>
            <CardDescription className="text-gray-600">
              Escolha a carteira de destino para o arquivo de áudio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
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
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">
                      Carteira selecionada: <strong>{selectedCarteira}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload Area - Só aparece se não há arquivo */}
        {!uploadedFile && (
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                🎵 Upload de Arquivo
              </CardTitle>
              <CardDescription className="text-gray-600">
                {selectedCarteira 
                  ? 'Arraste e solte um arquivo de áudio aqui ou clique para selecionar'
                  : 'Selecione uma carteira primeiro para fazer upload'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  !selectedCarteira 
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                    : isDragging 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => selectedCarteira && fileInputRef.current?.click()}
              >
                <Music className={`w-12 h-12 mx-auto mb-4 ${!selectedCarteira ? 'text-gray-300' : 'text-gray-400'}`} />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {!selectedCarteira 
                    ? 'Selecione uma carteira primeiro'
                    : isDragging 
                      ? 'Solte o arquivo aqui' 
                      : 'Clique ou arraste um arquivo aqui'
                  }
                </p>
                <p className="text-sm text-gray-500">
                  {selectedCarteira 
                    ? 'Formatos: MP3, WAV, M4A'
                    : 'Você precisa selecionar uma carteira antes de fazer upload'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Arquivo Enviado */}
        {uploadedFile && (
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                📁 Arquivo Enviado
              </CardTitle>
              <CardDescription className="text-gray-600">
                Arquivo pronto para transcrição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3 flex-1">
                  <FileAudio className="w-5 h-5 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
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

              {/* Botão Transcrever */}
              {uploadedFile.status === 'success' && !transcription && (
                <div className="mt-4">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                    size="lg"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Transcrevendo...
                      </>
                    ) : (
                      <>
                        🎙️ Transcrever Arquivo
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Área de Carregamento */}
        {isTranscribing && (
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Transcrevendo arquivo...</p>
                  <p className="text-xs text-blue-600">Isso pode levar alguns segundos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transcrição */}
        {transcription && (
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                📝 Transcrição
              </CardTitle>
              <CardDescription className="text-gray-600">
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
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-base font-medium"
                  onClick={handleEvaluate}
                  disabled={isAvaliando}
                  size="lg"
                >
                  {isAvaliando ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Avaliando com IA...
                    </>
                  ) : (
                    <>
                      🤖 Avaliar com IA
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status da Avaliação */}
        {isAvaliando && (
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-800">Avaliando transcrição com IA...</p>
                  <p className="text-xs text-purple-600">Isso pode levar alguns segundos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados da Avaliação */}
        {avaliacaoResult && (
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                🎯 Resultados da Avaliação
              </CardTitle>
              <CardDescription className="text-gray-600">
                Avaliação realizada automaticamente com IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvaliacaoResultados
                avaliacao={avaliacaoResult}
                carteiraId={selectedCarteiraAvaliacao || undefined}
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
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
            <CardContent className="pt-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 text-sm">
                    Erro na avaliação automática: {avaliacaoError?.message || 'Erro desconhecido'}
                  </p>
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