import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import apiRouter from './server/routes';
import { queueManager } from './server/queueService';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Socket.IO Setup
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  queueManager.setSocketServer(io);

  io.on('connection', (socket) => {
    // Client joins real-time doctor queue room
    socket.on('join:doctor_queue', ({ doctorId, date }) => {
      if (doctorId) {
        const room = `doctor_${doctorId}_${date || new Date().toISOString().split('T')[0]}`;
        socket.join(room);
      }
    });

    // Client subscribes to appointment specific alerts
    socket.on('subscribe:appointment', ({ appointmentId }) => {
      if (appointmentId) {
        socket.join(`apt_${appointmentId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  // Mount API router
  app.use('/api', apiRouter);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In dev: mount Vite dev server middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode.');
  } else {
    // In production: serve static assets from dist
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Server] Serving production build from dist/.');
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` MediSmart AI — Healthcare Platform Server Running`);
    console.log(` Visakhapatnam (Vizag), Andhra Pradesh`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Mode: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Critical startup error:', err);
  process.exit(1);
});
