"""Servidor UDP do NetProbe.

Uso: python -m server.server --host 127.0.0.1 --port 5000
"""

import argparse
import logging
import socket
import threading
from collections.abc import Sequence

from server.protocol import ProtocolError, build_pong, parse_ping

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 5000
BUFFER_SIZE = 65535
RECV_TIMEOUT = 0.5

logger = logging.getLogger("netprobe.server")


class UDPServer:
    """Servidor que responde PING com PONG."""

    def __init__(
        self,
        host: str = DEFAULT_HOST,
        port: int = DEFAULT_PORT,
        timeout: float = RECV_TIMEOUT,
    ) -> None:
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind((host, port))
        self.sock.settimeout(timeout)
        self._stop = threading.Event()

    @property
    def address(self) -> tuple[str, int]:
        host, port = self.sock.getsockname()[:2]
        return str(host), int(port)

    def stop(self) -> None:
        """Solicita o encerramento do laço principal."""
        self._stop.set()

    def handle_datagram(self, data: bytes, addr: tuple[str, int]) -> None:
        """Processa um datagrama; mensagens inválidas são apenas registradas."""
        try:
            sequence = parse_ping(data)
        except ProtocolError as exc:
            logger.warning("mensagem inválida de %s:%d: %s", addr[0], addr[1], exc)
            return
        self.sock.sendto(build_pong(sequence), addr)
        logger.info("PING seq=%d de %s:%d -> PONG", sequence, addr[0], addr[1])

    def serve_forever(self) -> None:
        """Aguarda datagramas até stop() ser chamado ou Ctrl+C."""
        host, port = self.address
        logger.info("servidor UDP escutando em %s:%d (Ctrl+C para encerrar)", host, port)
        try:
            while not self._stop.is_set():
                try:
                    data, addr = self.sock.recvfrom(BUFFER_SIZE)
                except TimeoutError:
                    continue
                except ConnectionResetError:  # ICMP no Windows; ignorar
                    continue
                self.handle_datagram(data, (str(addr[0]), int(addr[1])))
        except KeyboardInterrupt:
            logger.info("encerrando por Ctrl+C")
        finally:
            self.sock.close()
            logger.info("socket fechado")


def main(argv: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Servidor UDP NetProbe")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    UDPServer(args.host, args.port).serve_forever()


if __name__ == "__main__":
    main()
