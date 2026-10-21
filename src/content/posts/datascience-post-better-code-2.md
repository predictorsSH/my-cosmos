---
title: (python basic) dict.keys() VS dict.items()
date: 2026-01-13
category: DataScience
image: /images/posts/datascience/python/python.jpg
excerpt: 딕셔너리 순환에 대해서
---

> 이 글은 『파이썬 코딩의 기술 51』(데이비드 메르츠)을 공부하며 정리한 내용입니다.

가끔 파이썬답지 않은 코드를 볼 수 있다.
- 리스트의 색인 위치를 순환하면서, 데이터 안에서 그 색인에 해당하는 값을 찾는 코드
- 딕셔너리의 키를 순환하면서, 그 키에 해당하는 값을 찾는 코드

오늘은 두번째 dict.keys()를 순환하는 경우를 살펴봤다.

```python

my_dict = {
    'a': 1,
    'b': 2,
    'c': 3
}

# code smell
for key in my_dict.keys():
    print(key, my_dict[key])

```

위와 같이 my_dict.keys()를 순환하는 것은 파이썬 답지 않다.<br>
만약 키를 순회하고 싶다면, 다음과 같이 딕셔너리 자체를 순환해도 무방하다.

```python
for key in my_dict:
    print(key, my_dict[key])

# my_dict를 직접 순환하는 것과 my_dict.keys()는 같은 결과를 반환한다.
all(a is b for a, b in zip(iter(my_dict), iter(my_dict.keys()))) # True
```

일반적으로 딕셔너리를 순환해서 키만 사용하는 경우는 드물다. 만약 값(value)을 사용하는 경우가 드물다 하더라도, 순환 변수에 값을 포함하는게 파이썬 다운 코드 작성이다.

**파이썬 객체는 참조를 통해 접근 한다.** 순환할때 기존 객체의 참조를 할당할 뿐, 객체를 복사하거나 생성하지 않는다. <br>
따라서 value를 사용하는 경우가 드물다 하더라도, value를 순환 변수로 포함하는 비용이 거의 들지 않는다.

```python

# code smell
for key in my_dict:
    if rare_condition(key):
        val = my_dict[key]
        process(key, val)

# better
for key, val in my_dict.items():
    if rare_condition(key):
        process(key, val)

```

결론은 딕셔너리를 순환할 때는 dict.items()를 사용하자.