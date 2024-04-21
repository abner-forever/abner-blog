import { HOSTS } from "@/constant";

export const ViteEnv = import.meta.env.MODE;
const HOST = HOSTS[ViteEnv];
const PROXY_ENV = ViteEnv === "online" ? "/api" : "/dev_api";

interface ConfigItem {
  api: string;
  imageServer: string;
}
interface Config {
  dev: ConfigItem;
  online: ConfigItem;
}

const config: Config = {
  dev: {
    api: HOST + PROXY_ENV,
    imageServer: "http://localhost:8080",
  },
  online: {
    api: HOST + PROXY_ENV,
    imageServer: HOST,
  },
};

const currentConfig = ViteEnv === "online" ? config.online : config.dev;

export default currentConfig;
