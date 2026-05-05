"""
Minimal in-process memcached protocol server.
Runs on 127.0.0.1:11211 to satisfy django-ratelimit's PyMemcacheCache backend.
"""
import socketserver
import threading
import time

store = {}
store_lock = threading.Lock()


class MemcachedHandler(socketserver.StreamRequestHandler):
    def handle(self):
        try:
            while True:
                line = self.rfile.readline()
                if not line:
                    break
                line = line.decode('utf-8', errors='replace').strip()
                parts = line.split()
                if not parts:
                    continue
                cmd = parts[0].lower()

                if cmd == 'set':
                    key = parts[1]
                    flags = int(parts[2])
                    exptime = int(parts[3])
                    bytes_len = int(parts[4])
                    data = self.rfile.read(bytes_len + 2)[:bytes_len]
                    exp = time.time() + exptime if exptime > 0 else 0
                    with store_lock:
                        store[key] = (data, exp)
                    self.wfile.write(b'STORED\r\n')

                elif cmd == 'get':
                    keys = parts[1:]
                    result = b''
                    with store_lock:
                        for k in keys:
                            if k in store:
                                val, exp = store[k]
                                if exp == 0 or time.time() < exp:
                                    result += f'VALUE {k} 0 {len(val)}\r\n'.encode()
                                    result += val + b'\r\n'
                    result += b'END\r\n'
                    self.wfile.write(result)

                elif cmd == 'incr':
                    key = parts[1]
                    delta = int(parts[2]) if len(parts) > 2 else 1
                    with store_lock:
                        if key in store:
                            val, exp = store[key]
                            if exp == 0 or time.time() < exp:
                                try:
                                    new_val = int(val) + delta
                                    store[key] = (str(new_val).encode(), exp)
                                    self.wfile.write(f'{new_val}\r\n'.encode())
                                    continue
                                except ValueError:
                                    pass
                        self.wfile.write(b'NOT_FOUND\r\n')

                elif cmd == 'decr':
                    key = parts[1]
                    delta = int(parts[2]) if len(parts) > 2 else 1
                    with store_lock:
                        if key in store:
                            val, exp = store[key]
                            if exp == 0 or time.time() < exp:
                                try:
                                    new_val = max(0, int(val) - delta)
                                    store[key] = (str(new_val).encode(), exp)
                                    self.wfile.write(f'{new_val}\r\n'.encode())
                                    continue
                                except ValueError:
                                    pass
                        self.wfile.write(b'NOT_FOUND\r\n')

                elif cmd == 'delete':
                    key = parts[1]
                    with store_lock:
                        store.pop(key, None)
                    self.wfile.write(b'DELETED\r\n')

                elif cmd == 'flush_all':
                    with store_lock:
                        store.clear()
                    self.wfile.write(b'OK\r\n')

                elif cmd == 'quit':
                    break

        except (ConnectionResetError, BrokenPipeError, OSError):
            pass


class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


def start_memcached(host='127.0.0.1', port=11211):
    server = ThreadedTCPServer((host, port), MemcachedHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    print(f"Fake memcached running on {host}:{port}")
    return server


if __name__ == '__main__':
    server = start_memcached()
    try:
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        server.shutdown()
