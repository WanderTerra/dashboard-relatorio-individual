import React, { useState } from 'react';
import { Clock, User, UserCheck, Volume2, Download, AlertCircle } from 'lucide-react';

interface DiarizedWord {
  text: string;
  start: number;
  end: number;
  type: 'word' | 'spacing' | 'punctuation';
  speaker_id: string;
  speaker_role?: 'agente' | 'cliente' | 'unknown';
}

interface ScribeTranscription {
  text: string;
  words: DiarizedWord[];
  speaker_classifications: Record<string, string>;
  role_summary: {
    agente_text: string;
    cliente_text: string;
    unknown_text: string;
  };
  accuracy_info?: {
    model: string;
    accuracy: string;
    diarization: string;
  };
}

interface ScribeDiarizedTranscriptionProps {
  transcription: ScribeTranscription;
  isLoading?: boolean;
  error?: string;
  onPlaySegment?: (startTime: number, endTime: number) => void;
  showTimestamps?: boolean;
  showSpeakerStats?: boolean;
}

export const ScribeDiarizedTranscription: React.FC<ScribeDiarizedTranscriptionProps> = ({
  transcription,
  isLoading = false,
  error,
  onPlaySegment,
  showTimestamps = true,
  showSpeakerStats = true
}) => {
  const [viewMode, setViewMode] = useState<'transcript' | 'roles' | 'timeline'>('transcript');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Processando transcrição com Scribe...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 font-medium">Erro na transcrição</span>
        </div>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (!transcription || !transcription.words) {
    return (
      <div className="text-center p-8 text-gray-500">
        Nenhuma transcrição disponível
      </div>
    );
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeakerIcon = (role: string) => {
    switch (role) {
      case 'agente':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'cliente':
        return <User className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSpeakerColor = (role: string) => {
    switch (role) {
      case 'agente':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'cliente':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const groupWordsBySpeaker = () => {
    const segments = [];
    let currentSegment = null;

    for (const word of transcription.words) {
      if (word.type !== 'word') continue;

      if (!currentSegment || currentSegment.speaker_id !== word.speaker_id) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = {
          speaker_id: word.speaker_id,
          speaker_role: word.speaker_role || 'unknown',
          start: word.start,
          end: word.end,
          words: [word]
        };
      } else {
        currentSegment.words.push(word);
        currentSegment.end = word.end;
      }
    }

    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  };

  const speakerSegments = groupWordsBySpeaker();
  const speakerStats = Object.entries(transcription.speaker_classifications).map(([id, role]) => {
    const wordCount = transcription.words.filter(w => w.speaker_id === id && w.type === 'word').length;
    return { id, role, wordCount };
  });

  const renderTranscriptView = () => (
    <div className="space-y-4">
      {speakerSegments.map((segment, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border-l-4 ${getSpeakerColor(segment.speaker_role)} 
            ${selectedSpeaker === segment.speaker_id ? 'ring-2 ring-blue-300' : ''}`}
          onClick={() => setSelectedSpeaker(
            selectedSpeaker === segment.speaker_id ? null : segment.speaker_id
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getSpeakerIcon(segment.speaker_role)}
              <span className="font-medium capitalize">
                {segment.speaker_role === 'agente' ? 'Agente' : 
                 segment.speaker_role === 'cliente' ? 'Cliente' : 
                 `Falante ${segment.speaker_id}`}
              </span>
              {showTimestamps && (
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(segment.start)} - {formatTime(segment.end)}
                </span>
              )}
            </div>
            
            {onPlaySegment && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlaySegment(segment.start, segment.end);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title="Reproduzir segmento"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <p className="text-sm leading-relaxed">
            {segment.words.map((word, idx) => {
              if (word.type === 'word') {
                // Para palavras, adiciona espaço antes (exceto primeira palavra)
                return (idx > 0 && !word.text.match(/^[,.!?;:]/) ? ' ' : '') + word.text;
              } else if (word.type === 'punctuation') {
                // Pontuação sem espaço antes
                return word.text;
              } else if (word.type === 'spacing') {
                // Espaçamento original
                return word.text;
              }
              return word.text;
            }).join('')}
          </p>
        </div>
      ))}
    </div>
  );

  const renderRolesView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <UserCheck className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-blue-800">Agente</h3>
        </div>
        <p className="text-sm text-blue-700 leading-relaxed">
          {transcription.role_summary.agente_text || 'Nenhuma fala do agente identificada'}
        </p>
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <User className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="font-medium text-green-800">Cliente</h3>
        </div>
        <p className="text-sm text-green-700 leading-relaxed">
          {transcription.role_summary.cliente_text || 'Nenhuma fala do cliente identificada'}
        </p>
      </div>
    </div>
  );

  const renderTimelineView = () => (
    <div className="space-y-2">
      {transcription.words
        .filter(word => word.type === 'word')
        .map((word, index) => (
          <div
            key={index}
            className={`flex items-center p-2 rounded text-sm ${getSpeakerColor(word.speaker_role || 'unknown')}`}
          >
            <span className="w-16 text-xs text-gray-500 mr-3">
              {formatTime(word.start)}
            </span>
            <div className="flex items-center mr-3">
              {getSpeakerIcon(word.speaker_role || 'unknown')}
            </div>
            <span>{word.text}</span>
          </div>
        ))}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Transcrição com Diarização Scribe
            </h3>
            {transcription.accuracy_info && (
              <p className="text-sm text-gray-600 mt-1">
                {transcription.accuracy_info.model} - {transcription.accuracy_info.accuracy}
              </p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('transcript')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'transcript' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Transcrição
            </button>
            <button
              onClick={() => setViewMode('roles')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'roles' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Por Papel
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'timeline' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>

        {/* Speaker Stats */}
        {showSpeakerStats && (
          <div className="mt-4 flex flex-wrap gap-2">
            {speakerStats.map(speaker => (
              <div
                key={speaker.id}
                className={`px-3 py-1 rounded-full text-xs ${getSpeakerColor(speaker.role)}`}
              >
                {speaker.role === 'agente' ? 'Agente' : 
                 speaker.role === 'cliente' ? 'Cliente' : 
                 `Falante ${speaker.id}`}: {speaker.wordCount} palavras
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'transcript' && renderTranscriptView()}
        {viewMode === 'roles' && renderRolesView()}
        {viewMode === 'timeline' && renderTimelineView()}
      </div>

      {/* Footer */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {transcription.words.filter(w => w.type === 'word').length} palavras • 
            {Object.keys(transcription.speaker_classifications).length} falantes identificados
          </span>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs">Powered by ElevenLabs Scribe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScribeDiarizedTranscription;