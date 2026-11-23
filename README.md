# NetProbe

Medição de desempenho de comunicação com sockets UDP (Python), API FastAPI e dashboard React.

## Servidor UDP

```bash
cd backend
pip install -r requirements.txt
python -m server.server --host 127.0.0.1 --port 5000   # Ctrl+C encerra
```

Protocolo: `{"type":"PING","sequence":N}` -> `{"type":"PONG","sequence":N}`.
Mensagens inválidas são registradas e ignoradas.

Demonstração com um cliente mínimo (outro terminal):

```bash
python -c "import socket,json;s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM);s.settimeout(2);s.sendto(json.dumps({'type':'PING','sequence':1}).encode(),('127.0.0.1',5000));print(s.recvfrom(1024)[0])"
```

## Testes

```bash
cd backend && ruff check . && mypy . && pytest -v
```
