"""
Custom in-process cache backend that supports atomic increment.
This satisfies django-ratelimit's requirements while running without Redis/Memcached.
"""
import threading
import time
from django.core.cache.backends.locmem import LocMemCache


class AtomicLocMemCache(LocMemCache):
    """
    Extended LocMemCache with atomic incr/decr support for django-ratelimit.
    Uses a lock to make increment operations atomic.
    """
    def __init__(self, name, params):
        super().__init__(name, params)
        self._incr_lock = threading.Lock()

    def incr(self, key, delta=1, version=None):
        with self._incr_lock:
            return super().incr(key, delta, version)

    def decr(self, key, delta=1, version=None):
        with self._incr_lock:
            return super().decr(key, delta, version)
