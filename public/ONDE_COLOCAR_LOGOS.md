# 📁 Onde adicionar as logos

## 🎯 Estrutura de arquivos para logos:

```
dashboard-relatorio-individual/
├── public/                     ← Assets estáticos (acessíveis via URL)
│   ├── favicon.ico            ← Favicon para aba do navegador (16x16px)
│   ├── logo.png               ← Logo principal (qualquer tamanho)
│   ├── logo-192.png           ← Logo para PWA/Android (192x192px)
│   └── logo-512.png           ← Logo para PWA/iOS (512x512px)
└── src/
    └── assets/                 ← Assets para importar nos componentes
        └── logo.png           ← Logo para usar dentro do React
```

## 📝 Formatos recomendados:

### Para favicon (aba do navegador):
- **favicon.ico**: 16x16px ou 32x32px
- **Formato**: ICO ou PNG
- **Local**: `public/favicon.ico`

### Para logos nas páginas:
- **Formato**: PNG, JPG ou SVG
- **Tamanho**: 200x50px (aprox) para header
- **Local**: `src/assets/logo.png` OU `public/logo.png`

### Para PWA (opcional):
- **logo-192.png**: 192x192px
- **logo-512.png**: 512x512px
- **Local**: `public/`

## 🔧 Depois de adicionar os arquivos:

1. **Coloque suas imagens** nos locais indicados acima
2. **Execute os próximos passos** que vou configurar automaticamente:
   - Favicon no HTML
   - Logo no Header
   - Título da página

## 📋 Checklist:

- [ ] Adicionar `favicon.ico` em `public/`
- [ ] Adicionar `logo.png` em `src/assets/` 
- [ ] (Opcional) Adicionar logos PWA em `public/`
- [ ] Executar configuração automática
