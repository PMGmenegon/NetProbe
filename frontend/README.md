# NetProbe Frontend

Dashboard React para configurar experimentos UDP, acompanhar pacotes e visualizar métricas de RTT, jitter e timeouts.

## Desenvolvimento

```bash
npm install
npm run dev
```

Sem configuração adicional, a interface executa uma demonstração local. Para usar o backend HTTP, crie um arquivo `.env.local`:

```bash
VITE_API_URL=http://localhost:8000/api
```

Contrato esperado: `POST /experiments`, recebendo a configuração do formulário e retornando um experimento com a lista `probes`. Os tipos estão em `src/types.ts`.

## Verificação

```bash
npm run lint
npm run build
```
