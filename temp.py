import asyncio
from main import scrape_jobs_background, ScrapingConfig, automatic_scraper

ml_scrapping_config = ScrapingConfig(
    search_terms=["machine learning", "data science", "artificial intelligence"],
    max_jobs=50,
    auto_scrape=True
)

# Run the automatic scraper properly
if __name__ == "__main__":
    # Option 1: Run automatic scraper (continuous)
    # asyncio.run(automatic_scraper())
    
    # Option 2: Run single scraping operation (recommended for testing)
    asyncio.run(scrape_jobs_background(ml_scrapping_config))