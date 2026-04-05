import express from "express"
import { createServer as createViteServer } from "vite"
import { createProxyMiddleware } from "http-proxy-middleware"

async function createServer() {

  const app = express()

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom"
  })

  app.use(vite.middlewares)
  // ⭐ API代理
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8080",
    })
  )
  app.use('*all', async (req, res) => {

    try {

      const url = req.originalUrl

      const result = await fetch(
        "http://localhost:8080/api/blogs?page=1&pageSize=10"
      ).then(r => r.json())

      const { render } = await vite.ssrLoadModule("/src/entry-server.tsx")
      const { html: appHtml, styleText } = await render(url, result.data.list)

      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          ${styleText}
        </head>
        <body>
          <div id="root">${appHtml}</div>

          <script>
            window.__INITIAL_DATA__=${JSON.stringify(result.data.list)}
          </script>

          <script type="module" src="/src/entry-client.tsx"></script>
        </body>
        </html>
      `

      // ⭐ 关键步骤
      html = await vite.transformIndexHtml(url, html)

      res.status(200).set({ "Content-Type": "text/html" }).end(html)

    } catch (e) {

      vite.ssrFixStacktrace(e)

      console.error(e)

      res.status(500).end(e.message)

    }

  })

  app.listen(3001)

}

createServer()