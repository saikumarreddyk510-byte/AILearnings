# <span style="color:#0B7285;"><strong>Anaconda + VS Code: Easy Guide</strong></span>

<p>
<span style="color:#2B8A3E;"><strong>Short Answer:</strong></span>
Anaconda and VS Code competitors kaavu. Rendu kalipi use chesthe best setup vastundi.
</p>

---

## <span style="color:#364FC7;"><strong>1) Anaconda Ante Enti?</strong></span>

<strong>Anaconda</strong> = Python distribution + package manager + environment manager.

Anaconda install chesthe usually:
- Python
- Jupyter Notebook
- Conda
- Data science libraries

Common libraries:
- NumPy
- Pandas
- Matplotlib
- Scikit-learn

<p><span style="color:#C92A2A;"><strong>Main Point:</strong></span> Anaconda lo most useful tool <strong>Conda</strong>.</p>

### <strong>Conda Environment Example</strong>

```bash
conda create -n myproject python=3.11
conda activate myproject
```

Meaning: Each project ki separate Python version and separate libraries maintain cheyyachu.

---

## <span style="color:#5F3DC4;"><strong>2) VS Code Ante Enti?</strong></span>

<strong>VS Code</strong> = Code editor / development environment.

VS Code lo:
- Python code write cheyyachu
- Files/folders manage cheyyachu
- Terminal use cheyyachu
- Debugging cheyyachu
- Git/GitHub use cheyyachu
- Extensions install cheyyachu
- Jupyter notebooks run cheyyachu

Example:

```python
print("Hello World")
```

<p><span style="color:#E67700;"><strong>Important:</strong></span> VS Code itself Python install cheyyadu. System Python or Conda environment undali.</p>

---

## <span style="color:#087F5B;"><strong>3) Simple Analogy</strong></span>

- Anaconda = Kitchen
- Conda Environment = Separate cooking workspace
- Python libraries = Ingredients
- VS Code = Table where you write recipe

So, code write chesedi VS Code lo.
Code run ayyedi selected Anaconda environment lo.

---

## <span style="color:#1C7ED6;"><strong>4) Side-by-Side Comparison</strong></span>

| Feature | Anaconda | VS Code |
|---|---|---|
| What is it? | Python distribution + environment manager | Code editor |
| Python included? | Yes | No |
| Libraries included? | Many preinstalled | Included kaavu |
| Code writing | Jupyter/Spyder possible | Excellent coding experience |
| Environment management | Conda | Direct ga kaadu, but Conda interpreter select cheyyachu |
| Best for | Data Science, ML, beginners | Coding, debugging, Git, projects |
| Languages | Mostly Python/R ecosystem | Python, Java, JS, C++, etc. |

---

## <span style="color:#862E9C;"><strong>5) Best Setup for You</strong></span>

<p><span style="color:#2F9E44;"><strong>Recommended Combo:</strong></span> <strong>Anaconda (or Miniconda) + VS Code</strong></p>

Workflow:
1. Anaconda/Miniconda install cheyyali
2. Conda environment create cheyyali
3. VS Code install cheyyali
4. Python extension install cheyyali
5. VS Code lo correct Conda interpreter select cheyyali
6. Code write and run cheyyali

---

## <span style="color:#495057;"><strong>6) Step-by-Step Commands</strong></span>

### <strong>Step 1: Environment Create</strong>

```bash
conda create -n data_project python=3.11
```

After hitting this command:
- `data_project` ane kotha environment create avuthundi.
- Python 3.11 aa environment lo ready avuthundi.
- Inka environment active kaadu (next step lo activate cheyyali).

### <strong>Step 2: Environment Activate</strong>

```bash
conda activate data_project
```

After hitting this command:
- Terminal prompt lo `(data_project)` laga prefix kanipisthundi.
- Ippati nundi install/run chese packages and Python ee environment ni use chestayi.

### <strong>Step 3: Libraries Install</strong>

```bash
conda install pandas numpy matplotlib scikit-learn
```

After hitting this command:
- Required libraries current active environment lo install avuthayi.
- Project code ki kavalsina dependencies ready avuthayi.

### <strong>Step 4: VS Code lo Interpreter Select</strong>

- Bottom-right Python version meeda click cheyyi
- Python: Select Interpreter select cheyyi
- `Python 3.11 ('data_project': conda)` choose cheyyi

### <strong>Step 5: Run Your Script</strong>

```bash
python analysis.py
```

After hitting this command:
- `analysis.py` active environment Python tho run avuthundi.
- Output/Errors terminal lo kanipisthayi.

### <strong>Step 6: Work Aipoyaka Deactivate</strong>

```bash
conda deactivate
```

After hitting this command:
- Active conda environment close avuthundi.
- Terminal malli base/system context ki vastundi.

### <strong>Our Project Example (What We Did)</strong>

In our project, we followed this exact order:

```bash
conda create -p venv python==3.12
conda activate venv/
pip install -r requirements.txt
python app.py
conda deactivate
```

What happens after each command (our project):
1. `conda create -p venv python==3.12` -> `venv` path lo Python 3.12 environment create avuthundi.
2. `conda activate venv/` -> aa environment active avuthundi; prompt change avuthundi.
3. `pip install -r requirements.txt` -> requirements file lo unna packages install avuthayi.
4. `python app.py` -> app run start avuthundi.
5. `conda deactivate` -> environment nundi exit avutharu.

<p><span style="color:#E67700;"><strong>Note:</strong></span> Ee commands mana project setup example ga use chesam.</p>

---

## <span style="color:#C2255C;"><strong>7) Small Working Example</strong></span>

```python
import pandas as pd

data = {
    "Name": ["Sai", "Ravi", "Priya"],
    "Salary": [70000, 80000, 75000]
}

df = pd.DataFrame(data)
print(df)
```

Expected output:

```text
    Name  Salary
0    Sai   70000
1   Ravi   80000
2  Priya   75000
```

---

## <span style="color:#0C8599;"><strong>8) VS Code Terminal lo Conda Use Cheyyacha?</strong></span>

Yes.

```bash
conda activate data_project
python analysis.py
```

---

## <span style="color:#5C940D;"><strong>9) Jupyter Notebook in VS Code</strong></span>

- `.ipynb` file open cheyyi
- Top-right lo `Select Kernel` click cheyyi
- Correct Conda environment select cheyyi
- Cells run cheyyi

Example:

```python
import numpy as np
numbers = np.array([10, 20, 30])
print(numbers.mean())
```

Output:

```text
20.0
```

---

## <span style="color:#D9480F;"><strong>10) Anaconda vs Miniconda</strong></span>

### <strong>Anaconda</strong>
- Beginner friendly
- Many packages already installed
- Large size

### <strong>Miniconda</strong>
- Lightweight
- Only essential tools
- Clean professional setup

<p><span style="color:#2B8A3E;"><strong>Recommendation:</strong></span> Beginner ki Anaconda okay. Long-term projects ki Miniconda + VS Code best.</p>

---

## <span style="color:#1864AB;"><strong>11) Using UV Over Anaconda</strong></span>

<p><span style="color:#2B8A3E;"><strong>What is UV?</strong></span> <strong>uv</strong> is a very fast Python package and environment manager. Speed and clean dependency handling kosam chala mandi UV use chestunnaru.</p>

### <strong>Why choose UV?</strong>

- Super fast installs (pip/venv compared to fast)
- Lockfile based reproducible setup easy
- Lightweight workflow for app projects
- CI/CD pipelines lo quick setup

### <strong>UV vs Anaconda (Simple View)</strong>

| Point | UV | Anaconda |
|---|---|---|
| Speed | Very fast | Moderate |
| Size | Lightweight | Heavy distribution |
| Best for | App dev, backend, automation, modern Python workflows | Data science beginners, pre-bundled scientific stack |
| Environment creation | `uv venv` | `conda create` |
| Package install | `uv pip install ...` | `conda install ...` / `pip install ...` |

### <strong>Basic UV Workflow Example</strong>

Start a new UV project skeleton:

```bash
uv init demouv
```

<p><span style="color:#2B8A3E;"><strong>Why this command?</strong></span> `uv init demouv` creates a new project folder with starter files (like project metadata and a clean structure), so setup manual ga chala files create cheyyalsina avasaram taggipothundi. Team lo consistent project layout maintain cheyyadaniki idi useful.</p>

Then follow this order:

```bash
cd demouv
uv venv .venv
.venv\Scripts\activate
uv add pandas
uv pip install -r requirements.txt
python main.py
deactivate
```

What happens after each command (UV flow):
1. `cd demouv` -> terminal current folder `demouv` ki maruthundi.
2. `uv venv .venv` -> project lo `.venv` virtual environment create avuthundi.
3. `.venv\Scripts\activate` -> `.venv` active avuthundi; prompt lo environment name kanipisthundi.
4. `uv add pandas` -> `pandas` dependency project ki add avuthundi (project metadata/lock update avvachu).
5. `uv pip install -r requirements.txt` -> requirements file dependencies fast ga install avuthayi.
6. `python main.py` -> project script run avuthundi.
7. `deactivate` -> virtual environment nundi bayataki vastaru.

### <strong>`uv venv` ante enti? (What it does)</strong>

`uv venv` command current project kosam virtual environment create chestundi. Default ga `.venv` folder create avuthundi.

<p><span style="color:#2B8A3E;"><strong>Why use it?</strong></span> Project-wise isolated Python setup vastundi. Oka project dependencies inko project ni affect cheyyavu.</p>

### <strong>`uv venv` Usage (Practical)</strong>

```bash
uv venv
```

Above command run chesthe default `.venv` create avuthundi.

Activate on Windows (PowerShell):

```bash
.venv\Scripts\activate
```

After activation, terminal prompt usually changes like this:

```text
PS C:\learnAi\KrishAI> .venv\scripts\activate
(KrishAI) PS C:\learnAi\KrishAI>
```

`(KrishAI)` prefix kanipisthe environment active ani meaning.

Then packages install:

```bash
uv pip install -r requirements.txt
```

Single package ni project dependency ga add cheyyali ante:

```bash
uv add pandas
```

After hitting `uv add pandas`:
- `pandas` install avuthundi (active environment/project context lo).
- Project dependency list lo `pandas` add avuthundi.
- Team members project pull chesinappudu same dependency setup easy avuthundi.

After hitting this command:
- `requirements.txt` lo unna packages active `.venv` lo install avuthayi.
- Next commands lo modules import errors chance tagguthundi.

Deactivate environment when done:

```bash
deactivate
```

After hitting this command:
- Prompt lo environment prefix remove avuthundi.
- Normal shell context ki return avutharu.

<p><span style="color:#E67700;"><strong>Practical Tip:</strong></span> Data science/Jupyter-heavy work unte Conda easy. Fast project setup and modern packaging kavali ante UV great choice.</p>

---

## <span style="color:#3B5BDB;"><strong>Final Understanding</strong></span>

<strong>Anaconda</strong> manages:
- Python
- Packages
- Environments

<strong>VS Code</strong> handles:
- Writing code
- Running code
- Debugging
- Project workflow

<p><span style="color:#C92A2A;"><strong>Conclusion:</strong></span> "Anaconda vs VS Code" kaadu. <strong>Anaconda + VS Code together</strong> use cheyyali.</p>

---

---

# <span style="color:#0B7285;"><strong>Pydantic — Complete Guide</strong></span>

---

## <span style="color:#364FC7;"><strong>1) Problem — Pydantic Lekapothe Emi Jarugtundi?</strong></span>

Python lo oka function raastam:

```python
def create_user(name, age, email):
    print(f"User: {name}, Age: {age}, Email: {email}")

create_user("Sai", "25", "not-an-email")   # ❌ age string ga ichham — no error!
create_user("Sai", -5, "sai@test.com")     # ❌ age negative — no error!
create_user(None, 25, "sai@test.com")      # ❌ name None — no error!
```

Python ki ivi errors kaavu — silently accept chesthundi. Tarvata code lo `age + 1` cheyyadam try chesthe crash avutundi — **error eppudu vastundo teliyadu, enduku vastundo debug cheyyadam kastam.**

Real world lo:
- API nundi data vastundi — format wrong ayyithe?
- Database nundi data vastundi — field missing aithe?
- User form submit chestadu — invalid email ichhaadu?

**Pydantic lekapothe:** Every field manual ga validate cheyyali, error messages manually raayali, type conversions manually handle cheyyali.

---

## <span style="color:#5F3DC4;"><strong>2) Pydantic Ante Enti?</strong></span>

**Pydantic** = Python library for **data validation and settings management using type hints**.

Simple ga cheppalante:

> Pydantic oka **form validator** laanti di. Form lo wrong data type chesthe immediately error ivvunu, correct aithe clean data istundi.

```python
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int
    email: str

# Correct data — works fine ✅
user = User(name="Sai", age=25, email="sai@test.com")

# Wrong data — immediate clear error ❌
user = User(name="Sai", age="not-a-number", email="sai@test.com")
# ValidationError: age → value is not a valid integer
```

Error **immediately** vastundi — silently wrong data tho program run avvadu.

---

## <span style="color:#2B8A3E;"><strong>3) BaseModel — Core Concept</strong></span>

Pydantic lo anni things `BaseModel` class nundi start avutayi.

```python
from pydantic import BaseModel

class Product(BaseModel):
    name: str
    price: float
    quantity: int
    is_available: bool
```

Idi define chessinappudu:
- `name` must be `str`
- `price` must be `float`
- `quantity` must be `int`
- `is_available` must be `bool`

### Auto Type Conversion:

```python
product = Product(
    name="Laptop",
    price="999.99",     # string ichham — Pydantic float ga convert chesthundi ✅
    quantity="10",      # string ichham — Pydantic int ga convert chesthundi ✅
    is_available="true" # string ichham — Pydantic bool ga convert chesthundi ✅
)

print(product.price)        # → 999.99  (float)
print(type(product.price))  # → <class 'float'>
```

**Pydantic intelligent ga convert chestundi** — reasonable conversions automatic, impossible ones error ivvunu.

---

## <span style="color:#E67700;"><strong>4) Field Validation — Rules Add Cheyyadam</strong></span>

`Field` use chesi extra rules set cheyyadam:

```python
from pydantic import BaseModel, Field

class Employee(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    age: int = Field(ge=18, le=65)          # ge = greater or equal, le = less or equal
    salary: float = Field(gt=0)             # gt = greater than
    department: str = Field(default="IT")   # default value
    employee_id: str = Field(pattern=r"^EMP\d{4}$")  # regex pattern

# Valid data ✅
emp = Employee(name="Sai Kumar", age=28, salary=50000.0, employee_id="EMP0042")
print(emp.department)  # → "IT"  (default used)

# Invalid data — clear errors ❌
emp = Employee(name="S", age=17, salary=-100, employee_id="WRONG")
# ValidationError:
#   name → String should have at least 2 characters
#   age  → Input should be greater than or equal to 18
#   salary → Input should be greater than 0
#   employee_id → String should match pattern '^EMP\d{4}$'
```

### Field constraints cheat sheet:

| Constraint | Meaning | Example |
|---|---|---|
| `min_length` | Minimum string length | `Field(min_length=2)` |
| `max_length` | Maximum string length | `Field(max_length=100)` |
| `ge` | Greater than or equal | `Field(ge=0)` |
| `le` | Less than or equal | `Field(le=100)` |
| `gt` | Greater than (not equal) | `Field(gt=0)` |
| `lt` | Less than (not equal) | `Field(lt=1000)` |
| `pattern` | Regex pattern match | `Field(pattern=r"^\d{10}$")` |
| `default` | Default value | `Field(default="active")` |

---

## <span style="color:#C92A2A;"><strong>5) Optional Fields & Default Values</strong></span>

```python
from pydantic import BaseModel, Field
from typing import Optional

class UserProfile(BaseModel):
    username: str
    email: str
    bio: Optional[str] = None           # Optional — None ok
    age: Optional[int] = None           # Optional — None ok
    is_active: bool = True              # Default value
    role: str = Field(default="viewer") # Default with Field

# Minimum required fields only ✅
user = UserProfile(username="sai123", email="sai@test.com")
print(user.bio)       # → None
print(user.is_active) # → True
print(user.role)      # → "viewer"

# All fields ✅
user = UserProfile(
    username="sai123",
    email="sai@test.com",
    bio="Python developer",
    age=25,
    is_active=True,
    role="admin"
)
```

---

## <span style="color:#0B7285;"><strong>6) Nested Models — Model Inside Model</strong></span>

Real data often nested structure lo untundi — Pydantic idi easily handle chesthundi:

```python
from pydantic import BaseModel
from typing import List

class Address(BaseModel):
    street: str
    city: str
    pincode: str

class OrderItem(BaseModel):
    product_name: str
    quantity: int
    price: float

class Order(BaseModel):
    order_id: str
    customer_name: str
    delivery_address: Address        # nested model
    items: List[OrderItem]           # list of nested models
    total_amount: float

# Real order create cheyyadam
order = Order(
    order_id="ORD001",
    customer_name="Sai Kumar",
    delivery_address={               # dict ga pass cheyyadam OK — Pydantic convert chesthundi
        "street": "123 Main St",
        "city": "Hyderabad",
        "pincode": "500001"
    },
    items=[
        {"product_name": "Laptop", "quantity": 1, "price": 75000.0},
        {"product_name": "Mouse",  "quantity": 2, "price": 500.0}
    ],
    total_amount=76000.0
)

print(order.delivery_address.city)      # → "Hyderabad"
print(order.items[0].product_name)      # → "Laptop"
print(order.items[1].price)             # → 500.0
```

`dict` ga pass chessinappudu Pydantic automatically nested model objects ga convert chesthundi.

---

## <span style="color:#5F3DC4;"><strong>7) Custom Validators — Own Rules Write Cheyyadam</strong></span>

Built-in constraints chaalinappudu own validation logic raayachu:

```python
from pydantic import BaseModel, field_validator

class UserRegistration(BaseModel):
    username: str
    password: str
    confirm_password: str
    email: str
    phone: str

    @field_validator("username")
    @classmethod
    def username_no_spaces(cls, value):
        if " " in value:
            raise ValueError("Username lo spaces undakudadu")
        return value.lower()   # lowercase lo save cheyyadam

    @field_validator("password")
    @classmethod
    def password_strong(cls, value):
        if len(value) < 8:
            raise ValueError("Password minimum 8 characters undali")
        if not any(c.isupper() for c in value):
            raise ValueError("Password lo okka uppercase letter undali")
        return value

    @field_validator("email")
    @classmethod
    def email_valid(cls, value):
        if "@" not in value or "." not in value:
            raise ValueError("Valid email ichhu")
        return value.lower()

    @field_validator("phone")
    @classmethod
    def phone_ten_digits(cls, value):
        digits_only = value.replace("-", "").replace(" ", "")
        if not digits_only.isdigit() or len(digits_only) != 10:
            raise ValueError("Phone number 10 digits undali")
        return digits_only  # clean format lo save

# Valid ✅
user = UserRegistration(
    username="Sai Kumar",        # → "sai kumar" (spaces ok, lowercase convert)
    password="SecurePass1",
    confirm_password="SecurePass1",
    email="SAI@TEST.COM",        # → "sai@test.com" (lowercase convert)
    phone="98765-43210"          # → "9876543210" (clean format)
)

# Invalid ❌
user = UserRegistration(
    username="sai",
    password="weak",             # ValidationError: minimum 8 chars
    confirm_password="weak",
    email="not-an-email",        # ValidationError: valid email ichhu
    phone="123"                  # ValidationError: 10 digits undali
)
```

---

## <span style="color:#2B8A3E;"><strong>8) Model Methods — Useful Built-in Functions</strong></span>

```python
from pydantic import BaseModel

class Product(BaseModel):
    name: str
    price: float
    category: str

product = Product(name="Laptop", price=75000.0, category="Electronics")

# 1. dict ga convert cheyyadam
product_dict = product.model_dump()
print(product_dict)
# → {'name': 'Laptop', 'price': 75000.0, 'category': 'Electronics'}

# 2. JSON string ga convert cheyyadam
product_json = product.model_dump_json()
print(product_json)
# → '{"name":"Laptop","price":75000.0,"category":"Electronics"}'

# 3. Dict nundi model create cheyyadam
data = {"name": "Phone", "price": 25000.0, "category": "Electronics"}
product2 = Product.model_validate(data)
print(product2.name)  # → "Phone"

# 4. JSON string nundi model create cheyyadam
json_str = '{"name":"Tablet","price":35000.0,"category":"Electronics"}'
product3 = Product.model_validate_json(json_str)
print(product3.price)  # → 35000.0

# 5. Schema cheyyadam (API docs kosam useful)
schema = Product.model_json_schema()
print(schema)
# → {'properties': {'name': {'type': 'string'}, 'price': {'type': 'number'}, ...}}
```

---

## <span style="color:#E67700;"><strong>9) Pydantic with FastAPI / LangChain — Real Use Case</strong></span>

### FastAPI lo:

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class CreateUserRequest(BaseModel):
    name: str = Field(min_length=2)
    email: str
    age: int = Field(ge=18)

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

@app.post("/users", response_model=UserResponse)
def create_user(request: CreateUserRequest):
    # request automatic ga validate avutundi — invalid data ki 422 error automatic
    # request.name, request.email, request.age — clean, validated data
    new_user = save_to_db(request)
    return UserResponse(id=new_user.id, name=new_user.name, email=new_user.email)
```

FastAPI `CreateUserRequest` automatic ga validate chesthundi — manual validation code raayakarledu.

### LangChain lo (Structured Output):

```python
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.output_parsers import JsonOutputParser

class SentimentResult(BaseModel):
    sentiment: str
    confidence: float
    reason: str

llm = ChatGroq(model="llama-3.1-8b-instant")

# LLM ni Pydantic model format lo output ivvamani cheppinchadam
structured_llm = llm.with_structured_output(SentimentResult)

result = structured_llm.invoke("Analyze: 'The food was amazing!'")
print(result.sentiment)   # → "Positive"
print(result.confidence)  # → 0.95
print(result.reason)      # → "Positive language used"
```

LLM response automatically `SentimentResult` Pydantic object ga vastundi — string parse cheyyakarledu.

---

## <span style="color:#C92A2A;"><strong>10) Without Pydantic vs With Pydantic</strong></span>

**API request validate cheyyadam:**

```python
# ❌ Without Pydantic — manual, error-prone
def create_user(data: dict):
    if "name" not in data:
        raise ValueError("name required")
    if not isinstance(data["name"], str):
        raise TypeError("name must be string")
    if len(data["name"]) < 2:
        raise ValueError("name too short")
    if "age" not in data:
        raise ValueError("age required")
    if not isinstance(data["age"], int):
        try:
            data["age"] = int(data["age"])
        except:
            raise TypeError("age must be integer")
    if data["age"] < 18:
        raise ValueError("age must be 18+")
    # ... email validate, phone validate, inka chaala raayali
    # 50+ lines of validation code

# ✅ With Pydantic — clean, automatic
from pydantic import BaseModel, Field

class CreateUserRequest(BaseModel):
    name: str = Field(min_length=2)
    age: int = Field(ge=18)
    email: str
    phone: str = Field(pattern=r"^\d{10}$")

def create_user(data: dict):
    user = CreateUserRequest(**data)  # ← single line, all validation done
    # user.name, user.age — guaranteed clean data
```

**Same result — 50 lines vs 6 lines.**

---

## <span style="color:#0B7285;"><strong>11) Summary</strong></span>

```
Problem:
  Python ki type safety ledu by default
  Wrong data types silently accept avutayi
  Runtime lo unexpected errors vastay
  Manual validation = lots of boilerplate code

Pydantic Solution:
  BaseModel → data structure + types define cheyyadam
  Automatic validation → wrong data = immediate clear error
  Auto type conversion → "25" → 25 (int) automatic
  Field() → min/max/pattern/default rules
  Custom validators → own logic raayachu
  Nested models → complex structures handle

Key Methods:
  model_dump()          → Python dict
  model_dump_json()     → JSON string
  model_validate()      → dict → model
  model_validate_json() → JSON → model
  model_json_schema()   → schema dict

Where Pydantic is used:
  FastAPI     → request/response validation automatic
  LangChain   → structured LLM output
  Data pipelines → incoming data validate cheyyadam
  Config management → settings validate cheyyadam
  Any Python app → clean, safe data handling
```

<p><span style="color:#364FC7;"><strong>Bottom Line:</strong></span> Pydantic ante Python ki <strong>type safety layer</strong> — data enter chessinapudu wrong aithe immediately clear error, correct aithe guaranteed clean data. <code>BaseModel</code> define cheyyandi, rules pettandi, rest Pydantic handle chesthundi. Less code, more safety, zero surprises. 🛡️</p>

---

*Ee section lo Pydantic problem, BaseModel, Field validation, Optional fields, Nested models, Custom validators, Model methods, FastAPI/LangChain usage, Without vs With comparison cover chesam.*
