# 博客系统 (BlogSys)

基于 Astro 构建的现代化博客系统，支持本地博客管理、评论系统和用户管理。原型是用 MetaGPTX 构建的。

## 🚀 特性

- **本地博客管理**: 只需在本地目录中增删改 `.md` 文件，即可自动在前端展示
- **评论系统**: 完整的评论功能，支持用户互动
- **用户管理系统**: 包含用户注册、登录等功能
- **本地数据库**: 使用 SQLite3 进行本地数据存储，无需额外配置
- **服务器端渲染**: 基于 Astro 的 SSR 功能，提供更好的SEO和性能

## 📋 技术栈

- **前端框架**: Astro + MDX
- **数据库**: SQLite3
- **运行时**: Node.js
- **样式**: CSS

## 🛠️ 快速开始
### 下载repo
```bash
git clone https://github.com/Tom-0727/blogsys.git  
cd blogsys
```

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```


## 📝 博客管理

1. 在 `src/content/blog/` 目录下创建 `.md` 文件
2. 文件将自动被系统识别并在前端展示
3. 支持 Markdown 语法和 MDX 组件

## 🗂️ 项目结构

```
├── src/
│   ├── content/blog/     # 博客文章目录
│   ├── pages/           # 页面路由
│   │   └── api/         # API 路由
│   ├── components/      # 组件
│   └── layouts/         # 布局模板
├── public/              # 静态资源
└── data/               # 数据库文件(从repo下载没有这个文件夹，但启动会自动生成)
```

# 部署
- 基于阿里云服务器的部署
## 在阿里云平台完成以下准备
- 创建实例
    1. 登陆https://www.aliyun.com/
    2. 找到云服务器ECS创建实例，配置2vcpu + 2G内存 + 20G硬盘就完全够了
- 购买域名
    1. 在阿里云平台找到“域名”
    2. 根据需求购买即可，记得完成实名注册

## 项目跑通
- 登陆阿里云租的实例：比如用ssh连接
- 下载repo并跑通：
    ```bash
    # 下拉代码库
    git clone https://github.com/Tom-0727/blogsys.git
    cd blogsys

    # 开发模式下是否能跑通
    npm install
    npm run dev

    # 生产模式下是否能跑通
    npm run build
    npm run preview
    ```
- 跑通后，用pm2跑通，实现服务常驻（就是说即使关闭ssh连接服务依然会跑）
    ```bash
    npm install -g pm2
    pm2 start "npm run preview" --name blogsys

    # 设置开机自启
    pm2 startup
    pm2 save
    ```
- 经过上述操作之后，你的服务就常态化跑起来了，接下来为了让公网能看到，还需要设置反向代理和HTTPS证书部署（更安全）
    ```bash
    # 安装和设置反向代理
    sudo apt install -y nginx
    sudo systemctl enable --now nginx
    ## 下面这个地址不用改，是默认的
    touch /etc/nginx/sites-available/blogsys.conf
    ## 往文件里填入下面的内容
    '''
    server {
            listen 443 ssl;
            server_name 改成你的域名比如tom-blogs.top www.tom-blogs.top;

            ssl_certificate /etc/letsencrypt/live/tom-blogs.top/fullchain.pem;
            ssl_certificate_key /etc/letsencrypt/live/tom-blogs.top/privkey.pem;

            location / {
                proxy_pass http://127.0.0.1:4321;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
            }
        }
    '''
    ## 保存并 reload
    sudo nginx -t && sudo systemctl reload nginx

    # 申请HTTPS证书
    sudo apt install certbot python3-certbot-nginx -y
    sudo certbot --nginx -d 你的域名1 -d 你的域名2 ...
    ```
- 大功告成！这时候只需要在阿里云管理-实例管理-安全组-管理规则-入方向 添加443端口和80端口，全部设置成所有IPv4即可
- 然后大家就可以从公网访问你的网站了！
