import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { formatItemName } from '../lib/format';
import { AvaliacaoAutomaticaResponse } from '../lib/api';
import { CheckCircle, XCircle, AlertCircle, Edit3, Save } from 'lucide-react';

interface AvaliacaoResultadosProps {
  avaliacao: AvaliacaoAutomaticaResponse | null;
  onEdit?: () => void;
  onSave?: () => void;
  isLoading?: boolean;
}

const AvaliacaoResultados: React.FC<AvaliacaoResultadosProps> = ({
  avaliacao,
  onEdit,
  onSave,
  isLoading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!avaliacao) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-500" />
            Resultados da Avaliação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Nenhuma avaliação disponível. Faça o upload de um áudio e selecione uma carteira para avaliar.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFORME':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'NAO CONFORME':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'NAO SE APLICA':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFORME':
        return <CheckCircle className="h-4 w-4" />;
      case 'NAO CONFORME':
        return <XCircle className="h-4 w-4" />;
      case 'NAO SE APLICA':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isAprovada = avaliacao.pontuacao_percentual >= 70;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Resultados da Avaliação Automática
          </CardTitle>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(!isEditing);
                  onEdit();
                }}
                disabled={isLoading}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
            )}
            {onSave && isEditing && (
              <Button
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  onSave();
                }}
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pontuação Geral */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pontuação Geral</h3>
            <Badge 
              variant={isAprovada ? "default" : "destructive"}
              className={isAprovada ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
            >
              {isAprovada ? 'APROVADA' : 'REPROVADA'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span className="font-medium">{avaliacao.pontuacao_percentual.toFixed(1)}%</span>
            </div>
            <Progress 
              value={avaliacao.pontuacao_percentual} 
              className="h-3"
              style={{
                '--progress-background': isAprovada ? '#22c55e' : '#ef4444'
              } as React.CSSProperties}
            />
            <div className="text-xs text-gray-500">
              Limite para aprovação: 70%
            </div>
          </div>
        </div>

        {/* Detalhes da Avaliação */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Detalhes da Avaliação</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">ID da Chamada:</span>
              <span className="ml-2">{avaliacao.id_chamada}</span>
            </div>
            <div>
              <span className="font-medium">Falha Crítica:</span>
              <span className="ml-2">
                {avaliacao.falha_critica ? (
                  <Badge variant="destructive" className="text-xs">SIM</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">NÃO</Badge>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Erro de Processamento */}
        {avaliacao.erro_processamento && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Erro de Processamento</h4>
            <p className="text-red-700 text-sm">{avaliacao.erro_processamento}</p>
          </div>
        )}

        {/* Itens Avaliados */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Critérios Avaliados</h3>
          <div className="space-y-4">
            {avaliacao.itens.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.criterio_nome}</div>
                  {item.observacao && (
                    <div className="text-xs text-gray-600 mt-1">
                      {item.observacao}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={`text-xs ${getStatusColor(item.status)}`}
                  >
                    <span className="mr-1">{getStatusIcon(item.status)}</span>
                    {item.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Peso: {item.peso.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvaliacaoResultados; 