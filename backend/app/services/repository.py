import httpx
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
import re

# Simple in-memory cache (keyed by token hash + repo for privacy)
_commit_cache: Dict[str, Tuple[List[Dict], datetime]] = {}
_repo_cache: Dict[str, Tuple[Optional[Dict], datetime]] = {}
CACHE_TTL_MINUTES = 5


class RepositoryService:
    GITHUB_API = "https://api.github.com"
    GITLAB_API = "https://gitlab.com/api/v4"

    def __init__(self, github_token: Optional[str] = None, gitlab_token: Optional[str] = None):
        self.github_token = github_token
        self.gitlab_token = gitlab_token

    def with_token(self, github_token: Optional[str] = None) -> "RepositoryService":
        """Create a new instance with a specific GitHub token."""
        return RepositoryService(github_token=github_token, gitlab_token=self.gitlab_token)

    @staticmethod
    def parse_repo_url(url: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """
        Parse repository URL and return (platform, owner, repo).
        Supports GitHub and GitLab URLs.
        """
        if not url:
            return None, None, None

        url = url.strip().rstrip("/").rstrip(".git")

        # GitHub patterns
        github_patterns = [
            r"https?://github\.com/([^/]+)/([^/]+)",
            r"git@github\.com:([^/]+)/([^/]+)",
        ]
        for pattern in github_patterns:
            match = re.match(pattern, url)
            if match:
                return "github", match.group(1), match.group(2)

        # GitLab patterns (supports subgroups)
        gitlab_patterns = [
            r"https?://gitlab\.com/(.+)/([^/]+)$",
            r"git@gitlab\.com:(.+)/([^/]+)$",
        ]
        for pattern in gitlab_patterns:
            match = re.match(pattern, url)
            if match:
                # GitLab can have nested groups, join them with /
                owner_path = match.group(1)
                repo = match.group(2)
                return "gitlab", owner_path, repo

        return None, None, None

    def _get_github_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "ValidateMyApps"
        }
        if self.github_token:
            headers["Authorization"] = f"token {self.github_token}"
        return headers

    def _get_gitlab_headers(self) -> Dict[str, str]:
        headers = {
            "User-Agent": "ValidateMyApps"
        }
        if self.gitlab_token:
            headers["PRIVATE-TOKEN"] = self.gitlab_token
        return headers

    async def get_recent_commits(
        self,
        url: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Fetch recent commits from a repository."""
        platform, owner, repo = self.parse_repo_url(url)
        if not platform or not owner or not repo:
            return []

        # Include token presence in cache key so authenticated requests are cached separately
        auth_suffix = ":auth" if self.github_token else ":noauth"
        cache_key = f"{platform}:{owner}/{repo}{auth_suffix}"

        # Check cache
        if cache_key in _commit_cache:
            commits, cached_at = _commit_cache[cache_key]
            if datetime.utcnow() - cached_at < timedelta(minutes=CACHE_TTL_MINUTES):
                return commits[:limit]

        try:
            if platform == "github":
                commits = await self._fetch_github_commits(owner, repo, limit)
            else:
                commits = await self._fetch_gitlab_commits(owner, repo, limit)

            if commits:
                _commit_cache[cache_key] = (commits, datetime.utcnow())
            return commits
        except Exception:
            return []

    async def _fetch_github_commits(
        self,
        owner: str,
        repo: str,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Fetch commits from GitHub."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.GITHUB_API}/repos/{owner}/{repo}/commits",
                    headers=self._get_github_headers(),
                    params={"per_page": limit},
                    timeout=10.0
                )

                print(f"[GitHub Commits] {owner}/{repo} - Status: {response.status_code}")
                if response.status_code != 200:
                    print(f"[GitHub Commits] Error response: {response.text[:500]}")

                if response.status_code == 200:
                    commits = response.json()
                    return [
                        {
                            "sha": c["sha"][:7],
                            "full_sha": c["sha"],
                            "message": c["commit"]["message"].split("\n")[0][:100],
                            "author": c["commit"]["author"]["name"],
                            "date": c["commit"]["author"]["date"],
                            "url": c["html_url"]
                        }
                        for c in commits
                    ]
                return []
        except Exception as e:
            print(f"[GitHub Commits] Exception: {e}")
            return []

    async def _fetch_gitlab_commits(
        self,
        owner: str,
        repo: str,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Fetch commits from GitLab."""
        try:
            # GitLab uses URL-encoded project path
            project_path = f"{owner}/{repo}".replace("/", "%2F")

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.GITLAB_API}/projects/{project_path}/repository/commits",
                    headers=self._get_gitlab_headers(),
                    params={"per_page": limit},
                    timeout=10.0
                )

                if response.status_code == 200:
                    commits = response.json()
                    return [
                        {
                            "sha": c["short_id"],
                            "full_sha": c["id"],
                            "message": c["title"][:100],
                            "author": c["author_name"],
                            "date": c["committed_date"],
                            "url": c["web_url"]
                        }
                        for c in commits
                    ]
                return []
        except Exception:
            return []

    async def get_repo_info(self, url: str) -> Optional[Dict[str, Any]]:
        """Fetch repository information."""
        platform, owner, repo = self.parse_repo_url(url)
        if not platform or not owner or not repo:
            return None

        # Include token presence in cache key so authenticated requests are cached separately
        auth_suffix = ":auth" if self.github_token else ":noauth"
        cache_key = f"{platform}:{owner}/{repo}:info{auth_suffix}"

        # Check cache
        if cache_key in _repo_cache:
            info, cached_at = _repo_cache[cache_key]
            if datetime.utcnow() - cached_at < timedelta(minutes=CACHE_TTL_MINUTES):
                return info

        try:
            if platform == "github":
                info = await self._fetch_github_repo_info(owner, repo)
            else:
                info = await self._fetch_gitlab_repo_info(owner, repo)

            _repo_cache[cache_key] = (info, datetime.utcnow())
            return info
        except Exception:
            return None

    async def _fetch_github_repo_info(
        self,
        owner: str,
        repo: str
    ) -> Optional[Dict[str, Any]]:
        """Fetch repository info from GitHub."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.GITHUB_API}/repos/{owner}/{repo}",
                    headers=self._get_github_headers(),
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "name": data["name"],
                        "full_name": data["full_name"],
                        "description": data.get("description"),
                        "stars": data["stargazers_count"],
                        "forks": data["forks_count"],
                        "language": data.get("language"),
                        "open_issues": data["open_issues_count"],
                        "default_branch": data["default_branch"],
                        "url": data["html_url"],
                        "is_private": data["private"]
                    }
                return None
        except Exception:
            return None

    async def _fetch_gitlab_repo_info(
        self,
        owner: str,
        repo: str
    ) -> Optional[Dict[str, Any]]:
        """Fetch repository info from GitLab."""
        try:
            project_path = f"{owner}/{repo}".replace("/", "%2F")

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.GITLAB_API}/projects/{project_path}",
                    headers=self._get_gitlab_headers(),
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "name": data["name"],
                        "full_name": data["path_with_namespace"],
                        "description": data.get("description"),
                        "stars": data.get("star_count", 0),
                        "forks": data.get("forks_count", 0),
                        "language": None,  # GitLab doesn't have a primary language field
                        "open_issues": data.get("open_issues_count", 0),
                        "default_branch": data.get("default_branch", "main"),
                        "url": data["web_url"],
                        "is_private": data.get("visibility") == "private"
                    }
                return None
        except Exception:
            return None


# Global service instance
repository_service = RepositoryService()
