import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from server import TallyServer
from http.server import HTTPServer
port = int(os.environ.get('PORT', 8001))
httpd = HTTPServer(('', port), TallyServer)
print(f'Tally running on port {port}')
httpd.serve_forever()
