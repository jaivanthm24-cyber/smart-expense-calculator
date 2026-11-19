from datetime import date


def test_dashboard_summary_and_analytics(client, auth_headers):
    today = date.today()
    today_str = today.isoformat()

    # Record Income: $4000
    client.post(
        "/api/income/",
        headers=auth_headers,
        json={
            "title": "Consulting Fee",
            "amount": "4000.00",
            "date": today_str,
            "payment_method": "Bank Transfer",
        },
    )

    # Record Expense: $1200
    client.post(
        "/api/expenses/",
        headers=auth_headers,
        json={
            "title": "Apartment Rent",
            "amount": "1200.00",
            "date": today_str,
            "payment_method": "Bank Transfer",
        },
    )

    # 1. Test Dashboard summary
    dash_res = client.get("/api/dashboard/summary?preset=this_month", headers=auth_headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_income"] == "4000.00"
    assert dash_data["total_expenses"] == "1200.00"
    assert dash_data["current_balance"] == "2800.00"
    assert len(dash_data["recent_transactions"]) == 2

    # 2. Test Analytics overview
    analytics_res = client.get("/api/analytics/overview?preset=this_month", headers=auth_headers)
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    assert analytics_data["total_income"] == "4000.00"
    assert analytics_data["total_expenses"] == "1200.00"
    assert analytics_data["net_savings"] == "2800.00"
    assert len(analytics_data["weekly_spending_patterns"]) == 7
    assert len(analytics_data["comparisons"]) == 3
