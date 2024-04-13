import Fetch from "./request";
import upLoad from "./upload";
class ApiBlog {
  /**
   * 博客列表数据
   */
  apiArticleList = (params?: any) => {
    return Fetch.get("/article/list", params);
  };
  getMyArticleList = () => {
    return Fetch.get("/article/myarticleList");
  };
  /**
   * 博客详情页
   */
  getArticleDetail = ({ id }: any) => {
    return Fetch.get(`/article/deatil/${id}`);
  };
  /**
   * 添加文章评论
   */
  addComment = (params: any) => {
    return Fetch.post("/article/addComment", params);
  };
  /**
   * 删除文章评论
   */
  removeComment = (params: any) => {
    return Fetch.post("/article/removeComment", params);
  };
  /**
   * 获得文章评论
   */
  getCommentList = (params: any) => {
    return Fetch.get("/article/getArticleComments", params);
  };

  /**
   * 更新文章
   * /article/updateArticle
   */
  updateArticle = (params: any) => {
    return Fetch.post("/article/update", params);
  };
  /**
   * 添加文章
   * /article/addArticle
   */
  addArticle = (params: any): Promise<any> => {
    return Fetch.post("/article/add", params);
  };

  removeArticle = (params: any) => {
    return Fetch.post("/article/delete", params);
  };
  //登录
  login = (params: any) => {
    return Fetch.post("/login", params);
  };

  uploadAvator = (params: any) => {
    return upLoad.post("/files/upload/avator", params);
  };
  updateUserInfo = (params: any) => {
    return Fetch.post("/user/updateUserInfo", params);
  };
  uploadMarkdownImage = (params: any) => {
    return upLoad.post("/files/upload/markdown", params);
  };
  /**
   * 获取用户信息
   * @param params
   * @returns
   */
  requestUserInfo = (params?: any) => {
    return Fetch.get("/user/userInfo", params);
  };
  //日志列表
  logList = (params?: any) => {
    return Fetch.get("/logs/list", params);
  };
  getTodoList = () => {
    return Fetch.get("/task/todolist");
  };

  updateTaskTodo = (params: any) => {
    return Fetch.post("/task/update", params);
  };
}

const apiBlog = new ApiBlog();

export default apiBlog;
