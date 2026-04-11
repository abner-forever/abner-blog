export interface GithubOwnerRepo {
  owner: string;
  repo: string;
}

export interface GithubIssueDraft {
  title: string;
  body?: string;
}

export function extractGithubOwnerRepo(
  message: string,
): GithubOwnerRepo | null {
  const githubUrlMatch = message.match(
    /https?:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i,
  );
  if (githubUrlMatch) {
    return {
      owner: githubUrlMatch[1],
      repo: githubUrlMatch[2].replace(/\.git$/i, ''),
    };
  }

  const ownerRepoMatch = message.match(
    /\b([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\b/,
  );
  if (!ownerRepoMatch) return null;
  return {
    owner: ownerRepoMatch[1],
    repo: ownerRepoMatch[2].replace(/\.git$/i, ''),
  };
}

export function extractGithubIssueDraft(
  message: string,
): GithubIssueDraft | null {
  const titlePatterns = [
    /标题[是为:：]\s*[“"']?(.+?)[”"']?(?:[,，。]|$)/,
    /问题[是为:：]\s*[“"']?(.+?)[”"']?(?:[,，。]|$)/,
    /issue[是为:：]\s*[“"']?(.+?)[”"']?(?:[,，。]|$)/i,
  ];
  let title = '';
  for (const p of titlePatterns) {
    const m = message.match(p);
    if (m?.[1]) {
      title = m[1].trim();
      break;
    }
  }
  if (!title) {
    const fallback = message
      .replace(/https?:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/gi, '')
      .replace(/(给|帮我|请)?(这个|该)?项目?/g, '')
      .replace(/(提个?|创建|新建|开一个|新增)\s*(问题|issue)/gi, '')
      .replace(/(请修复|麻烦修复|修复一下|看下)/g, '')
      .trim();
    if (fallback.length >= 4) title = fallback;
  }
  if (!title) return null;

  const bodyMatch = message.match(/内容[是为:：]\s*[“"']?([\s\S]+?)[”"']?$/);
  return {
    title,
    body: bodyMatch?.[1]?.trim() || undefined,
  };
}
