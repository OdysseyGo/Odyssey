#!/usr/bin/env python
"""Test script for AI tour generation."""
import json
import sys
import time
import urllib.parse
import urllib.request

BASE_URL = "http://localhost:8000/api"


def request(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Token {token}"

    if data:
        data = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            if response.status == 204:
                return None
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        raise
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def run_test():
    ts = int(time.time())

    print("1. Creating Test User...")
    user_creds = {
        "username": f"ai_test_{ts}",
        "password": "password123",
        "email": f"ai_test_{ts}@test.com",
    }
    request("POST", "/users/", user_creds)
    print(f"   Created {user_creds['username']}")

    print("\n2. Getting Token...")
    token = request("POST", "/token/", user_creds)["token"]
    print("   Token obtained")

    print("\n3. Generating AI Tour (HYBRID mode, Istanbul, Ottoman History)...")
    tour_request = {
        "city": "Istanbul",
        "theme": "Ottoman Empire History",
        "mode": "HYBRID",
        "duration": 60,
        "language": "en",
    }

    try:
        result = request("POST", "/ai/generate-tour/", tour_request, token=token)
        print(f"   SUCCESS! Tour ID: {result['tour_id']}")
        print(f"   Title: {result['title']}")
        print(f"   Message: {result['message']}")
    except Exception as e:
        print(f"   FAILED: {e}")
        sys.exit(1)

    print("\n4. Fetching Generated Tour...")
    tour = request("GET", f"/tours/{result['tour_id']}/", token=token)
    print(f"   Title: {tour['title']}")
    print(f"   Steps: {len(tour['steps'])}")
    for step in tour["steps"]:
        print(
            f"     - {step['order']}. {step['title']} ({step['latitude']}, {step['longitude']})"
        )
        if "puzzle" in step and step["puzzle"]:
            print(f"       Puzzle: {step['puzzle']['question'][:50]}...")

    print("\n✅ AI Tour Generation Test PASSED!")


if __name__ == "__main__":
    run_test()
