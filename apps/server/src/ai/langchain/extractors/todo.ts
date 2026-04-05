import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  ExtractionResultDto,
  IntentType,
} from '../../dto/extraction-result.dto';
import type { ChatLLM } from '../model';
import { cleanTitle, getTextContent, parseJson } from '../parsers';
import { TODO_EXTRACTION_PROMPT } from '../prompts';

export async function extractTodoEntities(
  llm: ChatLLM,
  userInput: string,
): Promise<ExtractionResultDto | null> {
  const prompt = TODO_EXTRACTION_PROMPT.replace('{userInput}', userInput);

  try {
    const result = await llm.invoke([
      new SystemMessage('你是一个任务管理助手，只输出JSON。'),
      new HumanMessage(prompt),
    ]);

    const content = getTextContent(result);
    const parsed = parseJson(content);

    if (!parsed || typeof parsed.title !== 'string' || !parsed.title) {
      return extractTodoEntitiesByRules(userInput);
    }

    return {
      intent: IntentType.CREATE_TODO,
      title: cleanTitle(parsed.title),
      description:
        typeof parsed.description === 'string' ? parsed.description : undefined,
    };
  } catch (error) {
    console.error('Todo extraction error:', error);
    return extractTodoEntitiesByRules(userInput);
  }
}

function extractTodoEntitiesByRules(
  userInput: string,
): ExtractionResultDto | null {
  const title = cleanTodoTitle(userInput);
  if (!title) return null;
  return {
    intent: IntentType.CREATE_TODO,
    title,
  };
}

function cleanTodoTitle(input: string): string {
  if (!input) return '';
  let text = input.trim();
  text = text.replace(
    /^(请|帮我|麻烦|可以|帮忙)?\s*(记一下|记下|记住|记得|提醒我|加个待办|新增待办|添加待办)\s*/i,
    '',
  );
  text = text.replace(/^(待办|todo)[:：]?\s*/i, '');
  text = text.replace(/\s*(记一下|记下|记住|记得|提醒我|帮我记|记着)\s*$/i, '');
  text = text.replace(/\s*(待办|todo)\s*$/i, '');
  text = text.replace(/\s+/g, ' ').trim();
  return cleanTitle(text.trim());
}
