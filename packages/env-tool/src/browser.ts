import { injectEnvToolStyles } from './inject-styles.js';
import { AbnerEnvTool } from './env-tool.js';

injectEnvToolStyles();

/** IIFE 下与历史 UMD 一致：全局变量即为单例实例 */
export default AbnerEnvTool;
