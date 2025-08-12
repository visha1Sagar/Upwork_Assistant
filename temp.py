import urllib.parse

def build_upwork_query(skills, rate_min, rate_max, per_page=50):
    """Function to construct Upwork job search query URL."""
    
    base_url = "https://www.upwork.com/nx/search/jobs/"
    
    # Build the skills query with OR logic
    skill_query = "(" + " OR ".join(skills) + ")"
    encoded_query = urllib.parse.quote(skill_query)
    
    # Static filters from your example
    proposals = "proposals=0-4,5-9,10-14"
    sort = "sort=recency"
    job_types = "t=0,1"  # both hourly and fixed-price
    
    # Hourly rate filter
    hourly_rate = f"hourly_rate={rate_min}-{rate_max}"
    
    # Construct final URL
    url = (
        f"{base_url}?{hourly_rate}"
        f"&per_page={per_page}"
        f"&{proposals}"
        f"&q={encoded_query}"
        f"&{sort}"
        f"&{job_types}"
    )
    
    return url


# Example usage
skills = [
    "Data Science", "Automation", "Machine Learning", "Chatbot", "Development",
    "Artificial Intelligence", "Python",
    "TensorFlow", "AI", "Computer Vision", "PyTorch", "Large Language Model"
]

print(build_upwork_query(skills, rate_min=5, rate_max=15, per_page=50))
