# Dashboard Relatório Individual

## Rodando o projeto na rede local

Para acessar o frontend de outras máquinas na rede local:

1. Rode o projeto com:
```bash
npm run dev
```

2. O Vite mostrará dois URLs:
- `Local: http://localhost:5173` (para acesso na sua máquina)
- `Network: http://192.168.x.x:5173` (para acesso de outras máquinas na rede)

3. Outras máquinas na rede podem acessar usando o endereço IP que aparece em "Network:"

> **Importante**: O backend também precisa estar rodando (na porta 8000) para o frontend funcionar corretamente.

## Identidade Visual

Este sistema segue a identidade visual da marca, utilizando:
- **Cor principal:** Navy Blue (rgb(25, 35, 57))
- **Cor secundária:** Gold (rgb(165, 137, 80))
- **Tipografia:** Fenice Std Regular (títulos) e Tw Cen MT (textos)

Consulte o arquivo BRAND_GUIDE.md para detalhes completos da marca.

## 🤖 Seu Guru - Sistema de Assistentes IA

O **Seu Guru** é uma interface interativa com assistentes especializados que oferece suporte personalizado em diferentes áreas:

### 🎯 Assistentes Disponíveis

- **🎯 Assistente de Atendimento** - Especialista em critérios de avaliação e performance
- **👥 Assistente de RH** - Informações sobre políticas e procedimentos da empresa
- **🧠 Assistente Psicológico** - Suporte para bem-estar e desenvolvimento pessoal

### ✨ Funcionalidades

- **Design alegre e colorido** com animações suaves
- **Cards interativos** que se transformam em ícones quando selecionados
- **Chat expandido** que ocupa toda a tela para melhor experiência
- **Transições animadas** entre estados
- **Respostas contextuais** baseadas no assistente selecionado
- **Sistema mock** para testar sem backend

### 🚀 Como Usar

1. Clique em **"Seu Guru"** no menu lateral
2. **Escolha um assistente** clicando no card colorido
3. **Observe a animação** - cards se reduzem a ícones na parte superior
4. **Chat se expande** automaticamente
5. **Converse normalmente** - o sistema identifica o contexto do assistente

### 💬 Sistema de Chat

- **Mensagens contextuais** baseadas no assistente selecionado
- **Loading states** com spinner animado
- **Histórico preservado** durante a sessão
- **Atalhos de teclado** (Enter para enviar)
- **API mock** para desenvolvimento e teste

## 🧠 Matriz P.O.R.T.E.S - Análise Inteligente

O sistema agora inclui uma **Matriz P.O.R.T.E.S** que fornece análise inteligente de desempenho baseada em IA:

### **P** - Pontos Fortes
- Top 3 critérios com nota 100 (excelência)
- Análise baseada em dados reais das avaliações

### **O** - Oportunidades  
- Top 3 critérios com nota abaixo de 50 (críticos)
- Identificação de áreas que precisam de atenção

### **R** - Riscos
- Agentes com notas vermelhas consecutivas
- Identificação de padrões sem evolução

### **T** - Talentos
- Top 3 melhores agentes da carteira
- Reconhecimento de excelência

### **E** - Evolução Necessária
- Pontos que precisam de mais atenção
- Identificação de necessidades de treinamento

### **S** - Sucesso Sustentável
- Plano para manter qualidade nos atendimentos
- Estratégias baseadas em análise temporal

> **Status**: Frontend implementado e funcionando. APIs do backend em desenvolvimento.
> Consulte `docs/implementacao-apis-portes.md` para detalhes técnicos.
