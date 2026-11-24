"""Protocolo PING/PONG do NetProbe — lado cliente."""

import json
from typing import Any


class ProtocolError(ValueError):
    """Resposta recebida não respeita o protocolo."""


def build_ping(sequence: int) -> bytes:
    """Monta o datagrama PING para a sequência informada."""
    return json.dumps({"type": "PING", "sequence": sequence}).encode("utf-8")


def parse_pong(data: bytes) -> int:
    """Valida um datagrama PONG e retorna o número de sequência."""
    try:
        message: Any = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ProtocolError(f"JSON inválido: {exc}") from exc
    if not isinstance(message, dict):
        raise ProtocolError("a mensagem deve ser um objeto JSON")
    if message.get("type") != "PONG":
        raise ProtocolError(f"tipo inválido: {message.get('type')!r} (esperado 'PONG')")
    if "sequence" not in message:
        raise ProtocolError("campo 'sequence' ausente")
    sequence: object = message["sequence"]
    if isinstance(sequence, bool) or not isinstance(sequence, int):
        raise ProtocolError("'sequence' deve ser um inteiro")
    if sequence < 0:
        raise ProtocolError("'sequence' não pode ser negativo")
    return sequence
