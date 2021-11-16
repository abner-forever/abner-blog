import Http from "../utils/http";
import { message } from "antd";
import { HOST } from "../config";
const upLoad = new Http({
  HOST: HOST,
  headers: { "Content-Type": "multipart/form-data;" },
  interceptors: {
    request(body: any) {
      let adapterData = body;
      return adapterData;
    },
    response(res: any) {
      return new Promise((resolve, reject) => {
        let code = res.code;
        if (code === 200) {
          resolve(res.data);
        } else if (code === 500) {
          message.warn(res.msg);
          reject(res.msg);
        }
      });
    },
  },
});
export default upLoad;
