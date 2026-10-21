---
title: 간단하게 Transformer 논문 이해하기
date: 2022-04-11
category: DataScience
image: /images/posts/datascience/transformer/architecture.PNG
excerpt: 트랜스포머 모델은 Encoder, Decoder, Multi-head Attention, Positional Encoding를 포함하는 구조로 이루어져있다.
---

## Transformer: Attention Is All You Need


## [[paper]](https://arxiv.org/abs/1706.03762)

## 참고자료

[https://youtu.be/AA621UofTUA](https://youtu.be/AA621UofTUA) <br> 
동빈나님의 유튜브강의를 듣고 정리한 내용입니다. <br> 
추가적으로 아래 자료를 참고하여 공부하였습니다. <br>
[https://wikidocs.net/31379](https://wikidocs.net/31379)

## Transformer

트랜스포머는 [Attention Is All You Need](https://arxiv.org/abs/1706.03762) 논문에서 소개된 모델이다.<br> 
논문에서는 sequnece to sequence 문제를 풀기 위해 순환신경망을 사용하지 않는 모델을 만들고자 했고, 그 결과물이 Attention 메커니즘만을 활용한 Transformer 모델이다.

트랜스포머 모델은 Encoder, Decoder, Multi-head Attention, Positional Encoding를 포함하는 구조로 이루어져있다.<br>

![아키텍처](/images/posts/datascience/transformer/architecture.PNG)


## Positional Encoding

NLP에서 Input된 데이터가 제일 처음 만나는 레이어는 임베딩 레이어이다.임베딩은 투입된 문장을 학습하기에 알맞은 벡터로 변환해 주는 작업이다.<br>
<br>
대부분 문장을 단어 단위로 쪼개어, 단어별로 임베딩하게 된다. 이떄, 단어의 위치 정보는 학습에 중요한 역할을 하게 되는데, Transformer은 RNN을 사용하지 않기 때문에 위치 정보를 학습시킬 다른 방법이 필요하다.<br> 
<br>
그 방법이 바로 Positional Encoding이다.<br>
positional Encoding은 sin, cos 주기함수를 활용해 각 단어의 상대적인 위치를 네트워크에 입력한다.<br>

$$ PE\_{(pos,2i)} = sin(pos/10000^{2i/d\_model}) $$ $$ PE\_{(pos,2i+1)} = cos(pos/10000^{2i/d\_model}) $$

Transformer는 아래 그림([출처](https://wikidocs.net/31379))처럼 사인함수와 코사인 함수의 값을 임베딩 벡터에 더해주므로서 단어의 위치에 대한 정보를 주입한다. 어떻게 위 식이 유도되었는지, 어떻게 위치 정보를 주입할수 있는지를 알고싶다면 이 [블로그](https://hongl.tistory.com/231)를 참고하자<br>
<br>

![아키텍처](/images/posts/datascience/transformer/positional_encoding.PNG) 
<br>

임베딩과 positional encoding된 데이터는 Multi-heat Attention의 input이 된다.


![아키텍처](/images/posts/datascience/transformer/Attention1.PNG)

## Multi-head Attention/Self Attention/Scaled Dot-Product Attention
Transformer의 인코더와 디코더는 Multi-head Attention 레이어를 사용한다.<br>
Multi-head Attention은 쉽게 말해서, 여러개의 Attention을 활용하는것이다.<br>
각 Attention이 문장을 서로 다른 관점에서 보고, 그 정보를 잘 통합하여 학습한다면 더 좋은 성능을 낼 수 있을 것이다.<br>


![아키텍처](/images/posts/datascience/transformer/multi-head-attention.PNG)

$$ Attention(Q,K,V) = softmax({QK^T \over \sqrt{d\_k}})V $$ 

$$ head\_i = Attention(QW\_i^Q, KW\_i^K, VW\_i^V) $$ 

$$ MultiHead(Q,K,V) = Concat(head\_1,...head\_h)W^o $$

\*h:head의 개수<br>
<br>
**Attention** Query에 해당하는 단어와 Key에 해당하는 단어들의 연관 정도를 행렬로 나타낸다.<br>
그러기 위해서 **Scaled Dot-Product Attention** 연산을 수행하는데, Query와 각각의 Key들을 곱해주고, 그 값을 Key의 d(차원)에 루트를 취해준 값으로 나눠준다. 그리고 Softmax를 취하여, Query가 어떤 Key와 가장 연관이 있는지 확률값을 구해준다. 그 확률값을 Value와 곱해줘서 최종적으로 Attention Value를 만들어낸다. $\\sqrt{d\_k}$ 로 나누어주는 이유는 softmax 함수에서 gradient vanishing 위험을 줄이기 위해서이다.<br>
<br>
Multi-Head Attention은 서로 다른 Attention을 h개 생성하게 되고, 그것을 **$head\_i$** 라 표현한다.  
최종적으로 $head$들을 concat 시켜준 뒤, output metrics $W^o$와 곱해서 Multi\_head Attention의 값을 구하게 된다.<br>
<br>
Transformer에서는 Self Attention 기법을 활용하는데, Self Attention은 모든 단어들에 대해서 Q,V,K 벡터를 얻은 후, 각 단어들 마다 Attention 연산을 수행하여
자기 자신을 포함한 모든 단어들과의 가중치(연관정도)를 계산하는것이 Self-Attention이다.<br>
<br>
**아래 그림들은 나동빈님의 [교육자료 일부](https://github.com/ndb796/Deep-Learning-Paper-Review-and-Practice/blob/master/lecture_notes/Transformer.pdf) 캡처한 것입니다**

Muli-head Attention(Self Attention)을 수행하는 과정은 아래와 같다.<br>
<br>
**step 1. 각 토큰(단어)에 대해서 Q, K, V 벡터를 얻는다.**<br>

![Q,K,V](/images/posts/datascience/transformer/q_k_v.PNG)


**step 2. Attention 연산(Scaled Dot-Product Attention)을 수행한다.**<br>

![attention](/images/posts/datascience/transformer/Attention2.PNG)



**step 3. Multi-head 연산 수행**

![multi-head](/images/posts/datascience/transformer/multi-head-attention2.PNG)


위 step에서 생략된 부분이 있는데, 패딩 마스크(padding mask) 과정이다.<br>
이 과정은 "PAD" 토큰이 있을 경우, 아무의미 없는 "PAD" 토큰을 Attention 계산에서 무시하도록 하는 과정이다.<br>
무시하는 방법은 어텐션 스코어 행렬의 마스킹 위치에 마이너스 무한대에 가까운 수를 넣어주는 것이다.<br>
그렇게 하면 그 위치의 값은, softmax 함수를 지나면 0이 되어있을 것이다.

## Encoder
![encoder](/images/posts/datascience/transformer/encoder.PNG)

Multi-Head Attention을 수행한 후, 잔여학습(Residual Learning, 글로벌 옵티멀에 도달할 확률이 높아짐)과 Normalization을 수행한뒤,<br>
Feedforward Layer를 거치고 다시 잔여학습과 Normalization을 반복하게 되는데 이것이 하나의 인코더가 된다.<br>
transformer는 총 6개의 인코더 층을 사용하는데 각 인코더는 서로 다른 파라미터를 가진다.

## decoder

![decoder](/images/posts/datascience/transformer/decoder.PNG)

Decoder의 동작 과정을 살펴보면,<br>
Encoder와 마찬가지로 각각 단어정보를 받아서 positional encoding + embedding을 수행한뒤 Decoder로 전달해준다.<br>
<br>
Decoder에서는 두종류의 Attention을 사용하는데 첫번째 Masked Multi-Head Attention은 self attention을 수행한다. 이때, Decoder는 Query에 해당하는 단어의 이후에 등장하는 단어는 Masking 해준다.(look-ahead mask)<br>
<br>
두번째 Attention은 Encoder-Decoder Attention으로 각각의 Decoder에서 출력되고 있는 단어가 Encoder의 출력 단어를 참고할수있고,해당 Attention값은 Decoder에 출력되고 있는 단어가 Encoder 출력의 어떤 단어와 더 연관이 있는지를 나타내줄 수 있다.


## 마무리...
Transformer에 대해 공부하고 정리해봤다.<br> 
미처 공부하지 못한 내용이 많다. positional encoding 의 구체적인 방법론, residual connection, 층 정규화에 대한 내용이 빠졌다.<br>
이 내용들은 따로 공부해서 정리할 필요가 있다고 생각했다.<br>

적은 시간안에 많은 내용을 공부하고 정리하려니, 공부의 질과, 정리의 퀄리티가 떨어진다.<br>
미처 다루지 못한 내용은 꼭 공부해서 정리 해야겠다.
