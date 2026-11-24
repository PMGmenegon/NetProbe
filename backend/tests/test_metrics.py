from client.metrics import compute_stats


def test_all_received() -> None:
    stats = compute_stats([10.0, 20.0, 30.0])
    assert stats.count == 3
    assert stats.received == 3
    assert stats.timeouts == 0
    assert stats.min_ms == 10.0
    assert stats.max_ms == 30.0
    assert stats.avg_ms == 20.0
    assert stats.timeout_rate == 0.0


def test_all_timeouts() -> None:
    stats = compute_stats([None, None])
    assert stats.count == 2
    assert stats.received == 0
    assert stats.timeouts == 2
    assert stats.min_ms is None
    assert stats.max_ms is None
    assert stats.avg_ms is None
    assert stats.timeout_rate == 100.0


def test_mixed() -> None:
    stats = compute_stats([10.0, None, 30.0, None])
    assert stats.count == 4
    assert stats.received == 2
    assert stats.timeouts == 2
    assert stats.min_ms == 10.0
    assert stats.max_ms == 30.0
    assert stats.avg_ms == 20.0
    assert stats.timeout_rate == 50.0


def test_empty() -> None:
    stats = compute_stats([])
    assert stats.count == 0
    assert stats.received == 0
    assert stats.timeouts == 0
    assert stats.min_ms is None
    assert stats.timeout_rate == 0.0
