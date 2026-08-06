import re

def parse_axienta_number(val):
    if val is None:
        return 0.0
    s = str(val).strip()
    if not s or s.lower() == 'nan':
        return 0.0
    
    # Handle fraction strings like "-1/0.000" or "5391/0.000"
    if '/' in s:
        s = s.split('/')[0].strip()
    
    # Clean commas and currency symbols
    s = s.replace(',', '').replace('LKR', '').replace('$', '').strip()

    try:
        return float(s)
    except ValueError:
        # Extract first numeric/decimal match
        match = re.search(r'[-+]?\d*\.?\d+', s)
        if match:
            return float(match.group(0))
        return 0.0

# Test cases from screenshot
test_qtys = ['-1/0.000', '5391/0.000', '2848/0.000', 100, '-1,119.37', '11,288,754.00']
print("Testing Axienta Number Parsing:")
for q in test_qtys:
    print(f"  Input: '{q}' => Parsed Float: {parse_axienta_number(q)}")
