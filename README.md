# Investment Simulator

A web-based investment simulator built with Python, Flask, vanilla JavaScript, HTML and CSS.

It supports both recurring investments (PAC / DCA) and lump-sum investments, with interactive timeline charts, tax presets, inflation-adjusted values, optional agency costs, and a financial summary.

## Features

- Recurring investment and lump-sum modes
- Interactive investment growth chart
- Vertical timeline cursor with values at any point in time
- Relative (`+20y`) and calendar-year (`2046`) timeline labels
- Tax presets and custom tax rate
- Inflation-adjusted purchasing power
- Optional agency / exit costs
- Summary of taxes, inflation impact, and combined value erosion
- Responsive dark dashboard UI
- Educational financial disclaimer

## Tech stack

- Python
- Flask
- Vanilla JavaScript
- HTML5
- CSS3

## Run locally

Create and activate a virtual environment, then install the dependencies:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

macOS / Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

Then open:

```text
http://127.0.0.1:5000
```

## Disclaimer

This project is for educational and illustrative purposes only. It does not provide financial, tax, investment, or legal advice. Tax rules, fees, inflation, returns, and investment outcomes can vary by jurisdiction, instrument, investor profile, and time period.
