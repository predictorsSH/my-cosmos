---
title: An introduction to ROC analysis
date: 2023-11-20
category: DataScience
image: /images/posts/datascience/an-introduce-to-roc/Untitled%2012.png
excerpt: ROC analysis 논문 리뷰
---

## An introduction to ROC analysis

```text
💡 ROC analysis 논문 리뷰

이 논문에서 개인적으로 흥미로웠던 내용은 두가지였다.

1. AUC가 윌콕슨 순위 검정과 동등하다는 것. (7. AUC의 통계적 특성)
2. ROC도 분산 평가를 해야한다는 것. —> 생각해보면 당연한데

그리고 추가적으로 10. Interpolating classifiers 에서 두가지 분류기를 상용하여 제약식을 만족시키면서 최적의 성능을 내는 예제도 재밌었다.
```

## 1. Introduction

- hit rate, false alarm rate간의 트레이드 오프 관계를 묘사하기 위해 사용
- 편향된 클래스 분포에서 분류 성능을 측정할때 용이
- 개념적으로는 간단하지만, 연구에서 사용될때 몇 가지 복잡성이 발생
- 실제 ROC 그래프를 사용할때 오해하는 부분이 있음
- 이 논문은 ROC 그래프 사용가이드로서 작성됨



## 2. Classifier performance

![Untitled](/images/posts/datascience/an-introduce-to-roc/Untitled.png)

- True Positive Rate = 재현율 = Hit Rate = Recall = Sensitivity = 실제 양성인 데이터중 양성이라고 분류한 비율
- False Positive Rate = False Alarm Rate = 실제 음성인데 양성이라고 분류한 비율
- Specificity = 1 - False Positive Rate = 실제 음성인데 음성이라고 분류한 비율
- Positive Predictive Value = Precision = 정밀도 = 양성이라고 분류한 것중 실제 양성인 비율
- F-measure = precision과 recall의 조화 평균

## 3. ROC space

![Untitled](/images/posts/datascience/an-introduce-to-roc/Untitled%201.png)

- ROC 그래프는 x 축이 FP rate , y 축이 TP rate로 이루어진 2차원 그래프이다.
- (0,0) 지점은 모든 데이터를 음성이라고 예측하는 경우로 False Alarm도 없지만, Hit Rate 도 얻지 못한다.
- (1,1) 지점은 모든 데이터를 양성이라고 예측하는 경우로, 100%의 Hit Rate를 얻지만, False Alarm Rate도 100%가 된다.
- D 지점은 100% Hit Rate 이면서 False Alarm이 없는 완벽한 지점이다.
- 북서쪽에 위치할수록 좋은 성능을 보여준다.
- A 지점은 강한 증거가 있어야 양성으로 분류하는 경우로 False Alarm Rate는 적지만, 높은 Hit Rate를 얻지 못한다.
- B는 A에 비해 “liberal” 하다. 조금 더 낮은 증거만으로 양성으로 분류하기 때문에 Hit Rate이 높지만 False Alarm Rate도 A 보다 높다.

### 3.1 Random performance

y=x 축 위의 지점은, 클래스를 무작위로 추측하는 전략을 나타낸다.

- 위 ROC 그래프에서 C지점의 성능은 거의 무작위이다.
- y=x 축 아래에 있는 E는 무작위보다 못한 성능을 보여준다.
- y=x 축 위로 이동하려면 데이터 정보를 활용할 필요가 있다.

## 4. Curves in ROC space

이진 분류 문제에서 결정 트리와 같은 많은 분류기의 출력은 Y 또는 N이다. 분류 결과가 “클래스”이기 때문에 분류 성능은 ROC 그래프에서 하나의 점으로 나타난다.

반면 나이브 베이즈나 신경망과 같은 일부 분류기는 “확률”을 나타내는 수치 값을 출력한다. 그래서 확률의 임계치를 어떻게 설정하냐에 따라, 클래스 분류 결과도 달라진다. 다시 말해 임계치에 따라 TP Rate, FP Rate가 변하기 때문에, 해당 모델의 성능은 ROC 그래프에서 점이 아닌 곡선으로 나타난다.

![Untitled](/images/posts/datascience/an-introduce-to-roc/Untitled%203.png)

위 그림은 20개의 인스턴스로 이루어진 데이터세트에 대한 ROC 곡선 예제를 보여준다. 유한한 인스턴스 집합에대한 측정이기 때문에, 실제로는 계단함수가 된다. 인스턴스 개수가 무한대에 가까워지면 점점 곡선 형태가 된다.

- (0,0) 지점에 해당하는 임계값은(Score) 1.0이다.
- 임계값을 0.9로 낮추면 하나의 인스턴스가 양성으로 분류되면서 (0, 0.1) 지점으로 이동한다.
- 임계값을 낮추면 우상향한다.

### 4.1 Relative versus absolute scores

![Untitled](/images/posts/datascience/an-introduce-to-roc/Untitled%204.png)

위 그림에서, 우측 표를 보면 7,8번이 잘못 분류 되어 정확도가 80%임을 알 수 있다. 그러나 왼쪽 ROC 커브는 (0,0)에서 (0,1)로 수직 상승하는 모습을 볼 수 있다. ROC커브만 보면 완벽한 모델 성능을 보여준다.

### 4.2 Class skew

ROC 곡선은 클래스 분포 변화에 영향을 받지 않는다. 양상 음성 인스턴스의 비율이 달라져도 ROC 곡선은 변하지 않는다.

![Untitled](/images/posts/datascience/an-introduce-to-roc/Untitled%205.png)

클래스 분포 변화에 영향을 받지 않는 이유는, TP Rate 계산 할때는 Positive Class만 사용하고, FP Rate 계산 할떄는 Negative Class만 사용하기 때문이다.

$$ tp \; rate = {TP \over P} $$

$$ fp \; rate = {FP \over N} $$


두 클래스를 혼합해서 사용하는 정확도, 정밀도, f-score는 분포 변화에 민감해진다. 위 그림에서 precision-recall 그래프(오른쪽 그림)는 데이터 분포가 달라지면 그 모양이 많이 변한다. 반면 ROC 그래프는 변화가 없다.

### 4.3 Creating scoring classifiers

많은 분류 모델은 이산적(decrete)이다. 이러한 분류기에서 ROC 커브를 생성하고 싶을때가 있다. 분류기에서 클래스 레이블이 아닌, 점수를 생성하면 된다.

- 의사결정트리의 경우, 노드의 클래스 비율에 따라 레이블을 결정한다. 이때 비율이 점수로 사용 될 수 있다.
- 분류기가 클래스 레이블만 생성하더라도, 레이블의 집계를 사용하여 점수를 생성하는데 사용할 수 있다. 예를 들어 앙상블 모델을 활용하는 방법이 있다. 앙상블에서 각 모델이 투표를 하는데, 그 투표 점수가 클래스 점수로 사용될 수 있다.

## 5. Efficient generation of ROC curves

효율적으로 ROC 곡선을 생성하는 방법은, 임계값에 따른 단조성을 활용하는 것이다. 임계값을 내릴수록 ROC 커브는 우상향한다. 따라서 Score 기준으로 내림차순으로 정렬하고, Score에 따른 인스턴스 분류 결과를 확인하여 TP, FP를 업데이트 할 수 있다.

![Untitled](/images/posts/datascience/an-introduce-to-roc/Untitled%206.png)

## 6. The ROC convex hull

$$
{TP_2-TP_1 \over FP_2-FP_1} = {c(Y,n)p(n) \over c(N,p)p(p)} = m
$$

ROC 그래프에 두 점 (FP_1, TP_1) (FP_2, TP_2)가 있다고 가정하자. 위 방정식은 ROC 그래프 위의 두 지점을 연결한 선의 기울기를 m이라 정의했다. 
선 위 포인트에 해당하는 모든 분류기는 동일한 기대비용을 가진다. 이 선을 Iso-Performance Line이라고 부른다.

```text
💡 위 식에서

- c(Y, n)은 실제 음성인데 모델이 양성이라고 분류한 경우의 비용
- c(N,p)는 실제 양성인데 모델이 음성이라고 분류한 경우의 비용

이라 볼 수 있겠다. 그리고 클래스(p or n)일 확률(p) 을 곱해서  각각의 기대 비용을 계산해 준것이다.
```


ROC 그래프에서 Iso-Performance Line이 북서쪽에 가까울수록 기대비용이 낮다.  더 일반적으로는 ROC Convex Hull 위에 위치하는 경우가 잠재적으로 최적이다.

```text

💡 Convex Hull 

점들의 집합에서 특정 점들을 연결해 만든 다각형이 다른 모든 점들을 포함하면, 그 연결된 점들의 집합을 Convex Hull 이라고 한다.

ROC 커브에서는 가장 북서쪽에 있는 Iso-Performance Line위의 점들이 Convex Hulls 라고 볼 수 있을 것 같다.

```


![Untitled](/images/posts/datascience/an-introduce-to-roc/Untitled%207.png)

위 그림에서 선 CH는 가장 북서쪽에 있는 Iso-Performance Line이며, 그 위의 ROC point들이 Convex Hull이다. B와 C는 Convex Hull이 아니기 때문에 최적의 모델이 될 수 없다.

```text
💡 그럼 A와 C중 어떤 것이 최적일까? 
답 : 내가 풀고 있는 문제가 어떤 문제인지에 따라 달라진다.

```


![Untitled](/images/posts/datascience/an-introduce-to-roc/Untitled%208.png)

$$
{c(Y,n)p(n) \over c(N,p)p(p)} = m
$$

만약 내가 풀고자 하는 문제가 실제 양성인데 음성이라고 잘못 분류했을때의 비용이 음성인데 양성이라 잘못 분류했을때의 비용보다 10배 크고, 각 클래스 개수가 같다면 m은 1/10이 된다. 위 그림에서 기울기가 1/10인 선은 베타이고, 따라서 c가 내가 풀고자하는 문제의 최적의 분류기가 된다.

만약 내가 풀고자 하는 문제의 FP, FN 비용은 같은데 N의 데이터가 10배 더 많다면  m은 10이된다. 위 그림에서 기울기가 10인 선은 알파이고, A가 최적의 분류기가 된다.

## 7. Area under an ROC curve(AUC)



분류기의 성능을 비교하기 위해, ROC Curve를 스칼라 값으로 표현할 수 있다. 그 방법은 ROC Curve아래의 영역의 넓이를 계산하는 것이다.

- ROC Curve 아래의 면적은 0~1사이값을 가진다.
- 아래 면적이 넓을수록 ROC Curve 북서쪽에 가깝다.(성능이 좋다)
- 아래 면적이 0.5(ROC Curve가 (0,0) (1,1)까지의 대각선일때의 면적)보다 아래이면 안된다.(랜덤 분류보다 성능이 낮음)

### AUC의 통계적 특성

- AUC는 임의로 선택된 양성 인스턴스에게 임의로 선택한 음성 인스턴스보다 더 높은 순위를 가질 확률과 같다. 이것은 윌콘슨의 순위검정과 일치한다.
- 지니계수와도 연관이 많다. 지니 계수는 2*(AUC)-1 이다.

```text
💡 윌콕슨 순위 검정과의 연관성

분류 문제를 양성 분류 score와 , 음성 분류 score에 차이가 있는지를 윌콕슨의 순위검정을 사용해 
검증하는 것이라 생각할 수 있을 것 같다.

모델이 분류를 잘해 양성 인스턴스 경우 높은 score를 가지고, 음성 인스턴스는 낮은 score를 가진다면,
순위 검정 결과 두 집단에 큰 차이가 있다고 나올 것이다.

```

아래는 맨 휘트니 U 검정(윌콕슨 검정과 같음)과 AUC 스코어의 관계를 정리한 자료이다. <br>
이 자료를 참고하여 맨 휘트니 검정과 AUC 스코어를 비교하는 코드를 작성했다.<br>

참고 자료 https://johaupt.github.io/blog/Area_under_ROC_curve.html


```python
from scipy.stats import wilcoxon
from scipy.stats import mannwhitneyu

import numpy as np
```

#### 데이터 생성

```python

X = np.random.uniform(-1,1, size=[10000,2])
y = np.random.binomial(n=1, p=1/(1+ np.exp(-(1+np.dot(X,[3,-1])+0.3*np.dot(X**2, [3,-1])))))
```

```python
# X shape 확인
X.shape
```

    (10000, 2)

```python
# y shape 확인
y.shape
```

    (10000,)

#### 로지스틱회귀 모델 생성

```python
from sklearn.linear_model import LogisticRegression
```


```python
logit = LogisticRegression()
logit.fit(X,y)

# True coef : [3, -1]
print(logit.coef_)
```

    [[ 2.76188455 -0.95043761]]

```python
# score 저장
logit_score = logit.predict_proba(X)[:,1]
logit_score[:10]
```

    array([0.23671783, 0.44941468, 0.91848767, 0.47544825, 0.93973081,
           0.48526089, 0.88016776, 0.32474005, 0.83718784, 0.14155767])

#### AUC 계산

```python
from sklearn.metrics import roc_auc_score
```


```python
roc_auc_score(y, logit_score)
```
    0.8489586969860821

#### 맨 휘트니 검정

```python
# socre를 A(class=1)와 B(class=0) 그룹을 구분 
A = [logit_score[i] for i in range(len(y)) if y[i] == 1]
B = [logit_score[i] for i in range(len(y)) if y[i] == 0]
```

```python
# 맨휘트니 검정결과, p-value 0.0 으로 귀무가설 기각 A와 B는 서로 다른 분포
statistic, p_value = mannwhitneyu(A, B)
print(statistic)
print(p_value)
```

    18822158.0
    0.0
#### statistic 값과 AUC 관계

```python
# Formula for the relation between AUC and the U statistic
score = statistic/(len(A)*len(B))
# 값이 AUC와 일치함
score 
```
    0.8489586969860821

## 8. Averaging ROC curves

일부 연구자들은 ROC그래프를 사용하여 간단히 어떤 모델이 더 우수한지 확인할 수 있다고 생각한다. 그런데 이것은 단일 테스트 세트에서 정확도가 가장 높은 모델을 선택하는 것과 비슷하다. 분류기를 비교하려면 분산 평가를 해야한다.

### 8.1 Vertical Averaging

![Untitled](/images/posts/datascience/an-introduce-to-roc/Untitled%209.png)

![Untitled](/images/posts/datascience/an-introduce-to-roc/Untitled%2010.png)

오른쪽 그림은 왼쪽 5개의 ROC 곡선에 대한 Vertival Averaging 그림이다. Vertival Averaging은 아래와 같은 특성이있다.

- 고정된 FPR 비율에 대한 TPR의 평균을 구한다.
- TPR에 대한 95% 신뢰구간을 구할 수 있다.(오른쪽 그림의 수직 막대)

### 8.2 Threshold Averaging

vertical averaging은 하나의 종속변수(tpr)로 이루어져있어 신뢰 구간을 계산하기 쉽다. 그러나 Holte(2002)는 종종 연구자가 fpr을 직접 제어할 수 없다는 것을 지적하였다.

![Untitled](/images/posts/datascience/an-introduce-to-roc/Untitled%2011.png)

Threshold Averaging은 threshold를 기준으로 ROC Point들을 평균화합니다. threshold는 연구자가 언제나직접 통제 가능하다.

- 고정된 threshold에 대해서 각 ROC Point의 평균을 구해준다.
- tpr, fpr 에대한 신뢰구간을 구할 수 있다.

## 9. Decision problems with more than to classes

### 9.1 Multi-class ROC graphs


$$ P_i = c_i $$ 

$$ N_i = \bigcup_{j \ne i}c_j \in C $$


두개 이상의 클래스가 있는경우, 하나의 클래스를 양성으로 보고, 다른 모든 클래스는 음성으로 간주하여 분류 성능을 확인 할 수 있다. 이 방법은 편리하지만, 클래스 분포의 불균형에 민감하지 않은 ROC 그래프의 장점을 어느정도 희생시킨다. 각 N_i들이 n-1개의 클래스 합으로 구성되기 때문이다.

### 9.2 Multi-clas AUC

$$
AUC_{total} = \sum_{c_i \in C}AUC(c_i) \cdot p(c_i)
$$

다중 클래스일 경우 AUC는 어떻게 계산할까.

```text
💡 각 c_i 에 대한 AUC와, c_i의 확률을 곱해준 뒤 모두 더해줘서 AUC_total을 계산한다. 
AUC에 대한 기대값이라 볼 수 있겠다.

```

## 10. Interpolating classifiers

하나의 분류기로부터 원하는 성능을 얻지 못할 때가 있다. 대신 이용 가능한 두 분류기를 사용해 원하는 성능을 얻을 수 있다.

예를 들어, 새로운 보험 상품을 판매하려는데, 예산 제약으로 총 4000명의 고객중 800명에게만 세일즈 할 수 있다고 가정하자. 그럼 우리의 목표는 4000명중 제안에 응답할 가능성이 높은 800명을 선택하는 것이다.

이때 응답할 사전 확률이 6%이고, 따라서 4000명중 240명의 응답(양성) 3760명의 비응답(음성)이 예상된다.

![Untitled](/images/posts/datascience/an-introduce-to-roc/Untitled%2012.png)

우리가 응답자, 비응답자를 분류하는 분류기 A와 B를 생성했다고 가정하자. 이 분류기는 고객이 보험을 구매할 확률에 따라 점수를 매긴다.

- A는 (0.1, 0.2)에 위치하고 B는 (0.25, 0.6)에 위치한다.

우리의 목표는 정확히 800명을 타겟팅 하는 것이며, 제약조건(constraint line)은 fp rate * 3860 + tp rate * 240 = 800이다. 만약 분류기 A만을 사용하면 0.1*3760 + 0.2* 240 = 424로 너무 적다. 분류기 B만 사용하면 0.25*3760 + 0.6*240 = 1084로 너무 많다.  위 그림에 A와 B 사이에 있는 C 지점이 우리가 원하는 성능을 제공한다. C지점은 A와 B를 잇는 선과, Constrain Line의 접점을 구하면 알 수 있는데 C는 대략 (0.18, 0.42) 지점에 위치한다.

위 그림에서 k는 A와 B를 잇는 선 길이에서 A와 C사이 거리의 비율이다. 따라서 아래와 같이 선형 보간을 사용해 k를 구할 수 있다.

$$
k = {0.18-0.1 \over 0.25-0.1} \approx 0.53
$$

k 가 0.53이라면, B 분류기의 결정을 0.53 비율로 샘플링하고, A는 0.47 비율로 샘플링 하면 C의 성능을 얻을 수 있다.

## 11. Conclusion

ROC 그래프는 분류기의 성능을 시각화하고 평가하는데 매우 유용하다. 그러나 어떤 메트릭이든 마찬가지로 모두 한계가 있고, 현명하게 사용하려면 그 특성과 한계를 알아야한다.

