"""Protocolo PING/PONG do NetProbe (mensagens JSON sobre UDP)."""

import json
from typing import Any


class ProtocolError(ValueError):
    """Mensagem recebida não respeita o protocolo."""


def parse_ping(data: bytes) -> int:
    """Valida um datagrama PING e retorna o número de sequência."""
    try:
        message: Any = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ProtocolError(f"JSON inválido: {exc}") from exc
    if not isinstance(message, dict):
        raise ProtocolError("a mensagem deve ser um objeto JSON")
    if message.get("type") != "PING":
        raise ProtocolError(f"tipo inválido: {message.get('type')!r} (esperado 'PING')")
    if "sequence" not in message:
        raise ProtocolError("campo 'sequence' ausente")
    sequence: object = message["sequence"]
    if isinstance(sequence, bool) or not isinstance(sequence, int):
        raise ProtocolError("'sequence' deve ser um inteiro")
    if sequence < 0:
        raise ProtocolError("'sequence' não pode ser negativo")
    return sequence


def build_pong(sequence: int) -> bytes:
    """Monta o datagrama PONG para a sequência informada."""
    return json.dumps({"type": "PONG", "sequence": sequence}).encode("utf-8")
