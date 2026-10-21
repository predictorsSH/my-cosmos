---
title: Transformer 구현 코드로 이해하기 - Positional Encodig
date: 2022-06-23
category: DataScience
image: /images/posts/datascience/transformer/full_architecture.PNG
excerpt: Positional Encoding은 데이터의 순서정보를 학습하기 위해 사용하는 기법입니다.
---

## Transformer: Attention Is All You Need

[paper](https://arxiv.org/abs/1706.03762)<br>

해당 논문을 글로만 읽었을때 남아있는 찝찝함, 가려운 부분을 해소하기 위해서 구현된 코드를 분석하며 공부하였습니다.<br>
딥러닝을 이용한 자연어 처리 입문이라는 교재에서 keras로 구현된 [참고자료](https://wikidocs.net/31379)를 활용하였습니다.<br>


![아키텍처](/images/posts/datascience/transformer/full_architecture.PNG)

## Positional Encoding

positional encoding에 대해서 정리하기에 앞서서,해당 내용을 100% 이해하고 작성한 것이 아님을 알립니다.<br>

#### 요약

- positional encoding은 순서(위치)정보를 학습하기 위한 방법입니다. 
- positional Encoding은 시퀀스 데이터에서 각 위치에대한 representation입니다.
- 위치 정보를 함께 학습하기 위해서 d_model 차원으로 embedding된 시퀀스 데이터 벡터에, Positional Encoding 벡터를 합해줍니다.<br>
- 단일 시퀀스 데이터에 대한 Postional Encoding의 출력은 (시퀀스 길이 x d_model(임베딩차원)) 크기의 벡터가 됩니다.<br>


#### 설명
Positional Encoding은 데이터의 순서정보를 학습하기 위해 사용하는 기법입니다.<br>
transformer가 순환신경망을 사용하지 않고도 시퀀스 데이터를 학습할 수 있는것이 Positional Encoding 덕분입니다.<br>

![아키텍처](/images/posts/datascience/transformer/positional_encoding_architecture.PNG)

아키텍처 그림을 보면, inputs 데이터를 embedding해주고, 거기에 positional encoding을 단순 합한다고 되어있습니다.<br>

이때, Inputs은 정수 인코딩된 데이터 입니다. 그러면 Inputs 데이터의 shape은 (batch_size,시퀀스 길이, )가 됩니다.<br>
단건의 데이터라고 생각하면 shape은 (시퀀스길이, )가 됩니다.

정수 인코딩 된 단건의 데이터를 d 차원으로 embedding 하면 embedding 된 데이터의 크기는 어떻게 될까요?<br>
(시퀀스 길이 , d(임베딩 차원))이 됩니다. <br>

그럼 여기에 Positional Encoding의 출력을 합하기 위해서는, Positional Encoding 역시 (시퀀스 길이, d)가 되어야 할것입니다.<br>
아래 [그림](https://wikidocs.net/31379)(출처)은 위 설명을 알기 쉽게 보여줍니다.

![아키텍처](/images/posts/datascience/transformer/positional_encoding_ex.PNG)


그럼, Positional Encoding을 어떻게 수행할까요?<br>
아래 논문에서 소개한 식처럼, sine cosine 함수를 활용합니다.<br>

![아키텍처](/images/posts/datascience/transformer/positional_encoding_f.PNG)

어떻게 위 식이 유도되었을까요?<br>
Positional Encoding은 결국, 시퀀스 데이터에서 특정 위치(인덱스)에 대한 representation입니다. <br>
간단한 예로 시퀀스 길이가 100이라면, 벡터 [0,1,2...99]가 위치(인덱스)에 대한 representation이 될 수도 있겠죠.
하지만 위와 같이 representation을 하면, 학습할 때 문제가 생깁니다! <br>
시퀀스의 길이는 데이터마다 다릅니다. 따라서 길이가 길어지면 인덱스도 같이 커지기 때문에 훈련시 기울기 폭주가 발생할 수도 있습니다.<br>
또한 학습데이터에 비해 테스트 데이터가 길다면, 모델이 길이에 크게 영향을 받게되어 모델의 일반화가 어려워집니다.<br>

그러나 sine cosine 함수를 이용하면 위와 같은 문제를 해결할 수 있게 됩니다.<br> 
찾아보니 이상적인 positional encoding을 하기 위해서 지켜져야할 조건이 있었습니다.<br>

1. 각 위치마다 고유하고 일관된 벡터가 나와야함
2. 서로 다른 길이의 시퀀스 데이터에 대해서도 적용가능해여함
3. 서로 다른 길이의 시퀀스의 두 인덱스 간의 거리는 일정해야함(첫번쨰와 두번째 인덱스 차이는 두번째 네번째 차이와 동일해야함)
4. 임의의 두행에 대해서 선형변환이 가능해야함(Attention 적용을 위함) - > sin cosine을 번갈아 쓰는 이유

위 조건들을 만족하는 Positional Encoding이 트랜스포머의 Postional Encoding 입니다.
[블로그](https://hongl.tistory.com/231)에서 위 내용을 조금더 자세하게 알아볼수 있습니다.

#### 코드 설명
Positional Encoding을 구현하는 것은 그렇게 어렵지 않습니다.<br>

아래 PositionalEncoding 클래스에서, get_angles 함수는 위치 인덱스 position과 차원 d_model에 따라<br> sine 및 cosine 함수에 들어갈 값(각도)을 구해줍니다.<br>
- position은 데이터의 길이를 표현하는 매개변수입니다.  
- d_model은 임베딩 차원입니다.
즉, 논문의 positional encodig 식에서 $ pos/10000^{2i/dmodel} $ 을 구하는 함수입니다.

positioanl_encoding 함수는 get_angles에서 얻은 각도에 따라,<br>
i(임베딩벡터 내의 차원의 인덱스)가 짝수일 때는 sine 함수를, i가 홀수 일때는 cosine 함수를 사용하여, positional encoding을 수행합니다.<br>

그리고 마지막으로 embedding된 벡터인 inputs과 positional encoding 벡터를 합해줍니다.


```python
class PositionalEncoding():

  def __init__(self,position,d_model):                                           #position : 사용자가 지정하는 최대 데이터의 길이, d_model : 임베딩 차원 
    self.pos_encoding = self.positional_encoding(position, d_model)

  def get_angles(self,position,i,d_model):                                       
    power = (2 * (i // 2)) / tf.cast(d_model, tf.float32)                        # 2i/d_model ,  tf.cast는 tensor의 data type을 변경. i//2 해주는 이유는 짝수 차원 일때 i에 0123... 홀수 차원 일때 i에 0123.. 각각 대입 하기 때문
    angles = 1/tf.pow(10000,power)                                               # tf.pow는 거듭제곱 함수
    return position*angles

  def positional_encoding(self,position,d_model):
    angle_rads = self.get_angles(
        position = tf.range(position, dtype=tf.float32)[:, tf.newaxis],          # shape : (postion,1) 
        i=tf.range(d_model, dtype=tf.float32)[tf.newaxis,:],                     # shape: (1,d_model)
        d_model = d_model
    )

    sines = tf.math.sin(angle_rads[:,0::2])                                                                 
    cosines = tf.math.cos(angle_rads[:,1::2])                                   
    
    angle_rads = np.zeros(angle_rads.shape)
    angle_rads[:,0::2] = sines                                                   # 짝수일때 sines 함수 사용
    angle_rads[:,1::2] = cosines                                                 # 홀수일때 cosines 함수 사용
    pos_encoding = tf.constant(angle_rads)                                       # (문장길이, d_model)
    pos_encoding = pos_encoding[tf.newaxis, ...]                                 # (1,문장길이,d_model) 크기로 변환
                         
    return tf.cast(pos_encoding, tf.float32)

  def __call__ (self, inputs):
    return inputs + self.pos_encoding[:, :tf.shape(inputs)[1], :]                 #input 시퀀스 길이에 맞게 pos_encoding값을 더해줌,  시퀀스 길이 tf.shape(inputs)[1]

```

