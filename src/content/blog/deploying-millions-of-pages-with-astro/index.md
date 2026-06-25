---
title: "Deploying millions of pages with Astro"
description: "My learning journey deploying an Astro site with millions of pages"
date: "26. June 2026 15:13"
---

# The problem

Recently, I've been building [Race Rewind](https://racerewind.org), which is a time-sensitive Wikipedia for F1 results, allowing you to browse stats for any race. This solves the problem of gathering context when rewatching old F1 races without spoiling anything. As history does not change often, I decided to use Astro with mostly static pages.

The biggest problem I faced is that this requires a lot of pages. Every driver and every team needs a page for every race weekend. With over 1,000 races, hundreds of drivers, and over a hundred constructors, we are talking about over a million pages. In this blog post, I will show the problems I faced and how I solved them.

# Static generation

I started out like I did for my blog: define all valid pages with `getStaticPaths`, then render a page for everything during the build. This worked fine for initial development, but failed in the actual build. Each page reads some data from SQLite, so it takes around 10ms to build a page. This is fine for a few thousand static pages. However, at my scale, I estimated a build time of 4 hours. This is theoretically fine if you have an idle build server somewhere and don't care about how fast the site deploys, but as I was playing with the idea of having a comparison page, which would increase the number of pages by an order of magnitude, I went exploring for other solutions.

# Server-Side Rendering (SSR)

Thankfully, with server-side rendering, Astro provides an easy solution if you don't want to render every page during build time. This sounded good to me, as realistically, most pages won't ever be visited. Not many people care about the career stats of [Jacques Laffite before the Spanish Grand Prix of 1978](https://racerewind.org/drivers/jacques-laffite/1978/spanish-grand-prix/), so it seemed efficient to only render the pages people care about. This worked well, and I was able to deploy the first prototype to Vercel, which I started using when I was looking for the least-effort solution to deploy this blog.

Unfortunately, I was not prepared for AI crawlers. When checking Vercel the morning after my first deployment, I noticed that I had already blown past my Edge Request limit of 2,000,000. While I was aware of crawlers, I did not expect them to be that greedy, but a content-rich website with millions of pages was apparently very attractive to them. I attempted to fix it with Vercel Bot Management and a robots.txt, but Vercel counts blocked requests against some limits. As I was still getting tens of thousands of requests per hour after multiple fix attempts, there was no way I could keep using it.

# Dynamic Content Fetching

One alternative I briefly experimented with was a more dynamic approach: create a shell page, use Vercel routing middleware to redirect all requests to this shell page, then fetch dynamic content based on the URL. But as I neither wanted to depend on any Vercel functionality nor wanted this kind of complexity for what is basically static data, I discarded this approach.

# Moving to a VPS

After this failed experiment, and with my free plan being locked up by Vercel, I remembered some snarky comments on Hacker News about people being a bit stupid by needlessly using AWS wrappers instead of just getting a Hetzner VPS.
So I got a Hetzner VPS. After spending a few hours setting up [Coolify](https://coolify.io/), I deployed the SSR approach. And it worked (thanks Hacker News).

As my website is awesome and will obviously blow up, I did a load test and noticed that I could realistically handle a few dozen requests per second. That was fine, but I was a bit afraid of crawlers attempting another DDoS attack, and I wanted to operate the site hands-off.

# Cloudflare CDN

The awesome part about this website is that each page basically just needs to be rendered once, which is why a static build would work as well. That means if I have something cache it, my server only has to do that work once.

The popular and free option for this is [Cloudflare CDN](https://www.cloudflare.com/products/cdn/). While it has the downside of making yourself dependent on yet another US megacorp, I also had a bit of anxiety about AI crawlers, which the CDN conveniently helps with. It's also quite easy to set up: configure `Cache-Control` headers [correctly](https://docs.astro.build/en/guides/on-demand-rendering/#astroresponseheaders), enable HTML caching in Cloudflare, and that was it. It was worthwhile to think about how long I actually want to cache each page, as the most recent - and obviously future - races will have more frequent news and stats updates than older races.

# Conclusion

This was my personal learning journey of deploying millions of pages with Astro. There are definitely plenty of options you can use, but I like my current setup, as this also allows me to host any hobby project for a few euros per month. Setting up a VPS and using Coolify is a bit more complex than just deploying to Vercel, but I enjoy the increased control this provides me, and I can now realistically scale far more cheaply than with a cloud provider, at least to a certain limit.
