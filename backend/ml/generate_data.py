"""Generate a realistic synthetic Indian salary dataset.

The data is synthesised with domain-informed rules (base pay per role,
experience growth curve, education premium, city tier, company size and
industry multipliers) plus controlled noise, so the trained model learns
genuine-looking relationships instead of random ones.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

RNG_SEED = 42
ROWS = 5000
OUTPUT_PATH = "data/salary_dataset.csv"

EDUCATION = ["Bachelor's", "Master's", "PhD"]
CITIES = {
    "Bangalore": 1.15,
    "Hyderabad": 1.08,
    "Pune": 1.05,
    "Mumbai": 1.12,
    "Delhi NCR": 1.10,
    "Chennai": 1.00,
    "Kolkata": 0.88,
    "Ahmedabad": 0.86,
    "Jaipur": 0.82,
    "Remote": 0.95,
}
COMPANY_SIZE = {"Startup": 0.95, "SMB": 1.00, "Mid-size": 1.08, "Enterprise": 1.18, "MNC": 1.30}
INDUSTRY = {
    "Product Company": 1.25,
    "Fintech": 1.20,
    "IT Services": 0.95,
    "E-commerce": 1.12,
    "Consulting": 1.15,
    "Healthcare": 1.00,
    "Manufacturing": 0.90,
    "EdTech": 1.02,
}
JOB_ROLE = {
    # role: (base annual CTC in INR at 0 experience, growth per year factor)
    "Software Engineer": (600_000, 0.105),
    "Senior Software Engineer": (1_100_000, 0.100),
    "Data Scientist": (750_000, 0.110),
    "Machine Learning Engineer": (900_000, 0.115),
    "DevOps Engineer": (700_000, 0.100),
    "Cloud Architect": (1_400_000, 0.105),
    "Product Manager": (1_000_000, 0.110),
    "Business Analyst": (550_000, 0.095),
    "UI/UX Designer": (500_000, 0.095),
    "QA Engineer": (450_000, 0.090),
    "Data Engineer": (800_000, 0.105),
    "Cybersecurity Analyst": (700_000, 0.105),
    "Sales Manager": (650_000, 0.100),
    "Marketing Specialist": (500_000, 0.095),
    "Mechanical Engineer": (500_000, 0.085),
    "Civil Engineer": (420_000, 0.080),
    "Chartered Accountant": (850_000, 0.100),
    "HR Manager": (600_000, 0.095),
}
EDUCATION_PREMIUM = {"Bachelor's": 1.00, "Master's": 1.14, "PhD": 1.26}

# PhDs rarely start at 0 experience in this data; keep the experience
# distribution realistic per education level.
EDU_EXPERIENCE = {
    "Bachelor's": (0, 22),
    "Master's": (0, 18),
    "PhD": (2, 20),
}


def build_dataset(rng: np.random.Generator) -> pd.DataFrame:
    roles = list(JOB_ROLE)
    cities = list(CITIES)
    sizes = list(COMPANY_SIZE)
    industries = list(INDUSTRY)

    education = rng.choice(EDUCATION, size=ROWS, p=[0.60, 0.30, 0.10])

    experience = np.empty(ROWS, dtype=float)
    for level, (low, high) in EDU_EXPERIENCE.items():
        mask = education == level
        n = int(mask.sum())
        # skewed towards early-mid career
        experience[mask] = np.round(rng.beta(a=2.0, b=3.2, size=n) * (high - low) + low, 1)
    experience = np.clip(experience, 0, 22)

    job_title = rng.choice(roles, size=ROWS)
    city = rng.choice(cities, size=ROWS)
    company_size = rng.choice(sizes, size=ROWS, p=[0.20, 0.30, 0.22, 0.18, 0.10])
    industry = rng.choice(industries, size=ROWS)

    salaries = np.empty(ROWS, dtype=float)
    for i in range(ROWS):
        base, growth = JOB_ROLE[job_title[i]]
        years = experience[i]
        # compounding growth that naturally saturates after ~15 years
        growth_curve = (1 + growth) ** min(years, 15) * (1 + growth * 0.25) ** max(years - 15, 0)
        salary = (
            base
            * growth_curve
            * EDUCATION_PREMIUM[education[i]]
            * CITIES[city[i]]
            * COMPANY_SIZE[company_size[i]]
            * INDUSTRY[industry[i]]
        )
        # market noise
        salary *= rng.normal(1.0, 0.09)
        salaries[i] = salary

    salaries = np.clip(salaries, 180_000, 4_500_000)
    salaries = np.round(salaries / 1000) * 1000  # round to nearest thousand

    return pd.DataFrame(
        {
            "experience_years": experience,
            "education": education,
            "job_title": job_title,
            "city": city,
            "company_size": company_size,
            "industry": industry,
            "salary_inr": salaries.astype(int),
        }
    )


def main() -> None:
    rng = np.random.default_rng(RNG_SEED)
    df = build_dataset(rng)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved {len(df)} rows to {OUTPUT_PATH}")
    print(df.describe(include="all").to_string())


if __name__ == "__main__":
    main()
