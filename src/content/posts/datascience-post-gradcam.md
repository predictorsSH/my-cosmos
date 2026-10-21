---
title: 간단하게 Grad-CAM 논문 이해하기 
date: 2022-03-23
category: DataScience
image: /images/posts/datascience/gradcam/guided-grad-cam.PNG
excerpt: 이 논문은 더 투명하고 설명력있는 CNN 기반의 모델을 만들기 위해, '시각적인 설명'을 생성하는 기술(Grad-CAM)을 제안한다.
---

## Grad-CAM: Visual Explanations from Deep Networks via Gradient-based Localization


### [[paper]](https://arxiv.org/pdf/1610.02391.pdf)

### Abstract

이 논문은 더 투명하고 설명력있는 CNN 기반의 모델을 만들기 위해, '시각적인 설명'을 생성하는 기술(Grad-CAM)을 제안한다.<br>
<br>
Gradient-weighted Class Activation Mapping(Grad-CAM)은 target concept에 상관없이,<br> 
마지막 컨볼루션 레이어로 흐르는 gradien를 사용하여, 예측에 중요한 이미지의 영역을 강조하는 localization map을 생성한다.<br>
<br>
Grad-CAM은 다양한 CNN 모델군에 사용할 수 있다 : (1) FC Layer가 있는 모델(e.g. VGG) (2)structured output을 가진 모델,
(3)multi-modal input을 가지는 태스크에 사용되는 모델 혹은 강화학습, 모두 아키텍처의 변화나 재학습없이 사용할 수 있다.<br>
<br>

### Grad-CAM
![overview](/images/posts/datascience/gradcam/overview.PNG)

이전 연구는, 깊은층의 CNN에서 더 높은 수준의 시각적 구조를 포착할 수 있다고 주장한다.(깊은 층으로 갈 수록 원본 이미지의 전체적인 구조를 잘 담고있음)<br>
<br>
게다가 컨볼루션 레이어의 공간적 정보는 FC 레이어에서 손실되기 때문에,(FC Layer를 통과하면서, 이미지의 공간적 정보(구조)는 손실됨)<br>
<br>
마지막 컨볼루션 레이어가 high-level semantics와 세부적인 공간 정보 사이에서 최적의 타협점일 것이다.(마지막 콘볼루션 레이어는, 이미지의 전체적인 구조를 잘 담고 있고 FC Layer에 의해 공간적 정보가 손실되지 않음)<br>
<br>
Grad-CAM은 마지막 CNN layer로 흐르는 gradient 정보를 이용하여 의사결정과 관련된 각 뉴런의 중요도를 이해하고자 하였다.<br>
<br>
때로는 글보다 수식이 더 이해하기 쉽다. 수식을 살펴보자

$$ \alpha^c_k = {1 \over Z} \underset{i}\sum \underset{j}\sum {\partial y^c \over\partial A^k_{ij}} $$

한문장으로 설명하자면,<br>
위 식에서 $\alpha^c_k$는 타겟 클래스 c에 대한, 피처맵 K(K는 채널을 의미)의 중요도(영향력)을 의미한다. 이때 피처맵은 마지막 컨볼루션 레이어의 피처맵이다.<br>
<br>
더 자세하기 살펴보면, $y_c$는 class c에 대한 score이고 이를 $A^k_{ij}$으로 미분하는데,<br>
$A^k$는 컨볼루션 레이어의 k 번째 채널의 피처 맵이다. 그러면 $A^k_{ij}$는 피처맵의 i,j 픽셀이라고 해석할 수 있다.<br>
<br>
class에 대한 score를 피처맵의 픽셀로 미분했을 때, 그 값은 class에 대한 피처맵 픽셀의 (중요도)영향력을 나타내게된다. 그리고, 마지막으로 그 값들을 평균(${1 \over Z} \sum \sum $)냄 으로써,<br>
클래스에 대한 피처맵의 평균적인 영향력을 구한다.

$y_c$ : class c에 대한 score (softmax를 취하기 전의 값)
<br>
<br>
$A^k_{ij}$ : 컨볼루션 레이어의 k 번째 채널의 피처 맵
<br>
<br>
${1 \over Z} \underset{i}\sum \underset{j}\sum $ : global average pooling
<br>
<br>
$\alpha^c_k$ : class c에 대한 피처맵 k의 중요도(영향력)

위에서 구한 K 피처맵의 중요도와 K 피처맵을 선형결합하여, 최종적으로 Grad-CAM을 구하게된다.<br>
이때, $ReLU$를 사용해 양의 영향을 갖는 피처맵의 픽셀들만 가져온다.<br>
이렇게 구해진 Grad-CAM을 히트맵으로 시각화하면, 예측에 긍정적인 영향을 미친 부분들만 표현이 가능하다.

$$ L^c_{Grad-CAM} = ReLU(\underset{k}\sum \alpha^c_k A^k) $$

$L^c_{Grad-CAM} \Subset \mathbb{R}^{u*v} $ : 클래스 c에 대한 넓이u 높이v 사이즈의 localiztion map

Grad-CAM 생각보다 어려운 개념이 아니다.<br>

### Grad-CAM generalizes CAM

논문에서 증명하길 Grad-CAM은 CAM의 일반화 버전이다. <br>
증명하는 내용은 당장 공부할 필요가 없어 생략한다.

### Guided Grad-CAM
Grad-CAM은 예측과 관련된 이미지 영역을 잘 보여줄 수 있지만, 픽셀 단위의 세세한 시각화에는 어려움이 있다.<br>
반면, Guided Backpropop을 통한 시각화는 픽셀 수준의 시각화가 가능하지만, 예측과 관련된 지역을 잘 찾아 주지는 못한다.<br>
<br>
이를 어려운 말로,<br>
Grad-CAM은 class-discriminative 하지만, pixel-space gradient visualization가 어렵고<br>
Guided Backpropop은 pixel-space gradient visualization이 가능하지만, class-discriminative 하지 못한다고 한다. 어휴<br>
<br>
위 두가지 방법의 장점을 합치고자 한 것이 Guided Grad-CAM이다.<br>
Guided Grad-CAM은 Grad-CAM과 Guided Backprop의 element-wise 곱을 통해 생성한다.<br>

![Guided](/images/posts/datascience/gradcam/guided-grad-cam.PNG)
