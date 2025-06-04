import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import openai

# Set your OpenAI API key as an environment variable:

openai.api_key = os.getenv("OPENAI_API_KEY")

class BehaviorModelTrainer:
    def __init__(self, transactions_df):
        """
        transactions_df: pandas DataFrame with columns ['date', 'category', 'amount']
        date column should be datetime type.
        """
        self.df = transactions_df.copy()
        self._prepare_features()
        self.patterns = {}
        self.seasonality = {}

    def _prepare_features(self):
        # Add basic time features
        self.df['day_of_week'] = self.df['date'].dt.day_name()
        self.df['month'] = self.df['date'].dt.month
        self.df['is_weekend'] = self.df['day_of_week'].isin(['Saturday', 'Sunday']).astype(int)

        # Example: flag exam weeks or travel weeks (mock) - here we simulate exam weeks every 60 days
        self.df['daynum'] = (self.df['date'] - self.df['date'].min()).dt.days
        self.df['is_exam_week'] = ((self.df['daynum'] % 60) < 7).astype(int)
        # Example: simulate winter months (Dec-Feb) for rideshare spikes
        self.df['is_winter'] = self.df['month'].isin([12, 1, 2]).astype(int)

    def learn_habits(self):
        """
        Learn average spend per category by weekday and by month.
        """
        # Average spend by day of week and category
        self.avg_spend_day_cat = (
            self.df.groupby(['day_of_week', 'category'])['amount']
                   .mean()
                   .reset_index()
                   .rename(columns={'amount': 'avg_spend'})
        )

        # Average spend by month and category (for seasonality)
        self.avg_spend_month_cat = (
            self.df.groupby(['month', 'category'])['amount']
                   .mean()
                   .reset_index()
                   .rename(columns={'amount': 'avg_spend_month'})
        )

        # Example: detect exam-week anomaly: average by category during exam weeks vs non-exam
        exam_df = self.df[self.df['is_exam_week'] == 1]
        non_exam_df = self.df[self.df['is_exam_week'] == 0]
        self.exam_spend_diff = (
            exam_df.groupby('category')['amount'].mean().subtract(
                non_exam_df.groupby('category')['amount'].mean(), fill_value=0
            )
            .reset_index()
            .rename(columns={'amount': 'exam_spend_delta'})
        )

    def identify_patterns_with_gpt(self):
        """
        Use ChatGPT to identify top spending patterns from aggregated summaries.
        This function sends summaries to the GPT-4 model and parses its response.
        """
        # Prepare a summary of average spend by day and category
        summary = "Average spend by day_of_week and category:\n"
        for _, row in self.avg_spend_day_cat.iterrows():
            summary += f"{row['day_of_week']} - {row['category']}: ${row['avg_spend']:.2f}\n"

        # Prepare a summary of exam-week spending deltas
        summary += "\nExam-week spending differences by category (exam - non-exam):\n"
        for _, row in self.exam_spend_diff.iterrows():
            summary += f"{row['category']}: ${row['exam_spend_delta']:.2f}\n"

        # Prompt GPT to extract patterns
        prompt = (
            "You are a financial analyst assistant. "
            "Given the following spending summaries, identify the top 3 recurring behavior patterns, including weekend vs weekday differences, "
            "exam-week anomalies, and any notable category spikes. "
            "Provide the output in JSON format with keys: 'pattern', 'description'.\n\n" + summary
        )

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500
        )
        content = response.choices[0].message.content
        # For simplicity, store raw GPT output; parsing into Python dict can be added
        self.patterns['gpt_patterns'] = content

    def detect_seasonality_with_gpt(self):
        """
        Use ChatGPT to identify seasonal spending trends from monthly averages.
        """
        # Prepare a summary of average spend by month and category
        summary = "Average spend by month and category:\n"
        for _, row in self.avg_spend_month_cat.iterrows():
            summary += f"Month {int(row['month'])} - {row['category']}: ${row['avg_spend_month']:.2f}\n"

        prompt = (
            "You are a financial data scientist. "
            "Based on the following monthly spending summary, identify 2-3 significant seasonal trends, such as spikes in certain categories during winter or summer. "
            "Output in JSON format with keys: 'season', 'category', 'trend_description'.\n\n" + summary
        )

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500
        )
        content = response.choices[0].message.content
        self.seasonality['gpt_seasonality'] = content

    def predict_habitual_expenses(self, future_dates):
        """
        For each date in future_dates (list of datetime), predict total spend based on learned weekday-category averages.
        Includes exam-week and seasonality adjustments.
        Returns a list of dicts: [{'date': dt, 'predicted_spend': value}, ...]
        """
        predictions = []
        for date in future_dates:
            day_name = date.strftime('%A')
            month = date.month
            is_exam = 1 if ((date - self.df['date'].min()).days % 60) < 7 else 0
            is_winter = 1 if month in [12, 1, 2] else 0

            # Base prediction: sum of avg spend for that weekday across categories
            base = self.avg_spend_day_cat[
                self.avg_spend_day_cat['day_of_week'] == day_name
            ]['avg_spend'].sum()

            # Exam-week adjustment: add deltas for categories with exam spikes
            exam_adjustment = 0
            if is_exam:
                exam_adjustment = self.exam_spend_diff['exam_spend_delta'].sum()

            # Seasonal adjustment: use GPT-seasonality or simple code-based
            # Here, for simplicity, we add 10% increase to transport if winter
            season_adj = 0
            if is_winter:
                df_winter = self.avg_spend_month_cat[
                    (self.avg_spend_month_cat['month'] == month) &
                    (self.avg_spend_month_cat['category'] == 'transport')
                ]
                if not df_winter.empty:
                    season_adj = 0.1 * df_winter['avg_spend_month'].iloc[0]

            predicted = round(base + exam_adjustment + season_adj, 2)
            predictions.append({'date': date, 'predicted_spend': predicted})

        return predictions

if __name__ == "__main__":
    # Step A: Generate mock transactions for a full year (2024-06-01 to 2025-05-31)
    categories = ["coffee", "groceries", "transport", "food delivery", "rideshare", "rent", "entertainment"]
    start_date = datetime(2024, 6, 1)
    end_date = datetime(2025, 5, 31)
    days = (end_date - start_date).days + 1

    records = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        # Random number of transactions per day (0 to 5)
        for _ in range(random.randint(0, 5)):
            category = random.choice(categories)
            if category == "coffee":
                amount = round(random.uniform(2, 5), 2)
            elif category == "rent":
                amount = 1000 if date.day == 1 else 0  # rent on 1st of each month
            else:
                amount = round(random.uniform(10, 100), 2)
            if amount > 0:
                records.append({"date": date, "category": category, "amount": amount})

    transactions_df = pd.DataFrame(records)
    transactions_df = transactions_df[transactions_df['amount'] > 0]

    # Initialize and train BehaviorModelTrainer
    trainer = BehaviorModelTrainer(transactions_df)
    trainer.learn_habits()
    trainer.identify_patterns_with_gpt()
    trainer.detect_seasonality_with_gpt()

    # Predict habitual spending for next 30 days from 2025-06-01
    future_dates = [datetime(2025, 6, 1) + timedelta(days=i) for i in range(30)]
    preds = trainer.predict_habitual_expenses(future_dates)

    # Print results
    print("\n=== Learned Patterns from GPT ===")
    print(trainer.patterns['gpt_patterns'])

    print("\n=== Detected Seasonality from GPT ===")
    print(trainer.seasonality['gpt_seasonality'])

    print("\n=== Predicted Habitual Expenses (Next 30 Days) ===")
    for item in preds:
        date_str = item['date'].strftime('%Y-%m-%d')
        print(f"{date_str}: ${item['predicted_spend']}")

