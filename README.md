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
