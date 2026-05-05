"""
WSGI config for torchbearers_site project.
"""

import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'torchbearers_site.settings')

# Start fake memcached if no real cache is configured
if not os.getenv("REDIS_URL"):
    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from fake_memcached import start_memcached
        import socket
        s = socket.socket()
        s.settimeout(0.2)
        if s.connect_ex(('127.0.0.1', 11211)) != 0:
            start_memcached()
        s.close()
    except Exception as e:
        print(f"Warning: could not start fake memcached: {e}", file=sys.stderr)

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
