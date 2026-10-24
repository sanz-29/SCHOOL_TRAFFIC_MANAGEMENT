# GateFlow AI synthetic data

This directory contains a reproducible, entirely fictional school-gate traffic dataset. It is suitable for a hackathon prototype and must not be presented as field observations, a real school's operating conditions, legal approval, or evidence of traffic improvement.

## Contents

- `data/raw/`: the synthetic baseline school schedule, four five-minute traffic bins, and vehicle stopping examples.
- `data/processed/`: school configuration, vehicle assumptions, four candidate pickup-zone geometries, hard/soft constraints, and derived demand profile.
- `data/synthetic/`: individual vehicle demand and trip inputs, five stress scenarios, metadata, and validation report.
- `data/schemas/data_dictionary.json`: field descriptions and relationship notes.
- `backend/scenarios/school_demo/`: fictional road network specification and a SUMO configuration template.
- `results/`: schema for future actual SUMO runs; no simulator outputs are currently present.
- `scripts/`: seeded generation and automated validation.

## Generate and validate

Install the declared Python dependencies and run from the repository root:

```powershell
python -m pip install -r datas/requirements.txt
python datas/scripts/generate_synthetic_data.py --seed 42 --duration-seconds 3600 --output-directory datas
python datas/scripts/validate_synthetic_data.py --data-directory datas
```

The generator accepts `--seed`, `--duration-seconds` (at least 1200), and `--output-directory`. The default seed is 42. Generated vehicle arrivals are derived from each group's student count and configured occupancy assumptions; this does not imply one vehicle per family.

## Assumptions and limitations

All records are labeled `synthetic`; modelling inputs are labeled `assumed`. Traffic counts are synthetic calibration examples for four consecutive five-minute bins. Demand-profile uncertainty bounds are a configurable +/-20% sensitivity range, not statistical confidence intervals. Pickup capacity uses `floor(usable length / (vehicle length + spacing gap))` and is only a simplified geometric estimate. All legal statuses remain `unverified`; pedestrian and emergency-access flags require real authority review.

Five scenarios are defined: normal, 20% demand surge, longer dwell, 60% schedule compliance, and an explicitly assumed rainy-day sensitivity. Scenario definitions are reproducible, but generated vehicle files represent only the default normal scenario. The optimizer has not run, no candidate schedule or objective score is claimed, and no congestion reduction is asserted.

The SUMO road network is a fictional specification without real coordinates. `school.sumocfg` is a template and refers to network and route XML that must be generated and validated separately. SUMO has not been executed, and the results schema intentionally contains no records.
