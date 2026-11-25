"""Boot the requested iOS devices and capture actual native Cocos frames."""
import json
from pathlib import Path
import re
import struct
import subprocess
import sys
import time

app = Path(sys.argv[1]).resolve()
evidence = Path(sys.argv[2]).resolve()
evidence.mkdir(parents=True, exist_ok=True)
bundle = "com.dice.pet.rpg"


def sim(*args, capture=True, timeout=120):
    return subprocess.run(["xcrun", "simctl", *map(str, args)], check=True, text=True,
                          stdout=subprocess.PIPE if capture else None, timeout=timeout).stdout


def check_png(file):
    content = file.read_bytes()
    assert content.startswith(b"\x89PNG\r\n\x1a\n"), f"Missing screenshot: {file}"
    assert len(content) > 12000, f"Blank screenshot: {file}"
    return struct.unpack(">II", content[16:24])


def run_case(device_type, key, runtime):
    configured = json.loads(sim("list", "devices", "available", "-j"))["devices"].get(runtime, [])
    device = next((entry for entry in configured if entry.get("deviceTypeIdentifier") == device_type), None)
    udid = device["udid"] if device else sim("create", "PM-" + key, device_type, runtime).strip()
    case = evidence / key
    case.mkdir(exist_ok=True)
    try:
        sim("bootstatus", udid, "-b", capture=False, timeout=430)
        sim("install", udid, app, capture=False, timeout=150)
        data = Path(sim("get_app_container", udid, bundle, "data").strip())
        sim("launch", udid, bundle, capture=False)
        done = set()
        dimensions = {}
        deadline = time.monotonic() + 210
        report = case / "result.json"
        while time.monotonic() < deadline:
            files = list(data.rglob("pm-simulator-state.json"))
            if files:
                try:
                    status = json.loads(files[0].read_text())
                except (OSError, ValueError):
                    time.sleep(.25)
                    continue
                report.write_text(json.dumps(status, indent=2)+"\n")
                stage = status["stage"]
                if stage == "failed":
                    raise AssertionError(status)
                if stage == "complete":
                    assert status["ok"] and len(done) == 8, (status, done)
                    status["screenshots"] = dimensions
                    status["device"] = device_type
                    status["runtime"] = runtime
                    report.write_text(json.dumps(status, indent=2)+"\n")
                    print(key, "PASS", flush=True)
                    return
                if stage not in done:
                    file = case / (stage + ".png")
                    sim("io", udid, "screenshot", file, capture=False)
                    dimensions[stage] = check_png(file)
                    (files[0].parent / "pm-simulator-ack.txt").write_text(stage)
                    done.add(stage)
            time.sleep(.25)
        raise TimeoutError("No complete report for "+key)
    finally:
        try:
            sim("io", udid, "screenshot", case / "last-frame.png", capture=False, timeout=40)
            log = sim("spawn", udid, "log", "show", "--last", "4m", "--style", "compact",
                      "--predicate", 'process CONTAINS "DicePet"', timeout=40)
            (case / "runtime.log").write_text(log)
        except Exception as error:
            print(error, flush=True)
        try:
            sim("shutdown", udid, capture=False, timeout=30)
        except Exception as error:
            print(error, flush=True)


runtimes = json.loads(sim("list", "runtimes", "-j"))["runtimes"]
sdk = subprocess.check_output(["xcrun","--sdk","iphonesimulator","--show-sdk-version"],text=True).strip()
ios = [row for row in runtimes if row["isAvailable"] and ".iOS-" in row["identifier"] and row["version"] == sdk]
assert ios, "No installed iOS runtime for the selected Xcode SDK " + sdk
runtime = ios[0]["identifier"]
devices = [
    ("com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation", "small-se"),
    ("com.apple.CoreSimulator.SimDeviceType.iPhone-16", "island-16"),
    ("com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro-Max", "large-16-pro-max"),
]
errors = []
cases = [(device,key) for device,key in devices if len(sys.argv) < 4 or key == sys.argv[3]]
assert cases, "Unknown Simulator profile"
for device, key in cases:
    try:
        run_case(device, key, runtime)
    except Exception as error:
        errors.append(f"{key}: {error}")
        print(errors[-1], flush=True)
assert not errors, errors
