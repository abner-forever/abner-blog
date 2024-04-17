import Http from "@/services/http";
import { Toast } from "antd-mobile";
const request = new Http({
  headers: {
    "Content-Type": "application/json",
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
    response(response: any, options?: any) {
      return new Promise((resolve, reject) => {
        try {
          if (response.success) {
            resolve(response.data);
          } else {
            const { showToast } = options || {};
            if (showToast) {
              Toast.show(response.message);
              resolve(null)
            }else{
              reject(new Error(response.message));
            }
          }
        } catch (error: any) {
          reject(error);
        }
      });
    },
  },
});
export default request;
