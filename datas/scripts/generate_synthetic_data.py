#!/usr/bin/env python3
"""Generate the fictional GateFlow AI demonstration dataset."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

GENERATOR_VERSION = "1.0.0"
TIMEZONE = "Asia/Kolkata"
START = datetime(2026, 1, 15, 7, 45, tzinfo=ZoneInfo(TIMEZONE))
VEHICLE_TYPES = ["car", "two_wheeler", "van", "bus", "auto_rickshaw"]
VEHICLE_MODEL = {
    "car": {"share": 0.43, "length": 4.5, "occupancy": 2.2, "dwell": 55, "std": 18},
    "two_wheeler": {"share": 0.27, "length": 2.0, "occupancy": 1.3, "dwell": 25, "std": 9},
    "van": {"share": 0.10, "length": 6.0, "occupancy": 5.0, "dwell": 75, "std": 24},
    "bus": {"share": 0.08, "length": 12.0, "occupancy": 28.0, "dwell": 110, "std": 35},
    "auto_rickshaw": {"share": 0.12, "length": 3.0, "occupancy": 2.5, "dwell": 35, "std": 12},
}
GROUPS = [
    {"group_id": "G01", "grade_label": "Primary A", "student_count": 48, "bell": "08:05:00", "earliest": -10, "latest": 10, "max_shift": 10, "fixed": False, "bus": False, "siblings": ["G02"]},
    {"group_id": "G02", "grade_label": "Primary B", "student_count": 56, "bell": "08:10:00", "earliest": -10, "latest": 10, "max_shift": 10, "fixed": False, "bus": True, "siblings": ["G01"]},
    {"group_id": "G03", "grade_label": "Middle A", "student_count": 64, "bell": "08:15:00", "earliest": -15, "latest": 15, "max_shift": 15, "fixed": False, "bus": False, "siblings": []},
    {"group_id": "G04", "grade_label": "Middle B", "student_count": 72, "bell": "08:20:00", "earliest": -15, "latest": 15, "max_shift": 15, "fixed": False, "bus": False, "siblings": []},
    {"group_id": "G05", "grade_label": "Senior A", "student_count": 80, "bell": "08:25:00", "earliest": -10, "latest": 10, "max_shift": 10, "fixed": False, "bus": True, "siblings": ["G06"]},
    {"group_id": "G06", "grade_label": "Senior B", "student_count": 88, "bell": "08:30:00", "earliest": -10, "latest": 10, "max_shift": 10, "fixed": False, "bus": True, "siblings": ["G05"]},
]
ZONES = [
    {"zone_id": "Z01", "zone_name": "North Curb", "road_segment_id": "E_ZONE_1", "usable_length_m": 36, "allowed_vehicle_types": ["car", "two_wheeler", "auto_rickshaw"], "entry": ["07:45:00", "09:00:00"], "exit": ["07:45:00", "09:00:00"], "pedestrian": True, "emergency": False},
    {"zone_id": "Z02", "zone_name": "West Lay-by", "road_segment_id": "E_ZONE_2", "usable_length_m": 48, "allowed_vehicle_types": ["car", "van", "two_wheeler", "auto_rickshaw"], "entry": ["07:45:00", "09:00:00"], "exit": ["07:45:00", "09:00:00"], "pedestrian": False, "emergency": False},
    {"zone_id": "Z03", "zone_name": "South Curb", "road_segment_id": "E_ZONE_3", "usable_length_m": 30, "allowed_vehicle_types": ["car", "two_wheeler", "van", "auto_rickshaw"], "entry": ["07:45:00", "09:00:00"], "exit": ["07:45:00", "09:00:00"], "pedestrian": True, "emergency": False},
    {"zone_id": "Z04", "zone_name": "Bus Bay (Unverified)", "road_segment_id": "E_BUS_BAY", "usable_length_m": 42, "allowed_vehicle_types": ["bus", "van"], "entry": ["07:45:00", "09:00:00"], "exit": ["07:45:00", "09:00:00"], "pedestrian": False, "emergency": True},
]


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def iso_at(minutes: float) -> str:
    return (START + timedelta(minutes=minutes)).isoformat(timespec="seconds")


def bell_time(group: dict[str, Any]) -> datetime:
    hour, minute, second = map(int, group["bell"].split(":"))
    return START.replace(hour=hour, minute=minute, second=second)


def capacity(length_m: float, vehicle_type: str) -> int:
    spacing = 1.0 if vehicle_type == "two_wheeler" else 2.0
    if vehicle_type == "bus":
        spacing = 3.0
    model = VEHICLE_MODEL[vehicle_type]
    return math.floor(length_m / (model["length"] + spacing))


def make_schemas() -> dict[str, list[str]]:
    return {
        "school_schedule.csv": ["group_id", "student_count", "current_bell_time", "earliest_time", "latest_time", "max_shift_minutes", "fixed_time", "bus_required", "data_status"],
        "traffic_observations.csv": ["observation_id", "scenario_id", "time_bin_start", "time_bin_end", "approach_id", "vehicle_type", "vehicle_count", "weather", "disruption_flag", "disruption_description", "data_status"],
        "vehicle_mix.csv": ["scenario_id", "vehicle_type", "vehicle_share", "average_vehicle_length_m", "average_occupancy", "average_dwell_seconds", "dwell_std_seconds", "data_status"],
        "stopping_observations.csv": ["stopping_id", "vehicle_id", "vehicle_type", "arrival_time", "stop_duration_seconds", "pickup_zone_id", "approach_id", "queue_entry_time", "queue_wait_seconds", "group_id", "scenario_id", "data_status"],
        "demand_profile.csv": ["scenario_id", "time_bin_start", "time_bin_end", "approach_id", "vehicle_type", "vehicle_count", "arrival_rate_per_minute", "estimated_vehicle_share", "uncertainty_low", "uncertainty_high", "estimation_method", "data_status"],
        "synthetic_demand.csv": ["vehicle_id", "scenario_id", "group_id", "vehicle_type", "approach_id", "planned_arrival_time", "actual_arrival_time", "arrival_offset_seconds", "occupancy", "vehicle_length_m", "dwell_duration_seconds", "preferred_zone_id", "assigned_zone_id", "schedule_compliance", "data_status"],
        "synthetic_trips.csv": ["vehicle_id", "scenario_id", "vehicle_type", "departure_time_seconds", "origin_edge_id", "destination_edge_id", "route_id", "assigned_zone_id", "dwell_duration_seconds", "data_status"],
    }


def generate(output: Path, seed: int, duration_seconds: int) -> dict[str, Any]:
    rng = np.random.default_rng(seed)
    raw = output / "data" / "raw"
    processed = output / "data" / "processed"
    synthetic = output / "data" / "synthetic"
    schemas = make_schemas()
    for folder in (raw, processed, synthetic, output / "data" / "schemas", output / "backend" / "scenarios" / "school_demo", output / "results"):
        folder.mkdir(parents=True, exist_ok=True)

    groups = []
    for item in GROUPS:
        current = bell_time(item)
        groups.append({
            "group_id": item["group_id"],
            "grade_label": item["grade_label"],
            "student_count": item["student_count"],
            "current_bell_time": current.isoformat(timespec="seconds"),
            "earliest_time": (current + timedelta(minutes=item["earliest"])).isoformat(timespec="seconds"),
            "latest_time": (current + timedelta(minutes=item["latest"])).isoformat(timespec="seconds"),
            "max_shift_minutes": item["max_shift"],
            "fixed_time": item["fixed"],
            "sibling_group_ids": item["siblings"],
            "bus_required": item["bus"],
            "data_status": "synthetic",
        })
    config = {
        "school_id": "SCH_SYN_001", "school_name": "GateFlow Demonstration School",
        "data_status": "synthetic", "country": "India", "timezone": TIMEZONE,
        "gate_id": "GATE_01", "operating_period": {"start": START.isoformat(), "end": (START + timedelta(seconds=duration_seconds)).isoformat()},
        "simulation_start_time": START.isoformat(), "simulation_duration_seconds": duration_seconds,
        "simulation_step_seconds": 1, "random_seed": seed, "student_groups": groups,
        "candidate_pickup_zone_ids": [z["zone_id"] for z in ZONES],
        "road_network_id": "NET_SYN_001", "vehicle_types": VEHICLE_TYPES,
        "default_demand_scenario": "SCN_NORMAL", "dataset_version": "1.0.0",
        "assumptions": {"student_to_vehicle": "Allocate each group’s synthetic students across vehicles using the declared average occupancy; the final vehicle may be partially occupied.", "vehicle_stopping_spacing_gap_m": "2 m for road vehicles, 1 m for two-wheelers, 3 m for buses.", "times": "ISO 8601 local time with Asia/Kolkata offset."},
    }
    write_json(processed / "school_config.json", config)
    schedule = [{
        "group_id": g["group_id"], "student_count": g["student_count"],
        "current_bell_time": g["current_bell_time"], "earliest_time": g["earliest_time"],
        "latest_time": g["latest_time"], "max_shift_minutes": g["max_shift_minutes"],
        "fixed_time": g["fixed_time"], "bus_required": g["bus_required"], "data_status": "synthetic",
    } for g in groups]
    pd.DataFrame(schedule, columns=schemas["school_schedule.csv"]).to_csv(raw / "school_schedule.csv", index=False, encoding="utf-8")

    mix = [{
        "scenario_id": "SCN_NORMAL", "vehicle_type": vt, "vehicle_share": VEHICLE_MODEL[vt]["share"],
        "average_vehicle_length_m": VEHICLE_MODEL[vt]["length"], "average_occupancy": VEHICLE_MODEL[vt]["occupancy"],
        "average_dwell_seconds": VEHICLE_MODEL[vt]["dwell"], "dwell_std_seconds": VEHICLE_MODEL[vt]["std"], "data_status": "assumed",
    } for vt in VEHICLE_TYPES]
    pd.DataFrame(mix, columns=schemas["vehicle_mix.csv"]).to_csv(processed / "vehicle_mix.csv", index=False, encoding="utf-8")

    zone_records = []
    for zone in ZONES:
        zone_records.append({
            "zone_id": zone["zone_id"], "zone_name": zone["zone_name"], "road_segment_id": zone["road_segment_id"],
            "usable_length_m": zone["usable_length_m"], "allowed_vehicle_types": zone["allowed_vehicle_types"],
            "estimated_capacity_by_vehicle_type": {vt: capacity(zone["usable_length_m"], vt) for vt in zone["allowed_vehicle_types"]},
            "entry_time_window": {"start": zone["entry"][0], "end": zone["entry"][1]},
            "exit_time_window": {"start": zone["exit"][0], "end": zone["exit"][1]},
            "pedestrian_conflict_flag": zone["pedestrian"], "emergency_access_conflict_flag": zone["emergency"],
            "legal_status": "unverified", "verification_status": "not_verified",
            "capacity_method": "floor(usable_length_m / (vehicle_length_m + configured_spacing_gap_m)); simplified geometric estimate only",
            "data_status": "assumed",
        })
    write_json(processed / "pickup_zones.json", {"data_status": "assumed", "safety_notice": "Geometric estimates do not establish legal authorization, emergency access, or pedestrian safety. School-authority verification is required.", "zones": zone_records})

    constraints = []
    def add_constraint(cid: str, kind: str, category: str, group_ids: list[str], zone_ids: list[str], params: dict[str, Any], description: str, status: str = "assumed") -> None:
        constraints.append({"constraint_id": cid, "constraint_type": kind, "constraint_category": category, "affected_group_ids": group_ids, "affected_zone_ids": zone_ids, "parameters": params, "description": description, "data_status": status})
    for g in groups:
        add_constraint(f"C_TIME_{g['group_id']}", "hard", "schedule_bounds", [g["group_id"]], [], {"earliest_time": g["earliest_time"], "latest_time": g["latest_time"], "max_shift_minutes": g["max_shift_minutes"], "fixed_time": g["fixed_time"], "current_bell_time": g["current_bell_time"]}, "Bell time must remain within bounds; fixed groups cannot move.")
        if g["bus_required"]:
            add_constraint(f"C_BUS_{g['group_id']}", "hard", "bus_access", [g["group_id"]], ["Z04"], {"bus_zone_id": "Z04", "required": True}, "School buses serving this group must use the designated, unverified bus bay.")
        if g["sibling_group_ids"]:
            add_constraint(f"C_SIB_{g['group_id']}", "soft", "sibling_coordination", [g["group_id"], *g["sibling_group_ids"]], [], {"max_separation_minutes": 10}, "Keep sibling group bell times within ten minutes where feasible.")
    for zone in zone_records:
        add_constraint(f"C_ZONE_{zone['zone_id']}", "hard", "vehicle_zone_access", [], [zone["zone_id"]], {"allowed_vehicle_types": zone["allowed_vehicle_types"], "capacity_by_vehicle_type": zone["estimated_capacity_by_vehicle_type"], "prohibited_zone_assignments": []}, "Respect configured vehicle compatibility and estimated capacity; legal use remains unverified.")
    add_constraint("C_SEPARATION_G03_G04", "hard", "minimum_separation", ["G03", "G04"], [], {"minimum_separation_minutes": 5}, "Keep the configured middle groups at least five minutes apart.")
    add_constraint("C_DISRUPTION", "soft", "schedule_disruption", [g["group_id"] for g in groups], [], {"objective": "minimize sum(student_count * abs(shift_minutes))", "unit": "student-minute proxy"}, "Prefer less schedule disruption; this is not a count of affected families.")
    write_json(processed / "constraints.json", {"offset_candidates_minutes": [-15, -10, -5, 0, 5, 10, 15], "unconstrained_candidate_count": 117649, "constraints": constraints, "hard_constraints_are_never_relaxed": True})

    traffic_rows = []
    for bin_idx in range(4):
        bin_start = START + timedelta(minutes=15 + 5 * bin_idx)
        for vt in VEHICLE_TYPES:
            base = [16, 24, 29, 20][bin_idx] * VEHICLE_MODEL[vt]["share"]
            count = max(0, int(round(base * 5 + rng.normal(0, 1.5))))
            traffic_rows.append({
                "observation_id": f"OBS{bin_idx + 1:02d}_{vt.upper()}", "scenario_id": "SCN_NORMAL",
                "time_bin_start": bin_start.isoformat(timespec="seconds"),
                "time_bin_end": (bin_start + timedelta(minutes=5)).isoformat(timespec="seconds"),
                "approach_id": "APPROACH_01", "vehicle_type": vt, "vehicle_count": count,
                "weather": "clear_assumed", "disruption_flag": False, "disruption_description": "none",
                "data_status": "synthetic",
            })
    traffic_df = pd.DataFrame(traffic_rows, columns=schemas["traffic_observations.csv"])
    traffic_df.to_csv(raw / "traffic_observations.csv", index=False, encoding="utf-8")
    total_by_bin = traffic_df.groupby("time_bin_start")["vehicle_count"].sum()
    demand_rows = []
    for _, row in traffic_df.iterrows():
        total = int(total_by_bin[row["time_bin_start"]])
        rate = int(row["vehicle_count"]) / 5
        demand_rows.append({
            "scenario_id": row["scenario_id"], "time_bin_start": row["time_bin_start"],
            "time_bin_end": row["time_bin_end"], "approach_id": row["approach_id"],
            "vehicle_type": row["vehicle_type"], "vehicle_count": int(row["vehicle_count"]),
            "arrival_rate_per_minute": round(rate, 4),
            "estimated_vehicle_share": round(int(row["vehicle_count"]) / total, 6) if total else 0,
            "uncertainty_low": round(rate * 0.8, 4), "uncertainty_high": round(rate * 1.2, 4),
            "estimation_method": "five-minute synthetic count / 5; sensitivity bounds +/-20% (assumed, not confidence intervals)",
            "data_status": "synthetic",
        })
    pd.DataFrame(demand_rows, columns=schemas["demand_profile.csv"]).to_csv(processed / "demand_profile.csv", index=False, encoding="utf-8")

    # Student demand is allocated across vehicles using the configured occupancy assumptions.
    demand_rows = []
    route_rows = []
    vehicle_group: dict[str, dict[str, Any]] = {}
    vehicle_counter = 0
    for group in GROUPS:
        remain = group["student_count"]
        allowed = ["car", "two_wheeler", "van", "bus", "auto_rickshaw"]
        probs = np.array([VEHICLE_MODEL[v]["share"] for v in allowed], dtype=float)
        if not group["bus"]:
            probs[3] = 0
        probs /= probs.sum()
        while remain > 0:
            vt = str(rng.choice(allowed, p=probs))
            occupancy = max(1, min(remain, int(round(rng.normal(VEHICLE_MODEL[vt]["occupancy"], max(0.5, VEHICLE_MODEL[vt]["occupancy"] * 0.18))))))
            remain -= occupancy
            vehicle_counter += 1
            vid = f"VEH{vehicle_counter:05d}"
            zone_options = [z for z in ZONES if vt in z["allowed_vehicle_types"]]
            preferred = zone_options[0]
            selected = str(rng.choice(zone_options)["zone_id"])
            group_bell = bell_time(group)
            planned = group_bell - timedelta(minutes=8)
            compliance_probability = 0.9
            offset = int(round(rng.normal(0, 95)))
            actual = planned + timedelta(seconds=offset)
            duration = max(1, int(round(rng.normal(VEHICLE_MODEL[vt]["dwell"], VEHICLE_MODEL[vt]["std"]))))
            duration = max(1, duration)
            record = {
                "vehicle_id": vid, "scenario_id": "SCN_NORMAL", "group_id": group["group_id"], "vehicle_type": vt,
                "approach_id": "APPROACH_01", "planned_arrival_time": planned.isoformat(timespec="seconds"),
                "actual_arrival_time": actual.isoformat(timespec="seconds"), "arrival_offset_seconds": offset,
                "occupancy": occupancy, "vehicle_length_m": VEHICLE_MODEL[vt]["length"],
                "dwell_duration_seconds": duration, "preferred_zone_id": preferred["zone_id"],
                "assigned_zone_id": selected, "schedule_compliance": abs(offset) <= 180, "data_status": "synthetic",
            }
            demand_rows.append(record)
            vehicle_group[vid] = {"group": group["group_id"], "type": vt, "zone": selected, "arrival": actual, "duration": duration, "occupancy": occupancy}
            # SUMO trip inputs use seconds after configured simulation start.
            depart_seconds = max(0, int((actual - START).total_seconds()))
            route_rows.append({
                "vehicle_id": vid, "scenario_id": "SCN_NORMAL", "vehicle_type": vt,
                "departure_time_seconds": depart_seconds, "origin_edge_id": "E_APPROACH",
                "destination_edge_id": {"Z01": "E_ZONE_1", "Z02": "E_ZONE_2", "Z03": "E_ZONE_3", "Z04": "E_BUS_BAY"}[selected],
                "route_id": f"R_{selected}", "assigned_zone_id": selected, "dwell_duration_seconds": duration, "data_status": "synthetic",
            })
    demand_df = pd.DataFrame(demand_rows, columns=schemas["synthetic_demand.csv"])
    trips_df = pd.DataFrame(route_rows, columns=schemas["synthetic_trips.csv"])
    demand_df.to_csv(synthetic / "synthetic_demand.csv", index=False, encoding="utf-8")
    trips_df.to_csv(synthetic / "synthetic_trips.csv", index=False, encoding="utf-8")

    # A deterministic synthetic stopping sample from generated arrivals.
    stopping_rows = []
    for i, (vid, info) in enumerate(vehicle_group.items()):
        if i >= 120:
            break
        wait = int(rng.integers(0, 121))
        queue_entry = info["arrival"] - timedelta(seconds=wait)
        stopping_rows.append({
            "stopping_id": f"STOP{i + 1:05d}", "vehicle_id": vid, "vehicle_type": info["type"],
            "arrival_time": info["arrival"].isoformat(timespec="seconds"),
            "stop_duration_seconds": info["duration"], "pickup_zone_id": info["zone"],
            "approach_id": "APPROACH_01", "queue_entry_time": queue_entry.isoformat(timespec="seconds"),
            "queue_wait_seconds": wait, "group_id": info["group"], "scenario_id": "SCN_NORMAL", "data_status": "synthetic",
        })
    pd.DataFrame(stopping_rows, columns=schemas["stopping_observations.csv"]).to_csv(raw / "stopping_observations.csv", index=False, encoding="utf-8")

    scenarios = []
    scenario_specs = [
        ("SCN_NORMAL", "Normal demand", 1.0, 1.0, 0.90, "clear", {}, seed),
        ("SCN_SURGE20", "20% demand surge", 1.2, 1.0, 0.90, "clear", {"rounding": "round half to nearest integer per calibration-bin vehicle type", "calibration_count_transformations": []}, seed + 101),
        ("SCN_LONG_DWELL", "Longer stopping durations", 1.0, 1.5, 0.90, "clear", {"dwell_multiplier": 1.5}, seed + 202),
        ("SCN_LOW_COMPLIANCE", "Reduced schedule compliance", 1.0, 1.0, 0.60, "clear", {"noncompliant_arrival_deviation_seconds": "normal(mean=240, sd=180), clipped to simulation bounds"}, seed + 303),
        ("SCN_RAIN_ASSUMED", "Rainy-day sensitivity", 1.05, 1.25, 0.75, "rain_assumed", {"arrival_offset_std_multiplier": 1.5, "demand_change_is_assumed": True}, seed + 404),
    ]
    base_counts = traffic_df.groupby(["time_bin_start", "vehicle_type"])["vehicle_count"].sum().to_dict()
    for sid, name, demand_mult, dwell_mult, compliance, weather, overrides, scenario_seed in scenario_specs:
        if sid == "SCN_SURGE20":
            transformations = []
            for (bin_start, vt), count in base_counts.items():
                transformations.append({"time_bin_start": bin_start, "vehicle_type": vt, "baseline_count": int(count), "adjusted_count": int(math.floor(count * demand_mult + 0.5)), "rounding_method": "round half up"})
            overrides["calibration_count_transformations"] = transformations
        scenarios.append({
            "scenario_id": sid, "scenario_name": name,
            "description": f"Synthetic sensitivity scenario derived from SCN_NORMAL; {name.lower()} is not a real-world observation.",
            "base_scenario_id": None if sid == "SCN_NORMAL" else "SCN_NORMAL", "random_seed": scenario_seed,
            "demand_multiplier": demand_mult, "dwell_time_multiplier": dwell_mult,
            "compliance_probability": compliance, "weather": weather,
            "parameter_overrides": overrides, "data_status": "assumed",
        })
    write_json(synthetic / "synthetic_scenarios.json", {"scenarios": scenarios})

    network = {
        "network_id": "NET_SYN_001", "data_status": "assumed",
        "notice": "Entirely fictional topology; no real-world coordinates. SUMO network generation/execution has not been performed.",
        "nodes": [{"node_id": n, "type": t} for n, t in [("N_WEST", "boundary"), ("N_JUNCTION", "priority"), ("N_GATE", "school_gate"), ("N_EAST", "boundary"), ("N_ZONE_1", "pickup"), ("N_ZONE_2", "pickup"), ("N_ZONE_3", "pickup"), ("N_BUS", "pickup")]],
        "edges": [
            {"edge_id": "E_APPROACH", "from": "N_WEST", "to": "N_JUNCTION", "lanes": 2, "length_m": 180, "speed_limit_mps": 8.33, "direction": "inbound"},
            {"edge_id": "E_IN_1", "from": "N_JUNCTION", "to": "N_GATE", "lanes": 1, "length_m": 95, "speed_limit_mps": 5.56, "direction": "inbound"},
            {"edge_id": "E_IN_2", "from": "N_JUNCTION", "to": "N_GATE", "lanes": 1, "length_m": 110, "speed_limit_mps": 5.56, "direction": "inbound"},
            {"edge_id": "E_OUT_1", "from": "N_GATE", "to": "N_EAST", "lanes": 1, "length_m": 160, "speed_limit_mps": 8.33, "direction": "outbound"},
            {"edge_id": "E_ZONE_1", "from": "N_GATE", "to": "N_ZONE_1", "lanes": 1, "length_m": 36, "speed_limit_mps": 2.78, "direction": "pickup"},
            {"edge_id": "E_ZONE_2", "from": "N_GATE", "to": "N_ZONE_2", "lanes": 1, "length_m": 48, "speed_limit_mps": 2.78, "direction": "pickup"},
            {"edge_id": "E_ZONE_3", "from": "N_GATE", "to": "N_ZONE_3", "lanes": 1, "length_m": 30, "speed_limit_mps": 2.78, "direction": "pickup"},
            {"edge_id": "E_BUS_BAY", "from": "N_GATE", "to": "N_BUS", "lanes": 1, "length_m": 42, "speed_limit_mps": 2.78, "direction": "bus_pickup"},
            {"edge_id": "E_OUTBOUND", "from": "N_EAST", "to": "N_WEST", "lanes": 1, "length_m": 220, "speed_limit_mps": 8.33, "direction": "outbound"},
        ],
        "routes": [{"route_id": f"R_{z}", "edges": ["E_APPROACH", "E_IN_2" if z in ("Z02", "Z04") else "E_IN_1", {"Z01": "E_ZONE_1", "Z02": "E_ZONE_2", "Z03": "E_ZONE_3", "Z04": "E_BUS_BAY"}[z]]} for z in ["Z01", "Z02", "Z03", "Z04"]],
        "vehicle_types": VEHICLE_TYPES,
        "sumo_conversion_notes": ["Map node/edge IDs to SUMO XML and validate connectivity with netconvert.", "Vehicle dwell/stop behavior must be encoded in generated route or additional files before execution.", "Legal and safety validation is outside the scope of synthetic geometry."],
    }
    demo = output / "backend" / "scenarios" / "school_demo"
    write_json(demo / "network_spec.json", network)
    (demo / "school.sumocfg").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<configuration>\n'
        '    <!-- Template only: run netconvert and generate route XML before SUMO execution. -->\n'
        '    <input><net-file value="network.net.xml"/><route-files value="synthetic_trips.rou.xml"/></input>\n'
        f'    <time><begin value="0"/><end value="{duration_seconds}"/><step-length value="1"/></time>\n'
        '</configuration>\n', encoding="utf-8")
    (demo / "README.md").write_text(
        "# SUMO scenario template\n\n`network_spec.json` is a fictional network specification. "
        "`school.sumocfg` is a template and references files that must first be generated with SUMO `netconvert` and route conversion. "
        "SUMO was not detected or executed as part of this data generation; there are no simulator results.\n", encoding="utf-8")

    data_dictionary = {
        "dataset": "GateFlow AI synthetic school-gate demo",
        "records": {
            "school_config.json": "Configuration JSON; student_groups[].current_bell_time etc. are ISO 8601 with timezone; counts are students; seed is integer.",
            "pickup_zones.json": "Zone objects include length in metres, capacities in vehicles by type, time windows as local HH:MM:SS, flags boolean.",
            "constraints.json": "constraint_type is hard|soft; references group and zone IDs; parameters are JSON objects.",
            "synthetic_scenarios.json": "scenario_id unique; multipliers are dimensionless; compliance_probability is [0,1]; random_seed integer.",
            "data_dictionary.json": "Defines file field names, types, units, allowed values, nullability, and relationships.",
        },
        "files": {},
    }
    csv_units = {
        "student_count": "students", "vehicle_count": "vehicles", "occupancy": "persons/vehicle",
        "max_shift_minutes": "minutes", "arrival_offset_seconds": "seconds",
        "stop_duration_seconds": "seconds", "queue_wait_seconds": "seconds",
        "dwell_duration_seconds": "seconds", "departure_time_seconds": "seconds",
        "vehicle_length_m": "metres", "average_vehicle_length_m": "metres",
        "average_occupancy": "persons/vehicle", "average_dwell_seconds": "seconds",
        "dwell_std_seconds": "seconds", "arrival_rate_per_minute": "vehicles/minute",
        "uncertainty_low": "vehicles/minute", "uncertainty_high": "vehicles/minute",
        "vehicle_share": "proportion [0,1]", "estimated_vehicle_share": "proportion [0,1]",
    }
    timestamp_fields = {
        "current_bell_time", "earliest_time", "latest_time", "time_bin_start", "time_bin_end",
        "arrival_time", "planned_arrival_time", "actual_arrival_time", "queue_entry_time",
    }
    integer_fields = {
        "student_count", "vehicle_count", "max_shift_minutes", "arrival_offset_seconds",
        "stop_duration_seconds", "queue_wait_seconds", "dwell_duration_seconds", "departure_time_seconds",
    }
    number_fields = set(csv_units) - integer_fields - {"student_count", "vehicle_count"}
    boolean_fields = {"fixed_time", "bus_required", "disruption_flag", "schedule_compliance"}
    for filename, columns in schemas.items():
        if filename == "school_schedule.csv":
            location = raw / filename
        elif filename in ("traffic_observations.csv", "stopping_observations.csv"):
            location = raw / filename
        elif filename in ("vehicle_mix.csv", "demand_profile.csv"):
            location = processed / filename
        else:
            location = synthetic / filename
        fields = {}
        for col in columns:
            unit = csv_units.get(col, "ISO 8601 local timestamp" if col in timestamp_fields else "dimensionless")
            allowed = {"vehicle_type": VEHICLE_TYPES, "data_status": ["synthetic", "assumed"], "scenario_id": [s[0] for s in scenario_specs]}.get(col)
            relationship = {
                "group_id": "References school_config.json student_groups[].group_id.",
                "vehicle_id": "Links synthetic_demand.csv, synthetic_trips.csv, and stopping_observations.csv where present.",
                "scenario_id": "References synthetic_scenarios.json scenarios[].scenario_id.",
                "pickup_zone_id": "References pickup_zones.json zones[].zone_id.",
                "assigned_zone_id": "References pickup_zones.json zones[].zone_id.",
                "preferred_zone_id": "References pickup_zones.json zones[].zone_id.",
                "vehicle_type": "Uses the vehicle categories in school_config.json vehicle_types.",
                "data_status": "Classifies this value as synthetic or assumed.",
            }.get(col, "No foreign-key relationship.")
            fields[col] = {
                "type": "boolean" if col in boolean_fields else "integer" if col in integer_fields else "number" if col in number_fields else "string",
                "unit": unit, "allowed_values": allowed, "nullable": False, "relationship": relationship,
            }
        data_dictionary["files"][str(location.relative_to(output)).replace("\\", "/")] = fields
    json_field_sets = {
        "data/processed/school_config.json": {
            "school_id": ("string", "identifier", ["SCH_SYN_001"]),
            "school_name": ("string", "none", None), "data_status": ("string", "none", ["synthetic"]),
            "country": ("string", "none", ["India"]), "timezone": ("string", "IANA timezone", [TIMEZONE]),
            "gate_id": ("string", "identifier", None), "operating_period.start": ("string", "ISO 8601 local timestamp", None),
            "operating_period.end": ("string", "ISO 8601 local timestamp", None),
            "simulation_start_time": ("string", "ISO 8601 local timestamp", None),
            "simulation_duration_seconds": ("integer", "seconds", None), "simulation_step_seconds": ("integer", "seconds", None),
            "random_seed": ("integer", "none", None), "student_groups[]": ("array", "student groups", None),
            "student_groups[].group_id": ("string", "identifier", None), "student_groups[].grade_label": ("string", "none", None),
            "student_groups[].student_count": ("integer", "students", None),
            "student_groups[].current_bell_time": ("string", "ISO 8601 local timestamp", None),
            "student_groups[].earliest_time": ("string", "ISO 8601 local timestamp", None),
            "student_groups[].latest_time": ("string", "ISO 8601 local timestamp", None),
            "student_groups[].max_shift_minutes": ("integer", "minutes", None),
            "student_groups[].fixed_time": ("boolean", "none", None),
            "student_groups[].sibling_group_ids": ("array", "group identifiers", None),
            "student_groups[].bus_required": ("boolean", "none", None),
            "student_groups[].data_status": ("string", "none", ["synthetic"]),
            "candidate_pickup_zone_ids": ("array", "zone identifiers", None),
            "road_network_id": ("string", "identifier", None), "vehicle_types": ("array", "vehicle categories", VEHICLE_TYPES),
            "default_demand_scenario": ("string", "scenario identifier", None),
            "dataset_version": ("string", "semantic version", None),
            "assumptions": ("object", "modelling notes", None),
        },
        "data/processed/pickup_zones.json": {
            "data_status": ("string", "none", ["assumed"]), "safety_notice": ("string", "none", None),
            "zones[]": ("array", "zones", None), "zones[].zone_id": ("string", "identifier", None),
            "zones[].zone_name": ("string", "none", None), "zones[].road_segment_id": ("string", "edge identifier", None),
            "zones[].usable_length_m": ("number", "metres", None),
            "zones[].allowed_vehicle_types": ("array", "vehicle categories", VEHICLE_TYPES),
            "zones[].estimated_capacity_by_vehicle_type": ("object", "vehicles by vehicle type", None),
            "zones[].entry_time_window.start": ("string", "local time", None),
            "zones[].entry_time_window.end": ("string", "local time", None),
            "zones[].exit_time_window.start": ("string", "local time", None),
            "zones[].exit_time_window.end": ("string", "local time", None),
            "zones[].pedestrian_conflict_flag": ("boolean", "none", None),
            "zones[].emergency_access_conflict_flag": ("boolean", "none", None),
            "zones[].legal_status": ("string", "none", ["unverified"]),
            "zones[].verification_status": ("string", "none", ["not_verified"]),
            "zones[].capacity_method": ("string", "none", None), "zones[].data_status": ("string", "none", ["assumed"]),
        },
        "data/processed/constraints.json": {
            "offset_candidates_minutes": ("array", "minutes", [-15, -10, -5, 0, 5, 10, 15]),
            "unconstrained_candidate_count": ("integer", "schedule combinations", [117649]),
            "hard_constraints_are_never_relaxed": ("boolean", "none", [True]),
            "constraints[]": ("array", "constraints", None),
            "constraints[].constraint_id": ("string", "identifier", None),
            "constraints[].constraint_type": ("string", "none", ["hard", "soft"]),
            "constraints[].constraint_category": ("string", "none", None),
            "constraints[].affected_group_ids": ("array", "group identifiers", None),
            "constraints[].affected_zone_ids": ("array", "zone identifiers", None),
            "constraints[].parameters": ("object", "constraint parameters", None),
            "constraints[].description": ("string", "none", None),
            "constraints[].data_status": ("string", "none", ["assumed"]),
        },
        "data/synthetic/synthetic_scenarios.json": {
            "scenarios[]": ("array", "scenarios", None),
            "scenarios[].scenario_id": ("string", "identifier", None),
            "scenarios[].scenario_name": ("string", "none", None),
            "scenarios[].description": ("string", "none", None),
            "scenarios[].base_scenario_id": ("string|null", "scenario identifier", None),
            "scenarios[].random_seed": ("integer", "none", None),
            "scenarios[].demand_multiplier": ("number", "dimensionless", None),
            "scenarios[].dwell_time_multiplier": ("number", "dimensionless", None),
            "scenarios[].compliance_probability": ("number", "probability [0,1]", None),
            "scenarios[].weather": ("string", "none", None),
            "scenarios[].parameter_overrides": ("object", "scenario parameters", None),
            "scenarios[].data_status": ("string", "none", ["assumed"]),
        },
        "backend/scenarios/school_demo/network_spec.json": {
            "network_id": ("string", "identifier", None), "data_status": ("string", "none", ["assumed"]),
            "notice": ("string", "none", None), "nodes[]": ("array", "network nodes", None),
            "nodes[].node_id": ("string", "identifier", None), "nodes[].type": ("string", "none", None),
            "edges[]": ("array", "network edges", None), "edges[].edge_id": ("string", "identifier", None),
            "edges[].from": ("string", "node identifier", None), "edges[].to": ("string", "node identifier", None),
            "edges[].lanes": ("integer", "lanes", None), "edges[].length_m": ("number", "metres", None),
            "edges[].speed_limit_mps": ("number", "metres/second", None), "edges[].direction": ("string", "none", None),
            "routes[]": ("array", "routes", None), "routes[].route_id": ("string", "identifier", None),
            "routes[].edges": ("array", "edge identifiers", None), "vehicle_types": ("array", "vehicle categories", VEHICLE_TYPES),
            "sumo_conversion_notes": ("array", "notes", None),
        },
        "results/simulation_results_schema.json": {
            "simulation_engine": ("string", "none", ["SUMO"]),
            "simulation_status_allowed": ("array", "status values", ["not_run", "completed", "failed"]),
            "records": ("array", "actual simulator run records; empty unless executed", None),
            "fields": ("object", "run-result field names and types", None),
            "notice": ("string", "none", None),
        },
        "data/synthetic/synthetic_dataset_metadata.json": {
            "dataset_name": ("string", "none", None), "dataset_version": ("string", "semantic version", None),
            "generation_timestamp_utc": ("string", "ISO 8601 UTC timestamp", None),
            "generator_version": ("string", "semantic version", None), "random_seed": ("integer", "none", None),
            "simulation_period": ("object", "ISO 8601 local timestamps", None), "timezone": ("string", "IANA timezone", [TIMEZONE]),
            "units": ("object", "unit definitions", None), "record_counts": ("object", "records per CSV", None),
            "classifications": ("object", "synthetic and assumed data definitions", None),
            "generation_parameters": ("object", "generation assumptions", None),
            "distribution_assumptions": ("object", "vehicle and dwell assumptions", None),
            "known_limitations": ("array", "limitations", None), "reproduction_command": ("string", "command line", None),
            "validation_status": ("string", "none", ["pending", "passed", "failed"]),
            "validation_report": ("string", "relative file path", None),
            "sha256": ("object", "SHA-256 hex digests by relative file path", None),
        },
        "backend/scenarios/school_demo/school.sumocfg": {
            "configuration": ("XML element", "SUMO configuration template", None),
            "input.net-file": ("string", "relative network XML filename; generated by netconvert", None),
            "input.route-files": ("string", "relative route XML filename; requires route conversion", None),
            "time.begin": ("integer", "seconds", None), "time.end": ("integer", "seconds", None),
            "time.step-length": ("number", "seconds", None),
        },
        "data/synthetic/validation_report.json": {
            "overall_status": ("string", "none", ["PASS", "FAIL"]),
            "validation_scope": ("string", "none", None),
            "simulation_execution": ("string", "none", ["not_run"]),
            "reproducibility_test": ("string", "none", ["PASS", "FAIL"]),
            "distribution_summaries": ("object", "summary statistics", None),
            "files": ("object", "per-file records, missing values, and duplicate identifiers", None),
            "issues": ("array", "validation errors with affected records", None),
        },
    }
    data_dictionary["json_fields"] = {
        filename: {
            field: {"type": definition[0], "unit": definition[1], "allowed_values": definition[2], "nullable": definition[0].endswith("|null"), "relationship": "See the field path; identifiers link to the corresponding group, zone, scenario, node, or edge dataset where applicable."}
            for field, definition in fields.items()
        }
        for filename, fields in json_field_sets.items()
    }
    write_json(output / "data" / "schemas" / "data_dictionary.json", data_dictionary)

    result_schema = {
        "simulation_engine": "SUMO",
        "simulation_status_allowed": ["not_run", "completed", "failed"],
        "records": [],
        "fields": {
            "run_id": "string", "scenario_id": "string", "plan_id": "string", "random_seed": "integer",
            "network_version": "string", "input_data_version": "string", "simulation_engine": "string",
            "simulation_status": "not_run|completed|failed", "peak_queue_length_vehicles": "number|null",
            "mean_waiting_time_minutes": "number|null", "p95_waiting_time_minutes": "number|null",
            "total_vehicle_delay_minutes": "number|null", "spillback_duration_minutes": "number|null",
            "idling_vehicle_minutes": "number|null", "pickup_zone_capacity_violations": "integer|null",
            "completed_vehicle_count": "integer|null", "unfinished_vehicle_count": "integer|null",
        },
        "notice": "No SUMO simulation was executed. Null metrics are intentionally absent rather than fabricated.",
    }
    write_json(output / "results" / "simulation_results_schema.json", result_schema)
    (output / "results" / "README.md").write_text(
        "# Simulation results\n\nNo SUMO run has been executed. `simulation_results_schema.json` defines the output contract; "
        "the empty `records` list is intentional. Do not interpret synthetic demand inputs as simulation outputs.\n", encoding="utf-8")

    file_counts = {}
    for filename in schemas:
        if filename == "school_schedule.csv" or filename in ("traffic_observations.csv", "stopping_observations.csv"):
            path = raw / filename
        elif filename in ("vehicle_mix.csv", "demand_profile.csv"):
            path = processed / filename
        else:
            path = synthetic / filename
        file_counts[str(path.relative_to(output)).replace("\\", "/")] = int(len(pd.read_csv(path)))
    hash_paths = [
        p for p in output.rglob("*")
        if p.is_file()
        and p.name not in ("synthetic_dataset_metadata.json", "validation_report.json")
        and p.suffix != ".pyc"
        and "__pycache__" not in p.parts
    ]
    hashes = {str(p.relative_to(output)).replace("\\", "/"): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(hash_paths)}
    metadata = {
        "dataset_name": "GateFlow AI synthetic school-gate traffic demo", "dataset_version": "1.0.0",
        "generation_timestamp_utc": datetime.now(tz=ZoneInfo("UTC")).isoformat(timespec="seconds"),
        "generator_version": GENERATOR_VERSION, "random_seed": seed, "simulation_period": config["operating_period"],
        "timezone": TIMEZONE, "units": {"time": "seconds/minutes", "distance": "metres", "counts": "vehicles/students"},
        "record_counts": file_counts, "classifications": {"synthetic": "Generated fictional records, not measured observations.", "assumed": "Configurable modelling inputs, not validated facts."},
        "generation_parameters": {"simulation_duration_seconds": duration_seconds, "calibration_bin_minutes": 5, "calibration_bins": 4, "stopping_sample_target": 120, "occupancy_model": "Normal around configured type mean; rounded, minimum 1 and capped at remaining group students.", "schedule_arrival_model": "Normal offset mean 0 seconds, standard deviation 95 seconds; planned arrival 8 minutes before group bell.", "uncertainty_sensitivity_range": "+/-20%, assumed and not statistical confidence.", "zone_spacing_gap_m": {"two_wheeler": 1, "other": 2, "bus": 3}},
        "distribution_assumptions": {"vehicle_shares": {vt: VEHICLE_MODEL[vt]["share"] for vt in VEHICLE_TYPES}, "dwell_seconds": {vt: {"mean": VEHICLE_MODEL[vt]["dwell"], "std": VEHICLE_MODEL[vt]["std"], "normal_clipped_minimum": 1} for vt in VEHICLE_TYPES}},
        "known_limitations": ["Entirely synthetic demonstration data; no field observations.", "Fictional school and road topology; no real coordinates.", "Zone legal status and safety are unverified.", "No schedule optimizer has run; no candidate schedules or scores are asserted.", "No SUMO network conversion or simulation has been run.", "Calibration bins are generated examples, not measured calibration."],
        "reproduction_command": "python datas/scripts/generate_synthetic_data.py --seed 42 --duration-seconds 3600 --output-directory datas",
        "validation_status": "pending", "validation_report": "data/synthetic/validation_report.json",
        "sha256": hashes,
    }
    write_json(synthetic / "synthetic_dataset_metadata.json", metadata)
    return metadata


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--duration-seconds", type=int, default=3600)
    parser.add_argument("--output-directory", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    if args.duration_seconds < 1200:
        parser.error("--duration-seconds must be at least 1200 to cover calibration bins")
    metadata = generate(args.output_directory.resolve(), args.seed, args.duration_seconds)
    print(f"Generated {len(metadata['record_counts'])} tabular datasets under {args.output_directory.resolve()}")
    print(f"Vehicle demand rows: {metadata['record_counts']['data/synthetic/synthetic_demand.csv']}")
    print(f"Stopping records: {metadata['record_counts']['data/raw/stopping_observations.csv']}")


if __name__ == "__main__":
    main()
