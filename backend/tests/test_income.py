from datetime import date


def test_income_crud_and_isolation(client, auth_headers, other_auth_headers):
    # 1. Create income
    today_str = date.today().isoformat()
    create_res = client.post(
        "/api/income/",
        headers=auth_headers,
        json={
            "title": "Software Engineering Salary",
            "amount": "5500.00",
            "date": today_str,
            "payment_method": "Direct Deposit",
            "description": "Monthly base salary payment",
        },
    )
    assert create_res.status_code == 201
    income_data = create_res.json()
    income_id = income_data["id"]
    assert income_data["title"] == "Software Engineering Salary"
    assert income_data["amount"] == "5500.00"

    # 2. List incomes
    list_res = client.get("/api/income/", headers=auth_headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] == 1
    assert list_data["total_amount"] == "5500.00"

    # 3. Data Isolation: Other user should see 0 items
    other_list_res = client.get("/api/income/", headers=other_auth_headers)
    assert other_list_res.status_code == 200
    assert other_list_res.json()["total"] == 0

    # 4. Other user cannot read or update user's income
    other_get_res = client.get(f"/api/income/{income_id}", headers=other_auth_headers)
    assert other_get_res.status_code == 404

    # 5. Update income
    update_res = client.put(
        f"/api/income/{income_id}",
        headers=auth_headers,
        json={"amount": "6000.00", "title": "Promoted Salary"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["amount"] == "6000.00"
    assert update_res.json()["title"] == "Promoted Salary"

    # 6. Delete income
    del_res = client.delete(f"/api/income/{income_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Verify deleted
    get_del = client.get(f"/api/income/{income_id}", headers=auth_headers)
    assert get_del.status_code == 404
