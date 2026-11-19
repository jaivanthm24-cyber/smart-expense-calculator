from datetime import date


def test_expense_crud_and_isolation(client, auth_headers, other_auth_headers):
    today_str = date.today().isoformat()

    # 1. Create expense
    res = client.post(
        "/api/expenses/",
        headers=auth_headers,
        json={
            "title": "Grocery Shopping Whole Foods",
            "amount": "142.50",
            "date": today_str,
            "payment_method": "Credit Card",
            "description": "Weekly organic groceries",
            "notes": "Healthy fruits and vegetables",
        },
    )
    assert res.status_code == 201
    exp_id = res.json()["id"]
    assert res.json()["amount"] == "142.50"

    # 2. Search & filter
    list_res = client.get("/api/expenses/?search=Whole", headers=auth_headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 1

    # 3. Data Isolation check
    other_list = client.get("/api/expenses/", headers=other_auth_headers)
    assert other_list.status_code == 200
    assert other_list.json()["total"] == 0

    other_del = client.delete(f"/api/expenses/{exp_id}", headers=other_auth_headers)
    assert other_del.status_code == 404

    # 4. Update
    upd_res = client.put(
        f"/api/expenses/{exp_id}",
        headers=auth_headers,
        json={"amount": "150.00"},
    )
    assert upd_res.status_code == 200
    assert upd_res.json()["amount"] == "150.00"

    # 5. Delete
    del_res = client.delete(f"/api/expenses/{exp_id}", headers=auth_headers)
    assert del_res.status_code == 200
