---
title: BigQuery 쿼리 필수 요소
date: 2024-02-05
category: DataScience
image: /images/posts/datascience/bigquery/struct.png
excerpt: 도서 구글 빅쿼리 완벽 가이드 스터디
---


> 🧑 도서 [발리아파 락쉬마난,조던 티가니 "구글 빅쿼리 완벽 가이드" O’Reilly]를 개인적으로 공부한 것입니다.

## 쿼리 필수 요소 정리

### WITH 절 

> ⛳️ 빅쿼리에서 WITH 구문은 임시 테이블을 생성하지 않는다!

```
SELECT * FROM (
  SELECT
    gender, tripduration / 60 AS minutes
  FROM
    `bigquery-public-data`.new_york_citibike.citibike_trips
)

WHERE minutes < 10 -- 바깥쪽의 SELECT는 안쪽의 서브 쿼리의 결과를 참조하기 때문에, 서브쿼리가 사용한 별칭을 WHERE절에도 사용 가능하다.
LIMIT 5   
```

위와 같은 서브쿼리 대신 WITH절을 사용할 수 있다. <br>
WITH절을 사용하면 가독성이 높아지고, 재사용 가능하다는 장점이 있다.<br>

```
WITH all_trips AS (
  SELECT
    gender, tripduration / 60 AS minutes
  FROM
    `bigquery-public-data`.new_york_citibike.citibike_trips
)

SELECT * FROM all_trips
WHERE minutes < 10 
LIMIT 5   
```

일반적으로 사용하는 많은 DB들이 위와 같은 WITH 구문을 지원한다.
그런데 WITH 구문는 가상의 테이블을 생성하여 메모리에 할당하기 떄문에 성능 문제가 발생할수도 있다.

하지만, 
빅쿼리에서 WITH 구문은 이름이 있는 서브쿼리 처럼 작동하며 임시 테이블을 생성하지 않기 때문에(p62)<br>
성능이슈를 크게 걱정하지 않아도 된다고 한다.

### ORDER BY, GROUP BY

> ⛳️ ORDER BY는 SELECT절이 실행된 이후에 실행 되므로 별칭을 사용할 수 있다.<br>
> ⛳️ GROUP BY는 집계할때 효율적으로 사용

```
SELECT
  gender, AVG(tripduration / 60) AS avg_trip_duration
FROM
  `bigquery-public-data`.new_york_citibike.citibike_trips
WHERE
  tripduration is not NULL
GROUP BY
  gender
ORDER BY
  avg_trip_duration
```

남녀 평균 tripduration을 구할때, 각각 집계하면 데이터셋에 2번 접근하면서 그만큼 비용을 낭비한다.
이때 위와 같이 GROUP BY 절을 사용하면 된다.

### HAVING
> ⛳️ HAVING 절을 사용하면 그룹화 연산 이후에 필터링을 할 수 있다.

```
SELECT
  gender, AVG(tripduration / 60) AS avg_trip_duration
FROM
  `bigquery-public-data`.new_york_citibike.citibike_trips
WHERE
  tripduration is not NULL
GROUP BY
  gender
HAVING 
  avg_trip_duration > 14
ORDER BY
  avg_trip_duration
```
WHERE 절에서는 당연히 avg_trip_duration에 대한 필터링을 할 수 없다.

### ARRAY_AGG로 배열 만들기
> ⛳️ ARRAY_AGG를 사용하면 순서가 있는 리스트 또는 ARRAY를 얻을 수 있다.

```
SELECT 
  gender
  ,ARRAY_AGG(numtrips order by year) AS numtrips
FROM (
  SELECT
    gender
    , EXTRACT(YEAR FROM starttime) AS year
    , COUNT(*) AS numtrips
  FROM
    `bigquery-public-data`.new_york_citibike.citibike_trips
  WHERE
    gender != 'unknown' AND starttime IS NOT NULL
  GROUP BY
    gender, year
  HAVING year > 2016
)
GROUP BY
  gender
```
위 쿼리는 성별에 따른 대여 횟수를 연도별로 정렬한 ARRAY를 얻기 위한 쿼리다. 
결과는 아래와 같다. <br>
numtrips 컬럼이 배열로 들어가 있음을 알 수 있다.

![arr](/images/posts/datascience/bigquery/arr_agg.png)

위 테이블을 json으로 변환하면 아래와 같다.

```
[{
  "gender": "male",
  "numtrips": ["9306602", "3955871"]
}, {
  "gender": "female",
  "numtrips": ["3236735", "1260893"]
}]
```

### 구조체의 배열(STRUCT)
> ⛳️ 구조체는 순서를 갖는 필드의 그룹이다.

```
SELECT
  [
    STRUCT('male' AS gender,[930, 395] AS numtrips)
    ,STRUCT('female' AS gender, [323,126] AS numtrips)
  ] AS bikerides
```

이 쿼리의 실행 결과는 아래와 같다. 위 ARRAY_AGG와 행의 표현이 조금 다르다.<br>
위 커리에서 SELECT 절은 배열을 포함하는 행 1개만을 반환하므로, 두 성별 데이터가 하나의 행에 반환된다.


![struct](/images/posts/datascience/bigquery/struct.png)

json으로 변환한 결과도, 구조체의 이름(bikerides)이 지정된 것 빼고는 동일한 형태로 출력된다.

```
[{
  "bikerides": [{
    "gender": "male",
    "numtrips": ["930", "395"]
  }, {
    "gender": "female",
    "numtrips": ["323", "126"]
  }]
}]
```

### 배열 풀기(UNNEST)
> ⛳️ UNNEST는 배열의 요소를 행으로 반환하는 함수다.

```
SELECT * FROM UNNEST(
  [
    STRUCT('male' AS gender,[930, 395] AS numtrips)
    ,STRUCT('female' AS gender, [323,126] AS numtrips)
  ])
```
결과는 아래와 같다.

![unnest](/images/posts/datascience/bigquery/unnest.png)

```
[{
  "gender": "male",
  "numtrips": ["930", "395"]
}, {
  "gender": "female",
  "numtrips": ["323", "126"]
}]
```

### 튜플
> ⛳️ STRUCT 키워드와 필드 이름을 생략하면 튜플 또는 익명 구조체가 생성된다.<br>
> ⛳️ 빅쿼리는 쿼리 결과에서 이름이 지정되지 않은 컬럼 및 구조체 필드에 임의의 이름을 할당한다.

```
SELECT
  [
    STRUCT('male',[930, 395])
    ,STRUCT('female', [323,126])
  ] 
```
이 쿼리의 결과는 다음과 같다.

![tuple](/images/posts/datascience/bigquery/tuple.png)

```
[{
  "f0_": [{
    "_field_1": "male",
    "_field_2": ["930", "395"]
  }, {
    "_field_1": "female",
    "_field_2": ["323", "126"]
  }]
}]
```
컬럼 이름의 뱔칭을 생략하면 복잡한 쿼리를 이해하기 힘들고 유지보수도 어려워진다.
일회성 쿼리를 작성하는 것이 아니라면 반드시 컬럼 이름을 사용한다.

### 배열 활용하기

> ⛳️ 배열의 길이 측정, 배열 내의 개별 요소 탐색 등을 할 수 있다.

```
SELECT
  ARRAY_LENGTH(bikerides) AS num_items # 출력 결과 : 2
  ,bikerides[OFFSET(0)].gender AS first_gender # 출력 결과 : male
FROM
  (SELECT
    [
      STRUCT('male' AS gender,[930, 395] AS numtrips)
      ,STRUCT('female' AS gender, [323,126] AS numtrips)
    ] AS bikerides)
```

```
[{
  "num_items": "2",
  "first_gender": "male"
}]
```

### 테이블 조인

> ⛳️ 조인을 하려면 from_item을 작성할 때 사용하는 모든 데이터셋이 동일한 리전(region)에 있어야 한다.

아래 쿼리는 비가 오는날과 오지 않은 날의 대여 횟수를 비교하기 위해서 테이블을 조인하는 예제다.
```
-- 일별 대여 건수를 가져오는 from_item 생성
WITH bicycle_rental AS (
  SELECT
    COUNT(starttime) AS num_trips,
    EXTRACT(DATE FROM starttime) AS trip_date
  FROM 
    `bigquery-public-data`.new_york_citibike.citibike_trips
  GROUP BY trip_date
),

-- 5mm이상 강수량이 관측된 날 from_item 생성
rainy_days AS (
  SELECT
    date,
    (MAX(prcp) > 5 ) AS rainy
  FROM(
    SELECT
      wx.date AS date,
      IF (wx.element = 'PRCP', wx.value/10, NULL) AS prcp
    FROM
      `bigquery-public-data`.ghcn_d.ghcnd_2016 AS wx
    WHERE
      wx.id = 'USW00094728'
  )
  GROUP BY
    date
)

-- 두 테이블 조인
SELECT 
  bk.trip_date,
  bk.num_trips,
  wx.rainy
FROM
  bicycle_rental AS bk
JOIN
  rainy_days AS wx
ON 
  wx.date = bk.trip_date
LIMIT 10

```

위 쿼리 결과는 다음과 같다.

![join](/images/posts/datascience/bigquery/join.png)

num_trips 컬럼에 대여 횟수가 기록되어있고, rainy 컬럼에 강수 유무가 표시되어있다. 조인된 테이블을 집계하여 비가 온 날과 오지 않은 날의 대여 평균 차이를 확인 할 수 있을 것 이다. <br>

조인의 작동 방식은 다음과 같다.
- from_item을 2개 만든다. 2개의 테이블, 서브쿼리, 배열 또는 SELECT 할 수 있는 WITH문 어떤 것이든 from_item이 될 수 있다.
- 조인 조건을 결정한다. 조인 조건은 반드시 동등 조건일 필요는 없다.
- 원하는 컬럼을 선탣한다. 이때 별칭을 사용해 어떤 from_item을 읽을 것인지 명확하게 지정한다.
- 이너 조인을 사용하지 않으면 원하는 조인 유형을 선택한다.

### INNER JOIN

> ⛳️ 조인의 기본값은 이너 조인이다.<br>
> ⛳️ 조인 조건을 만족하는 공통 행의 집합을 생성한다(교집합).<br>
> ⛳️ 조인 조건이 언제너 동등 조건일 필요는 없다!<br>

city, state 와 state, country로 이루어진 두 테이블을 Inner Join하는 예제 쿼리다.

```
-- city, state 테이블
WITH from_item_a AS (
  SELECT 'Dalles' AS city, 'OR' AS state
  UNION ALL SELECT 'Tokyo', 'Tokyo'
  UNION ALL SELECT 'Mumbai', 'Maharashtra'
),

-- state, country 테이블
from_item_b AS (
  SELECT 'OR' AS state, 'USA' AS country
  UNION ALL SELECT 'Tokyo', 'Japan'
  UNION ALL SELECT 'Seoul', 'Korea'
)

-- state 기준으로 이너 조인
SELECT 
  from_item_a.*, country
FROM 
  from_item_a
JOIN 
  from_item_b
ON from_item_a.state = from_item_b.state
```
쿼리 결과는 아래와 같다. state Maharashtra와 Seoul은 교집합이 아니기 때문에 제외된 것을 알 수 있다.

![inner](/images/posts/datascience/bigquery/inner.png)

### CROSS JOIN(곱집합)

> ⛳️ 크로스 조인은 조인 조건이 없다. 즉 2개의 from_item의 모든 행이 결합된다.

토너먼트에서 각 경기의 우승자를 저장하는 테이블과, 각 경기의 상품에 대한 테이블이 있다고 가정하자.
각 이벤트의 우승자에게 줄 선물을 쿼리 하려면 다음과 같이 INNER JOIN을 사용해야 한다.

```
WITH winners AS (
  SELECT 'John' as person, '100m' as event
  UNION ALL SELECT 'Hiroshi', '200m'
  UNION ALL SELECT 'Sita', '400m'
),
gifts AS (
  SELECT 'Google Home' as gift, '100m' as event
  UNION ALL SELECT 'Google Hub', '200m'
  UNION ALL SELECT 'Pixel3', '400m'
)
SELECT winners.*, gifts.gift
FROM winners
JOIN gifts 
USING (event)
```
쿼리 결과를 json으로 표현하면 아래와 같다. 각 우승자가 정해진 상품을 받는다.

```
[{
  "person": "John",
  "event": "100m",
  "gift": "Google Home"
}, {
  "person": "Hiroshi",
  "event": "200m",
  "gift": "Google Hub"
}, {
  "person": "Sita",
  "event": "400m",
  "gift": "Pixel3"
}]
```

반면에 우승자에게 모든 상품을 주려면 다음과 같이 CROSS JOIN을 사용하면 된다.

```
WITH winners AS (
  SELECT 'John' as person, '100m' as event
  UNION ALL SELECT 'Hiroshi', '200m'
  UNION ALL SELECT 'Sita', '400m'
),
gifts AS (
  SELECT 'Google Home' as gift, '100m' as event
  UNION ALL SELECT 'Google Hub', '200m'
  UNION ALL SELECT 'Pixel3', '400m'
)
SELECT winners.*, gifts.gift
FROM winners
CROSS JOIN gifts 
```

![cross](/images/posts/datascience/bigquery/cross.png)

### OUTER JOIN

> ⛳️ 아우터 조인은 조건이 충족되지 않을 때 발생하는 상황을 제어한다.

이번에는 상품이 없는 경기와, 경기가 없는 상품이 있다고 가정하자.<br>
이때 아래와 같이 아우터 조인으로 쿼리하면, 조건을 만족하지 않아도 모든 우승자와 상품을 출력한다.

```
WITH winners AS (
  SELECT 'John' as person, '100m' as event
  UNION ALL SELECT 'Hiroshi', '200m'
  UNION ALL SELECT 'Sita', '400m'
  UNION ALL SELECT 'Kwame', '50m'
),
gifts AS (
  SELECT 'Google Home' as gift, '100m' as event
  UNION ALL SELECT 'Google Hub', '200m'
  UNION ALL SELECT 'Pixel3', '400m'
  UNION ALL SELECT 'Google Mini', '5000m'
)
SELECT person, gift, winners.event AS w_event, gifts.event AS g_event
FROM winners
FULL OUTER JOIN gifts 
ON winners.event = gifts.event
```

![outer](/images/posts/datascience/bigquery/outer.png)

OUTER JOIN은 위 쿼리와 같이 FULL OUTER JOIN 뿐만 아니라, 
LEFT OUTER JOIN, RIGHT OUTER JOIN이 존재한다. LEFT OUTER JOIN을 사용하면, 경기가 없었던 5000m는 출력 되지 않는다.
RIGHT OUTER JOIN을 사용하면, 모든 상품이 출력되지만 상품이 없었던 50m 경기가 출력 되지 않는다. 

```
WITH winners AS (
  SELECT 'John' as person, '100m' as event
  UNION ALL SELECT 'Hiroshi', '200m'
  UNION ALL SELECT 'Sita', '400m'
  UNION ALL SELECT 'Kwame', '50m'
),
gifts AS (
  SELECT 'Google Home' as gift, '100m' as event
  UNION ALL SELECT 'Google Hub', '200m'
  UNION ALL SELECT 'Pixel3', '400m'
  UNION ALL SELECT 'Google Mini', '5000m'
)
SELECT person, gift, winners.event AS w_event, gifts.event AS g_event
FROM winners
LEFT OUTER JOIN gifts 
ON winners.event = gifts.event
```

![left](/images/posts/datascience/bigquery/left.png)


```
WITH winners AS (
  SELECT 'John' as person, '100m' as event
  UNION ALL SELECT 'Hiroshi', '200m'
  UNION ALL SELECT 'Sita', '400m'
  UNION ALL SELECT 'Kwame', '50m'
),
gifts AS (
  SELECT 'Google Home' as gift, '100m' as event
  UNION ALL SELECT 'Google Hub', '200m'
  UNION ALL SELECT 'Pixel3', '400m'
  UNION ALL SELECT 'Google Mini', '5000m'
)
SELECT person, gift, winners.event AS w_event, gifts.event AS g_event
FROM winners
RIGHT OUTER JOIN gifts 
ON winners.event = gifts.event

```

![right](/images/posts/datascience/bigquery/right.png)
