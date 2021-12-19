import { HOSTS } from "@/constant";

const ViteEnv = import.meta.env.MODE;

const HOST = HOSTS[ViteEnv];
const PROXY_ENV = ViteEnv === 'online' ? '/api': 'dev_api';

console.log('---ViteEnv---HOST---',ViteEnv,HOST);
export{
  HOST,
  PROXY_ENV
}