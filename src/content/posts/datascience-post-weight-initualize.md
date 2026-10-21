---
title: 가중치 초기화를 상수로 하면 안되는 이유
date: 2023-10-30
category: DataScience
image:
excerpt: 가중치 초기화는 최적의 가중치를 찾기 위한 출발지를 정하는 것이기 때문에, 신경망 모델에서 중요한 하이퍼파라미터다.
---


가중치 초기화는 최적의 가중치를 찾기 위한 출발지를 정하는 것이기 때문에, 신경망 모델에서 중요한 하이퍼파라미터다.<br>
가중치를 초기화를 잘한다면, 빠르게 비용함수를 최소화 할 수 있다.<br>

어떻게 가중치 초기화를 잘 할 수 있을까?<br>
먼저, 가중치 초기화의 나쁜 예를 알아보자.

## 가중치를 0 또는 상수로 초기화 할 경우.

가중치를 0으로 초기화 하는 것은 아주 나쁜 방법이다.<br>
한 레이어의 가중치를 0으로 초기화 했다고 생각해보자.<br>
순전파에 때 모든 입력값에 0이 곱해지기 때문에, 활성화 함수는 0울 입력 받아서 늘 같은 값을 출력하게 되므로 학습이 제대로 될 수가 없다.<br>

가중치를 상수로 초기화 하는 것 역시 나쁜 방법이다.<br>
가중치를 상수로 초기화 한다면, 뉴런의 개수에 관계 없이 하나의 뉴런을 사용하는 꼴이 된다.<br>

간단한 모델을 만들어서 테스트 해보자

```jupyterpython

import tensorflow as tf
from sklearn import datasets

iris=datasets.load_iris() #데이터 준비

initializer = tf.keras.initializers.Constant(0.5) #initializer 준비

input = tf.keras.Input(shape=(4,))
hidden_layer = tf.keras.layers.Dense(5, activation = 'relu',kernel_initializer = initializer)(input)
hidden_layer = tf.keras.layers.Dense(5, activation = 'relu',kernel_initializer = initializer)(hidden_layer)
output = tf.keras.layers.Dense(3, activation = 'softmax',)(hidden_layer)

model = tf.keras.Model(input, output)
model.compile('adam','sparse_categorical_crossentropy',metrics=['accuracy'])
model.fit(iris['data'],iris['target'] ,epochs=30) #학습

model.get_weights()[:4] # 첫번째, 두번째 히든 레이어 가중치 출력
```

```text
[array([[0.4633891 , 0.4633891 , 0.4633891 , 0.4633891 , 0.4633891 ],
        [0.46176037, 0.46176037, 0.46176037, 0.46176037, 0.46176037],
        [0.4657983 , 0.4657983 , 0.4657983 , 0.4657983 , 0.4657983 ],
        [0.46686167, 0.46686167, 0.46686167, 0.46686167, 0.46686167]],
       dtype=float32),
 array([-0.03768563, -0.03768563, -0.03768563, -0.03768563, -0.03768563],
       dtype=float32),
 array([[0.4571117 , 0.45544457, 0.5399067 , 0.5430984 , 0.46443442],
        [0.4571117 , 0.45544457, 0.5399067 , 0.5430984 , 0.46443442],
        [0.4571117 , 0.45544457, 0.5399067 , 0.5430984 , 0.46443442],
        [0.4571117 , 0.45544457, 0.5399067 , 0.5430984 , 0.46443442],
        [0.4571117 , 0.45544457, 0.5399067 , 0.5430984 , 0.46443442]],
       dtype=float32),
 array([-0.03272513, -0.04819123,  0.00511513,  0.02694027,  0.00069632],
       dtype=float32)]


```
위 가중치 출력 결과를 보면, 5개의 뉴런이 존재하지만 가중치가 모두 동일한 것을 알 수 있다.<br>
이것을 대칭성(symmetry)라고 하는데, 이 대칭성 때문에 층의 모든 뉴런이 똑같은 동작을 하게 된다.

이러한 대칭성을 회피하기 위해, 가중치를 모두 다른값으로 초기화 해야하는데<br>
대표적인 방법이 가중치를 난수로 랜덤하게 초기화 하는 것이다.
