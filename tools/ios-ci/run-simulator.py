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


def retry_on_startup(*args, timeout=65, attempts=6):
    for attempt in range(attempts):
        try:
            return sim(*args, capture=False, timeout=timeout)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
            if attempt == attempts-1:
                raise
            print(type(error).__name__, args[0], "while Simulator initializes; retry", attempt+1, flush=True)
            time.sleep(8)


def run_case(device_type, key, runtime):
    configured = json.loads(sim("list", "devices", "available", "-j"))["devices"].get(runtime, [])
    device = next((entry for entry in configured if entry.get("deviceTypeIdentifier") == device_type), None)
    udid = device["udid"] if device else sim("create", "PM-" + key, device_type, runtime).strip()
    case = evidence / key
    case.mkdir(exist_ok=True)
    try:
        if not device or device.get("state") != "Booted":
            sim("boot", udid, capture=False, timeout=75)
        # SpringBoard and direct app commands can be ready while bootstatus still
        # waits for optional system-app migration on hosted Intel runners.
        retry_on_startup("install", udid, app, timeout=220, attempts=3)
        data = Path(sim("get_app_container", udid, bundle, "data").strip())
        retry_on_startup("launch", udid, bundle)
        done = set()
        dimensions = {}
        deadline = time.monotonic() + 510
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
runtime_version = "18.6"
ios = [row for row in runtimes if row["isAvailable"] and ".iOS-" in row["identifier"] and row["version"] == runtime_version]
assert ios, "Required iOS Simulator runtime unavailable: " + runtime_version
runtime = ios[0]["identifier"]

# Reuse the compiled simulator-only probe. Capturing a large Simulator screen
# on a hosted Intel runner can take longer than the probe's normal UI timeout.
bundles = [file for file in app.rglob("index.js")
           if file.as_posix().endswith("/assets/main/index.js")]
assert len(bundles) == 1, "Expected a single Simulator game bundle"
bundle_script = bundles[0].read_text()
marker = r'(["\']Screenshot timeout: ["\']\s*\+\s*[\w$]+)\)'
patched, count = re.subn(marker, r'\1,150000)', bundle_script)
assert count == 1, "Unexpected compiled Simulator screenshot marker"
bundles[0].write_text(patched)

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
