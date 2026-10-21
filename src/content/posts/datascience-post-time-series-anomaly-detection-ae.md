---
title: (keras) Timeseries anomaly detection using an Autoencoder
date: 2024-01-22
category: DataScience
image: /images/posts/datascience/time-series-anomaly-detection-ae/Timeseries%20anomaly%20detection%20using%20an%20Autoencoder_29_0.png
excerpt: 오토 인코더를 사용한 시계열 이상탐지
---


## 오토 인코더를 사용한 시계열 이상탐지
> 🧑: [Keras code example](https://keras.io/examples/timeseries/timeseries_anomaly_detection/)을 따라 공부한 것입니다. <br>
> - This Script is written following a Keras code example

> 🎯 code example goals 
- 시계열 데이터에서 이상 감지를 어떻게 하는지 알아보기 위해
- To understand how to perform anomaly detection on time series data

> 🧑: 데이터를 어떻게 모델에 입력하고, 모델의 출력 결과를 어떻게 해석해서 anomaly point를 찾아내는지를 중심으로 살펴보았습니다.
> -  I have explored how to input time series data into a model, and how to interpret the model's output to detect anomaly points.
> - This code example has been very helpful with that

### Setup


```python
import numpy as np
import pandas as pd
import keras
from keras import layers
from matplotlib import pyplot as plt
```

### Load the data

> ⛳ dataset
- [Numenta Anomaly Benchmark](https://www.kaggle.com/datasets/boltzmannbrain/nab) 데이터셋 사용
- Using the Numenta Anomaly Benchmark dataset
- 이상 기간이 라벨링 되어있는 일변량 데이터셋
- A univariate dataset with labeled anomalous periods
- NAB중 인공적으로 생성된 단순한 데이터 사용
- Using artificially generated simple data from NAB


```python
master_url_root = "https://raw.githubusercontent.com/numenta/NAB/master/data/"

small_noise_url_suffix = "artificialNoAnomaly/art_daily_small_noise.csv"
small_noise_url = master_url_root + small_noise_url_suffix
df_small_noise = pd.read_csv(
    small_noise_url, parse_dates=True, index_col="timestamp")


daily_jumpsup_url_suffix = "artificialWithAnomaly/art_daily_jumpsup.csv"
daily_jumpsup_url = master_url_root + daily_jumpsup_url_suffix
df_daily_jumpsup = pd.read_csv(
    daily_jumpsup_url, parse_dates=True, index_col="timestamp"
)
```

### Visualize the data


```python
plt.rcParams['axes.spines.top'] = False
plt.rcParams['axes.spines.right'] = False
```


```python
fig, axes = plt.subplots(1,2,figsize=(10,3))

df_small_noise.plot(legend=False,ax=axes[0])
axes[0].set_title("normal", fontweight="bold")

df_daily_jumpsup.plot(legend=False, ax=axes[1])
axes[1].set_title("anomaly", fontweight="bold")

plt.tight_layout()
plt.show()
```



![png](/images/posts/datascience/time-series-anomaly-detection-ae/Timeseries%20anomaly%20detection%20using%20an%20Autoencoder_8_0.png)



### Prepare training data

> - 정상 데이터에서 타겟 데이터를 준비, 데이터는 14일 동안의 매 5분간 측정된 데이터
> - prepare target data from the normal dataset, where the data is measured at 5 mins intervals over a span of 14 days
> - 24 * 8/5 = 288 timesteps per day
> - 288 * 14 = 4032 data points in total


```python
# normalize and save mean and std

training_mean = df_small_noise.mean()
training_std = df_small_noise.std()

df_training_value = (df_small_noise-training_mean) / training_std
print(f"Number of training samples:{len(df_training_value)}")
print(f"mean:{training_mean.values} std:{training_std.values}")
```

    Number of training samples:4032
    mean:[42.43835334] std:[28.07712228]


#### Create sequences


```python
TIME_STEPS = 288

def create_sequences(values, time_steps=TIME_STEPS):
    output = []
    for i in range(len(values) - time_steps + 1):
        output.append(values[i: (i+time_steps)])

    return np.stack(output)
```


```python
x_train = create_sequences(df_training_value.values)
print(f"Training input shape:{x_train.shape}")
```

    Training input shape:(3745, 288, 1)


### Build a Model

> - 합성곱 오토인코더 모델 구축
- build a convolutional reconstruction autoencoder model



```python
model = keras.Sequential(
    [
        layers.Input(shape=(x_train.shape[1], x_train.shape[2])),
        layers.Conv1D(filters=32,
                      kernel_size=7,
                      padding="same",
                      strides=2,
                      activation="relu",
                      ),
        layers.Dropout(rate=0.2),
        layers.Conv1D(
            filters=16,
            kernel_size=7,
            padding="same",
            strides=2,
            activation="relu",
        ),
         layers.Conv1DTranspose(
            filters=16,
            kernel_size=7,
            padding="same",
            strides=2,
            activation="relu",
        ),
        layers.Dropout(rate=0.2),
        layers.Conv1DTranspose(
            filters=32,
            kernel_size=7,
            padding="same",
            strides=2,
            activation="relu",
        ),
        layers.Conv1DTranspose(filters=1, kernel_size=7, padding="same"),
        ]
)

model.compile(optimizer=keras.optimizers.Adam(learning_rate=0.001), loss="mse")
model.summary()
```

    Model: "sequential_2"
    _________________________________________________________________
     Layer (type)                Output Shape              Param #   
    =================================================================
     conv1d_4 (Conv1D)           (None, 144, 32)           256       
                                                                     
     dropout_4 (Dropout)         (None, 144, 32)           0         
                                                                     
     conv1d_5 (Conv1D)           (None, 72, 16)            3600      
                                                                     
     conv1d_transpose_6 (Conv1D  (None, 144, 16)           1808      
     Transpose)                                                      
                                                                     
     dropout_5 (Dropout)         (None, 144, 16)           0         
                                                                     
     conv1d_transpose_7 (Conv1D  (None, 288, 32)           3616      
     Transpose)                                                      
                                                                     
     conv1d_transpose_8 (Conv1D  (None, 288, 1)            225       
     Transpose)                                                      
                                                                     
    =================================================================
    Total params: 9505 (37.13 KB)
    Trainable params: 9505 (37.13 KB)
    Non-trainable params: 0 (0.00 Byte)
    _________________________________________________________________


### Train the model


```python
history = model.fit(
    x_train,
    x_train,
    epochs=50,
    batch_size=128,
    validation_split=0.1,
    verbose=0,
    callbacks=[
        keras.callbacks.EarlyStopping(monitor="val_loss", patience=5, mode="min")
    ],
)
```


```python
plt.plot(history.history["loss"], label="Training Loss")
plt.plot(history.history["val_loss"], label="Validation Loss")
plt.legend()
plt.show()
```



![png](/images/posts/datascience/time-series-anomaly-detection-ae/Timeseries%20anomaly%20detection%20using%20an%20Autoencoder_18_0.png)



### Detecting anomalies

> 재구성 오류 기반 이상 탐지
- 훈련 샘플에서 MAE 손실의 최대값 찾기
- Find max MAE loss value.
- 샘플의 재구성 오류가 MAE 손실의 최대값보다 크면 모델이 익숙하지 않은 패턴을
  감지하고 있다고 추정할 수 있음
- If the reconstruction loss for a sample is greater than the max MAE loss, then we can infer that the model is detecting an unfamiliar pattern


```python
# Get train MAE loss.
x_train_pred = model.predict(x_train)
train_mae_loss = np.mean(np.abs(x_train_pred - x_train), axis=1)

plt.hist(train_mae_loss, bins=50)
plt.xlabel("Train MAE loss")
plt.ylabel("No of samples")
plt.show()

# Get reconstruction loss threshold.
threshold = np.max(train_mae_loss)
print("Reconstruction error threshold: ", threshold)
```

    118/118 [==============================] - 2s 15ms/step




![png](/images/posts/datascience/time-series-anomaly-detection-ae/Timeseries%20anomaly%20detection%20using%20an%20Autoencoder_20_1.png)



    Reconstruction error threshold:  0.06966381197594569



```python
train_mae_loss.shape
```




    (3745, 1)



### Prepare test data


```python
df_test_value = (df_daily_jumpsup - training_mean) / training_std

x_test = create_sequences(df_test_value.values)
print("Test input shape: ", x_test.shape)
```

    Test input shape:  (3745, 288, 1)



```python
# Get test MAE loss.
x_test_pred = model.predict(x_test)
test_mae_loss = np.mean(np.abs(x_test_pred - x_test), axis=1)
test_mae_loss = test_mae_loss.reshape((-1))
```

    118/118 [==============================] - 2s 18ms/step



```python
plt.hist(test_mae_loss, bins=50)
plt.xlabel("test MAE loss")
plt.ylabel("No of samples")
plt.show()

# Detect all the samples which are anomalies.
anomalies = test_mae_loss > threshold
print("Number of anomaly samples: ", np.sum(anomalies))
print("Indices of anomaly samples: ", np.where(anomalies))
```



![png](/images/posts/datascience/time-series-anomaly-detection-ae/Timeseries%20anomaly%20detection%20using%20an%20Autoencoder_25_0.png)



    Number of anomaly samples:  402
    Indices of anomaly samples:  (array([1946, 2522, 2701, 2702, 2703, 2704, 2705, 2706, 2707, 2708, 2709,
           2710, 2711, 2712, 2713, 2714, 2715, 2716, 2717, 2718, 2719, 2720,
           2721, 2722, 2723, 2724, 2725, 2726, 2727, 2728, 2729, 2730, 2731,
           2732, 2733, 2734, 2735, 2736, 2737, 2738, 2739, 2740, 2741, 2742,
           2743, 2744, 2745, 2746, 2747, 2748, 2749, 2750, 2751, 2752, 2753,
           2754, 2755, 2756, 2757, 2758, 2759, 2760, 2761, 2762, 2763, 2764,
           2765, 2766, 2767, 2768, 2769, 2770, 2771, 2772, 2773, 2774, 2775,
           2776, 2777, 2778, 2779, 2780, 2781, 2782, 2783, 2784, 2785, 2786,
           2787, 2788, 2789, 2790, 2791, 2792, 2793, 2794, 2795, 2796, 2797,
           2798, 2799, 2800, 2801, 2802, 2803, 2804, 2805, 2806, 2807, 2808,
           2809, 2810, 2811, 2812, 2813, 2814, 2815, 2816, 2817, 2818, 2819,
           2820, 2821, 2822, 2823, 2824, 2825, 2826, 2827, 2828, 2829, 2830,
           2831, 2832, 2833, 2834, 2835, 2836, 2837, 2838, 2839, 2840, 2841,
           2842, 2843, 2844, 2845, 2846, 2847, 2848, 2849, 2850, 2851, 2852,
           2853, 2854, 2855, 2856, 2857, 2858, 2859, 2860, 2861, 2862, 2863,
           2864, 2865, 2866, 2867, 2868, 2869, 2870, 2871, 2872, 2873, 2874,
           2875, 2876, 2877, 2878, 2879, 2880, 2881, 2882, 2883, 2884, 2885,
           2886, 2887, 2888, 2889, 2890, 2891, 2892, 2893, 2894, 2895, 2896,
           2897, 2898, 2899, 2900, 2901, 2902, 2903, 2904, 2905, 2906, 2907,
           2908, 2909, 2910, 2911, 2912, 2913, 2914, 2915, 2916, 2917, 2918,
           2919, 2920, 2921, 2922, 2923, 2924, 2925, 2926, 2927, 2928, 2929,
           2930, 2931, 2932, 2933, 2934, 2935, 2936, 2937, 2938, 2939, 2940,
           2941, 2942, 2943, 2944, 2945, 2946, 2947, 2948, 2949, 2950, 2951,
           2952, 2953, 2954, 2955, 2956, 2957, 2958, 2959, 2960, 2961, 2962,
           2963, 2964, 2965, 2966, 2967, 2968, 2969, 2970, 2971, 2972, 2973,
           2974, 2975, 2976, 2977, 2978, 2979, 2980, 2981, 2982, 2983, 2984,
           2985, 2986, 2987, 2988, 2989, 2990, 2991, 2992, 2993, 2994, 2995,
           2996, 2997, 2998, 2999, 3000, 3001, 3002, 3003, 3004, 3005, 3006,
           3007, 3008, 3009, 3010, 3011, 3012, 3013, 3014, 3015, 3016, 3017,
           3018, 3019, 3020, 3021, 3022, 3023, 3024, 3025, 3026, 3027, 3028,
           3029, 3030, 3031, 3032, 3033, 3034, 3035, 3036, 3037, 3038, 3039,
           3040, 3041, 3042, 3043, 3044, 3045, 3046, 3047, 3048, 3049, 3050,
           3051, 3052, 3053, 3054, 3055, 3056, 3057, 3058, 3059, 3060, 3061,
           3062, 3063, 3064, 3065, 3066, 3067, 3068, 3069, 3070, 3071, 3072,
           3073, 3074, 3075, 3076, 3077, 3078, 3079, 3080, 3081, 3082, 3083,
           3084, 3085, 3086, 3087, 3088, 3089, 3090, 3091, 3092, 3093, 3094,
           3095, 3096, 3097, 3098, 3099, 3100]),)


### Plot anomalies (Anomaly Detection)

> ⚡이상 포인트 찾는 방법(The method of finding anomalous points.) <br>
Let's say time_steps = 3 and we have 10 training values. Our x_train will look like this:
- 0, 1, 2
- 1, 2, 3
- 2, 3, 4
- 3, 4, 5
- 4, 5, 6
- 5, 6, 7
- 6, 7, 8
- 7, 8, 9




> - 만약 [(3, 4, 5), (4, 5, 6), (5, 6, 7)]가 이상 데이터라면, 포인트 5가 이상이라고 말할 수 있다.
- if the samples [(3, 4, 5), (4, 5, 6), (5, 6, 7)] are anomalies, we can say that the data point 5 is an anomaly.
- = data i is an anomaly if samples [(i - timesteps + 1) to (i)] are anomalies


```python
anomalous_data_indices = []
# data index 287 ~ 3743
for data_idx in range(TIME_STEPS - 1, len(df_test_value) - TIME_STEPS + 1):
    # i부터 i-timesteps+1 까지 모두 이상이면 i는 이상 데이터
    if np.all(anomalies[data_idx - TIME_STEPS +1 : data_idx]):
        anomalous_data_indices.append(data_idx)
```


```python
df_subset = df_daily_jumpsup.iloc[anomalous_data_indices]
fig, ax = plt.subplots()
df_daily_jumpsup.plot(legend=False, ax=ax)
df_subset.plot(legend=False, ax=ax, color="r")
plt.show()

print(f"Number of anomaly data point(timestamps):  {len(anomalous_data_indices)}")
```


![png](/images/posts/datascience/time-series-anomaly-detection-ae/Timeseries%20anomaly%20detection%20using%20an%20Autoencoder_29_0.png)



    Number of anomaly data point(timestamps):  114

