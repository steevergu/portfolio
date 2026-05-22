const http = require("http");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/hippolyteferry/Documents/portfolio manon";
const PORT = 3456;
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".pdf": "application/pdf" };
http.createServer((req, res) => {
  const fp = path.join(ROOT, req.url === "/" ? "index.html" : req.url);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "text/plain" });
    res.end(data);
  });
}).listen(PORT, () => console.log("Serving on " + PORT));
