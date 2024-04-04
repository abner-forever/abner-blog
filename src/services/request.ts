import Http from "@/services/http";
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
            reject(new Error(response.message));
          }
        } catch (error: any) {
          reject(error);
        }
      });
    },
  },
});
export default request;
