import Http from "@/utils/http";
import Cookies from "js-cookie"

import { HOST } from "../config";
const request = new Http({
  HOST,
  headers: { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${Cookies.get('user-token')}`,
 },
  interceptors: {
    request(body: Record<string, string>) {
      let adapterData = () => {
        let data = {
          ...body,
        };
        return JSON.stringify(data);
      };
      return adapterData();
    },
    response(res: any) {
      return new Promise((resolve, reject) => {
        try {
          let code = res.code;
          if (code === 0 || code === 200) {
            resolve(res.data);
          } else if (code === 500) {
            const error = Error(res.message)
            reject(error);
          }
        } catch (error: any) {
          reject(error)
        }
      });
    },
  },
});
export default request;
