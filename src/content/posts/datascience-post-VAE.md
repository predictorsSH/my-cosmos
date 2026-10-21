---
title: VAE의 Loss Function
date: 2024-12-04
category: DataScience
image: /images/posts/datascience/VAE/Untitled(4).png
excerpt: VAE를 공부하고 정리했습니다.
---

VAE를 공부하고 정리하였습니다.  아래의 자료들을 참고하였습니다.

참고 자료

- [강남우 교수님 유투브 강의 영상](https://www.youtube.com/watch?v=GbCAwVVKaHY) 
- [오토인코더의 모든것 - 2/3](https://www.youtube.com/watch?v=rNh2CrTFpm4&t=2192s)
- 만들면서 배우는 생성 AI (도서)


주요 내용
- loss function
- reparameteric trick

## 생성형 모델링

Variational AutoEncoder(VAE)는 생성형 AI다. 생성형 AI를 만든다는 것은 수학적으로 어떤 의미일까?
먼저 더 익숙한 모델인 판별 모델의 수학적인 정의를 살펴보자. 판별 모델을 만든다는 것은 p(y|x)를 추정하겠다는 의미다.
샘플 x가 주어졌을때 레이블 y의 확률을 모델링 하는 것이 판별 모델링의 목표이다.
생성모델은 레이블이 없다. 생성 모델은 샘플 데이터 자체를 관측할 확률을 모델링 하는 것이 목표다.
즉, p(x)를 추정하는 모델을 만드는 것이 생성 모델링이다.

```text
💡 판별 모델링 : p(y|x) 추정, 샘플 데이터 x가 주어졌을때 레이블 y를 관측할 확률을 모델링
💡 생성 모델링 : p(x) 추정, 샘플 데이터를 관측할 확률을 모델링
```

## VAE의 목적 함수

그럼 생성형 AI인 VAE는 어떻게 모델링 할 수 있을까?
먼저 VAE는 latent factors z 가 주어졌을때, 그 z로 부터 이미지 x를 생성하는 것이 목적이다. 
AE(오토인코더)의 디코더를 떠올리면 된다.

![VAE 목표 그림](/images/posts/datascience/VAE/Untitled.png)


생성형 AI는 p(x)를 모델링 하는 것이라고 했다. VAE도 마찬가지로 p(x)를 모델링 해야한다.  
위 그림에서 z의 확률 분포를 p(z)라 하고, z가 주어졌을 때 x의 조건부 확률분포가 p(x|z)라고 하자. 
그럼 우리가 추정할 p(x)는 다음과 같이 표현 할 수있다.

$$
p(x) = \int p(z)p(x|z) dz
$$

그런데 이 때 우리는 실제 학습 데이터가 관측될 확률(가능도)을 최대로 하는 확률 분포 p(x) (data likelihood) 를 추정하고 싶을 것이다. 
즉, 아래 수식을 최대화 하는 파라미터 **θ를 찾는 것이 VAE(디코더)의 진짜 목표가 된다.**

$$
\begin{aligned}
&Maximize \; likelihood \; training \;  data \\
&p_{\theta}(x) = \int p_{\theta}(z)p_{\theta}(x|z) dz
\end{aligned}
$$

위 식에서 p_θ(x|z)는 디코더 네트워크에 해당하고,
p_θ(z)는 가우시안 분포로 가정한다. 그런데 p_θ(x)모든 z에 대해서 적분 하는 것은 불가능하다.
보통 이럴경우 몬테카를로 방법을 사용해 근사하려고 한다. 즉 z에 대해 적분하는 것이아니라, 
랜덤하게 생성된 z에 대해서 Σp_θ(z)p_θ(x|z)를 구하는 것이다.
하지만 이것 또한 계산하기 힘들다.
미니배치마다 z를 샘플링하면서 θ를 업데이트 해야하기 때문에 계산 비용이 너무 많이 든다.

이 문제를 해결하기위해 인코더가 필요하다. 
인코더는 x가 주어졌을 때 z의 확률 분포 실제 사후 확률 p_θ(z|x)를 근사화하는 네트워크다. 
그 인코더를 q_Φ(z|x)라고 정의하자.

![Untitled](/images/posts/datascience/VAE/Untitled(1).png)

먼저 p_θ(z\|x)를 사용해서 p_θ(x)를
다시 표현하면 아래와 같이 표현할 수 있다.

$$
p_{\theta}(x) = {p_{\theta}(x|z)p_{\theta}(x) \over p_{\theta}(z|x)}
$$

그럼 지금까지 내용을 정리하면, 
우리는 인코더와 디코더 네트워크를 활용해서 위 식의 값을 높이는 쪽으로 θ를 업데이트 해야한다.
직관적으로 위 식의 네거티브를 loss function으로 사용해서 네트워크를 학습 시킬 수 있겠다 싶다.

아래는 위 식에서 VAE의 loss function을 유도하는 과정이다. (강남우 교수님 강의 슬라이드)

![Untitled](/images/posts/datascience/VAE/Untitled(2).png)

먼저 우리가 최대화 하려고 하는 data likelihood에 log를 취해주고, 
z가 인코더의 확률분포를 따를때의 기대값 형태로 표현하였다.
log는 단조 증가 함수기 때문에, 우리는 똑같은 최대화 문제를 푸는 것이다.

그리고 해당 식을 쭉 풀어쓰면, 
마지막 등식에서 두번째, 세번째 텀에 KL Divergence 형태가 나온다. 
즉 두번째 텀은 q(z|x)와 p(z)의 거리, 세번째 텀은  q(z|x)와 p(z|x)의 거리를 나타낸다.

마지막 등식의 첫번째 텀을 살펴보면 z가 주어졌을때 x가 나올 확률 즉, 
디코드를 통해 데이터기 복원될 수 있도록 하는 것처럼 보이고

두번째 텀은 인코더를 통과한 z가 z의 사전확률과 비슷하게 만드는 것처럼 보인다.

마지막 세번째 텀에서 p_θ(z|x)는 우리가 계산할 수 없다.
다만 KL Divergence는 항상 0보다 크므로, 세번째 텀은 0보다 큰 것을 알 수 있다.
그래서 VAE는 첫번째, 두번째 텀을 lower bound로 정하고 두 텀을 maximize 할 수 있도록 학습한다.
여기서 첫번째 두번째 텀을 ELBO(Variational Lower Bound)라고 부른다.

결국 최종적인 Loss Function은 다음과 같이 정의된다. (min으로 바꿔주면서 -를 붙여줌)

$$
arg \, min_{\theta, \phi} \sum_{i} - \mathbb{E}_{q_{z}(z|x_{i})}[log(p(x_{i}|g_{\theta}(z)))] + KL(q_{\phi}(z|x_{i})||p(z))
$$

Loss function에서 첫번째 텀은 Reconstruction Error이다. 
디코더가 z를 x_i로 복원할 확률을 Maximize하기 때문이다. 그리고 두번째 텀은 Regularization인데, 내가 가정한 z의 사전 분포가, x_i가 인코더를 통과해서 나온 출력값의 분포가 비슷하게 만들기 때문이다.

## VAE Optimization

이제 loss function을 어떻게 최적화할 수 있는지 알아보자.

### Regularization

먼저 Refularizarion을 최적화하기 위해 두가지 가정이 필요하다.

첫번째 가정은 인코더의 출력의 확률 분포가 multivariate gaussian 분포를 따르는 것이다.

$$
가정 1 \, \, \, \, q_{\phi}(z|x_{i})\sim N(\mu,\sigma_{i}^{2}I)
$$

두번쨰 가정은 z의 사전확률 분포는 multivariate normal 분포를 따르는 것이다.

$$
가정 2 \, \, \, \, q_{z}(z|x_{i})\sim N(0,I)
$$

위 두 가정을 가지고 KLD를 계산하면 다음과 같이 식이 정리된다.

$$
KL(q_{\phi}(z|x)||p(z)) = {1 \over 2}\sum_{j=1}^J (\mu_{i,j}^2 + \sigma_{i,j}^2 - ln(\sigma_{i,j}^2) -1)
$$

VAE의 인코더는 위 KL을 계산하기 위해서 µ, σ를 출력한다. 
인코더가 출력한 µ, σ는 위 KL 식이 최소화하도록 
즉, q_Φ가 normal distribution을 따르도록 업데이트 될 수 있다.

![Untitled](/images/posts/datascience/VAE/Untitled(3).png)

### Reconstruction Error

Reconstruction Errorsm 텀은 아래와 같이 표현할 수 있다. 기대값이니 확률을 곱해주고 적분해준 것과 같다.

$$
\mathbb{E}_{q_{z}(z|x_{i})}[log(p(x_{i}|g_{\theta}(z)))] = \int log(p_{\theta}(x_{i}|z))q_{\phi}(z|x_{i})dz
$$

그런데 여기서 모든 z에 대해서 적분하는것은 불가능하다. 
위에서도 언급했지만, 이럴때 몬테카를로 방법을 사용할 수 있다.

$$
\approx {1 \over L}\sum_{z^{i,j}}log(p_{\theta}(x_{i}|z^{i,j}))
$$

z를 매우 많이 샘플링해서 디코더를 태워 log(p_θ(x|z))를 구하고 평균을 내면 기대값과 비슷해 질 것이라고 가정하는 것이다.
그런데  이 방식은 딥러닝에 알맞지 않다. 계산량이 너무 많아지기 때문이다. 
그래서 많은 양의 z를 sampling하지 않고 하나의 z 샘플만 사용한다.

$$
sampling \,\, z^{i,j} \sim N(\mu, \sigma_{i}^2I)
$$

그런데 여기 또 문제가 있다. 하나의 z를 샘플링한다고 하자. 
랜덤한 샘플링에는 역전파를 쓸 수 없다는 것이다. 랜덤하게 추출하는데 어떻게 미분을 할 수 있겠는가.
따라서 우리는 sampling 과정을 미분 가능한 식으로 바꿔야한다. 
그 식은 아래와 같고 Reparametrization Trick이라고 부른다.

$$
sampling \,\, z^{i,j} = \mu_{i} + \sigma_{i}\odot\epsilon \\ \epsilon \sim N(0,I)
$$

```text
💡 실제 tensorflow에서 표준 정규 분포에서 랜덤한 값을 추출할때 
내부적으로 Reparametrization Trick을 사용한다고 한다.
```

이때까지의 흐름을 정리하면 아래와 같다.

$$
\begin{aligned}
\mathbb{E}_{q_{z}(z|x_{i})}[log(p(x_{i}|g_{\theta}(z)))] &= \int log(p_{\theta}(x_{i}|z))q_{\phi}(z|x_{i})dz \\
&\approx {1 \over L}\sum_{z^{i,l}}log(p_{\theta}(x_{i}|z^{i,l})) \\
&\approx log(p_{\theta}(x_{i}|z^i))
\end{aligned}
$$

그럼 이제 마지막 근사식 log liklighood를 풀면된다. 
log liklihood는 디코더의 출력이다. 
우리는 출력의 분포가 베르누이 분포를 가정할 것인지, 가우시안을 가정할 것인지에 따라
loss function을 Cross Entropy 또는 MSE를 사용한다.

출력이 베르누이를 따른다고 가정하고, log liklihood를 풀면 결국 Cross Entropy가 나온다.

$$
\begin{aligned}
log(p_{\theta}(x_{i}|z^{i})) &= log\prod_{j=1}^{D} p_{\theta}(x_{i,j}|z^i) \\
&= \sum_{j=1}^D log(p_{\theta}(x_{i,j}|z^i)) \\
&= \sum_{j=1}^D log \, p_{i,j}^{x_{i,j}}(1-p_{i,j})^{1-x_{i,j}} \\
&= \sum_{j=1}^{D} x_{i,j}logp_{i,j}+(1-x_{i,j})log(1-p_{i,j})
\end{aligned}
$$

그리고 디코더 출력을 가우시안으로 가정할 수 도 있다. 그렇게 되면 Reconstruction Error는 MSE가 된다.

## 정리

아래 그림은 VAE 의 전체적인 동작 과정을 보여준다. (강남우 교수님의 강의 슬라이드)

![Untitled](/images/posts/datascience/VAE/Untitled(4).png)

배웠던 내용을 간단하게 정리해보자

1. x 가 encoder에 투입되면, 인코더는 평균과 표준편차를 출력해준다.
2. 출력된 평균과 표준편차에서 z를 샘플링한다. 이때 reparametrization trick을 사용한다.
3. z를 디코더에 투입하면, 디코더는 x’를 출력한다.
4. x 와 x’의 Reconstruction 에러와 인코더(q)가 표쥰 정규분포와 가까워지도록 하는 Regularization 에러를 계산한다.
5. 에러를 역전파해 인코더와 디코더의 파라미터를 업데이트한다.
