import json

import pytest

from server.protocol import ProtocolError, build_pong, parse_ping


def enc(obj: object) -> bytes:
    return json.dumps(obj).encode()


def test_valid_ping() -> None:
    assert parse_ping(enc({"type": "PING", "sequence": 7})) == 7
    assert parse_ping(enc({"type": "PING", "sequence": 0})) == 0


def test_invalid_json() -> None:
    with pytest.raises(ProtocolError):
        parse_ping(b"{nao e json")
    with pytest.raises(ProtocolError):
        parse_ping(b"\xff\xfe")


def test_not_an_object() -> None:
    with pytest.raises(ProtocolError):
        parse_ping(b"[1, 2]")


def test_missing_sequence() -> None:
    with pytest.raises(ProtocolError, match="sequence"):
        parse_ping(enc({"type": "PING"}))


@pytest.mark.parametrize("seq", ["1", 1.5, None, True, False, [1], -1])
def test_bad_sequence(seq: object) -> None:
    with pytest.raises(ProtocolError):
        parse_ping(enc({"type": "PING", "sequence": seq}))


@pytest.mark.parametrize("t", ["PONG", "ping", None, 1])
def test_wrong_type(t: object) -> None:
    with pytest.raises(ProtocolError):
        parse_ping(enc({"type": t, "sequence": 1}))


def test_build_pong() -> None:
    assert json.loads(build_pong(3)) == {"type": "PONG", "sequence": 3}
