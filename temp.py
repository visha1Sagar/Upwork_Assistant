from main import ScrapingConfig, scrape_jobs_background


url = "https://www.upwork.com/nx/search/jobs/?q=n8n"

config = ScrapingConfig(max_jobs=20, auto_scrape=True, search_terms=["n8n"])

import asyncio

async def main():
	await scrape_jobs_background(config)

asyncio.run(main())