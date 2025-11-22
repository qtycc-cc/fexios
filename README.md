# Fexios-Browser

## 简介

对fetch的封装
拥有以下功能

- 自动`await json`
- 有拦截器
- 服务器响应放在data里面
- 请求配置拥有泛型

## 安装

```bash
npm i fexios-browser
```

```bash
pnpm add fexios-browser
```

## 基本使用

```ts
type UserRequest = {
    account: string,
    password: string,
  };

type UserResponse = UserRequest & {
  token: string,
};
// 请求类型和响应类型
const api = new Fexios<UserRequest, UserResponse>({
  baseURL: "http://xxx",
  headers: { "Content-Type": "application/json" }
});

const response = await api.post('/api/v1/login', {
  account: "13813386277",
  password: "123456"
});

if (response.type === 'json') { // 如果能够自动json处理
  console.log(response.data satisfies UserResponse);
} else { // 否则返回Response
  console.log(response.data satisfies Response);
}
```

## 拦截器

```ts
// 请求拦截器
api.interceptors.request.use((config) => {
  console.log({
    message: 'Request in interceptor',
    data: config,
  });
  return config;
}, (error) => {
  console.error({
    message: 'An error occurred during the request',
    reason: error,
  });
  return Promise.reject(error);
});
// 响应拦截器
api.interceptors.response.use((response) => {
  console.log({
    message: 'Response in interceptor',
    data: response,
  });
  return response;
}, (error) => {
  console.error({
    message: 'An error occurred during the response',
    reason: error,
  });
});
```
