from datetime import date


def test_insights_and_reports(client, auth_headers):
    today = date.today()
    today_str = today.isoformat()

    # Add transactions
    client.post(
        "/api/income/",
        headers=auth_headers,
        json={
            "title": "Monthly Salary",
            "amount": "5000.00",
            "date": today_str,
            "payment_method": "Bank Transfer",
        },
    )
    client.post(
        "/api/expenses/",
        headers=auth_headers,
        json={
            "title": "Supermarket Groceries",
            "amount": "300.00",
            "date": today_str,
            "payment_method": "Credit Card",
        },
    )

    # 1. Test Insights endpoint
    ins_res = client.get("/api/insights/", headers=auth_headers)
    assert ins_res.status_code == 200
    ins_data = ins_res.json()
    assert "health_score" in ins_data
    assert ins_data["health_score"] >= 0
    assert len(ins_data["insights"]) > 0

    # 2. Test Reports Period endpoint
    rep_res = client.get("/api/reports/period?preset=this_month", headers=auth_headers)
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["total_income"] == "5000.00"
    assert rep_data["total_expenses"] == "300.00"
    assert rep_data["net_savings"] == "4700.00"

    # 3. Test Export CSV
    csv_res = client.get("/api/reports/export/csv?preset=this_month", headers=auth_headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Monthly Salary" in csv_res.text
    assert "Supermarket Groceries" in csv_res.text

    # 4. Test Export PDF
    pdf_res = client.get("/api/reports/export/pdf?preset=this_month", headers=auth_headers)
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers["content-type"]
    assert pdf_res.content.startswith(b"%PDF")
