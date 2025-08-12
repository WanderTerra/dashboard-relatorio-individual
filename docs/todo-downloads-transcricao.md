## Plano de Implementação — Downloads de Áudios, Transcrição e Avaliação

Status: [ ] Não iniciado  [~] Em andamento  [x] Concluído

### Escopo
- Baixar áudios por carteira e período (fonte Vonix), um a um
- Transcrever via ElevenLabs reutilizando o fluxo já existente (classificação + correções)
- Persistir progresso, arquivos, resultados e permitir reprocesso/cancelamento
- **Política de retenção: exclusão imediata dos arquivos de áudio após processamento (sucesso ou falha), mantendo apenas metadados**

### Base de dados (existente — confirmado)
- [x] `vonix.calls` (fonte externa — fornece `call_id`, `queue_id`, `start_time`, `agent_id`, `call_secs` etc.)
- [x] `vonix.avaliacoes` (id, call_id, agent_id, data_ligacao, carteira...)
- [x] `vonix.transcricoes` (id, avaliacao_id, conteudo, criado_em)
- [x] `vonix.transcricao_segmentos` (id, transcricao_id, idx, speaker, tempos, texto)
- [x] `vonix.itens_avaliados` (id, avaliacao_id, ...)

### Novas tabelas (aplicação)
- [x] `audio_download_jobs`
  - Campos: `id`, `carteira_id`, `fila_like`, `data_inicio`, `data_fim`, `min_secs`, `limite`, `status`(pending|running|done|error|canceled), `total_calls`, `total_baixados`, `total_processados`, `error_msg`, `created_at`, `finished_at`
- [x] `audio_files`
  - Campos: `id`, `job_id`(FK), `carteira_id`, `call_id`, `queue_id`, `start_time`, `answer_time`, `hangup_time`, `call_secs`, `filename`, `filepath`, `downloaded_at`, `status`(downloaded|transcribing|transcribed|failed|deleted), `transcricao_id`(FK opcional), `error_msg`, `created_at`

### Backend ✅ 100% CONCLUÍDO
- [x] Variáveis de ambiente (.env)
- [x] Dependências e setup
- [x] Router `downloads` (FastAPI)
- [x] Worker/serviço de execução (sequencial, com retry)
- [x] Integração com transcrição existente
- [x] Integração no main.py

### Frontend 🚀 PRÓXIMO PASSO
- [x] Nova rota protegida: `/downloads` (admin)
- [x] Página "Baixar áudios"
  - [x] Formulário: `carteira` (select), `fila_like`, `data_inicio`, `data_fim`, `min_secs`(60), `limite`(opcional), botão "Iniciar job"
  - [x] Cards/resumo do job atual (status, progresso, totais, erros)
  - [x] Tabela de jobs (id, carteira, período, min_secs, status, progresso, criado_em, finalizado_em, ações)
  - [x] Detalhes do job (drawer/modal): lista de arquivos (filename, call_id, queue_id, start_time, call_secs, status, ações: reprocessar, abrir transcrição)
  - [x] Polling de status a cada 5s quando `running`
- [ ] API client (`src/lib/api.ts`)
  - [ ] `createDownloadJob(payload)`
  - [ ] `listDownloadJobs(params?)`
  - [ ] `getDownloadJob(jobId)`
  - [ ] `cancelDownloadJob(jobId)`
  - [ ] `listDownloadedFiles(params)`
  - [ ] `reprocessFile(fileId)`
- [ ] UX
  - [ ] Toasts sucesso/erro; desabilitar botões durante execução; exibir `AUDIO_BASE_DIR`

### Definition of Done
- [ ] Job inicia com filtros e executa: busca, download serial, transcrição, atualização de progresso e exclusão imediata do arquivo físico
- [ ] Página mostra status em tempo real; permite cancelar e reprocessar item
- [ ] Correções aplicadas automaticamente às transcrições
- [ ] Logs claros e erros tratados sem travar o serviço

### Nota técnica — estratégia de download
- Recomendação atual: manter Playwright.
  - Vantagens: já validado; respeita autenticação/fluxo real do site; simples de integrar.
  - Cuidados: UI pode mudar; manter Chromium instalado; atenção a captcha/2FA.
- Alternativa (preferível se disponível): API oficial de gravações da Vonix.
  - Vantagens: robustez, menor atrito operacional, fácil paralelizar.
  - Dependências: documentação/acesso; tokens/escopo.
- Boas práticas com Playwright
  - Executar headless quando possível, reutilizar sessão (`storage_state`), relogar ao detectar 401
  - Retry com backoff; validar tamanho do arquivo > 0; sanitizar nomes
  - Serializar o processamento (1 a 1) para alinhar com o fluxo atual de upload

### Roadmap sugerido
1. Tabelas novas + variáveis de ambiente + dependências
2. Função `transcrever_arquivo_local` extraída e validada
3. Router `downloads` + worker sequencial (download → transcrição)
4. Página `/downloads` com start de job e status em tempo real
5. Reprocesso de arquivo e cancelamento de job

