import express, { type Request, type Response } from 'express';

const app = express();
app.use(express.json({ limit: '1mb' }));

const port = Number(process.env.PORT || 3001);
const githubToken = process.env.GITHUB_TOKEN || '';
const mcpBearerToken = process.env.MCP_SERVER_BEARER_TOKEN || '';
const protocolVersion = '2025-03-26';

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
};

function unauthorized(res: Response) {
  return res.status(401).json({
    jsonrpc: '2.0',
    error: { code: -32001, message: 'Unauthorized' },
    id: null,
  });
}

function jsonRpcError(
  res: Response,
  id: number | string | null | undefined,
  message: string,
) {
  return res.json({
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code: -32000, message },
  });
}

async function callGithub(path: string, init?: RequestInit) {
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN 未配置');
  }
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const errMsg =
      typeof data === 'object' &&
      data &&
      'message' in data &&
      typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `GitHub API 调用失败(${response.status})`;
    throw new Error(errMsg);
  }
  return data;
}

app.post('/mcp/github', async (req: Request, res: Response) => {
  if (mcpBearerToken) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${mcpBearerToken}`) {
      return unauthorized(res);
    }
  }

  const body = req.body as JsonRpcRequest;
  const id = body?.id ?? null;

  try {
    if (body.method === 'initialize') {
      res.setHeader('mcp-session-id', `session-${Date.now()}`);
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion,
          capabilities: { tools: {} },
          serverInfo: { name: 'github-mcp-http', version: '1.0.0' },
        },
      });
    }

    if (body.method === 'notifications/initialized') {
      return res.status(204).send();
    }

    if (body.method === 'tools/list') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'get_repo',
              description: '获取仓库信息',
              inputSchema: {
                type: 'object',
                properties: {
                  owner: { type: 'string' },
                  repo: { type: 'string' },
                },
                required: ['owner', 'repo'],
              },
            },
            {
              name: 'list_issues',
              description: '列出仓库 issues',
              inputSchema: {
                type: 'object',
                properties: {
                  owner: { type: 'string' },
                  repo: { type: 'string' },
                  state: { type: 'string', enum: ['open', 'closed', 'all'] },
                  per_page: { type: 'number' },
                },
                required: ['owner', 'repo'],
              },
            },
            {
              name: 'create_issue',
              description: '创建 issue',
              inputSchema: {
                type: 'object',
                properties: {
                  owner: { type: 'string' },
                  repo: { type: 'string' },
                  title: { type: 'string' },
                  body: { type: 'string' },
                },
                required: ['owner', 'repo', 'title'],
              },
            },
            {
              name: 'list_prs',
              description: '列出 PR',
              inputSchema: {
                type: 'object',
                properties: {
                  owner: { type: 'string' },
                  repo: { type: 'string' },
                  state: { type: 'string', enum: ['open', 'closed', 'all'] },
                  per_page: { type: 'number' },
                },
                required: ['owner', 'repo'],
              },
            },
            {
              name: 'create_pr',
              description: '创建 PR',
              inputSchema: {
                type: 'object',
                properties: {
                  owner: { type: 'string' },
                  repo: { type: 'string' },
                  title: { type: 'string' },
                  head: { type: 'string' },
                  base: { type: 'string' },
                  body: { type: 'string' },
                },
                required: ['owner', 'repo', 'title', 'head', 'base'],
              },
            },
          ],
        },
      });
    }

    if (body.method === 'tools/call') {
      const params = (body.params || {}) as {
        name?: string;
        arguments?: Record<string, unknown>;
      };
      const toolName = params.name;
      const args = params.arguments || {};

      let output: unknown;

      if (toolName === 'get_repo') {
        const owner = String(args.owner || '');
        const repo = String(args.repo || '');
        output = await callGithub(`/repos/${owner}/${repo}`);
      } else if (toolName === 'list_issues') {
        const owner = String(args.owner || '');
        const repo = String(args.repo || '');
        const state = String(args.state || 'open');
        const perPage = Number(args.per_page || 20);
        output = await callGithub(
          `/repos/${owner}/${repo}/issues?state=${encodeURIComponent(
            state,
          )}&per_page=${perPage}`,
        );
      } else if (toolName === 'create_issue') {
        const owner = String(args.owner || '');
        const repo = String(args.repo || '');
        output = await callGithub(`/repos/${owner}/${repo}/issues`, {
          method: 'POST',
          body: JSON.stringify({
            title: String(args.title || ''),
            body: String(args.body || ''),
          }),
        });
      } else if (toolName === 'list_prs') {
        const owner = String(args.owner || '');
        const repo = String(args.repo || '');
        const state = String(args.state || 'open');
        const perPage = Number(args.per_page || 20);
        output = await callGithub(
          `/repos/${owner}/${repo}/pulls?state=${encodeURIComponent(
            state,
          )}&per_page=${perPage}`,
        );
      } else if (toolName === 'create_pr') {
        const owner = String(args.owner || '');
        const repo = String(args.repo || '');
        output = await callGithub(`/repos/${owner}/${repo}/pulls`, {
          method: 'POST',
          body: JSON.stringify({
            title: String(args.title || ''),
            body: String(args.body || ''),
            head: String(args.head || ''),
            base: String(args.base || ''),
          }),
        });
      } else {
        return jsonRpcError(res, id, `不支持的工具: ${toolName || 'unknown'}`);
      }

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          structuredContent:
            typeof output === 'object' && output && !Array.isArray(output)
              ? (output as Record<string, unknown>)
              : undefined,
        },
      });
    }

    return jsonRpcError(res, id, `不支持的方法: ${body.method}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown error';
    return jsonRpcError(res, id, msg);
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`github-mcp-http listening at :${port}`);
});
