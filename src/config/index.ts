import { HOSTS } from "@/constant";

const ViteEnv = import.meta.env.MODE;

const HOST = HOSTS[ViteEnv];
const PROXY_ENV = ViteEnv === 'online' ? '/api': '/dev_api';

export{
  HOST,
  PROXY_ENV
}