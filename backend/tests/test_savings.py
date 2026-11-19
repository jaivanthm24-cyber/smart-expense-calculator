from datetime import date, timedelta


def test_savings_goals_and_contributions(client, auth_headers):
    target_date = (date.today() + timedelta(days=90)).isoformat()

    # 1. Create savings goal
    create_res = client.post(
        "/api/savings-goals/",
        headers=auth_headers,
        json={
            "name": "Emergency Reserve Fund",
            "target_amount": "2000.00",
            "current_amount": "0.00",
            "target_date": target_date,
            "category": "Emergency",
            "notes": "Target: 3 months of basic living costs",
        },
    )
    assert create_res.status_code == 201
    goal = create_res.json()
    goal_id = goal["id"]
    assert goal["progress_percentage"] == 0.0
    assert goal["remaining_amount"] == "2000.00"

    # 2. Add contribution of $500 (25% progress)
    contrib_res = client.post(
        f"/api/savings-goals/{goal_id}/contributions",
        headers=auth_headers,
        json={
            "amount": "500.00",
            "date": date.today().isoformat(),
            "notes": "First deposit from monthly bonus",
        },
    )
    assert contrib_res.status_code == 200
    updated_goal = contrib_res.json()
    assert updated_goal["current_amount"] == "500.00"
    assert updated_goal["progress_percentage"] == 25.0
    assert updated_goal["remaining_amount"] == "1500.00"
    assert len(updated_goal["contributions"]) == 1

    # 3. Add contribution to complete the goal
    complete_res = client.post(
        f"/api/savings-goals/{goal_id}/contributions",
        headers=auth_headers,
        json={
            "amount": "1500.00",
            "date": date.today().isoformat(),
            "notes": "Final payout",
        },
    )
    assert complete_res.status_code == 200
    completed_goal = complete_res.json()
    assert completed_goal["current_amount"] == "2000.00"
    assert completed_goal["progress_percentage"] == 100.0
    assert completed_goal["status"] == "completed"
