import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\backend\main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_model_logic = """        # Parse expected values from config_text
        expected_model = None
        match_model = re.search(r"option\s+model\s+['\"]?([^'\"]+)['\"]?", config_text)
        if match_model:
            expected_model = match_model.group(1)"""

new_model_logic = """        # Parse expected values from config_text
        expected_model = None
        system_blocks = re.findall(r"config\s+system.*?(?=config |\Z)", config_text, re.DOTALL)
        if system_blocks:
            match_model = re.search(r"option\s+model\s+['\"]?([^'\"]+)['\"]?", system_blocks[0])
            if match_model:
                expected_model = match_model.group(1)"""

content = content.replace(old_model_logic, new_model_logic)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed model parsing logic in main.py!")
