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
