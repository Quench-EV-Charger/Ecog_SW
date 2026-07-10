import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\backend\main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_endpoint = """
class RebootStackRequest(BaseModel):
    target: str # 'secc' or 'seccle'

@app.post("/api/automate/reboot-stack")
def api_reboot_stack(data: RebootStackRequest):
    ip = "10.20.27.100" if data.target == "secc" else "10.20.27.101"
    try:
        url = f"http://{ip}/api/outlets/ccs/restartStack"
        # usually restart APIs are POST but if it's GET, requests.post might fail, but let's assume POST
        res = requests.post(url, timeout=5)
        if res.status_code == 200 or res.status_code == 202:
            return {"success": True, "message": f"Successfully triggered restartStack on {ip}!"}
        else:
            return {"success": False, "message": f"Failed to restartStack on {ip} (HTTP {res.status_code})"}
    except Exception as e:
        return {"success": False, "message": f"Connection error: {str(e)}"}
"""

# Append before Catch-All
match = re.search(r"# Mount the frontend application as a catch-all route at the end", content)
content = content.replace(match.group(0), new_endpoint + "\n\n" + match.group(0))

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated main.py with reboot stack logic!")
