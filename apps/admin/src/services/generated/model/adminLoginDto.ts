export interface AdminLoginDto {
  username: string;
  /** @minLength 6 */
  password: string;
}
