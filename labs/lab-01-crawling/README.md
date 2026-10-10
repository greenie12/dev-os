# Lab 1: Crawling and crawl scheduling

Scrape 50 product pages from [books.toscrape.com](https://books.toscrape.com), re-crawl them for 30 simulated days while prices change, and compare two scheduling policies:

- **A, uniform:** re-crawl everything daily
- **B, adaptive:** re-crawl recently changed items more often and back off on the rest

**Takeaway question:** how much staleness does each policy leave per unit of crawl cost?

## Files

| File | What it is |
|---|---|
| `lab1_crawling.ipynb` | The lab. Three `# TODO` gaps, each followed by a self-check cell. |
| `lab1_crawling_solutions.ipynb` | Worked answers. Open it only after you've tried. |

## Run it in Colab

1. Go to [colab.research.google.com](https://colab.research.google.com) and choose **File → Upload notebook**, or use the **GitHub** tab and paste this repo's URL.
2. Open `lab1_crawling.ipynb` and choose **Runtime → Run all**. It stops at the first TODO, which is expected.
3. Fill in each TODO and re-run from that cell. The whole notebook runs in about a minute.

Nothing to install: `requests`, `beautifulsoup4`, `pandas`, `numpy` and `matplotlib` are preinstalled on Colab. If the site is unreachable, the crawl falls back to a synthetic catalogue and the rest of the lab still works.

## The TODOs

1. **`parse_product_page`**: turn product HTML into `{upc, title, price, stock, rating, category}`.
2. **`Adaptive.observe`**: halve an item's re-crawl interval when it changed, grow it ×1.2 when it didn't, and clamp to `[min_h, max_h]`.
3. **`summarize`**: compute crawls, % of catalog stale, wasted crawls, and stale item-hours per 100 crawls.

## What the simulation does

The real site never changes, so Part 2 wraps the 50 crawled pages in a `SimulatedSite` that serves the same HTML with prices that change hour by hour for 30 days:

| Tier | Share of items | Average price changes |
|---|---|---|
| hot | 10% | 2 per day |
| warm | 20% | 1 every 3 days |
| cold | 70% | 1 per month |

Every policy runs against the same precomputed world, so the comparison is fair. Staleness is measured every simulated hour as the number of items whose stored price differs from the live price.

## After the lab

Write three sentences in the last cell (this is your interview material):

1. The tradeoff I saw
2. The number that moved
3. How I'd explain it to an executive
