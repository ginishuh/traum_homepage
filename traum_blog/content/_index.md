---
title: "트라움자원 필드노트"
---

<div class="hero-section">
  <h2>최신 시장읽기</h2>
  {{ $latest := where .Site.RegularPages "Params.category" "market" | first 1 }}
  {{ with $latest }}
    <div class="hero-market">
      <h3><a href="{{ .Permalink }}">{{ .Title }}</a></h3>
      <p>{{ .Params.summary }}</p>
      {{ with .Params.kpis }}
        <div class="hero-kpis">
          {{ range . }}
            <div class="kpi-badge">
              <span class="kpi-label">{{ .label }}</span>
              <span class="kpi-value">{{ .value }}</span>
            </div>
          {{ end }}
        </div>
      {{ end }}
    </div>
  {{ end }}
</div>

<style>
.hero-section {
  margin: 2rem 0;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 12px;
  border-left: 4px solid var(--color-market);
}

.hero-market h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.hero-market h3 a {
  color: var(--color-market);
  text-decoration: none;
}

.hero-market p {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.hero-kpis {
  display: flex;
  gap: 1rem;
}
</style>
