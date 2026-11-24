import json

import pytest

from client.protocol import ProtocolError, build_ping, parse_pong


def enc(obj: object) -> bytes:
    return json.dumps(obj).encode()


def test_build_ping() -> None:
    assert json.loads(build_ping(5)) == {"type": "PING", "sequence": 5}
    assert json.loads(build_ping(0)) == {"type": "PING", "sequence": 0}


def test_valid_pong() -> None:
    assert parse_pong(enc({"type": "PONG", "sequence": 7})) == 7
    assert parse_pong(enc({"type": "PONG", "sequence": 0})) == 0


def test_invalid_json() -> None:
    with pytest.raises(ProtocolError):
        parse_pong(b"{nao e json")
    with pytest.raises(ProtocolError):
        parse_pong(b"\xff\xfe")


def test_not_an_object() -> None:
    with pytest.raises(ProtocolError):
        parse_pong(b"[1, 2]")


def test_missing_sequence() -> None:
    with pytest.raises(ProtocolError, match="sequence"):
        parse_pong(enc({"type": "PONG"}))


@pytest.mark.parametrize("seq", ["1", 1.5, None, True, False, [1], -1])
def test_bad_sequence(seq: object) -> None:
    with pytest.raises(ProtocolError):
        parse_pong(enc({"type": "PONG", "sequence": seq}))


@pytest.mark.parametrize("t", ["PING", "pong", None, 1])
def test_wrong_type(t: object) -> None:
    with pytest.raises(ProtocolError):
        parse_pong(enc({"type": t, "sequence": 1}))
