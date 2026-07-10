import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\backend\main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# The ab_config block starts with "class ABConfigRequest(BaseModel):" and ends with "return {"success": False, "message": f"Connection error: {str(e)}"}"

# Find the ab_config block
match = re.search(r"class ABConfigRequest\(BaseModel\):.*?return \{\"success\": False, \"message\": f\"Connection error: \{str\(e\)\}\"\}", content, re.DOTALL)

if match:
    ab_config_code = match.group(0)
    # Remove it from its current position
    content = content.replace(ab_config_code, "")
    
    # We want to insert it right before:
    # # Mount the frontend application as a catch-all route at the end
    insertion_point = "# Mount the frontend application as a catch-all route at the end"
    
    if insertion_point in content:
        content = content.replace(insertion_point, ab_config_code + "\n\n" + insertion_point)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print("Moved AB config endpoint successfully!")
    else:
        print("Could not find insertion point.")
else:
    print("Could not find AB config block.")
