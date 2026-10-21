---
title: An overview of gradient descent optimization algorithms
date: 2023-10-31
category: DataScience
image: /images/posts/datascience/gradient-descent-optimization/SGD.PNG
excerpt: 다양한 경사하강법 최적화 알고리즘들을 **직관적**으로 이해
---



## 1. Introduction

#### 논문의 목적
- 다양한 경사하강법 최적화 알고리즘들을 **직관적**으로 이해

#### 논문 내용
- 경사하강법 최적화를 다루는 다양한 알고리즘 소개
- 각 알고리즘별 특징 설명

## 2. Gradient descent variants
목적함수의 경사도를 계산할 때 사용하는 데이터의 양에 따라 3가지 종류의 경사하강법이 있다.

### 2.1 Batch gradient descent 
Batch gradient descent는 모든 학습 데이터를 사용해 비용함수의 경사를 계산한다.

- θ = θ − η · $∇_{θ}$J(θ)

#### 문제점

- 메모리에 모든 데이터를 올려야함
- 새로운 데이터를 실시간으로 학습하는 것이 불가능(온라인 학습 불가능)
- 한번의 업데이트가 매우 느림
- 데이터셋에 유사한 데이터가 있을경우 중복 계산 수행(크리티컬한 문제로 보이지 않는다) 

### 2.2 Stochastic gradient descent

각 샘플 $ x^{(i)} $, $ y^{(i)} $ 을 사용해 파라미터 업데이트 수행한다. 
실제 구현 시 매 에포크마다 훈련 데이터를 섞는다.

- θ = θ − η · $∇_{θ}$J(θ; $ x^{(i)} $ ; $ y^{(i)}$)

#### 특징

- 목적함수의 변동이 큼
- 변동이 커서 local minimum에서 빠져나올 수 있음(장점)
- 변동이 커서 목적함수 수렴이 오래 걸릴 수 있음(단점, 아래 그림 참고)
- 벡터 연산의 장점을 활용 못함(각 샘플 데이터를 순회하면서 gradient를 계산해야함)

![SGD fluctuation](/images/posts/datascience/gradient-descent-optimization/SGD.PNG)

### 2.3 Mini-batch gradient descent

미니배치 경사하강법은 n개 학습 데이터를 가진 미니배치에 대해서 gradient를 계산하고 업데이틀 수행한다.

- θ = θ − η · $∇_{θ}$J(θ; $ x^{(i:i+n)} $ ; $ y^{(i:i+n)}$)

#### 특징

- 업데이트의 분산을 줄여서 더 안정적인 수렴을 도와즘.
- 적절한 batch 크기 적용시 속도가 가장 빠름.(행렬 연산 사용해서 여러 샘플에 대해 한번에 계산)
- 미니배치를 사용할때도 SGD 라는 용어가 일반적으로 사용됨


## 3. Challenges

위 경사 하강법에서 해결이 필요한 몇가지 도전과제가 있다.

- 적절한 학습률 선택이 어려움
  - learning rate schedule는 사전에 정의된 알고리즘으로, dataset 특성에 스스로 적응하는 알고리즘이 아님.
  - learning rate schedule은 모든 파라미터에 같은 학습률을 적용 시킴
- local minima와  saddle point에 빠질 위험이 있다.

```text
잠깐!

saddle point(안정점은) 도함수가 0이지만 극값을 가지지 않는 점을 말한다.
어느 방향에서 보면 극대값이지만, 다른 방향에서 보면 극소값이 되는 점이다.
아래 그림에서 빨간선에선 극소값 파란선에는 극대값을 가지는 점이 안정점이다. 
```

![saddlepoint](/images/posts/datascience/gradient-descent-optimization/saddlepoint.PNG)


## 4. Gradient descent optimization algorithms

### 4.1 Momentum

SGD는 샘플데이터 하나에 대해서 목적함수의 기울기를 계산하고 파라미터를 업데이트 하기 때문에, 최적해로 빠르게 수렴하지 못한다.
그리고 local minima에 빠질 우려가 있다. (기울기가 0에 가까운 평탄한 지역에서 느리게 벗어남)

아래 그림에서 우리는 수직축으로는 더 작은 학습율을 원하고, 수평 축에 대해서는 더 빠르게 학습하길 원한다.

momentum은 최적해의 방향으로 SGD를 **가속**시켜준다.

![momentum](/images/posts/datascience/gradient-descent-optimization/momentum.PNG)

- $ v_t = \gamma v_{t−1}$ + $η∇_{θ}$J(θ)
- $ θ = θ − v_{t} $
- 여기서 $ \gamma $는 1이하의 값을 가진다.(논문에서는 0.9)

momentum의 식을 보면, 기존 경사하강법 보다 $ \gamma v_{t−1}$ 만큼 추가적으로 더 이동 하는 것을 알 수 있다.
$ \gamma v_{t−1} $ 는 이전 step 에서의 기울기 누적이므로 이전에 이동하던 방향으로 조금 더 이동 하는 것이라 볼 수 있다.
정리하면 현재 gradient와 이전의 Gradient 경향(방향)을 모두 감안하여 현재 업데이트 방향과 크기를 결정하는 것이다.


결과적으로 위 두번째 그림과 같이 그래디언트가 동일한 방향을 가리키는 차원에 대한 모멘텀항은 증가하고, 그래디언트 방향이 변경되는 차원에
대한 업데이트는 감소한다.

#### 문제점
- momentum 영향으로 최적해를 지나칠 수 있음(아래 그림 참고) 

![Momentum_issue](/images/posts/datascience/gradient-descent-optimization/Momentum_issue.PNG)

##### 그림의 수식은 의미만 알 수 있게 간단하게 작성하였습니다.

### 4.2 Nesterov accelerated gradient

NAG는 gradient 계산 순서를 바꿔서 Momentum의 문제를 해결하려고했다.

- $ v_t = \gamma v_{t−1}$ + $η∇_{θ}J(θ- \gamma v\_{t-1})$
- $ θ = θ − v_{t} $

위 식 NAG 식에서 Momentum과 차이는 $ η∇_{θ}J(θ- \gamma v\_{t-1}) $ 부분이다.
Gradient를 구할 때 momentum term 크기 만큼 먼저 이동한 후 구하겠다는 것이다. 
그러면 아래 오른 쪽 그림과 같이 최적해에 조금 더 잘 수렴할 수 있다.  

![momentum_NAG](/images/posts/datascience/gradient-descent-optimization/Momentum_NAG.PNG)

### 4.3 Adagrad

이전에는 모든 파라미터에 대해 동일한 학습률을 사용해 학습했다.
그런데 어떤 파라미터는 최적값에 거의 도달했고, 다른 값은 최적해로부터 멀리 떨어져있을 수 있다.

그래서 Adagrad는 지금까지 많이 업데이트된 파라미터에 대해서는 작은 업데이트를 수행하고, 적게 업데이트 된 파라미터에 
대해서는 큰 업데이트를 수행한다.

**Adagrad는 희소한 데이터를 처리하는데 적합하다.**

- $ g_{t,i} = ∇_{θ}J(θ\_{t,i}) $ 

Adagrad는 위 식 처럼 gradient를 구할 때 각 parameter $ θ_{i} $ 마다 gradient를 계산한다.<br> 

- $θ_{t+1,i} = θ_{t,i} - { η \over \sqrt{G_{t,ii} + \epsilon} } · g_{t,i} $

위 식에서 Adagrad가 파라미터를 어떻게 업데이트 하는지 볼 수 있다.
학습률의 분모에 $ \sqrt{G_{t,ii} + \epsilon} $이 들어가는 것 빼고는 SGD와 같은 방법이다.

여기서 $ G_{t,ii} $ 는 t 시점까지 $ θ_{i} $ 에 적용된 gradient의 제곱합이다.
아래 식을 보면 이해하기 쉽다.

- $ G_{t} = G_{t-1} + (∇_{θ}J(θ))^2 $ 

$ G_{t,ii} $ 가 크다는 말은 이때까지 파라미터의 gradient가 크게 변화해왔단 의미이다.
따라서 학습률에 $ G_{t,ii} $ 의 역수를 곱해주면, 그동안 많이 변해온 파라미터의 학습률은 줄어들게 된다.
반대의 경우엔 학습률이 늘어난다.

Adagrad의 식을 행렬연산으로 표현하면 아래와 같다.<br>

- $θ_{t+1} = θ_{t} - { η \over \sqrt{G_{t} + \epsilon} }  \bigodot  g_{t} $

$ G_{t} $는 대각행렬로, 각 대각(i,i)원소에 $ θ_{i} $의 gradient 합이 누적된다.

```text
잠깐!

내 질문 : "Momentum과 Adagrad가 gradient를 누적해서 다음 스텝이 영향을 미친다는게 비슷한데?"

내 답 :
" Momentum은 gradient를 누적하고, Adagrad는 gradient의 제곱을 누적한다.
다시 말해, Momentum은 방향 정보까지 누적하고 Adagrad는 변화량만 누적하여 다음 스텝에 활용한다." 
```

### 4.4 RMSprop/Adadelta

Adagrad는 학습 할수록 학습률이 작아지는 현상이 발생한다. <br>

이 문제를 해결하기 위해, RMSprop는 지수 가중 평균을 사용해 gradient를 누적한다.
지수 가중 평균을 사용하면, 과거의 gradient의 영향이 지수적으로 감소하게 된다.

그리고 과거의 모든 gradients를 계산하는 대신에, 누적되는 과거 그레디언트의 window를 일정한 크기로 제한하게 된다.
이때 w개 이전의 제곱 그레디언트를 저장하는 대신, 지수가중평균으로 구현한다.

```text
잠깐!

내 질문 : "gradient의 window 크기를 제한한다는게 무슨 말이지?"

내 답 : 
"모든 gradient를 사용해 누적하는 대신, 이전 w번 스텝까지의 gradient만 다음 스텝에 영향을 미치도록 하겠다."
"쉽게 말해 최신 gradient 경향만 반영하겠단 이야기"
"그런데 그 방법이, 실제 w개의 gradient를 저장하는 대신 지수 가중평균으로 구현하겠다는 뜻"
"실제로 지수가중평균은 지난 n 번의 데이터의 평균을 구할 때 사용되곤 한다." 
"지수가중평균은 이전 1/1-β 개의 평균과 값이 비슷, β가 0.9 이면 과거 10개 데이터의 평균과 비슷" 
```


- $ E\[g^2]_{t} = \gamma E\[g^2]\_{t-1} + (1- \gamma)g^2\_{t} $
- $ \gamma =0.9 $

위와 같이 gradient 제곱의 가중 평균을 구하면, 먼 과거의 gradient에는 작은 가중치가 곱해진다.

- $θ_{t+1} = θ_{t} - { η \over \sqrt{E\[g^2]\_{t} + \epsilon} } · g_{t} $

### 4.5 Adadelta

Adadelta는 RMSprop와 같이 지수가중평균을 사용해 gradient를 누적한다.<br>
RMSprop와의 차이점은 **가중치 업데이터 단위를 맞추는 작업이 더해진다는 것이다.**


```text
잠깐!

이 부분은 솔직히 무슨 말인지 잘 모르겠습니다.
다음에 다시 읽어보겠습니다 ㅎ..
```

### 4.6 Adam

Adam은 이전에 보았던 좋은 알고리즘 momentum과 adaptive 모두 사용하는 옵티마이저이다.

- $ m_{t} = β_{1}m_{t−1} + (1 − β_{1})g_{t} $

Adam의 momentum 식이다. 앞서 Momentum 공식과 유사하지만, 지수 가중 평균이 적용 된 것을 볼 수 있다.
momentum에도 adagrad처럼 최근 경향을 더 많이 반영하는 장점을 가져왔다.

- $ v_{t} = β_{2}v_{t−1} + (1 − β_{2})g_{t}^2 $

위 식은 Adative learning rate를 적용하는 것으로 RMSprop 나 adadelta와 동일하다.
  
Adam의 파라미터 업데이트를 보면 아래와 같다.
- $θ_{t+1} = θ_{t} - { η \over \sqrt{ \hat{v}\_{t} + \epsilon} } · \hat{m}_{t} $
- $ \hat{m}_{t} = {m\_{t} \over 1-β\_{1}^t}  $
- $ \hat{v}_{t} = {v\_{t} \over 1-β\_{2}^t}  $

$ \hat{m}_{t} \hat{v}\_{t} $ 이 사용된 이유는, 편향을 보정하기 위해서이다.<br>

$ v_{t} $ 로 예를 들면, $ v_{0} $ 은 0으로 초기화 되고, $ v_{1} $ 은 $ 0.999*v_{0} + 0.001\*v_{1} $ 이 된다.
이렇게 되면 $ v_{t} $ 의 초기 값들이 매우 작아지게 되는데 이를 보정하기 위해 $ v\_{t} $ 를 $ 1-β\_{2}^t  $ 로 나눠준다.
t가 커질수록 $ 1-β\_{2}^t $ 값은 1에 가까워지기 때문에 t가 충분히 커지면 편향 보정의 효과는 거의 사라진다.

### 4.7 AdamX

Adam 에서 $ v_{t} $ 를 계산할때 아래 식 처럼 gradient의 L2 norm을 이용한다.<br>

- $ v_{t} = β_{2}v_{t−1} + (1 − β_{2})g_{t}^2 $

이떄 L2 norm 대신 p norm으로 일반화할 수 있다.
- $ v_{t} = β_{2}^pv_{t−1} + (1 − β^p_{2}) \left\| g_{t} \right\| ^p $

큰 p 값에 대한 놈(norm)은 일반적으로 수치적으로 불안정해지는 경향이 있어서 실무에서는 1과 2 놈이 가장 일반적이다.
그러나 ∞ 놈도 일반적으로 안정적인 동작을 보여준다.

- $ u_{t} = β_{2}^\infty v_{t−1} + (1 − β^\infty_{2}) \left\| g_{t} \right\| ^\infty $ <br>
         $= max(β_{2} · v_{t-1}, \left\| g_{t} \right\|) $

```text
잠깐!
norm은 벡터의 길이를 측정하는 방법이다.
L_∞ norm은 벡터 성문들의 절대값 중에서 가장 큰 값으로 계산된다. x = [-3,5,9] 이면 L_∞ 은 9다.
그래서 위와 같이 max norm 식으로 바뀐다.
```

- $θ_{t+1} = θ_{t} - { η \over u_{t} } · \hat{m}_{t} $

### 4.8 Nadam

momentum 대신 NAG와 adaptive를 결합하면 성능이 더 좋지 않을까?

먼저 NAG의 파라미터 업데이트를 보자<br>

- $ g_{t} = ∇θ_{t}J(θ_{t}- \gamma m_{t-1} )  $
- $ m_{t} = \gamma m_{t-1} + ηg_{t}  $
- $ θ_{t+1} = θ_{t} - m_{t} $

Nadma에서는 NAG를 아래와 같이 수정한다.<br>

$$ g_{t} = ∇θ_{t}J(θ_{t})  $$

$$ m_{t} = \gamma m_{t-1} + ηg_{t}  $$

$$ θ_{t+1} = θ_{t} - (\gamma m_{t} + ηg_{t} ) $$

위에 두 식은 NAG방식이 아닌 Momentum 방식을 사용했고,
마지막 파라미터를 업데이트 할때 $ \gamma m_{t-1} $ 대신 $ \gamma m_{t} $를 적용한다. 
Adam에 Nesterov momentum을 적용시키기 위해, 이전 momentum vector를 현재 momentum vector로 바꿔준 것이다.

```text
잠깐!

이 부분도 100% 이해가 되지 않네요
```

최종적으로 Nadam 식은 다음과 같이 정리할 수 있다.

- $ θ_{t+1} =  θ_{t} - {η \over { \sqrt{\hat{v}\_{t} } +\epsilon }} (β_{1} \hat{m}_{t} +  { (1- β\_{1})g\_{t} \over (1-β^t\_{1})})   $
  

### 4.9 Visualization of algorithms

아래 그림에서 gradient 최적화 알고리즘의 동작을 직관적으로 볼 수 있다.

![visualize](/images/posts/datascience/gradient-descent-optimization/visualize.PNG)

오른쪽 그림(a)
- Adagrad, Adadelta, RMSporp은 즉히 올바른 방향으로 빠르게 수렴
- Momentum과 NAG는 초반에 최적해와 다른 방향으로 한번 빠짐
- 그래도 NAG가 더 빠르게 경로를 수정함

왼쪽 그림(b)
- 두번쨰 사진은 안장지점에서의 동작을 보여준다.
- SGD, Momentum, NAG는 안장지점에서 벗어나기 힘들다.
- Adagrad, RMSprop, Adadelta는 빠르게 최적해로 향한다.


### 4.10 Which optimizer to use?

- 입력데이터가 희소하면 Adaptive 알고리즘을 사용해라. 학습률을 조절할 필요가 없음
- Adam, RMSprop, Adadleta는 유사하지만 알고리즘이지만 전반적으로 Adam이 최선의 선택
- SGD는 minimum을 찾지만 최적화하는데 매우 오래 걸리고 learning rate schedule에 크게 의존적

## 5. Parallelizing and distributing SGD 

SGD를 더 빠르게 수행하기 위해서 병렬화,분산이 필요하다.

(생략) 

## 6. Additional strategies for optimizing SGD

SGD 성능을 개선하기 위한 추가적인 전략들을 소개한다.

### 6.1 Shuffling and Curriculum Learning
학습 시 데이터를 특정 순서대로 투입하면, 편향을 일으킬 수 있다. 
따라서 매 에포크 이후 훈련 데이터를 섞는것이 좋다.

그러나 의미 있는 순서를 설정해서 학습 시킬 때도 있다.
이러한 학습을 커리큘럼 학습이라고 한다.

Zaremba와 Sutskever는 LSTM을 사용하여 간단한 프로그램을 평가하기 위해 커리큘럼 학습을 적용하고, 
난이도가 증가하는 순서대로 예제를 정렬하는 단순한 방법보다 결합된 또는 혼합된 전략이 더 좋다는 것을 보여 
주었다.

### 6.2 Batch normalization

일반적으로 학습 전 파라미터의 초기값을 평균이 0이고 분산이 1인 값으로 정규화하는데 학습이 진행되면서 
파라미터를 서로 다른 정도로 업데이트 하면서 이 정규화를 잃게 된다. 

배치 정규화는 매 배치마다 입력을 평균과 분산으로 정규화한다. 그렇게 되면 파라미터 초기화에 덜 신경 쓸 수 있다.

```text
배치 정규화
- 내부 공변량 변화(Internal Covariate Shift), 층 별로 입력 데이터 분포가 달라지는 현상을 해소
- 기우기 소실/폭주 등 모델의 불안전성 완화(배치 정규화를 제안한 논문에서 주장했지만, 이후에 반박들이 나옴)
- 학습 속도 빠르게 함 (상대적으로 큰 학습률 사용 가능해짐)
- 배치 정규화가 왜 학습에 도움되는지는 의견이 좀 갈리지만/ 학습에 도움이 되는건 명백하다고 함
```
### 6.3 Early Stopping

validation 성능이 나아지지 않으면 학습 중지 

### 6.4 Gradient noise

각 기울기 업데이트에 가우시안 분포를 따르는 노이즈 추가
- 깊고 복잡한 네트워크 훈련에 도움이 됨
- 새로운 지역 최소값 탐색 가능성이 높아짐(더 좋은 최솟값을 찾을 수 있게 도와줌)

## 7. Conclusion

Adam을 쓰자! (내 결론)

논문 결론은,<br>
미니 배치 경사하강법이 세가지 경사하강법중 가장 인기가 많다.지금까지 Momentum, Nesterov, Adagrad, adadelta,
RMSprop, Adam, AdamX, Nadam 등 알고리즘을 살펴봤다. 그리고 SGD를 개선하기 위한 다른 전략들을 살펴봤다.
