import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  McpController,
  McpGithubController,
  McpWebSearchController,
  MCPServersController,
} from './controllers';
import {
  McpOauthCompatController,
  McpOauthController,
  McpOauthService,
} from './oauth';
import {
  McpCapabilityCatalogBuilder,
  McpRequestContextService,
  McpService,
  McpSessionAuthService,
  MCPServersService,
} from './services';
import { WeatherTools } from './tools/weather.tools';
import { CalendarTools } from './tools/calendar.tools';
import { TodoTools } from './tools/todo.tools';
import { WeatherModule } from '../weather/weather.module';
import { CalendarModule } from '../calendar/calendar.module';
import { TodosModule } from '../todos/todos.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { MCPServer } from '../entities/mcp-server.entity';
import { WebSearchModule } from '../web-search/web-search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MCPServer]),
    WebSearchModule,
    WeatherModule,
    CalendarModule,
    TodosModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [
    McpController,
    McpGithubController,
    McpWebSearchController,
    McpOauthController,
    McpOauthCompatController,
    MCPServersController,
  ],
  providers: [
    McpService,
    McpCapabilityCatalogBuilder,
    MCPServersService,
    McpRequestContextService,
    McpSessionAuthService,
    McpOauthService,
    WeatherTools,
    CalendarTools,
    TodoTools,
  ],
  exports: [McpService, MCPServersService],
})
export class McpModule {}
