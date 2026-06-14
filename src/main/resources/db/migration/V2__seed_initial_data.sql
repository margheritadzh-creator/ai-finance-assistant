INSERT INTO category
(
    code,
    name_zh,
    name_en,
    icon,
    sort_order,
    system_defined,
    active
)
VALUES
    ('FOOD', '餐饮', 'Food and Dining', 'utensils', 10, TRUE, TRUE),
    ('TRANSPORT', '交通出行', 'Transportation', 'car', 20, TRUE, TRUE),
    ('SHOPPING', '购物消费', 'Shopping', 'shopping-bag', 30, TRUE, TRUE),
    ('HOUSING', '居住生活', 'Housing', 'house', 40, TRUE, TRUE),
    ('ENTERTAINMENT', '娱乐休闲', 'Entertainment', 'film', 50, TRUE, TRUE),
    ('HEALTH', '医疗健康', 'Healthcare', 'heart-pulse', 60, TRUE, TRUE),
    ('EDUCATION', '学习教育', 'Education', 'book-open', 70, TRUE, TRUE),
    ('SOCIAL', '人情往来', 'Social and Gifts', 'gift', 80, TRUE, TRUE),
    ('TRAVEL', '旅行', 'Travel', 'plane', 90, TRUE, TRUE),
    ('DIGITAL', '数字服务', 'Digital Services', 'monitor', 100, TRUE, TRUE),
    ('OTHER', '其他', 'Other', 'circle-ellipsis', 110, TRUE, TRUE);


WITH rule_data
         (
          normalized_keyword,
          aliases,
          category_code,
          unit,
          min_reasonable,
          max_reasonable,
          severity
             )
         AS
         (
             VALUES
                 (
                     '鸡蛋',
                     '["蛋", "单个鸡蛋"]'::JSONB,
                     'FOOD',
                     '个',
                     0.30,
                     30.00,
                     'WARNING'
                 ),
                 (
                     '矿泉水',
                     '["瓶装水", "纯净水"]'::JSONB,
                     'FOOD',
                     '瓶',
                     1.00,
                     50.00,
                     'WARNING'
                 ),
                 (
                     '公交',
                     '["公交车", "公共汽车"]'::JSONB,
                     'TRANSPORT',
                     '次',
                     1.00,
                     50.00,
                     'WARNING'
                 ),
                 (
                     '地铁',
                     '["轨道交通", "轻轨"]'::JSONB,
                     'TRANSPORT',
                     '次',
                     1.00,
                     100.00,
                     'WARNING'
                 ),
                 (
                     '普通咖啡',
                     '["咖啡", "美式", "拿铁"]'::JSONB,
                     'FOOD',
                     '杯',
                     5.00,
                     150.00,
                     'WARNING'
                 ),
                 (
                     '早餐',
                     '["早饭"]'::JSONB,
                     'FOOD',
                     '次',
                     2.00,
                     300.00,
                     'NOTICE'
                 ),
                 (
                     '午餐',
                     '["午饭", "中饭"]'::JSONB,
                     'FOOD',
                     '次',
                     5.00,
                     500.00,
                     'NOTICE'
                 ),
                 (
                     '晚餐',
                     '["晚饭"]'::JSONB,
                     'FOOD',
                     '次',
                     5.00,
                     800.00,
                     'NOTICE'
                 )
         )
INSERT INTO price_reference_rule
(
    normalized_keyword,
    aliases,
    category_id,
    region_code,
    spending_level,
    unit,
    min_reasonable,
    max_reasonable,
    severity,
    enabled
)
SELECT
    rule_data.normalized_keyword,
    rule_data.aliases,
    category.id,
    'CN',
    NULL,
    rule_data.unit,
    rule_data.min_reasonable,
    rule_data.max_reasonable,
    rule_data.severity,
    TRUE
FROM rule_data
         JOIN category
              ON category.code = rule_data.category_code;


INSERT INTO prompt_template
(
    code,
    version,
    system_prompt,
    user_prompt_template,
    response_schema,
    description,
    active
)
VALUES
    (
        'EXPENSE_EXTRACTION',
        1,
        $prompt$
            你是一名严谨的消费记录结构化助手。

请从用户输入的中文或英文内容中提取一条或多条消费记录。

要求：
1. 不得虚构用户没有表达的金额、商品、商家或时间。
2. 一句话包含多笔消费时，必须拆分成多条记录。
3. 金额必须为正数。
4. 未说明币种时默认使用 CNY。
5. 未说明时间时使用系统提供的参考时间。
6. 分类只能使用系统提供的分类代码。
7. 不确定的字段使用 null。
8. 只输出符合 JSON Schema 的 JSON，不输出额外说明。
    $prompt$,
        $prompt$
            输入语言：{{input_language}}
参考时间：{{reference_time}}
可用分类：{{categories}}
用户偏好：{{user_preference}}

用户输入：
{{user_text}}
    $prompt$,
        '{
          "type": "object",
          "required": ["transactions"],
          "properties": {
            "transactions": {
              "type": "array",
              "items": {
                "type": "object",
                "required": [
                  "itemName",
                  "amount",
                  "currency",
                  "categoryCode",
                  "occurredAt"
                ],
                "properties": {
                  "itemName": {
                    "type": "string"
                  },
                  "merchant": {
                    "type": ["string", "null"]
                  },
                  "amount": {
                    "type": "number"
                  },
                  "currency": {
                    "type": "string"
                  },
                  "quantity": {
                    "type": ["number", "null"]
                  },
                  "unit": {
                    "type": ["string", "null"]
                  },
                  "categoryCode": {
                    "type": "string"
                  },
                  "occurredAt": {
                    "type": "string"
                  },
                  "note": {
                    "type": ["string", "null"]
                  },
                  "confidence": {
                    "type": ["number", "null"]
                  }
                }
              }
            }
          }
        }'::JSONB,
        '从中文或英文自然语言中提取一条或多条消费记录。',
        TRUE
    );


INSERT INTO prompt_template
(
    code,
    version,
    system_prompt,
    user_prompt_template,
    response_schema,
    description,
    active
)
VALUES
    (
        'EXPENSE_CLASSIFICATION',
        1,
        $prompt$
            你是一名消费账单分类助手。

要求：
1. 只能从系统提供的分类代码中选择。
2. 不允许创建新的分类代码。
3. 结合商品名称、商家、备注和原始内容判断。
4. 信息不足时选择 OTHER。
5. confidence 必须在 0 到 1 之间。
6. 只输出符合 JSON Schema 的 JSON。
    $prompt$,
        $prompt$
            可用分类：
{{categories}}

商品名称：{{item_name}}
商家名称：{{merchant}}
备注：{{note}}
原始内容：{{raw_text}}
    $prompt$,
        '{
          "type": "object",
          "required": ["categoryCode", "confidence", "reason"],
          "properties": {
            "categoryCode": {
              "type": "string"
            },
            "confidence": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "reason": {
              "type": "string"
            }
          }
        }'::JSONB,
        '将账单映射到系统消费分类。',
        TRUE
    );


INSERT INTO prompt_template
(
    code,
    version,
    system_prompt,
    user_prompt_template,
    response_schema,
    description,
    active
)
VALUES
    (
        'ANOMALY_EXPLANATION',
        1,
        $prompt$
            你是一名消费金额异常解释助手。

后端已经完成金额异常判断，你只负责生成简短、清楚的提醒。

要求：
1. 不得擅自修改金额。
2. 不得直接断言用户一定输入错误。
3. 应提示可能存在小数点、数量或单位错误。
4. 尊重不同地区和不同消费水平。
5. 使用自然、礼貌的中文。
6. 只输出提醒文本。
    $prompt$,
        $prompt$
            商品名称：{{item_name}}
输入金额：{{amount}}
常见价格范围：{{reference_range}}
用户消费水平：{{spending_level}}
地区物价系数：{{price_index}}
用户历史价格：{{personal_history}}
异常原因：{{anomaly_reason}}
    $prompt$,
        NULL,
        '将后端异常判断转换为用户容易理解的提醒。',
        TRUE
    );


INSERT INTO prompt_template
(
    code,
    version,
    system_prompt,
    user_prompt_template,
    response_schema,
    description,
    active
)
VALUES
    (
        'PREDICTION_EXPLANATION',
        1,
        $prompt$
            你是一名财务数据解释助手。

预测金额已经由后端统计模型计算完成，你只负责解释，不得重新计算或修改预测结果。

要求：
1. 说明预测使用了多少个月的历史数据。
2. 说明近期支出趋势。
3. 数据不足时必须说明预测可靠性有限。
4. 不得将预测描述为确定事实。
5. 金额统一使用人民币。
6. 使用适应中国用户阅读习惯的中文。
    $prompt$,
        $prompt$
            目标月份：{{target_month}}
预测金额：{{predicted_amount}}
预测区间：{{lower_bound}} 至 {{upper_bound}}
算法：{{algorithm}}
历史月份数量：{{based_on_months}}
历史月度支出：{{monthly_history}}
    $prompt$,
        NULL,
        '解释后端计算的下月支出预测结果。',
        TRUE
    );


INSERT INTO prompt_template
(
    code,
    version,
    system_prompt,
    user_prompt_template,
    response_schema,
    description,
    active
)
VALUES
    (
        'SAVING_ADVICE',
        1,
        $prompt$
            你是一名面向普通消费者的个人财务顾问。

请根据系统提供的真实财务数据生成具体、可执行的省钱建议。

要求：
1. 不得虚构用户收入、账单或消费行为。
2. 尊重用户所在地区、预算和消费习惯。
3. 不使用羞辱、说教或制造焦虑的语言。
4. 优先指出最有改善空间的消费类别。
5. 建议应当能够在未来一个月内执行。
6. 不推荐股票、基金、保险或借贷产品。
7. 金额统一使用人民币。
8. 使用中文 Markdown。
    $prompt$,
        $prompt$
            用户偏好：
{{user_preference}}

本月预算：
{{budget_summary}}

本月支出：
{{expense_summary}}

分类统计：
{{category_statistics}}

下月支出预测：
{{prediction}}

财务健康评分：
{{health_score}}
    $prompt$,
        NULL,
        '根据账单、预算、预测和健康评分生成省钱建议。',
        TRUE
    );


INSERT INTO prompt_template
(
    code,
    version,
    system_prompt,
    user_prompt_template,
    response_schema,
    description,
    active
)
VALUES
    (
        'FINANCIAL_CHAT',
        1,
        $prompt$
            你是一名智能个人财务顾问。

你只能根据系统提供的用户财务数据和对话上下文回答。

要求：
1. 不得虚构账单、预算、收入或历史行为。
2. 金额统一使用人民币。
3. 回答应当清楚、具体，并符合中文表达习惯。
4. 可以分析消费结构、预算执行、异常支出、预测和健康评分。
5. 不提供保证收益的投资建议。
6. 不替代专业会计、税务、法律或持牌金融服务。
7. 数据不足时直接说明，不得猜测。
8. 使用 Markdown 输出。
    $prompt$,
        $prompt$
            用户偏好：
{{user_preference}}

财务摘要：
{{financial_context}}

最近对话：
{{conversation_history}}

用户问题：
{{user_message}}
    $prompt$,
        NULL,
        '类 ChatGPT 的个人财务顾问对话模板。',
        TRUE
    );