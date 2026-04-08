export const MCP_OAUTH_DEFAULT_CLIENT_ID = 'cursor-local';

export const MCP_OAUTH_ALLOWED_REDIRECT_URIS = [
  'cursor://mcp-auth-callback',
  'cursor://anysphere.cursor-mcp/oauth/callback',
];

export const MCP_OAUTH_ALLOWED_CODE_CHALLENGE_METHODS = ['S256', 'plain'];

export const MCP_OAUTH_STATE_MAX_LENGTH = 1024;
