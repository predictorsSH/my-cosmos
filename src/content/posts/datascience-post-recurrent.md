---
title: Recurrent neural network
date: 2022-06-10
category: DataScience
image: /images/posts/datascience/recurrent/cell_state.PNG
excerpt: 순환신경망은 시퀀스 데이터를 다루는데 특화되어 있다.
---


*<핸즈온 머신러닝 2판>을 참고하였습니다.<br>
*[위키독스](https://wikidocs.net/106473)를 참고 하였습니다.
*[참고블로그](https://excelsior-cjh.tistory.com/183)를 참고하였습니다.

## 순환 신경망

순환신경망은 시퀀스 데이터를 다루는데 특화되어 있다. 대표적인 시퀀스 데이터는 언어이다. <br> 
한장의 이미지에는 순서가 없다. 모든 픽셀값은 같은 시간에서의 데이터이다.  <br>
그러나 하나의 문장에는 순서가 있다. 문장은 문장의 앞에서부터 뒤로, 순서대로 들어야 제대로 이해 할 수 있다.<br>  
이렇게 입력 순서가 예측이나, 분류에 중요한 영향을 주는 경우, DNN이나 CNN으로는 한계가 있을 수 있다. DNN과 CNN은 입력 순서를 고려하지 않기 때문이다.<br>
<br>
순환신경망(RNN)은 이전에 입력된 데이터를 **'기억'**함으로써 입력 순서를 고려하게 된다. 이전에 입력된 데이터에 새로 입력되는 데이터들을 더하여 새로운 **요약 정보**를 생성한다.<br>
이렇게 순환신경망의 순환층을 통과하여 나온 **요약된 정보**를 이용해 예측 또는 분류와 같은 태스크들을 수행하게 된다.<br>

## 순환 층
순환 뉴런은 이전에 입력된 데이터를 기억하고, 기억된 정보와 새로운 정보를 합하기위해 당음과 같은 구조를 가진다.<br>

![순환뉴런](/images/posts/datascience/recurrent/recurrent_unit.PNG)

- t-1 시점의 입력 $X_{(t-1)}$가 RNN 셀을 통과하면 $h_{(t-1)}$ (hidden state)와 output 두가지를 각각 만들어낸다.<br>  
- 그리고 t-1 시점의 hidden state는 다음 시점 t 에서 새로운 Input $X_t$ 와 함께 셀에 투입된다.<br>
- 그렇게되면 마찬가지로 $h_t$ (hidden state)와 output 두가지를 각각 만들어내고 이 과정을 하나의 시퀀스가 끝날때까지 반복하게 된다.<br>  

여기서 $h_t$ 가, 이전 시점의 input에 대한 정보를 계속 저장(기억)하고 있음을 알 수있다.<br>
아래 그림은 위 설명한 과정을 시퀀스대로 펼친것을 표현한 그림이다.<br>
  
*아래 그림은 [참고블로그](https://excelsior-cjh.tistory.com/183) 님의 블로그에서 다운받았습니다.<br>

![unrolled recurrent neurl network](/images/posts/datascience/recurrent/rnn_unrolled.PNG)

-   위 그림에서 왼쪽 그림을 타임 스텝에 따라 펼친 그림이 오른쪽 그림이다.
-   **순환신경망에서 순환 뉴런은 새로운 input 데이터 $x$와 함께 이전 타임스텝의 출력인 $y_{(t-1)}$ 을 받는다. (핸즈온 머신러닝에서는 $h_{(t-1)}$ 대신 $y_{(t-1)}$을 받는다고 하였지만, 일반적인 RNN은 $h_{(t-1)}$을 받는것이 맞음)**
-   각 순환뉴런은 두벌의 가중치를 가진다. 하나는 $x_{(t)}$를 위한 $w_x$이고 다른 하나는 $y_{(t-1)}$을 위한 $w_y$이다. (역시 $y_{(t-1)}$ 대신 $h_{(t-1)}$을 위한 $w_h$라고 표기하는 것이 일반적)
-   하나의 샘플에 대한 순환층의 출력은 아래 식과 같이 계산된다. $\phi$는 활성화 함수 
    

$$y_{(t)}= \phi(W_x^Tx_{(t)}+W_y^Ty_{(t-1)}+b)$$ 

$$ or $$

$$h_{(t)}= \phi(W_x^Tx_{(t)}+W_h^Th_{(t-1)}+b)$$

$$Y_t = W^T_y \cdot h_t$$


  
-   타임 스텝 t에서의 모든 입력을 행렬 $X_{(t)}$로 만들어 미니배치 전체에 대해 순환층의 출력을 한번에 계산할 수 있다.
 
    $$Y_{(t)} = \phi(X_{(t)}W_x+Y_{(t-1)}Wy+b)$$
  
## 메모리 셀

-   타임 스텝에 걸쳐서 어떤 상태를 보존하는 신경망의 구성 요소를 메모리 셀이라고 한다.
-   일반적으로 타임 스텝 t에서의 셀의 상태 $h_{(t)}$는 그 타임 스텝의 입력과 이전 타임 스텝의 상태에 대한 함수이다. 
    $h_{(t)} = f(h_{(t-1)}, x_{(t)})$
-   타임 스텝 t에서의 출력 $y_{(t)}$도 이전 상태와 현재 입력에 대한 함수이다.

## LSTM
[내용 참고 및 그림 출처](http://colah.github.io/posts/2015-08-Understanding-LSTMs/)

LSTM은 RNN의 the problem of Long-Term Dependencies 문제를 해결하기 위해 고안 되었다.<br>
LSTM의 구조는 아래와 같다. RNN의 구조와 비교해보자<br>

![Lstm structure](/images/posts/datascience/recurrent/lstm_rnn.PNG)


한눈에 봐도 RNN보다 더 복잡해진 구조를 가지고 있는것을 알 수 있다.<br>
가장 큰 차이를 간단하게 설명하면, LSTM에 Cell State, 그리고 gate들이 추가되었다는 점이다.<br>

## LSTM Cell state
차이를 조금더 자세히 살펴보자.<br>
LSTM의 핵심은 cell state이다.<br>

### 삭제 게이트

![Lstm structure](/images/posts/datascience/recurrent/delete_cell.PNG)

*그림출처:&nbsp;https://dgkim5360.tistory.com/entry/understanding-long-short-term-memory-lstm-kr

forget gate layer라고 부르는 이 단계에서는 $h_{t-1}$ 와 $x_t$로 이루어진 시그모이드를 통해 0에서 1사이의 값을 내보낸다.<br> 
이 값을 cell state($C_{t-1}$)에 곱하게 되는데, 이때 값이 1이면 모든 정보를 기억하는 것이고, 0이면 모든 정보를 잊게(삭제하게) 된다.

### 입력 게이트

![Lstm structure](/images/posts/datascience/recurrent/input_cell.PNG)

*그림출처:&nbsp;https://dgkim5360.tistory.com/entry/understanding-long-short-term-memory-lstm-kr

다음으로 입력게이트는 현재 정보를 기억하기 위한 게이트이다.<br>
현재 시점의 데이터 $x_t$와 이전 시점의 은닉상태 $h_{t-1}$가 시그모이드 함수와 하이퍼볼릭탄젠트 레이어를 통과하여 $i_t$ 와 $\tilde{C}$ 를 생성하고 <br>
$i_t \cdot \tilde{C}$를, 삭제 게이트를 지나고 난 cell state($C_{t-1}$)에 더해준다.

### 출력 게이트

![Lstm structure](/images/posts/datascience/recurrent/output_cell.PNG)

*그림출처 :&nbsp;https://dgkim5360.tistory.com/entry/understanding-long-short-term-memory-lstm-kr

마지막은 출력게이트이다. $h_{t-1}$ 와 $x_t$를 받아 시그모드 함수를 취한 값이 출력게이트이고, <br>
cell state에 하이퍼볼릭 탄젠트를 취한 값이 출력게이트와 연산되면서 값이 걸러지는 효과가 발생하여 은닉상태가 된다.


## 코드테스트

순환신경망 rnn과 lstm에 대해서 간단하게 살펴보았다.<br>
하나의 샘플 데이터로 간단하게 테스트 해보고 이번  포스팅을 마치려고 한다.<br>
먼저, 필요한 라이브러리를 임포트 해주자.

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.layers import SimpleRNN, LSTM
```

### 샘플 데이터생성
```python
#A sample text
text='나는 사과 딸기 바나나 좋아'
word_dict={'나는':[0,0,0,0,0], '사과':[0,1,0,0,0], '딸기':[0,0,1,0,0], '바나나':[0,0,0,1,0], '좋아':[0,0,0,0,1]}

text_vector=np.array([[0,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0],[0,0,0,0,1]])
print(text_vector.shape) #(5, 5)
```
위와 같은 텍스트가 있고, 텍스트안의 워드의 벡터가 word_dict의 value와 같다면
text_vector는 위와 같이 (5,5) shape의 배열로 표현 될 수 있다.

보통 text data를 벡터로 바꾸는 방법으로는 Word2Vec, 원핫인코딩, tfdf 등을 활용한다.

### RNN Layer

```python
#rnn layer 생성
rnn_layer = SimpleRNN(units=2)
```
rnn_layer에 text vector를 넣어보자! <br>
rnn은 input 데이터의 shape이 (배치크기, length, embedding_dim) 이렇게 3차원이 되어야함으로 text_vector의 차원을 늘려줄 필요가 있다.<br>
그리고 배열안의 데이터 타입은 실수여야한다.<br>
하나의 샘플데이터를 가지고 있기 때문에, 배치크기는 1로 한다

```python
text_vector = text_vector.reshape(1,5,5).astype('float32')
text_vector.shape
hidden_state = rnn_layer(text_vector)
print(hidden_state) 
```
```text
tf.Tensor([[ 0.7944882  -0.42401734]], shape=(1, 2), dtype=float32)
```
(1,2) 크기의 텐서가 출력되었다.
이 텐서는 마지막 시점 즉, text_vector의 마지막 벡터까지 계산을 끝마친 시점의 은닉상태이다.<br>
그림으로 보면 다음과 같다.

![Lstm structure](/images/posts/datascience/recurrent/sequence_vector.PNG)

마지막 시점에 대한 출력값만 필요하면 이렇게 return_sequences를 False로 주면 된다.<br>

모든 시점에서의 은닉상태도 출력할 수 있다.

```python
rnn_layer = SimpleRNN(units=2, return_sequences=True)
hidden_state = rnn_layer(text_vector)
print(hidden_state)
```
```text
tf.Tensor(
[[[ 0.          0.        ]
  [ 0.40843144 -0.57421684]
  [-0.67309624  0.8136229 ]
  [ 0.9253792  -0.84764284]
  [-0.95517516  0.8988166 ]]], shape=(1, 5, 2), dtype=float32)
```
(1,5,2) 크기의 텐서가 출력되었다. 총 5번의 입력이 있었으니 5개의 은닉 상태값이 출력 되었음을 알 수 있다.<br>
그림으로 보면 다음과 같다.

![Lstm structure](/images/posts/datascience/recurrent/sequence_sequence.PNG)

위 그림처럼 모든 시점에 대한 출력이 필요하면 return_sequences를 True로 주면 된다.

### LSTM Layer

마찬가지로 LSTM Layer에도 입력해보자!

```python
lstm_layer = LSTM(2, return_sequences=True, return_state=True)

hidden_state, last_state,last_cell_state = lstm_layer(text_vector)
print('hidden state : {}, shape: {}'.format(hidden_state, hidden_state.shape))
print('last hidden state : {}, shape: {}'.format(last_state, last_state.shape))
print('last cell state : {}, shape: {}'.format(last_cell_state, last_cell_state.shape))
```
```text
hidden state : [[[ 0.          0.        ]
  [ 0.01993797  0.07217623]
  [-0.06435854  0.04204876]
  [ 0.04638523  0.13807252]
  [ 0.07843614  0.15157618]]], shape: (1, 5, 2)
last hidden state : [[0.07843614 0.15157618]], shape: (1, 2)
last cell state : [[0.1976986  0.28913993]], shape: (1, 2)
```
위 last cell state를 주목하자. LSTM의 가장 큰 특징중 하나는 Cell State(삭제, 입력, 출력게이트로 이루어진)라고 했었다.<br>
LSTM Layer는 return_state를 True로 했을때, hidden state 뿐 아니라, last cell state까지 출력할 수 있다.


## 마무리
이번 포스팅은 순환신경망에 대해서 간단하게 정리해봤다.<br>
RNN은 Neural Network의 꽃이라고 한다.<br>
인간의 말을 이해하고 구사하는 AI를 만들기 위해서는 RNN의 역할이 필수적일 수 있다.<br>

최근 시퀀스 데이터 처리에 많이 사용하는 Transformer, bert 모델은, rnn 계열의 모델의 성능을 압도한다고 한다.<br>
그러나 결국 transformer, bert 모델은 순환신경망 모델을 개선하기 위한 모델들이고<br>
이러한 모델을 제대로 이해하려면 순환신경망에 대한 이해도 필요할 것이다.
