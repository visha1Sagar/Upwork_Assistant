"""GitHub README Extractor

Provides utilities to collect README content from all (public) repositories
for a given GitHub username.

Primary implementation uses the GitHub REST API (no external deps beyond
`requests`). Optional personal access token greatly increases the rate limit
(60 -> 5,000 requests / hour) and allows private repos if the token has scope.

Usage (basic):
    from github_readme_extractor import fetch_all_readmes
    readmes = fetch_all_readmes("octocat")
    for r in readmes:
        print(r["repo"], len(r["readme_text"]))

CLI (quick test):
    python github_readme_extractor.py octocat --token YOUR_TOKEN

Returned data list entry keys:
    repo: repository name
    full_name: owner/repo
    readme_path: the path that succeeded (or None)
    readme_text: decoded README content ('' if missing)
    size: bytes (decoded)
    html_url: repo HTML URL
    description: repo description
    fork: bool
    archived: bool
    topics: list[str]
    default_branch: str
    fetched_at: ISO timestamp
    error: error message if failed / missing

"""
from __future__ import annotations

import base64
import concurrent.futures as cf
import os
import sys
import time
from typing import Iterable, List, Dict, Optional
import requests
from datetime import datetime

try:  # optional python-dotenv support
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass  # silently ignore if not installed

GITHUB_API = "https://api.github.com"
README_CANDIDATE_PATHS = [
    "README.md",
    "README.MD",
    "readme.md",
    "Readme.md",
    "README.rst",
    "README.txt",
    "README",
    "docs/README.md",
    "Docs/README.md",
]

class GitHubRateLimitError(RuntimeError):
    pass

class GitHubReadmeExtractor:
    def __init__(
        self,
        username: str,
        token: Optional[str] = None,
        include_forks: bool = False,
        max_repos: Optional[int] = None,
        request_timeout: int = 15,
        max_workers: int = 8,
        wait_on_rate_limit: bool = False,
        max_rate_limit_sleep: int = 600,
    ) -> None:
        self.username = username
        self.token = token or os.getenv("GITHUB_TOKEN")
        self.include_forks = include_forks
        self.max_repos = max_repos
        self.request_timeout = request_timeout
        self.max_workers = max_workers
        self.wait_on_rate_limit = wait_on_rate_limit
        self.max_rate_limit_sleep = max_rate_limit_sleep
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/vnd.github+json",
            "User-Agent": "readme-extractor/1.0",
        })
        if self.token:
            self.session.headers["Authorization"] = f"Bearer {self.token}"

    # ----------------------------- Public API ----------------------------- #
    def fetch(self) -> List[Dict]:
        repos = self._list_repositories()
        if not self.include_forks:
            repos = [r for r in repos if not r.get("fork")]
        if self.max_repos is not None:
            repos = repos[: self.max_repos]

        results: List[Dict] = []
        with cf.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_map = {
                executor.submit(self._fetch_single_readme, repo): repo for repo in repos
            }
            for fut in cf.as_completed(future_map):
                results.append(fut.result())
        return results

    # ------------------------- Internal Helpers --------------------------- #
    def _list_repositories(self) -> List[Dict]:
        repos: List[Dict] = []
        page = 1
        per_page = 100
        while True:
            url = f"{GITHUB_API}/users/{self.username}/repos"
            params = {"page": page, "per_page": per_page, "sort": "pushed"}
            resp = self._request("GET", url, params=params)
            data = resp.json()
            if not isinstance(data, list):
                raise RuntimeError(f"Unexpected repos response: {data}")
            repos.extend(data)
            if len(data) < per_page:
                break
            page += 1
            if self.max_repos and len(repos) >= self.max_repos:
                break
        return repos

    def _fetch_single_readme(self, repo: Dict) -> Dict:
        repo_name = repo.get("name")
        owner = repo.get("owner", {}).get("login", self.username)
        base = f"{GITHUB_API}/repos/{owner}/{repo_name}/contents"
        chosen_path = None
        decoded = ""
        error: Optional[str] = None

        for path in README_CANDIDATE_PATHS:
            try:
                resp = self._request("GET", f"{base}/{path}")
                if resp.status_code == 200 and resp.headers.get("Content-Type", "").startswith("application/json"):
                    data = resp.json()
                    if data.get("type") == "file" and data.get("encoding") == "base64":
                        try:
                            decoded = base64.b64decode(data.get("content", "")).decode("utf-8", errors="replace")
                        except Exception as dec_err:
                            decoded = ""
                            error = f"decode-error:{dec_err}"
                        chosen_path = path
                        break
                elif resp.status_code == 404:
                    continue  # try next candidate
                else:
                    error = f"unexpected-status:{resp.status_code}"
            except GitHubRateLimitError as rl:
                error = f"rate-limit:{rl}"
                break
            except Exception as e:
                error = f"request-error:{e}"
                break

        if not chosen_path and not error:
            error = "readme-not-found"

        return {
            "repo": repo_name,
            "full_name": repo.get("full_name"),
            "readme_path": chosen_path,
            "readme_text": decoded,
            "size": len(decoded.encode("utf-8")) if decoded else 0,
            "html_url": repo.get("html_url"),
            "description": repo.get("description"),
            "fork": repo.get("fork"),
            "archived": repo.get("archived"),
            "topics": repo.get("topics", []),
            "default_branch": repo.get("default_branch"),
            "fetched_at": datetime.utcnow().isoformat() + "Z",
            "error": error,
        }

    def _request(self, method: str, url: str, **kwargs) -> requests.Response:
        """Perform a request with optional rate-limit wait/retry."""
        attempt = 0
        while True:
            attempt += 1
            resp = self.session.request(method, url, timeout=self.request_timeout, **kwargs)
            if resp.status_code == 403 and "rate limit" in resp.text.lower():
                reset = resp.headers.get("X-RateLimit-Reset")
                remaining = resp.headers.get("X-RateLimit-Remaining")
                if remaining == "0":
                    if not self.wait_on_rate_limit:
                        raise GitHubRateLimitError(f"Rate limit exceeded. Reset at epoch {reset}")
                    # compute sleep seconds
                    try:
                        reset_epoch = int(reset) if reset else 0
                        now = int(time.time())
                        sleep_for = max(0, min(reset_epoch - now + 2, self.max_rate_limit_sleep))
                    except Exception:
                        sleep_for = 30  # fallback
                    if sleep_for == 0:
                        # no meaningful reset time; raise
                        raise GitHubRateLimitError(f"Rate limit exceeded. Reset at epoch {reset}")
                    # avoid excessively long waits unless user explicitly allowed via max_rate_limit_sleep
                    time.sleep(sleep_for)
                    continue  # retry after sleep
            return resp

# ------------------------------ Convenience ------------------------------- #

def fetch_all_readmes(
    username: str,
    token: Optional[str] = None,
    include_forks: bool = False,
    max_repos: Optional[int] = None,
    max_workers: int = 8,
    wait_on_rate_limit: bool = False,
    max_rate_limit_sleep: int = 600,
) -> List[Dict]:
    """Fetch README content for all public repos of a user.

    Args:
        username: GitHub username / org.
        token: Optional PAT for higher rate limits and private repos.
        include_forks: Include forked repos if True.
        max_repos: Limit number of repos processed (early stop).
        max_workers: Thread pool size for parallel README fetches.

    Returns:
        List of metadata dicts (see module docstring for keys).
    """
    extractor = GitHubReadmeExtractor(
        username=username,
        token=token,
        include_forks=include_forks,
        max_repos=max_repos,
        max_workers=max_workers,
        wait_on_rate_limit=wait_on_rate_limit,
        max_rate_limit_sleep=max_rate_limit_sleep,
    )
    return extractor.fetch()

# ------------------------------- CLI Runner ------------------------------- #

def _print_summary(results: List[Dict]):
    total = len(results)
    ok = sum(1 for r in results if r.get("readme_text"))
    missing = total - ok
    print(f"Total repos: {total} | With README: {ok} | Missing: {missing}")

    for r in sorted(results, key=lambda x: x.get("repo", ""))[:15]:
        print(f" - {r['repo']}: path={r['readme_path']} size={r['size']} err={r['error']}")


def main(argv: Optional[Iterable[str]] = None):
    import argparse
    parser = argparse.ArgumentParser(description="Fetch all GitHub READMEs for a user")
    parser.add_argument("username", help="GitHub username / org")
    parser.add_argument("--token", help="GitHub personal access token", default=None)
    parser.add_argument("--include-forks", action="store_true", help="Include forked repos")
    parser.add_argument("--max-repos", type=int, default=None, help="Limit number of repos")
    parser.add_argument("--workers", type=int, default=8, help="Max concurrent fetch workers")
    parser.add_argument("--wait", action="store_true", help="Wait & retry when hitting rate limit (may sleep)")
    parser.add_argument("--max-wait", type=int, default=600, help="Max seconds to sleep on rate limit")
    parser.add_argument("--out-json", help="Optional JSON output file")
    args = parser.parse_args(list(argv) if argv is not None else None)

    results = fetch_all_readmes(
        username=args.username,
        token=args.token,
        include_forks=args.include_forks,
        max_repos=args.max_repos,
        max_workers=args.workers,
        wait_on_rate_limit=args.wait,
        max_rate_limit_sleep=args.max_wait,
    )
    _print_summary(results)

    if args.out_json:
        import json
        with open(args.out_json, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"Saved JSON -> {args.out_json}")

if __name__ == "__main__":  # pragma: no cover
    main()
