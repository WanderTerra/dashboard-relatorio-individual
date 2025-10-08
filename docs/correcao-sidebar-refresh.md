# Correção: Sidebar Desaparecendo no Refresh (F5)

## Problema
Ao dar refresh (F5) na página, os botões do menu lateral (Sidebar) desapareciam temporariamente.

## Causa Raiz
O problema estava na sequência de carregamento dos componentes:

1. **AppRouter** renderizava o **Sidebar** imediatamente
2. **Sidebar** usava `useAuth()` para determinar os links do menu
3. Durante o refresh, `user` estava `null` temporariamente enquanto `isLoading` era `true`
4. Isso fazia com que os `links` ficassem vazios (`[]`), escondendo os botões
5. Quando `isLoading` se tornava `false` e `user` era carregado, os botões reapareciam

## Solução Implementada

### 1. AppRouter.tsx
- Adicionado `useAuth()` para acessar o estado `isLoading`
- Implementado loading screen enquanto `isLoading` é `true`
- Sidebar só é renderizado após a autenticação ser verificada

```typescript
const { isLoading } = useAuth();

// ✅ Mostrar loading enquanto verifica autenticação
if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}
```

### 2. Sidebar.tsx
- Adicionado `isLoading` do `useAuth()`
- Modificado a lógica de `links` para aguardar o carregamento do usuário

```typescript
const { user, logout, isLoading } = useAuth();

// Links conforme perfil - aguardar carregamento do usuário
const links = isLoading 
  ? [] // Mostrar vazio enquanto carrega
  : isAdmin
  ? adminLinks
  : agentId
  ? agentLinks(agentId)
  : [];
```

## Resultado
- ✅ Não há mais flicker dos botões do menu
- ✅ Loading screen consistente durante refresh
- ✅ Sidebar aparece corretamente após carregamento da autenticação
- ✅ Experiência de usuário mais fluida

## Arquivos Modificados
- `src/AppRouter.tsx`
- `src/components/Sidebar.tsx`
