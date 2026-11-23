import json
import socket
import threading
from collections.abc import Iterator

import pytest

from server.server import UDPServer


@pytest.fixture
def server() -> Iterator[UDPServer]:
    srv = UDPServer("127.0.0.1", 0, timeout=0.05)
    thread = threading.Thread(target=srv.serve_forever, daemon=True)
    thread.start()
    yield srv
    srv.stop()
    thread.join(timeout=2)


@pytest.fixture
def client() -> Iterator[socket.socket]:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(2)
    yield sock
    sock.close()


def test_pong_same_sequence(server: UDPServer, client: socket.socket) -> None:
    client.sendto(json.dumps({"type": "PING", "sequence": 42}).encode(), server.address)
    data, addr = client.recvfrom(1024)
    assert json.loads(data) == {"type": "PONG", "sequence": 42}
    assert addr == server.address


def test_invalid_messages_do_not_stop_server(server: UDPServer, client: socket.socket) -> None:
    for bad in (b"garbage", b"[]", b'{"type":"PING"}', b'{"type":"PING","sequence":true}'):
        client.sendto(bad, server.address)
    client.sendto(json.dumps({"type": "PING", "sequence": 1}).encode(), server.address)
    data, _ = client.recvfrom(1024)
    assert json.loads(data) == {"type": "PONG", "sequence": 1}


def test_invalid_message_gets_no_reply(server: UDPServer, client: socket.socket) -> None:
    client.settimeout(0.3)
    client.sendto(b"garbage", server.address)
    with pytest.raises(TimeoutError):
        client.recvfrom(1024)


def test_graceful_shutdown() -> None:
    srv = UDPServer("127.0.0.1", 0, timeout=0.05)
    thread = threading.Thread(target=srv.serve_forever)
    thread.start()
    srv.stop()
    thread.join(timeout=2)
    assert not thread.is_alive()
    assert srv.sock.fileno() == -1  # socket fechado
