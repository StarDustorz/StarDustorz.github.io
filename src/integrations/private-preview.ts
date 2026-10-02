import type { AstroIntegration } from 'astro'
import process from 'node:process'

export default function privatePreviewIntegration(): AstroIntegration {
  return {
    name: 'stardust-private-preview',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        if (command !== 'dev' || process.env.STARDUST_PREVIEW !== '1')
          return
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
                  const host = req.headers.host || ''
                  if (!/^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host)) {
                    res.writeHead(403).end('Forbidden')
                    return
                  }
                  const url = new URL(req.url || '/', `http://${req.headers.host}`)
                  if (url.pathname === '/__preview-health') {
                    res.writeHead(200).end('ready')
                    return
                  }
                  if (url.pathname === '/__preview') {
                    const target = url.searchParams.get('next') || '/'
                    if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\') || /[\r\n]/.test(target)) {
                      res.writeHead(400).end('Invalid redirect')
                      return
                    }
                    res.setHeader('Location', target)
                    res.writeHead(302).end()
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
