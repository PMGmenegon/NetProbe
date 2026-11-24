import threading
from collections.abc import Iterator

import pytest

from client.client import PingResult, UDPClient
from server.server import UDPServer


@pytest.fixture
def server() -> Iterator[UDPServer]:
    srv = UDPServer("127.0.0.1", 0, timeout=0.05)
    thread = threading.Thread(target=srv.serve_forever, daemon=True)
    thread.start()
    yield srv
    srv.stop()
    thread.join(timeout=2)


def test_single_ping_returns_rtt(server: UDPServer) -> None:
    with UDPClient(server.address[0], server.address[1], timeout=2.0) as client:
        result = client.ping(0)
    assert result.sequence == 0
    assert not result.timed_out
    assert result.rtt_ms is not None
    assert result.rtt_ms > 0


def test_ping_timeout() -> None:
    with UDPClient("127.0.0.1", 19999, timeout=0.1) as client:
        result = client.ping(0)
    assert result.timed_out
    assert result.rtt_ms is None
    assert result.received_at is None


def test_ping_result_sequence_preserved(server: UDPServer) -> None:
    with UDPClient(server.address[0], server.address[1], timeout=2.0) as client:
        result = client.ping(42)
    assert result.sequence == 42


def test_run_returns_ordered_results(server: UDPServer) -> None:
    with UDPClient(server.address[0], server.address[1], timeout=2.0) as client:
        results = client.run(count=3, interval=0.0)
    assert len(results) == 3
    assert [r.sequence for r in results] == [0, 1, 2]
    assert all(not r.timed_out for r in results)


def test_run_all_timeout() -> None:
    with UDPClient("127.0.0.1", 19999, timeout=0.05) as client:
        results = client.run(count=3, interval=0.0)
    assert len(results) == 3
    assert all(r.timed_out for r in results)


def test_timed_out_property() -> None:
    received = PingResult(sequence=0, sent_at=0.0, received_at=1.0, rtt_ms=10.0)
    timeout = PingResult(sequence=1, sent_at=0.0, received_at=None, rtt_ms=None)
    assert not received.timed_out
    assert timeout.timed_out
