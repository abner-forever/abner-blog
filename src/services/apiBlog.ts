import Fetch from "./request";
import upLoad from "./upload";
class ApiBlog {
  /** 笔记 */
  apiArticleList = (params?: any) => {
    return Fetch.get("/articles", params);
  };
  getMyArticleList = () => {
    return Fetch.get("/articles/my");
  };
  updateArticle = (params: any) => {
    return Fetch.post("/articles/update", params);
  };
  addArticle = (params: any): Promise<any> => {
    return Fetch.post("/articles/add", params);
  };
  removeArticle = (params: any) => {
    return Fetch.post("/articles", params, { method: "delete" });
  };
  getArticleDetail = ({ id }: any) => {
    return Fetch.get(`/articles/detail/${id}`);
  };
  /** 评论 */
  addComment = (params: any) => {
    return Fetch.post("/articles/addComment", params);
  };
  removeComment = (params: any) => {
    return Fetch.post("/articles/removeComment", params);
  };
  getCommentList = (params: any) => {
    return Fetch.get("/articles/getArticleComments", params);
  };

  /** 登录 */
  login = (params: any) => {
    return Fetch.post("/login", params);
  };
  authCode = (params: any) => {
    return Fetch.post("/authCode", params);
  };
  /** 用户信息 */
  uploadAvator = (params: any) => {
    return upLoad.post("/files/upload/avator", params);
  };
  updateUserInfo = (params: any) => {
    return Fetch.post("/user/update", params);
  };
  requestUserInfo = (params?: any) => {
    return Fetch.get("/user/userInfo", params);
  };
  uploadMarkdownImage = (params: any) => {
    return upLoad.post("/files/upload/markdown", params);
  };
  //日志列表
  logList = (params?: any) => {
    return Fetch.get("/logs/list", params);
  };

  /** 任务列表 */
  getTodoList = (params?: { type: string }) => {
    return Fetch.get("/task/todolist", params);
  };
  getTodoListByMonth = (params?: { year: number; month: number }) => {
    return Fetch.get("/task/todolistByMonth", params);
  };
  updateTaskTodo = (params: any) => {
    return Fetch.post("/task/update", params);
  };
  removeTodo = (params: any) => {
    return Fetch.post("/task/delete", params, { method: "delete" });
  };
  addTask = (params: any) => {
    return Fetch.post("/task/add", params, { showToast: true });
  };
}

const apiBlog = new ApiBlog();

export default apiBlog;
