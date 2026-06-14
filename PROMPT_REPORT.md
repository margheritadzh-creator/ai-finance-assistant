# AI Finance Assistant Prompt 设计与迭代报告

## 1. 报告目的

本报告记录 AI Finance Assistant 中 Prompt 的设计目标、模板管理方式、动态变量注入、模型参数选择、结构化输出、后端校验和迭代过程。

项目中的 AI 功能包括：

1. 消费账单自动分类
2. 自然语言多账单结构化提取
3. 个性化省钱建议
4. AI 财务顾问多轮对话
5. 异常金额解释模板
6. 支出预测解释模板

项目通过 Spring AI `ChatClient` 调用 Anthropic 兼容模型接口。

---

## 2. Prompt 设计原则

### 2.1 不允许虚构财务数据

财务系统涉及用户真实金额和消费行为，因此所有 Prompt 均强调：

* 不得虚构用户没有表达的消费
* 不得虚构收入、预算或历史记录
* 数据不足时必须直接说明
* 不得将预测描述为确定事实
* 不得擅自修改后端已经计算的数值

### 2.2 模型理解与后端计算分离

大语言模型负责：

* 理解自然语言
* 提取结构化字段
* 判断消费语义分类
* 解释财务数据
* 生成自然语言建议
* 进行多轮财务咨询

后端负责：

* 金额合法性校验
* 异常金额判断
* 预算统计
* 支出趋势计算
* 下月支出预测
* 财务健康评分
* 权限和数据隔离

这种设计可以减少模型幻觉，并保证关键数值具有可重复性。

### 2.3 限制输出范围

分类 Prompt 只能从数据库提供的分类代码中选择。

如果模型输出无效分类：

```text
模型分类代码
→ 后端查询数据库
→ 找不到时回退到 OTHER
```

模型不能创建新的分类。

### 2.4 结构化结果优先

账单分类和账单提取要求模型返回 JSON 结构。

后端通过 Spring AI：

```java
.entity(ModelResult.class)
```

将模型输出转换成 Java Record，再进行业务校验。

### 2.5 Prompt 与业务代码分离

完整 Prompt 不直接写在 Controller 中，而是存入 PostgreSQL 的 `prompt_template` 表。

这样可以实现：

* Prompt 统一管理
* Prompt 版本记录
* 启用版本切换
* 业务代码与提示词解耦
* 后续后台管理和 A/B 测试

---

## 3. Prompt 模板数据结构

`prompt_template` 表包含：

| 字段                     | 作用          |
| ---------------------- | ----------- |
| `code`                 | Prompt 功能编码 |
| `version`              | 模板版本        |
| `system_prompt`        | 系统级行为约束     |
| `user_prompt_template` | 动态业务数据模板    |
| `response_schema`      | 预期返回结构      |
| `description`          | 模板说明        |
| `active`               | 当前是否启用      |

数据库约束保证：

```text
code + version 唯一
```

并保证一种 Prompt 编码最多只有一个启用版本。

---

## 4. PromptTemplateService

项目通过 `PromptTemplateService` 统一读取和渲染 Prompt。

核心流程：

```text
业务服务提供 Prompt code
→ 查询 active = true 的模板
→ 读取 System Prompt
→ 读取 User Prompt Template
→ 替换 {{variable_name}}
→ 返回渲染结果和版本号
```

变量格式：

```text
{{categories}}
{{user_preference}}
{{financial_context}}
{{conversation_history}}
{{user_message}}
```

字符串变量直接写入。

对象、集合和 DTO 会通过 Jackson `ObjectMapper` 序列化为 JSON。

如果模板需要某个变量，但业务代码没有提供，系统会抛出：

```text
Prompt缺少变量：变量名
```

这可以避免不完整 Prompt 被发送到模型。

---

## 5. System Prompt 与 User Prompt 的分工

### System Prompt

System Prompt 负责长期稳定的规则：

* 模型身份
* 任务范围
* 禁止行为
* 输出格式
* 财务安全
* 表达风格
* 不得虚构
* 不得越权

### User Prompt

User Prompt 负责每次请求变化的数据：

* 用户输入
* 分类列表
* 用户偏好
* 财务统计
* 预算信息
* 健康评分
* 对话历史
* 当前问题

这种拆分使规则与数据相互独立。

---

## 6. 当前 Prompt 模板

项目定义了六种 Prompt 编码：

```text
EXPENSE_EXTRACTION
EXPENSE_CLASSIFICATION
SAVING_ADVICE
FINANCIAL_CHAT
PREDICTION_EXPLANATION
ANOMALY_EXPLANATION
```

其中：

| Prompt                   | 当前状态             |
| ------------------------ | ---------------- |
| `EXPENSE_EXTRACTION`     | 已接入模型调用          |
| `EXPENSE_CLASSIFICATION` | 已接入模型调用          |
| `SAVING_ADVICE`          | 已接入模型调用          |
| `FINANCIAL_CHAT`         | 已接入模型调用          |
| `PREDICTION_EXPLANATION` | 模板已建立，当前使用后端固定解释 |
| `ANOMALY_EXPLANATION`    | 模板已建立，当前使用后端固定解释 |

---

## 7. 消费分类 Prompt

### 7.1 功能编码

```text
EXPENSE_CLASSIFICATION
```

### 7.2 设计目标

根据消费项目、商家、备注和原始文本，将账单映射到已有消费分类。

### 7.3 System Prompt 主要约束

1. 只能使用系统提供的分类代码。
2. 不允许创建新分类。
3. 综合商品、商家、备注和原始内容判断。
4. 信息不足时选择 `OTHER`。
5. 置信度必须在0到1之间。
6. 只输出结构化 JSON。

### 7.4 动态变量

```text
categories
item_name
merchant
note
raw_text
```

### 7.5 预期结果

```json
{
  "categoryCode": "FOOD",
  "confidence": 0.93,
  "reason": "咖啡属于餐饮消费"
}
```

### 7.6 模型参数

```text
模型：快速模型
temperature：0.1
maxTokens：500
调用方式：非流式结构化调用
```

分类任务输出范围较小，因此使用快速模型降低延迟和成本。

### 7.7 后端校验

* 分类代码统一转为大写
* 查询数据库中是否存在该分类
* 无效分类回退至 `OTHER`
* 置信度限制在0到1
* 置信度缺失时使用默认值
* 模型调用失败时返回统一 AI 异常

---

## 8. 多账单结构化提取 Prompt

### 8.1 功能编码

```text
EXPENSE_EXTRACTION
```

### 8.2 输入示例

```text
今天中午买了两杯咖啡花了38元，
晚上打车回家花了46元。
```

### 8.3 设计目标

将一段中文或英文消费描述拆分成一条或多条结构化账单。

### 8.4 System Prompt 约束

1. 不得虚构金额、商品、商家或时间。
2. 一句话包含多笔消费时必须拆分。
3. 金额必须为正数。
4. 未说明币种时使用 CNY。
5. 未说明时间时使用参考时间。
6. 分类只能来自系统分类。
7. 不确定字段使用 `null`。
8. 只输出 JSON。

### 8.5 动态变量

```text
input_language
reference_time
categories
user_preference
user_text
```

用户偏好中包含：

* 地区
* 物价系数
* 消费水平
* 默认币种

### 8.6 预期结果

```json
{
  "transactions": [
    {
      "itemName": "咖啡",
      "merchant": null,
      "amount": 38,
      "currency": "CNY",
      "quantity": 2,
      "unit": "杯",
      "categoryCode": "FOOD",
      "occurredAt": "2026-06-15T12:00:00Z",
      "note": null,
      "confidence": 0.92
    },
    {
      "itemName": "打车",
      "merchant": null,
      "amount": 46,
      "currency": "CNY",
      "quantity": 1,
      "unit": "次",
      "categoryCode": "TRANSPORT",
      "occurredAt": "2026-06-15T20:00:00Z",
      "note": null,
      "confidence": 0.91
    }
  ]
}
```

### 8.7 模型参数

```text
模型：主模型
temperature：0.1
maxTokens：4096
调用方式：非流式结构化调用
```

### 8.8 后端二次校验

模型结果不会直接写入正式账单。

后端还会检查：

* 结果不能为空
* 一次最多50条记录
* 消费项目不能为空
* 金额必须大于0
* 金额不能超过系统最大值
* 无效分类替换为 `OTHER`
* 无效币种替换为 `CNY`
* 无效时间替换为参考时间
* 未来时间替换为参考时间
* 数量小于等于0时改为 `null`
* 置信度限制在0到1
* 置信度低于0.65时标记人工复核
* 分类被替换时标记人工复核

因此最终流程是：

```text
Prompt 约束
+ Java 类型映射
+ 后端业务校验
+ 用户人工确认
```

---

## 9. 个性化省钱建议 Prompt

### 9.1 功能编码

```text
SAVING_ADVICE
```

### 9.2 设计目标

基于用户真实财务数据，生成未来一个月内可执行的省钱建议。

### 9.3 System Prompt 约束

1. 不得虚构收入、账单或消费行为。
2. 尊重地区、预算和消费习惯。
3. 不使用羞辱、说教或制造焦虑的语言。
4. 优先指出改善空间最大的分类。
5. 建议必须能在未来一个月执行。
6. 不推荐股票、基金、保险或借贷产品。
7. 使用人民币。
8. 使用中文 Markdown。

### 9.4 动态变量

```text
user_preference
budget_summary
expense_summary
category_statistics
prediction
health_score
```

### 9.5 模型参数

```text
模型：主模型
temperature：0.2
maxTokens：2048
调用方式：非流式文本生成
输出：中文 Markdown
```

### 9.6 数据来源

建议并非只依赖用户一句话，而是结合：

* 用户偏好
* 本月预算
* 本月支出
* 分类统计
* 下月预测
* 财务健康评分

### 9.7 保存方式

生成结果保存至 `saving_advice` 表，并包含：

* 用户
* 目标月份
* 健康评分
* 标题
* Markdown 内容
* 建议优先级
* 建议状态

---

## 10. AI 财务顾问 Prompt

### 10.1 功能编码

```text
FINANCIAL_CHAT
```

### 10.2 设计目标

支持类 ChatGPT 的个人财务多轮咨询。

### 10.3 动态变量

```text
user_preference
financial_context
conversation_history
user_message
```

### 10.4 财务上下文

`financial_context` 包含当前月份的：

* 总支出
* 消费笔数
* 日均支出
* 预算使用情况
* 分类统计
* 支出趋势
* 异常记录
* 预测结果
* 健康评分

### 10.5 对话历史

系统最多读取最近20条消息。

注入格式：

```json
[
  {
    "role": "USER",
    "content": "我这个月餐饮支出高吗？"
  },
  {
    "role": "ASSISTANT",
    "content": "根据当前账单数据……"
  }
]
```

限制历史数量可以控制 Prompt 长度和 Token 消耗。

### 10.6 模型参数

```text
模型：主模型
temperature：0.2
maxTokens：4096
调用方式：SSE 流式生成
输出：Markdown
```

### 10.7 SSE 事件

| 事件      | 作用        |
| ------- | --------- |
| `start` | 表示生成开始    |
| `delta` | 返回一个文本片段  |
| `done`  | 表示完整回答已保存 |
| `error` | 表示生成失败    |

生成过程中，后端会累积完整回答。只有生成完成后，完整助手消息才写入数据库。

---

## 11. 异常金额解释 Prompt

### 11.1 功能编码

```text
ANOMALY_EXPLANATION
```

### 11.2 设计目标

异常判断由后端完成，模型只负责把结果转换成自然、礼貌的提示。

### 11.3 模板变量

```text
item_name
amount
reference_range
spending_level
price_index
personal_history
anomaly_reason
```

### 11.4 当前实现

该模板已经存入数据库，但当前异常提醒主要由后端确定性逻辑直接生成。

原因：

* 减少模型调用
* 降低等待时间
* 保证提示与异常算法完全一致
* 即使模型不可用，异常检测仍然可以运行

---

## 12. 支出预测解释 Prompt

### 12.1 功能编码

```text
PREDICTION_EXPLANATION
```

### 12.2 设计目标

模型只能解释预测结果，不得重新计算预测金额。

### 12.3 模板变量

```text
target_month
predicted_amount
lower_bound
upper_bound
algorithm
based_on_months
monthly_history
```

### 12.4 当前实现

预测金额和说明当前由 `PredictionService` 根据历史数据量和算法类型生成。

该 Prompt 作为后续可选功能保留。

---

## 13. 模型选择策略

### 快速模型

用于：

```text
EXPENSE_CLASSIFICATION
```

原因：

* 输入较短
* 输出结构简单
* 分类范围固定
* 更关注响应速度和成本

### 主模型

用于：

```text
EXPENSE_EXTRACTION
SAVING_ADVICE
FINANCIAL_CHAT
```

原因：

* 输入内容更长
* 需要处理多条账单
* 需要理解复杂上下文
* 需要生成自然语言和 Markdown
* 需要支持多轮对话

模型通过环境变量配置：

```text
ANTHROPIC_MODEL
ANTHROPIC_SMALL_FAST_MODEL
```

模型名称不直接写死在业务逻辑中。

---

## 14. Prompt 迭代过程

当前数据库中的正式模板版本为 `version = 1`。

以下“阶段”表示设计演进过程，不代表数据库中已经存在多个正式版本。

### 第一阶段：直接发送用户原始文本

初始想法是直接将用户文本发给模型，例如：

```text
午饭35，打车20
```

存在问题：

* 可能返回自然语言
* 多笔消费拆分不稳定
* 分类名称不统一
* 日期和币种格式不统一
* 可能产生不存在的分类
* 无法追踪 Prompt 版本

### 第二阶段：拆分 System Prompt 和 User Prompt

System Prompt 负责：

* 模型身份
* 行为规则
* 禁止虚构
* 输出格式
* 安全边界

User Prompt 负责：

* 用户输入
* 分类列表
* 偏好数据
* 财务上下文

该阶段解决了规则与动态数据混合的问题。

### 第三阶段：增加结构化输出

为分类和账单提取定义固定字段。

业务服务通过：

```java
.entity(ModelResult.class)
```

将输出转换为 Java Record。

效果：

* 减少前端解析难度
* 便于后端校验
* 提高接口稳定性
* 减少模型返回长篇解释

### 第四阶段：分类动态化

不再把分类名称写死在 Prompt 中。

后端每次从数据库读取当前启用分类，并注入：

```text
code
nameZh
nameEn
```

优点：

* 分类调整后无需修改 Prompt
* 避免模型使用失效分类
* 中英文分类均可提供给模型

### 第五阶段：加入用户偏好

账单提取加入：

* 地区
* 地区物价系数
* 消费水平
* 币种

省钱建议和顾问进一步加入：

* 月收入
* 默认预算
* 当前预算
* 分类统计
* 财务健康评分
* 下月预测

该阶段提高了个性化程度。

### 第六阶段：增加后端二次校验

仅依赖 Prompt 无法保证结果完全正确，因此增加：

* 金额范围检查
* 分类存在性检查
* 币种格式检查
* 时间格式检查
* 未来时间检查
* 置信度范围修正
* 空结果检查
* 最大记录数限制
* 低置信度人工复核

### 第七阶段：引入数据库 Prompt 管理

Prompt 从 Java 业务代码中移出，保存到数据库。

增加：

* Prompt code
* Prompt version
* active 状态
* response schema
* 描述信息

业务服务只引用 Prompt 编码。

### 第八阶段：加入多轮上下文与 SSE

AI 财务顾问加入：

* 用户偏好
* 财务统计
* 最近20条消息
* 当前用户问题

同时使用 SSE 流式返回，改善长回答等待体验。

---

## 15. 幻觉与安全控制

### 15.1 财务数据幻觉

风险：

模型可能编造账单、收入或预算。

措施：

* System Prompt 禁止虚构
* 只传入数据库真实数据
* 数据不足时要求直接说明
* 关键数值由后端计算

### 15.2 无效分类

风险：

模型生成不存在的分类。

措施：

* 动态注入分类
* Prompt 禁止创建分类
* 后端查询分类是否存在
* 无效分类回退到 `OTHER`

### 15.3 JSON 格式错误

风险：

模型返回 Markdown 代码块或额外说明。

措施：

* Prompt 要求只输出 JSON
* Spring AI 映射为 Java Record
* 解析失败统一返回 AI 处理异常

### 15.4 不合理金额

风险：

模型返回负数、0或过大金额。

措施：

* Prompt 要求金额为正
* 后端再次检查金额范围
* 不合理结果不能保存

### 15.5 时间错误

风险：

模型产生未来时间或无法解析时间。

措施：

* 提供系统参考时间
* 后端尝试多种时间格式
* 无效时间回退到参考时间
* 明显未来时间不接受

### 15.6 金融建议风险

风险：

模型提供保证收益或高风险投资建议。

措施：

* 禁止保证收益
* 省钱建议不推荐股票、基金、保险和借贷产品
* 不替代会计、税务、法律或持牌金融服务

### 15.7 Prompt 注入风险

风险：

用户输入“忽略之前要求”等指令。

当前措施：

* 核心规则放在 System Prompt
* 用户输入只作为 User Prompt 变量
* 模型输出不能直接执行 SQL
* 模型不能直接修改数据库
* 输出必须经过类型转换和业务校验
* 正式账单需用户确认

---

## 16. response_schema 的实际作用

数据库中保存了 `response_schema`，用于：

* 记录预期结构
* Prompt 文档管理
* 版本管理
* 后续接入动态 Schema
* 便于管理员检查模板

当前 `PromptTemplateService` 返回：

* System Prompt
* User Prompt
* Prompt 版本

暂未自动将数据库中的 JSON Schema 传递给模型。

目前结构化结果主要依赖：

```text
Prompt 中的 JSON 约束
+ Spring AI .entity(...)
+ Java Record
+ 后端校验
```

---

## 17. 当前不足

1. `response_schema` 尚未动态传给模型。
2. 异常解释模板尚未接入实际 AI 调用。
3. 预测解释模板尚未接入实际 AI 调用。
4. 没有 Prompt 后台管理页面。
5. 没有 Prompt A/B 测试。
6. 没有自动化 Prompt 评测集。
7. 尚未完整记录 Token 使用量。
8. 尚未实现模型调用降级策略。
9. 尚未实现 RAG 或向量检索。
10. Prompt 注入检测仍可进一步加强。

---

## 18. 后续优化方向

1. 将 `response_schema` 动态接入模型调用。
2. 建立 Prompt 管理后台。
3. 支持新增模板版本和回滚。
4. 建立分类和提取评测集。
5. 统计 JSON 解析成功率。
6. 统计分类准确率。
7. 记录 Prompt Token 和 Completion Token。
8. 对不同模型进行成本与准确率比较。
9. 增加 Prompt 注入检测。
10. 增加模型不可用时的规则降级。
11. 为异常解释提供可选 AI 模式。
12. 为预测说明提供可选 AI 模式。

---

## 19. 总结

项目形成了以下 AI 可靠性链路：

```text
数据库 Prompt 模板
+ System Prompt 行为约束
+ 动态业务数据注入
+ 结构化 Java 类型映射
+ 后端二次校验
+ 用户人工确认
```

不同 AI 功能采用不同策略：

* 分类任务使用快速模型
* 多账单提取使用主模型
* 省钱建议结合预算、预测和健康评分
* AI 顾问结合财务上下文和历史消息
* AI 顾问使用 SSE 流式输出
* 关键金额计算仍由后端完成

该设计在生成能力、财务安全、结果可控性、响应速度和维护成本之间取得了平衡。
