require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const { handleSttWs } = require('./ws/sttHandler');

const app = express();

app.use(cors());
app.use(express.json());

// HTTP API 路由
app.use('/api/organize', require('./routes/organize'));
app.use('/api/encourage', require('./routes/encourage'));
app.use('/api/stt', require('./routes/stt'));

app.get('/health', (req, res) => res.json({ ok: true }));

// 托管前端构建产物（生产环境）
const distPath = path.join(__dirname, '../../frontend-mobile/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

// 创建 HTTP 服务器，挂载 WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// WebSocket 路由：只处理 /ws/stt 路径
server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);

  if (pathname === '/ws/stt') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      handleSttWs(ws);
    });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
