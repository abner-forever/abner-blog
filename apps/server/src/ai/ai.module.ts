import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIController } from './ai.controller';
import { AICommandService } from './services/ai-command.service';
import { AIService } from './ai.service';
import { CalendarModule } from '../calendar/calendar.module';
import { TodosModule } from '../todos/todos.module';
import { WeatherModule } from '../weather/weather.module';
import { UserAIConfig } from '../entities/user-ai-config.entity';
import { AIConfigService } from './services/ai-config.service';
import { AIChatSessionService } from './services/ai-chat-session.service';
import { AIWeatherService } from './services/ai-weather.service';
import { AIChatResponseService } from './services/ai-chat-response.service';
import { AIWebSearchService } from './services/ai-web-search.service';
import { McpModule } from '../mcp/mcp.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { MCPServersModule } from '../mcp-servers/mcp-servers.module';

@Module({
  imports: [
    CalendarModule,
    TodosModule,
    WeatherModule,
    McpModule,
    MCPServersModule,
    KnowledgeBaseModule,
    TypeOrmModule.forFeature([UserAIConfig]),
  ],
  controllers: [AIController],
  providers: [
    AIService,
    AICommandService,
    AIConfigService,
    AIChatSessionService,
    AIWeatherService,
    AIChatResponseService,
    AIWebSearchService,
  ],
  exports: [AIService],
})
export class AIModule {}
