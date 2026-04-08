/**
 * 兼容导出层（Barrel）
 *
 * 说明：
 * - 目前保留 `./chains` 作为统一入口，避免影响既有 import 路径。
 * - 新代码建议直接从 `intent` / `extractors/*` / `parsers` 按需导入。
 * - 待上层调用全部迁移完成后，可评估移除此兼容层。
 */
export { detectIntent } from './intent';
export {
  extractTodoEntities,
  analyzeTodoSchedule,
  type TodoAnalysisResult,
} from './extractors/todo';
export { extractEventEntities } from './extractors/event';
export {
  extractWeatherQueryContext,
  type WeatherQueryContext,
} from './extractors/weather';
export { cleanTitle } from './parsers';
