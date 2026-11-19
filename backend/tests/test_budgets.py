from datetime import date


def test_budget_calculations_and_alerts(client, auth_headers):
    today = date.today()

    # 1. Set overall monthly budget of $1000 with 80% threshold
    b_res = client.post(
        "/api/budgets/",
        headers=auth_headers,
        json={
            "amount": "1000.00",
            "month": today.month,
            "year": today.year,
            "category_id": None,
            "alert_threshold": 80,
        },
    )
    assert b_res.status_code == 201
    assert b_res.json()["amount"] == "1000.00"

    # Check overview: currently 0 spent, normal
    overview = client.get(
        f"/api/budgets/?month={today.month}&year={today.year}", headers=auth_headers
    )
    assert overview.status_code == 200
    data = overview.json()
    assert data["total_budget"] == "1000.00"
    assert data["total_spent"] == "0.00"
    assert data["overall_utilization_pct"] == 0.0
    assert not data["is_overall_warning"]
    assert not data["is_overall_exceeded"]

    # 2. Add an expense of $850 (85% utilization -> warning status)
    client.post(
        "/api/expenses/",
        headers=auth_headers,
        json={
            "title": "New Laptop Monitor",
            "amount": "850.00",
            "date": today.isoformat(),
            "payment_method": "Credit Card",
        },
    )

    overview2 = client.get(
        f"/api/budgets/?month={today.month}&year={today.year}", headers=auth_headers
    )
    data2 = overview2.json()
    assert data2["total_spent"] == "850.00"
    assert data2["overall_utilization_pct"] == 85.0
    assert data2["is_overall_warning"] is True
    assert data2["is_overall_exceeded"] is False

    # 3. Add an expense of $200 (Total $1050 -> exceeded status)
    client.post(
        "/api/expenses/",
        headers=auth_headers,
        json={
            "title": "Weekend Dinner",
            "amount": "200.00",
            "date": today.isoformat(),
            "payment_method": "Debit Card",
        },
    )

    overview3 = client.get(
        f"/api/budgets/?month={today.month}&year={today.year}", headers=auth_headers
    )
    data3 = overview3.json()
    assert data3["total_spent"] == "1050.00"
    assert data3["overall_utilization_pct"] == 105.0
    assert data3["is_overall_exceeded"] is True
