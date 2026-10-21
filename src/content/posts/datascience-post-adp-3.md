---
title: ADP-Statistics-상관분석
date: 2022-03-31
category: DataScience
image: /images/posts/datascience/adp/corr_heatmap.PNG
excerpt: 상관분석은 두 변수 사이에 어떠한 관계가 있는지 분석하는 것이다. 특히, 상관계수를 이용하여 두 변수사이의 선형관계 정도를 측정한다.
---

## 🚪 이전 게시글

ADP 실기 시험 공부를 위해 연재하고 있으며,
첫 포스팅은 [기초 통계량-1](https://predictorssh.github.io/adp/2022/03/11/ADP-statistics-0.html)이다.


이전 게시글 [기초 통계량-2](https://predictorssh.github.io/adp/2022/03/13/ADP-statistics-1.html)에 이어서 작성한 글이다.

## 🔑 상관분석

상관분석은 두 변수 사이에 어떠한 관계가 있는지 분석하는 것이다.<br>
특히, 상관계수를 이용하여 두 변수사이의 선형관계 정도를 측정한다.<br>
또 산점도를 그려 관계를 시각화 할 수 도 있다.<br>

상관분석, 상관계수의 종류는 여러가지가 있다.

- 피어슨 상관계수
- 스피어만 순위 상관계수
- Kendall Tau
- 점 양분 상관계수
- 파이 계수 

가 있는데, 가장 많이 사용되는 피어슨 상관계수와 스피어먼 순위 상관계수에 대해서 알아보자
  
## 피어슨 상관계수
두 변수 X 와 Y 간의 선형 상관 관계를 계량화한 수치다. <br>
피어슨 상관 계수는 +1과 -1 사이의 값을 가지며, +1은 완벽한 양의 선형 상관 관계, 0은 선형 상관 관계 없음, -1은 완벽한 음의 선형 상관 관계를 의미한다.<br>
일반적으로 상관계수는 피어슨 상관계수를 말한다.<br>

## temp와 atemp 피어슨 상관계수 분석
temp(기온)와 atemp(체감 기온)는 선형 상관관계가 매우 강할 것으로 추측된다.<br>
둘 사이의 피어슨 상관계수를 확인해보자.<br>
pandas.Dataframe.corr을 활용하여 변수들 사이의 피어슨 상관계수를 확인 할 수 있다.
```python
train[['temp','atemp']].corr(method='pearson')
```

  |index|temp|atemp|
  |---|---|---|
  |temp|1\.0|0\.9849481104817075|
  |atemp|0\.9849481104817075|1\.0|


거의 1에 가까운 상관계수가 나온 것을 확인할 수 있다.<br>
그런데 상관계수만 확인해서는 상관 분석을 했다고 말하기 힘들다. <br>
구해진 상관계수가 유의한지 검정해야한다.<br>

scipy라이브러리를 활용하면, 상관계수뿐 아니라 p-value또한 구해준다.<br>
일반적으로 p-value가 0.05 보다 작으면 상관계수가 유의하다고 판단할 수 있다.<br>
p-value가 0.05 보다 크면 구해진 상관계수는 별 의미없는 숫자가 된다.

```python
from scipy import stats

stats.pearsonr(train['temp'], train['atemp'])
#(상관계수, p-value)
```
```text
(0.9849481104817074, 0.0)
```

예상했던 대로 temp와 atemp는 강한 양의 선형상관관계가 있고, p-value가 0.0으로 유의하다.

## p_value 와 가설검정

여기서, p-value가 정확하게 무엇을 의미하는지 집고 넘어가야 할 것 같다.<br>
p-value는 통계적 가설검정에서 매우 중요한 개념이기 때문이다.<br>

상관분석은 가설검정이다.<br>
귀무가설 : 두 변수사이에 선형 상관관계가 없다.(상관계수가 0이다.) <br>
대립가설 : 두 변수 사이에 선형 상관관계가 있다.(상관계수가 0이 아니다.) <br>
를 검정하는 것이다.<br>

가설검정과 p-value에 대해서 필자가 학부시절에 공부했던 내용을 기억해 조금 정리 해보겠다.<br>
가설검정이란 내가 주장하는 가설(대립가설)이 통계적으로 맞는지 틀렸는지를 확인하는 것이다.<br>
위에서 필자는 temp와 atemp가 선형관계가 있다고 가정하였고, 그것을 확인하는 것이 상관분석이라는 것이다.<br>
<br>
가설을 검정하기 위해서 검정 통계량을 사용한다. 검정 통계량은 귀무가설이 참이라는 가정하에, 표본을 추출해서 구하게 된다.<br>
Z-test에서는 Z-통계량, T-test에서는 t-통계량을 사용한다. 
<br>
p-value는, 검정에 사용된 통계량의 값이 그정도로 나올 확률이다. 예를 들어 T-test를 하는데 t-통계량의 값이 x가 나왔다고 하자.<br> 
이때 p-value는 t-통계량의 값이 x정도로(엄밀히 말하면 x 또는 x보다 더 극단적인 값이 나올)확률이다. <br>
그러니까 p-value가 너무 낮으면, 실험자는 이런 생각을 할 수 있다. <br>
'귀무가설이 참이라는 가정하에 검정 통계량이 x가 나왔는데, x가 나올 확률이 이렇게 낮아? 그럼 귀무가설을 의심해야하는거 아니야?' 

여기서, 실험자는 유의수준을 정한다.<br>
유의수준은 귀무가설에 대한 의심을 넘어서, 귀무가설을 기각하게 되는 p-value 수준이다. 보통 유의수준을 0.05로 정한다.<br>

쉽게 말해서, p-value가 0.05 보다 낮으면 "귀무가설이 참이라면, 통계량의 값이 그렇게  나올리가 없어! 그러니까 귀무가설은 기각이야"라고 말하면서 기각 시킬 수 있다.<br>

위에서 필자는 p-value가 낮게 나와서 귀무가설을 기각하고, 대립가설(temp와 atemp 사이에 선형상관관계가 있다.)를 채택했다.

## 스피어만 상관계수

스피어먼 상관계수은 이산형, 순서형 데이터의 상관관계를 분석할때 적합한 평가 척도이다.<br>
피어슨 상관계수와 마찬가지로 -1에서 1사이의 값을 가지며, 값에 떄른 해석도 비슷하게 할 수 있다.

[해당 블로그 포스터](https://hyen4110.tistory.com/38)를 보면, 피어슨과 스피어먼의 차이점에 대해서 더 자세히 알아볼 수 있다.


습도와 target 변수 사이의 상관관계를 spearman 계수로 확인해보자

```python
# train[['humidity','count']].corr(method='spearman') 
stats.spearmanr(train['humidity'], train['count'])
```

pearson과 마찬가지로 pd.Dataframe.corr() 에서 method만 변경해서 구할 수도 있지만,<br>
stats 라이브러리를 활용해서 구할 수도 있다.

## 시각화(히트맵, 산점도)

데이터의 모든 필드들에 대해서 상관계수를 보고싶다면,<br>
아래와 같이 코드를 입력하면 된다. 주의할점은 변수의 타입과 상관없이, 모든 변수사이의 상관계수가 나온다.<br>
```python
train.corr(method='pearson')
```

변수가 너무 많으면 시각화가 필요하다.<br>
아래와 같이 seaborn(sns), matplotlib(plt) 라이브러리를 활용해서 시각화 할 수 있다.
```python
plt.figure(figsize=(8,8))
sns.heatmap(data = train.corr(method='pearson'), annot=True, 
fmt = '.2f', linewidths=.5, cmap='Blues')
```

![corr_heatmap](/images/posts/datascience/adp/corr_heatmap.PNG)

어떤 변수끼리 pearson 상관계수 값이 높은지 한눈에 알 수 있다.<br>
sns.heatmap에서 annot은 각 그리드에 상관계수를 표현할지 유무를 결정하는 옵션이고<br>
fmt는 소숫점 자릿수를 지정해준다. 

위 그림에서 registered와 count 사이의 선형상관관계가 매우 높음을 알 수 있는데,<br>
두 변수로 산점도를 그려보자.

matplotplib의 scatter는 두 변수 사이의 산점도를 그려준다.

```python
plt.figure(figsize=(8,8))
plt.scatter(train['registered'],train['count'], s=8, color='r')
```
![corr_scatter](/images/posts/datascience/adp/corr_scatter.PNG)

두변수 사이의 상관계수가 높을수록, 위 그림처럼 그래프가 직선에 가깝게 그려질것이다.

## 📌 정리

상관분석을 진행해보았다.<br>
가장 많이 활용되는 피어슨과 스피어만 상관계수에 대해서만 우선 알아보았다.<br>
상관분석은 데이터를 파악하는데 중요하다.<br>
특히, target변수와 다른 변수들 사이의 상관분석을 통해, 어떤 변수가 target 변수 예측 또는 분류에 도움이 될 수 있을지 확인할 수 있다.<br>
그러나 독립 변수들 사이에 상관관계가 높으면, target 변수의 예측이나 분류에 부정적인 영향을 미칠 수도 있다.<br>
독립 변수들 사이의 상관관계가 높은 것을, 다중공선성이라고 한다.<br>
다중 공선성을 해결하기 위해서 feature selection , pca(차원 축소), 변수 제거 등의 작업을 하기도 한다.<br>