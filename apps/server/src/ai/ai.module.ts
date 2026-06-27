import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIController } from './ai.controller';
import { AISessionController } from './ai-session.controller';
import { AICommandService } from './services/ai-command.service';
import { AIService } from './ai.service';
import { ChatSessionCrudService } from './services/chat-session-crud.service';
import { CalendarModule } from '../calendar/calendar.module';
import { TodosModule } from '../todos/todos.module';
import { WeatherModule } from '../weather/weather.module';
import { AIConfigModule } from './ai-config.module';
import { AIChatSessionService } from './services/ai-chat-session.service';
import { AIWeatherService } from './services/ai-weather.service';
import { AIChatResponseService } from './services/ai-chat-response.service';
import { McpModule } from '../mcp/mcp.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { WebSearchModule } from '../web-search/web-search.module';
import { SkillsModule } from '../skills/skills.module';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatHistoryService } from './orchestrator/chat-history.service';
import { ChatStreamService } from './orchestrator/chat-stream.service';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession]),
    AIConfigModule,
    CalendarModule,
    TodosModule,
    WeatherModule,
    WebSearchModule,
    McpModule,
    KnowledgeBaseModule,
    SkillsModule,
    AgentModule, // ← LangGraph Agent Workflow
  ],
  controllers: [AIController, AISessionController],
  providers: [
    AIService,
    AICommandService,
    AIChatSessionService,
    ChatSessionCrudService,
    AIWeatherService,
    AIChatResponseService,
    ChatHistoryService,
    ChatStreamService,
  ],
  exports: [AIService],
})
export class AIModule {}
