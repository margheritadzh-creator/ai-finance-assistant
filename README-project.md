# AI Finance Assistant

## 智财助手：智能个人财务管理系统

> 基于 Next.js、Spring Boot、PostgreSQL 与大语言模型构建的全栈智能财务管理平台。

---

## 在线访问

### 正式部署链接

| 服务                  | 地址                                                               |
| ------------------- | ---------------------------------------------------------------- |
| 在线系统                | https://ai-finance-assistant-eight.vercel.app                    |
| 后端 API              | https://finance-backend-y8un.onrender.com                        |
| 后端健康检查              | https://finance-backend-y8un.onrender.com/actuator/health        |
| 公开代码仓库              | https://github.com/margheritadzh-creator/ai-finance-assistant    |
| GitHub Classroom 仓库 | https://github.com/cs-sbs/personal-project-margheritadzh-creator |

在线系统没有预设公共账号，访问后可自行注册新用户。

> Render 免费后端长时间无人访问后可能进入休眠状态。第一次打开系统时，后端唤醒可能需要几十秒，请稍候后再次操作。

---

## 1. 项目简介

AI Finance Assistant 是一个面向个人用户的智能财务管理系统，对应课程选题：

**智能多维财务顾问（AI Financial Advisor）**

系统围绕以下完整业务闭环设计：

```text
记录消费
→ 自动分类
→ 异常检测
→ 预算管理
→ 数据分析
→ 支出预测
→ 健康评分
→ 省钱建议
→ AI 财务咨询
```

用户可以通过手动输入、自然语言或语音方式记录消费。系统会自动提取消费信息、推荐账单分类、检查异常金额，并结合历史账单、月度预算和个人偏好，生成财务统计、下月支出预测、财务健康评分及个性化省钱建议。

---

## 2. 核心功能

### 2.1 用户注册与身份认证

* 用户注册
* 用户登录
* BCrypt 密码加密
* JWT Access Token
* Spring Security 无状态鉴权
* 登录状态检查
* 用户数据隔离
* 前后端跨域配置

### 2.2 消费账单管理

* 新增账单
* 查看账单
* 编辑账单
* 删除账单
* 分页查询
* 关键词搜索
* 分类筛选
* 日期范围筛选
* 金额范围筛选
* 异常等级筛选
* 按时间或金额排序
* 多笔账单批量保存

### 2.3 AI 自动分类

系统会结合以下内容识别账单分类：

* 消费项目名称
* 商家名称
* 账单备注
* 原始自然语言文本
* 数据库中的可用消费分类

分类结果包含：

* 分类代码
* 分类名称
* 置信度
* 分类理由
* 是否需要用户复核

模型只能从系统提供的分类中选择。若模型返回无效分类，后端会自动回退到 `OTHER`。

### 2.4 自然语言结构化记账

用户可以输入：

```text
今天中午买了两杯咖啡，一共38元，
晚上打车回家花了46元。
```

系统会将其拆分成多条结构化账单，并提取：

* 消费项目
* 商家
* 金额
* 币种
* 数量
* 单位
* 消费时间
* 分类
* 备注
* AI 置信度

AI 结果会先作为待确认草稿展示，用户可以修改后再保存。

### 2.5 中英文语音记账

* 浏览器语音识别
* 中文普通话识别
* 英语识别
* 语音实时转文字
* 语音文本交给 AI 结构化处理
* 多笔消费自动拆分
* 识别结果人工修改
* 批量保存
* 默认语音语言与用户偏好联动

### 2.6 异常金额检测

系统综合以下信息判断账单金额是否异常：

* 商品价格参考规则
* 商品数量
* 单位价格
* 用户所在地区
* 地区物价系数
* 用户消费水平
* 用户历史同类消费中位数
* 用户异常提醒设置

异常等级包括：

| 等级        | 含义          |
| --------- | ----------- |
| `NONE`    | 金额处于合理范围    |
| `NOTICE`  | 金额相对异常，建议检查 |
| `WARNING` | 金额明显异常，需要确认 |

用户可以在偏好设置中关闭异常提醒。

### 2.7 用户偏好设置

用户可以设置：

* 所在地区
* 地区代码
* 地区物价系数
* 日常消费水平
* 月收入
* 默认月预算
* 是否启用异常提醒
* 异常提醒灵敏度
* 页面语言
* 语音识别语言
* 默认币种

这些偏好会参与：

* 账单结构化提取
* 异常金额判断
* 省钱建议生成
* AI 财务顾问回答

### 2.8 月度预算管理

* 设置月度总预算
* 设置分类预算
* 修改已有预算
* 删除预算
* 查看预算使用率
* 查看已用金额
* 查看剩余金额
* 自动判断预算状态
* 查看不同月份预算

### 2.9 多表联动统计

系统联合查询用户、账单、分类、预算、偏好、预测和健康评分等数据，计算：

* 本月总支出
* 本月消费笔数
* 日均支出
* 总预算
* 预算使用率
* 剩余预算
* 分类消费金额
* 分类消费比例
* 最高消费分类
* 最近六个月支出趋势
* 异常消费数量
* 下月支出预测
* 财务健康评分

### 2.10 下月支出预测

预测服务最多读取最近六个月的历史支出。

| 可用历史月份 | 预测方式        |
| ------ | ----------- |
| 0个月    | 数据不足估算      |
| 1至2个月  | 历史平均值       |
| 3个月    | 加权移动平均      |
| 4至6个月  | 加权移动平均与趋势修正 |

预测结果包括：

* 目标月份
* 预测金额
* 预测下限
* 预测上限
* 使用的历史月份数量
* 预测算法
* 模型版本
* 解释说明

预测数值由后端确定性算法计算，不由大语言模型直接决定。

### 2.11 财务健康度评分

系统从五个维度计算财务健康评分：

| 评分维度  | 主要依据       |
| ----- | ---------- |
| 预算控制  | 支出与预算的关系   |
| 消费稳定性 | 多个月份支出波动   |
| 结余能力  | 收入、预算和实际支出 |
| 消费结构  | 支出是否过度集中   |
| 风险控制  | 异常账单数量和比例  |

最终等级包括：

* `EXCELLENT`
* `GOOD`
* `FAIR`
* `RISK`

### 2.12 个性化省钱建议

系统会结合以下真实数据生成建议：

* 用户所在地区
* 物价系数
* 消费水平
* 月收入
* 默认预算
* 当前预算
* 分类消费结构
* 支出预测
* 财务健康评分

建议使用 Markdown 展示，并支持状态管理：

* 待处理
* 已采纳
* 已忽略

### 2.13 AI 财务顾问

系统提供类 ChatGPT 财务咨询页面，支持：

* 创建多个咨询会话
* 自动生成会话标题
* 保存历史消息
* 读取最近对话上下文
* 结合当前财务数据回答问题
* Markdown 渲染
* SSE 流式输出
* 会话归档
* Loading 状态
* 错误处理

---

## 3. 页面路由

| 路由           | 页面        |
| ------------ | --------- |
| `/`          | 系统入口      |
| `/register`  | 用户注册      |
| `/login`     | 用户登录      |
| `/dashboard` | 财务总览      |
| `/expenses`  | 账单管理      |
| `/voice`     | 语音与自然语言记账 |
| `/analytics` | 财务数据分析    |
| `/advice`    | 个性化省钱建议   |
| `/advisor`   | AI 财务顾问   |
| `/settings`  | 偏好与预算设置   |


---

### 主要数据关系说明

1. 一个用户拥有一条用户偏好记录。
2. 一个用户可以拥有多条账单、预算、预测和健康评分。
3. 每条账单必须属于一个分类。
4. AI 或语音识别产生的多笔账单可以归属于同一个记录批次。
5. 省钱建议可以关联对应月份的财务健康评分。
6. 一个 AI 会话包含多条用户和助手消息。
7. Prompt 模板独立存储，并通过 `code + version` 管理版本。

---


## 4. Prompt 管理

项目没有将完整 Prompt 直接写死在 Controller 中，而是建立了 `prompt_template` 数据表。

当前模板编码：

```text
EXPENSE_EXTRACTION
EXPENSE_CLASSIFICATION
SAVING_ADVICE
FINANCIAL_CHAT
PREDICTION_EXPLANATION
ANOMALY_EXPLANATION
```

模板包含：

* System Prompt
* User Prompt Template
* Response Schema
* Prompt 版本
* 描述
* 启用状态

业务服务通过 `PromptTemplateService` 按编码读取启用模板，并将：

```text
{{categories}}
{{user_preference}}
{{financial_context}}
{{conversation_history}}
{{user_message}}
```

等变量替换为真实业务数据。

Prompt 的详细设计和迭代过程见：

```text
PROMPT_REPORT.md
```

---

## 5. 技术栈

### 前端

* Next.js 16.2.9
* React 19.2.4
* TypeScript
* Tailwind CSS 4
* Recharts
* React Markdown
* Remark GFM
* Zod
* Lucide React

### 后端

* Java 21
* Spring Boot 3.5.14
* Spring Web
* Spring Data JPA
* Spring Security
* OAuth2 Resource Server
* Spring AI 1.1.8
* Bean Validation
* Spring Boot Actuator
* Maven

### 数据库

* PostgreSQL 16
* Flyway
* JSONB
* JPA
* 数据库索引
* 唯一约束
* 外键约束
* PGVector 扩展支持

### AI

* Anthropic 兼容模型接口
* Spring AI ChatClient
* 数据库 Prompt 模板
* 结构化结果映射
* SSE 流式生成
* 主模型与快速模型分工

### 部署

* Vercel：Next.js 前端
* Render Web Service：Spring Boot 后端
* Render PostgreSQL：云数据库
* Docker
* Docker Compose
* Docker 多阶段构建
* 容器健康检查

---

## 6. 项目结构

```text
personal-project-margheritadzh-creator/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── schemas/
│   │   └── types/
│   ├── Dockerfile
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
├── src/
│   └── main/
│       ├── java/cs/sbs/web/personalprojectweb2026/
│       │   ├── config/
│       │   ├── controller/
│       │   ├── dto/
│       │   ├── entity/
│       │   ├── exception/
│       │   ├── repository/
│       │   ├── security/
│       │   ├── service/
│       │   └── util/
│       └── resources/
│           ├── db/migration/
│           └── application.properties
├── Dockerfile
├── docker-compose.yml
├── pom.xml
├── .env.example
├── README.md
├── README-project.md
└── PROMPT_REPORT.md
```

其中：

* `README.md`：老师提供的课程项目要求
* `README-project.md`：本项目完整说明
* `PROMPT_REPORT.md`：Prompt 设计与迭代报告

---

## 6. 本地运行

### 6.1 环境变量

复制示例文件：

```bash
cp .env.example .env
```

需要配置：

```text
POSTGRES_PASSWORD
DATABASE_PASSWORD
JWT_SECRET
ANTHROPIC_AUTH_TOKEN
```

不要将真实 `.env` 上传到 GitHub。

### 6.2 Docker 一键启动

```bash
docker compose up --build -d
```

访问：

```text
前端：http://localhost:3000
后端：http://localhost:8080
健康检查：http://localhost:8080/actuator/health
PostgreSQL：localhost:5433
```

停止服务：

```bash
docker compose down
```

删除数据库卷：

```bash
docker compose down -v
```

`-v` 会删除数据库中的用户和账单数据。

### 6.3 本地开发模式

启动数据库：

```bash
docker compose up -d postgres
```

启动后端：

```bash
./mvnw spring-boot:run
```

启动前端：

```bash
cd frontend
npm ci
npm run dev
```

---

## 7. 部署说明

### 前端

```text
平台：Vercel
Root Directory：frontend
Framework：Next.js
环境变量：
NEXT_PUBLIC_API_BASE_URL=https://finance-backend-y8un.onrender.com
```

### 后端

```text
平台：Render
Runtime：Docker
Dockerfile：项目根目录 Dockerfile
Health Check Path：/actuator/health
```

### 数据库

```text
平台：Render PostgreSQL
版本：PostgreSQL 16
连接方式：Render Internal Hostname
迁移方式：Flyway
```

---

## 8. 安全设计

* BCrypt 密码加密
* JWT 无状态鉴权
* 用户数据隔离
* 后端 Bean Validation
* 数据库约束
* CORS 白名单
* 环境变量管理敏感信息
* `.env` 不提交到 Git
* AI 结果经过后端二次校验
* 异常金额需要用户确认
* AI 无权直接执行数据库修改指令

---

## 9. 当前限制

* Render 免费服务休眠后首次请求可能较慢。
* Render 免费 PostgreSQL 有使用期限。
* 语音识别依赖浏览器 Speech Recognition API。
* 推荐使用最新版 Chrome。
* AI 功能依赖外部模型 API。
* 历史数据不足时，支出预测的参考价值有限。
* 当前版本没有实现完整的中英文界面切换。
* 当前版本没有实现 RAG 或向量语义检索。
* 当前没有 Prompt 后台管理页面。
* 当前尚未完整记录每次 AI 请求的 Token 消耗。

---

## 10. AI 辅助开发说明

本项目在开发过程中使用生成式 AI 辅助完成：

* 需求分析
* 架构规划
* 前后端代码建议
* 编译和运行错误排查
* 数据库结构检查
* Docker 与部署配置
* UI 布局与文案调整
* README 与 Prompt 报告整理

所有关键功能、代码修改、环境配置和最终结果均由开发者检查、运行和确认。

**AI 辅助开发比例：约 60%**

---


## 11. 项目信息

* 课程：2026春季 Web 应用程序开发
* 项目主题：智能多维财务顾问
* 项目英文名：AI Finance Assistant
* 项目中文名：智财助手
* 前端部署：https://ai-finance-assistant-eight.vercel.app
* 后端部署：https://finance-backend-y8un.onrender.com
