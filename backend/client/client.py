"""Cliente UDP do NetProbe.

Uso: python -m client.client --host 127.0.0.1 --port 5000 --count 10
"""

import argparse
import logging
import socket
import time
from collections.abc import Sequence
from dataclasses import dataclass
from types import TracebackType

from client.metrics import compute_stats
from client.protocol import ProtocolError, build_ping, parse_pong

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 5000
DEFAULT_TIMEOUT = 1.0
DEFAULT_COUNT = 10
DEFAULT_INTERVAL = 1.0
BUFFER_SIZE = 65535

logger = logging.getLogger("netprobe.client")


@dataclass
class PingResult:
    sequence: int
    sent_at: float
    received_at: float | None  # None = timeout
    rtt_ms: float | None       # None = timeout

    @property
    def timed_out(self) -> bool:
        return self.received_at is None


class UDPClient:
    """Cliente UDP que envia PINGs numerados e mede o RTT."""

    def __init__(
        self,
        host: str = DEFAULT_HOST,
        port: int = DEFAULT_PORT,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> None:
        self._server = (host, port)
        self._timeout = timeout
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.settimeout(timeout)

    def ping(self, sequence: int) -> PingResult:
        """Envia um PING e aguarda o PONG correspondente, medindo o RTT."""
        payload = build_ping(sequence)
        sent_at = time.monotonic()
        self.sock.sendto(payload, self._server)
        logger.debug("PING seq=%d enviado", sequence)

        while True:
            try:
                data, _ = self.sock.recvfrom(BUFFER_SIZE)
            except TimeoutError:
                logger.debug("timeout seq=%d", sequence)
                return PingResult(
                    sequence=sequence,
                    sent_at=sent_at,
                    received_at=None,
                    rtt_ms=None,
                )

            try:
                seq = parse_pong(data)
            except ProtocolError as exc:
                logger.warning("PONG inválido (aguardando seq=%d): %s", sequence, exc)
                continue

            if seq != sequence:
                logger.warning(
                    "PONG seq=%d descartado (aguardando seq=%d)", seq, sequence
                )
                continue

            received_at = time.monotonic()
            rtt_ms = (received_at - sent_at) * 1000
            logger.info("PONG seq=%d RTT=%.3f ms", sequence, rtt_ms)
            return PingResult(
                sequence=sequence,
                sent_at=sent_at,
                received_at=received_at,
                rtt_ms=rtt_ms,
            )

    def run(
        self,
        count: int = DEFAULT_COUNT,
        interval: float = DEFAULT_INTERVAL,
    ) -> list[PingResult]:
        """Envia `count` PINGs espaçados por `interval` segundos."""
        results: list[PingResult] = []
        for seq in range(count):
            results.append(self.ping(seq))
            if seq < count - 1:
                time.sleep(interval)
        return results

    def close(self) -> None:
        self.sock.close()

    def __enter__(self) -> "UDPClient":
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        self.close()


def main(argv: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Cliente UDP NetProbe")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--count", type=int, default=DEFAULT_COUNT)
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT)
    parser.add_argument("--interval", type=float, default=DEFAULT_INTERVAL)
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    with UDPClient(args.host, args.port, args.timeout) as client:
        results = client.run(count=args.count, interval=args.interval)

    stats = compute_stats([r.rtt_ms for r in results])

    print(f"\n--- NetProbe {args.host}:{args.port} ---")
    print(f"Enviados:  {stats.count}")
    print(f"Recebidos: {stats.received}")
    print(f"Timeouts:  {stats.timeouts} ({stats.timeout_rate:.1f}%)")

    min_ms, max_ms, avg_ms = stats.min_ms, stats.max_ms, stats.avg_ms
    if min_ms is not None and max_ms is not None and avg_ms is not None:
        print(f"RTT mín:   {min_ms:.3f} ms")
        print(f"RTT máx:   {max_ms:.3f} ms")
        print(f"RTT médio: {avg_ms:.3f} ms")


if __name__ == "__main__":
    main()
