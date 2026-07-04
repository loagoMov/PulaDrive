import os
import sys
import requests
import duckdb

# Try to load environment variables from .env.local if present
def load_env_local():
    possible_paths = [
        ".env.local",
        "../.env.local",
        "../../.env.local"
    ]
    for path in possible_paths:
        if os.path.exists(path):
            with open(path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        parts = line.split("=", 1)
                        if len(parts) == 2:
                            key, val = parts
                            key = key.strip()
                            val = val.strip().strip('"').strip("'")
                            if key and key not in os.environ:
                                os.environ[key] = val
            break

load_env_local()

# Configurations
CONVEX_URL = os.environ.get("CONVEX_HTTP_URL", "http://localhost:5721")  # Fallback to standard dev port or custom env
SYNC_SECRET = os.environ.get("MOTHERDUCK_SYNC_SECRET", "mock_sync_secret")
DATABASE_PATH = os.environ.get("DUCKDB_DATABASE_PATH", "carplace_analytics.db")

print("Starting recommendation pipeline...")
print(f"Convex URL: {CONVEX_URL}")


# 1. Fetch telemetry logs from Convex HTTP endpoint
try:
    export_url = f"{CONVEX_URL}/api/export-telemetry?secret={SYNC_SECRET}&since=0"
    print(f"Fetching logs from: {CONVEX_URL}/api/export-telemetry?secret=[REDACTED]&since=0")
    response = requests.get(export_url, timeout=10)
    response.raise_for_status()
    logs = response.json()
except Exception as e:
    print(f"Error fetching telemetry logs: {e}")
    sys.exit(1)

print(f"Fetched {len(logs)} telemetry events.")

# 2. Connect to DuckDB/MotherDuck
md_token = os.environ.get("MOTHERDUCK_TOKEN")
md_db_name = os.environ.get("MOTHERDUCK_DB_NAME", "carplace_analytics")
if md_token:
    print("Connecting to MotherDuck...")
    db = duckdb.connect(f"md:?token={md_token}")
    db.execute(f"CREATE DATABASE IF NOT EXISTS {md_db_name};")
    db.execute(f"USE {md_db_name};")
else:
    print(f"Connecting to local DuckDB database: {DATABASE_PATH}")
    db = duckdb.connect(DATABASE_PATH)

# Create tracking table if not exists
db.execute("""
CREATE TABLE IF NOT EXISTS telemetry_events (
    id VARCHAR PRIMARY KEY,
    userId VARCHAR,
    anonymousSessionId VARCHAR,
    vehicleId VARCHAR,
    eventType VARCHAR,
    pageRoute VARCHAR,
    timestamp BIGINT
);
""")

# Insert new events
if logs:
    insert_data = []
    for log in logs:
        insert_data.append((
            log.get("_id"),
            log.get("userId"),
            log.get("anonymousSessionId"),
            log.get("vehicleId"),
            log.get("eventType"),
            log.get("pageRoute"),
            log.get("timestamp")
        ))
    
    db.executemany("""
    INSERT OR IGNORE INTO telemetry_events (id, userId, anonymousSessionId, vehicleId, eventType, pageRoute, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    """, insert_data)

# 3. Run heuristic scoring query
# Heuristics:
# click_share = 10 points
# click_favorite = 8 points
# click_vehicle = 3 points
# page_view = 1 point
query = """
WITH event_scores AS (
    SELECT 
        COALESCE(userId, anonymousSessionId) as targetId,
        vehicleId,
        CASE 
            WHEN eventType = 'click_share' THEN 10
            WHEN eventType = 'click_favorite' THEN 8
            WHEN eventType = 'click_vehicle' THEN 3
            ELSE 1
        END as score
    FROM telemetry_events
    WHERE vehicleId IS NOT NULL AND COALESCE(userId, anonymousSessionId) IS NOT NULL
),
aggregated_scores AS (
    SELECT 
        targetId,
        vehicleId,
        SUM(score) as total_score
    FROM event_scores
    GROUP BY targetId, vehicleId
),
ranked_recommendations AS (
    SELECT 
        targetId,
        vehicleId,
        total_score,
        ROW_NUMBER() OVER(PARTITION BY targetId ORDER BY total_score DESC) as rank
    FROM aggregated_scores
)
SELECT 
    targetId,
    list(vehicleId) as recommendedVehicleIds
FROM ranked_recommendations
WHERE rank <= 10
GROUP BY targetId;
"""

try:
    results = db.execute(query).fetchall()
    print(f"Calculated recommendations for {len(results)} targets.")
except Exception as e:
    print(f"Error executing recommendation query: {e}")
    sys.exit(1)

# Format payload
recommendations_payload = []
for row in results:
    target_id, vehicle_ids_raw = row
    
    # Process vehicle IDs list/agg format from DuckDB
    if isinstance(vehicle_ids_raw, str):
        vehicle_ids = [v.strip() for v in vehicle_ids_raw.split(",") if v.strip()]
    elif isinstance(vehicle_ids_raw, list):
        vehicle_ids = [str(v) for v in vehicle_ids_raw if v]
    else:
        vehicle_ids = []
    
    recommendations_payload.append({
        "targetId": target_id,
        "recommendedVehicleIds": vehicle_ids
    })

# 4. POST recommendations back to Convex
if recommendations_payload:
    try:
        import_url = f"{CONVEX_URL}/api/import-recommendations?secret={SYNC_SECRET}"
        print(f"Sending recommendations to: {CONVEX_URL}/api/import-recommendations?secret=[REDACTED]")
        headers = {"Content-Type": "application/json"}
        response = requests.post(import_url, json=recommendations_payload, headers=headers, timeout=10)
        response.raise_for_status()
        print("Successfully uploaded recommendations.")
    except Exception as e:
        print(f"Error uploading recommendations to Convex: {e}")
        sys.exit(1)
else:
    print("No recommendations to upload.")

# 5. Run analytics aggregation query
analytics_query = """
SELECT 
    vehicleId,
    CAST(COUNT(*) FILTER (WHERE eventType = 'page_view') AS INTEGER) as views,
    CAST(COUNT(*) FILTER (WHERE eventType = 'click_favorite') AS INTEGER) as favorites,
    CAST(COUNT(*) FILTER (WHERE eventType = 'click_share') AS INTEGER) as shares,
    CAST(COUNT(*) FILTER (WHERE eventType = 'click_vehicle') AS INTEGER) as clicks
FROM telemetry_events
WHERE vehicleId IS NOT NULL
GROUP BY vehicleId
"""

try:
    analytics_results = db.execute(analytics_query).fetchall()
    print(f"Calculated analytics for {len(analytics_results)} vehicles.")
except Exception as e:
    print(f"Error executing analytics query: {e}")
    sys.exit(1)

# Format payload
analytics_payload = []
for row in analytics_results:
    vehicle_id, views, favorites, shares, clicks = row
    analytics_payload.append({
        "vehicleId": vehicle_id,
        "views": views,
        "favorites": favorites,
        "shares": shares,
        "clicks": clicks
    })

# 6. POST analytics back to Convex
if analytics_payload:
    try:
        import_analytics_url = f"{CONVEX_URL}/api/import-analytics?secret={SYNC_SECRET}"
        print(f"Sending analytics to: {CONVEX_URL}/api/import-analytics?secret=[REDACTED]")
        headers = {"Content-Type": "application/json"}
        response = requests.post(import_analytics_url, json=analytics_payload, headers=headers, timeout=10)
        response.raise_for_status()
        print("Successfully uploaded analytics.")
    except Exception as e:
        print(f"Error uploading analytics to Convex: {e}")
        sys.exit(1)
else:
    print("No analytics to upload.")

print("Pipeline completed successfully.")

# 7. Sync all main tables
TABLES_TO_SYNC = [
    "dealerships",
    "vehicles",
    "reports",
    "invoices",
    "featuredApplications",
    "subscriptionUpgradeRequests",
    "notifications",
    "searchHistory",
    "rateLimits"
]

import json
import tempfile

for table in TABLES_TO_SYNC:
    print(f"\\n--- Syncing table {table} ---")
    table_exists = False
    try:
        count = db.execute(f"SELECT count(*) FROM information_schema.tables WHERE table_name = '{table}'").fetchone()[0]
        table_exists = count > 0
    except Exception:
        pass

    since = 0
    if table_exists:
        try:
            # Try to get max updatedAt or _creationTime
            res = db.execute(f"SELECT MAX(GREATEST(COALESCE(CAST(updatedAt AS BIGINT), 0), COALESCE(CAST(_creationTime AS BIGINT), 0))) FROM {table}").fetchone()
            if res and res[0]:
                since = int(res[0])
        except Exception as e:
            print(f"Could not get max timestamp for {table}, doing full sync.")

    print(f"Fetching changes since {since}...")
    
    cursor = ""
    has_more = True
    total_synced = 0

    while has_more:
        export_url = f"{CONVEX_URL}/api/export-table?secret={SYNC_SECRET}&table={table}&since={since}"
        if cursor:
            export_url += f"&cursor={cursor}"
            
        resp = requests.get(export_url, timeout=30)
        if resp.status_code != 200:
            print(f"Failed to fetch {table}: {resp.text}")
            break
            
        data = resp.json()
        page_items = data.get("page", [])
        cursor = data.get("continueCursor")
        has_more = data.get("isDone") is False
        
        if not page_items:
            break
            
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as tmp:
            json.dump(page_items, tmp)
            tmp_path = tmp.name
            
        try:
            if not table_exists:
                db.execute(f"CREATE TABLE {table} AS SELECT * FROM read_json_auto('{tmp_path}')")
                table_exists = True
                print(f"Created table {table} with {len(page_items)} rows.")
            else:
                # Delete updated rows first
                db.execute(f"DELETE FROM {table} WHERE _id IN (SELECT _id FROM read_json_auto('{tmp_path}'))")
                # Insert the rows
                # Using read_json_auto with union_by_name to handle new columns in json vs table
                # We need to make sure the table has the columns, DuckDB alter table is manual.
                # For simplicity, if schema evolved, it will error and we'd need to rebuild.
                db.execute(f"INSERT INTO {table} SELECT * FROM read_json_auto('{tmp_path}')")
                print(f"Upserted {len(page_items)} rows in {table}.")
            total_synced += len(page_items)
        except Exception as e:
            print(f"Error upserting into {table}: {e}")
            break
        finally:
            os.remove(tmp_path)
            
    print(f"Finished syncing {total_synced} rows for {table}.")
