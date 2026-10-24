"""글을 임베딩해 우주 지도 데이터(src/data/cosmos.json)를 만든다.

- 별: 내 글. 가장 비슷한 글 K개와 연결한다.
- 성단: 유사도 그래프의 군집.
- 행성: 글 본문에서 인용한 외부 링크.

실행: uv run --project pipeline pipeline/cosmos/build.py
"""

import html
import json
import re
import urllib.request
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import frontmatter
import networkx as nx
import numpy as np
from sentence_transformers import SentenceTransformer

ROOT = Path(__file__).resolve().parents[2]
POSTS = ROOT / "src/content/posts"
OUT = ROOT / "src/data/cosmos.json"
TITLE_CACHE = Path(__file__).parent / "planet-titles.json"

MODEL = "BAAI/bge-m3"
K = 3
BODY_CHARS = 2000

SKIP_HOSTS = {"predictorssh.github.io", "www.w3.org"}
GENERIC_LINK_TEXT = {
    "출처",
    "블로그",
    "참고블로그",
    "참고자료",
    "그림",
    "paper",
    "1",
    "2",
    "이 블로그",
    "해당 블로그 포스터",
    "대회보기",
}
URL_RE = re.compile(r"https?://[^\s)\]\"'<>]+")


# ---------- 글 ----------


def strip_code(md: str) -> str:
    md = re.sub(r"```.*?```", " ", md, flags=re.S)
    return re.sub(r"`[^`\n]*`", " ", md)


def clean(md: str) -> str:
    md = re.sub(r"```.*?```", " ", md, flags=re.S)
    md = re.sub(r"\$\$.*?\$\$", " ", md, flags=re.S)
    md = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", md)
    md = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", md)
    md = re.sub(r"<[^>]+>", " ", md)
    md = re.sub(r"[#>*_`|~-]+", " ", md)
    return re.sub(r"\s+", " ", md).strip()


def load_posts():
    posts = []
    for f in sorted([*POSTS.glob("*.md"), *POSTS.glob("*.mdx")]):
        post = frontmatter.load(f)
        excerpt = post.get("excerpt") or ""
        posts.append(
            {
                "id": f.stem,
                "title": post["title"],
                "category": post["category"],
                "excerpt": excerpt,
                "length": len(post.content),
                "_body": post.content,
                "_text": f"{post['title']}\n{excerpt}\n{clean(post.content)[:BODY_CHARS]}",
            }
        )
    return posts


# ---------- 행성 ----------


def normalize_url(url: str) -> str:
    u = urlparse(url.rstrip(".,"))
    host = u.netloc.removeprefix("www.")
    if host == "arxiv.org":
        m = re.search(r"(\d{4}\.\d{4,5})", u.path)
        return f"https://arxiv.org/abs/{m[1]}" if m else url
    if host == "youtube.com" and "v" in parse_qs(u.query):
        return f"https://youtube.com/watch?v={parse_qs(u.query)['v'][0]}"
    return f"https://{host}{u.path}".rstrip("/")


def planet_kind(url: str) -> str:
    host = urlparse(url).netloc
    if "arxiv.org" in host:
        return "paper"
    if "youtu" in host:
        return "video"
    if "kaggle.com" in host or "dacon.io" in host:
        return "dataset"
    if any(h in host for h in ("keras.io", "docker.com", "readthedocs.io", "sas.com", "github.com")):
        return "docs"
    return "article"


def fetch_title(url: str) -> str | None:
    try:
        if "arxiv.org/abs/" in url:
            api = "http://export.arxiv.org/api/query?id_list=" + url.rsplit("/", 1)[1]
            xml = urllib.request.urlopen(api, timeout=10).read().decode()
            titles = re.findall(r"<title>(.*?)</title>", xml, re.S)
            return re.sub(r"\s+", " ", titles[1]).strip() if len(titles) > 1 else None
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        page = urllib.request.urlopen(req, timeout=10).read(200_000).decode("utf-8", "ignore")
        m = re.search(r"<title[^>]*>(.*?)</title>", page, re.S | re.I)
        return re.sub(r"\s+", " ", html.unescape(m[1])).strip()[:80] if m else None
    except Exception:
        return None


def load_planets(posts):
    cache = json.loads(TITLE_CACHE.read_text()) if TITLE_CACHE.exists() else {}
    planets = {}
    for p in posts:
        # 코드 블록, 인라인 코드 안의 주소는 인용이 아니므로 제외
        body = strip_code(p["_body"])
        for m in URL_RE.finditer(body):
            raw = m.group(0)
            host = urlparse(raw).netloc
            if "." not in host or re.match(r"^[\d.:]+$", host) or host.startswith("localhost"):
                continue
            if host in SKIP_HOSTS or re.search(r"\.(png|jpe?g|gif)$", raw, re.I):
                continue
            text = re.search(r"\[([^\[\]]*)\]\]?\($", body[: m.start()])
            url = normalize_url(raw)
            s = planets.setdefault(url, {"id": url, "kind": planet_kind(url), "parents": [], "_texts": []})
            if p["id"] not in s["parents"]:
                s["parents"].append(p["id"])
            if text and text[1].strip() and text[1].strip() not in GENERIC_LINK_TEXT and not text[1].startswith("http"):
                s["_texts"].append(text[1].strip())
    for url, s in planets.items():
        if url not in cache:
            cache[url] = fetch_title(url)
        s["title"] = cache[url] or (s["_texts"][0] if s["_texts"] else urlparse(url).netloc)
        del s["_texts"]
    TITLE_CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=1) + "\n")
    return list(planets.values())


# ---------- 별, 성단 ----------


def main():
    posts = load_posts()
    vecs = SentenceTransformer(MODEL).encode([p["_text"] for p in posts], normalize_embeddings=True)
    sims = vecs @ vecs.T

    links = {}
    for i, p in enumerate(posts):
        order = [j for j in np.argsort(-sims[i]) if j != i][:K]
        p["neighbors"] = [{"id": posts[j]["id"], "sim": round(float(sims[i, j]), 3)} for j in order]
        for j in order:
            links[tuple(sorted((i, int(j))))] = round(float(sims[i, j]), 3)

    g = nx.Graph()
    g.add_weighted_edges_from((a, b, s) for (a, b), s in links.items())
    communities = nx.community.greedy_modularity_communities(g, weight="weight", resolution=1.2, best_n=None)
    for c_idx, members in enumerate(communities):
        for i in members:
            posts[i]["cluster"] = c_idx

    planets = load_planets(posts)
    for p in posts:
        del p["_body"], p["_text"]

    OUT.write_text(
        json.dumps(
            {
                "stars": posts,
                "links": [
                    {"source": posts[a]["id"], "target": posts[b]["id"], "sim": s} for (a, b), s in links.items()
                ],
                "planets": planets,
            },
            ensure_ascii=False,
            indent=1,
        )
        + "\n"
    )
    print(
        f"{OUT.relative_to(ROOT)}: 별 {len(posts)}, 연결 {len(links)}, 행성 {len(planets)}, 성단 {len(communities)}"
    )


if __name__ == "__main__":
    main()
