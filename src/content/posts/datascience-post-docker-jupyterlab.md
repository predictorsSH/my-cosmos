---
title: 주피터랩 컨테이너화 기본
date: 2024-04-09
category: DataScience
image: /images/posts/datascience/docker-jupyterlab/run2.png
excerpt: 도커 활용 사례 가이드 - 주피터랩
---

> 🧑 도커 공식문서 [1](https://docs.docker.com/guides/use-case/jupyter/)과 [2](https://www.docker.com/blog/supercharging-ai-ml-development-with-jupyterlab-and-docker/?_gl=1*git58m*_ga*OTgyNzIxMzY1LjE3MTIxNDgyNDY.*_ga_XJWPQMJYHQ*MTcxMjY1MjAxMC41LjEuMTcxMjY1MjUwOS41MC4wLjA)를 공부하며 정리한 글입니다.

<br>
>Docker와 JupyterLab은 데이터 과학 작업을 더 편리하고 생산적으로 
수행할 수 있도록 도와주는 강력한 툴이다. 특히 두가지를 동시에 사용하면 **재현 가능한** 데이터 과학 
환경을 만들고 실행할 수 있다.

## JupyterLab을 컨테이너화하는 이유

- 컨테이너화는 서로 다른 배포에서도 JupyterLab 환경의 일관성을 유지하도록 보장한다.
- 컨테이너로 패키징된 JupyterLab은 운영체제에 관계 없이 notebook 환경을 다른 사람에게 쉽게 공유할 수 있다. 
수동으로 종속성을 설치하고 환경을 구성할 필요가 없어 재현 가능한 연구 또는 작업을 공유하기가 더욱 쉬워진다.
- JupyterLab 환경을 필요에 맞게 확장할 수 있다. 동시에, 여러 사용자가 JupyterLab을 사용하거나, 대규모 데이터를 처리할 때
여러 JupyerLab 인스턴스를 실행하는 컨테이너를 쉽게 생성하고, 워크로드를 분산시킬 수 있다. 컨테이너 오케스트레이션 플랫폼을 활용하여 
효율적으로 리소스를 관리할 수 있다.

## JupyterLab 컨테이너 실행하기

[JupyterLab 이미지 참고자료](https://jupyter-docker-stacks.readthedocs.io/en/latest/using/selecting.html#selecting-an-image)
<br>
>docker hub에는 base-notebook, scipy-notebook, tensorflow-notebook, pytorch-notebook
등 다양한 형태의 JupyerLab 이미지가 있다. 
포스팅에서는 base-notebook을 사용한다. base-notebook은 최소한의 기능을 가지고 있는 이미지라고 생각하면 된다.<br>

```commandline
docker run -it --rm -p 10000:8888 -v /Users/sanghyun/my-jupyter-data:/home/jovyan/work jupyter/base-notebook
```
 - --rm:  컨테이너가 종료될 때 자동으로 삭제
 - -it: 컨테이너를 실핼할 때 터미널 상에서 사용자와 상호작용할 수 있도록 설정
 - -p: 호스트와 컨테이너 포트 매핑 설정 
 - -v: 호스트와 Docker 컨테이너 사이의 볼륨 마운트를 설정하는 데 사용, 컨테이너 내부와 데이터 공유, 컨테이너 삭제해도 공유된 데이터는 로컬에 저장.

>위 명령을 실행하면 jupyter/base-notebook 이미지를 활용해서(없으면 다운로드)컨테이너를 실행할 수 있다. 
이때, -v 옵션을 사용해 로컬의 특정 경로와 컨테이너 내부 특정 경로를 연결해 파일을 공유할 수 있도록 설정하는 것이 중요하다.
컨테이너가 삭제되면 컨테이너 내에서 생성된 파일과 데이터가 함께 삭제된다. 그래서 컨테이너 내에서 작업한 데이터를 보존하려면 -v 옵션을 사용해 호스트와
컨테이너간 볼륨을 마운트해야한다.<br>

>실행 후 아래와 같은 출력을 볼 수 있다.

```text
http://127.0.0.1:8888/lab?token=a3e3e1a4c1bc9841fb10aead56ec7419e5dec7b38f0fe7fc
```
>브라우저 주소에 출력된 URL(호스트 포트인 10000으로 변경)과 토큰을 입력하면 아래와 같이 실행된 JupyterLab을 확인 할 수 있다.

![run](/images/posts/datascience/docker-jupyterlab/run.png)

## 종속성 설치하기

>JupyerLab에서 ipynb 파일을 열어 다음과 같은 코드를 실행시켜보자.

```python
from sklearn import datasets

iris = datasets.load_iris()
import matplotlib.pyplot as plt

_, ax = plt.subplots()
scatter = ax.scatter(iris.data[:, 0], iris.data[:, 1], c=iris.target)
ax.set(xlabel=iris.feature_names[0], ylabel=iris.feature_names[1])
_ = ax.legend(
   scatter.legend_elements()[0], iris.target_names, loc="lower right", title="Classes"
)
```
>base-notebook 이미지에는 모듈이 없기 때문에 오류가 발생한다.

```python
!pip install matplotlib scikit-learn
```

>matplotlib과 sklearn을 설치해주고 다시 코드를 실행시키면, 성공적으로 데이터를 그려내는것을 확인할 수 있다.

![matplotlib](/images/posts/datascience/docker-jupyterlab/matplotlib2.png)


## 종속성을 이미지화하기 (build)

> 컨테이너를 삭제하고 컨테이너를 다시 실행시키면 종속성 설치를 다시 해야 한다. 이를 피하기 위해 종속성을 Docker 이미지에 포함시킬 수 있다.
> 대부분 파이썬 패키지 관리를 위해 requirements.txt 또는 poetry를 많이 사용한다. 이번에는 requirements.txt를 사용하자.
> 주피터 notebook에 아래 커맨드를 입력하면, 현재 프로젝트에서 사용중인 패키지를 requirements 포맷으로 출력한다.

```python
!pip list --format=freeze > requirements
```

> 컨테이너를 실행할때 -v 옵션으로 볼륨 설정한 경로로 가서 requirements.txt 파일을 확인하자.

![require](/images/posts/datascience/docker-jupyterlab/require.png)

> 나중에 설치한 scikit-learn도 잘 들어가있는 것을 확인할 수 있다.

### Dockerfile 작성

> 이제 이미지 빌드에 필요한 도커 파일을 아래와 같이 작성하자.

```text
FROM jupyter/base-notebook
COPY requirements /home/jovyan/work
RUN python -m pip install --no-cache -r work/requirements
```
> base-notebook 이미지를 기반으로 새로운 이미지를 생성할 수 있는 도커파일이다.
> RUN 명령어를 통해 컨테이너 실행시 requirements.txt에 포함된 패키지를 자동으로 설치한다.

### 이미지 빌드

> 이제 위에서 작성한 Dockerfile을 활용해 이미지를 생성하자.
> 아래 명령어를 입력하면, myjupyer라는 이름의 새로운 이미지가 생성된다.

```commandline
docker image build -t myjupyter
```

> 아래 명령어로 이미지 리스트를 확인할 수 있다.

```commandline
docker images
```


> 이제 생성한 이미지를 사용해 컨테이너를 실행하고

```commandline
docker run -it --rm -p 10000:8888 -v /Users/sanghyun/my-jupyter-data:/home/jovyan/work myjupyter
```

>아래 코드를 다시 실행시켜보자.

```python
from sklearn import datasets

iris = datasets.load_iris()
import matplotlib.pyplot as plt

_, ax = plt.subplots()
scatter = ax.scatter(iris.data[:, 0], iris.data[:, 1], c=iris.target)
ax.set(xlabel=iris.feature_names[0], ylabel=iris.feature_names[1])
_ = ax.legend(
   scatter.legend_elements()[0], iris.target_names, loc="lower right", title="Classes"
)
```

>패키지 설치 없이 잘 동작하는 것을 알 수 있다.

![run](/images/posts/datascience/docker-jupyterlab/run2.png)
