vbs_content = """Set objFSO = CreateObject("Scripting.FileSystemObject")
strPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

Set WshShell = CreateObject("WScript.Shell")

' 1. Start the Python server completely invisibly
WshShell.Run "cmd /c cd /d """ & strPath & "\backend"" && python -m uvicorn main:app --host 0.0.0.0 --port 8000", 0, False

' 2. Open the UI splash screen in the default web browser instantly
WshShell.Run """" & strPath & "\splash.html"""
"""

with open(r"C:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\Quench_Desktop.vbs", "w", encoding="utf-8") as f:
    f.write(vbs_content)

print("Updated Quench_Desktop.vbs!")
