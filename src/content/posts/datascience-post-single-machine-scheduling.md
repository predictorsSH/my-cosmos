---
title: (OR)Single Machine Scheduling
date: 2026-01-12
category: DataScience
image: /images/posts/datascience/single_machine/basic.png
excerpt: 전체 작업의 완료시간을 최소화 하는 작업 순서를 찾습니다.
---

ortools의 CP-SAT을 사용한 단일 기계 스케줄링 문제 예제입니다. <br>
CP-SAT은 정수 프로그래밍 문제를 해결하는 도구로, 정수만 사용하여 최적화 문제를 정의해야 합니다.

## 목표
목표는 전체 작업의 완료시간을 최소화 하는 작업 순서를 찾는 것입니다.

## 제약
- 작업소요시간: 각 작업마다 처리에 필요한 시간이 다릅니다.
- 릴리즈 날짜: 각 작업은 특정 시점 이후에만 시작할 수 있습니다.
- 납기일: 일부 작업은 특정 시점 이전에 완료되야 합니다.
- 작업 전환 준비 시간: 작업 간 전환 시 추가적인 준비 시간이 필요할 수 있습니다.
- 선후 관계: 특정 작업들은 반드시 다른 작업 이후에 수행되어야 합니다.


## 데이터

다음은 문제에서 사용할 입력 데이터입니다.

- **job_durations**: 각 작업의 소요 시간
- **release_dates**: 각 작업의 릴리즈 날짜 (이 시점 이후에만 시작 가능)
- **due_dates**: 각 작업의 납기일 (이 시점 이전에 완료되어야 함, `-1`은 제약 없음)
- **setup_times**: 작업 i에서 작업 j로 전환 시 필요한 시간
- **precedences**: 작업간 선후행 조건

``` python

job_durations = [
    3,   # job 0
    4,   # job 1
    2,   # job 2
    5,   # job 3
    4,   # job 4
]

release_dates = [
    0,   # job 0
    0,   # job 1
    3,   # job 2
    0,   # job 3
    5,  # job 4
]

due_dates = [
    -1,  # job 0 (제한 없음)
    12,  # job 1
    15,  # job 2
    11,  # job 3
    -1,  # job 4
]

setup_times = [
    # to:   0  1  2  3  4
    [ 0, 1, 0, 0, 2 ],  # from job 0
    [ 0, 0, 0, 0, 0 ],  # from job 1
    [ 0, 3, 0, 1, 2 ],  # from job 2
    [ 0, 0, 0, 0, 1 ],  # from job 3
    [ 0, 0, 0, 0, 0 ],  # from job 4
]

precedences = [(2, 4)]  # 작업 2가 작업 4보다 먼저 완료되어야 함

```

모든 제약을 한번에 지키도록 풀지 않고, <br>
제약을 추가하면서 결과가 어떻게 바뀌는지 보려고 합니다.

## 기본 스케줄링

먼저 가장 기본적인 세가지 제약만 고려해서 문제를 풀어보겠습니다.<br>
이 문제를 구성하는 요소들은 Sets, Parameters, Decision Variable로 정의할 수 있습니다.

### Sets

- **J**: 작업들의 집합 (jobs set), J = {0, 1, 2, ..., n-1}

### Parameters

- **n**: 작업의 개수
- **P[j]**: 작업 j의 소요 시간 (j ∈ J)
- **R[j]**: 작업 j의 릴리즈 날짜 (j ∈ J)
- **D[j]**: 작업 j의 납기일 (j ∈ J, D[j] = -1이면 제약 없음)

### Decision Variables

- **S[j]**: 작업 j의 시작 시간 (j ∈ J)
- **E[j]**: 작업 j의 종료 시간 (j ∈ J), E[j] = S[j] + duration[j]
- **Cmax**: 전체 완료 시간 (makespan) = max{E[j] | j ∈ J}

### constraints

1. 릴리즈 날짜 제약
- S[j] >= R[j] for all j in J
2. 납기일 제약
- E[j] <= D[j] for all j in J where D[j] != -1
3. 단일 기계 제약 (기계가 하나이기 떄문에, 각 작업은 겹칠 수 없음)
- S[i] >= E[j] or S[j] >= E[i] for all i, j in J, i != J

## 풀이

```python
model = cp_model.CpModel()

# 작업 개수
n = len(job_duration)

# 최대 시간 + 100
horizon = sum(job_durations)+100

# 결정 변수객체 담을 리스트 생성
S, E, intervals = [], [], []


#############
# 결정 변수 정의
#############
for j in range(n):
    # s의 최소는 릴리즈 데이트, 최대는 horizon
    s = model.new_int_var(release_dates[j], horizon,  f"S[{j}]")
    # e의 최소는 0, 최대는 horizon
    if due_dates[j] != -1:
        e = model.new_int_var(0, due_dates[j], f"E[{j}]")
    else :
        e = model.new_int_var(0, horizon, f"E[{j}]")

    # 해당 변수는, 변수 자체가 제약임. E[j] = S[j] + duration[j]를 자동으로 추가해줌
    itv = model.new_interval(s, job_durations[j], e, f"itv_j{j}")

    # IntVar 객체 저장
    S.append(s)
    E.append(e)
    intervals.append(itv)

#############
# 제약 추가
#############

# 단일 머신
model.add_no_overlap(intervals)

# 납기 제약
for j in range(n):
    if due_dates[j] != -1:
        model.add(E[j] <= due_dates[j])

# 목적함수
Cmax = model.new_int_var(0, horizon, "Cmax")
model.add_max_equality(Cmax, E) # Cmax = max(E[j])
model.minimize(Cmax)

# 풀이
solver = cp_model.CpSolver()
status = solver.Solve(model)
```

- new_interval : new_interval_var(s, p, e)는 s(시작시간), p(기간), e(종료시간)를 하나의 interval 변수로 묶고 e = s + p라는 선형 제약을 자동으로 추가합니다. interval을 스케줄링 전용 제약(no_overlap, cumulative 등)에 사용할 수 있게 해줍니다.

- add_no_overlap : interval 객체들이 겹치지 않도록 제약을 추가해줍니다.

- add_max_equality : add_max_equality(Cmax, E)는 Cmax = max(E[0], E[1], …, E[n−1])라는 전역 제약을 추가합니다. 이를 model.minimize(Cmax)와 결합하면 makespan 최소화 문제가 됩니다.


### 결과
![result_1](/images/posts/datascience/single_machine/basic.png)

## setup time 제약 추가

기존 제약 조건에 `작업 전환 준비 시간을` 추가합니다

- setup[i][j] : i직후 j를 수행할때 작업 준비 시간
- S[j] >= E[i] + setup[i][j]

위 제약을 아래와 같이 추가할 수 있습니다.

```python

# 직전/직후 작업 유무를 결정하는 변수
prec_vars = {}
for i in range(n):
    for j in range(n):
        if i == j : continue
        # i 바로 다음 j가 오는지 결정하는 변수
        prec_vars[i,j] = model.new_bool_var(f"{i}_{j}")

# 셋업 시간 제약 추가
for (i,j), var in prec_vars.items():
    model.add(S[j] >= E[i] + setup_times[i][j].only_enforce_if(var))

# 단일 머신이므로 한 작업은 최대 하나의 후속 작업과 최대 하나의 선행 작업만 가질 수 있습니다.
for i in range(n):
    # i 다음에 오는 작업은 최대 하나
    model.add(sum(prec_vars[i,j] for j in range(n) if i != j) <= 1)
    # i 이전에 오는 작업은 최대 하나
    model.add(sum(prec_vars[j,i] for j in range(n) if j != j) <= 1)

# 전체 작업 흐름의 개수 (단일 경로 생성)
# 전체 n의 작업을 하나의 끊기지 않는 줄로 세우기 위해, 활성화된 연결 고리의 총개수를 n-1개로 고정합니다.
# 모든 작업이 누락 없이 하나의 스케줄 안에 포함되도록 강제합니다.
model.add(sum(prec_vars.values()) == n-1 )
```

핵심 로직은 작업 i와 j가 있을때, "작업 i가 작업 j의 직전 작업인가?" 를 결정하는 변수를 만들고, <br>
이 변수가 True일 때만 두 작업 사이에 setup 시간을 강제하는 것입니다.

- prec_vars : n*(n-1)개의 변수가 생성됨. 모든 가능한 작업 쌍에 대해서 i직후에 j가 오는지 유무를 변수로 생성
- `only_enforce_if(var)` : var이 True이면 제약 생성


### 결과
![result_2](/images/posts/datascience/single_machine/result2.png)

## setup time 제약을 ortools 공식 예제 방식대로 풀기

ortools 공식 예제에서는 이 예제를 Curcuit 방식으로 해결하였습니다. <br>
또한 솔버의 탐색 효율을 높이기 위해 준비 시간(Setup Time)의 일부를 작업 시간으로 통합하는 전처리 기법을 적용한것을 볼 수 있습니다.<br>
단일 기계 문제에서는 이 방식이 더 효율적일 것으로 보이지만, 다만 다중 기계 문제로 확장하기엔 전자가 더 유연한 방식이라 생각됩니다.

```python
setup_times = [
    # to:   0  1  2  3  4
    [ 0, 0, 0, 0, 0 ],  # 첫 작업시 대기시간
    [ 0, 1, 0, 0, 2 ],  # from job 0
    [ 0, 0, 0, 0, 0 ],  # from job 1
    [ 0, 3, 0, 1, 2 ],  # from job 2
    [ 0, 0, 0, 0, 1 ],  # from job 3
    [ 0, 0, 0, 0, 0 ],  # from job 4
]

n = len(job_durations)
horizon = sum(job_durations) + 100

for job_id in range(n):
    
    # 최소 setup 시간 찾기
    min_incoming_setup = min(
        setup_times[j][job_id] for j in range(n + 1)
    )
    
    # 릴리즈 날짜가 있는 경우, 최소 setup 시간과 비교 후 더 작은 값 할당.
    if release_dates[job_id] != 0:
        min_incoming_setup = min(min_incoming_setup, release_dates[job_id])
    
    if min_incoming_setup == 0:
        continue
    
    # 작업 시간에 최소 시간 더해주기
    job_durations[job_id] += min_incoming_setup
    
    for j in range(n+1):
        # setup 시간에 최소 대기 시간 빼기
        setup_times[j][job_id] -= min_incoming_setup
    if release_dates[job_id] != 0:
        # release_dates에서 최소 대기 시간 빼기
        release_dates[job_id] -= min_incoming_setup
    

model = cp_model.CpModel()


S, E, intervals = [], [], []


for job_id in range(n):
    duration = job_durations[job_id]
    release_date = release_dates[job_id]
    due_date = due_dates[job_id] if due_dates[job_id] != -1 else horizon
    
    start = model.new_int_var(release_date, due_date, f"S[{job_id}]")
    end = model.new_int_var(0, due_date, f"E[{job_id}]")
    interval = model.new_interval_var(start, duration, end, f"interval_{job_id}")
    S.append(start)
    E.append(end)
    intervals.append(interval)
    

model.add_no_overlap(intervals)

# 작업 순서를 경로로 만들고, 그 경로 위에서 시간 제약을 활성화
arcs = []
for i in range(n):
    
    # 더미 노드
    start_lit = model.new_bool_var("")
    # 더미 노드를 0으로 하고 첫 작업을 i+1로 설정
    arcs.append((0, i+1, start_lit))
    
    # 첫 작업의 시작 시간은 릴리즈 날짜와 setup 시간 중 최대값
    min_start_time = max(release_dates[i], setup_times[0][i])
    # 첫 작업의 S[i]는 min_start_time과 같아야함
    model.add(S[i] == min_start_time).only_enforce_if(start_lit)
    
    # 마지막 작업, i에서 0으로 가는 경로 추가
    end_lit = model.new_bool_var("")
    arcs.append((i+1, 0, end_lit))
    
    for j in range(n):
        if i == j :
            continue
        
        lit = model.new_bool_var(f"arc_{i}_{j}") # job j is scheduled immediately after job i
        arcs.append((i+1, j+1, lit))
        
        if release_dates[j] == 0:
            model.add(S[j] == E[i] + setup_times[i+1][j]).only_enforce_if(lit)
        else:
            model.add(S[j] >= E[i] + setup_times[i+1][j]).only_enforce_if(lit)
        
# exactly 1 outgoing arc
# exactly 1 incoming arc
model.add_circuit(arcs)


# 목적함수
Cmax = model.new_int_var(0, horizon+100, "Cmax")
model.add_max_equality(Cmax, E) # Cmax = max(E[j])
model.minimize(Cmax)

```

- model.add_circuit(arcs): 모든 작업을 하나의 거대한 순환 경로(Hamiltonian Circuit)로 연결합니다

### 결과
결과는 같습니다.
![result_2](/images/posts/datascience/single_machine/result2.png)


## 선후 관계 제약 추가

선후 관계에 대한 강제 제약을 추가한다.
- E[i] <= S[j] if precedence[i, j] = 1

위 제약을 아래와 같이 추가할 수 있습니다.

``` python
for before, after in precedences:
    # before job이 끝난 뒤에만 after job 시작 가능
    model.Add(E[before] <= S[after])

```

### 결과
![result_3](/images/posts/datascience/single_machine/result3.png)
