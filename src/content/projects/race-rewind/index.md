---
title: "Race Rewind"
description: "Time-travel F1 stats site"
date: "25. June 2026"
demoURL: "https://racerewind.org"
repoURL: "https://github.com/PhilippKuhnhardt/race-rewind"
---

# Race Rewind

Race Rewind is a spoiler-free Formula 1 history companion for watching old seasons race by race.

Pick a season and a race weekend to see the championship exactly as it stood at that point in time: standings, race-weekend results, team and driver context, recent form, and Wikipedia-derived historical notes. The app is built to preserve uncertainty while following a past season, so future outcomes are not shown during normal navigation and race results are kept behind an additional click.

# Stack

- [Astro](https://astro.build/) with Svelte islands
- Tailwind CSS
- Drizzle ORM with `@libsql/client`
- SQLite database with data from [Jolpica F1](https://github.com/jolpica/jolpica-f1)
