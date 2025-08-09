"""
Simple Manual Upwork Job Viewer
Opens Upwork in browser for manual viewing and basic text extraction
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import csv
import json
import glob
from datetime import datetime


def create_manual_browser():
    """Create a browser that looks like manual usage"""
    chrome_options = Options()
    
    # Minimal options to appear human
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Normal browser behavior
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-extensions-except")
    chrome_options.add_argument("--disable-plugins-discovery")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # Minimal stealth
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver


def manual_upwork_viewer(url):
    """Open Upwork and wait for manual interaction"""
    print("🌐 Manual Upwork Viewer")
    print("=" * 30)
    print(f"🔗 Opening: {url}")
    
    driver = create_manual_browser()
    
    try:
        # Open the URL
        driver.get(url)
        print("✅ Page opened in browser")
        
        print("\n📋 INSTRUCTIONS:")
        print("1. The browser window is now open")
        print("2. Manually solve any verification if needed")
        print("3. Wait for the job listings to load")
        print("4. Extraction will start automatically in 20 seconds...")
        
        # Auto-start after 20 seconds with countdown
        print("\n⏰ Auto-extraction countdown:")
        for i in range(20, 0, -1):
            print(f"   Starting in {i} seconds...", end='\r')
            time.sleep(1)
        print("\n🚀 Starting extraction now!                    ")
        
        print("\n🔍 Attempting to extract visible content...")
        
        # Extract comprehensive job data
        jobs = extract_comprehensive_job_data(driver)
        
        return jobs
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []
    
    finally:
        print("\n🔄 Keeping browser open for 30 more seconds...")
        print("   You can manually copy any job information you see")
        time.sleep(30)
        driver.quit()
        print("✅ Browser closed")


def extract_comprehensive_job_data(driver):
    """Extract comprehensive job data from the loaded page"""
    print("🔍 Extracting comprehensive job data...")
    jobs = []
    
    try:
        # Strategy 1: Look for job cards/containers
        job_containers = []
        
        # Try multiple selectors for job containers
        selectors = [
            "article[data-test='JobTile']",  # From new HTML structure
            "article[data-test='job-tile']",
            "[data-test='JobTile']",
            "section[data-test='job-tile']",
            "div[data-cy='job-tile']",
            ".job-tile",
            "article",
            "section"
        ]
        
        for selector in selectors:
            try:
                containers = driver.find_elements(By.CSS_SELECTOR, selector)
                if containers and len(containers) > 2:  # Found meaningful results
                    job_containers = containers
                    print(f"   ✅ Found {len(containers)} job containers using: {selector}")
                    break
            except:
                continue
        
        if not job_containers:
            print("   ⚠️ No job containers found, trying text extraction...")
            return extract_jobs_from_text(driver)
        
        # Extract data from each job container
        for i, container in enumerate(job_containers, 1):
            try:
                job_data = extract_single_job(container, i)
                if job_data and job_data.get('title') and job_data['title'] != 'N/A':
                    jobs.append(job_data)
                    print(f"   ✓ Job {i}: {job_data['title'][:50]}...")
            except Exception as e:
                print(f"   ✗ Error extracting job {i}: {e}")
                continue
        
        print(f"✅ Successfully extracted {len(jobs)} jobs")
        return jobs
        
    except Exception as e:
        print(f"❌ Error in comprehensive extraction: {e}")
        return extract_jobs_from_text(driver)


def extract_single_job(container, position):
    """Extract detailed data from a single job container"""
    job_data = {
        'position': position,
        'scraped_at': datetime.now().isoformat()
    }
    
    # Extract title and URL
    title_selectors = [
        "a[data-test='job-tile-title-link UpLink']",  # New selector from HTML
        ".job-tile-title a",  # New selector from HTML
        "h2 a", "h3 a", "h4 a", "h5 a",
        "[data-test='JobTileTitle'] a",
        "[data-test='job-title'] a",
        "a[href*='/jobs/']",
        "a"
    ]
    
    for selector in title_selectors:
        try:
            title_elem = container.find_element(By.CSS_SELECTOR, selector)
            job_data['title'] = title_elem.text.strip()
            job_data['job_url'] = title_elem.get_attribute('href')
            if job_data['title']:
                break
        except:
            continue
    
    if not job_data.get('title'):
        job_data['title'] = 'N/A'
        job_data['job_url'] = 'N/A'
    
    # Extract description
    desc_selectors = [
        "[data-test='UpCLineClamp JobDescription'] p",  # New selector from HTML
        "[data-test='JobDescription']",
        "[data-test='job-description']",
        ".job-description",
        "p",
        "div p"
    ]
    
    description_parts = []
    for selector in desc_selectors:
        try:
            desc_elems = container.find_elements(By.CSS_SELECTOR, selector)
            for elem in desc_elems:
                text = elem.text.strip()
                if text and len(text) > 10:
                    description_parts.append(text)
        except:
            continue
    
    job_data['description'] = ' '.join(description_parts[:3]) if description_parts else 'N/A'
    
    # Extract budget/rate information
    budget_selectors = [
        "li[data-test='job-type-label']",  # New selector from HTML
        "li[data-test='is-fixed-price']",  # New selector from HTML
        "[data-test='BudgetAmount']",
        "[data-test='budget']",
        ".budget",
        ".rate",
        "*[class*='budget']",
        "*[class*='rate']"
    ]
    
    budget_info = []
    for selector in budget_selectors:
        try:
            budget_elems = container.find_elements(By.CSS_SELECTOR, selector)
            for elem in budget_elems:
                text = elem.text.strip()
                if '$' in text or 'hour' in text.lower():
                    budget_info.append(text)
        except:
            continue
    
    job_data['budget'] = ', '.join(budget_info) if budget_info else 'N/A'
    
    # Extract skills
    skills_selectors = [
        "button[data-test='token']",  # New selector from HTML
        "[data-test='SkillItem']",
        "[data-test='skill']",
        ".skill",
        ".tag",
        "*[class*='skill']",
        "*[class*='tag']"
    ]
    
    skills = []
    for selector in skills_selectors:
        try:
            skill_elems = container.find_elements(By.CSS_SELECTOR, selector)
            for elem in skill_elems:
                text = elem.text.strip()
                if text and len(text) < 50:
                    skills.append(text)
        except:
            continue
    
    job_data['skills'] = ', '.join(skills[:10]) if skills else 'N/A'  # Limit to 10 skills
    
    # Extract job type (hourly/fixed)
    type_selectors = [
        "li[data-test='job-type-label']",  # New selector from HTML
        "[data-test='JobType']",
        "[data-test='job-type']",
        "*[class*='type']"
    ]
    
    job_type = 'N/A'
    for selector in type_selectors:
        try:
            type_elems = container.find_elements(By.CSS_SELECTOR, selector)
            for elem in type_elems:
                text = elem.text.strip().lower()
                if 'hourly' in text or 'fixed' in text:
                    job_type = text.title()
                    break
        except:
            continue
        if job_type != 'N/A':
            break
    
    job_data['job_type'] = job_type
    
    # Extract client information
    client_selectors = [
        "[data-test='ClientSpendingAndHistory']",
        "[data-test='client']",
        "*[class*='client']",
        "*[class*='spending']"
    ]
    
    client_info = []
    for selector in client_selectors:
        try:
            client_elems = container.find_elements(By.CSS_SELECTOR, selector)
            for elem in client_elems:
                text = elem.text.strip()
                if text:
                    client_info.append(text)
        except:
            continue
    
    job_data['client_info'] = ', '.join(client_info) if client_info else 'N/A'
    
    # Extract posted time
    time_selectors = [
        "small[data-test='job-pubilshed-date']",  # New selector from HTML
        "[data-test='PostedTime']",
        "[data-test='posted']",
        "*[class*='posted']",
        "*[class*='time']",
        "time"
    ]
    
    posted_time = 'N/A'
    for selector in time_selectors:
        try:
            time_elems = container.find_elements(By.CSS_SELECTOR, selector)
            for elem in time_elems:
                text = elem.text.strip()
                if 'ago' in text.lower() or 'hour' in text.lower() or 'day' in text.lower():
                    posted_time = text
                    break
        except:
            continue
        if posted_time != 'N/A':
            break
    
    job_data['posted_time'] = posted_time
    
    # Extract any additional text content for context
    try:
        full_text = container.text.strip()
        job_data['full_text'] = full_text[:500] + '...' if len(full_text) > 500 else full_text
    except:
        job_data['full_text'] = 'N/A'
    
    return job_data


def extract_jobs_from_text(driver):
    """Fallback method: extract jobs from page text"""
    print("   🔄 Using text extraction fallback...")
    
    try:
        page_text = driver.find_element(By.TAG_NAME, "body").text
        lines = page_text.split('\n')
        
        jobs = []
        current_job = {}
        job_count = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Look for job indicators
            if any(keyword in line.lower() for keyword in ['$', 'hourly', 'fixed', 'budget', 'posted']):
                if current_job and current_job.get('title'):
                    current_job['position'] = job_count + 1
                    current_job['scraped_at'] = datetime.now().isoformat()
                    jobs.append(current_job.copy())
                    job_count += 1
                
                current_job = {'title': line[:200], 'description': line}
            
            elif current_job and len(line) > 20:
                if 'description' in current_job:
                    current_job['description'] += ' ' + line
                else:
                    current_job['description'] = line
                
                if len(current_job.get('description', '')) > 1000:
                    current_job['description'] = current_job['description'][:1000] + '...'
        
        if current_job and current_job.get('title'):
            current_job['position'] = job_count + 1
            current_job['scraped_at'] = datetime.now().isoformat()
            jobs.append(current_job)
        
        return jobs
        
    except Exception as e:
        print(f"   ❌ Text extraction failed: {e}")
        return []
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []
    
    finally:
        print("\n🔄 Keeping browser open for 30 more seconds...")
        print("   You can manually copy any job information you see")
        time.sleep(30)
        driver.quit()
        print("✅ Browser closed")


def save_manual_results(jobs, filename="manual_upwork_extraction"):
    """Save manually extracted results with duplicate prevention"""
    if not jobs:
        print("❌ No jobs to save")
        return
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_file = f"{filename}_{timestamp}.csv"
    json_file = f"{filename}_{timestamp}.json"
    
    # Check for existing CSV file to avoid duplicates
    existing_jobs = []
    existing_titles = set()
    
    # Look for existing CSV files
    import glob
    existing_csv_files = glob.glob(f"{filename}_*.csv")
    
    if existing_csv_files:
        # Read the most recent existing file
        latest_csv = max(existing_csv_files)
        print(f"📄 Found existing file: {latest_csv}")
        
        try:
            import pandas as pd
            existing_df = pd.read_csv(latest_csv)
            existing_jobs = existing_df.to_dict('records')
            existing_titles = set(existing_df['title'].str.lower() if 'title' in existing_df.columns else [])
            print(f"   Loaded {len(existing_jobs)} existing jobs")
        except:
            # Fallback to manual CSV reading
            try:
                with open(latest_csv, 'r', encoding='utf-8') as f:
                    import csv as csv_module
                    reader = csv_module.DictReader(f)
                    existing_jobs = list(reader)
                    existing_titles = set(job.get('title', '').lower() for job in existing_jobs)
                    print(f"   Loaded {len(existing_jobs)} existing jobs (manual)")
            except Exception as e:
                print(f"   ⚠️ Could not read existing file: {e}")
    
    # Filter out duplicates
    new_jobs = []
    duplicate_count = 0
    
    for job in jobs:
        job_title = job.get('title', '').lower().strip()
        if job_title and job_title not in existing_titles and job_title != 'n/a':
            new_jobs.append(job)
            existing_titles.add(job_title)
        else:
            duplicate_count += 1
    
    print(f"📊 Duplicate check results:")
    print(f"   Total extracted: {len(jobs)}")
    print(f"   Duplicates found: {duplicate_count}")
    print(f"   New jobs to save: {len(new_jobs)}")
    
    # Combine existing and new jobs
    all_jobs = existing_jobs + new_jobs
    
    # Save to CSV
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        if all_jobs:
            fieldnames = set()
            for job in all_jobs:
                fieldnames.update(job.keys())
            fieldnames = sorted(list(fieldnames))
            
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for job in all_jobs:
                writer.writerow(job)
    
    # Save to JSON
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(all_jobs, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Results saved to: {csv_file}")
    print(f"💾 Results saved to: {json_file}")
    print(f"📈 Total jobs in database: {len(all_jobs)}")
    
    return csv_file, json_file


if __name__ == "__main__":
    print("🔧 Manual Upwork Job Viewer")
    print("=" * 40)
    
    # URL to scrape
    url = "https://www.upwork.com/nx/search/jobs/?nbs=1&q=n8n"
    
    print(f"🎯 Target URL: {url}")
    print("📝 This tool will open the browser and let you manually handle verification")
    
    # Ask user if they want to proceed
    proceed = input("\n❓ Do you want to proceed? (y/N): ").strip().lower()
    
    if proceed in ['y', 'yes']:
        jobs = manual_upwork_viewer(url)
        
        if jobs:
            save_manual_results(jobs)
            
            print(f"\n📊 Summary:")
            print(f"   Jobs extracted: {len(jobs)}")
            print(f"\n📋 Sample jobs:")
            for i, job in enumerate(jobs[:5], 1):
                print(f"   {i}. {job.get('title', 'N/A')}")
        else:
            print("❌ No jobs extracted")
    else:
        print("❌ Operation cancelled")
    
    print("\n✅ Manual viewer completed!")
