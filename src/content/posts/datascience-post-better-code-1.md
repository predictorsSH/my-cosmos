---
title: (python basic) 목록을 만들어 순회하기 vs 바로 처리하기
date: 2026-01-03
category: DataScience
image: /images/posts/datascience/python/python.jpg
excerpt: 파이썬에서 흔히 볼 수 있는 데이터 처리 패턴은 두가지 이다.
---

> 이 글은 『파이썬 코딩의 기술 51』(데이비드 메르츠)을 공부하며 정리한 내용입니다.

파이썬에서 흔히 볼 수 있는 데이터 처리 패턴에는 두 가지가 있다.

1. 처리 대상 데이터를 목록에 추가하여, 목록을 순회하면서 각 데이터를 처리
2. 데이터를 하나씩 꺼내면서 바로 처리하기

1번을 사용하는 경우는 자주 볼 수 있고, 꽤 합리적이고 직관적인 구조이다.
하지만 데이터가 너무 많은 경우에는 단순히 목록에 추가하는 작업에 많은 메모리를 소모하게 된다. 만약 모든 데이터를 전부 가지고 있을 필요가 없다면, 2번과 같은 구조를 사용하는 것이 유리할 수 있다.


## 데이터 목록을 만들고, 생성된 목록을 순회하기

```python

# 단어 목록 생성
def read_words(src) -> list[str]:
    words = []
    while True:
        word = get_word(src) # 소스로부터 단어를 가져와 반환
        if word is None:
            break
        words.append(word)
    return words

# 처리 함수
def word_number(word) -> int:
    magic = 0
    for letter in word:
        magic += 1 + ord(letter) - ord("a")
    return magic

words = read_words(src=src)
output = [word_number(word) for word in words]

```


## 생성기를 사용해 그때 그때 바로 처리하기

```python

# 처리 함수
def word_number(word) -> int:
    magic = 0
    for letter in word:
        magic += 1 + ord(letter) - ord("a")
    return magic

def word_numbers(src):
    while (word := get_word(src)) is not None:
        yield word_number(word)

output = list(word_numbers(src))

```

위 두 예제 코드의 가장 큰 차이점은, 처리 대상 데이터를 목록으로 생성하느냐 여부에 있다. 이 예제에서는 단어 목록이지만, 단어 목록이 아닌 훨씬 더 크고 메모리를 많이 소비해야하는 객체였다면, 2번째 예제 코드가 훨씬 효율적일 수 있다.