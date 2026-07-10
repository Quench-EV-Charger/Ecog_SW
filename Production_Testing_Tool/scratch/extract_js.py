import requests, re

r = requests.get('http://10.20.27.1/', timeout=5)
html = r.text

js_files = re.findall(r'src=["\'](.*?.js)["\']', html)
print('JS files:', js_files)

for js in js_files:
    if not js.startswith('http'):
        js_url = 'http://10.20.27.1/' + js.lstrip('/')
    else:
        js_url = js
    
    try:
        content = requests.get(js_url, timeout=5).text
        if 'password' in content:
            print(f'Found password in {js}')
            with open(js.split('/')[-1], 'w', encoding='utf-8') as f:
                f.write(content)
    except Exception as e:
        print(e)
