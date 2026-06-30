/**
 * Agent Module
 *
 * 依赖注入所有 AgentProcessor 需要的服务。
 * 提供 AIChatSessionService 等，并导出 AgentProcessor。
 */

import { Module } from '@nestjs/common';
import { AIChatSessionService } from '../services/ai-chat-session.service';
import { AIChatResponseService } from '../services/ai-chat-response.service';
import { ChatHistoryService } from '../orchestrator/chat-history.service';
import { ChatStreamService } from '../orchestrator/chat-stream.service';
import { McpModule } from '../../mcp/mcp.module';
import { KnowledgeBaseModule } from '../../knowledge-base/knowledge-base.module';
import { SkillsModule } from '../../skills/skills.module';
import { AgentProcessor } from './agent.processor';

@Module({
  imports: [McpModule, KnowledgeBaseModule, SkillsModule],
  providers: [
    AgentProcessor,
    AIChatSessionService,
    AIChatResponseService,
    ChatHistoryService,
    ChatStreamService,
  ],
  exports: [AgentProcessor],
})
export class AgentModule {}
