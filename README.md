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

## 使用

```ts
type UserRequest = {
  account: string,
  password: string,
};

const api = new Fexios<UserRequest>({
  baseURL: "http://xxx",
  headers: { "Content-Type": "application/json" }
});

const response = await api.post('/api/v1/login', {
    data: {
        account: "admin",
        password: "admin"
    }
});
```