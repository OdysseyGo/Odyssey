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
        headers["Authorization"] = f"Bearer {token}"

    if data:
        data = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 204:
                return None
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise e
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def run_test():
    ts = int(time.time())
    print("1. Creating Users...")
    # Create Creator
    creator_creds = {
        "username": f"creator_{ts}",
        "password": "password123",
        "email": f"creator_{ts}@test.com",
    }
    request("POST", "/users/", creator_creds)
    print(f"   Created {creator_creds['username']}")

    # Create Player
    player_creds = {
        "username": f"player_{ts}",
        "password": "password123",
        "email": f"player_{ts}@test.com",
    }
    request("POST", "/users/", player_creds)
    print(f"   Created {player_creds['username']}")

    print("\n2. Getting Tokens...")
    creator_login = request("POST", "/users/login/", creator_creds)
    player_login  = request("POST", "/users/login/", player_creds)

    creator_token = creator_login["access"]
    player_token = player_login["access"]

    print("   Tokens obtained")


    print("\n3. Creating Badge (as Creator)...")
    xp_badge_data = {
        "name": "Novice Explorer",
        "description": "Earn 100 XP",
        "criteria": {"xp": 100},
    }
    request("POST", "/badges/", xp_badge_data, token=creator_token)
    print("   Created Badge: Novice Explorer (100 XP)")

    # 2. City Badge (for later)
    city_badge_data = {
        "name": "Paris Explorer",
        "description": "Complete 1 tour in Paris",
        "criteria": {"city": "Paris", "count": 1},
    }
    request("POST", "/badges/", city_badge_data, token=creator_token)
    print("   Created Badge: Paris Explorer")

    print("\n4. Creating Tour (as Creator)...")
    tour_data = {
        "title": f"Test Tour {ts}",
        "description": "A test tour",
        "tour_type": "STORY",
        "category": "Test",
        "difficulty": "EASY",
        "duration_minutes": 30,
        "status": "PUBLISHED",
    }
    tour = request("POST", "/tours/", tour_data, token=creator_token)
    tour_id = tour["id"]
    print(f"   Created Tour ID: {tour_id}")

    print("\n4.1 Adding Steps (as Creator)...")
    # Step 1
    step_data = {
        "order": 1,
        "title": "Step 1",
        "description": "First step",
        "latitude": "0.0",
        "longitude": "0.0",
        "puzzle": {
            "puzzle_type": "TRIVIA",
            "question": "What is 2+2?",
            "correct_answer": "4",
            "xp_reward": 50,
        },
    }
    step = request("POST", f"/tours/{tour_id}/steps/", step_data, token=creator_token)
    step_id = step["id"]
    print(f"   Created Step 1 ID: {step_id}")

    # Step 2
    step2_data = {
        "order": 2,
        "title": "Step 2",
        "description": "Second step",
        "latitude": "0.0",
        "longitude": "0.0",
        "puzzle": {
            "puzzle_type": "TRIVIA",
            "question": "Capital of France?",
            "correct_answer": "Paris",
            "xp_reward": 100,
        },
    }
    step2 = request("POST", f"/tours/{tour_id}/steps/", step2_data, token=creator_token)
    step2_id = step2["id"]
    print(f"   Created Step 2 ID: {step2_id}")

    print("\n5. Starting Tour (as Player)...")
    # We do NOT pass current_step. The backend should auto-assign Step 1.
    progress_data = {"tour_id": tour_id}
    progress = request("POST", "/tour-progress/", progress_data, token=player_token)
    progress_id = progress["id"]
    

    print("\n6. Completing Step 1 (as Player)...")
    # We send the ID of the step we just finished.
    complete_data = {"step_id": step_id}
    result = request(
        "POST",
        f"/tour-progress/{progress_id}/complete-step/",
        complete_data,
        token=player_token,
    )
    print(f"   Result: {result}")
    
    # Check if we moved to step 2
    if result.get("new_step_id") == step2_id:
        print("   SUCCESS: Moved to Step 2 automatically.")
    else:
        print(f"   FAILURE: Did not move to Step 2. New step: {result.get('new_step_id')}")

    print("\n7. Completing Step 2 (as Player) - FINAL STEP...")
    complete_data2 = {"step_id": step2_id}
    result2 = request(
        "POST",
        f"/tour-progress/{progress_id}/complete-step/",
        complete_data2,
        token=player_token,
    )
    print(f"   Result: {result2}")

    # Verify Completion logic
    if result2.get("is_tour_complete") is True:
        print("   SUCCESS: Tour marked complete automatically.")
    else:
        print("   FAILURE: Tour NOT marked complete.")
        sys.exit(1)

    print("\n8. Verifying Badges & XP...")
    # 1. Check XP (50 + 100 = 150)
    player_profile = request(
        "GET",
        f"/users/{request('GET', '/users/me/', token=player_token)['id']}/",
        token=player_token,
    )
    xp = player_profile["xp"]
    if xp == 150:
        print("   SUCCESS: Total XP (150) correct.")
    else:
        print(f"   FAILURE: Expected 150 XP, got {xp}")
        sys.exit(1)

    # 2. Check Novice Explorer Badge (triggered by XP > 100 during Step 2 completion)
    my_badges = request("GET", "/my-badges/", token=player_token)["results"]
    if any(b["badge"]["name"] == "Novice Explorer" for b in my_badges):
        print("   SUCCESS: Player earned 'Novice Explorer' badge!")
    else:
        print("   FAILURE: 'Novice Explorer' badge not awarded.")
        print(f"   Current Badges: {json.dumps(my_badges, indent=2)}")

    print("\n9. Testing City-Based Badge (Paris)...")
    # Create Tour in Paris
    paris_tour_data = {
        "title": "Paris Tour",
        "description": "A tour in Paris",
        "tour_type": "STORY",
        "category": "City",
        "difficulty": "EASY",
        "duration_minutes": 60,
        "status": "PUBLISHED",
        "city": "Paris",
    }
    paris_tour = request("POST", "/tours/", paris_tour_data, token=creator_token)
    paris_tour_id = paris_tour["id"]

    # Add 1 Step
    paris_step_data = {
        "order": 1,
        "title": "Eiffel Tower",
        "description": "Visit the tower",
        "latitude": "48.8584",
        "longitude": "2.2945",
        "puzzle": {
            "puzzle_type": "TRIVIA",
            "question": "Height?",
            "correct_answer": "300m",
            "xp_reward": 10,
        },
    }
    paris_step = request(
        "POST", f"/tours/{paris_tour_id}/steps/", paris_step_data, token=creator_token
    )
    paris_step_id = paris_step["id"]

    # Start Tour
    paris_progress = request("POST", "/tour-progress/", {"tour_id": paris_tour_id}, token=player_token)
    paris_progress_id = paris_progress["id"]

    print("   Started Paris Tour. Completing final step...")

    # Complete Step 1 (Which is also the last step)
    # This should trigger: XP Award -> Next Step Check (None) -> Mark Complete -> Badge Check
    result_paris = request(
        "POST",
        f"/tour-progress/{paris_progress_id}/complete-step/",
        {"step_id": paris_step_id},
        token=player_token,
    )

    if result_paris.get("is_tour_complete"):
        print("   SUCCESS: Paris Tour completed.")
    else:
        print("   FAILURE: Paris Tour did not complete automatically.")
        sys.exit(1)

    # Verify Badge
    my_badges_updated = request("GET", "/my-badges/", token=player_token)["results"]
    if any(b["badge"]["name"] == "Paris Explorer" for b in my_badges_updated):
        print("   SUCCESS: Player earned 'Paris Explorer' badge!")
    else:
        print("   FAILURE: 'Paris Explorer' badge not awarded.")
        sys.exit(1)

    print("\n10. Final Verification: Tour Count...")
    # Player completed 2 tours. Check profile stats if available, or rely on badges.
    # Assuming the profile might have a 'tour_count' if you added it to the serializer.
    player_profile = request(
        "GET",
        f"/users/{request('GET', '/users/me/', token=player_token)['id']}/",
        token=player_token,
    )
    if player_profile.get("tour_count") == 2:
        print("   SUCCESS: User tour_count incremented to 2.")
    elif "tour_count" not in player_profile:
        print("   NOTE: 'tour_count' field not found in User response (add to serializer to verify).")
    else:
        print(f"   FAILURE: tour_count is {player_profile.get('tour_count')}, expected 2.")

    print("\n--- ALL TESTS PASSED ---")

if __name__ == "__main__":
    run_test()