"""Cálculo de métricas de RTT para o NetProbe."""

from dataclasses import dataclass


@dataclass
class RTTStats:
    count: int
    received: int
    timeouts: int
    min_ms: float | None
    max_ms: float | None
    avg_ms: float | None
    timeout_rate: float  # porcentagem (0–100)


def compute_stats(rtts: list[float | None]) -> RTTStats:
    """Calcula estatísticas de RTT.

    Parameters
    ----------
    rtts:
        Lista com um valor por PING: float = RTT em ms, None = timeout.
    """
    count = len(rtts)
    received_vals = [r for r in rtts if r is not None]
    received = len(received_vals)
    timeouts = count - received

    min_ms = min(received_vals) if received_vals else None
    max_ms = max(received_vals) if received_vals else None
    avg_ms = sum(received_vals) / received if received_vals else None
    timeout_rate = timeouts / count * 100 if count else 0.0

    return RTTStats(
        count=count,
        received=received,
        timeouts=timeouts,
        min_ms=min_ms,
        max_ms=max_ms,
        avg_ms=avg_ms,
        timeout_rate=timeout_rate,
    )
