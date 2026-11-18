# Локальний сервер розкладу. Працює з будь-якої папки: сам обирає папку, де лежить цей файл.
# Запуск: двічі клікни "start.bat" (або: python server.py). Зупинити: закрий вікно / Ctrl+C.
import http.server, socketserver, os, sys, threading, webbrowser

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()
    def log_message(self, *a):
        pass

socketserver.TCPServer.allow_reuse_address = True
for port in range(PORT, PORT + 20):          # якщо 8000 зайнятий — беремо наступний
    try:
        srv = socketserver.TCPServer(("127.0.0.1", port), Handler)   # лише цей комп'ютер
        break
    except OSError:
        continue
else:
    sys.exit("Не вдалося знайти вільний порт")

url = f"http://localhost:{port}"
print("Розклад відкрито:", url)
print("Не закривай це вікно, поки користуєшся. Зупинити: Ctrl+C")
threading.Timer(0.8, lambda: webbrowser.open(url)).start()
try:
    srv.serve_forever()
except KeyboardInterrupt:
    pass
