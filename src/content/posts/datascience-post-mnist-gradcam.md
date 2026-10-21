---
title: MNIST 데이터셋 Grad-CAM 적용
date: 2022-03-27
category: DataScience
image: /images/posts/datascience/gradcam/mnist-gradcam.PNG
excerpt: MNIST데이터 셋으로 Grad-CAM을 간단하게 구현해보았다
---

MNIST데이터 셋으로 Grad-CAM을 간단하게 구현해보았다.<br>
[케라스 공식 문서](https://keras.io/examples/vision/grad_cam/)와 [이 분의 깃허브](https://github.com/jaekookang/mnist-grad-cam/blob/master/mnist_grad_cam.ipynb)를 참고했다.<br>

Grad-CAM [논문 정리 포스트](https://predictorssh.github.io/paper/2022/03/23/Grad-CAM.html)와 함께 보자!

## 먼저 간단한 cnn 모델부터 만들어주자

```python
import numpy as np
import tensorflow as tf
from tensorflow import keras
from keras.models import Model
from keras.layers import Input, Dense, Activation, Flatten, Conv2D, MaxPool2D, Dropout
from keras import backend as K
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import load_model

import matplotlib.pyplot as plt
import matplotlib.cm as cm
import matplotlib.image as mpimg
import cv2
```
### 데이터 준비
mnist 데이터를 불러오고, 학습에 사용할 수 있게 전처리한다.<br>

```python
def dataset():
  mnist = tf.keras.datasets.mnist

  (x_train, y_train), (x_test, y_test) = mnist.load_data()
  x_train, x_test = x_train / 255.0, x_test / 255.0

  x_train = tf.expand_dims(x_train, -1)
  x_test = tf.expand_dims(x_test, -1)

  y_train = to_categorical(y_train)
  y_test = to_categorical(y_test)
  

  return x_train, y_train, x_test, y_test
```
### 모델링
간단한 구조의 CNN 모델을 제작한다.<br>
Grad-CAM에서 중요한 역할을하는 마지막 콘볼루션 레이어의 이름을 'last_conv_layer'로 지정했다.

```python
class MNIST_CNN():
  def __init__ (self, batch_size=32, epochs=1):
    self.batch_size = batch_size
    self.epochs=epochs

    x = Input(shape=(28,28,1))
    h = Conv2D(32, (3,3), activation='relu')(x)
    h = MaxPool2D(pool_size=(2,2))(h)
    h = Conv2D(64, (3,3), activation='relu',name='last_conv_layer')(h) 
    h = Dropout(0.5)(h)
    h = Flatten()(h)
    h = Dense(128, activation='relu')(h)
    h = Dropout(0.5)(h)
    y = Dense(10, activation='softmax')(h)
    self.model = Model(inputs=[x], outputs=[y])
  
    self.model.compile(loss=keras.losses.categorical_crossentropy,
                optimizer='nadam',
                metrics=['accuracy'])
    
  def _train(self,x,y):
    hist = self.model.fit(x,y,
                     batch_size=self.batch_size,
                     epochs=self.epochs,
                     verbose=1,
                     validation_data=(x_test, y_test))
    
    return hist

  def _evaluate(self,x,y):
    score = self.model.evaluate(x,y, verbose=0)
    print(f'Test loss: {score[0]}')
    print(f'Test accuracy: {score[1]}')

  def _save(self):
    self.model.save('drive/MyDrive/Colab Notebooks/XAI/model/mnist_cnn')
    print('Model saved!')
```
모델을 학습시키고 평가한 후, 저장하여 모델을 준비한다.
### 학습
```python
#데이터 준비
x_train, y_train, x_test, y_test=dataset()

#모델준비
mn_model=MNIST_CNN()

#학습
mn_model._train(x_train,y_train)

#모델 평가
mn_model._evaluate(x_test,y_test)
#Test loss: 0.04706098139286041
#Test accuracy: 0.9843000173568726

#모델 저장
mn_model._save()
```
## The Grad-CAM algorithm
이제 Grad-CAM을 구현해보자.<br>
먼저, 저장된 모델을 불러온다.<br>

```python
model = load_model('drive/MyDrive/Colab Notebooks/XAI/model/mnist_cnn')
```
### 테스트 이미지 준비
테스트할 이미지를 준비하자. 필자는 숫자 4 이미지를 선택했다.<br>
```python
#Grad-CAM test image 준비

mnist = tf.keras.datasets.mnist

(x_train, y_train), (x_test, y_test) = mnist.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0

test_img = tf.squeeze(x_train[2]) # 28x28 , 실제 이미지 파일처럼 w*h 크기로 준비

plt.imshow(test_img)
```

![mnist_img](/images/posts/datascience/gradcam/mnist-4.PNG)

이미지를 array 형태로 변경해준다.<br>
img에 img path가 들어가도 무방하다.<br>

```python
def get_img_array(img):
  array = tf.keras.preprocessing.image.img_to_array(img)
  array = np.expand_dims(array, axis=0) # 1*28*28*1
  return array 

img_array=get_img_array(x_train[2])
```
### Grad-CAM
이제 해당 img로 Grad-CAM을 구현하고 heatmap으로 시각화 해보자!
```python
#Grad-CAM hitmap
def make_gradcam_heatmap(img_array,model,last_conv_layer_name,pred_index=None):
  
  grad_model = tf.keras.models.Model(
      [model.inputs],[model.get_layer(last_conv_layer_name).output,model.output]
  )

  with tf.GradientTape() as tape:
    last_conv_layer_output,preds = grad_model(img_array)

    if pred_index is None:
      pred_index = tf.argmax(preds[0]) #모델이 예측한 값

    class_channel = preds[:,pred_index] 

  grads = tape.gradient(class_channel, last_conv_layer_output) #grads = 1*11*11*64 크기의 gradient tensor 
  #class channel에 대한 last_conv_layer의 gradients
  pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))  # 64 크기의 gradient tensor
  #global average pooling

  last_conv_layer_output = last_conv_layer_output[0] # 11*11*64 크기의 레이어
  heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis] # pooled_grads[...,tf.newaxis] = 64*1 크기의 tensor
  #last_conv_layer와 가중치 곱, heatmap= 1*11*11*1 크기의 tensor
  heatmap = tf.squeeze(heatmap) # 11*11

  # 0과 1사이로 normalize, 양의 값만 시각화 하기 위함
  heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
  
  #500*500으로 img resize
  # heatmap = np.uint8(255 * heatmap)
  # heatmap= cv2.resize(heatmap, (500,500))

  return heatmap

heatmap = make_gradcam_heatmap(img_array,model,'last_conv_layer',pred_index=None)
plt.matshow(heatmap)
plt.show()
```
![mnist_img](/images/posts/datascience/gradcam/heatmap.PNG)

원본이미지는 28,28이미지 이지만, 마지막 콘볼루션 layer는 11,11 크기다.<br>
해상도가 매우 낮아 보인다.<br>
위 코드에서 주석 처리되어있는 img resize 코드를 주석 해제하면 더 보기 편한 이미지가 나온다.

![mnist_img](/images/posts/datascience/gradcam/resized_heatmap.PNG)

이미지는 '마지막 콘볼루션 레이어에서, 모델이 숫자 4를 예측하는데 중요한 역할을 한 부분'을 보여준다. <br>
실제 원본 이미지와 함께 보자!

```python
# 원본이미지랑 같이보기
SAVE_PATH="drive/MyDrive/Colab Notebooks/XAI/cam/cam.jpg"
IMG_SIZE=(500,500)

(x_train, y_train), (x_test, y_test) = mnist.load_data()
test_img = tf.squeeze(x_train[2])

def save_display_gradcam(img, heatmap,img_size ,save_path,alpha=0.4):
  img = tf.keras.preprocessing.image.img_to_array(img)
  img = cv2.resize(img, img_size)
  img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

  # Rescale heatmap to a range 0-255
  heatmap = np.uint8(255 * heatmap)
  heatmap_resized = cv2.resize(heatmap, img_size)
  heatmap_resized = cv2.applyColorMap(heatmap_resized, cv2.COLORMAP_JET)

  superimposed_img = heatmap_resized*alpha + img
  cv2.imwrite(save_path, superimposed_img)


save_display_gradcam(test_img, heatmap,img_size=IMG_SIZE, save_path=SAVE_PATH, alpha=0.8)
img = mpimg.imread(SAVE_PATH)
plt.imshow(img)
```
![mnist_img](/images/posts/datascience/gradcam/mnist-gradcam.PNG)

Grad-CAM 알고리즘을 사용해, CNN모델이 숫자 4를 예측할 때 이미지의 어느 부분을 보고 판단하는지 시각화했다.<br>
