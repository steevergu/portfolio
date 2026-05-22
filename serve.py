import http.server, socketserver, os
os.chdir("/Users/hippolyteferry/Documents/portfolio manon")
PORT = 3456
Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
