import type { AstroIntegration } from 'astro'
import process from 'node:process'

export default function privatePreviewIntegration(): AstroIntegration {
  return {
    name: 'stardust-private-preview',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        if (command !== 'dev' || process.env.STARDUST_PREVIEW !== '1')
          return
        const token = process.env.STARDUST_PREVIEW_TOKEN
        if (!token)
          throw new Error('私有预览缺少访问令牌')
        updateConfig({
          server: { host: process.env.STARDUST_CONTAINER === '1' ? '0.0.0.0' : '127.0.0.1' },
          vite: {
            server: { strictPort: true },
            plugins: [{
              name: 'stardust-preview-access',
              enforce: 'pre',
              configureServer(server) {
                // Register before Vite's static and source-transform middleware.
                server.middlewares.use((req, res, next) => {
                  res.setHeader('Cache-Control', 'no-store')
                  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
                  res.setHeader('Referrer-Policy', 'no-referrer')
                  if (!req.headers.host?.startsWith('127.0.0.1:')) {
                    res.writeHead(403).end('Forbidden')
                    return
                  }
                  const url = new URL(req.url || '/', `http://${req.headers.host}`)
                  if (url.pathname === '/__preview-health' && req.headers['x-preview-token'] === token) {
                    res.writeHead(200).end('ready')
                    return
                  }
                  if (url.pathname === '/__preview' && url.searchParams.get('ticket') === token) {
                    const target = url.searchParams.get('next') || '/'
                    if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\') || /[\r\n]/.test(target)) {
                      res.writeHead(400).end('Invalid redirect')
                      return
                    }
                    res.setHeader('Set-Cookie', `stardust_preview=${token}; HttpOnly; SameSite=Strict; Path=/`)
                    res.setHeader('Location', target)
                    res.writeHead(302).end()
                    return
                  }
                  const cookie = req.headers.cookie?.split(';').map(value => value.trim()).includes(`stardust_preview=${token}`)
                  if (!cookie) {
                    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('请从本地管理台打开私有预览。')
                    return
                  }
                  next()
                })
              },
            }],
          },
        })
      },
    },
  }
}
