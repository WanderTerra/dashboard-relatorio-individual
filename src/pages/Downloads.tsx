import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  createDownloadJob, 
  listDownloadJobs, 
  cancelDownloadJob,
  type DownloadJobCreate,
  type DownloadJob 
} from '../lib/api';
import { getAllCarteiras } from '../lib/api';
import { useToast } from '../hooks/use-toast';

const Downloads: React.FC = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [carteiras, setCarteiras] = useState<Array<{id: number, nome: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DownloadJobCreate>({
    carteira_id: 0,
    fila_like: '',
    data_inicio: new Date().toISOString().slice(0, 16),
    data_fim: new Date().toISOString().slice(0, 16),
    min_secs: 60,
    limite: undefined,
    delete_after_process: true
  });

  // Carregar carteiras e jobs ao montar o componente
  useEffect(() => {
    loadCarteiras();
    loadJobs();
  }, []);

  const loadCarteiras = async () => {
    try {
      const carteirasData = await getAllCarteiras();
      setCarteiras(carteirasData);
    } catch (error) {
      console.error('Erro ao carregar carteiras:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const jobsData = await listDownloadJobs();
      setJobs(jobsData);
    } catch (error) {
      console.error('Erro ao carregar jobs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.carteira_id || !formData.fila_like) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await createDownloadJob(formData);
      toast({
        title: "Sucesso",
        description: "Job de download criado com sucesso!"
      });
      
      // Resetar formulário
      setFormData({
        carteira_id: 0,
        fila_like: '',
        data_inicio: new Date().toISOString().slice(0, 16),
        data_fim: new Date().toISOString().slice(0, 16),
        min_secs: 60,
        limite: undefined,
        delete_after_process: true
      });
      
      // Recarregar jobs
      loadJobs();
    } catch (error) {
      console.error('Erro ao criar job:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar job de download",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (jobId: number) => {
    try {
      await cancelDownloadJob(jobId);
      toast({
        title: "Sucesso",
        description: "Job cancelado com sucesso!"
      });
      loadJobs();
    } catch (error) {
      console.error('Erro ao cancelar job:', error);
      toast({
        title: "Erro",
        description: "Falha ao cancelar job",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'pending': 'secondary',
      'running': 'default',
      'done': 'outline',
      'error': 'destructive',
      'canceled': 'outline'
    };
    
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Downloads de Áudios</h1>
        <p className="text-gray-600 mt-2">
          Baixe e processe áudios das carteiras automaticamente
        </p>
      </div>

      {/* Formulário para criar novo job */}
      <Card>
        <CardHeader>
          <CardTitle>Novo Job de Download</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="carteira">Carteira *</Label>
                <Select 
                  value={formData.carteira_id.toString()} 
                  onValueChange={(value) => setFormData({...formData, carteira_id: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma carteira" />
                  </SelectTrigger>
                  <SelectContent>
                    {carteiras.map((carteira) => (
                      <SelectItem key={carteira.id} value={carteira.id.toString()}>
                        {carteira.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fila_like">Fila (LIKE) *</Label>
                <Input
                  id="fila_like"
                  placeholder="Ex: %aguas%, %vuon%"
                  value={formData.fila_like}
                  onChange={(e) => setFormData({...formData, fila_like: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="data_inicio">Data/Hora Início *</Label>
                <Input
                  id="data_inicio"
                  type="datetime-local"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="data_fim">Data/Hora Fim *</Label>
                <Input
                  id="data_fim"
                  type="datetime-local"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({...formData, data_fim: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="min_secs">Duração Mínima (segundos)</Label>
                <Input
                  id="min_secs"
                  type="number"
                  value={formData.min_secs}
                  onChange={(e) => setFormData({...formData, min_secs: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="limite">Limite de Áudios (opcional)</Label>
                <Input
                  id="limite"
                  type="number"
                  placeholder="Sem limite"
                  value={formData.limite || ''}
                  onChange={(e) => setFormData({...formData, limite: e.target.value ? parseInt(e.target.value) : undefined})}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? 'Criando...' : 'Criar Job de Download'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de jobs existentes */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs de Download</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum job encontrado</p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold">Job #{job.id}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Criado em: {new Date(job.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Carteira:</span> {carteiras.find(c => c.id === job.carteira_id)?.nome || job.carteira_id}
                    </div>
                    <div>
                      <span className="font-medium">Fila:</span> {job.fila_like}
                    </div>
                    <div>
                      <span className="font-medium">Período:</span> {new Date(job.data_inicio).toLocaleDateString()} - {new Date(job.data_fim).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Progresso:</span> {job.total_processados}/{job.total_calls}
                    </div>
                  </div>

                  {job.status === 'running' && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-blue-700">Processando...</span>
                      </div>
                    </div>
                  )}

                  {job.error_msg && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-red-700 text-sm">Erro: {job.error_msg}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {job.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelJob(job.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Downloads;
