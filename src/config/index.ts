import { HOSTS } from "@/constant";

const ViteEnv = import.meta.env.MODE;
console.log('---ViteEnv---',ViteEnv);

const HOST = HOSTS[ViteEnv];

export{
  HOST
}