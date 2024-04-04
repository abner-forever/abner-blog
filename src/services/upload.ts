import Http from "./http";
const upLoad = new Http({
  interceptors: {
    response(response: any) {
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
export default upLoad;
