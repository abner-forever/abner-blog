export type ConversationsControllerListParams = {
  /**
   * @minimum 1
   */
  page?: number;
  /**
   * @minimum 1
   * @maximum 100
   */
  pageSize?: number;
};
