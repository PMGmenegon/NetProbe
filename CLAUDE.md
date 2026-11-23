# CLAUDE.md — NetProbe

## Identidade do projeto

NetProbe é um projeto acadêmico de Redes de Computadores que mede o desempenho
de comunicação (latência, perda) usando sockets UDP reais (`socket.SOCK_DGRAM`).

Tecnologias:

- Python: cliente e servidor UDP.
- FastAPI: integração HTTP futura (apenas frontend <-> API).
- React + Vite + TypeScript: frontend.
- GitHub Actions: CI.
- Pytest, Mypy, Ruff: testes, tipos e qualidade.

Arquitetura: cliente e servidor falam UDP (protocolo PING/PONG em JSON).
HTTP será usado apenas entre frontend e API; nunca substitui o UDP.

```text
backend/server/   servidor UDP (protocol.py, server.py)
backend/tests/    testes pytest
frontend/         dashboard (futuro)
.github/workflows CI
```

## Regras de desenvolvimento

- Nunca adicionar `Co-authored-by: Claude` ou qualquer trailer de coautoria de IA nos commits.
- Não adicionar Claude como coautor.
- Não modificar arquivos fora do escopo solicitado.
- Não sobrescrever implementações existentes sem analisá-las.
- Não adicionar dependências desnecessárias.
- Priorizar código simples, modular, legível e tipado.
- Não inventar resultados de testes.
- Não afirmar que uma funcionalidade funciona sem testá-la.
- Documentar alterações relevantes.

## Organização Git

Branches:

- `main`: código integrado.
- `feature/udp-client`: integrante 1.
- `feature/udp-server`: integrante 2.
- `feature/frontend-dashboard`: integrante 3.

Não criar branch `develop`. Todos os PRs vão para `main`.

Conventional Commits, por exemplo:

- `feat(server): implement UDP server`
- `test(server): add UDP server tests`
- `ci: configure GitHub Actions`
- `docs: add project development guidelines`

## Qualidade

Antes de considerar qualquer implementação concluída, executar (em `backend/`):

1. `ruff check .`
2. `mypy .`
3. `pytest`

Não ignorar falhas para obter artificialmente um resultado verde.
