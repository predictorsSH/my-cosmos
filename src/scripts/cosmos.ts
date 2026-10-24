import * as d3 from 'd3';
import cosmos from '../data/cosmos.json';

type Category = 'DataScience' | 'Book' | 'Life';

interface Star extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  category: Category;
  excerpt: string;
  length: number;
  cluster: number;
  neighbors: { id: string; sim: number }[];
  r: number;
  planets: Planet[];
}

interface Planet {
  id: string;
  title: string;
  kind: 'paper' | 'video' | 'dataset' | 'docs' | 'article';
  parents: string[];
  angle: number;
  speed: number;
  orbit?: number;
  x: number;
  y: number;
}

interface Link extends d3.SimulationLinkDatum<Star> {
  source: Star;
  target: Star;
  sim: number;
}

const CAT_COLOR: Record<Category, string> = { DataScience: '#8fb3ff', Book: '#ffc98a', Life: '#ff9ccf' };
const CLUSTER_COLORS = ['#5b7cff', '#9a6bff', '#3fb6c9', '#ff7aa8', '#6fd1a0', '#ffb36b', '#7f8cff', '#c77dff'];
const PLANET_KIND = { paper: '논문', video: '영상', dataset: '데이터셋', docs: '문서', article: '아티클' };
const DESKTOP = '(min-width: 861px)';

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function initCosmos(el: HTMLElement) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 데이터 ---------- */
  const stars = structuredClone(cosmos.stars) as Star[];
  const byId = new Map(stars.map((s) => [s.id, s]));
  const links = cosmos.links.map((l) => ({ ...l })) as unknown as Link[];
  const planets = (cosmos.planets as Omit<Planet, 'angle' | 'speed' | 'x' | 'y'>[])
    .map((s) => ({ ...s, parents: s.parents.filter((p) => byId.has(p)) }))
    .filter((s) => s.parents.length > 0)
    .map((s) => ({
      ...s,
      angle: Math.random() * Math.PI * 2,
      speed: (Math.random() * 0.5 + 0.5) * (Math.random() < 0.5 ? -1 : 1) * 0.00018,
      x: 0,
      y: 0,
    })) as Planet[];

  const [smin, smax] = d3.extent(links, (l) => l.sim) as [number, number];
  const norm = (s: number) => (s - smin) / (smax - smin || 1);
  const lenScale = d3
    .scaleSqrt()
    .domain(d3.extent(stars, (d) => d.length) as [number, number])
    .range([3.2, 7]);
  stars.forEach((d) => {
    d.r = lenScale(d.length);
    d.planets = [];
  });
  planets.forEach((s) => s.parents.forEach((p) => byId.get(p)!.planets.push(s)));
  stars.forEach((d) =>
    d.planets
      .filter((s) => s.parents.length === 1)
      .forEach((s, i) => (s.orbit = d.r * 3 + 10 + i * 7)),
  );

  /* ---------- 배경 별가루 ---------- */
  const sky = el.querySelector<HTMLCanvasElement>('.dust')!;
  const ctx = sky.getContext('2d')!;
  const dust = Array.from({ length: 700 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() ** 3 * 1.4 + 0.2,
    a: Math.random() * 0.6 + 0.15,
    depth: [0.02, 0.05, 0.1][Math.floor(Math.random() * 3)],
    tw: Math.random() * Math.PI * 2,
  }));
  let view = d3.zoomIdentity;
  const dpr = devicePixelRatio || 1;

  function sizeSky() {
    sky.width = sky.clientWidth * dpr;
    sky.height = sky.clientHeight * dpr;
  }

  function drawSky(t: number) {
    const w = sky.width;
    const h = sky.height;
    const g = ctx.createRadialGradient(w * 0.45, h * 0.45, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    g.addColorStop(0, '#0b1024');
    g.addColorStop(0.55, '#05070f');
    g.addColorStop(1, '#020308');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    for (const s of dust) {
      const x = (((s.x * w + view.x * s.depth * dpr) % w) + w) % w;
      const y = (((s.y * h + view.y * s.depth * dpr) % h) + h) % h;
      ctx.globalAlpha = s.a * (0.75 + 0.25 * Math.sin(t / 900 + s.tw));
      ctx.beginPath();
      ctx.arc(x, y, s.r * dpr, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- SVG 정의 ---------- */
  const svg = d3.select(el).select<SVGSVGElement>('svg.map');
  const defs = svg.select('defs');
  const radial = (id: string, stops: [number, string, number][]) => {
    const g = defs.append('radialGradient').attr('id', id);
    stops.forEach(([o, c, a]) =>
      g.append('stop').attr('offset', o).attr('stop-color', c).attr('stop-opacity', a),
    );
  };
  Object.entries(CAT_COLOR).forEach(([k, c]) =>
    radial(`halo-${k}`, [
      [0, '#fff', 1],
      [0.12, c, 0.9],
      [0.35, c, 0.28],
      [1, c, 0],
    ]),
  );
  CLUSTER_COLORS.forEach((c, i) =>
    radial(`cluster-${i}`, [
      [0, c, 0.16],
      [0.5, c, 0.06],
      [1, c, 0],
    ]),
  );
  radial('planet-glow', [
    [0, '#e6f0ff', 0.9],
    [0.4, '#9fc2ff', 0.25],
    [1, '#9fc2ff', 0],
  ]);
  defs
    .append('filter')
    .attr('id', 'cluster-blur')
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%')
    .append('feGaussianBlur')
    .attr('stdDeviation', 18);

  const root = svg.append('g');
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.3, 5])
    .on('zoom', (e) => {
      view = e.transform;
      root.attr('transform', e.transform.toString());
    });
  svg.call(zoom);

  /* ---------- 레이어 ---------- */
  const clusterLayer = root.append('g').attr('filter', 'url(#cluster-blur)');
  const orbitLayer = root.append('g');
  const linkLayer = root.append('g');
  const planetLinkLayer = root.append('g');
  const planetLayer = root.append('g');
  const starLayer = root.append('g');

  const link = linkLayer
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('class', 'link')
    .attr('stroke-width', (l) => 0.6 + norm(l.sim) * 1.6);

  const planetLinks = planets.flatMap((s) => s.parents.map((p) => ({ s, p: byId.get(p)! })));
  const planetLink = planetLinkLayer.selectAll('line').data(planetLinks).join('line').attr('class', 'planet-link');

  const orbit = orbitLayer
    .selectAll('circle')
    .data(planets.filter((s) => s.orbit))
    .join('circle')
    .attr('class', 'orbit')
    .attr('r', (s) => s.orbit!);

  const planet = planetLayer.selectAll('g').data(planets).join('g').attr('class', 'planet');
  planet.append('circle').attr('r', 7).style('fill', 'url(#planet-glow)');
  planet
    .append('circle')
    .attr('class', 'dot')
    .attr('r', (s) => (s.kind === 'paper' ? 1.8 : 1.2));
  planet
    .append('text')
    .attr('x', 6)
    .attr('y', 3)
    .text((s) => (s.title.length > 30 ? s.title.slice(0, 30) + '…' : s.title));

  const star = starLayer
    .selectAll('g')
    .data(stars)
    .join('g')
    .attr('class', 'star')
    .style('--tw', () => `${3 + Math.random() * 4}s`)
    .style('--delay', () => `${-Math.random() * 6}s`);
  star
    .append('circle')
    .attr('class', 'halo')
    .attr('r', (d) => d.r * 4.2)
    .attr('fill', (d) => `url(#halo-${d.category})`);
  star
    .filter((d) => d.r > 5.6)
    .append('path')
    .attr('class', 'spike')
    .attr('stroke-width', 0.6)
    .attr('d', (d) => `M${-d.r * 3.2},0H${d.r * 3.2}M0,${-d.r * 3.2}V${d.r * 3.2}`);
  star
    .append('circle')
    .attr('class', 'core')
    .attr('r', (d) => d.r * 0.45);
  star
    .append('text')
    .attr('x', (d) => d.r * 1.6 + 4)
    .attr('y', 4)
    .text((d) => d.title);

  /* ---------- 배치: 별끼리 넉넉한 간격 ---------- */
  const sim = d3
    .forceSimulation(stars)
    .force(
      'link',
      d3
        .forceLink<Star, Link>(links)
        .id((d) => d.id)
        .distance((l) => 190 - norm(l.sim) * 120)
        .strength((l) => 0.15 + norm(l.sim) * 0.7),
    )
    .force('charge', d3.forceManyBody().strength(-380))
    .force(
      'collide',
      d3.forceCollide<Star>(
        (d) => d.r * 3 + 24 + d.planets.filter((s) => s.parents.length === 1).length * 7,
      ),
    )
    .force('x', d3.forceX().strength(0.035))
    .force('y', d3.forceY().strength(0.035))
    .stop();
  sim.tick(500);

  // 성단: 군집별 중심과 퍼짐
  const clusters = d3
    .groups(stars, (d) => d.cluster)
    .filter(([, ns]) => ns.length > 1)
    .map(([c, ns]) => ({ c, ns }));
  const clusterGlow = clusterLayer
    .selectAll('circle')
    .data(clusters)
    .join('circle')
    .attr('fill', (c) => `url(#cluster-${c.c % CLUSTER_COLORS.length})`);

  function planetPos(s: Planet, t: number): [number, number] {
    if (s.parents.length === 1) {
      const p = byId.get(s.parents[0])!;
      const a = s.angle + t * s.speed;
      return [p.x! + Math.cos(a) * s.orbit!, p.y! + Math.sin(a) * s.orbit!];
    }
    // 여러 글이 인용한 자료: 별들 사이에 떠서 천천히 흔들림
    const ps = s.parents.map((p) => byId.get(p)!);
    return [
      d3.mean(ps, (p) => p.x)! + Math.cos(t * 0.0004 + s.angle) * 6,
      d3.mean(ps, (p) => p.y)! + Math.sin(t * 0.0005 + s.angle) * 6,
    ];
  }

  function render(t: number) {
    clusterGlow.each(function (c) {
      const cx = d3.mean(c.ns, (d) => d.x)!;
      const cy = d3.mean(c.ns, (d) => d.y)!;
      const spread = d3.max(c.ns, (d) => Math.hypot(d.x! - cx, d.y! - cy)) ?? 40;
      d3.select(this).attr('cx', cx).attr('cy', cy).attr('r', spread + 90);
    });
    link
      .attr('x1', (l) => l.source.x!)
      .attr('y1', (l) => l.source.y!)
      .attr('x2', (l) => l.target.x!)
      .attr('y2', (l) => l.target.y!);
    star.attr('transform', (d) => `translate(${d.x},${d.y})`);
    orbit
      .attr('cx', (s) => byId.get(s.parents[0])!.x!)
      .attr('cy', (s) => byId.get(s.parents[0])!.y!);
    planets.forEach((s) => ([s.x, s.y] = planetPos(s, t)));
    planet.attr('transform', (s) => `translate(${s.x},${s.y})`);
    planetLink
      .attr('x1', (l) => l.s.x)
      .attr('y1', (l) => l.s.y)
      .attr('x2', (l) => l.p.x!)
      .attr('y2', (l) => l.p.y!);
  }

  // 데스크톱에서는 오른쪽 패널을 피해서 가운데 정렬
  function fit() {
    const w = sky.clientWidth;
    const h = sky.clientHeight;
    const panel = matchMedia(DESKTOP).matches ? 380 : 0;
    const pad = 100;
    const [x0, x1] = d3.extent(stars, (d) => d.x) as [number, number];
    const [y0, y1] = d3.extent(stars, (d) => d.y) as [number, number];
    const k = Math.min(1.6, Math.min((w - panel) / (x1 - x0 + pad * 2), h / (y1 - y0 + pad * 2)));
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate((w - panel) / 2, h / 2)
        .scale(k)
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
    );
  }

  sizeSky();
  fit();
  addEventListener('resize', () => {
    sizeSky();
    fit();
  });

  const loop = (t: number) => {
    render(reduceMotion ? 0 : t);
    drawSky(reduceMotion ? 0 : t);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  /* ---------- 드래그 ---------- */
  star.call(
    d3
      .drag<SVGGElement, Star>()
      .on('start', (e, d) => {
        if (!e.active) sim.alphaTarget(0.2).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (e, d) => {
        d.fx = e.x;
        d.fy = e.y;
      })
      .on('end', (e, d) => {
        if (!e.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }),
  );

  /* ---------- 강조 ---------- */
  let selected: Star | null = null;
  let category: Category | 'all' = 'all';

  function highlight(d: Star | null) {
    if (!d) {
      const filtering = category !== 'all';
      root.classed('dim', filtering);
      star.classed('show', false).style('opacity', (n) => (filtering && n.category !== category ? 0.12 : null));
      planet.classed('show', false);
      link.classed('hl', false);
      planetLink.classed('hl', false);
      return;
    }
    const ids = new Set([d.id, ...d.neighbors.map((n) => n.id)]);
    root.classed('dim', true);
    star.classed('show', (n) => ids.has(n.id)).style('opacity', null);
    planet.classed('show', (s) => s.parents.includes(d.id));
    link.classed('hl', (l) => l.source.id === d.id || l.target.id === d.id);
    planetLink.classed('hl', (l) => l.p.id === d.id);
  }

  star
    .on('mouseenter', (_, d) => highlight(d))
    .on('mouseleave', () => highlight(selected))
    .on('click', (e, d) => {
      e.stopPropagation();
      select(d.id);
    });
  planet
    .on('mouseenter', function () {
      d3.select(this).classed('show', true);
    })
    .on('mouseleave', function (_, s) {
      if (!selected || !s.parents.includes(selected.id)) d3.select(this).classed('show', false);
    })
    .on('click', (e, s) => {
      e.stopPropagation();
      window.open(s.id, '_blank', 'noopener');
    });
  svg.on('click', () => clearSelection());

  /* ---------- 패널 ---------- */
  const listView = el.querySelector<HTMLElement>('.list-view')!;
  const detailView = el.querySelector<HTMLElement>('.detail-view')!;

  function clearSelection() {
    selected = null;
    highlight(null);
    detailView.hidden = true;
    listView.hidden = false;
  }

  function select(id: string) {
    const d = byId.get(id);
    if (!d) return;
    selected = d;
    highlight(d);
    detailView.innerHTML =
      `<button type="button" class="back">← 전체 글</button>
       <div class="cat" style="color:${CAT_COLOR[d.category]}">${d.category}</div>
       <h2>${escape(d.title)}</h2>
       <p>${escape(d.excerpt)}</p>
       <a class="read" href="/posts/${encodeURIComponent(d.id)}">글 읽기 →</a>
       <h3>가까운 별</h3>` +
      d.neighbors
        .map(
          (n) =>
            `<a class="row" href="/posts/${encodeURIComponent(n.id)}" data-star="${escape(n.id)}">
               <span>${escape(byId.get(n.id)!.title)}</span><b>${n.sim.toFixed(2)}</b></a>`,
        )
        .join('') +
      (d.planets.length
        ? `<h3>인용한 자료</h3>` +
          d.planets
            .map(
              (s) =>
                `<a class="row" href="${escape(s.id)}" target="_blank" rel="noopener">
                   <span>${escape(s.title)}</span><small>${PLANET_KIND[s.kind]}</small></a>`,
            )
            .join('')
        : '');
    listView.hidden = true;
    detailView.hidden = false;
    detailView.scrollTop = 0;
  }

  detailView.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.back')) clearSelection();
    // 가까운 별: 일반 클릭은 지도에서 이동, 새 탭 열기 등은 링크 그대로
    const row = target.closest<HTMLAnchorElement>('[data-star]');
    const mouse = e as MouseEvent;
    if (row && !mouse.metaKey && !mouse.ctrlKey && !mouse.shiftKey) {
      e.preventDefault();
      select(row.dataset.star!);
    }
  });

  // 목록에 마우스를 올리면 지도에서 해당 별이 빛남
  el.querySelectorAll<HTMLLIElement>('.posts li').forEach((li) => {
    li.addEventListener('mouseenter', () => highlight(byId.get(li.dataset.id!) ?? null));
    li.addEventListener('mouseleave', () => highlight(selected));
    li.addEventListener('focusin', () => highlight(byId.get(li.dataset.id!) ?? null));
  });

  // 카테고리 필터: 목록을 거르고 지도에서 다른 카테고리를 흐리게
  const buttons = el.querySelectorAll<HTMLButtonElement>('.filters button');
  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      category = btn.dataset.cat as Category | 'all';
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      el.querySelectorAll<HTMLLIElement>('.posts li').forEach(
        (li) => (li.hidden = category !== 'all' && li.dataset.cat !== category),
      );
      highlight(selected);
    }),
  );
}
