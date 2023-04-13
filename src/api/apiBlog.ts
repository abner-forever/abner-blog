import Fetch from "./request";
import upLoad from "./upload";
class ApiBlog {
  /**
   * 博客列表数据
   */
  apiArticleList = (params?: any) => {
    return Fetch.get("/article/articleList", params);
  };
  getMyArticleList = (params: any) => {
    return Fetch.get("/article/myarticleList", params);
  };
  /**
   * 博客详情页
   */
  getArticleDetail = (params: any) => {
    return Fetch.get("/article/getArticle", params);
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
    return Fetch.post("/article/updateArticle", params);
  };
  /**
   * 更新文章
   * /article/updateArticle
   */
  addArticle = (params: any) => {
    return Fetch.post("/article/addArticle", params);
  };

  removeArticle = (params: any) => {
    return Fetch.post("/article/removeArticle", params);
  };
  //登录
  login = (params: any) => {
    return Fetch.post("/users/login", params);
  };
  //注册
  register = (params: any) => {
    return Fetch.post("/users/register", params);
  };
  uploadHead = (params: any) => {
    return upLoad.post("/users/head", params);
  };
  /**
   * 获取用户信息
   * @param params 
   * @param type 
   * @returns 
   */
  getUserInfo = (params: any, type?: string) => {
    return Fetch.get("/users/userinfo", params);
  };
  //日志列表
  logList = (params?: any) => {
    return Fetch.get("/logs/list", params);
  };
}

export default new ApiBlog();
