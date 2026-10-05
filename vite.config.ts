import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function saveBairrosPlugin(): Plugin {
  return {
    name: 'save-bairros-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-bairros', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { content } = JSON.parse(body);
              const dir = typeof import.meta.dirname !== 'undefined' ? import.meta.dirname : process.cwd();
              const filePath = path.resolve(dir, 'src/data/colatinaBairros.ts');
              fs.writeFileSync(filePath, content, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Arquivo src/data/colatinaBairros.ts salvo com sucesso!' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saveBairrosPlugin()],
})

