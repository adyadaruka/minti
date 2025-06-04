import plaid
from plaid.api import plaid_api
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.products import Products
from datetime import datetime, timedelta
from collections import defaultdict
import os

# This should come from environment variables for security
PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET = os.getenv("PLAID_SECRET")
PLAID_ENV = "sandbox"  # or "development" or "production"

# Initialize Plaid client
configuration = plaid.Configuration(
    host=plaid.Environment.Sandbox,  # change to Development/Production when ready
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET,
    }
)
api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

def exchange_public_token(public_token):
    """
    Convert a public_token (from Plaid Link) to an access_token.
    This only needs to be done once per user item.
    """
    request = ItemPublicTokenExchangeRequest(public_token=public_token)
    response = client.item_public_token_exchange(request)
    return response['access_token']

def fetch_transactions(access_token, start_date, end_date):
    """
    Fetches transactions from the user's linked account over a date range.
    """
    options = TransactionsGetRequestOptions(count=100, offset=0)
    request = TransactionsGetRequest(
        access_token=access_token,
        start_date=start_date,
        end_date=end_date,
        options=options
    )
    response = client.transactions_get(request)
    return response['transactions']

def categorize_transactions(transactions):
    """
    Returns transactions grouped by top-level category.
    Also detects recurring payments by looking for similar transactions.
    """
    categorized = defaultdict(list)
    recurring = defaultdict(list)

    for txn in transactions:
        name = txn.name
        category = txn.category[0] if txn.category else "Uncategorized"
        amount = txn.amount
        date = txn.date

        categorized[category].append({
            "name": name,
            "amount": amount,
            "date": date
        })

    # Simple recurring payment detection: look for same vendor every ~30 days
    for category, txns in categorized.items():
        by_name = defaultdict(list)
        for txn in txns:
            by_name[txn["name"]].append(txn)

        for name, group in by_name.items():
            if len(group) >= 3:
                # Check spacing between dates is around monthly
                group.sort(key=lambda x: x["date"])
                intervals = []
                for i in range(1, len(group)):
                    d1 = datetime.strptime(group[i]["date"], "%Y-%m-%d")
                    d0 = datetime.strptime(group[i - 1]["date"], "%Y-%m-%d")
                    intervals.append((d1 - d0).days)

                avg_interval = sum(intervals) / len(intervals)
                if 25 <= avg_interval <= 35:
                    recurring[category].append({
                        "name": name,
                        "avg_amount": sum(tx["amount"] for tx in group) / len(group),
                        "frequency_days": avg_interval
                    })

    return {
        "by_category": dict(categorized),
        "recurring": dict(recurring)
    }

# Example usage
if __name__ == "__main__":
    # Replace with valid access token for a test user
    access_token = "access-sandbox-..."  # You would normally get this after linking an account
    end = datetime.today()
    start = end - timedelta(days=90)

    transactions = fetch_transactions(access_token, start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"))
    analyzed = categorize_transactions(transactions)

    print("Categorized Spending:")
    for cat, txns in analyzed["by_category"].items():
        total = sum(txn["amount"] for txn in txns)
        print(f" - {cat}: ${total:.2f}")

    print("\nRecurring Payments:")
    for cat, recs in analyzed["recurring"].items():
        for r in recs:
            print(f" - {r['name']} (${r['avg_amount']:.2f} every {r['frequency_days']:.1f} days)")
