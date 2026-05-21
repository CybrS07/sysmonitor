import os
import psutil
import GPUtil
import time
import firebase_admin
import platform
import subprocess
import socket
from firebase_admin import credentials, db

# 1. AUTO-DETECT FILE PATHS
# This ensures it finds the json file regardless of where you start the terminal
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(
    BASE_DIR, "  "
)  # add secret key.jon from services link here in " " from firebase

# FIREBASE INITIALIZATION
if not os.path.exists(JSON_PATH):
    print(f"❌ ERROR: File '{JSON_PATH}' not found. Place it in this folder.")
    exit()

cred = credentials.Certificate(JSON_PATH)
firebase_admin.initialize_app(
    cred,
    {"databaseURL": " "},  # live database link from my firebase
)
ref = db.reference("/live_stats")


def get_sys_model():
    """Universal logic to find the specific Laptop/PC Model name."""
    try:
        if platform.system() == "Linux":
            # Direct look at BIOS files on Linux
            with open("/sys/class/dmi/id/product_name", "r") as f:
                return f.read().strip()
        elif platform.system() == "Windows":
            return (
                subprocess.check_output("wmic csproduct get name", shell=True)
                .decode()
                .split("\n")[1]
                .strip()
            )
    except:
        return f"{platform.machine()} PC"


def get_cpu_temperatures(count):
    """Dynamic Temperature Scanner. Handles different OS sensor labels."""
    temps = []
    try:
        t_dict = psutil.sensors_temperatures()
        # Find any sensor cluster labeled 'coretemp' or 'cpu_thermal'
        found = t_dict.get("coretemp", t_dict.get("cpu_thermal", []))
        temps = [t.current for t in found]
    except:
        pass

    # Pad or slice to match current CPU core count
    if not temps:
        return [40.0] * count  # Default safe display
    while len(temps) < count:
        temps.append(sum(temps) / len(temps))  # Average padding
    return temps[:count]


def fetch_live_data():
    # 1. CPU INVESTIGATION
    # Fetches real core counts and usages per thread
    cpu_usages = psutil.cpu_percent(percpu=True)
    num_cores = len(cpu_usages)

    # 2. MEMORY INVESTIGATION
    mem = psutil.virtual_memory()
    swp = psutil.swap_memory()

    # 3. GPU INVESTIGATION (NVIDIA Multi-GPU support)
    found_gpus = []
    try:
        gpus = GPUtil.getGPUs()
        for g in gpus:
            found_gpus.append(
                {"name": g.name, "load": g.load * 100, "temp": g.temperature}
            )
    except:
        pass

    # 4. NETWORK VELOCITY (Rate Delta)
    # Grab initial snap, wait 1 second, grab again
    net_prev = psutil.net_io_counters()
    time.sleep(1)
    net_now = psutil.net_io_counters()

    # 5. ENVIRONMENT SENSORS (Uptime, Battery, OS)
    battery = psutil.sensors_battery()
    boot_time = psutil.boot_time()
    uptime_sec = time.time() - boot_time

    # --- CONSTRUCT PAYLOAD ---
    # This keyset perfectly matches your React Native dashboard keys
    return {
        "sensors": {
            "os_name": f"{platform.system()} {platform.release()}",
            "kernel": platform.version(),
            "plasma": "6.6 (Adaptive)",  # KDE Plasma Mock version for the UI
            "ip": socket.gethostbyname(socket.gethostname()),
            "model": get_sys_model(),
        },
        "performance": {
            "cpu_total": psutil.cpu_percent(),
            "cpu_usages": cpu_usages,
            "cpu_temps": get_cpu_temperatures(num_cores),
        },
        "gpus": (
            found_gpus
            if found_gpus
            else [{"name": "Standard Controller", "load": 5.0, "temp": 0.0}]
        ),
        "memory": {
            "ram_total": round(mem.total / (1024**3), 1),
            "ram_used": round(mem.used / (1024**3), 1),
            "ram_perc": mem.percent,
            "swap_perc": swp.percent,
            "swap_used": round(swp.used / (1024**3), 1),
        },
        "traffic": {
            "down": round((net_now.bytes_recv - net_prev.bytes_recv) / 1024, 1),
            "up": round((net_now.bytes_sent - net_prev.bytes_sent) / 1024, 1),
        },
        "power": {
            "battery": battery.percent if battery else 100,
            "charging": battery.power_plugged if battery else True,
        },
        "procs": [
            {
                "name": p.info["name"],
                "cpu": p.info["cpu_percent"],
                "ram": f"{round(p.info['memory_info'].rss / 1024 / 1024, 1)} MiB",
            }
            for p in sorted(
                psutil.process_iter(["name", "cpu_percent", "memory_info"]),
                key=lambda x: x.info["memory_info"].rss,
                reverse=True,
            )[:10]
        ],
        "sync_time": time.strftime("%H:%M:%S"),
    }


# START SERVICE
print(f"🌍 Starting Universal Sync from: {platform.node()}")
print(f"Detection OS: {platform.system()}")

while True:
    try:
        # Pushes whole system state once per second
        current_data = fetch_live_data()
        ref.set(current_data)
        # Verify sync in console
        print(
            f"[{current_data['sync_time']}] System: {current_data['performance']['cpu_total']}% | Sync Status: ✅"
        )
    except KeyboardInterrupt:
        break
    except Exception as e:
        print(f"Sync Failure: {e}")
