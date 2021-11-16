import Http from "@/utils/http";
import { message } from "antd";
import { HOST } from "../config";
const request = new Http({
  HOST,
  headers: { "Content-Type": "application/json" },
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
        let code = res.code;
        if (code === 200 && res.data) {
          resolve(res.data);
        } else if (code === 500) {
          message.warn(res.msg);
          reject(res.msg);
        }
      });
    },
  },
});
export default request;
