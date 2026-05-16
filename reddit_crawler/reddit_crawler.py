import requests
import json


HEADERS = {"User-Agent": "reddit_crawler/1.0"}


def crawl_comments(post_id: str, subreddit: str) -> list:
    url = f"https://www.reddit.com/r/{subreddit}/comments/{post_id}.json"
    response = requests.get(url, headers=HEADERS, timeout=10)
    response.raise_for_status()

    comments = []
    for child in response.json()[1]["data"]["children"]:
        if child["kind"] != "t1":
            continue
        data = child["data"]
        comments.append({
            "author": data.get("author", ""),
            "body": data.get("body", ""),
            "score": data.get("score", 0),
        })

    return comments


def crawl_subreddit(subreddit: str, sort: str = "top", limit: int = 25) -> list:
    url = f"https://www.reddit.com/r/{subreddit}/{sort}.json?limit={limit}"
    response = requests.get(url, headers=HEADERS, timeout=10)
    response.raise_for_status()

    posts = []
    for child in response.json()["data"]["children"]:
        data = child["data"]
        post_id = data["id"]
        print(f"  크롤링 중: {data['title'][:50]}...")
        posts.append({
            "id": post_id,
            "title": data["title"],
            "url": data["url"],
            "selftext": data.get("selftext", ""),
            "score": data.get("score", 0),
            "num_comments": data.get("num_comments", 0),
            "comments": crawl_comments(post_id, subreddit),
        })

    return posts


if __name__ == "__main__":
    print("r/korea top 25 크롤링 시작...\n")
    posts = crawl_subreddit("korea", sort="top", limit=25)

    for i, post in enumerate(posts, 1):
        print(f"\n{i:2}. {post['title']}")
        print(f"    URL: {post['url']}")
        if post["selftext"]:
            print(f"    본문: {post['selftext'][:100]}...")
        print(f"    댓글 수: {len(post['comments'])}개")

    with open("korea_top25.json", "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)
    print(f"\nSaved to korea_top25.json")
