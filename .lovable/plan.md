

## Plano de correção — 2 arquivos, 3 blocos

Confirmo: **nenhum outro arquivo será alterado**. Apenas `AuthPage.tsx` e `RotinaPage.tsx`.

---

### 1. `src/pages/onboarding/AuthPage.tsx` — linhas 307-319

**Before:**
```typescript
async function handleGoogle() {
  const { lovable } = await import('@/integrations/lovable/index');
  await lovable.auth.signInWithOAuth('google', {
    redirect_uri: `${window.location.origin}/onboarding`
  });
}

async function handleApple() {
  const { lovable } = await import('@/integrations/lovable/index');
  await lovable.auth.signInWithOAuth('apple', {
    redirect_uri: `${window.location.origin}/onboarding`
  });
}
```

**After:**
```typescript
async function handleGoogle() {
  try {
    const { lovable } = await import('@/integrations/lovable/index');
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: `${window.location.origin}/onboarding`
    });
    if (result.error) {
      setError('Não foi possível entrar com Google. Tente novamente.');
      return;
    }
    if (result.redirected) return;
    navigate('/onboarding');
  } catch {
    setError('Erro ao conectar com Google. Tente novamente.');
  }
}

async function handleApple() {
  try {
    const { lovable } = await import('@/integrations/lovable/index');
    const result = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: `${window.location.origin}/onboarding`
    });
    if (result.error) {
      setError('Não foi possível entrar com Apple. Tente novamente.');
      return;
    }
    if (result.redirected) return;
    navigate('/onboarding');
  } catch {
    setError('Erro ao conectar com Apple. Tente novamente.');
  }
}
```

**O que muda:** adiciona `try/catch`, verifica `result.error` (mostra feedback no mesmo `error` state que já existe na tela), verifica `result.redirected` (se `true`, retorna e deixa o browser redirecionar), e se nem erro nem redirect, navega para `/onboarding` (mesmo destino que já estava no `redirect_uri`).

---

### 2. `src/pages/RotinaPage.tsx` — linha 666

**Before:**
```typescript
onToggle={(v) => setPeriod(v)}
```

**After:**
```typescript
onToggle={(v) => setPeriod(v as 'today' | 'week' | 'month')}
```

**O que muda:** cast do `string` genérico retornado por `ChipGroup.onToggle` para o union type esperado por `setPeriod`.

---

### Resumo

| Arquivo | Linhas | Mudança |
|---|---|---|
| `AuthPage.tsx` | 307-319 | try/catch + result.error + result.redirected nos dois handlers sociais |
| `RotinaPage.tsx` | 666 | cast `as 'today' \| 'week' \| 'month'` |

Nenhum outro arquivo, rota, hook, provider, edge function, schema ou componente será tocado.

