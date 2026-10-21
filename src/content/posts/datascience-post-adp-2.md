---
title: ADP-Statistics-기초통계량-2
date: 2022-03-13
category: DataScience
image: /images/posts/datascience/adp/weather_count.PNG
excerpt: 데이터 분석의 첫번째 지점은 기초통계량을 살펴보는 것이다. 먼저, 어떤 통계량들이 있는지 확인하고, 데이터에서 기초 통계량을 구하고 시각화 해보자.
---

## 🔑 기초 통계량

데이터 분석의 첫번째 지점은 기초통계량을 살펴보는 것이다.
먼저, 어떤 통계량들이 있는지 확인하고, 데이터에서 기초 통계량을 구하고 시각화 해보자.

## 🚪 이전 게시글

이전 게시글 [기초 통계량-1](https://predictorssh.github.io/adp/2022/03/11/ADP-statistics-0.html)에 이어서 작성한 글이다.


## 🐌 데이터 분석
이전 게시글에 이어 데이터 분석을 진행하면서, 기초통계량을 구해보자

### 날씨 데이터 최빈값 확인하기
날씨 데이터의 최빈값을 구해보려고 한다.<br>
최빈값은 가장 많이 등장하는 데이터이다.

```python
train['weather'].value_counts()
```

```text
1    7192
2    2834
3     859
4       1
```

위와 같이 Series.value_counts()는 unique한 value들의 빈도를 보여준다. <br>
상대적으로 맑거나 흐린날이 등장 빈도가 높다.<br>
최빈값은 1(맑은날)이다.

기상 상태가 자전거 대여 횟수에 큰 영향을 미칠 것이라고 누구나 추측 할 수 있다.<br> 
시각화를 통해 확인해보자.

```python
train[['weather','count']].groupby(by='weather').mean().plot(kind='bar')
```
![weather](/images/posts/datascience/adp/weather_count.PNG)


예상대로 1에 가까울 수록, 자건거 대여 수는 많았다.<br>
그런데 비, 눈, 번개로 기상이 매우 안좋은 (weather=4) 경우의 대여 횟수가 3번째로 많다. 왜 그럴까? <br> 
최빈값을 구할때의 표를 보면 weather가 4인 데이터가 하나 뿐이다. 해당 날씨 데이터가 하나밖에 없기 때문에 신뢰할 수 없는 편향된 데이터다. <br>
기계학습시 이러한 편향이 영향을 미치지 않게 하기 위해서는, weather가 4인경우를 3으로 바꾸어 학습을 진행하여야 한다.


### temp, atemp, humdity, windspeed 이상치 찾기
기온, 체감기온, 습도, 풍속 데이터의 이상치를 시각화 하여 찾아보자 <br>
가장 대표적인 방법은 box plot을 그려보는 것이다. <br>

box plot은 데이터의 사분위수, 범위, 이상치등을 한 눈에 확인할 수 있는 그래프이다.

![box_plot](/images/posts/datascience/adp/box_plot_0.PNG)

위 그림처럼<br>
최소값, 제 1사분위수, 제 2사분위수, 제 3사분위수, 최대값을 가지고 그림으로 표현한다.<br>
3가지 사분위수는 차례대로 데이터의 25%, 50%, 75% 위치에 있는 데이터 값을 말한다.<br>
이 때, 2분위수는 중앙값이다.<br>
<br>
최소값은 제 1사분위에서 1.5IQR을 뺀 값이고,<br>
최대값은 제 3사분위에서 1.5IQR을 더한 값이다.<br>
IQR은 3사분위수 - 1사분위수이다.
<br>
box plot에서 최대값과 최소값을 넘어가는 데이터를 이상치라한다.


```python
def _box_plot(feature):
  plt.figure()
  sns.boxplot(x=feature,data=train,palette = 'Spectral')
  plt.title(feature+'box_plot')
  plt.show()
```

지금까지는 필요할 때마다, 코드를 짜서 입력했다.<br>
반복적인 코드 사용이 필요할 때, 위와 같이 사용자 정의 함수를 만들어서 사용할 수 있다.

```python
plt.figure(figsize=(12,5))
plt.subplot(1,4,1)
_box_plot('temp')
plt.subplot(1,4,2)
_box_plot('atemp')
plt.subplot(1,4,3)
_box_plot('humidity')
plt.subplot(1,4,4)
_box_plot('windspeed')
```

![box_plot](/images/posts/datascience/adp/box_plot.PNG)

이렇게 matplotlib과 seaborn 라이브러리를 활용해서 박스 플롯을 그릴수도 있지만,<br>
아래와 같이 pandas에서 제공하는 시각화로도 충분히 표현 가능하다.<br>

```python
train.boxplot(column=["temp", "atemp", 'humidity', 'windspeed']).set_title('Boxplots of Temp, Atemp Humidity, and Windspeed') 
```

![box_plot](/images/posts/datascience/adp/pd_box_plot.PNG)

습도와 풍속의 경우 이상데이터가 존재한다. <br>
이상치를 어떻게 처리 할 것인지는, 이상 데이터의 개수나 특성에따라 다르게 결정해야한다.<br>
우선 이상데이터의 존재를 확인만 하자.

### weather - count box plot 그리기
명목 변수인 weather에 따라, count의 box_plot 그래프를 그려볼 수 도 있다.

```python
plt.figure(figsize = (7, 3))
sns.boxplot(x = 'weather', y = 'count', data = train)
plt.xticks([0,1,2,3],['clear', 'cloud', 'light rain/snow', 'heavy rain/snow'])
plt.show()
```

![box_plot](/images/posts/datascience/adp/weather_box_plot.PNG)

### 사분위수, IQR, 이상치 구해보기

사분위수와 IQR을 직접 구해보자.<br>
구하는 방법은 간단하다. pandas의 quantile() 함수를 활용할 수 있다.

```python
print('min:',train['windspeed'].quantile(0))
print('Q1:',train['windspeed'].quantile(0.25))
print('Q2:',train['windspeed'].quantile(0.5))
print('Q3:',train['windspeed'].quantile(0.75))
print('max:',train['windspeed'].quantile(1))
```

```text
min: 0.0
Q1: 7.0015
Q2: 12.998
Q3: 16.9979
max: 56.9969
```
여기서 구해진 min, max는 box plot의 최소,최대값이 아니다.<br>
box plot은 이상치를 제외한 데이터 중 최대값, 최소값을 찾는 반면<br>
여기서는 단순히 전체 데이터 중 가장 큰 값과 가장 작은 값이다.

이렇게 하나씩 구하는 방법 말고도,<br>
pd.describe()를 활용하면 사분위수와 최소, 최대값 모두 자동으로 구해준다.<br>

이제, windsepped에서 IQR을 구하고 이상치들을 찾아내보자.

```python
Q1 = train['windspeed'].quantile(0.25)
Q3 = train['windspeed'].quantile(0.75)
IQR = Q3-Q1

outlier=(train['windspeed']>Q3+1.5*IQR)|(train['windspeed']<Q1-1.5*IQR)
```
위에 코드에서 정의한 변수 outlier는 이상치 조건에 만족하는 데이터는 True, 이상치 조건을 만족하지 못하는 데이터는 False의 값을 가진다.
outlier의 index를 활용하면, windspeed에서 이상치를 추출할 수 있다.

```python
train['windspeed'][outlier]
```
```text
175      32.9975
178      36.9974
194      35.0008
196      35.0008
265      39.0007
          ...   
10013    32.9975
10154    32.9975
10263    43.0006
10540    32.9975
10853    32.9975
Name: windspeed, Length: 227, dtype: float64
```
총 227개의 이상치가 확인된다.<br>


## 📌 정리

이전 게시글 [기초 통계량-1](https://predictorssh.github.io/adp/2022/03/11/ADP-statistics-0.html)과 이 게시글을 통해서<br>
데이터의 평균, 표준편차, 중앙값, 사분위수, 이상치, 왜도, 첨도 등 기초통계량에 대해서 살펴보았다.<br>

각 통계량에 대한 설명은 최소한으로 하고,<br>
python의 pandas 라이브러리를 활용해 통계량들을 구해보았다.<br>