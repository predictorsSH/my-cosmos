---
title: Towards Total Recall in Industrial Anomaly Detection
date: 2022-11-09
category: DataScience
image: /images/posts/datascience/patchcore/patchcore.PNG
excerpt: 이 논문의 과제는 정상데이터만을 사용하여 모델을 학습시키는 cold-start 문제이다.
---

## Towards Total Recall in Industrial Anomaly Detection

## [[paper]](https://arxiv.org/abs/2106.08265)

![PatchCore](/images/posts/datascience/patchcore/patchcore.PNG)

## Abstract

이 논문의 과제는 정상데이터만을 사용하여 모델을 학습시키는 cold-start 문제이다.
문제 해결을 위한 가장 좋은 접근법은, ImageNet으로 데이터를 Embedding하고 outlier detection 모델로 이상치를 탐지 하는 것이다.<br>

논문에서는 PatchCore를 제안한다.
PatchCore는 Detection과, localization 에서 최첨단 성능을 달성하면서도 빠른 추론시간을 제공한다. *Localization(object가 이미지안의 어디 위치에 있는지 알려주는 것) 
PatchCore는 image-level anomaly detection AUROC 점수를 99.6%까지 달성한다.

## Indroduction
인간의 적은수의 정상데이터만 보고도, 정상적인 편차를 가진 데이터와 이상치를 구별할 수 있다. 
이 연구는, 컴퓨터가 인간처럼 적은 수의 산업용 부품 이미지만를 보고 부품의 결함을(이상치) 탐지하는 문제를 다룬다.<br>

기존 cold-start 문제에 대한 연구들은, 오토인코딩, GANs 와 같은 모델들로, 정상적인 분포를 학습하는 것에 의존한다.
최근에는 target distribution 대한 adaptation 없이(target에 대한 추가적인 학습 없이?), ImageNet 분류모델로부터 common deep representations 활용하는 것이 제안된다.<br>
<br>
adaptation 생략하고도, 이러한 모델들은 강력한 이상탐지와 결함(이상치)의 localization에 강한 성능을 보여준다.<br>
이런 테크닉의 핵심은 deep feature representations의 multiscale nature를 이용하면서, 테스트 샘플과 정상 샘플간의 특징을 대조하는 것이다.<br>
<br>
그런데 미묘한 결함(이상치)의 segmentation은  높은 해상도(high resolution, 입력층에 가까움) feature로 커버가 되는 반면, 
구조적 편차와 전체 이미지 수준의 Anomaly Detection은 더 높은 추상화 feature(입력층으로부터 멈)에 의해 커버된다.
따라서 이 접근법의 본질적인 단점은, target에 대한 adaption이 없기 때문에 높은 추상화 수준에서 특징을 대조하는 것에 대한 신뢰도가 제한적이라는 것이다.<br>
(ImageNet의 높은 추상 특징은 산업환경에서 요구되는 추상 특징과 매우 다름. 사전학습모델을 학습시킨 데이터와 산업용 부품 이미지가 매우 다름)

이 논문에서는 아래 3가지 효과적인 해결방법으로써 PatchCore를 제안한다. <br>
1. maximizing nominal information available at test time. 테스트시 정상 정보를 가능한 최대화.
2. reducing biases towards ImageNet classes. ImageNet의 클래스로부터의 편향을 감소.
3. retaining high inference speeds. 높은 추론 속도 유지

PatchCore는 mid-level network feature를 사용하여, ImageNet classes에 대한 편향을 최소화 하면서도, 
이웃 지역에 대한 feature aggregation은 충분히 공간적 문맥 정보를 보장한다. 
PatcCore는 광범위한 memory bank를 통해 테스트시 사용 가능한 정상 정보를 최적으로 활용할 수 있다.
마지막으로, PatchCore는 추출된 패치 레벨 memory bank의 중복성을 줄이고, 스토리지 메모리와 추론 시간 단축을 위해 greedy coreset subsampling을 추가로 도입하였다.
따라서 PatcCore는 매우 실용적이고, 산업에 활용하기에 매력적이다.

## Related Works

PatchCore에서 사용한 특정 컴포넌트들은 SPADE와 PaDiM과 관련이 있다.<br>
SPADE는 정상 feature의 memory bank를 사용하며, 정상 feature는 사전 학습된 모델에서 추출된다. 그리고 pixel-level과 image-level의 이상탐지에 대해 분리된 접근을 한다.<br>
PatchCore또한 유사하게 memory bank를 사용하지만, neighbourhoodaware patch-level features를 사용하는 차이가 있다.<br>
그리고 memory bank는 서브 샘플링된 coreset이다.(정상 데이터를 전부 활용하지 않음). 이 방식은 더 높은 성능에 더 낮은 추론 비용을 보장한다.<br>
<br>
PatchCore의 image-level의 anomaly detection과 segmentation 두가지 모두에 대한 patch-level의 접근은 PaDiM과 연관이있다.<br>
PaDiM은 patch-level의 anomaly detection을, 각 patch의 고유한 마할라노비스 거리를 측정하는 것으로 제한하는 반면에, PatchCore는 모든 패치들에 대해 동일하게 접근 가능한
효율적인 patch-feature memory bank를 활용한다. (아직 무슨말인지 모르겠지만, 아래 Method를 보며 이해해보자!)

## Method

PatchCore는 아래 3가지 단계로 구성된다.<br>
- Locally aware patch features
- Coreset-reduced patch-feature memory bank
- Anomaly Detection with PatchCore

### Locally aware path features (adaption average pooling, strides=1)

![local patch feature](/images/posts/datascience/patchcore/local_patch_feature.PNG)


PatchCore는 사전학습 모델 $\phi$ 을 사용하는데, 특정 네트워크 층의 feature가 중요한 역할을 한다.<br>
이미지 $x_i$에 대해, $\phi$의 j번째층 피처를 아래와 같이 표현할 수 있다.<br>

$$ \phi_{i,j} = \phi_j(x_i) $$

피처를 선택하는 한가지 방법으로, 마지막 층의 피처 표현을 사용할 수 있다.
그러나 두가지 문제가 발생한다. <br>
<br>
첫째, 정상데이터의 지역적 정보를 잃는다<br>
둘째,  ImageNet의 마지막 층 feature들은 이미지 분류 작업에 편향되어있으며, 이는 연구에서의 anomaly detection 작업과, 평가된 데이터 세트와는 많은 차이가 있다.<br>
따라서 PatchCore는 midel-level 피처 표현을 사용한다.<br>
<br>
patch 표현을 공식화 하기 위해서 이전에 소개한 표현법을 확장한다.<br>
피처맵 $\phi_{i,j}$이  depth $c^\*$  heigjt $h^\*$ 그리고 width $w^\*$ 세가지 차원을 가진 텐서라고 가정하자<br>
우리는, 특정 포지션(h,w)에서의 C차원 피처 slice를 아래와 같이 표현 할 수 있다.<br>


$$ \phi_{i,j}(h,w) = \phi_j(x_i,h,w) $$


$$ h \in \{ 1,....h^* \} $$ 

$$ w \in \{ 1,....w^* \} $$


이상적으로는, 각 patch-representation은 지역 공간 변화에 강한 의미가 있는 anomalous context를 설명하기 위해 충분히 큰 receptive field size로 동작해야한다.<br>
이는 신경망의 더 깊은 층으로 내려가면 가능하지만, 그렇게 되면 ImageNet에 편향되고, 당면한 이상탐지 작업과는 덜 관련이 있는 반면, 교육 비용이 증가하고, feature map 해상도는 떨어진다.<br>

따라서, 공간 해상도를 잃지 않으면서, 작은 spatial deviations에 견고한 feature를 구성하기 위해 local neighbourhood aggregation 기법을 사용한다.<br>
먼저, neighbourhood feature vectors를 아래와 같이 정의하고,

$$ N_p^{(h,w)} = \{(a,b)|a \in [h - [p/2], ...,h+[p/2]], b \in [w-[p/2], ..., w+[[p/2]]]\} $$ 


neighbourhood aggregation을 통한  local neigh locally aware features 는 아래와 같이 표현할 수 있다.

$$ \phi_{i,j}(N_p^{(h,w)}) = f_{agg}(\{\phi_{i,j}(a,b)|(a,b) \in N_p^{(h,w)}\}) $$

$f_{agg}$는 aggregation function을 의미하며 PatchCore에서는 adaptive average pooling을 사용한다.
adaptive average pooling은 각각의 feature map에 대해 local smoothing을 해주는 것과 비슷하다.<br>
(복잡하게 설명했지만, 결국 feature map에 adaptive average pooling을 해준다는 말?)

aggregation을 하고나면, d차원의 single representation이 생성되며 이 representation은 모든 쌍의 (h,w)에 대해 수행되므로 feature map의 해상도를 유지한다.<br>
하나의 feature map $ \phi_{i,j} $ 에 대한 locally aware patch-feature 집합은 <br>

$$ P_{s,p}(\phi_{i,j}(N_p^{(h,w)})) | h,w \, mod \, s = 0, h<h^*, w<w^*, h, w \in \mathbb{N} $$

이렇게 표현한다.<br>
s는 strinding 파라미터로, 해당 연구에서는 1로 설정하였다.<br>

경험적으로 여러층의 feature map을 사용하는 것이 benefit을 제공하는 것을 알아냈다.
그러나 feature의 generality와 공간 해상도를 유지하기 위해, PatchCore는 오직 두 intermediate feature를 사용한다.<br>

j+1 번째 층에서 추출한 patch-features는 j층의 patch-features보다 size가 작기 때문에 bilinearly rescaling을하여 size를 맞춰준 후 합쳐준다.<br>

결과적으로 모든 정상 샘플에 대한, PatchCore memory bank $M$ 은 간단하게 정의된다.<br>

$$ M = 	\bigcup_{x_i \in x_n} P_{s,p}(\phi_j(x_i)). $$ 

### Coreset_reduced patch-feature memory bank

![코어샘플링](/images/posts/datascience/patchcore/subsampling.PNG)

데이터 수가 많아지면, memory bank는 매우 커지고 추론 속도와 요구되는 storage 또한 매우 커진다.<br>
이 연구에서는, coreset subsampling 메커니즘을 사용하여 M의 크기를 줄여서, 성능을 유지하면서 추론 시간을 줄였다.

개념적으로, corset selection의 목표는 A에 대한 과제를 더 빠르게 해결하기 위한 subset $S \subset A$를 찾는 것이다.
본 연구에서는 반복적인 greedy approximation를 제안한다. 그리고 코어세트 선택시간을 더 줄이기 위해 존슨 린덴스트라우스 정리를 활용하여 M의 차원을 줄인다.<br>

![코어샘플링](/images/posts/datascience/patchcore/core_sampling_algorithms.PNG)


### Anomaly Detection with PatchCore

![탐지](/images/posts/datascience/patchcore/detection.PNG)
  

테스트 이미지 $x^{test}$ 에 대한 image-level의 score를 계산한다.<br>
scores는 $P(x^{test} = P_{s,p}(\phi(x^{test})))$ 에 있는 test patch-features들과<br>
메모리 뱅크에 있는 respective nearest neighbour $m^*$ in $M$의 최대 거리이다.

![탐지](/images/posts/datascience/patchcore/score.PNG)

score를 얻기위해서 우리는 scaling $w$ 를 사용한다. <br>
만약 memory bank features가 anomaly candidate $m^{test}$ 그리고 $m^\*$와 가깝다면, 그들은  neighbouring samples과는 멀고, 그렇기 때문에 이미 정상적이지 않은 존재다.<br>
그래서 우리는 test patch feature $m^\*$에 대한 $M$ 안에서의 b nearest patch-feature $N_b(m^\*)$ 와 함께 score를 증가시킨다.

![탐지](/images/posts/datascience/patchcore/final_score.PNG)

우리는 이러한 방식이 단순 최대 패치 거리보다 더 강력하다는 것을 발견했다.<br>

Segmentation map은 다음 step으로 계산된다.<br>
계산된 patch anomlay score를 각각의 공간 위치를 기반으로 재조정하고, 원본 이미지와 해상도를 맞추기 위해 upsclae한다. 이때 bi-linear interpolation 기법을 사용한다.<br>
추가적으로 우리는 Gaussian of kernel를 사용하여 결과를 smooothed 했다. 
