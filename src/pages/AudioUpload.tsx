import * as React from 'react';
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, FileAudio, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Combobox } from '../components/ui/select-simple';
import { toast } from 'sonner';
import { getAllCarteiras } from '../lib/api';
import axios from 'axios';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const AudioUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCarteira, setSelectedCarteira] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para transcrição
  const [transcriptionText, setTranscriptionText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Buscar carteiras disponíveis
  const { data: carteiras = [] } = useQuery({
    queryKey: ['carteiras'],
    queryFn: getAllCarteiras,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

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

    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3') || 
      file.name.toLowerCase().endsWith('.wav') || file.name.toLowerCase().endsWith('.m4a')
    );

    if (audioFiles.length === 0) {
      toast.error('Nenhum arquivo de áudio válido selecionado');
      return;
    }

    const newFiles: UploadedFile[] = audioFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    simulateUpload(newFiles);
  };

  // Simulate upload process
  const simulateUpload = (files: UploadedFile[]) => {
    setIsUploading(true);
    
    files.forEach((file, index) => {
      const interval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => {
          if (f.id === file.id) {
            const newProgress = f.progress + Math.random() * 20;
            if (newProgress >= 100) {
              clearInterval(interval);
              return { ...f, progress: 100, status: 'success' as const };
            }
            return { ...f, progress: newProgress };
          }
          return f;
        }));
      }, 200 + index * 100);
    });

    // Simulate completion
    setTimeout(() => {
      setIsUploading(false);
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso para a carteira ${selectedCarteira}!`);
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
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Clear all files
  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  // Clear carteira selection
  const clearCarteira = () => {
    setSelectedCarteira('');
  };

  return (
    <div>
      <PageHeader 
        title="Upload de Áudios" 
        subtitle="Envie arquivos de áudio para análise e avaliação"
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={clearAllFiles}
              disabled={uploadedFiles.length === 0}
            >
              Limpar Arquivos
            </Button>
            <Button 
              variant="outline" 
              onClick={clearCarteira}
              disabled={!selectedCarteira}
            >
              Limpar Carteira
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !selectedCarteira}
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivos
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Carteira Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="w-5 h-5" />
              Seleção de Carteira
            </CardTitle>
            <CardDescription>
              Selecione a carteira para qual os áudios serão enviados
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
                <p className="text-sm text-green-600 mt-2">
                  ✓ Carteira selecionada: <strong>{selectedCarteira}</strong>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="w-5 h-5" />
              Área de Upload
            </CardTitle>
            <CardDescription>
              {selectedCarteira 
                ? `Arraste e solte arquivos de áudio aqui ou clique para selecionar (Carteira: ${selectedCarteira})`
                : 'Selecione uma carteira primeiro para fazer upload de arquivos'
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
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => selectedCarteira && fileInputRef.current?.click()}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${!selectedCarteira ? 'text-gray-300' : 'text-gray-400'}`} />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {!selectedCarteira 
                  ? 'Selecione uma carteira primeiro'
                  : isDragging 
                    ? 'Solte os arquivos aqui' 
                    : 'Clique ou arraste arquivos aqui'
                }
              </p>
              <p className="text-sm text-gray-500">
                {selectedCarteira 
                  ? 'Formatos suportados: MP3, WAV, M4A (máximo 50MB por arquivo)'
                  : 'Você precisa selecionar uma carteira antes de fazer upload'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Caixa de texto para teste de transcrição */}
        <div className="bg-white rounded-xl p-5 text-gray-800 whitespace-pre-wrap shadow-sm border border-gray-100 leading-relaxed">
          <label className="block text-sm font-medium text-gray-700 mb-2">Transcrição (teste local)</label>
          <textarea
            className="w-full min-h-[180px] border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-vertical shadow-sm mb-2"
            placeholder="Digite ou cole aqui a transcrição para teste..."
            value={transcriptionText}
            onChange={e => setTranscriptionText(e.target.value)}
            disabled={isTranscribing}
          />
          <Button
            className="mt-2"
            onClick={async () => {
              if (!uploadedFiles.length) {
                toast.error('Envie um arquivo de áudio primeiro!');
                return;
              }
              setIsTranscribing(true);
              setTranscriptionText('');
              try {
                // Procurar o input file para pegar o File real
                const input = fileInputRef.current;
                if (!input || !input.files || !input.files[0]) {
                  toast.error('Arquivo de áudio não encontrado.');
                  setIsTranscribing(false);
                  return;
                }
                const file = input.files[0];
                const formData = new FormData();
                formData.append('arquivo', file);
                const res = await axios.post('/transcricao/upload', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
                setTranscriptionText(res.data.transcricao.text || 'Sem texto retornado.');
              } catch (err: any) {
                toast.error('Erro ao transcrever: ' + (err?.response?.data?.detail || err.message));
              } finally {
                setIsTranscribing(false);
              }
            }}
            disabled={isTranscribing || !uploadedFiles.length}
          >
            {isTranscribing ? 'Transcrevendo...' : 'Fazer Transcrição'}
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.m4a"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Arquivos Enviados</CardTitle>
              <CardDescription>
                {uploadedFiles.length} arquivo(s) selecionado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileAudio className="w-5 h-5 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status Icon */}
                      {file.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                      {file.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}

                      {/* Progress Bar */}
                      <div className="w-24">
                        <Progress value={file.progress} className="h-2" />
                      </div>

                      {/* Status Badge */}
                      <Badge 
                        variant={
                          file.status === 'success' ? 'default' :
                          file.status === 'error' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {file.status === 'uploading' ? 'Enviando' :
                         file.status === 'success' ? 'Concluído' : 'Erro'}
                      </Badge>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        disabled={file.status === 'uploading'}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p><strong>Primeiro:</strong> Selecione a carteira para qual os áudios serão enviados</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Certifique-se de que os arquivos de áudio estão em boa qualidade</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Formatos suportados: MP3, WAV, M4A</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Tamanho máximo por arquivo: 50MB</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Os arquivos serão processados automaticamente após o upload</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AudioUpload; 