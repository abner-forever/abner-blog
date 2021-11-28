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
        try {
          let code = res.code;
        if (code === 200 ) {
          res.message && message.success(res.message);
          resolve(res.data);
        } else if (code === 500) {
          message.warn(res.msg);
          reject(res.msg);
        }
        } catch (error: any) {
          message.error(error.message);
          reject(error)
        }
      });
    },
  },
});
export default request;
