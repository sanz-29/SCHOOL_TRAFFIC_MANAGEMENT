#!/usr/bin/env python3
"""Validate GateFlow synthetic data schemas and cross-file consistency."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import tempfile
import sys
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
sys.dont_write_bytecode = True
from generate_synthetic_data import generate

VEHICLE_TYPES = {"car", "two_wheeler", "van", "bus", "auto_rickshaw"}
EXPECTED_COLUMNS = {
    "data/raw/school_schedule.csv": {"group_id", "student_count", "current_bell_time", "earliest_time", "latest_time", "max_shift_minutes", "fixed_time", "bus_required", "data_status"},
    "data/raw/traffic_observations.csv": {"observation_id", "scenario_id", "time_bin_start", "time_bin_end", "approach_id", "vehicle_type", "vehicle_count", "weather", "disruption_flag", "disruption_description", "data_status"},
    "data/raw/stopping_observations.csv": {"stopping_id", "vehicle_id", "vehicle_type", "arrival_time", "stop_duration_seconds", "pickup_zone_id", "approach_id", "queue_entry_time", "queue_wait_seconds", "group_id", "scenario_id", "data_status"},
    "data/processed/vehicle_mix.csv": {"scenario_id", "vehicle_type", "vehicle_share", "average_vehicle_length_m", "average_occupancy", "average_dwell_seconds", "dwell_std_seconds", "data_status"},
    "data/processed/demand_profile.csv": {"scenario_id", "time_bin_start", "time_bin_end", "approach_id", "vehicle_type", "vehicle_count", "arrival_rate_per_minute", "estimated_vehicle_share", "uncertainty_low", "uncertainty_high", "estimation_method", "data_status"},
    "data/synthetic/synthetic_demand.csv": {"vehicle_id", "scenario_id", "group_id", "vehicle_type", "approach_id", "planned_arrival_time", "actual_arrival_time", "arrival_offset_seconds", "occupancy", "vehicle_length_m", "dwell_duration_seconds", "preferred_zone_id", "assigned_zone_id", "schedule_compliance", "data_status"},
    "data/synthetic/synthetic_trips.csv": {"vehicle_id", "scenario_id", "vehicle_type", "departure_time_seconds", "origin_edge_id", "destination_edge_id", "route_id", "assigned_zone_id", "dwell_duration_seconds", "data_status"},
}


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-directory", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.data_directory.resolve()
    errors: list[str] = []
    file_stats: dict[str, Any] = {}
    frames: dict[str, pd.DataFrame] = {}
    required_json = [
        "data/processed/school_config.json", "data/processed/pickup_zones.json",
        "data/processed/constraints.json", "data/synthetic/synthetic_scenarios.json",
        "data/synthetic/synthetic_dataset_metadata.json", "data/schemas/data_dictionary.json",
        "backend/scenarios/school_demo/network_spec.json", "backend/scenarios/school_demo/school.sumocfg",
        "backend/scenarios/school_demo/README.md", "results/simulation_results_schema.json",
        "results/README.md",
    ]
    for rel in list(EXPECTED_COLUMNS) + required_json:
        path = root / rel
        if not path.is_file():
            errors.append(f"Missing required file: {rel}")
            continue
        if rel in EXPECTED_COLUMNS:
            df = pd.read_csv(path)
            frames[rel] = df
            missing_columns = EXPECTED_COLUMNS[rel] - set(df.columns)
            if missing_columns:
                errors.append(f"{rel}: missing columns {sorted(missing_columns)}")
            status_cols = [c for c in ("data_status",) if c in df]
            for col in status_cols:
                if not df[col].isin(["synthetic", "assumed"]).all():
                    errors.append(f"{rel}: invalid or missing data_status values")
            file_stats[rel] = {"records": len(df), "missing_values": int(df.isna().sum().sum()), "duplicate_identifiers": {}}
            unique_keys = {
                "data/raw/school_schedule.csv": ("group_id",),
                "data/raw/traffic_observations.csv": ("observation_id",),
                "data/raw/stopping_observations.csv": ("stopping_id",),
                "data/synthetic/synthetic_demand.csv": ("vehicle_id",),
                "data/synthetic/synthetic_trips.csv": ("vehicle_id",),
            }.get(rel, ())
            for key in unique_keys:
                if key in df.columns:
                    duplicates = int(df[key].duplicated().sum())
                    file_stats[rel]["duplicate_identifiers"][key] = duplicates
                    if duplicates:
                        errors.append(f"{rel}: {duplicates} duplicate {key} values")
        else:
            try:
                if path.suffix == ".json":
                    load_json(path)
            except (json.JSONDecodeError, OSError) as exc:
                errors.append(f"{rel}: invalid JSON or unreadable file: {exc}")

    if errors:
        report = {"overall_status": "FAIL", "issues": errors, "files": file_stats}
        report_path = root / "data" / "synthetic" / "validation_report.json"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        metadata_path = root / "data" / "synthetic" / "synthetic_dataset_metadata.json"
        if metadata_path.is_file():
            metadata = load_json(metadata_path)
            metadata["validation_status"] = "failed"
            metadata_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps(report, indent=2))
        sys.exit(1)

    config = load_json(root / "data/processed/school_config.json")
    zone_doc = load_json(root / "data/processed/pickup_zones.json")
    constraints_doc = load_json(root / "data/processed/constraints.json")
    scenarios_doc = load_json(root / "data/synthetic/synthetic_scenarios.json")
    network = load_json(root / "backend/scenarios/school_demo/network_spec.json")
    results_schema = load_json(root / "results/simulation_results_schema.json")
    schedule = frames["data/raw/school_schedule.csv"]
    traffic = frames["data/raw/traffic_observations.csv"]
    mix = frames["data/processed/vehicle_mix.csv"]
    demand_profile = frames["data/processed/demand_profile.csv"]
    stops = frames["data/raw/stopping_observations.csv"]
    demand = frames["data/synthetic/synthetic_demand.csv"]
    trips = frames["data/synthetic/synthetic_trips.csv"]
    forbidden_columns = {"student_name", "parent_name", "phone", "phone_number", "address", "vehicle_registration", "face_image"}
    for rel, frame in frames.items():
        if forbidden_columns.intersection(str(col).lower() for col in frame.columns):
            errors.append(f"{rel}: personally identifying fields are not permitted")
    group_ids = set(schedule["group_id"])
    zone_map = {z["zone_id"]: z for z in zone_doc["zones"]}
    scenario_ids = {s["scenario_id"] for s in scenarios_doc["scenarios"]}
    edges = {edge["edge_id"] for edge in network["edges"]}
    node_ids = {node["node_id"] for node in network["nodes"]}
    routes = {r["route_id"]: r for r in network["routes"]}

    if len(group_ids) != 6 or len(config["student_groups"]) != 6:
        errors.append("Default configuration must contain exactly six unique groups")
    if len(zone_map) != 4:
        errors.append(f"Expected four pickup zones, found {len(zone_map)}")
    if not set(config["candidate_pickup_zone_ids"]).issubset(zone_map):
        errors.append("School configuration references unknown pickup zone IDs")
    for edge in network["edges"]:
        if edge["from"] not in node_ids or edge["to"] not in node_ids:
            errors.append(f"Network edge {edge['edge_id']} references an unknown node")
    for zone in zone_doc["zones"]:
        if zone["road_segment_id"] not in edges:
            errors.append(f"Zone {zone['zone_id']} references unknown road segment {zone['road_segment_id']}")
        elif not any(route["edges"][-1] == zone["road_segment_id"] for route in network["routes"]):
            errors.append(f"Zone {zone['zone_id']} has no route ending at its road segment")

    schedule_times = {r["group_id"]: r for r in schedule.to_dict("records")}
    for row in schedule.to_dict("records"):
        current, earliest, latest = (pd.Timestamp(row[k]) for k in ("current_bell_time", "earliest_time", "latest_time"))
        if not earliest <= current <= latest:
            errors.append(f"Schedule group {row['group_id']} current time lies outside bounds")
        if int(row["max_shift_minutes"]) not in (10, 15):
            errors.append(f"Schedule group {row['group_id']} has invalid max shift")
        if row["fixed_time"] and earliest != latest:
            errors.append(f"Fixed group {row['group_id']} must have identical bounds")

    constraint_ids = {c["constraint_id"] for c in constraints_doc["constraints"]}
    for group in config["student_groups"]:
        if group["group_id"] not in group_ids:
            errors.append(f"Configured group {group['group_id']} is missing from the existing schedule")
        if f"C_TIME_{group['group_id']}" not in constraint_ids:
            errors.append(f"Group {group['group_id']} has no schedule-bound constraint")
        if group["bus_required"] and f"C_BUS_{group['group_id']}" not in constraint_ids:
            errors.append(f"Bus-required group {group['group_id']} has no bus access constraint")
        if group["sibling_group_ids"] and f"C_SIB_{group['group_id']}" not in constraint_ids:
            errors.append(f"Sibling group {group['group_id']} has no coordination constraint")
    if not any(c["constraint_id"] == "C_SEPARATION_G03_G04" and c["constraint_type"] == "hard" for c in constraints_doc["constraints"]):
        errors.append("Configured minimum group separation hard constraint is missing")

    bin_groups = traffic.groupby("time_bin_start")
    if len(bin_groups) != 4:
        errors.append(f"Expected four calibration bins; found {len(bin_groups)}")
    starts = sorted(pd.to_datetime(traffic["time_bin_start"]).unique())
    if len(starts) == 4 and any((starts[i + 1] - starts[i]).total_seconds() != 300 for i in range(3)):
        errors.append("Calibration bins are not consecutive five-minute intervals")
    for start, group in bin_groups:
        if set(group["vehicle_type"]) != VEHICLE_TYPES or len(group) != len(VEHICLE_TYPES):
            errors.append(f"Calibration bin {start} does not contain exactly one record per vehicle type")
        ends = pd.to_datetime(group["time_bin_end"]).unique()
        if len(ends) != 1 or (pd.Timestamp(ends[0]) - pd.Timestamp(start)).total_seconds() != 300:
            errors.append(f"Calibration bin {start} is not five minutes long")
    if (traffic["vehicle_count"] < 0).any() or not np.equal(traffic["vehicle_count"] % 1, 0).all():
        errors.append("Traffic counts must be nonnegative integers")
    if traffic.groupby("time_bin_start")["vehicle_count"].sum().nunique() < 2:
        errors.append("Calibration demand has no time-varying fluctuation")
    share_sum = mix.groupby("scenario_id")["vehicle_share"].sum()
    if not np.allclose(share_sum.to_numpy(), 1.0, atol=1e-9):
        errors.append(f"Vehicle shares must sum to 1 per scenario: {share_sum.to_dict()}")
    if ((mix[["average_vehicle_length_m", "average_occupancy", "average_dwell_seconds"]] <= 0).any().any() or (mix["dwell_std_seconds"] < 0).any()):
        errors.append("Vehicle dimensions, occupancy, dwell means must be positive; dwell std nonnegative")

    for row in zone_doc["zones"]:
        for vt in row["allowed_vehicle_types"]:
            spacing = 1 if vt == "two_wheeler" else 3 if vt == "bus" else 2
            model = mix[mix["vehicle_type"] == vt].iloc[0]
            expected = math.floor(row["usable_length_m"] / (model["average_vehicle_length_m"] + spacing))
            if row["estimated_capacity_by_vehicle_type"].get(vt) != expected:
                errors.append(f"Zone {row['zone_id']} capacity for {vt} does not match formula")
        if row["legal_status"] != "unverified":
            errors.append(f"Zone {row['zone_id']} must remain unverified absent authorization")

    if len(stops) < 50:
        errors.append(f"At least 50 stopping records required; found {len(stops)}")
    if (stops["stop_duration_seconds"] <= 0).any() or (stops["queue_wait_seconds"] < 0).any():
        errors.append("Stopping durations must be positive and queue waits nonnegative")
    if not set(stops["vehicle_id"]).issubset(set(demand["vehicle_id"])):
        errors.append("Stopping observations reference vehicle IDs missing from synthetic demand")
    if not set(stops["group_id"]).issubset(group_ids) or not set(stops["pickup_zone_id"]).issubset(zone_map):
        errors.append("Stopping observations reference unknown groups or pickup zones")
    for row in demand.to_dict("records"):
        if row["group_id"] not in group_ids or row["scenario_id"] not in scenario_ids:
            errors.append(f"Vehicle {row['vehicle_id']} references an unknown group or scenario")
        zone = zone_map.get(row["assigned_zone_id"])
        if zone is None or row["vehicle_type"] not in zone["allowed_vehicle_types"]:
            errors.append(f"Vehicle {row['vehicle_id']} assigned to incompatible/unknown zone {row['assigned_zone_id']}")
        if row["occupancy"] <= 0 or row["vehicle_length_m"] <= 0 or row["dwell_duration_seconds"] <= 0:
            errors.append(f"Vehicle {row['vehicle_id']} has invalid occupancy, length, or dwell")
        if not pd.Timestamp(config["operating_period"]["start"]) <= pd.Timestamp(row["actual_arrival_time"]) <= pd.Timestamp(config["operating_period"]["end"]):
            errors.append(f"Vehicle {row['vehicle_id']} arrival falls outside the simulation period")
        expected_offset = int((pd.Timestamp(row["actual_arrival_time"]) - pd.Timestamp(row["planned_arrival_time"])).total_seconds())
        if expected_offset != int(row["arrival_offset_seconds"]):
            errors.append(f"Vehicle {row['vehicle_id']} arrival offset is inconsistent")
        if row["data_status"] != "synthetic":
            errors.append(f"Vehicle {row['vehicle_id']} lacks synthetic status")
    if len(set(demand["vehicle_id"])) != len(demand):
        errors.append("Synthetic demand vehicle IDs are not unique")
    if set(trips["vehicle_id"]) != set(demand["vehicle_id"]):
        errors.append("Trip inputs and synthetic demand vehicle IDs do not match")
    for row in trips.to_dict("records"):
        if row["origin_edge_id"] not in edges or row["destination_edge_id"] not in edges or row["route_id"] not in routes:
            errors.append(f"Trip {row['vehicle_id']} references unknown route/edge")
        elif row["destination_edge_id"] not in routes[row["route_id"]]["edges"]:
            errors.append(f"Trip {row['vehicle_id']} destination does not match route {row['route_id']}")
        if row["vehicle_type"] not in VEHICLE_TYPES or row["scenario_id"] not in scenario_ids:
            errors.append(f"Trip {row['vehicle_id']} references an invalid type/scenario")
        if row["vehicle_type"] == "bus":
            demand_group = demand.loc[demand["vehicle_id"] == row["vehicle_id"], "group_id"]
            if demand_group.empty or not bool(schedule_times[demand_group.iloc[0]]["bus_required"]) or row["assigned_zone_id"] != "Z04":
                errors.append(f"Bus trip {row['vehicle_id']} is not tied to a bus-required group and designated bay")
        if int(row["departure_time_seconds"]) < 0 or int(row["departure_time_seconds"]) > config["simulation_duration_seconds"]:
            errors.append(f"Trip {row['vehicle_id']} departure is outside the simulation period")
    occupancy_by_group = demand.groupby("group_id")["occupancy"].sum().to_dict()
    student_counts = schedule.set_index("group_id")["student_count"].to_dict()
    if occupancy_by_group != student_counts:
        errors.append(f"Demand occupancy does not reconcile to group student counts: {occupancy_by_group}")

    if not {"SCN_NORMAL", "SCN_SURGE20", "SCN_LONG_DWELL", "SCN_LOW_COMPLIANCE", "SCN_RAIN_ASSUMED"}.issubset(scenario_ids):
        errors.append("Required normal, surge, long-dwell, low-compliance, rainy-day scenarios are missing")
    surge = next((s for s in scenarios_doc["scenarios"] if s["scenario_id"] == "SCN_SURGE20"), {})
    transforms = surge.get("parameter_overrides", {}).get("calibration_count_transformations", [])
    if not transforms or any(t["adjusted_count"] != math.floor(t["baseline_count"] * 1.2 + 0.5) for t in transforms):
        errors.append("Demand-surge transformations are not traceable to the 20% baseline adjustment")
    if next((s for s in scenarios_doc["scenarios"] if s["scenario_id"] == "SCN_LOW_COMPLIANCE"), {}).get("compliance_probability") != 0.6:
        errors.append("Reduced-compliance scenario must target 60% and document deviations")
    scenario_seeds = [s["random_seed"] for s in scenarios_doc["scenarios"]]
    if len(scenario_seeds) != len(set(scenario_seeds)):
        errors.append("Each scenario must use a distinct deterministic random seed")
    if results_schema.get("records") or results_schema.get("simulation_status_allowed") != ["not_run", "completed", "failed"]:
        errors.append("Simulator output must remain empty unless SUMO was executed")

    # Regenerate to a temporary directory and compare all deterministic outputs.
    seed = int(config["random_seed"])
    reproducibility = True
    deterministic_files = [
        "data/raw/school_schedule.csv", "data/raw/traffic_observations.csv",
        "data/raw/stopping_observations.csv", "data/processed/school_config.json",
        "data/processed/vehicle_mix.csv", "data/processed/pickup_zones.json",
        "data/processed/constraints.json", "data/processed/demand_profile.csv",
        "data/synthetic/synthetic_demand.csv", "data/synthetic/synthetic_trips.csv",
        "data/synthetic/synthetic_scenarios.json", "data/schemas/data_dictionary.json",
        "backend/scenarios/school_demo/network_spec.json",
        "backend/scenarios/school_demo/school.sumocfg",
        "results/simulation_results_schema.json",
    ]
    with tempfile.TemporaryDirectory(prefix="gateflow-repro-") as temp_dir:
        temp_root = Path(temp_dir)
        generate(temp_root, seed, int(config["simulation_duration_seconds"]))
        for rel in deterministic_files:
            actual_path = root / rel
            regenerated_path = temp_root / rel
            if not actual_path.is_file() or not regenerated_path.is_file() or hashlib.sha256(actual_path.read_bytes()).digest() != hashlib.sha256(regenerated_path.read_bytes()).digest():
                reproducibility = False
                errors.append(f"Reproducibility mismatch for {rel}")
    if not reproducibility:
        errors.append("Seeded random-number generator reproducibility check failed")

    report = {
        "overall_status": "PASS" if not errors else "FAIL",
        "validation_scope": "schemas, synthetic status, relationships, timing, capacities, scenarios, and deterministic RNG",
        "simulation_execution": "not_run; results intentionally contain no actual simulator metrics",
        "reproducibility_test": "PASS" if reproducibility else "FAIL",
        "distribution_summaries": {
            "group_count": len(schedule), "vehicle_count": len(demand),
            "stopping_records": len(stops), "traffic_count_by_bin": traffic.groupby("time_bin_start")["vehicle_count"].sum().to_dict(),
            "vehicle_mix_share_sums": share_sum.to_dict(), "dwell_seconds_min": int(demand["dwell_duration_seconds"].min()),
            "dwell_seconds_max": int(demand["dwell_duration_seconds"].max()),
        },
        "files": file_stats, "issues": errors,
    }
    report_path = root / "data" / "synthetic" / "validation_report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, default=str) + "\n", encoding="utf-8")
    metadata_path = root / "data" / "synthetic" / "synthetic_dataset_metadata.json"
    metadata = load_json(metadata_path)
    metadata["validation_status"] = "passed" if not errors else "failed"
    metadata_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, default=str))
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
