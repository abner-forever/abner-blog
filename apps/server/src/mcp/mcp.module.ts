import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { WeatherTools } from './tools/weather.tools';
import { CalendarTools } from './tools/calendar.tools';
import { TodoTools } from './tools/todo.tools';
import { WeatherModule } from '../weather/weather.module';
import { CalendarModule } from '../calendar/calendar.module';
import { TodosModule } from '../todos/todos.module';

@Module({
  imports: [WeatherModule, CalendarModule, TodosModule],
  controllers: [McpController],
  providers: [McpService, WeatherTools, CalendarTools, TodoTools],
  exports: [McpService],
})
export class McpModule {}
