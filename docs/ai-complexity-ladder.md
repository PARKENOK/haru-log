# AI 기능 복잡도 사다리 — 연구자·개발자용 실전 가이드

> LEDRI UX Engineering · AI 활용 개발 집중과정 부록 D · 2026-10
> 바탕 자료: Anthropic, *Building Effective Agents* (2024-12) · Amershi 외, *Guidelines for Human-AI Interaction* (CHI 2019) · Hamel Husain, *Your AI Product Needs Evals* (2024)

이 문서는 AI 기능을 만들거나 연구 도구로 쓸 때 **얼마나 복잡하게 만들지**를 정하는 데 쓰는 실무 가이드입니다.
다섯 칸의 사다리를 아래에서부터 오르되, **한 칸 올라갈 때마다 측정으로 이득을 확인**하는 것이 원칙입니다.

```
5  오케스트레이터-워커 · 에이전트   할 일 목록 자체를 모델이 만든다
4  평가자-최적화자                  쓰는 쪽과 평가하는 쪽을 나눠 고쳐 쓴다
3  라우팅 · 병렬화                  입력마다 다른 길로, 독립된 일은 동시에
2  체이닝                           순서대로 나누고 단계 사이를 코드로 검사
1  한 번의 호출 + 좋은 예시          대부분 여기서 끝난다
```

한 칸 올라갈 때마다 대개 **더 느려지고**, **호출 수만큼 비싸지고**, **실패 지점이 늘어납니다**. 그래서 질문은 "어디까지 올릴 수 있나"가 아니라 "어디서 멈춰도 되나"입니다.

---

## 이 문서를 쓰는 법

- **사람이 읽을 때**: 0장(공통 준비)을 먼저 하고, 1칸부터 "다음 칸으로 올라갈 신호"가 보일 때만 다음 장으로 넘어갑니다.
- **Claude Code 등 에이전트에게 줄 때**: 저장소에 이 파일을 두고 이렇게 지시합니다.
  ```
  docs/ai-complexity-ladder.md 를 읽어. 지금 내 기능이 사다리 몇 칸인지 판단하고,
  0장의 평가 세트가 있는지 확인해. 없으면 평가 세트부터 만들고,
  한 칸만 올리는 계획을 플랜 모드로 보여 줘. 구현은 내가 계획을 고친 뒤에.
  ```
- 코드 예시는 TypeScript(Next.js API 라우트 기준)이고, 연구 분석용으로 파이썬 예시를 일부 붙였습니다. 모델·서비스 이름은 바꿔 끼울 수 있게 `llm()` 하나로 감쌌습니다.

---

## 0. 공통 준비 — 사다리를 오르기 전에

### 0-1. 평가 세트를 먼저 만든다

사다리의 어느 칸이 나은지는 **같은 입력으로 비교해야만** 알 수 있습니다. 코드보다 먼저 만듭니다.

| 구분 | 개수 | 예 (블로그 작성기) | 예 (인터뷰 코딩 도구) |
|---|---|---|---|
| 평범한 입력 | 5~15 | 실제 사용자가 넣을 법한 주제 | 보통 길이의 응답 문단 |
| 아주 짧거나 모호한 입력 | 2~5 | "여행" | "네 그냥요" |
| 사실 확인이 필요한 입력 | 2~5 | 통계·날짜가 들어갈 주제 | 수치를 말한 응답 |
| 범위 밖·민감한 입력 | 2~5 | 의료 진단 요청 | 개인 식별 정보가 섞인 응답 |
| 형식이 깨지기 쉬운 입력 | 2~5 | 아주 긴 입력, 영어·이모지 섞임 | 여러 주제가 한 문단에 섞인 응답 |

파일 하나로 둡니다.

```jsonc
// eval/cases.jsonl — 한 줄에 한 건
{"id":"c01","input":{"topic":"부산 여행 2박 3일","reader":"대학생"},"tags":["normal"]}
{"id":"c07","input":{"topic":"여행","reader":""},"tags":["ambiguous"]}
{"id":"c09","input":{"topic":"2025년 국내 출산율","reader":"일반"},"tags":["fact"]}
```

### 0-2. 무엇을 잴지 정한다

| 지표 | 재는 법 | 비고 |
|---|---|---|
| 단위 테스트 통과 수 | 코드로 검사 (길이·형식·금지어·필수 항목) | 자동, 매번 |
| 사람 채점 '좋음' 수 | 좋음/나쁨 두 가지 + **이유 한 줄** | 처음엔 5점 척도 쓰지 않기 |
| 평균 시간 | 서버에서 단계별 ms 기록 | 사용자가 체감하는 값 |
| 평균 호출 수·토큰 | 서버 로그 | 비용은 대략 이것에 비례 |

나쁨의 **이유 한 줄**을 모으면 다음에 어느 단계를 고칠지 보입니다. 가장 쓸모 있는 데이터입니다.

### 0-3. 모든 칸이 같이 쓰는 호출 함수

```ts
// lib/llm.ts — 서버 전용. API 키를 브라우저 코드에 넣지 않는다.
type LlmArgs = {
  system?: string;
  prompt: string;
  json?: boolean;        // true 면 JSON 으로만 답하게
  temperature?: number;
  step: string;          // 로그용 단계 이름 ("outline", "draft" ...)
};

export async function llm({ system, prompt, json, temperature = 0.7, step }: LlmArgs) {
  const t0 = Date.now();
  // 예: Gemini REST. 다른 서비스면 이 블록만 바꾼다.
  const model = process.env.GEMINI_MODEL!;          // "models/<모델 이름>" 형태. 이름은 서비스 문서에서 확인해 env 로
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature, ...(json ? { responseMimeType: "application/json" } : {}) },
      }),
    }
  );
  if (!res.ok) throw new Error(`llm ${step} ${res.status}`);
  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  console.log(JSON.stringify({ step, ms: Date.now() - t0, chars: text.length })); // 서버 로그 = 평가 재료
  return json ? JSON.parse(text) : text;
}
```

> 서버 로그(`console.log`)는 서버에만 남습니다. 브라우저 쪽 코드에는 로그를 남기지 않습니다.

---

## 1칸 — 한 번의 호출 + 좋은 예시

### 언제
- 거의 모든 기능의 **출발점**입니다. 글도 "검색 결과와 예시를 넣은 한 번의 호출로 충분한 경우가 많다"고 말합니다.
- 일이 한 덩어리로 자연스럽고, 결과를 사람이 한 번에 판단할 수 있을 때.

### 만드는 법 — 프롬프트 다섯 칸

```text
[역할]   너는 대학생 독자를 위한 여행 블로그 편집자다.
[과제]   아래 주제로 블로그 글을 쓴다.
[조건]   - 1,200~1,800자
         - 소제목 3~5개, 각 소제목은 "## " 로 시작
         - 확인되지 않은 수치는 쓰지 않는다
         - 광고성 문구를 쓰지 않는다
[예시]   <좋은 예 1>
         <좋은 예 2>
         (나쁜 예와 왜 나쁜지 한 줄을 붙이면 더 좋다)
[입력]   주제: {topic} / 독자: {reader}
```

- **예시 2~3개**가 조건 10줄보다 효과가 큰 경우가 많습니다. 예시끼리 너무 비슷하면 결과가 예시를 베낍니다 — 길이·소재가 다른 예시를 고릅니다.
- 조건은 **검사할 수 있는 말**로 씁니다. "적당한 길이" 대신 "1,200~1,800자".

### 검사 (코드)
```ts
function check(text: string) {
  const len = [...text].length;
  const heads = text.split("\n").filter((l) => l.startsWith("## ")).length;
  return {
    length: len >= 1200 && len <= 1800,
    headings: heads >= 3 && heads <= 5,
    banned: !/(최저가|지금 바로 구매)/.test(text),
  };
}
```

### 다음 칸으로 올라갈 신호
- 평가 세트에서 **실패가 특정 부분에 몰린다** (예: 구조는 좋은데 소제목이 자주 빠짐, 본문은 좋은데 개요가 엉성함).
- 사용자가 결과의 **일부만** 고치고 싶어 하는데 다시 생성하는 수밖에 없다.
- 프롬프트가 길어지면서 한 조건을 고치면 다른 조건이 깨진다.

### 흔한 실수
- 예시 없이 조건만 늘린다.
- 실패 원인을 보지 않고 바로 2칸 이상 올린다.

---

## 2칸 — 체이닝 (Prompt Chaining)

### 언제
- 일이 **고정된 순서**로 자연스럽게 나뉠 때. 각 단계가 더 쉬운 문제가 되어 정확도가 오르는 대신 시간이 늡니다.
- 중간 결과를 **사용자에게 보여 주고 고치게** 하고 싶을 때 (Amershi G9: 쉽게 고치기).

### 구조
```
입력 → ① 개요(AI, JSON) → ◆게이트(코드) → [사용자 확인] → ② 본문(AI) → ◆게이트(코드) → 결과
                     └ 실패 시 ①을 1회 재시도
```

### 만드는 법
```ts
// app/api/write/route.ts (요지)
const outline = await llm({
  step: "outline",
  json: true,
  prompt: `주제 "${topic}"의 블로그 개요를 만든다. 본문은 쓰지 않는다.
JSON 만 출력: {"title": string, "sections": string[]}  // sections 3~5개`,
});

// ◆ 게이트 — AI 가 아니라 코드로
const ok = Array.isArray(outline.sections) && outline.sections.length >= 3 && outline.sections.length <= 5
  && outline.sections.every((s: string) => s.trim().length > 0);
if (!ok) { /* 1회만 재시도, 그래도 실패면 사용자에게 알리고 멈춘다 */ }

// 사용자에게 개요를 돌려주고, 고친 개요를 받아 다음 요청에서 본문 단계로
```
```ts
const draft = await llm({
  step: "draft",
  prompt: `아래 개요를 순서 그대로 따라 본문을 쓴다. 소제목은 "## " + 개요 문구 그대로.
개요: ${JSON.stringify(editedOutline)}`,
});
```

### 단계 나누는 요령
1. 잘하는 사람이라면 어떤 순서로 할지 **동사**로 적는다 (고른다 → 뼈대를 잡는다 → 쓴다 → 다시 읽는다).
2. 단계마다 **입력과 출력**을 정한다. 출력은 다음 단계와 게이트가 읽기 쉬운 형식(JSON)으로.
3. 의미 판단은 AI, **세고 비교하는 일은 코드**. 글자 수 세기를 모델에게 맡기지 않는다.
4. 게이트에서 떨어지면 **재시도 상한**을 둔다 (보통 1~2회). 무한 반복 금지.

### 다음 칸으로 올라갈 신호
- 입력 **종류**에 따라 잘 되는 방식이 다르다 (후기는 잘 쓰는데 정보 글은 약하다) → 라우팅.
- 서로 독립된 단계가 직렬로 기다리고 있다 → 병렬화.

### 흔한 실수
- 단계만 나누고 게이트를 안 넣는다 — 그러면 앞 단계의 실수가 끝까지 흘러갑니다.
- 단계마다 사용자 확인을 받는다 — 확인은 **뒤 단계가 모두 그 결과를 따라가는 곳**(개요)에서만.

---

## 3칸 — 라우팅 · 병렬화

### 3-A. 라우팅 (Routing)

**언제**: 입력이 뚜렷한 **종류**로 나뉘고, 종류마다 다른 지시(또는 다른 모델)가 더 잘 될 때.
쉬운 입력은 작고 빠른 모델로, 어려운 입력만 큰 모델로 보내 비용을 줄이는 데도 씁니다.

```ts
const route = await llm({
  step: "route",
  json: true,
  temperature: 0,
  prompt: `다음 주제를 하나로 분류한다: "review" | "info" | "essay" | "out_of_scope"
애매하면 "unsure". JSON 만: {"kind": ..., "reason": "한 줄"}
주제: ${topic}`,
});

if (route.kind === "unsure") return askUser(route.reason);           // G10: 애매하면 범위를 좁혀 묻기
if (route.kind === "out_of_scope") return politelyDecline();         // 범위 밖은 정중히
const draft = await llm({ step: `draft_${route.kind}`, prompt: PROMPTS[route.kind](topic) });
```

- 분류 결과와 이유를 **화면에 보여 주고 바꿀 수 있게** 합니다 (G11: 왜 그렇게 했는지).
- 분류 자체를 평가합니다: 평가 세트에 **정답 종류**를 붙여 두고 정확도를 셉니다. 분류가 틀리면 뒤가 전부 엉뚱해집니다.

### 3-B. 병렬화 (Parallelization)

두 가지 모양이 있습니다.

| 모양 | 뜻 | 예 |
|---|---|---|
| 나누기 (sectioning) | 독립된 하위 작업을 동시에 | 사실·문체·길이 검사를 동시에 / 소제목별 본문을 동시에 |
| 투표 (voting) | 같은 일을 여러 번 시켜 의견을 모음 | 민감 표현 검사를 3번 돌려 2번 이상이면 차단 |

```ts
const [facts, tone, safety] = await Promise.all([
  llm({ step: "check_facts", json: true, prompt: FACT_CHECK(draft) }),
  llm({ step: "check_tone", json: true, prompt: TONE_CHECK(draft, reader) }),
  llm({ step: "check_safety", json: true, prompt: SAFETY_CHECK(draft) }),
]);
```

- 시간은 줄지만 **호출 수와 비용은 늘어납니다**. 비교표에 호출 수를 꼭 같이 적습니다.
- 투표는 **판정이 들쭉날쭉한 일**에만 의미가 있습니다. temperature 0 에서 같은 답만 나오면 투표는 낭비입니다.

### 다음 칸으로 올라갈 신호
- 평가 기준이 뚜렷한데, 첫 결과가 기준을 자주 못 넘고, **피드백을 주면 나아진다**.

---

## 4칸 — 평가자-최적화자 (Evaluator-Optimizer)

### 언제
- **평가 기준을 글로 분명히 쓸 수 있고**, 사람이 피드백을 주면 결과가 실제로 나아지는 일. 글도 "사람이 초고를 고쳐 쓰는 과정"에 빗댑니다.
- 기준을 글로 못 쓰면 이 칸은 효과가 없습니다 — 평가자도 무엇을 볼지 모르기 때문입니다.

### 구조
```
초안(AI) → 평가(AI, 항목별 통과/실패 + 이유) → 실패 항목만 고쳐 쓰기(AI) → 다시 평가 … (최대 2회)
```

### 평가자 지시서
```text
너는 블로그 초안을 검사하는 편집자다. 고쳐 쓰지 말고 검사만 한다.

[체크리스트]
1. 개요의 소제목이 모두 본문에 순서대로 나온다
2. 첫 문단에 글의 요점이 한 문장으로 있다
3. 확인되지 않은 수치·통계를 단정하지 않는다
4. 독자({reader})에게 맞는 말투다

[출력] JSON 만. {"items":[{"n":1,"pass":true,"reason":"..."}, ...]}
```

```ts
let text = draft;
for (let round = 0; round < 2; round++) {
  const review = await llm({ step: `review_${round}`, json: true, temperature: 0, prompt: REVIEW(text) });
  const failed = review.items.filter((i: { pass: boolean }) => !i.pass);
  if (failed.length === 0) break;
  text = await llm({
    step: `revise_${round}`,
    prompt: `다음 실패 항목만 고친다. 나머지 문장은 그대로 둔다.\n실패: ${JSON.stringify(failed)}\n본문:\n${text}`,
  });
}
```

### 꼭 지킬 것 — 평가자를 사람과 맞춰 본다
모델이 모델을 채점하면 **스스로를 칭찬하는 구조**가 되기 쉽습니다.
1. 평가 세트 10~30건을 **사람과 평가자 모델이 각각** 항목별로 채점합니다.
2. 일치하는 비율을 셉니다. 연구라면 Cohen's κ 같은 일치도 지표를 같이 보고합니다.
3. 일치가 낮으면 모델보다 **체크리스트 문구가 모호한** 경우가 많습니다. 문구를 고치고 다시 잽니다.
4. 일치가 충분해진 뒤에야 사람 채점을 줄입니다.

### 다음 칸으로 올라갈 신호
- 필요한 하위 작업이 **입력마다 달라서** 미리 정할 수 없다 (어떤 주제는 조사 3건, 어떤 주제는 10건).

### 흔한 실수
- 반복 상한 없이 "통과할 때까지" 돌린다 — 시간과 비용이 폭주합니다.
- 고쳐 쓰기 단계가 통과한 부분까지 다시 써서 오히려 나빠진다 — "실패 항목만, 나머지는 그대로"를 못 박습니다.

---

## 5칸 — 오케스트레이터-워커 · 에이전트

### 언제
- **할 일 목록 자체를 미리 정할 수 없는** 열린 문제. 오케스트레이터(중심 모델)가 일을 쪼개 워커에게 나눠 주고 결과를 합칩니다.
- 더 나아가 에이전트는 모델이 도구를 쓰면서 **다음에 무엇을 할지 스스로 정하며** 진행합니다.
- 시간·비용이 들쭉날쭉하고 실수가 쌓일 수 있으므로, **단계를 미리 정할 수 있으면 4칸 이하로 충분합니다.**

### 오케스트레이터-워커 뼈대
```ts
const plan = await llm({
  step: "plan",
  json: true,
  prompt: `주제 "${topic}"의 글을 쓰기 위해 조사할 하위 질문을 2~6개 정한다.
JSON 만: {"tasks":[{"id":"t1","question":"..."}]}`,
});
if (plan.tasks.length > 6) plan.tasks = plan.tasks.slice(0, 6);       // 상한은 코드가 쥔다

const results = await Promise.all(
  plan.tasks.map((t: { id: string; question: string }) =>
    llm({ step: `worker_${t.id}`, prompt: `다음 질문에 근거와 함께 답한다: ${t.question}` })
  )
);
const merged = await llm({ step: "synthesize", prompt: SYNTHESIZE(topic, plan.tasks, results) });
```

### 에이전트로 갈 때 지킬 것 (글의 세 원칙)
1. **단순하게** — 도구 수와 단계 수를 최소로.
2. **계획을 보여 준다** — 에이전트가 무엇을 하려는지 사용자에게 드러냅니다 (Amershi G11).
3. **도구 설명을 공들여 쓴다(ACI)** — 사람용 화면만큼. 신입 연구원에게 주는 업무 지시서처럼: 예시, 경계, 입력 형식.
   실수하기 어렵게 만듭니다(*poka-yoke*): 예를 들어 상대 경로 대신 절대 경로만 받게 하는 식.

### 안전장치 (코드가 쥔다)
- 최대 단계 수·최대 호출 수·최대 시간 상한
- 되돌릴 수 없는 행동(발송·결제·삭제·게시)은 **사람 확인 후**
- 모든 도구 호출과 결과를 로그로 남겨 나중에 따라가 볼 수 있게

---

## 한눈에 비교

| 칸 | 패턴 | 맞는 일 | 치르는 값 | 측정 포인트 |
|---|---|---|---|---|
| 1 | 한 번의 호출 + 예시 | 한 덩어리로 판단되는 일 | 가장 적음 | 단위 테스트, 사람 좋음/나쁨 |
| 2 | 체이닝 | 고정된 순서로 나뉘는 일 | 호출 수만큼 느려짐 | 단계별 게이트 통과율 |
| 3 | 라우팅 | 입력 종류마다 방법이 다른 일 | 분류 오류의 연쇄 | 분류 정확도 |
| 3 | 병렬화 | 독립된 하위 작업·투표 | 호출 수 증가 | 시간 단축 vs 비용 |
| 4 | 평가자-최적화자 | 기준이 뚜렷하고 피드백으로 나아지는 일 | 반복 횟수만큼 느려짐 | 평가자-사람 일치도 |
| 5 | 오케스트레이터-워커·에이전트 | 하위 작업을 미리 정할 수 없는 일 | 예측 어려움, 비용 변동 | 상한 도달 비율, 실패 추적 |

---

## 연구에 쓸 때 — UX 연구 예시와 주의점

### 연구 작업에 대 보면

| 연구 작업 | 시작 칸 | 설계 예 |
|---|---|---|
| 인터뷰 전사 1차 코딩 | 1 → 4 | 코드북 정의 + 예시로 1칸 → 코드 정의별 체크리스트로 평가자 |
| 설문 주관식 응답 분류 | 3 (라우팅) | 범주 분류 + "unsure" 는 사람에게 |
| 사용성 테스트 관찰 노트 정리 | 2 | 사건 추출(JSON) → 게이트(타임스탬프·참여자 ID 형식) → 심각도 요약 |
| 문헌 요약·비교표 | 2 → 3 | 논문별 추출(병렬) → 합치기 |
| 탐색적 데스크 리서치 | 5 | 하위 질문 계획 → 조사 → 종합, 출처 필수 |

### 재현성 — 논문에 쓸 수 있으려면
- **모델 이름과 버전, 날짜, temperature, 프롬프트 전문**을 기록합니다. 프롬프트는 파일로 두고 git 으로 버전을 관리합니다.
- 같은 입력을 여러 번 돌려 **결과가 얼마나 흔들리는지**도 봅니다 (분류라면 3회 중 일치 비율).
- 사람 코더와의 **일치도**(Cohen's κ, Krippendorff's α 등)를 보고합니다. 모델을 "추가 코더"로 다루는 편이 안전합니다.

```python
# 사람 코딩과 모델 코딩 일치도 (scikit-learn)
from sklearn.metrics import cohen_kappa_score
human = ["A", "B", "A", "C", "B"]
model = ["A", "B", "B", "C", "B"]
print(cohen_kappa_score(human, model))
```

### 참여자 데이터
- 클라우드 모델에 보내기 전에 **IRB 승인 범위와 동의서 문구**를 확인합니다. 외부 전송이 동의 범위 밖이면 보내지 않습니다.
- 이름·연락처·소속 등 식별 정보는 **가명 처리 후** 보냅니다. 가명 대응표는 따로, 안전하게.
- 서비스의 데이터 보존·학습 사용 정책을 확인하고 기록합니다.
- API 키와 원자료는 저장소에 커밋하지 않습니다 (`.env`, `.gitignore`).

---

## 체크리스트

- [ ] 평가 세트(까다로운 입력 포함)를 코드보다 먼저 만들었다
- [ ] 지금 기능이 사다리 몇 칸인지 말할 수 있다
- [ ] 한 칸 올리기 전과 후를 같은 입력으로 비교했다 (품질 + 시간 + 호출 수)
- [ ] 단계 사이 검사는 코드로 했고, 재시도 상한이 있다
- [ ] 중간 결과 중 사용자가 고칠 수 있는 곳을 정했다 (확인은 꼭 필요한 곳만)
- [ ] 모델 채점을 쓰면 사람 채점과 일치도를 쟀다
- [ ] 나아지지 않았으면 아래 칸으로 되돌렸다 — 그것도 결론이다
- [ ] (연구) 모델·버전·날짜·temperature·프롬프트를 기록했고, 참여자 데이터 전송 범위를 확인했다

---

## 출처

- Anthropic. *Building Effective Agents*. 2024-12. https://www.anthropic.com/engineering/building-effective-agents
- Anthropic. 에이전트 패턴 예제 코드. https://github.com/anthropics/claude-cookbooks/tree/main/patterns/agents
- Amershi, S. 외. *Guidelines for Human-AI Interaction*. CHI 2019. https://doi.org/10.1145/3290605.3300233
- Husain, H. *Your AI Product Needs Evals*. 2024. https://hamel.dev/blog/posts/evals/

이 문서의 코드는 이해를 돕는 뼈대입니다. 실제 서비스에 넣을 때는 오류 처리, 시간 제한, 입력 검증을 더해야 합니다.
