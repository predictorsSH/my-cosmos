---
title: (OR) Factory Planning
date: 2026-01-16
category: DataScience
image: /images/posts/datascience/fatory-planning/image.png
excerpt: 생산 계획 최적화 문제를 풀어봅니다.
---

ortools의 CP-SAT을 사용하는 예제입니다.
이 예제에서 여러 제품을 어떤 기계를 사용해 언제 얼마나 만들고 팔아야하는지 최적화합니다.

해당 예제는 [SAS example](https://support.sas.com/documentation/onlinedoc/or/151/ormpex.pdf)를 참고해 가져왔습니다.

## 목표

목표는 수익을 최대화하는 생산 계획을 짜는 것입니다.

## 설명

- 이 공장에서 7개의 서로 다른 종류의 제품을 만들 수 있습니다.
- 서로 다른 5개의 타입의 머신이 있습니다.
- 각 제품을 한 단위 생성할떄 필요한 머신별 가동시간이 주어져있습니다.
- 각 제품별 profit이 주어져있습니다.
- 특정 기간에 특정 기계 점검을 위해 기계를 정비해야합니다.
- 각 기간별 제품의 수요가 정해져있습니다. 이 이상 판매할 수 없습니다.
- 제품당 최대 100개를 재고로 둘 수 있습니다. 제품 한 단위당 0.5의 비용이 듭니다.
- 마지막에는 각 제품별로 50개의 재고가 남겨져 있어야합니다.
- 현 재고는 0 입니다.
- 기간당 working time은 384 시간입니다.

## formulation 

위 문제를 수학적 최적화 문제로 표현 하겠습니다.

### Index Sets
- product ∈ PRODUCT
- machine_type ∈ MACHINE_TYPES
- period ∈ PERIODS 

### Parameters

- profit[product]: 각 제품별 수익
- num_machines[machine_type]: 각 머신당 개수
- demand[product, period]: 각 기간별 제품들의 수요
- production_time[machine_type, production]: 각 제품별 머신들의 가동시간
- num_macine_down_per_period[machine_type, period]  각 기간별 가동 중단된 머신들의 수
- num_machines_period[machine_type, period]: 각 기간별 사용 가능한 머신들의 수
- store_ub: 각 제품 당 최대 재고 수
- initial_stock: 현 재고 수
- storage_cost_per_unit: 유닛당 재고 비용
- working_time: 기간당 working 시간 

## decision variable

- make[product, period] : 어떤 제품을 언제 얼마나 만들것인지. 제품별 기간별 생산 개수
- sell[product, period] : 어떤 제품을 언제 얼마나 판매할 것인지. 제품별 기간별 판매 개수
- store[product, period] : 어떤 제품을 언제 얼마나 저장 할 것인지. 제품별 기간별 저장 개수

## Constraints

먼저, 재고 = 이전 기간의 재고 + 생산 개수 - 판매 개수라는 제약이 필요합니다.

$$store_{p,t} = store_{p,t-1} + make_{p,t} - sell_{p,t}$$

$$\forall p \in PRODUCTS, \forall t \in PERIODS$$


그리고 기계별 가동 시간이, 전체 working 시간을 넘을 수 없습니다.

$$\sum_{p \in PRODUCTS} production\_time_{m,p} \cdot make_{p,t} \leq working\_time \cdot num\_machines_{m,t}$$

$$\forall m \in MACHINE\_TYPES, \forall t \in PERIODS$$

## Objective

목적 함수는 총 수익에서 총 재고 비용을 뺀 값을 최대화하는 것입니다.

$$\max \sum_{p \in PRODUCTS} \sum_{t \in PERIODS} (profit_p \cdot sell_{p,t} - storage\_cost\_per\_unit \cdot store_{p,t})$$

즉, 판매 수익을 최대화하면서 재고 비용을 최소화하는 생산 계획을 찾는 것이 목표입니다.


## 입력 데이터

문제에서 사용할 입력 데이터 입니다.

```python
## sets
PRODUCTS = [1, 2, 3, 4, 5, 6, 7]
PERIODS = [1, 2, 3, 4, 5, 6]
MACHINE_TYPES = ["grinder", "vdrill", "hdrill", "borer", "planner"]
machine_index = {
    "grinder": 0,
    "vdrill": 1,
    "hdrill": 2,
    "borer": 3,
    "planner": 4,
}

## parameter

# 제품별 profit
profit = [10, 6, 8, 4, 11, 9, 3]

# 제품별 머신 사용량 production_time[machine_type][product]
# 값을 정수로 바꾸기 위해 100을 곱해주었습니다.
times_scale = 100
process_time = {
    "grinder": [
        0.5, 0.7, 0, 0, 0.3, 0.2, 0.5,
    ],
    "vdrill": [
        0.1, 0.2, 0, 0.3, 0, 0.6, 0,
    ],
    "hdrill": [
        0.2, 0, 0.8, 0, 0, 0, 0.6,
    ],
    "borer": [
        0.05, 0.03, 0, 0.07, 0.1, 0, 0.08,
    ],
    "planner": [
        0, 0, 0.01, 0, 0.05, 0, 0.05,
    ],
}
process_time_int={
    m: [int(t * times_scale) for t in times]
    for m, times in process_time.items()
}

# 월별 사용 가능한 머신
num_machines = [4, 2, 3, 1, 1]
num_machines_down_per_period = [
    [1,0,0,0,0],
    [0,0,2,0,0],
    [0,0,0,1,0],
    [0,1,0,0,0],
    [1,1,0,0,0],
    [0,0,1,0,1]
]
total = np.array(num_machines)
down = np.array(num_machines_down_per_period)
num_machines_per_period = (total - down).tolist()


# 월별 수요
monthly_product_demand = [
    [500, 1000, 300, 300, 800, 200, 100],   # January
    [600, 500, 200, 0, 400, 300, 150],      # February
    [300, 600, 0, 0, 500, 400, 100],        # March
    [200, 300, 400, 500, 200, 0, 100],      # April
    [0, 100, 500, 100, 1000, 300, 0],       # May
    [500, 500, 100, 300, 1100, 500, 60],    # June
]

# 저장 가능한 재고
store_ub = 100
# 재고 비용
storage_cost_per_unit = 0.5
# 초기 재고
initial_stock = 0
# 최종 재고
final_stock = 50
# 공장 가동 시간
working_time = 384 * times_scale

# big m
big_m = 10000
## cp-sat 풀이
```

## 풀이

cp-sat을 사용하여 문제를 해결합니다.

```python
model = cp_model.CpModel()

####### 변수 선언

# 뭘 얼마나 만들지
make = {}
for prod in PRODUCTS:
    for period in PERIODS:
        make[prod, period] = model.NewIntVar(0, big_m, f"make_{prod}_{period}")

# 뭘 얼마나 팔지
sell = {}
for prod in PRODUCTS:
    for period in PERIODS:
        sell[prod, period] = model.NewIntVar(0, monthly_product_demand[period-1][prod-1], f"sell_{prod}_{period}")

# 재고
store = {}
for prod in PRODUCTS:
    for period in PERIODS:
        store[prod, period] = model.NewIntVar(0, store_ub, f"stock_{prod}_{period}")


####### 제약

# 재고 = 전달 재고 + 생산 - 판매
for period in PERIODS:
    for prod in PRODUCTS:
        if period == 1:
            model.Add(store[prod, period] == make[prod, period] - sell[prod, period])
        else:
            model.Add(store[prod, period] == store[prod, period - 1] + make[prod, period] - sell[prod, period])

# 머신 사용량 제약
for period in PERIODS:
    for machine_type in MACHINE_TYPES:
        model.Add(
            sum(
                process_time_int[machine_type][prod-1] * make[prod, period] for prod in PRODUCTS
                )
                <= working_time * num_machines_per_period[period-1][machine_index[machine_type]]
            )
        
# 최종 제고
last_period = PERIODS[-1]
for prod in PRODUCTS:
    model.Add(store[prod, last_period] == final_stock)


####### 목적 함수

# profit
fianl_profit = sum(sell[prod, period] * profit[prod-1] for prod in PRODUCTS for period in PERIODS)

# cost
final_cost = sum(store[prod, period] * storage_cost_per_unit for prod in PRODUCTS for period in PERIODS)

# 목적 함수
model.Maximize(fianl_profit - final_cost)


# 풀이
solver = cp_model.CpSolver()
status = solver.Solve(model)

# 결과 출력
print(f"Status: {solver.StatusName(status)}")
print(f"Objective value: {solver.ObjectiveValue()}")

# 출력 결과
# Status: OPTIMAL
# Objective value: 93711.5
```

예제는 Linear Programming 문제였고, cp-sat으로 풀기 위해서 기계 가동시간과, 공장 가동 시간에 각각 100을 곱해주어 정수로 만들었습니다.

## 기계 정비 기간 최적화

여기서 만약, 기계를 최적화 하는 기간을 함께 최적화 한다면 어떻게 바뀔까요?
다음과 같은 상황을 가정합니다.
- 각각의 머신들은 6개월 중 한 달 동안은 점검기간을 가진다.
- grinders의 경우 2대의 머신만 점검을 하면 된다. 

먼저 추가적인 decision variable이 필요합니다.

- num_machines_down_per_period[machine_type, period] : 기간별, 머신 타입별 점검 수
- num_machines_per_period[machine_type, period] : 기간별, 머신 타입별 사용 가능 수

그리고 제약도 필요합니다.
먼저, 사용 가능한 머신 수는 전체 머신 수에서 점검 중인 머신 수를 뺀 값과 같습니다.

$$num\_machines\_per\_period_{m,t} = num\_machines_m - num\_machines\_down\_per\_period_{m,t}$$

$$\forall m \in MACHINE\_TYPES, \forall t \in PERIODS$$


그리고 각 머신 타입별로 전체 기간 동안 점검해야 하는 머신 수에 대한 제약이 필요합니다.
grinder의 경우, 전체 기간 동안 2대의 머신만 점검하면 됩니다:

$$\sum_{t \in PERIODS} num\_machines\_down\_per\_period_{grinder,t} = 2$$


다른 머신 타입의 경우, 각 머신이 정확히 한 번씩 점검되어야 하므로:


$$\sum_{t \in PERIODS} num\_machines\_down\_per\_period_{m,t} = num\_machines_m$$

$$\forall m \in MACHINE\_TYPES \setminus \{grinder\}$$


```python
num_machines_down_per_period_ = {}
for machine_type in MACHINE_TYPES:
    for period in PERIODS:
        num_machines_down_per_period_[machine_type, period] = model.NewIntVar(0, 4, f"down_{machine_type}_{period}")


        
num_machines_per_period_ = {}
for machine_type in MACHINE_TYPES:
    for period in PERIODS:
        num_machines_per_period_[machine_type, period] = model.NewIntVar(0, num_machines[machine_index[machine_type]], f"available_{machine_type}_{period}")

```

결과는 아래와 같습니다.

``` python
Status: OPTIMAL
Objective value: 108855.0
```

머신 점검 기간을 함께 최적화 하니, 수익이 상승하였습니다.

월별 제품별 판매가 어떻게 되었는지 확인해 보겠습니다.
대부분의 경우 수요를 꽉 채우면서 판매를 잘 한것을 알 수 있습니다.

![constraints](/images/posts/datascience/fatory-planning/constraint_output1.png)

























