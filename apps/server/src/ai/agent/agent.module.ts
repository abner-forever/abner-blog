/**
 * Agent Module
 *
 * 依赖注入所有 AgentProcessor 需要的服务。
 * 提供 AICommandService、AIChatSessionService 等，并导出 AgentProcessor。
 */

import { Module } from '@nestjs/common';
import { AICommandService } from '../services/ai-command.service';
import { AIChatSessionService } from '../services/ai-chat-session.service';
import { AIWeatherService } from '../services/ai-weather.service';
import { AIChatResponseService } from '../services/ai-chat-response.service';
import { ChatHistoryService } from '../orchestrator/chat-history.service';
import { ChatStreamService } from '../orchestrator/chat-stream.service';
import { CalendarModule } from '../../calendar/calendar.module';
import { TodosModule } from '../../todos/todos.module';
import { WeatherModule } from '../../weather/weather.module';
import { WebSearchModule } from '../../web-search/web-search.module';
import { McpModule } from '../../mcp/mcp.module';
import { KnowledgeBaseModule } from '../../knowledge-base/knowledge-base.module';
import { SkillsModule } from '../../skills/skills.module';
import { AgentProcessor } from './agent.processor';

@Module({
  imports: [
    CalendarModule,
    TodosModule,
    WeatherModule,
    WebSearchModule,
    McpModule,
    KnowledgeBaseModule,
    SkillsModule,
  ],
  providers: [
    AgentProcessor,
    AICommandService,
    AIChatSessionService,
    AIWeatherService,
    AIChatResponseService,
    ChatHistoryService,
    ChatStreamService,
  ],
  exports: [AgentProcessor],
})
export class AgentModule {}
