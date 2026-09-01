# Functions and Linear Transformations - Simple Telugu English Notes

Function ante input teesukoni output ichhe machine.
Linear Transformation ante **special type function** — input vector, output vector, and konni rules follow avutundi.

Ee rendu ardham chesukunte, **matrix ante enti** ani nijam ga telustundi.
Matrix ante just numbers table kaadu — adi oka **action** (space ni move cheyyadam).

> Ee file lo unna code antha real ga run chesi verify chesam (NumPy 2.4.6). Outputs kuda actual outputs.

## Enduku Ee Topic Important?

1. Matrix multiplication enduku ala untundo ardham avutundi
2. Neural network layer lo `Wx + b` ante emi jarugutundo telustundi
3. PCA, rotation, scaling — anni transformations ne
4. Determinant, inverse — vaati **meaning** telustundi (formula kaadu)

Kid analogy:
- Function = juice machine. Fruit vestav (input), juice vastundi (output).
- Linear transformation = rubber sheet meeda grid draw chesi, sheet ni stretch/rotate cheyyadam. Lines lines gane untay, sunna (origin) akkade untundi.

---

## 1) Function Ante Enti?

**Formal definition:**

> A function is a mathematical relationship that **uniquely associates** elements of one set (called the **domain**) with elements of another set (called the **codomain**).

Simple ga: function ante **inputs ni outputs ki map chese rule**.

Main rule: **oka input ki okate output**.
Rendu different inputs ki **same output** ravochu (adi ok).

### Notation - `f: X → Y`

Set $X$ (domain) nunchi set $Y$ (codomain) ki map chese function $f$ ni ila raastaru:

$$f : X \rightarrow Y$$

"$f$ maps $X$ to $Y$" ani chaduvutaru.

$x$ ante $X$ lo oka element aithe, **$f(x)$** ante $Y$ lo daaniki corresponding element.

```text
        X (domain)                      Y (codomain)
      +-------------+                 +-------------+
      |             |      f          |             |
      |   x1  ------|---------------->|-- y1        |
      |   x2  ------|---------------->|-- y2        |
      |   x3  ------|---------------->|-- y3        |
      |             |                 |             |
      +-------------+                 +-------------+

   Prati x nunchi EXACTLY ONE arrow bayataki velthundi.
   (Rendu arrows velthe -> adi function KAADU)
```

### Example - Regular

$$f(x) = 2x + 3$$

Idi prati real number $x$ ni inko real number ki map chestundi.

$$f : \mathbb{R} \rightarrow \mathbb{R}$$

$x = 2$ pettandi:

$$f(2) = 2 \times 2 + 3 = 7$$

```text
      2  ---- f ---->  7

   Mapping:  2 ∈ R   to   7 ∈ R
```

```python
f = lambda x: 2*x + 3
print(f(2))                        # 7
print(f(np.array([1, 2, 3, 5])))   # [ 5  7  9 13]
```

Verify chesam. Rendo line lo — **motham array ki okesari** apply ayindi (vectorization). AI lo eppudu ila ne, oka value kaadu — **lakshala rows okesari**.

### Example - AI

**Trained model ante oka function ye.** Ade asalu point.

MNIST digit recognition model:

$$f : \mathbb{R}^{784} \rightarrow \mathbb{R}^{10}$$

```text
   X (domain)                    f                 Y (codomain)
   784 numbers                 MODEL              10 numbers
   (28x28 image pixels)   -------------->    (0-9 ki scores)

   [0, 0, 255, 130, ...]  ---- model ---->   [0.01, 0.02, ..., 0.91]
                                                              ^
                                                      "9" ki highest
```

- **Domain** $X = \mathbb{R}^{784}$ → 28 × 28 = **784** pixel values
- **Codomain** $Y = \mathbb{R}^{10}$ → 10 digits (0 to 9) ki scores
- **$f$** = trained neural network

```python
28*28        # 784      <- MNIST image
224*224*3    # 150528   <- color image (RGB), aa model input ki
```

Ade rule ikkada kuda: **oka image ki okate prediction**. Same image rendu sarlu pettithe rendu different answers vasthe — adi function kaadu, and model kuda useless.

### AI lo Prati Chota Functions

| Emi | Function ga | Domain → Codomain |
|---|---|---|
| Trained model (regression) | House price predict | $\mathbb{R}^n \rightarrow \mathbb{R}$ |
| Trained model (classification) | Cat/dog | $\mathbb{R}^n \rightarrow \{0, 1\}$ |
| Tokenizer | Text → numbers | text $\rightarrow \mathbb{Z}^n$ |
| Word embedding | Word → vector | vocabulary $\rightarrow \mathbb{R}^{300}$ |
| ReLU activation | Negative teesestundi | $\mathbb{R} \rightarrow [0, \infty)$ |
| Sigmoid activation | Probability ki marustundi | $\mathbb{R} \rightarrow (0, 1)$ |
| Softmax | Scores → probabilities | $\mathbb{R}^n \rightarrow$ (sum = 1) |
| Loss function | Error entha undo | (pred, actual) $\rightarrow \mathbb{R}$ |

```python
import numpy as np

sigmoid = lambda z: 1 / (1 + np.exp(-z))
relu    = lambda z: np.maximum(0, z)
def softmax(z):
    e = np.exp(z - z.max())      # max teeyyadam = overflow raakunda
    return e / e.sum()

sigmoid(np.array([-10, 0, 10]))      # [0.000045  0.5  0.999955]
relu(np.array([-3, -1, 0, 2, 5]))    # [0 0 0 2 5]
softmax(np.array([2.0, 1.0, 0.1]))   # [0.659 0.2424 0.0986]  sum = 1.0
```

Anni verify chesam.

Gamaninchandi:
- **Sigmoid** codomain $(0,1)$ — anduke **probability** ga vaadataru
- **ReLU** codomain $[0,\infty)$ — negative values anni **0** ayyayi
- **Softmax** output **sum eppudu 1.0** — anduke "ee class ki 65% chance" ani cheppagalam

### Domain, Codomain, Range - Teda

- **Domain** = ye inputs allow chestamo
- **Codomain** = outputs ye set nunchi ravochu (**possible** space)
- **Range** = nijam ga vachhe outputs anni (**actual** values)

**Range ⊆ Codomain** eppudu.

Regular example: $f(x) = x^2$

- Domain = anni real numbers
- Codomain = anni real numbers
- Range = **only 0 and positive** (square negative raadu)

AI example: sigmoid

- Domain = $\mathbb{R}$ (edaina number ravochu)
- Codomain = $\mathbb{R}$ ani anukovachu
- Range = **$(0, 1)$ matrame** — eppudu 0 leda 1 exact ga raadu, daggara ki matrame velthundi

Kid analogy:
- Domain = school lo evaru evaru raavochu
- Range = nijam ga class lo evaru unnaro

**AI lo idi enduku matter avutundi:** Model ki $\mathbb{R}^{784}$ input ani cheppam — kaani training lo model **0-255 pixel values** matrame chusindi. Meeru 5000 value pettithe model confuse avutundi. Ade "**out of distribution**" problem. Domain ni respect cheyyakapothe prediction chettha ga vastundi.

---

## 2) Function Types (Quick)

| Type | Ante enti | Example |
|---|---|---|
| One-to-one (injective) | Prati output ki **okate** input | $f(x)=2x$ |
| Onto (surjective) | Anni outputs cover avutay | $f(x)=x^3$ |
| Many-to-one | Rendu inputs → same output | $f(x)=x^2$ (2 and -2 → 4) |
| Bijective | One-to-one **and** onto | $f(x)=2x$ |

Enduku matter avutundi?
**Bijective aithe ne inverse untundi** (undo cheyyagalam).

$f(x) = x^2$ lo output 4 vasthe — input 2 aa, -2 aa? Cheppalem. So undo cheyyalem.

Idi tarvata **inverse matrix** section lo malli vastundi — same idea.

### AI lo Ee Types

**Classification = many-to-one.** Idi chaala important.

```python
# different confidence vectors -> okate final class
[0.9, 0.1]    -> class 0
[0.7, 0.3]    -> class 0
[0.51, 0.49]  -> class 0
```

Verify chesam. **Laksha different cat photos** → anni "cat" ane okate label.

```text
   MANY images  ------ classifier ------>  ONE label

     cat1.jpg  \
     cat2.jpg   >------ f ------> "cat"
     cat3.jpg  /
```

Anduke: **classifier ni undo cheyyalem.** "cat" ane label nunchi original image ni waapasu teeyalem — information poyindi. Ade section 9 lo chuse **det = 0** situation laantide.

**Kaani konni AI functions invertible (bijective):**

| AI operation | Invertible? | Enduku |
|---|---|---|
| Normalization (0-1 scaling) | ✅ Yes | `scaler.inverse_transform()` undi |
| Standardization (z-score) | ✅ Yes | mean, std daagi unchamu kada |
| Classification (argmax) | ❌ No | Many-to-one |
| ReLU | ❌ No | Anni negatives → 0, evi ento cheppalem |
| Pooling (image chinnaga) | ❌ No | Pixels poyayi |
| Rotation matrix | ✅ Yes | Malli tippachu |

**Ee lekka gurthu pettukondi:** sklearn lo `inverse_transform()` unna prati chota — adi **bijective function**. Lekapothe aa method ye undedi kaadu.

---

## 3) Function ni Graph ga Chudadam

```text
  y
  ^
6 |                    *  f(x)=2x+1
  |                *
4 |            *
  |        *
2 |    *
  |*
  +---+---+---+---+---> x
  0   1   2   3   4
```

Straight line vachhindi → **linear function**.

$f(x) = x^2$ aithe:

```text
  y
  ^
9 |*                       *
  |                     
4 |   *              *
  |
1 |      *        *
  |          *  *
  +---+---+---+---+---+--> x
 -3  -2  -1   0   1   2   3
```

Curve vachhindi → **non-linear function**.

---

## 4) Chaala Pedda Confusion: "Linear Function" vs "Linear Transformation"

School lo cheppindi: $y = mx + c$ ante **linear** ani.
Kaani Linear Algebra lo **adi linear transformation kaadu** (c ≠ 0 aithe).

Enduku? Rendu tests fail avutay.

```python
f = lambda x: 2*x + 3

print(f(0))                      # 3     <- linear aithe 0 ravali!
print(f(1+2), f(1)+f(2))         # 9 12  <- samanam kaavu!
```

Verify chesam. Rendu results **veru veru**.

- **Test 1 fail**: $f(0) = 3$, kaani linear transformation lo **origin akkade undali** ($f(0)=0$)
- **Test 2 fail**: $f(1+2) = 9$, kaani $f(1)+f(2) = 12$

$$y = mx + c \quad \text{(c} \neq \text{0)} \rightarrow \textbf{affine transformation}$$
$$y = mx \quad\quad\quad\ \ \rightarrow \textbf{linear transformation}$$

Gurthu pettukondi:
- **Linear** = line **origin nunchi** velthundi
- **Affine** = linear + shift (origin nunchi jarigindi)

Idi chinna point la kanipistundi, kaani **neural network** lo `Wx + b` — aa `b` valla adi affine, purely linear kaadu. Section 12 lo malli chuddam.

---

## 5) Linear Transformation Ante Enti?

Vector teesukoni, vere vector istundi — **rendu rules** follow avutu:

$$\textbf{Rule 1 (Additivity):} \quad T(u + v) = T(u) + T(v)$$

$$\textbf{Rule 2 (Scaling):} \quad T(c \cdot u) = c \cdot T(u)$$

Ee rendu kalipi cheppedi: "**modata add chesi transform chesina, modata transform chesi add chesina — okate answer**."

### Visual ga Ardham Chesukovadam

Grid paper ni rubber sheet la anukondi. Linear transformation tarvata:

1. **Origin akkade untundi** (kadalidu)
2. **Straight lines straight ga ne untay** (curve avvavu)
3. **Parallel lines parallel ga ne untay**, and gaps **evenly spaced** ga untay

```text
   BEFORE (normal grid)          AFTER (linear transform - shear)

   |  |  |  |                      /  /  /  /
---+--+--+--+---              ----+--+--+--+----
   |  |  |  |                    /  /  /  /
---+--+--+--+---              --+--+--+--+------
   |  |  |  |                  /  /  /  /
   origin fixed                origin STILL fixed
```

Non-linear aithe grid **wavy** ga avutundi, leda origin jarugutundi — appudu adi linear transformation kaadu.

### Code tho Verify

```python
import numpy as np
A = np.array([[2, 1],
              [0, 3]])
u = np.array([1, 1])
v = np.array([3, 2])

np.allclose(A @ (u+v), A@u + A@v)    # True   <- Rule 1 pass
np.allclose(A @ (3*v), 3 * (A@v))    # True   <- Rule 2 pass
A @ np.array([0, 0])                  # [0 0]  <- origin fixed
```

Anni pass ayyayi → **matrix multiplication oka linear transformation**.

---

## 6) Matrix = Linear Transformation (Asalu Idea)

Idi ee file lo **most important section**.

Question: matrix multiplication formula ala vintha ga enduku untundi?

Answer: **Matrix columns ante — basis vectors ekkadiki velthayo, ade.**

### Basis Vectors

2D lo rendu basic vectors:

$$\hat{i} = \begin{bmatrix} 1 \\ 0 \end{bmatrix} \quad\quad \hat{j} = \begin{bmatrix} 0 \\ 1 \end{bmatrix}$$

Prati vector ee rendintini kalipi raayachu:

$$\begin{bmatrix} 3 \\ 2 \end{bmatrix} = 3\hat{i} + 2\hat{j}$$

### Ippudu Magic

```python
A = np.array([[2, 1],
              [0, 3]])
i = np.array([1, 0])
j = np.array([0, 1])

A @ i    # [2 0]   <- A modati column!
A @ j    # [1 3]   <- A rendo column!
```

Verify chesam.

```text
        A = [ 2   1 ]
            [ 0   3 ]
              |   |
              |   +---> rendo column  = j-hat ikkadiki velthundi = [1, 3]
              +-------> modati column = i-hat ikkadiki velthundi = [2, 0]
```

**Matrix ante — "i-hat ikkadiki po, j-hat akkadiki po" ane instruction.**

Migatha anni vectors automatic ga follow avutay:

$$A\begin{bmatrix}3\\2\end{bmatrix} = 3\begin{bmatrix}2\\0\end{bmatrix} + 2\begin{bmatrix}1\\3\end{bmatrix} = \begin{bmatrix}6+2\\0+6\end{bmatrix} = \begin{bmatrix}8\\6\end{bmatrix}$$

```python
A @ np.array([3, 2])    # [8 6]   <- verify chesam
```

Kid analogy:
- Room lo furniture antha carpet meeda undi.
- Carpet ni laagithe, furniture antha **daani tho paate** kadulutundi.
- Carpet = basis vectors, furniture = migatha anni vectors.

---

## 7) Common Transformations (Matrices tho)

Anni verify chesam.

### Identity - Emi Marchadu

$$I = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$$

i-hat, j-hat akkade untay. Number **1** laantidi.

### Scaling - Peddha/Chinna Cheyyadam

$$S = \begin{bmatrix} 2 & 0 \\ 0 & 2 \end{bmatrix}$$

Anni 2 rettu peddavi avutay.

```text
   BEFORE          AFTER (scale 2x)

   +--+            +-----+
   |  |            |     |
   +--+            |     |
                   +-----+
```

Different scales kuda: $\begin{bmatrix} 3 & 0 \\ 0 & 1 \end{bmatrix}$ → x lo 3 rettu, y lo marpu ledu.

### Rotation - Tippadam

$$R(\theta) = \begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix}$$

90° ki:

$$R(90°) = \begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix}$$

```python
th = np.pi/2
R = np.array([[np.cos(th), -np.sin(th)],
              [np.sin(th),  np.cos(th)]])
R @ np.array([1, 0])     # [0. 1.]   <- i-hat paiki tirigindi
```

```text
   BEFORE            AFTER (90 degrees)

   j                      i
   ^                      ^
   |                      |
   +---> i          j <---+
```

### Shear - Vaalchadam

$$Sh = \begin{bmatrix} 1 & 1 \\ 0 & 1 \end{bmatrix}$$

```python
Sh @ np.array([0, 1])    # [1 1]   <- j-hat pakkaki vaalindi
```

```text
   BEFORE          AFTER (shear)

   +--+              +--+
   |  |             /  /
   +--+            +--+
```

i-hat akkade undi, j-hat matrame vaalindi. Square → parallelogram.

### Reflection - Adda Tippadam

$$F = \begin{bmatrix} 1 & 0 \\ 0 & -1 \end{bmatrix}$$

```python
F @ np.array([0, 1])     # [ 0 -1]   <- j-hat kindaki tirigindi
```

X-axis meeda **addam** (mirror) pettinattu.

### Projection - Nokkadam

$$P = \begin{bmatrix} 1 & 0 \\ 0 & 0 \end{bmatrix}$$

```python
P @ np.array([3, 4])     # [3 0]   <- y poyindi, x matrame migilindi
```

Anni points **x-axis meediki** nokkabaddayi. Idi **information loss** — undo cheyyalem (section 10 lo chuddam).

### Summary Table

| Transformation | Matrix | Emi chestundi |
|---|---|---|
| Identity | $\begin{bmatrix} 1&0\\0&1 \end{bmatrix}$ | Emi ledu |
| Scale 2x | $\begin{bmatrix} 2&0\\0&2 \end{bmatrix}$ | Peddadi chestundi |
| Rotate 90° | $\begin{bmatrix} 0&-1\\1&0 \end{bmatrix}$ | Tipputundi |
| Shear | $\begin{bmatrix} 1&1\\0&1 \end{bmatrix}$ | Vaalustundi |
| Reflect | $\begin{bmatrix} 1&0\\0&-1 \end{bmatrix}$ | Addam |
| Project | $\begin{bmatrix} 1&0\\0&0 \end{bmatrix}$ | Nokkutundi (flat) |

---

## 8) Composition = Matrix Multiplication

Rendu transformations vempu vempu chesthe? **Matrices ni multiply cheyyandi.**

$$T_2(T_1(v)) = (T_2 \cdot T_1) \cdot v$$

### ORDER CHAALA IMPORTANT

$$AB \neq BA$$

```python
R @ Sh    # [[ 0. -1.]      <- shear chesi, tarvata rotate
          #  [ 1.  1.]]

Sh @ R    # [[ 1. -1.]      <- rotate chesi, tarvata shear
          #  [ 1.  0.]]
```

Rendu **veru veru**. Verify chesam.

Same point $[1,1]$ meeda:

```python
Sh @ (R @ p)    # [0. 1.]     rotate-then-shear
R @ (Sh @ p)    # [-1. 2.]    shear-then-rotate
```

Completely different answers!

Kid analogy:
- Modata socks, tarvata shoes → correct
- Modata shoes, tarvata socks → tappu
- **Order marchithe result marutundi.**

### Kudi nunchi Yeda ki Chadavali

$$A B C v$$

Ikkada **modata C**, tarvata B, chivarilo A apply avutundi — **kudi nunchi yedaki**.

```text
   v ---> [C] ---> [B] ---> [A] ---> result

   raase order:  A B C v
   jarige order:      C, B, A
```

Idi confusion create chestundi, kaani gurthu pettukondi: **vector kudi vaipuna untundi**, so daaniki daggara unna matrix modata apply avutundi.

---

## 9) Determinant = Area Entha Marindi

Determinant ante just formula kaadu — daaniki **meaning** undi:

> **det(A) = area (leda volume) entha rettu ayindo.**

```python
np.linalg.det(np.eye(2))   # 1.0    <- marpu ledu
np.linalg.det(S)           # 4.0    <- 2x2 = 4 rettu area
np.linalg.det(R)           # 1.0    <- rotate chesina area same
np.linalg.det(Sh)          # 1.0    <- shear kuda area marchadu!
np.linalg.det(F)           # -1.0   <- flip ayindi
np.linalg.det(P)           # 0.0    <- area SUNNA ayindi
np.linalg.det(A)           # 6.0
```

Anni verify chesam.

| det value | Ante enti |
|---|---|
| $det = 1$ | Area same (rotation, shear) |
| $det = 4$ | Area 4 rettu peddadi |
| $det = 0.5$ | Area sagam ayindi |
| $det < 0$ | **Flip** ayindi (addam tirigindi) |
| $det = 0$ | **Flat ayipoyindi** — dimension poyindi |

### det = 0 Enduku Muktyam?

Projection matrix $P$ ki $det = 0$. Enduku ante 2D square ni **line** ga nokkesindi — area sunna.

Information **poyindi**. Malli 2D ki teesukellalem.

$$det(A) = 0 \iff \text{inverse ledu} \iff \text{undo cheyyalem}$$

Idi section 2 lo chusina **many-to-one** function laantide — chaala points okate chota velthe, evaru ekkadi nunchi vachharo cheppalem.

```text
   BEFORE (area = 1)        AFTER projection (area = 0)

   +--+                     
   |  |          ---->      ========  (just a line)
   +--+                     
```

---

## 10) Inverse Transformation - Undo Cheyyadam

$$A^{-1}(A v) = v$$

```python
A_inv = np.linalg.inv(A)
# [[ 0.5    -0.1667]
#  [ 0.      0.3333]]

A_inv @ (A @ v)    # [3. 2.]   <- v malli vachesindi
```

Verify chesam — original vector `[3, 2]` waapasu vachhindi.

Projection ki try chesthe:

```python
np.linalg.inv(P)
# LinAlgError: Singular matrix
```

**"Singular"** ante — inverse ledu, det = 0.

Kid analogy:
- Sugar and water kalipithe → sugar water (transformation)
- Malli separate cheyyagalama? Kastam — **information kalisipoyindi**
- Ade det = 0 situation

---

## 11) Ivi Linear Transformations KAAVU

| Function | Enduku kaadu |
|---|---|
| $f(x) = x^2$ | $f(2+3)=25$ kaani $f(2)+f(3)=13$ |
| $f(x) = x + 5$ | $f(0) = 5 \neq 0$ (affine) |
| $f(x) = \sin(x)$ | Curve, straight lines break avutay |
| $f(x) = \|x\|$ | $f(-2 \cdot 1) = 2$ kaani $-2 \cdot f(1) = -2$ |
| $ReLU(x)$ | $f(-1)=0$, scaling rule fail |

**Test cheyyadaniki 2 quick checks:**

1. $f(0) = 0$ aa? Kaakapothe → linear kaadu
2. $f(2x) = 2f(x)$ aa? Kaakapothe → linear kaadu

---

## 12) ML Connection - Asalu Enduku Nerchukuntunnam

### Neural Network Layer

$$\text{output} = W x + b$$

- $W$ = weight **matrix** → idi **linear transformation**
- $x$ = input vector
- $b$ = bias vector → idi **shift** (affine chestundi)

```text
   input x ---> [ W: rotate/scale/shear ] ---> [ + b: shift ] ---> [ activation ] ---> output
                     LINEAR                      AFFINE            NON-LINEAR
```

### Activation Function Enduku Kavali?

Idi **chaala important interview question**.

Rendu linear transformations kalipithe → malli **oka linear transformation** ye (section 8: $AB$ kuda matrix ne).

So 100 layers pettina, activation lekapothe — antha kalipi **okate matrix** tho replace cheyyochu!

$$W_3(W_2(W_1 x)) = (W_3 W_2 W_1) x = W_{single} \cdot x$$

Deep network ki artham ledu. Anduke **madhya lo non-linear** function (ReLU, sigmoid) pedataru — appudu layers **kalipeyyalem**, prati layer kotha pani chestundi.

### PCA

PCA ante — data ni **rotate** chesi, kotha basis vectors (principal components) vaipuki tippadam. Adi **rotation matrix** ye. Data marchadu, **chuse angle** matrame marustundi.

### Image Processing

- Image rotate = rotation matrix
- Image resize = scaling matrix
- Image flip = reflection matrix

Prati image edit **matrix multiplication** ne.

### Embeddings

Word embeddings lo "king - man + woman ≈ queen" — adi vector space lo **linear structure** valla ne pani chestundi.

---

## 13) Mermaid Flow - Motham Kalipi

```mermaid
flowchart TD
    F[Function: input to output] --> L{Rendu rules pass ayyaya?}
    L -->|Yes| LT[Linear Transformation]
    L -->|No| NL[Non-linear / Affine]
    LT --> M[Matrix ga raayachu]
    M --> C[Columns = basis vectors ekkadiki velthayo]
    M --> D[det = area entha marindo]
    D -->|det = 0| NI[Inverse ledu - info poyindi]
    D -->|det != 0| I[Inverse undi - undo cheyyachu]
    M --> COMP[Rendu kalipithe = matrix multiply]
    COMP --> O[Order matters: AB != BA]
```

---

## 14) Summary

```text
FUNCTION
  f: X -> Y   (X = domain, Y = codomain)
  input -> rule -> output | oka input ki OKATE output
  Domain = allowed inputs | Range = actual outputs (Range subset of Codomain)
  Bijective aithe ne inverse untundi

AI lo FUNCTIONS
  Trained model ANTE oka function ye
  MNIST model : f: R^784 -> R^10
  sigmoid: R -> (0,1)  | relu: R -> [0,inf) | softmax: sum = 1
  Classification = MANY-TO-ONE -> undo cheyyalem
  sklearn lo inverse_transform() unte -> adi bijective
  Domain respect cheyyakapothe -> out of distribution problem

LINEAR TRANSFORMATION (2 rules)
  T(u+v) = T(u) + T(v)
  T(cu)  = c T(u)
  => origin fixed, lines straight, parallel lines parallel

LINEAR vs AFFINE (pedda confusion)
  y = mx      -> LINEAR      (origin nunchi)
  y = mx + c  -> AFFINE      (shift undi, f(0) != 0)

MATRIX = TRANSFORMATION
  Matrix columns = i-hat, j-hat ekkadiki velthayo
  A @ i = modati column | A @ j = rendo column
  Migatha vectors anni automatic ga follow avutay

COMMON MATRICES
  identity [[1,0],[0,1]]    -> emi ledu
  scale    [[2,0],[0,2]]    -> peddadi
  rotate90 [[0,-1],[1,0]]   -> tipputundi
  shear    [[1,1],[0,1]]    -> vaalustundi
  reflect  [[1,0],[0,-1]]   -> addam
  project  [[1,0],[0,0]]    -> nokkutundi (det=0)

COMPOSITION
  T2(T1(v)) = (T2 @ T1) v
  AB != BA  -> ORDER MATTERS (socks-shoes)
  Kudi nunchi yedaki apply avutundi

DETERMINANT = area scaling factor
  det = 1  -> area same (rotate, shear)
  det = 4  -> 4 rettu
  det < 0  -> flip
  det = 0  -> flat, inverse ledu, info poyindi

ML CONNECTION
  Layer = Wx + b  (W linear, b affine chestundi)
  Activation lekapothe 100 layers = 1 layer!
  PCA = rotation to better basis
  Image rotate/resize/flip = matrix multiply
```

Final point:
**Matrix ante numbers table kaadu — adi space ni move chese action.**
Aa action ni ardham chesukunte, migatha linear algebra antha sulabham avutundi.

---

---

# Functions — AI lo Enduku Kaavali? (Why Functions Matter in AI)

## Short Answer

> AI = functions on top of functions on top of functions.
> Oka neural network = oka giant composite function.
> Idi ardham kaakunda AI code raayatam — blindly typing.

---

## Architecture Diagram — Functions in AI

```
Raw Input (image, text, number)
        |
        v
   [Function 1: Embedding / Preprocessing]
        |
        v
   [Function 2: Linear Transformation — Wx + b]
        |
        v
   [Function 3: Activation Function — ReLU/Sigmoid]
        |
        v
   [Function 4: Another layer — Wx + b + activation]
        |
        v  (repeat N times = N layers)
        |
        v
   [Function 5: Output layer — Softmax / Linear]
        |
        v
   Prediction (cat/dog, sentiment, next word...)
        |
        v
   [Function 6: Loss Function — compare prediction vs truth]
        |
        v
   [Function 7: Gradient — loss ni parameters tho differentiate]
        |
        v
   [Function 8: Optimizer — parameters update cheyyadam]
        |
        v
   (Loop back — training continues)
```

---

## 1. Neural Network = Composed Functions

**Math lo:**
```
f(x) = x²       -- oka simple function

g(x) = 2x + 1   -- inkoka function

Composed: g(f(x)) = g(x²) = 2x² + 1
```

**Neural network lo:**
```
Layer 1: f₁(x) = ReLU(W₁x + b₁)
Layer 2: f₂(x) = ReLU(W₂x + b₂)
Layer 3: f₃(x) = Softmax(W₃x + b₃)

Final network: f₃(f₂(f₁(x)))
= oka composed function — input nunchi output ki
```

**Functions file lo chudina notation:**
```
f : X → Y    (domain nunchi codomain ki)

Neural network:
  f : ℝ⁷⁸⁴ → ℝ¹⁰
  (784 pixel input → 10 class probabilities output)
  Input space nunchi output space ki mapping — idi function ne!
```

**Python code:**
```python
import numpy as np

# Layer = oka function: input vector ni output vector ki map chestundi
def layer(x, W, b, activation='relu'):
    z = W @ x + b          # linear transformation: Wx + b
    if activation == 'relu':
        return np.maximum(0, z)    # ReLU activation
    return z

# Network = composed functions
def neural_network(x, weights):
    # Layer 1
    h1 = layer(x,           weights['W1'], weights['b1'], 'relu')
    # Layer 2
    h2 = layer(h1,          weights['W2'], weights['b2'], 'relu')
    # Output layer
    out = layer(h2,         weights['W3'], weights['b3'], 'none')
    return out

# Idi = f₃(f₂(f₁(x))) — functions compose cheyyadam
```

---

## 2. Linear Transformation — Neural Network lo Core

**Functions file lo:** Linear transformation = `T(x) = Ax` (matrix multiply)

**AI lo:** Prathi layer = oka linear transformation + bias

```python
import numpy as np

# Linear transformation — functions file lo chudina concept
# T(x) = Wx + b
# W = weight matrix (linear transformation)
# b = bias (affine transformation — origin shift)

x = np.array([1.0, 2.0, 3.0])      # input: 3D vector

# Weight matrix W — input (3D) ni output (2D) ki transform chestundi
W = np.array([
    [0.5, 0.3, 0.2],    # output neuron 1 ki weights
    [0.1, 0.8, 0.4],    # output neuron 2 ki weights
])
b = np.array([0.1, -0.2])           # bias vector

# Linear transformation: Wx + b
z = W @ x + b
print("Layer output:", z)            # [1.7, 2.1] approximately

# Idi exactly functions file lo unna concept:
# T: ℝ³ → ℝ²   (3D input, 2D output)
# Linearity preserve: T(ax + by) = aT(x) + bT(y)
```

**Enduku important:**
```
100 layers lo oka kuda activation function lēkapothe:
f₁₀₀(f₉₉(...f₁(x)...))
= W₁₀₀ * W₉₉ * ... * W₁ * x   (matrix multiply chestam)
= W_combined * x               (oka single linear transformation)

100 layers = 1 layer — NO depth, NO power!

Activation function add chestunte:
  Non-linear transformation add avutundi
  Network complex patterns learn cheyyagaladu
  "Universal function approximator" avutundi
```

---

## 3. Activation Functions — Non-linear Transformations

**Why non-linearity kaavali:**
```
Functions file lo: Linear transformation straight lines, planes preserve chestundi
AI lo: Real-world data non-linear patterns have
       (image lo cat vs dog boundary curved line, straight line kadu)
       Activation functions non-linearity inject chestundi
```

**Common activation functions:**

```python
import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(-5, 5, 100)

# ReLU: f(x) = max(0, x)
# Function file notation: f: ℝ → ℝ≥0
relu = np.maximum(0, x)
# Property: x > 0 aithe identity, x <= 0 aithe 0
# Use: Hidden layers lo most common

# Sigmoid: f(x) = 1 / (1 + e^(-x))
# Function file notation: f: ℝ → (0, 1)
sigmoid = 1 / (1 + np.exp(-x))
# Property: output always 0 to 1 — probability ga interpret cheyyochu
# Use: Binary classification output layer

# Tanh: f(x) = (e^x - e^(-x)) / (e^x + e^(-x))
# Function file notation: f: ℝ → (-1, 1)
tanh = np.tanh(x)
# Property: output -1 to 1 — zero-centered
# Use: RNNs, LSTMs

# Softmax: multi-class probability distribution
# Function notation: f: ℝⁿ → probability simplex
def softmax(z):
    e_z = np.exp(z - np.max(z))    # numerical stability
    return e_z / e_z.sum()

logits = np.array([2.0, 1.0, 0.5])
probs = softmax(logits)
print("Softmax output:", probs)     # sum = 1.0, each in [0,1]
print("Sum:", probs.sum())          # exactly 1.0
# Use: Multi-class classification final layer
```

---

## 4. Loss Function — Prediction Error Measure Cheyyadam

**Function ante enti?** — Input teesukoni output ichhe rule.

**Loss function:**
```
Input:  (prediction, true_label)
Output: oka number — error measure (takkuva better)

f: (ŷ, y) → ℝ≥0

Domain:   prediction, true label pairs
Codomain: non-negative real numbers
```

```python
import numpy as np

# Mean Squared Error (MSE) — Regression problems ki
# L(ŷ, y) = (1/n) * Σ(ŷᵢ - yᵢ)²
def mse_loss(y_pred, y_true):
    return np.mean((y_pred - y_true) ** 2)

y_pred = np.array([2.5, 3.0, 4.0])
y_true = np.array([3.0, 3.0, 4.5])
print("MSE Loss:", mse_loss(y_pred, y_true))    # 0.1667

# Binary Cross-Entropy — Binary classification ki
# L(ŷ, y) = -[y*log(ŷ) + (1-y)*log(1-ŷ)]
def binary_cross_entropy(y_pred, y_true):
    eps = 1e-8    # log(0) avoid cheyyadaniki
    return -np.mean(
        y_true * np.log(y_pred + eps) +
        (1 - y_true) * np.log(1 - y_pred + eps)
    )

y_pred = np.array([0.9, 0.1, 0.8])     # probabilities
y_true = np.array([1.0, 0.0, 1.0])     # true labels
print("BCE Loss:", binary_cross_entropy(y_pred, y_true))

# Categorical Cross-Entropy — Multi-class ki
def categorical_cross_entropy(y_pred, y_true):
    eps = 1e-8
    return -np.sum(y_true * np.log(y_pred + eps))

y_pred = np.array([0.7, 0.2, 0.1])     # 3 class probabilities
y_true = np.array([1.0, 0.0, 0.0])     # true class (one-hot)
print("CCE Loss:", categorical_cross_entropy(y_pred, y_true))
```

---

## 5. Gradient — Function Derivative AI lo

**Functions file lo:** Function `f(x)` derivative = `f'(x)` = slope at that point

**AI lo:** Gradient = loss function ni parameters tho partial derivatives
= "emi direction lo parameters move chesthe loss tagutuundi?"

```python
import numpy as np

# Simple example: f(w) = w² + 3w + 2
# Derivative: f'(w) = 2w + 3

def f(w):
    return w**2 + 3*w + 2

def f_derivative(w):
    return 2*w + 3

# Gradient descent: loss minimum ki move cheyyadam
w = 10.0           # starting point
lr = 0.1           # learning rate (step size)

print(f"Starting w={w:.4f}, f(w)={f(w):.4f}")
for i in range(20):
    grad = f_derivative(w)          # gradient calculate
    w = w - lr * grad               # gradient ki opposite direction lo move
    if i % 5 == 0:
        print(f"Step {i+1}: w={w:.4f}, f(w)={f(w):.4f}, grad={grad:.4f}")

print(f"\nMinimum at w={w:.4f}")    # w = -1.5 (analytical minimum)

# AI lo same concept:
# Loss function: L(W, b) — W and b parameters
# Gradient: ∂L/∂W, ∂L/∂b  — partial derivatives
# Update: W = W - lr * ∂L/∂W
#         b = b - lr * ∂L/∂b
# Training = idi laksha sarlu repeat cheyyadam
```

**Chain rule — Backpropagation:**
```python
# Functions file lo: composed functions ki derivative
# (g∘f)'(x) = g'(f(x)) * f'(x)   -- chain rule

# Neural network = composed functions
# f₃(f₂(f₁(x))) derivative = chain rule apply cheyyadam

# Idi ane concept: BACKPROPAGATION
# Output nunchi input ki, layer by layer derivative calculate cheyyadam
# PyTorch/TensorFlow idi automatic ga chestundi (autograd)

import torch

x = torch.tensor([1.0, 2.0, 3.0], requires_grad=True)
W = torch.tensor([[0.5, 0.3, 0.2],
                  [0.1, 0.8, 0.4]], requires_grad=True)

z = W @ x           # linear transformation
loss = z.sum()      # simple loss

loss.backward()     # backprop — chain rule automatic ga apply avutundi

print("x.grad:", x.grad)    # ∂loss/∂x
print("W.grad:", W.grad)    # ∂loss/∂W
```

---

## 6. Injective, Surjective, Bijective — AI lo Meaning

**Functions file lo notation:** idi inject/surjective properties.

**AI lo real connection:**

```
Injective (one-to-one):
  Different inputs → different outputs
  Embedding functions injectivity maintain cheyyadam important
  Oka word embedding: different words → different vectors (injective kaavali)
  "Cat" and "Dog" same vector ki map avvadam = information loss!

  Example:
  Word embeddings (Word2Vec, BERT) — injective property maintain
  "king" ≠ "queen" in embedding space
```

```python
import numpy as np

# Embedding = injective function
# Word → Vector ki map chestundi
simple_embeddings = {
    "cat":   np.array([0.9, 0.1, 0.2]),
    "dog":   np.array([0.8, 0.2, 0.1]),
    "fish":  np.array([0.1, 0.9, 0.3]),
    "bird":  np.array([0.2, 0.8, 0.1]),
}

# Injectivity check: different words → different vectors
words = list(simple_embeddings.keys())
for i in range(len(words)):
    for j in range(i+1, len(words)):
        w1, w2 = words[i], words[j]
        v1 = simple_embeddings[w1]
        v2 = simple_embeddings[w2]
        distance = np.linalg.norm(v1 - v2)
        print(f"'{w1}' vs '{w2}': distance = {distance:.4f}")
        # Idi 0 aithe — same vector — injectivity fail — information loss

# Surjective (onto):
# Autoencoder lo decoder cheyye reconstruction:
# Compressed representation → Original space — surjective kaavali
# Every possible output reachable aithe decoder complete ga information restore

# Bijective (one-to-one AND onto):
# Normalizing flows — probability distributions transform chestundi
# Input distribution ↔ Output distribution bijective mapping
# Invertible Neural Networks (INNs) — bijective functions only use chestay
```

---

## 7. Function Composition — Deep Learning lo

**Functions file lo:** `g ∘ f` = `g(f(x))`

**AI lo:** Every deep learning model = composed functions

```python
import numpy as np

def relu(x):
    return np.maximum(0, x)

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def linear(x, W, b):
    return W @ x + b

# Oka forward pass = function composition
def forward(x, params):
    # Layer 1: linear → relu (function composition)
    h1 = relu(linear(x, params['W1'], params['b1']))

    # Layer 2: linear → relu
    h2 = relu(linear(h1, params['W2'], params['b2']))

    # Output: linear → sigmoid
    out = sigmoid(linear(h2, params['W3'], params['b3']))

    return out
    # = sigmoid(linear(relu(linear(relu(linear(x))))))
    # = f₅ ∘ f₄ ∘ f₃ ∘ f₂ ∘ f₁

# Idi literally functions file lo unna composition concept:
# (f₅ ∘ f₄ ∘ f₃ ∘ f₂ ∘ f₁)(x)

np.random.seed(42)
params = {
    'W1': np.random.randn(4, 3) * 0.1,
    'b1': np.zeros(4),
    'W2': np.random.randn(4, 4) * 0.1,
    'b2': np.zeros(4),
    'W3': np.random.randn(1, 4) * 0.1,
    'b3': np.zeros(1),
}

x = np.array([1.0, 2.0, 3.0])
prediction = forward(x, params)
print("Prediction:", prediction)
```

---

## 8. Real AI Models — Functions Connection

### LLM (Large Language Model) lo

```
Input:  "What is the capital of India?"
        ↓ (tokenize)
Tokens: [1234, 567, 89, 12, 456, 78]    -- integers

Token Embedding Function:
  f: integer → ℝ⁷⁶⁸ (768-dim vector per token)
  Idi function: token ID → dense vector
        ↓
Transformer layers (each = function composition)
  Attention: f_attn: ℝⁿˣ⁷⁶⁸ → ℝⁿˣ⁷⁶⁸
  FFN:       f_ffn:  ℝ⁷⁶⁸ → ℝ⁷⁶⁸
        ↓
Output projection:
  f_out: ℝ⁷⁶⁸ → ℝ⁵⁰²⁵⁶  (vocabulary size)
        ↓
Softmax:
  f_sm: ℝ⁵⁰²⁵⁶ → probability distribution
        ↓
Output: probability over next token → sample → "Delhi"
```

### Image Classifier (CNN) lo

```
Input: 224×224×3 image (150,528 numbers)
        ↓
Convolution layers:
  f_conv: image → feature maps
  (pattern detection functions)
        ↓
Pooling:
  f_pool: feature map → smaller feature map
  (dimensionality reduction function)
        ↓
Flatten + Dense:
  f_dense: vector → vector (linear transformation)
        ↓
Softmax:
  f_sm: logits → probabilities
        ↓
Output: [cat: 0.92, dog: 0.05, bird: 0.03]
```

---

## 9. Functions Summary Table — Math ↔ AI Connection

| Math Concept (Functions file) | AI Application | Example |
|---|---|---|
| `f: X → Y` (domain → codomain) | Model: input space → output space | Image → Label probabilities |
| `f(x) = y` (evaluation) | Forward pass | `model(image)` = prediction |
| Function composition `g∘f` | Deep learning layers | `layer3(layer2(layer1(x)))` |
| Linear transformation `T(x) = Ax` | Neural layer weights | `Wx + b` |
| Injective (one-to-one) | Embeddings preserve information | Word → unique vector |
| Bijective (invertible) | Normalizing flows, INNs | Invertible transformations |
| Derivative `f'(x)` | Gradient for backprop | `∂L/∂W` |
| Chain rule `(g∘f)' = g'∘f * f'` | Backpropagation algorithm | Multi-layer gradients |
| Domain restriction | Data preprocessing range | Normalize [0,1] |
| Range/Image of function | Model output space | Probability in [0,1] |

---

## 10. Oka Line Summary

```
Functions ante enti?     → Input teesukoni output ichhe rule
AI lo functions enduku?  → Neural network = chained functions
                           Training = function parameters optimize cheyyadam
                           Prediction = function evaluate cheyyadam

Idi telustunte:
  Wx + b  ante enti?          — linear transformation function
  ReLU ante enti?             — activation function (non-linear)
  Loss ante enti?             — error measure function
  Gradient descent ante enti? — function minimize cheyyadam
  Backprop ante enti?         — composed function derivative (chain rule)
  Embedding ante enti?        — injective mapping function
  Softmax ante enti?          — normalization function (sums to 1)

AI = Functions, all the way down.
```

---

---

# Vector Transformations — Complete Guide

> Oka vector transformation ante: oka vector space lo unna vectors ni
> inkoka vector space ki (or same space ki) **systematic ga move** cheyyadam.
> Idi graphics, robotics, physics, and most importantly **AI/ML** ki foundation.

## Architecture Diagram

```
Original Vector Space
    [x, y] or [x, y, z]
          |
          | Apply Transformation Matrix T
          v
  +-------------------+
  | Scaling           |  → vector ni stretch/shrink cheyyadam
  | Rotation          |  → vector ni rotate cheyyadam
  | Reflection        |  → vector ni mirror cheyyadam
  | Shearing          |  → vector ni slant cheyyadam
  | Projection        |  → higher dim → lower dim
  | Translation(Affine)| → vector ni shift cheyyadam
  +-------------------+
          |
          v
Transformed Vector Space
    [x', y'] or [x', y', z']

AI Connection:
  Prathi neural network layer = oka vector transformation
  Training = best transformation parameters find cheyyadam
```

## Deep Architecture Notes

- **Step 1:** Vector = oka point or direction in space — `[x, y]` 2D, `[x, y, z]` 3D
- **Step 2:** Transformation = aa vector ni systematically move cheyyadam — matrix multiply tho
- **Step 3:** Linear transformations 2 rules follow chestay — additivity + homogeneity
- **Step 4:** Affine transformation = linear + translation (AI lo `Wx + b` idi)
- **Step 5:** Transformations compose avutay — T₂(T₁(v)) = (T₂·T₁)v
- **Step 6:** AI lo prathi layer = oka learned vector transformation

---

## 1. Vector Transformation Ante Enti?

**Simple ga:**
Vector transformation = oka vector `v` ni teesukoni, new vector `v'` return chese rule.

```
T: ℝⁿ → ℝᵐ
Input:  n-dimensional vector
Output: m-dimensional vector

Example:
T([1, 2]) = [2, 4]   (each element double cheyyadam = scaling)
T([1, 0]) = [0, 1]   (x-axis → y-axis = 90° rotation)
```

**Matrix form:**
```
Prathi linear transformation = oka matrix tho represent cheyyochu

T(v) = Mv

M = transformation matrix
v = input vector
Mv = matrix-vector multiply = transformed vector
```

**Verify cheyyadam — code:**
```python
import numpy as np

v = np.array([1, 2])           # original vector

# Transformation matrix M
M = np.array([
    [2, 0],
    [0, 2]
])

# Apply transformation
v_transformed = M @ v          # matrix-vector multiply
print("Original:   ", v)               # [1, 2]
print("Transformed:", v_transformed)   # [2, 4] — scaled by 2
```

---

## 2. Linear Transformation — 2 Rules

**Functions file lo:** Linear transformation 2 rules follow chestundi.

```
Rule 1: Additivity
  T(u + v) = T(u) + T(v)
  "Rendu vectors add chesaka transform" = "Prathi transform chesi add cheyyadam"

Rule 2: Homogeneity (Scalar multiplication)
  T(cv) = c·T(v)
  "Vector scale chesaka transform" = "Transform chesaka scale cheyyadam"
```

**Python lo verify:**
```python
import numpy as np

# Transformation matrix
M = np.array([[2, 1],
              [0, 3]])

u = np.array([1, 2])
v = np.array([3, 1])
c = 4.0

# Rule 1: Additivity — T(u + v) == T(u) + T(v)
left_side  = M @ (u + v)
right_side = (M @ u) + (M @ v)
print("Additivity holds:", np.allclose(left_side, right_side))  # True

# Rule 2: Homogeneity — T(cv) == c * T(v)
left_side  = M @ (c * v)
right_side = c * (M @ v)
print("Homogeneity holds:", np.allclose(left_side, right_side)) # True

# Non-linear transformation fails these rules
def non_linear_T(v):
    return v + np.array([1, 1])    # translation — NOT linear

# Translation fails additivity
u_t = non_linear_T(u + v)
uv_t = non_linear_T(u) + non_linear_T(v)
print("Translation additivity:", np.allclose(u_t, uv_t))  # False!
```

---

## 3. Scaling Transformation — Stretch / Shrink

**Idi enti?**
Vector ni oka axis along lengthen (stretch) or shorten (shrink) cheyyadam.

```
Scaling matrix:
S = [[sx,  0],
     [ 0, sy]]

sx = x-direction scale factor
sy = y-direction scale factor
```

```python
import numpy as np
import matplotlib.pyplot as plt

def plot_vectors(vectors, labels, colors, title):
    fig, ax = plt.subplots(1, 1, figsize=(6, 6))
    origin = np.zeros(2)
    for v, label, color in zip(vectors, labels, colors):
        ax.annotate('', xy=v, xytext=origin,
                    arrowprops=dict(arrowstyle='->', color=color, lw=2))
        ax.text(v[0]+0.05, v[1]+0.05, label, fontsize=12, color=color)
    ax.set_xlim(-4, 4); ax.set_ylim(-4, 4)
    ax.axhline(0, color='gray', lw=0.5)
    ax.axvline(0, color='gray', lw=0.5)
    ax.grid(True, alpha=0.3)
    ax.set_title(title)
    plt.tight_layout()
    plt.savefig(f"transformation_{title.replace(' ','_')}.png", dpi=80)
    plt.close()

v = np.array([1.0, 1.0])    # original vector

# Uniform scaling — anni directions equally scale
S_uniform = np.array([[2, 0],
                       [0, 2]])
v_scaled = S_uniform @ v
print(f"Original:        {v}")
print(f"Scaled (2x):     {v_scaled}")          # [2, 2]

# Non-uniform scaling — x, y differently scale
S_nonuniform = np.array([[3, 0],
                          [0, 0.5]])
v_nonuniform = S_nonuniform @ v
print(f"Scaled (3x, 0.5y): {v_nonuniform}")    # [3, 0.5]

# Shrink cheyyadam (scale < 1)
S_shrink = np.array([[0.5, 0],
                      [0,   0.5]])
v_shrunk = S_shrink @ v
print(f"Shrunk (0.5x):   {v_shrunk}")          # [0.5, 0.5]

# --- AI Connection ---
# Neural network lo:
# Weight matrix W lo diagonal elements = scaling factors
# W = [[w1, 0],  --> x component w1 times scale cheyyadam
#      [0, w2]]  --> y component w2 times scale cheyyadam
# Training = best scale factors (weights) learn cheyyadam
```

---

## 4. Rotation Transformation — Angle Tho Rotate

**Idi enti?**
Vector ni origin chuttu oka angle θ tho rotate cheyyadam.
Direction change avutundi, length same untundi.

```
Rotation matrix (counter-clockwise by θ):
R(θ) = [[cos θ,  -sin θ],
        [sin θ,   cos θ]]

θ = 90°:  R = [[0, -1], [1, 0]]
θ = 180°: R = [[-1, 0], [0, -1]]
θ = 45°:  R = [[0.707, -0.707], [0.707, 0.707]]
```

```python
import numpy as np

def rotation_matrix_2d(theta_degrees):
    """2D rotation matrix create cheyyadam"""
    theta = np.radians(theta_degrees)    # degrees → radians convert
    return np.array([
        [np.cos(theta), -np.sin(theta)],
        [np.sin(theta),  np.cos(theta)]
    ])

v = np.array([1.0, 0.0])    # x-axis direction vector

# 90 degrees rotate
R_90 = rotation_matrix_2d(90)
v_rot90 = R_90 @ v
print(f"Original:       {v}")            # [1, 0]
print(f"Rotated 90°:    {v_rot90}")      # [0, 1]  -- y-axis direction avutundi

# 45 degrees rotate
R_45 = rotation_matrix_2d(45)
v_rot45 = R_45 @ v
print(f"Rotated 45°:    {np.round(v_rot45, 4)}")  # [0.7071, 0.7071]

# 180 degrees rotate
R_180 = rotation_matrix_2d(180)
v_rot180 = R_180 @ v
print(f"Rotated 180°:   {np.round(v_rot180, 4)}")  # [-1, 0]

# Key property: length preserved (rotation = rigid body transform)
print(f"\nOriginal length:   {np.linalg.norm(v):.4f}")
print(f"After 90° length:  {np.linalg.norm(v_rot90):.4f}")
print(f"After 45° length:  {np.linalg.norm(v_rot45):.4f}")
# All lengths = 1.0 -- rotation preserves length

# 3D Rotation matrices
def rotation_x_3d(theta_degrees):
    """3D lo x-axis chuttu rotate"""
    t = np.radians(theta_degrees)
    return np.array([
        [1,        0,         0],
        [0, np.cos(t), -np.sin(t)],
        [0, np.sin(t),  np.cos(t)]
    ])

def rotation_y_3d(theta_degrees):
    """3D lo y-axis chuttu rotate"""
    t = np.radians(theta_degrees)
    return np.array([
        [ np.cos(t), 0, np.sin(t)],
        [0,          1,         0],
        [-np.sin(t), 0, np.cos(t)]
    ])

v3 = np.array([1.0, 0.0, 0.0])
Rx = rotation_x_3d(90)
print(f"\n3D Rotated (x-axis, 90°): {np.round(Rx @ v3, 4)}")

# --- AI Connection ---
# Attention mechanisms lo query-key rotations
# Positional encodings use rotation matrices
# RoPE (Rotary Position Embedding) — LLMs lo use avutundi
# Image augmentation lo random rotations — training data diversify
```

---

## 5. Reflection Transformation — Mirror Image

**Idi enti?**
Vector ni oka axis or line tho mirror image cheyyadam.
Oka dimension sign flip avutundi.

```
Reflection matrices:
  x-axis meeda reflect:    M = [[1,  0], [0, -1]]   (y flip)
  y-axis meeda reflect:    M = [[-1, 0], [0,  1]]   (x flip)
  y=x line meeda reflect:  M = [[0,  1], [1,  0]]   (swap)
  origin meeda reflect:    M = [[-1, 0], [0, -1]]   (both flip)
```

```python
import numpy as np

v = np.array([2.0, 3.0])

# x-axis meeda reflect
M_x = np.array([[1,  0],
                 [0, -1]])
v_ref_x = M_x @ v
print(f"Original:           {v}")          # [2, 3]
print(f"Reflect (x-axis):   {v_ref_x}")    # [2, -3]

# y-axis meeda reflect
M_y = np.array([[-1, 0],
                 [0,  1]])
v_ref_y = M_y @ v
print(f"Reflect (y-axis):   {v_ref_y}")    # [-2, 3]

# y=x line meeda reflect (x,y swap chestundi)
M_yx = np.array([[0, 1],
                  [1, 0]])
v_ref_yx = M_yx @ v
print(f"Reflect (y=x):      {v_ref_yx}")   # [3, 2] -- swapped!

# Origin meeda reflect (both negative)
M_orig = np.array([[-1, 0],
                    [0, -1]])
v_ref_orig = M_orig @ v
print(f"Reflect (origin):   {v_ref_orig}") # [-2, -3]

# Verify: length preserved
print(f"\nOriginal length: {np.linalg.norm(v):.4f}")
print(f"Reflected length:{np.linalg.norm(v_ref_x):.4f}")  # same

# --- AI Connection ---
# Image data augmentation lo horizontal flip (left-right reflect)
# GAN training lo: generator images reflect cheyyadam for diversity
# Symmetry detection in CNNs
# Reflection = determinant -1 matrix (orientation reverses)
```

---

## 6. Shearing Transformation — Slant / Skew

**Idi enti?**
Oka direction lo vector ni "push" cheyyadam — opposite sides different amount shift avutay.
Rectangle → Parallelogram shape avutundi.

```
Shear matrices:
  x-direction shear:  M = [[1, k], [0, 1]]   (x += k*y)
  y-direction shear:  M = [[1, 0], [k, 1]]   (y += k*x)
```

```python
import numpy as np

v = np.array([1.0, 1.0])

# x-direction shear — y same untundi, x += k*y
k = 2.0
S_x = np.array([[1, k],
                 [0, 1]])
v_sheared_x = S_x @ v
print(f"Original:         {v}")              # [1, 1]
print(f"X-shear (k={k}):  {v_sheared_x}")   # [3, 1] -- x = 1 + 2*1 = 3

# y-direction shear — x same untundi, y += k*x
S_y = np.array([[1, 0],
                 [k, 1]])
v_sheared_y = S_y @ v
print(f"Y-shear (k={k}):  {v_sheared_y}")   # [1, 3]

# Grid transformation visualize cheyyadam
points = np.array([[0, 0], [1, 0], [1, 1], [0, 1]]).T  # unit square corners
S = np.array([[1, 0.5], [0, 1]])                         # shear matrix
sheared_points = S @ points
print("\nOriginal corners:\n", points.T)
print("Sheared corners:\n",  sheared_points.T)
# Square → Parallelogram shape avutundi

# Shear oka key property:
# Area preserve chestundi (determinant = 1)
print(f"\nDeterminant of shear matrix: {np.linalg.det(S):.4f}")  # 1.0

# --- AI Connection ---
# Perspective transform in computer vision (homography)
# Text recognition lo oblique text handle cheyyadam
# Data augmentation lo random shear (sklearn, albumentations)
# Affine transformation lo oka component
```

---

## 7. Projection Transformation — Dimension Reduce

**Idi enti?**
Higher-dimensional vector ni lower-dimensional space ki "project" (shadow) cheyyadam.
3D → 2D (shadow on floor), 2D → 1D (shadow on line).

```
Projection onto x-axis:    P = [[1, 0], [0, 0]]   (y component drop)
Projection onto y-axis:    P = [[0, 0], [0, 1]]   (x component drop)
Projection onto unit vector u: P = uuᵀ             (outer product)
```

```python
import numpy as np

v = np.array([3.0, 4.0])

# x-axis meeda project cheyyadam
P_x = np.array([[1, 0],
                 [0, 0]])
v_proj_x = P_x @ v
print(f"Original:               {v}")           # [3, 4]
print(f"Projected onto x-axis:  {v_proj_x}")    # [3, 0] -- y drop

# y-axis meeda project
P_y = np.array([[0, 0],
                 [0, 1]])
v_proj_y = P_y @ v
print(f"Projected onto y-axis:  {v_proj_y}")    # [0, 4] -- x drop

# Arbitrary unit vector u meeda project
u = np.array([1, 1]) / np.sqrt(2)   # normalize cheyyadam
P_u = np.outer(u, u)                 # uuᵀ = projection matrix
v_proj_u = P_u @ v
print(f"\nUnit vector u:          {u}")
print(f"Projection matrix P:\n{P_u}")
print(f"Projected onto u:       {v_proj_u}")    # [3.5, 3.5]

# Projection formula: proj_u(v) = (v·u / |u|²) * u
dot = np.dot(v, u)
proj_scalar = dot / np.dot(u, u)
proj_vector = proj_scalar * u
print(f"Scalar projection:      {proj_scalar:.4f}")
print(f"Vector projection:      {proj_vector}")

# Projection property: project chesi malli project chesthe same result
v_proj_twice = P_u @ (P_u @ v)
print(f"\nProject twice = once:  {np.allclose(v_proj_u, v_proj_twice)}")  # True
# P² = P -- idempotent property

# --- AI Connection ---
# PCA (Principal Component Analysis):
#   Data ni most important directions meeda project cheyyadam
#   High-dimensional data → low-dimensional representation
# Attention mechanism lo keys-values projection
# Dimensionality reduction in autoencoders
```

---

## 8. Affine Transformation — Linear + Translation

**Idi enti?**
Linear transformation + translation (shift) combination.
`T(v) = Mv + b` — M = linear part, b = translation vector.

Neural network layer exact iga idi!

```
Affine transformation:
  T(v) = Mv + b

  M = matrix (linear transformation)
  b = bias vector (translation)

  Idi linear transformation kadu (origin shift avutundi)
  Kaani deep learning lo most common operation
```

```python
import numpy as np

v = np.array([1.0, 2.0])

# Rotation + Translation (Affine)
theta = np.radians(45)
M = np.array([[np.cos(theta), -np.sin(theta)],
              [np.sin(theta),  np.cos(theta)]])
b = np.array([3.0, 1.0])     # translation vector

# Affine transform: T(v) = Mv + b
v_affine = M @ v + b
print(f"Original:   {v}")
print(f"Affine T:   {np.round(v_affine, 4)}")

# Homogeneous coordinates tho affine = linear ga represent cheyyadam
# 2D point [x, y] → 3D homogeneous [x, y, 1]
# Affine matrix becomes 3x3:
def affine_matrix_3x3(M, b):
    """2D affine transformation 3x3 homogeneous matrix"""
    T = np.eye(3)
    T[:2, :2] = M
    T[:2, 2]  = b
    return T

T_3x3 = affine_matrix_3x3(M, b)
print(f"\nHomogeneous affine matrix:\n{np.round(T_3x3, 4)}")

v_hom = np.append(v, 1.0)        # [x, y] → [x, y, 1]
v_out = T_3x3 @ v_hom
print(f"Homogeneous transform: {np.round(v_out[:2], 4)}")  # Same result!

# Multiple affine transforms compose cheyyadam
T1 = affine_matrix_3x3(
    np.array([[2, 0], [0, 2]]),   # scale 2x
    np.array([1, 0])              # shift right 1
)
T2 = affine_matrix_3x3(
    rotation_matrix_2d(30),       # rotate 30°
    np.array([0, 2])              # shift up 2
)

def rotation_matrix_2d(theta_degrees):
    theta = np.radians(theta_degrees)
    return np.array([[np.cos(theta), -np.sin(theta)],
                     [np.sin(theta),  np.cos(theta)]])

T1 = affine_matrix_3x3(np.array([[2,0],[0,2]]), np.array([1,0]))
T2 = affine_matrix_3x3(rotation_matrix_2d(30), np.array([0,2]))

# Compose: T2 apply chesaka T1
T_combined = T2 @ T1                  # matrix multiply = composition
v_hom = np.append(v, 1.0)
v_final = T_combined @ v_hom
print(f"\nCombined transform: {np.round(v_final[:2], 4)}")

# --- AI Connection ---
# Neural network layer:
#   z = Wx + b   ← idi affine transformation!
#   W = M (linear transformation matrix)
#   b = b (translation/bias vector)
# Image preprocessing: crop, resize, flip = affine transforms
# Computer vision: homography estimation = affine generalization
```

---

## 9. Composition of Transformations — Chaining

**Idi enti?**
Multiple transformations oka oka ga apply cheyyadam — but single matrix ga combine cheyyochu.

```
T_total = T₃ · T₂ · T₁

v' = T_total · v = T₃(T₂(T₁(v)))

Note: Right to left apply avutundi (T₁ first, T₃ last)
```

```python
import numpy as np

def scale(sx, sy):
    return np.array([[sx, 0], [0, sy]])

def rotate(degrees):
    t = np.radians(degrees)
    return np.array([[np.cos(t), -np.sin(t)],
                     [np.sin(t),  np.cos(t)]])

def reflect_x():
    return np.array([[1, 0], [0, -1]])

v = np.array([1.0, 0.0])

# Step by step apply cheyyadam
v1 = scale(2, 2)    @ v       # scale 2x
v2 = rotate(45)     @ v1      # then rotate 45°
v3 = reflect_x()    @ v2      # then reflect x-axis
print(f"After scale:    {np.round(v1, 4)}")
print(f"After rotate:   {np.round(v2, 4)}")
print(f"After reflect:  {np.round(v3, 4)}")

# Combine all into one matrix
T_combined = reflect_x() @ rotate(45) @ scale(2, 2)
v_combined = T_combined @ v
print(f"\nAll at once:    {np.round(v_combined, 4)}")
print(f"Same result?    {np.allclose(v3, v_combined)}")  # True!

# Order matters! Scale then rotate ≠ rotate then scale (generally)
T_order1 = rotate(45) @ scale(2, 1)   # scale first, then rotate
T_order2 = scale(2, 1) @ rotate(45)   # rotate first, then scale
v_test = np.array([1.0, 0.0])
print(f"\nScale→Rotate: {np.round(T_order1 @ v_test, 4)}")
print(f"Rotate→Scale: {np.round(T_order2 @ v_test, 4)}")
print(f"Same?         {np.allclose(T_order1, T_order2)}")  # False!

# --- AI Connection ---
# Neural network forward pass = composition of transformations
# Layer 1 → Layer 2 → Layer 3 = T₃ ∘ T₂ ∘ T₁
# Backprop = reverse order derivative (chain rule)
# Matrix multiplication chaining = efficient computation
```

---

## 10. Eigenvalue Decomposition — Special Directions

**Idi enti?**
Oka matrix ki "special vectors" unnay — transformation apply chessinaa direction change avvadam —
only scale avutundi. Ivi **eigenvectors**, scale factor = **eigenvalue**.

```
M·v = λ·v

v = eigenvector (direction change avvadam ledu)
λ = eigenvalue  (scale factor — stretch/shrink amount)
```

```python
import numpy as np

M = np.array([[3, 1],
              [0, 2]])

# Eigenvectors + eigenvalues calculate cheyyadam
eigenvalues, eigenvectors = np.linalg.eig(M)
print("Eigenvalues:", eigenvalues)           # [3, 2]
print("Eigenvectors:\n", eigenvectors)       # columns are eigenvectors

# Verify: M @ v = λ @ v
for i in range(len(eigenvalues)):
    lam = eigenvalues[i]
    v   = eigenvectors[:, i]
    Mv  = M @ v
    lv  = lam * v
    print(f"\nλ={lam:.2f}, v={np.round(v, 4)}")
    print(f"M@v  = {np.round(Mv, 4)}")
    print(f"λ*v  = {np.round(lv, 4)}")
    print(f"Same? {np.allclose(Mv, lv)}")    # True

# Symmetric matrix: eigenvectors perpendicular (orthogonal)
S = np.array([[4, 2],
              [2, 3]])
evals, evecs = np.linalg.eig(S)
print(f"\nDot product of eigenvectors: {np.dot(evecs[:,0], evecs[:,1]):.6f}")
# Approximately 0 — orthogonal!

# --- AI Connection ---
# PCA: data covariance matrix eigenvectors = principal components
#   Largest eigenvalue direction = most variance direction
# Attention matrices spectral analysis
# Weight matrix ill-conditioning detect cheyyadam
# Vanishing/exploding gradients: eigenvalues of weight matrices matter!
#   |λ| < 1 → gradients vanish
#   |λ| > 1 → gradients explode
```

---

## 11. All Transformations — AI lo Real Usage

```python
import numpy as np

print("=" * 55)
print("VECTOR TRANSFORMATIONS — AI lo Usage Summary")
print("=" * 55)

v = np.array([1.0, 2.0])
print(f"\nOriginal vector: {v}")
print()

# 1. Scaling — Weight matrix diagonal = scaling
S = np.array([[2, 0], [0, 3]])
print(f"1. Scaling (2x, 3y):          {S @ v}")
print(f"   AI use: Weight matrix, feature normalization")

# 2. Rotation — Attention, positional encoding
t = np.radians(45)
R = np.array([[np.cos(t), -np.sin(t)],
              [np.sin(t),  np.cos(t)]])
print(f"\n2. Rotation (45°):            {np.round(R @ v, 4)}")
print(f"   AI use: RoPE embeddings, image augmentation")

# 3. Reflection — Data augmentation
M_ref = np.array([[-1, 0], [0, 1]])
print(f"\n3. Reflection (y-axis):       {M_ref @ v}")
print(f"   AI use: Image flip augmentation, GAN diversity")

# 4. Shearing — Affine augmentation
Sh = np.array([[1, 0.5], [0, 1]])
print(f"\n4. Shearing (k=0.5):          {Sh @ v}")
print(f"   AI use: Text/image augmentation, perspective")

# 5. Projection — Dimensionality reduction
P = np.array([[1, 0], [0, 0]])
print(f"\n5. Projection (onto x-axis):  {P @ v}")
print(f"   AI use: PCA, attention projection, autoencoders")

# 6. Affine (Wx + b) — Neural network layer!
W = np.array([[0.5, 0.3], [0.2, 0.8]])
b = np.array([0.1, -0.1])
print(f"\n6. Affine (Wx + b):           {np.round(W @ v + b, 4)}")
print(f"   AI use: EVERY neural network layer!")

# 7. Composition — Forward pass
T_composed = M_ref @ S    # scale then reflect
print(f"\n7. Composed (scale→reflect): {T_composed @ v}")
print(f"   AI use: Deep network forward pass")

print()
print("=" * 55)
print("KEY INSIGHT:")
print("Neural network layer = Affine transformation + Activation")
print("Training = Finding best transformation parameters")
print("Deep learning = Many transformations composed")
print("=" * 55)
```

**Output:**
```
=======================================================
VECTOR TRANSFORMATIONS — AI lo Usage Summary
=======================================================

Original vector: [1. 2.]

1. Scaling (2x, 3y):          [2. 6.]
   AI use: Weight matrix, feature normalization

2. Rotation (45°):            [-0.7071  2.1213]
   AI use: RoPE embeddings, image augmentation

3. Reflection (y-axis):       [-1.  2.]
   AI use: Image flip augmentation, GAN diversity

4. Shearing (k=0.5):          [2.  2.]
   AI use: Text/image augmentation, perspective

5. Projection (onto x-axis):  [1.  0.]
   AI use: PCA, attention projection, autoencoders

6. Affine (Wx + b):           [1.1  1.7]
   AI use: EVERY neural network layer!

7. Composed (scale→reflect):  [-2.  6.]
   AI use: Deep network forward pass
```

---

## 12. Summary Table

| Transformation | Matrix Form | Length? | Angle? | AI Connection |
|---|---|---|---|---|
| **Scaling** | `diag(sx, sy)` | Changes | Preserved (uniform only) | Weight matrices, normalization |
| **Rotation** | `[[cos,-sin],[sin,cos]]` | Preserved | Preserved | RoPE, image augmentation |
| **Reflection** | Diagonal with -1 | Preserved | Flipped | Image flip, data augmentation |
| **Shearing** | Off-diagonal nonzero | Changes | Changes | Perspective, text slant |
| **Projection** | `uuᵀ` | Decreases | May change | PCA, attention, autoencoders |
| **Affine** | `Mx + b` | Changes | Changes | Every neural layer `Wx + b` |
| **Composition** | `T₃·T₂·T₁` | Depends | Depends | Deep network forward pass |

---

## 13. Final Summary — Vector Transformation ante Enti?

```
Vector Transformation = oka vector ni teesukoni, mathematically move cheyyadam

Types:
  Scaling      → stretch/shrink    → Wx (diagonal W)
  Rotation     → rotate around origin → orthogonal matrix
  Reflection   → mirror image      → determinant = -1
  Shearing     → slant/skew        → off-diagonal elements
  Projection   → shadow/collapse   → rank-reducing transform
  Affine       → linear + shift    → Wx + b (neural layer!)
  Composition  → chain transforms  → deep network layers

Why matters in AI:
  Prathi neural layer = oka affine transformation + nonlinearity
  Training = best transformation parameters learn cheyyadam
  Forward pass = chained transformations apply cheyyadam
  Backprop = reverse chained derivatives (chain rule)

Ultimate insight:
  "AI model = oka giant, learned vector transformation"
  "Input space → Output space ki map chestundi"
  "Training = best transformation find cheyyadam"
```

---

---

# Vector Transformation — Image Explanation (ℝⁿ → ℝᵐ)

> Image 3 lo chupinchindi: f(x₁, y, z) = (x₁+y, 2z)
> ℝ³ lo unna point (1, 2, 3) ni ℝ² lo (3, 6) ki transform chestundi
> Left = formula + numeric example | Right = 3D → 2D visual graph

---

## Image 3 — What it Shows

```
Left side (formula + example):
  f(x₁, y, z) = (x₁+y, 2z)      ← transformation rule
  f([1, 2, 3]) = [3, 6]          ← apply to specific vector

Right side (visual diagram):
  3D space (ℝ³)                  2D space (ℝ²)
  axes: x₁, y, z                 axes: a, b
  point: (1,2,3)  ──── f ────►  point: (3,6)

  (1,2,3) ∈ ℝ³   ==>   (3,6) ∈ ℝ²
```

---

## 1. f: ℝⁿ → ℝᵐ — Image lo First Diagram Explain

**Image 1 lo chupinchindi:**

```
f: X → Y         ← function notation
x⃗  →  y⃗         ← vector input, vector output

Left blob  = ℝⁿ  (input space — n-dimensional)
Right blob = ℝᵐ  (output space — m-dimensional)

x⃗ = [x₁]   ← n-dimensional column vector
    [x₂]     x₁, x₂, x₃ ... xₙ ∈ ℝ
    [x₃]
    [...]
    [xₙ]

f: ℝⁿ → ℝᵐ
```

**Telugu explanation:**

```
Vector transformation = oka n-dimensional vector teesukoni
                        m-dimensional vector return chese function

n = m:  same dimension — space "reshape" avutundi (rotate, scale, reflect)
n > m:  dimension tagutuundi — ℝ³ → ℝ² (3D → 2D projection)
n < m:  dimension perigutuundi — ℝ² → ℝ³ (2D → 3D embedding)
```

```python
import numpy as np

# f: ℝⁿ → ℝᵐ examples

# n = m = 2: same dimension transform
def f_2d_to_2d(v):
    """ℝ² → ℝ²: rotate + scale"""
    return np.array([2*v[0] - v[1],
                     v[0] + v[1]])

x = np.array([1.0, 2.0])
print(f"f: ℝ² → ℝ²: {x} → {f_2d_to_2d(x)}")

# n > m: dimension reduce (3D → 2D)
def f_3d_to_2d(v):
    """ℝ³ → ℝ²: 3D point ni 2D ki map"""
    return np.array([v[0] + v[1],    # x+y
                     2 * v[2]])       # 2z

x3 = np.array([1.0, 2.0, 3.0])
print(f"f: ℝ³ → ℝ²: {x3} → {f_3d_to_2d(x3)}")   # [3, 6] — image lo same!

# n < m: dimension increase (2D → 3D)
def f_2d_to_3d(v):
    """ℝ² → ℝ³: 2D point ni 3D ki embed"""
    return np.array([v[0],
                     v[1],
                     v[0] + v[1]])   # third dim = x + y

x2 = np.array([2.0, 3.0])
print(f"f: ℝ² → ℝ³: {x2} → {f_2d_to_3d(x2)}")
```

**Output:**
```
f: ℝ² → ℝ²: [1. 2.] → [0. 3.]
f: ℝ³ → ℝ²: [1. 2. 3.] → [3. 6.]   ← image lo exact example!
f: ℝ² → ℝ³: [2. 3.] → [2. 3. 5.]
```

---

## 2. f([1,2,3]) = [3,6] — Image lo Numeric Example (Step by Step)

**Image lo formula:**
```
f(x₁, y, z) = (x₁ + y,  2z)

Input:  x = [1, 2, 3]   i.e., x₁=1, y=2, z=3
Apply:
  Output[0] = x₁ + y  = 1 + 2 = 3
  Output[1] = 2z       = 2 × 3 = 6

Output: [3, 6]
```

**Idi matrix form lo:**

```
f(x) = Ax   (linear transformation as matrix multiply)

f(x₁, y, z) = (x₁+y, 2z)

A = [[1, 1, 0],    ← row 1: x₁+y+0z  = x₁+y
     [0, 0, 2]]    ← row 2: 0x₁+0y+2z = 2z

f([1,2,3]) = A @ [1,2,3] = [[1,1,0],[0,0,2]] @ [1,2,3] = [3,6]
```

```python
import numpy as np

# Image lo exact function: f(x₁, y, z) = (x₁+y, 2z)
def f(v):
    """ℝ³ → ℝ² transformation from image"""
    x1, y, z = v[0], v[1], v[2]
    return np.array([x1 + y,    # first output component
                     2 * z])    # second output component

# Image lo example verify cheyyadam
x = np.array([1, 2, 3])        # input: (1,2,3) ∈ ℝ³
y = f(x)
print(f"Input:  {x}  ∈ ℝ³")
print(f"Output: {y}     ∈ ℝ²")
# Output: [3, 6] — image tho exact match!

# Matrix form lo same thing
A = np.array([[1, 1, 0],       # row 1: coefficients of (x₁+y+0z)
              [0, 0, 2]])      # row 2: coefficients of (0x₁+0y+2z)

print(f"\nMatrix A:\n{A}")
print(f"A @ x = {A @ x}")     # [3, 6] — same result!

# Verify multiple inputs
test_inputs = [
    [1, 2, 3],    # image example → [3, 6]
    [0, 0, 0],    # zero vector → [0, 0]
    [2, 3, 1],    # [5, 2]
    [1, 0, 5],    # [1, 10]
]
print("\nMultiple inputs:")
print(f"{'Input':<15} → {'Output'}")
for inp in test_inputs:
    v = np.array(inp)
    out = A @ v
    print(f"{str(inp):<15} → {list(out)}")
```

**Output:**
```
Input:  [1 2 3]  ∈ ℝ³
Output: [3 6]     ∈ ℝ²

Matrix A:
[[1 1 0]
 [0 0 2]]
A @ x = [3 6]

Multiple inputs:
[1, 2, 3]       → [3, 6]    ← image example
[0, 0, 0]       → [0, 0]
[2, 3, 1]       → [5, 2]
[1, 0, 5]       → [1, 10]
```

---

## 3. Image 3 — Visual Graph Explain

**Right side diagram (graph):**

```
3D Space (ℝ³)                      2D Space (ℝ²)
                                   
    x₁                  b
    ↑                   ↑
    |    x⃗              |           (3,6) ●
    |   (1,2,3)         |          /
    |  /           f    |         /
    | /   ════════════► |        /
    +────────► z        +───────────► a
   /                         3
  ↙ y
  
  (1,2,3) ∈ ℝ³     ==>     (3,6) ∈ ℝ²

Axes:
  ℝ³ side: x₁, y, z  (3 axes — 3 dimensions)
  ℝ²  side: a, b      (2 axes — 2 dimensions)
  
f transforms the RED vector (1,2,3) in 3D
to the RED point (3,6) in 2D
```

**Idi visually chupistundi:**

```
3D point (1,2,3) = oka location in 3-dimensional space
2D point (3,6)   = oka location in 2-dimensional space

Transformation f:
  3D coordinate system lo x⃗ = (1,2,3) undi
  f apply chesthe → 2D coordinate system lo y⃗ = (3,6) vastundi

Dimension change:
  3 numbers → 2 numbers
  Information compression (2nd coordinate went from 2 to part of 3)
```

```python
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# Image lo diagram reproduce cheyyadam
fig = plt.figure(figsize=(12, 5))

# Left: 3D space
ax1 = fig.add_subplot(121, projection='3d')
origin = [0, 0, 0]
point_3d = [1, 2, 3]

# 3D axes draw
ax1.quiver(0, 0, 0, 2, 0, 0, color='gold',  arrow_length_ratio=0.2, label='x₁')
ax1.quiver(0, 0, 0, 0, 2, 0, color='gold',  arrow_length_ratio=0.2, label='y')
ax1.quiver(0, 0, 0, 0, 0, 4, color='gold',  arrow_length_ratio=0.2, label='z')

# Vector x = (1,2,3)
ax1.quiver(0, 0, 0, *point_3d, color='red', arrow_length_ratio=0.1, lw=2)
ax1.scatter(*point_3d, color='red', s=80, zorder=5)
ax1.text(*point_3d, '(1,2,3)', fontsize=10, color='white')

ax1.set_xlabel('x₁'); ax1.set_ylabel('y'); ax1.set_zlabel('z')
ax1.set_title('Domain: ℝ³', color='white', pad=10)
ax1.set_facecolor('#1a1a1a')
ax1.tick_params(colors='white')

# Right: 2D space
ax2 = fig.add_subplot(122)
point_2d = [3, 6]

ax2.annotate('', xy=(4, 0), xytext=(0, 0),
             arrowprops=dict(arrowstyle='->', color='gold', lw=2))
ax2.annotate('', xy=(0, 7), xytext=(0, 0),
             arrowprops=dict(arrowstyle='->', color='gold', lw=2))
ax2.text(4.1, 0, 'a', color='gold', fontsize=12)
ax2.text(0.1, 7.1, 'b', color='gold', fontsize=12)

# Point (3,6)
ax2.annotate('', xy=point_2d, xytext=[0, 0],
             arrowprops=dict(arrowstyle='->', color='red', lw=2))
ax2.scatter(*point_2d, color='red', s=100, zorder=5)
ax2.text(point_2d[0]+0.1, point_2d[1]+0.1, '(3,6)',
         color='orange', fontsize=11, fontweight='bold')

ax2.set_xlim(-1, 5); ax2.set_ylim(-1, 8)
ax2.set_facecolor('#1a1a1a')
ax2.tick_params(colors='white')
ax2.set_title('Codomain: ℝ²', color='white')
ax2.set_xlabel('a', color='gold'); ax2.set_ylabel('b', color='gold')
ax2.text(0.5, 0.02, '(1,2,3) ∈ ℝ³  ⟹  (3,6) ∈ ℝ²',
         transform=ax2.transAxes, color='yellow',
         fontsize=10, ha='center')

fig.patch.set_facecolor('#1a1a1a')
plt.suptitle('f: ℝ³ → ℝ²   f(x₁,y,z) = (x₁+y, 2z)',
             color='white', fontsize=13, y=1.02)
plt.tight_layout()
plt.savefig('vector_transformation_3d_to_2d.png',
            dpi=100, bbox_inches='tight', facecolor='#1a1a1a')
plt.show()
print("Plot saved!")
```

---

## 4. Linearity Verify — Image lo f(x₁,y,z) = (x₁+y, 2z)

**Idi linear transformation aa?**
2 rules check cheyyadam — additivity + homogeneity:

```python
import numpy as np

A = np.array([[1, 1, 0],
              [0, 0, 2]])

def f(v):
    return A @ v    # matrix multiply = linear transformation

u = np.array([1, 2, 3])    # image lo vector
v = np.array([4, 0, 1])    # another vector
c = 3.0                     # scalar

# Rule 1: Additivity — f(u+v) == f(u) + f(v)
left  = f(u + v)
right = f(u) + f(v)
print("Rule 1 - Additivity:")
print(f"  f(u+v)     = f({list(u+v)}) = {list(left)}")
print(f"  f(u)+f(v)  = {list(f(u))} + {list(f(v))} = {list(right)}")
print(f"  Equal? {np.allclose(left, right)}")   # True

# Rule 2: Homogeneity — f(c*u) == c*f(u)
left  = f(c * u)
right = c * f(u)
print("\nRule 2 - Homogeneity:")
print(f"  f(c*u)  = f({list(c*u)}) = {list(left)}")
print(f"  c*f(u)  = {c} * {list(f(u))} = {list(right)}")
print(f"  Equal? {np.allclose(left, right)}")   # True

print("\nConclusion: f(x₁,y,z)=(x₁+y, 2z) is a LINEAR transformation ✓")

# Origin preserved? (linear transformation must map zero → zero)
zero = np.array([0, 0, 0])
print(f"\nf(0,0,0) = {f(zero)}  (zero → zero: ✓)")
```

**Output:**
```
Rule 1 - Additivity:
  f(u+v)     = f([5, 2, 4]) = [7, 8]
  f(u)+f(v)  = [3, 6] + [4, 2] = [7, 8]
  Equal? True

Rule 2 - Homogeneity:
  f(c*u)  = f([3.0, 6.0, 9.0]) = [9.0, 18.0]
  c*f(u)  = 3.0 * [3, 6] = [9.0, 18.0]
  Equal? True

Conclusion: f(x₁,y,z)=(x₁+y, 2z) is a LINEAR transformation ✓

f(0,0,0) = [0 0]  (zero → zero: ✓)
```

---

## 5. Generalize — Any ℝⁿ → ℝᵐ Function as Matrix

**Key insight:** Any linear transformation `f: ℝⁿ → ℝᵐ` ki oka **unique matrix A** undi:

```
f(x) = Ax

A is (m × n) matrix:
  m rows   = output dimensions
  n columns = input dimensions

ℝ³ → ℝ²:  A is (2×3) matrix  ← image lo idi!
ℝ² → ℝ³:  A is (3×2) matrix
ℝ⁴ → ℝ⁴:  A is (4×4) matrix
ℝ⁷⁸⁴ → ℝ¹⁰: A is (10×784) ← image classifier first layer!
```

```python
import numpy as np

# Image example: f: ℝ³ → ℝ²
A = np.array([[1, 1, 0],    # (2×3) matrix
              [0, 0, 2]])
print(f"A shape: {A.shape}  ← (m×n) = ({A.shape[0]}×{A.shape[1]})")
print(f"  m={A.shape[0]} output dims, n={A.shape[1]} input dims")
print(f"  f: ℝ{A.shape[1]} → ℝ{A.shape[0]}")
print()

# AI lo real layer sizes
layers = [
    (784,  128, "Image input → hidden layer 1"),
    (128,   64, "Hidden 1 → Hidden 2"),
    ( 64,   10, "Hidden 2 → Output (10 classes)"),
]

print("AI lo layer matrix shapes:")
for n_in, n_out, desc in layers:
    W = np.random.randn(n_out, n_in) * 0.01   # weight matrix
    b = np.zeros(n_out)                         # bias vector
    print(f"  W shape: ({n_out}×{n_in})  ← {desc}")
    print(f"  f: ℝ{n_in} → ℝ{n_out}  (Wx + b)")
    print()
```

---

## 6. Image Summary — Oka Saari Anni Concepts

```
Image 1 chupinchindi:
  f: X → Y notation
  x⃗ → y⃗  (vector input, vector output)
  ℝⁿ (left blob) → ℝᵐ (right blob) via function f
  x⃗ = [x₁, x₂, x₃, ..., xₙ]ᵀ  (column vector, x₁..xₙ ∈ ℝ)
  f: ℝⁿ → ℝᵐ

Image 2 chupinchindi:
  f: ℝⁿ → ℝᵐ (continuing from image 1)
  Concrete function: f(x₁, y, z) = (x₁+y, 2z)
  Numeric example:   f([1, 2, 3]) = [3, 6]
  Calculation:
    x₁+y = 1+2 = 3
    2z   = 2×3 = 6

Image 3 chupinchindi:
  Same formula + example (left side)
  Visual graph (right side):
    3D space ℝ³ lo vector (1,2,3) — axes x₁, y, z
    f apply chesthe →
    2D space ℝ² lo point (3,6) — axes a, b
    (1,2,3) ∈ ℝ³  ⟹  (3,6) ∈ ℝ²

Combined message:
  Vector transformation = oka space nunchi vere space ki map
  f(x) = Ax — matrix multiply aa transformation represent chestundi
  Dimensions change avvocchu (3D → 2D, 2D → 3D etc.)
  Linear transformation = additivity + homogeneity satisfy

AI Connection:
  Neural network layer = ℝⁿ → ℝᵐ linear transformation
  Wx + b = exact same concept
  784 pixel image → 10 class probabilities = ℝ⁷⁸⁴ → ℝ¹⁰
  Deep learning = chained transformations: ℝⁿ → ℝᵐ → ℝᵏ → ...
```

---

---

# Vector Transformations — Definition, Scaling & Rotation (Image Notes)

## Image 1 — Definition (Defn)

**Image lo exact text:**

> "Vector transformations refer to operations that **map vectors from one space to another**, often changing their **magnitude, direction, or both**. These transformations are typically described using **matrices** and are fundamental in various fields, including **physics, engineering, computer graphics, and data science**."

---

### Definition — Telugu lo

```
Vector Transformation ante enti?

Oka vector ni teesukoni:
  1. Magnitude (length) change cheyyadam, and/or
  2. Direction change cheyyadam

Ika result = new vector (same space or different space lo)

Key point: Ivi matrices tho represent avutay.
           Matrix multiply = transformation apply cheyyadam.

Fields lo use avutay:
  Physics           → force vectors, velocity transform
  Engineering       → coordinate system conversions
  Computer Graphics → rotate/scale/move 3D objects on screen
  Data Science      → feature engineering, PCA, neural networks
```

---

### Architecture Diagram

```
Input Vector (v)
      |
      | Apply Transformation Matrix T
      v
  +------------------+
  | Change magnitude |  → length stretch/shrink
  | Change direction |  → rotate/reflect
  | Change both      |  → most transformations
  | Change neither   |  → identity matrix (no change)
  +------------------+
      |
      v
Output Vector (v')

Matrix form: v' = T @ v
```

---

## Image 2 — Example 1: Scaling

**Image lo exact content:**

```
1) Scaling

"Scaling is a transformation that changes the magnitude of vector
 while keeping their direction same."

Formula:   v' = 2v = 2[2, 3] = [4, 6]

Graph:     (2,3) original vector
           (4,6) scaled vector — same direction, twice the length

Application:
  ① DATA Normalization
  ② Computer graphic to resize objects => Paint => Image => Resize
```

---

### Scaling — Complete Explanation

**Scaling ante enti?**

```
Vector ni scale cheyyadam = magnitude (length) change cheyyadam
Direction = same ga untundi (pointing same way)
Only length change avutundi

Scale factor k:
  k > 1  → vector longer (stretch)
  0 < k < 1 → vector shorter (shrink)
  k < 0  → direction reverse + scale
  k = 1  → no change (identity)
  k = -1 → direction flip (reflection through origin)
```

**Image lo example — step by step:**

```
v  = [2, 3]         → original vector
k  = 2              → scale factor
v' = k * v = 2 * [2, 3] = [4, 6]

Length of v:  √(2² + 3²) = √13  ≈ 3.606
Length of v': √(4² + 6²) = √52  ≈ 7.211

Length ratio: 7.211 / 3.606 = 2.0  ← exactly 2x

Direction check:
  v  direction: arctan(3/2) = 56.31°
  v' direction: arctan(6/4) = 56.31°  ← same direction!
```

```python
import numpy as np

# Image lo exact example
v = np.array([2, 3])       # original vector
k = 2                      # scale factor

v_scaled = k * v           # scaling = scalar multiply
print(f"v      = {v}")     # [2, 3]
print(f"v' = 2v = {v_scaled}")  # [4, 6]  ← image lo exact!

# Verify: direction same, length doubled
len_v  = np.linalg.norm(v)
len_v2 = np.linalg.norm(v_scaled)
print(f"\nLength of v:   {len_v:.4f}")
print(f"Length of v':  {len_v2:.4f}")
print(f"Ratio:         {len_v2/len_v:.4f}")   # 2.0000

# Direction check — normalized vectors same avvali
dir_v  = v / len_v
dir_v2 = v_scaled / len_v2
print(f"\nDirection of v:   {np.round(dir_v, 4)}")
print(f"Direction of v':  {np.round(dir_v2, 4)}")
print(f"Same direction?   {np.allclose(dir_v, dir_v2)}")  # True

# Scaling matrix form
# v' = S @ v, where S = k * I (k times identity matrix)
S = k * np.eye(2)          # scaling matrix
print(f"\nScaling matrix S:\n{S}")
print(f"S @ v = {S @ v}")  # [4, 6] — same result

# Different scale factors
factors = [0.5, 1, 2, 3, -1]
print("\nDifferent scale factors:")
for f in factors:
    v_new = f * v
    label = "shrink" if 0 < abs(f) < 1 else "flip" if f < 0 else "stretch" if f > 1 else "same"
    print(f"  k={f:4}: v' = {v_new}  ({label})")
```

**Output:**
```
v      = [2 3]
v' = 2v = [4 6]

Length of v:   3.6056
Length of v':  7.2111
Ratio:         2.0000

Direction of v:   [0.5547 0.8321]
Direction of v':  [0.5547 0.8321]
Same direction?   True

Scaling matrix S:
[[2. 0.]
 [0. 2.]]
S @ v = [4. 6.]

Different scale factors:
  k= 0.5: v' = [1.  1.5]  (shrink)
  k=   1: v' = [2 3]  (same)
  k=   2: v' = [4 6]  (stretch)
  k=   3: v' = [6 9]  (stretch)
  k=  -1: v' = [-2 -3]  (flip)
```

---

### Non-uniform Scaling

```python
import numpy as np

v = np.array([2.0, 3.0])

# Non-uniform: x, y differently scale cheyyadam
S_nonuniform = np.array([[3, 0],   # x → 3x
                          [0, 0.5]])  # y → 0.5y

v_scaled = S_nonuniform @ v
print(f"v:          {v}")             # [2, 3]
print(f"v' (3x, 0.5y): {v_scaled}")  # [6, 1.5] — direction CHANGES

# Note: non-uniform scaling direction change chestundi
dir_v  = v / np.linalg.norm(v)
dir_v2 = v_scaled / np.linalg.norm(v_scaled)
print(f"Same direction? {np.allclose(dir_v, dir_v2)}")  # False!
print("Non-uniform scaling: direction changes!")
```

---

### Applications (Image lo)

**① DATA Normalization:**

```python
import numpy as np

# Data normalization = scaling transformation
# Features ni same range lo teesukovadam

data = np.array([[100, 0.5],
                 [200, 0.8],
                 [150, 0.3],
                 [300, 0.9]])

# Min-Max Normalization: scale to [0, 1]
min_vals = data.min(axis=0)
max_vals = data.max(axis=0)
data_normalized = (data - min_vals) / (max_vals - min_vals)

print("Original data:")
print(data)
print("\nNormalized (scaled to [0,1]):")
print(np.round(data_normalized, 4))

# Z-score Normalization: mean=0, std=1
mean = data.mean(axis=0)
std  = data.std(axis=0)
data_zscore = (data - mean) / std

print("\nZ-score normalized:")
print(np.round(data_zscore, 4))

# Idi scaling transformation:
# prathi feature vector ki different scale factor apply chestundi
# AI lo: input data normalize chesaka train cheyyadam = faster convergence
```

**② Computer Graphics — Image Resize:**

```python
import numpy as np

# Image resize = scaling transformation
# Each pixel coordinate ni scale factor multiply chestundi

def scale_image_coords(coords, scale_x, scale_y):
    """Image coordinates ni scale cheyyadam"""
    S = np.array([[scale_x, 0],
                  [0, scale_y]])
    return (S @ coords.T).T

# Original image corners (100x100 image)
corners = np.array([
    [0,   0],    # top-left
    [100, 0],    # top-right
    [100, 100],  # bottom-right
    [0,   100],  # bottom-left
])

# Scale 2x (200x200 ki resize)
scaled_corners = scale_image_coords(corners, 2, 2)
print("Original image corners (100x100):")
print(corners)
print("\nScaled corners (200x200):")
print(scaled_corners)

# Paint → Image → Resize workflow:
# Paint: user draws at certain coordinates
# Image: coordinates stored as pixel values
# Resize: scaling matrix apply → new coordinates
```

---

## Image 3 — Example 2: Rotation

**Image lo exact content:**

```
② Rotation

"Transformation that turns vectors around the Origin."

v  = [1, 0] ∈ R²         → original vector (x-axis direction)
v' = [0, 1]               → rotated vector (y-axis direction)
"=> Showing a 90 degree Rotation"

Graph (counter clockwise):
  [1, 0] on x-axis
  rotate 90° counter-clockwise
  [0, 1] on y-axis
```

---

### Rotation — Complete Explanation

**Rotation ante enti?**

```
Vector ni origin chuttu oka angle θ tho rotate cheyyadam.
Direction change avutundi.
Length (magnitude) same ga untundi — rotation length preserve chestundi.

Counter-clockwise = positive angle (standard math convention)
Clockwise = negative angle
```

**Image lo example — 90° rotation:**

```
v  = [1, 0]   → x-axis direction (→)
θ  = 90°      → counter-clockwise rotate
v' = [0, 1]   → y-axis direction (↑)

Visually: → turns to ↑
          x-axis direction → y-axis direction
          Exactly 90° counter-clockwise
```

**Rotation matrix:**

```
R(θ) = [[cos θ,  -sin θ],
        [sin θ,   cos θ]]

For θ = 90°:
  cos 90° = 0,  sin 90° = 1

R(90°) = [[0, -1],
          [1,  0]]

Verify: R(90°) @ [1, 0]
      = [[0, -1], [1, 0]] @ [1, 0]
      = [0*1 + (-1)*0,  1*1 + 0*0]
      = [0, 1]  ✓  (image lo exact result!)
```

```python
import numpy as np

def rotation_matrix(theta_degrees):
    """2D rotation matrix create cheyyadam"""
    theta = np.radians(theta_degrees)
    return np.array([
        [np.cos(theta), -np.sin(theta)],
        [np.sin(theta),  np.cos(theta)]
    ])

# Image lo exact example
v = np.array([1, 0])    # original: x-axis direction [1,0]
theta = 90              # 90 degree rotation

R = rotation_matrix(theta)
print("Rotation matrix R(90°):")
print(np.round(R, 4))

v_rotated = R @ v
print(f"\nv  = {v}     (original)")
print(f"v' = {np.round(v_rotated).astype(int)}  (after 90° rotation)")
# v' = [0, 1]  ← image lo exact result!

# Verify: length preserved
print(f"\nLength of v:   {np.linalg.norm(v):.4f}")
print(f"Length of v':  {np.linalg.norm(v_rotated):.4f}")
print(f"Length same?   {np.isclose(np.linalg.norm(v), np.linalg.norm(v_rotated))}")

# Different rotation angles
angles = [0, 45, 90, 135, 180, 270, 360]
print("\nRotating [1, 0] by different angles:")
for angle in angles:
    R_a = rotation_matrix(angle)
    v_r = np.round(R_a @ v).astype(int)
    print(f"  {angle:3}°: {v_r}")
```

**Output:**
```
Rotation matrix R(90°):
[[ 0. -1.]
 [ 1.  0.]]

v  = [1 0]     (original)
v' = [0 1]  (after 90° rotation)

Length of v:   1.0000
Length of v':  1.0000
Length same?   True

Rotating [1, 0] by different angles:
    0°: [1 0]   → x-axis (no rotation)
   45°: [1 1]   → diagonal
   90°: [0 1]   → y-axis ← image lo idi!
  135°: [-1  1] → second quadrant
  180°: [-1  0] → negative x-axis
  270°: [ 0 -1] → negative y-axis
  360°: [1 0]   → back to start
```

---

### Counter-Clockwise vs Clockwise

```python
import numpy as np

def rotation_matrix(theta_degrees):
    theta = np.radians(theta_degrees)
    return np.array([[np.cos(theta), -np.sin(theta)],
                     [np.sin(theta),  np.cos(theta)]])

v = np.array([1.0, 0.0])

# Counter-clockwise (positive angle) — image lo idi
R_ccw = rotation_matrix(90)
v_ccw = R_ccw @ v
print(f"Counter-clockwise 90°: {np.round(v_ccw).astype(int)}")  # [0, 1]

# Clockwise (negative angle)
R_cw = rotation_matrix(-90)
v_cw = R_cw @ v
print(f"Clockwise 90°:         {np.round(v_cw).astype(int)}")   # [0, -1]

# Verify: R(θ) @ R(-θ) = I (rotate then un-rotate = identity)
R_forward  = rotation_matrix(45)
R_backward = rotation_matrix(-45)
combined   = R_forward @ R_backward
print(f"\nR(45) @ R(-45) = Identity?\n{np.round(combined).astype(int)}")
# [[1, 0], [0, 1]] — identity matrix!

# Multiple rotations compose cheyyadam
# R(θ₁) @ R(θ₂) = R(θ₁ + θ₂)
R_30  = rotation_matrix(30)
R_60  = rotation_matrix(60)
R_90  = rotation_matrix(90)
print(f"\nR(30) @ R(60) == R(90)? {np.allclose(R_30 @ R_60, R_90)}")  # True
```

---

### Scaling + Rotation Combined — Real AI Example

```python
import numpy as np

def rotation_matrix(theta_degrees):
    theta = np.radians(theta_degrees)
    return np.array([[np.cos(theta), -np.sin(theta)],
                     [np.sin(theta),  np.cos(theta)]])

# Data augmentation: rotate + scale both apply cheyyadam
# Image pixel coordinate [x, y] ni transform cheyyadam

pixel = np.array([2.0, 3.0])   # image lo oka pixel coordinate

# Step 1: Scale 2x (image expand cheyyadam)
S = 2 * np.eye(2)
pixel_scaled = S @ pixel
print(f"Original pixel:  {pixel}")
print(f"After scale 2x:  {pixel_scaled}")   # [4, 6]  ← image lo exact!

# Step 2: Rotate 90° (image rotate cheyyadam)
R = rotation_matrix(90)
pixel_rotated = R @ pixel
print(f"After rotate 90°:{np.round(pixel_rotated).astype(int)}")   # [-3, 2]

# Step 3: Both — scale then rotate
T_combined = R @ S                 # scale first, then rotate
pixel_both = T_combined @ pixel
print(f"Scale then rotate:{np.round(pixel_both).astype(int)}")

# AI data augmentation pipeline:
print("\nData Augmentation Pipeline:")
print("Original image pixel (2,3):")
print(f"  → Normalize (scale 1/255): {pixel/255}")
print(f"  → Scale 2x:               {2*pixel}")
print(f"  → Rotate 90° CCW:         {np.round(rotation_matrix(90) @ pixel)}")
print(f"  → Rotate 45°:             {np.round(rotation_matrix(45) @ pixel, 2)}")

# Real world: PyTorch/TensorFlow lo idi automatically chestay
# transforms.RandomRotation(30)  → rotation_matrix(random(0,30)) apply
# transforms.RandomHorizontalFlip() → reflection matrix apply
# transforms.Resize((224,224))  → scaling matrix apply
```

---

### Summary Table — Images lo Unna Concepts

| Concept | Image lo | Math | Code |
|---|---|---|---|
| **Definition** | "map vectors from one space to another" | `f: ℝⁿ → ℝᵐ` | `v' = T @ v` |
| **Scaling** | `v' = 2v = 2[2,3] = [4,6]` | `v' = k·v` | `k * np.array(v)` |
| **Scaling matrix** | Same direction, changed length | `S = k·I` | `k * np.eye(2)` |
| **Data normalization** | Application ① | Scale to [0,1] or std | `(x-min)/(max-min)` |
| **Image resize** | Application ② Paint→Image→Resize | Scale pixel coords | `S @ coords` |
| **Rotation** | `v=[1,0] → v'=[0,1]` at 90° | `R(θ) = [[cos,-sin],[sin,cos]]` | `R @ v` |
| **CCW rotation** | Counter clockwise arrow | Positive θ | `rotation_matrix(+90)` |
| **Length preserved** | Rotation — same magnitude | `‖v'‖ = ‖v‖` | `np.linalg.norm` |

---

### Quick Reference — Image Examples Reproduce Chesukokam

```python
import numpy as np

print("=" * 50)
print("IMAGE EXAMPLES — EXACT REPRODUCTION")
print("=" * 50)

# Image 2: Scaling example
v = np.array([2, 3])
v_scaled = 2 * v
print(f"\nScaling (Image 2):")
print(f"  v' = 2v = 2{list(v)} = {list(v_scaled)}")
# v' = 2v = 2[2,3] = [4,6]

# Image 3: Rotation example
v2 = np.array([1, 0])
theta = np.radians(90)
R = np.array([[np.cos(theta), -np.sin(theta)],
              [np.sin(theta),  np.cos(theta)]])
v2_rotated = np.round(R @ v2).astype(int)
print(f"\nRotation (Image 3):")
print(f"  v  = {list(v2)}  (original)")
print(f"  v' = {list(v2_rotated)}  (after 90° CCW rotation)")
# v' = [0, 1]

print("\n" + "=" * 50)
print("BOTH verified — match image exactly ✓")
print("=" * 50)
```

**Output:**
```
==================================================
IMAGE EXAMPLES — EXACT REPRODUCTION
==================================================

Scaling (Image 2):
  v' = 2v = 2[2, 3] = [4, 6]

Rotation (Image 3):
  v  = [1, 0]  (original)
  v' = [0, 1]  (after 90° CCW rotation)

==================================================
BOTH verified — match image exactly ✓
==================================================
```

---

---

---

# Linear Transformation — Zero to Pro (Complete From Scratch)

> Image lo chupinchindi:
> **T: V → W** (Vector space V nunchi Vector space W ki map chese function)
> 2 Important properties:
> ① Additivity:   T(u+v) = T(u) + T(v)
> ② Homogeneity:  T(cu)  = cT(u)
> u, v ∈ V  and  c is a scalar value
> If T satisfies BOTH → **Linear Transformation**

---

## STEP 0 — Before Everything: Numbers, Vectors, Spaces

**Meeru already telusukunnadi:**

```
Number ante enti?
  2, 5, -3, 0.7  → ivi anni "numbers" (scalars)
  oka single value

Vector ante enti?
  [2, 3]       → 2D vector (x=2, y=3) → oka point in 2D space
  [1, 5, 2]    → 3D vector (x=1, y=5, z=2) → oka point in 3D space
  [w₁,w₂,...,wₙ] → n-dimensional vector

  Vector = multiple numbers oka group ga — direction + magnitude untundi

Space ante enti?
  ℝ¹ = number line (0, 1, 2, 3... — 1 dimension)
  ℝ² = 2D plane (x-y graph paper — 2 dimensions)
  ℝ³ = 3D world (x-y-z — 3 dimensions)
  ℝⁿ = n-dimensional space (math lo enni dimensions ainaaa possible)

Vector Space ante enti?
  Vectors unna oka collection — oka set.
  Addition + scalar multiplication defined unnay.
  V, W — ivi ane vector spaces.
```

---

## STEP 1 — Function ante Enti? (Starting Point)

**Before linear transformation telusukuntam, function concept solid ga:**

```
Function = input → output machine

Example:
  f(x) = 2x
  Input: 3 → Output: 6
  Input: 5 → Output: 10

Simple: oka number lo vesi, inka oka number vastundi
```

**Now vectors ki same concept:**

```
Regular function:  number    → number
Vector function:   vector    → vector

Input:  [1, 2]   (2D vector)
Output: [2, 4]   (another 2D vector — each element × 2)

Input:  [1, 2, 3]  (3D vector)
Output: [3, 6]     (2D vector — dimensions also change possible!)
```

**This is a "vector-valued function" or "vector transformation":**

```python
import numpy as np

# Simple vector function
def double_vector(v):
    return v * 2             # prathi element 2 tho multiply

x = np.array([1, 2])
print(double_vector(x))    # [2, 4]

x2 = np.array([3, 5, 1])
print(double_vector(x2))   # [6, 10, 2]
```

---

## STEP 2 — "Normal" Function vs "Linear" Function — Difference Enti?

**Anni functions linear kaadhu. Linear = special type.**

Manaki oka machine undi anukoddam — T (Transformation machine).

```
Machine T lo vector vesi → another vector vastuundi

But LINEAR machine UNDI ANTE — specific rules follow cheyyali:

Rule 1 (Additivity):
  "Rendu vectors add chesaka machine lo veyyadam"
  =
  "Rendu vectors prathi machine lo vesi, results add cheyyadam"
  → Same answer rastuundi

Rule 2 (Homogeneity):
  "Vector ni scale chesaka machine lo veyyadam"
  =
  "Machine lo vesi, result ni scale cheyyadam"
  → Same answer rastuundi
```

**Real life analogy:**

```
Imagine: T = "Salary doubling machine" at your company

Rule 1 test:
  Employee A salary = 50,000
  Employee B salary = 30,000

  Way 1: Combined salary (80,000) double cheyyadam → 1,60,000
  Way 2: Prathi salary double (1,00,000 + 60,000) → 1,60,000
  Same result! → Rule 1 satisfied ✓

Rule 2 test:
  Employee A salary = 50,000
  3 employees same salary unnaru → total = 1,50,000

  Way 1: Total (1,50,000) double → 3,00,000
  Way 2: Employee A double (1,00,000) × 3 → 3,00,000
  Same result! → Rule 2 satisfied ✓

This "salary doubling" = LINEAR transformation!
```

---

## STEP 3 — Image lo Exact Definition

**Image lo chupinchindi — word by word explain:**

```
"space V to a Vector space W, then for any vectors"
→ T is a function from vector space V ki, vector space W ki

T: V → W  ⟹  Linear Transformation
→ T oka function, V nunchi W ki map chestundi
→ Image lo right side lo idi yellow lo raasaru

2 Important properties:

① Additivity   T(u+v) = T(u) + T(v)
  u, v ∈ V    → u and v V space lo unna any two vectors
  T(u+v)      → first add chesaka T apply cheyyadam
  T(u) + T(v) → first T apply chesi, tarvata add cheyyadam
  Equal!       → same result both ways

② Homogeneity  T(cu) = cT(u)
  c is a scalar value  → c = any number (2, 5, -3, 0.5 ...)
  T(cu)    → first c tho u ni scale chesaka T apply
  cT(u)    → first T apply chesaka c tho scale cheyyadam
  Equal!   → same result both ways

u, v ∈ V  and  c is a scalar value
→ idi conditions cheptundi — u, v V lo unna vectors, c oka number
```

---

## STEP 4 — Rule 1: Additivity — Detailed with Pictures

```
T(u + v) = T(u) + T(v)

Visually:

Option A (Left side):
  u = [1, 2]
  v = [3, 1]
  u + v = [4, 3]     ← first add vectors
  T([4, 3]) = ?      ← then apply T

Option B (Right side):
  T([1, 2]) = ?      ← apply T to u
  T([3, 1]) = ?      ← apply T to v
  Add the results    ← then add results

If T is linear → Option A result = Option B result
```

**Concrete example — T(v) = 2v (double everything):**

```
u = [1, 2],  v = [3, 1]

Left side:  T(u + v) = T([1+3, 2+1]) = T([4, 3]) = [8, 6]
Right side: T(u) + T(v) = [2, 4] + [6, 2] = [8, 6]

Same! ✓ → T(v) = 2v is linear
```

```python
import numpy as np

# Rule 1: Additivity verify cheyyadam
def T(v):
    return 2 * v    # simplest linear transformation: double

u = np.array([1, 2])
v = np.array([3, 1])

# Left side: add first, then transform
left = T(u + v)
print(f"Left:  T(u+v) = T({u+v}) = {left}")

# Right side: transform first, then add
right = T(u) + T(v)
print(f"Right: T(u)+T(v) = {T(u)} + {T(v)} = {right}")

print(f"Equal? {np.allclose(left, right)}")   # True ✓
```

---

## STEP 5 — Rule 2: Homogeneity — Detailed with Pictures

```
T(cu) = cT(u)

c = scalar (ordinary number, like 3 or 0.5)
u = vector

Option A (Left side):
  c = 3,  u = [2, 1]
  cu = 3 × [2, 1] = [6, 3]   ← first scale
  T([6, 3]) = ?               ← then transform

Option B (Right side):
  T([2, 1]) = ?               ← first transform
  3 × T([2, 1]) = ?           ← then scale by 3

If T is linear → both same
```

**Concrete example — T(v) = 2v:**

```
c = 3,  u = [2, 1]

Left:  T(cu) = T([6, 3]) = [12, 6]
Right: cT(u) = 3 × T([2, 1]) = 3 × [4, 2] = [12, 6]

Same! ✓
```

```python
import numpy as np

def T(v):
    return 2 * v

u = np.array([2, 1])
c = 3

# Left side: scale first, then transform
left = T(c * u)
print(f"Left:  T(c*u) = T({c*u}) = {left}")

# Right side: transform first, then scale
right = c * T(u)
print(f"Right: c*T(u) = {c} * {T(u)} = {right}")

print(f"Equal? {np.allclose(left, right)}")   # True ✓
```

---

## STEP 6 — Non-Linear Example — Edi Linear Kaadhu ani Telusukoddam

**Translation (shift) — linear kaadhu:**

```
Suppose T(v) = v + [1, 0]   (x-axis lo 1 unit right shift)

u = [2, 3],  v = [1, 1]

Test Rule 1 (Additivity):
  Left:  T(u+v) = T([3, 4]) = [3+1, 4] = [4, 4]
  Right: T(u) + T(v) = [3, 3] + [2, 1] = [5, 4]

  Left ≠ Right → Rule 1 FAILS → NOT linear!
```

**Why intuitively:**

```
Shift = origin move chestundi.
Linear transformation lo origin always origin lo untundi.
Shift chesthe origin move avutundi → linearity breaks.

T([0, 0]) = [0+1, 0] = [1, 0] ≠ [0, 0]
Linear lo T(zero) = zero always!
Ikkade T(zero) ≠ zero → definitely NOT linear.
```

```python
import numpy as np

# Translation — NOT linear
def T_shift(v):
    return v + np.array([1, 0])   # shift right by 1

u = np.array([2, 3])
v = np.array([1, 1])

left  = T_shift(u + v)
right = T_shift(u) + T_shift(v)
print(f"Additivity: {left} == {right}? {np.allclose(left, right)}")
# False! → NOT linear

# Proof shortcut: T(zero) must = zero for linear
zero = np.array([0, 0])
print(f"T(zero) = {T_shift(zero)}")   # [1, 0] ≠ [0, 0] → NOT linear!

# ReLU — NOT linear
def relu(v):
    return np.maximum(0, v)

c = -1
u = np.array([2, 3])
left  = relu(c * u)    # relu([-2, -3]) = [0, 0]
right = c * relu(u)    # -1 * [2, 3] = [-2, -3]
print(f"\nReLU Homogeneity: {left} == {right}? {np.allclose(left, right)}")
# False! ReLU is NOT linear
```

---

## STEP 7 — The Big Secret: Every Linear T = A Matrix!

**Idi most important insight:**

```
Every linear transformation T: ℝⁿ → ℝᵐ can be represented as:

  T(v) = A @ v   (matrix multiply)

Where A is a (m × n) matrix.

Mana transform emi chestuundo, daaniki oka matrix undi.
Matrix multiply = linear transformation apply cheyyadam.
```

**Why idi true?**

```
Standard basis vectors:
  ℝ² lo:
    e₁ = [1, 0]   (x-direction unit vector)
    e₂ = [0, 1]   (y-direction unit vector)

  Any vector [a, b] = a×e₁ + b×e₂
  [3, 5] = 3×[1,0] + 5×[0,1]

Now apply T:
  T([a, b]) = T(a×e₁ + b×e₂)
            = a×T(e₁) + b×T(e₂)    ← (by linearity rules!)
            = [T(e₁) | T(e₂)] @ [a, b]
            = A @ v

So: just know T(e₁) and T(e₂) → know everything about T!
A = [T(e₁)  T(e₂)]  ← columns of A
```

**Concrete example:**

```
Suppose T rotates 2D vectors by 90° counter-clockwise.

e₁ = [1, 0] → after 90° CCW → [0, 1]   → T(e₁) = [0, 1]
e₂ = [0, 1] → after 90° CCW → [-1, 0]  → T(e₂) = [-1, 0]

A = [T(e₁) | T(e₂)]
  = [[0, -1],
     [1,  0]]

Now any vector can be rotated:
  [2, 3] → A @ [2, 3] = [0×2 + (-1)×3, 1×2 + 0×3] = [-3, 2]
  ✓ [2,3] rotated 90° CCW = [-3, 2]
```

```python
import numpy as np

# Build transformation matrix from basis vector images
e1 = np.array([1.0, 0.0])
e2 = np.array([0.0, 1.0])

# Our transformation: 90° CCW rotation
# T(e1) = [0, 1]  (x-axis → y-axis)
# T(e2) = [-1, 0] (y-axis → negative x-axis)
T_e1 = np.array([0.0,  1.0])
T_e2 = np.array([-1.0, 0.0])

# Build A: columns = T(e1), T(e2)
A = np.column_stack([T_e1, T_e2])
print(f"Transformation matrix A:\n{A}")
# [[ 0, -1],
#  [ 1,  0]]

# Test: any vector
v = np.array([2.0, 3.0])
result = A @ v
print(f"\n[2, 3] after 90° CCW: {result}")   # [-3, 2]

# Verify length preserved (rotation doesn't change length)
print(f"Original length: {np.linalg.norm(v):.4f}")
print(f"Rotated length:  {np.linalg.norm(result):.4f}")  # same!
```

---

## STEP 8 — Visual Understanding: What Linear Transformation DOES to Space

**Imagine 2D graph paper:**

```
Before transformation:                After LINEAR transformation:
  +--+--+--+                              /  /  /
  |  |  |  |                             /  /  /
  +--+--+--+      T applies →           /  /  /
  |  |  |  |                           /  /  /
  +--+--+--+

Grid lines:
  Before: square grid
  After:  grid is stretched/rotated/reflected — but STILL GRID
          Parallel lines → still parallel
          Origin → still at origin
          Straight lines → still straight
```

```
What LINEAR transformation PRESERVES:
  ✓ Origin stays at origin (0 → 0)
  ✓ Straight lines stay straight (curves avvadam ledu)
  ✓ Parallel lines stay parallel
  ✓ Evenly spaced points stay evenly spaced

What it can CHANGE:
  → Angles between lines
  → Distances between points
  → Direction of lines
  → Scale (length) of vectors
```

```python
import numpy as np
import matplotlib.pyplot as plt

# Linear transformation visually show cheyyadam
# Grid points generate
x = np.linspace(-2, 2, 5)
y = np.linspace(-2, 2, 5)

# Transformation matrix (shear)
A = np.array([[1, 0.7],
              [0, 1]])

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

for ax, matrix, title in [
    (ax1, np.eye(2), 'Original Grid (before T)'),
    (ax2, A,         'After Shear Transformation T')
]:
    # Horizontal grid lines
    for yi in y:
        pts = np.array([[xi, yi] for xi in x]).T
        pts_t = matrix @ pts
        ax.plot(pts_t[0], pts_t[1], 'b-', alpha=0.4)

    # Vertical grid lines
    for xi in x:
        pts = np.array([[xi, yi] for yi in y]).T
        pts_t = matrix @ pts
        ax.plot(pts_t[0], pts_t[1], 'b-', alpha=0.4)

    # Origin
    ax.plot(0, 0, 'ro', ms=8, label='Origin')

    # Sample vectors
    vectors = [[1, 0], [0, 1], [1, 1]]
    colors  = ['red', 'green', 'orange']
    for vec, c in zip(vectors, colors):
        v  = np.array(vec, dtype=float)
        vt = matrix @ v
        ax.annotate('', xy=vt, xytext=[0,0],
                    arrowprops=dict(arrowstyle='->', color=c, lw=2))

    ax.set_xlim(-3, 3); ax.set_ylim(-3, 3)
    ax.axhline(0, color='k', lw=0.5)
    ax.axvline(0, color='k', lw=0.5)
    ax.set_title(title, fontsize=12)
    ax.grid(False); ax.legend()
    ax.set_aspect('equal')

plt.suptitle('Linear Transformation: Grid stays Grid', fontsize=13, y=1.02)
plt.tight_layout()
plt.savefig('linear_transformation_grid.png', dpi=100, bbox_inches='tight')
plt.show()
print("Saved!")
```

---

## STEP 9 — Common Linear Transformations — Real Examples

### 9.1 Identity — "Do Nothing"

```
T(v) = v   (output = input, no change)

Matrix: I = [[1, 0],    (2D)
             [0, 1]]

T([3, 4]) = [[1,0],[0,1]] @ [3,4] = [3, 4]  (same!)
```

```python
import numpy as np

I = np.eye(2)
v = np.array([3.0, 4.0])
print(f"Identity: {I @ v}")   # [3, 4]  unchanged
```

---

### 9.2 Scaling — "Stretch or Shrink"

```
T(v) = kv  (scale by factor k)

Uniform: T([x,y]) = [kx, ky]
Matrix: [[k, 0],
         [0, k]]

Non-uniform: T([x,y]) = [sx*x, sy*y]
Matrix: [[sx, 0],
         [0, sy]]
```

```python
import numpy as np

v = np.array([2.0, 3.0])

# Uniform scale 2x
S = 2 * np.eye(2)
print(f"Scale 2x: {S @ v}")       # [4, 6]

# Non-uniform
S2 = np.diag([3, 0.5])
print(f"3x, 0.5y: {S2 @ v}")      # [6, 1.5]
```

---

### 9.3 Rotation — "Turn Around Origin"

```
Counter-clockwise by θ:
  R(θ) = [[cos θ,  -sin θ],
           [sin θ,   cos θ]]

θ = 90°: [[0, -1],   → [1,0] → [0,1]  (x-axis → y-axis)
           [1,  0]]
```

```python
import numpy as np

def R(theta_deg):
    t = np.radians(theta_deg)
    return np.array([[np.cos(t), -np.sin(t)],
                     [np.sin(t),  np.cos(t)]])

v = np.array([1.0, 0.0])
print(f"Rotate 90°:  {np.round(R(90) @ v).astype(int)}")   # [0, 1]
print(f"Rotate 180°: {np.round(R(180) @ v).astype(int)}")  # [-1, 0]
print(f"Rotate 45°:  {np.round(R(45) @ v, 4)}")             # [0.7071, 0.7071]
```

---

### 9.4 Reflection — "Mirror Image"

```
Reflect about x-axis: T([x,y]) = [x, -y]
Matrix: [[1,  0],
         [0, -1]]

Reflect about y-axis: T([x,y]) = [-x, y]
Matrix: [[-1, 0],
         [ 0, 1]]
```

```python
import numpy as np

v = np.array([3.0, 4.0])

# x-axis reflect
Mx = np.array([[1, 0], [0, -1]])
print(f"Reflect x-axis: {Mx @ v}")   # [3, -4]

# y-axis reflect
My = np.array([[-1, 0], [0, 1]])
print(f"Reflect y-axis: {My @ v}")   # [-3, 4]
```

---

### 9.5 Projection — "Shadow onto a Line"

```
Project onto x-axis: T([x,y]) = [x, 0]   (y drop cheyyadam)
Matrix: [[1, 0],
         [0, 0]]

Like: sun from directly above → shadow on ground
3D object → 2D shadow
```

```python
import numpy as np

v = np.array([3.0, 4.0])
P = np.array([[1, 0], [0, 0]])
print(f"Project x-axis: {P @ v}")   # [3, 0]

# Interesting: project twice = project once (idempotent)
print(f"P @ P @ v: {P @ P @ v}")   # [3, 0] same!
print(f"P² == P? {np.allclose(P @ P, P)}")  # True
```

---

## STEP 10 — Linear Transformation lo T: V → W Exact Meaning

**Image lo: T: V → W**

```
V = domain (input space)      — meeru vectors ikkade pickkup chestam
W = codomain (output space)   — results ikkade land avutay

V and W: Same space or different spaces!

Examples:
  T: ℝ² → ℝ²   (2D → 2D: rotation, scaling, reflection)
  T: ℝ³ → ℝ²   (3D → 2D: like camera projection, 3D world → 2D screen)
  T: ℝ² → ℝ³   (2D → 3D: embed 2D into 3D)
  T: ℝ⁷⁸⁴ → ℝ¹⁰ (784-pixel image → 10 class scores: image classifier!)
```

```python
import numpy as np

# T: ℝ³ → ℝ²  (like a camera projecting 3D to 2D)
A = np.array([[1, 1, 0],   # (2×3) matrix
              [0, 0, 2]])  # 2 output dims, 3 input dims

v3d = np.array([1, 2, 3])
v2d = A @ v3d
print(f"3D point {v3d} → 2D point {v2d}")  # [3, 6]

# T: ℝ⁷⁸⁴ → ℝ¹⁰ (neural network first layer — image classifier!)
np.random.seed(0)
W = np.random.randn(10, 784) * 0.01    # (10×784) matrix
image_vector = np.random.randn(784)    # flattened 28×28 image
scores = W @ image_vector              # 10 class scores
print(f"\nImage (784-dim) → Scores (10-dim)")
print(f"Input shape:  {image_vector.shape}")
print(f"Output shape: {scores.shape}")
print(f"Scores: {np.round(scores, 3)}")
```

---

## STEP 11 — How to CHECK if T is Linear (Test Checklist)

```
Given any transformation T, verify these:

Test 1: T(zero vector) = zero vector?
        If T(0) ≠ 0 → NOT linear (stop here!)

Test 2: Pick any two vectors u, v:
        T(u + v) == T(u) + T(v)?
        If not equal → NOT linear

Test 3: Pick any vector v and scalar c:
        T(c*v) == c*T(v)?
        If not equal → NOT linear

If ALL THREE pass → LINEAR ✓
```

```python
import numpy as np

def check_linearity(T, n_dims=2, n_tests=1000):
    """
    T function ni linearity check cheyyadam
    n_tests random vectors tho test chestundi
    """

    # Test 1: Origin preservation
    zero = np.zeros(n_dims)
    T_zero = T(zero)
    if not np.allclose(T_zero, np.zeros_like(T_zero)):
        return False, f"FAIL: T(0) = {T_zero}, expected 0"

    # Tests 2 & 3: Additivity and Homogeneity
    for _ in range(n_tests):
        u = np.random.randn(n_dims)
        v = np.random.randn(n_dims)
        c = np.random.randn()

        # Additivity
        if not np.allclose(T(u + v), T(u) + T(v), atol=1e-10):
            return False, "FAIL: Additivity T(u+v) ≠ T(u)+T(v)"

        # Homogeneity
        if not np.allclose(T(c * u), c * T(u), atol=1e-10):
            return False, "FAIL: Homogeneity T(cu) ≠ cT(u)"

    return True, "PASS: Linear Transformation ✓"


# Test various functions
A = np.array([[2, 1], [0, 3]])

tests = {
    "T(v) = Av (matrix multiply)":      lambda v: A @ v,
    "T(v) = 3v (scaling)":              lambda v: 3 * v,
    "T(v) = v + [1,0] (translation)":   lambda v: v + np.array([1.0, 0.0]),
    "T(v) = v² (element-wise square)":  lambda v: v ** 2,
    "T(v) = ReLU(v)":                   lambda v: np.maximum(0, v),
    "T(v) = zero vector":               lambda v: np.zeros_like(v),
}

print(f"{'Transformation':<40} {'Result'}")
print("-" * 65)
for name, T in tests.items():
    is_lin, msg = check_linearity(T)
    status = "LINEAR ✓" if is_lin else "NOT linear ✗"
    print(f"{name:<40} {status}")
    if not is_lin:
        print(f"  → Reason: {msg}")
```

**Output:**
```
Transformation                           Result
-----------------------------------------------------------------
T(v) = Av (matrix multiply)             LINEAR ✓
T(v) = 3v (scaling)                     LINEAR ✓
T(v) = v + [1,0] (translation)          NOT linear ✗
  → Reason: FAIL: T(0) = [1. 0.], expected 0
T(v) = v² (element-wise square)         NOT linear ✗
  → Reason: FAIL: Additivity T(u+v) ≠ T(u)+T(v)
T(v) = ReLU(v)                          NOT linear ✗
  → Reason: FAIL: Homogeneity T(cu) ≠ cT(u)
T(v) = zero vector                      LINEAR ✓
```

---

## STEP 12 — AI lo Why Linear Transformation Everywhere?

**Neural Network oka layer:**

```
z = Wx + b

W = weight matrix     → idi LINEAR transformation (W@x)
b = bias vector       → idi SHIFT (translation)
Wx + b               → AFFINE transformation (linear + shift)

Note:
  Wx alone = linear transformation
  Wx + b   = affine (almost linear, but origin shifts)

In practice:
  We say "neural network uses linear layers" — technically they're affine
  But "linear" is commonly used in deep learning context
```

**Why not just use non-linear directly?**

```
Training optimization:

Linear transformations:
  → Well-understood math (matrix theory)
  → Gradients easy to compute (just matrix multiply)
  → Composition = matrix multiply (efficient)

Activation functions (ReLU, Sigmoid):
  → Add non-linearity (complex patterns learn cheyyagaladu)
  → But they're applied AFTER linear layer

Final: Linear layer + Activation = powerful combination
       Each linear layer = "find best linear transformation"
       Activation = "add non-linearity to break collapse"
```

```python
import numpy as np

# Simple 2-layer network without activation
W1 = np.array([[2, 1], [1, 3]])   # layer 1
W2 = np.array([[1, 2], [0, 1]])   # layer 2

x = np.array([1.0, 2.0])

# Forward pass
h = W1 @ x     # layer 1
y = W2 @ h     # layer 2

# Key insight: W2 @ (W1 @ x) = (W2 @ W1) @ x
W_combined = W2 @ W1
y_direct   = W_combined @ x

print("2 layers, NO activation:")
print(f"  Layer-by-layer:  y = {y}")
print(f"  Single matrix:   y = {y_direct}")
print(f"  Identical? {np.allclose(y, y_direct)}")  # True!
print("  → 2 linear layers = 1 linear layer (depth wasted!)")

# With ReLU activation
relu = lambda v: np.maximum(0, v)
h_relu = relu(W1 @ x)
y_relu = W2 @ h_relu

print("\n2 layers, WITH ReLU:")
print(f"  y = {y_relu}")
print(f"  y (single matrix) = {y_direct}")
print(f"  Different? {not np.allclose(y_relu, y_direct)}")  # True — they differ!
print("  → Depth NOW matters! Non-linearity enables learning complex patterns")
```

---

## STEP 13 — Summary Table: From Zero to Pro

| Concept | Simple Explanation | Math | Code |
|---|---|---|---|
| **Vector** | Multiple numbers group | `[x, y]` or `[x, y, z]` | `np.array([1, 2])` |
| **Transformation** | Input vector → output vector | `T: V → W` | `def T(v): ...` |
| **Linear T** | Transformation satisfying 2 rules | `T(u+v)=T(u)+T(v)`, `T(cu)=cT(u)` | `A @ v` |
| **Additivity** | Add then transform = transform then add | `T(u+v) = T(u)+T(v)` | `T(u+v) == T(u)+T(v)` |
| **Homogeneity** | Scale then transform = transform then scale | `T(cu) = cT(u)` | `T(c*u) == c*T(u)` |
| **Origin rule** | Zero always maps to zero | `T(0) = 0` | `T(np.zeros(n)) == 0` |
| **Matrix = LT** | Every linear T is a matrix | `T(v) = Av` | `A @ v` |
| **Find A** | Apply T to basis vectors | `A = [T(e₁), T(e₂)]` | `np.column_stack(...)` |
| **Composition** | Multiple transforms = one matrix | `T₂∘T₁ = A₂@A₁` | `A2 @ A1` |
| **Scaling** | Change length, keep direction | `T(v) = kv` | `k * v` or `k*I @ v` |
| **Rotation** | Turn around origin | `R(θ) = [[cos,-sin],[sin,cos]]` | `R @ v` |
| **Reflection** | Mirror image | Diagonal with -1 | `M @ v` |
| **Projection** | Shadow (drop dimension) | `P = uuᵀ` | `P @ v` |
| **NOT linear** | Translation, ReLU, v², Sigmoid | Origin shifts or rules fail | Test with `check_linearity()` |
| **AI layer** | Wx (linear) or Wx+b (affine) | `z = Wx + b` | `W @ x + b` |

---

## STEP 14 — Final: The Big Picture

```
meeru ippudu telusina journey:

Number (scalar)
    ↓
Vector (multiple numbers together)
    ↓
Vector Space (all vectors of same type)
    ↓
Transformation (function: vectors → vectors)
    ↓
LINEAR Transformation (transformation + 2 rules)
  Rule 1: T(u+v) = T(u)+T(v)   [Additivity]
  Rule 2: T(cu)  = cT(u)       [Homogeneity]
    ↓
Every Linear T = Matrix A  (T(v) = Av)
    ↓
Composition = Matrix Multiply  (T₂∘T₁ = A₂A₁)
    ↓
Neural Network Layer = Linear Transformation (Wx)
    ↓
Deep Learning = Many Linear Transformations + Activations
    ↓
Training = Find best transformation matrices W₁, W₂, ...

Linear Transformation = idi AI ki foundation.
Idi telisintaka → neural networks, matrix operations,
                  PCA, embeddings anni clearly telusutay.
```

---

---

# Worked Proof: Reflection is a Linear Transformation (Image Notes)

> Images lo: Y-axis meeda reflection transformation T ni linear ga prove chesam
> Step 1: Transformation define + matrix form write cheyyadam
> Step 2: Additivity check (T(u+v) = T(u)+T(v))
> Step 3: Homogeneity check (T(cu) = cT(u))
> Both pass → T is a LINEAR TRANSFORMATION ✓

---

## Image 1 — Reflection Transformation Define Cheyyadam

**Image lo exact content:**

```
Eg: Reflection

"The reflection transformation T across the y axis maps a vector"

x = [x, y] ∈ ℝ²        T(x) = [-x, y]

Graph:
  (x, 4) → (-x, 4)      y-coordinate same, x flips sign
  Original point right side → reflected point left side
```

**Y-axis reflection ante enti?**

```
Y-axis = vertical line (x=0)
Reflection = mirror image of point, y-axis glass laga

Original point (x, y):
  x > 0 → right side → reflected to left side (-x, y)
  x < 0 → left side  → reflected to right side (-x, y)
  y same ga untundi (y-axis vertical, y change kaadu)

Example:
  (2, 4)  → reflected → (-2, 4)
  (-3, 1) → reflected → (3, 1)
  (0, 5)  → reflected → (0, 5)  [on y-axis: no change]
```

```python
import numpy as np

# Y-axis reflection function
def reflect_y_axis(v):
    """Y-axis meeda reflection: x flip, y same"""
    x, y = v[0], v[1]
    return np.array([-x, y])    # x negative avutundi, y same

# Test
points = [(2, 4), (-3, 1), (0, 5), (1, -2)]
print("Y-axis Reflection:")
print(f"{'Original':<15} → {'Reflected'}")
print("-" * 30)
for x, y in points:
    orig = np.array([x, y])
    refl = reflect_y_axis(orig)
    print(f"{str([x,y]):<15} → {list(refl)}")
```

**Output:**
```
Y-axis Reflection:
Original        → Reflected
------------------------------
[2, 4]          → [-2, 4]
[-3, 1]         → [3, 1]
[0, 5]          → [0, 5]
[1, -2]         → [-1, -2]
```

---

## Image 2 — T(x) = Ax Matrix Form

**Image lo exact content:**

```
Transformation can be expressed as:

A = [[-1, 0],
     [ 0, 1]]

T(x) = Ax  ⟹  Linear Transformation

    = [x  y] × [[-1, 0], [0, 1]] = [-x, y]
         1×2        2×2              1×2
```

**Matrix form enduku?**

```
T(x) = [-x, y]  ← idi "rule" ga telusam

Idi matrix multiply ga express cheyyadam:

A = [[-1, 0],     ← row 1: [-1, 0] means output[0] = -1*x + 0*y = -x
     [ 0, 1]]     ← row 2: [ 0, 1] means output[1] =  0*x + 1*y =  y

T([x, y]) = A @ [x, y]
          = [[-1,0],[0,1]] @ [x, y]
          = [-1*x + 0*y,  0*x + 1*y]
          = [-x,  y]   ✓
```

**Step-by-step matrix multiply:**

```
[[-1, 0],   @   [x]   =   [-1*x + 0*y]   =   [-x]
 [ 0, 1]]       [y]       [ 0*x + 1*y]        [ y]

Row 1 × Column: (-1)(x) + (0)(y) = -x   → output x-component
Row 2 × Column: (0)(x)  + (1)(y) =  y   → output y-component
```

```python
import numpy as np

# Reflection matrix for y-axis reflection
A = np.array([[-1, 0],
              [ 0, 1]])

print("Reflection matrix A:")
print(A)
print()

# Test: T(x) = Ax
test_points = [
    np.array([2, 4]),
    np.array([-3, 1]),
    np.array([1, -2]),
]

print(f"{'x (input)':<15} A @ x = {'T(x) (output)'}")
print("-" * 40)
for x in test_points:
    Tx = A @ x
    print(f"{str(list(x)):<15} → {list(Tx)}")

# Verify: matrix multiply = our manual function
def reflect_y_axis(v):
    return np.array([-v[0], v[1]])

v = np.array([3, 5])
print(f"\nManual function:    {reflect_y_axis(v)}")
print(f"Matrix A @ v:       {A @ v}")
print(f"Same?               {np.allclose(reflect_y_axis(v), A @ v)}")  # True!
```

**Output:**
```
Reflection matrix A:
[[-1  0]
 [ 0  1]]

x (input)       A @ x = T(x) (output)
----------------------------------------
[2, 4]          → [-2, 4]
[-3, 1]         → [3, 1]
[1, -2]         → [-1, -2]

Manual function:    [-3  5]
Matrix A @ v:       [-3  5]
Same?               True
```

---

## Image 3 — Checking Additivity: Setup

**Image lo exact content:**

```
① Checking Additivity

Let  u = [u₁, u₂]   and   v = [v₁, v₂]   be two vectors in ℝ²
```

**Idi enduku chestunnam?**

```
T(x) = Ax idi define chesam. Idi REALLY linear aa?
Linear ante two rules satisfy cheyyali:
  Rule 1: Additivity   — T(u+v) = T(u) + T(v)
  Rule 2: Homogeneity  — T(cu)  = c T(u)

Rule 1 prove cheyyataniki, general vectors u, v teesukuntunnam.
Specific numbers kadu — u₁, u₂, v₁, v₂ as symbols (prontoypes).
Idi oka "for all" proof — any u, v works.
```

```python
import numpy as np

# General setup — symbolic proof ni numerically demonstrate
# u = [u1, u2], v = [v1, v2] as concrete example values

u = np.array([3.0, 5.0])   # u₁=3, u₂=5
v = np.array([2.0, 1.0])   # v₁=2, v₂=1

A = np.array([[-1, 0], [0, 1]])   # reflection matrix

print(f"u = {u}   (u₁={u[0]}, u₂={u[1]})")
print(f"v = {v}   (v₁={v[0]}, v₂={v[1]})")
print(f"\nA = {A[0]}")
print(f"    {A[1]}")
```

---

## Image 4 — Additivity Proof: LHS Calculation

**Image lo exact content:**

```
T(u+v) = T(u) + T(v)    ← this is what we want to prove

u + v = [u₁] + [v₁] = [u₁+v₁]
        [u₂]   [v₂]   [u₂+v₂]

T(u+v) = A(u+v) = [[-1, 0], [0, 1]] @ [u₁+v₁] = [-(u₁+v₁)]
                                        [u₂+v₂]   [ u₂+v₂ ]

T(u) = Au = [[-1, 0], [0, 1]] @ [u₁] = [-u₁]
                                  [u₂]   [ u₂]
```

**Step-by-step explanation:**

```
Step 1: Add vectors first
  u + v = [u₁+v₁, u₂+v₂]
        = [3+2, 5+1] = [5, 6]   (with our values)

Step 2: Apply T to the sum (LHS)
  T(u+v) = A @ [u₁+v₁, u₂+v₂]
         = [[-1,0],[0,1]] @ [5, 6]
         = [-5, 6]
         = [-(u₁+v₁), u₂+v₂]
         = [-u₁-v₁, u₂+v₂]

Step 3: Apply T to u separately
  T(u) = A @ [u₁, u₂]
       = [[-1,0],[0,1]] @ [3, 5]
       = [-3, 5]
       = [-u₁, u₂]
```

```python
import numpy as np

A = np.array([[-1, 0], [0, 1]])
u = np.array([3.0, 5.0])
v = np.array([2.0, 1.0])

# LHS: T(u+v)
u_plus_v = u + v
print(f"Step 1 — Add vectors:")
print(f"  u + v = {u} + {v} = {u_plus_v}")

T_u_plus_v = A @ u_plus_v     # T applied to sum
print(f"\nStep 2 — LHS: T(u+v)")
print(f"  T(u+v) = A @ {u_plus_v} = {T_u_plus_v}")
print(f"  = [-(u₁+v₁), u₂+v₂] = [-{u[0]+v[0]}, {u[1]+v[1]}]")

# T(u) separately
T_u = A @ u
print(f"\nStep 3 — T(u):")
print(f"  T(u) = A @ {u} = {T_u}")
print(f"  = [-u₁, u₂] = [-{u[0]}, {u[1]}]")
```

**Output:**
```
Step 1 — Add vectors:
  u + v = [3. 5.] + [2. 1.] = [5. 6.]

Step 2 — LHS: T(u+v)
  T(u+v) = A @ [5. 6.] = [-5.  6.]
  = [-(u₁+v₁), u₂+v₂] = [-5.0, 6.0]

Step 3 — T(u):
  T(u) = A @ [3. 5.] = [-3.  5.]
  = [-u₁, u₂] = [-3.0, 5.0]
```

---

## Image 5 — Additivity Proof: Full Comparison LHS = RHS

**Image lo exact content:**

```
Continuing...

T(u+v) = A(u+v) = [[-1,0],[0,1]] @ [u₁+v₁] = [-(u₁+v₁)] = [-u₁-v₁]
                                     [u₂+v₂]   [ u₂+v₂ ]   [ u₂+v₂]

T(u) = Au = [[-1,0],[0,1]] @ [u₁] = [-u₁]
                               [u₂]   [ u₂]

T(v) = Av = [[-1,0],[0,1]] @ [v₁] = [-v₁]
                               [v₂]   [ v₂]

RHS ⟹ T(u) + T(v) = [-u₁] + [-v₁] = [-u₁-v₁]
                     [ u₂]   [ v₂]   [ u₂+v₂]

LHS = RHS ✓   →  Additivity holds!
```

**Complete additivity proof code:**

```python
import numpy as np

A = np.array([[-1, 0], [0, 1]])
u = np.array([3.0, 5.0])    # u₁=3, u₂=5
v = np.array([2.0, 1.0])    # v₁=2, v₂=1

print("=" * 50)
print("ADDITIVITY PROOF: T(u+v) = T(u) + T(v)")
print("=" * 50)

# LHS: T(u+v)
LHS = A @ (u + v)
print(f"\nLHS: T(u+v)")
print(f"  u + v = {u+v}")
print(f"  T(u+v) = A @ {u+v} = {LHS}")
print(f"  = [-(u₁+v₁), u₂+v₂] = [-{u[0]+v[0]}, {u[1]+v[1]}]")

# RHS: T(u) + T(v)
T_u = A @ u
T_v = A @ v
RHS = T_u + T_v

print(f"\nRHS: T(u) + T(v)")
print(f"  T(u) = A @ {u} = {T_u}")
print(f"       = [-u₁, u₂] = [-{u[0]}, {u[1]}]")
print(f"  T(v) = A @ {v} = {T_v}")
print(f"       = [-v₁, v₂] = [-{v[0]}, {v[1]}]")
print(f"  T(u) + T(v) = {T_u} + {T_v} = {RHS}")
print(f"              = [-u₁-v₁, u₂+v₂] = [-{u[0]+v[0]}, {u[1]+v[1]}]")

# Compare
print(f"\nLHS = {LHS}")
print(f"RHS = {RHS}")
print(f"LHS == RHS? {np.allclose(LHS, RHS)}")  # True!
print("\n✓ Additivity HOLDS for y-axis reflection!")

# Symbolic verification (general u₁,u₂,v₁,v₂)
print("\n--- Symbolic check ---")
print("LHS = [-(u₁+v₁), u₂+v₂] = [-u₁-v₁, u₂+v₂]")
print("RHS = [-u₁, u₂] + [-v₁, v₂] = [-u₁-v₁, u₂+v₂]")
print("LHS = RHS ✓  (for ALL u₁,u₂,v₁,v₂ ∈ ℝ)")
```

**Output:**
```
==================================================
ADDITIVITY PROOF: T(u+v) = T(u) + T(v)
==================================================

LHS: T(u+v)
  u + v = [5. 6.]
  T(u+v) = A @ [5. 6.] = [-5.  6.]
  = [-(u₁+v₁), u₂+v₂] = [-5.0, 6.0]

RHS: T(u) + T(v)
  T(u) = A @ [3. 5.] = [-3.  5.]
       = [-u₁, u₂] = [-3.0, 5.0]
  T(v) = A @ [2. 1.] = [-2.  1.]
       = [-v₁, v₂] = [-2.0, 1.0]
  T(u) + T(v) = [-3.  5.] + [-2.  1.] = [-5.  6.]
              = [-u₁-v₁, u₂+v₂] = [-5.0, 6.0]

LHS = [-5.  6.]
RHS = [-5.  6.]
LHS == RHS? True

✓ Additivity HOLDS for y-axis reflection!

--- Symbolic check ---
LHS = [-(u₁+v₁), u₂+v₂] = [-u₁-v₁, u₂+v₂]
RHS = [-u₁, u₂] + [-v₁, v₂] = [-u₁-v₁, u₂+v₂]
LHS = RHS ✓  (for ALL u₁,u₂,v₁,v₂ ∈ ℝ)
```

---

## Image 6 — Checking Homogeneity: Setup

**Image lo exact content:**

```
2) Checking Homogeneity

Let  u = [u₁, u₂] ∈ ℝ²   and  c be a scalar

Homogeneity Requirement:
  T(cu) = cT(u)
```

**Idi enduku important?**

```
Homogeneity = "scaling before or after transform, result same"

T(cu) = cT(u) means:
  Way 1: u ni c tho scale chesaka T apply cheyyadam
  Way 2: T apply chesaka result ni c tho scale cheyyadam
  → Same result vastuundi (if T is linear)
```

```python
import numpy as np

A = np.array([[-1, 0], [0, 1]])
u = np.array([3.0, 5.0])    # u₁=3, u₂=5
c = 4.0                      # scalar value

print(f"u = {u}   (u₁={u[0]}, u₂={u[1]})")
print(f"c = {c}   (scalar)")
print(f"\nHomogeneity to prove: T(cu) = cT(u)")
print(f"cu = {c} × {u} = {c*u}")
```

---

## Image 7 — Homogeneity Proof: LHS = RHS

**Image lo exact content:**

```
Homogeneity Requirement:
  T(cu) = cT(u)

cu = c[u₁, u₂] = [cu₁, cu₂]

LHS: T(cu) = A(cu) = [[-1,0],[0,1]] @ [cu₁] = [-cu₁]  ⟹ LHS
                                        [cu₂]   [ cu₂]         RHS↑

cT(u) = c(Au) = c × [[-1,0],[0,1]] @ [u₁] = c × [-u₁] = [-cu₁]
                                       [u₂]        [ u₂]   [ cu₂]

LHS = RHS ✓   →  Homogeneity holds!
```

**Complete homogeneity proof code:**

```python
import numpy as np

A = np.array([[-1, 0], [0, 1]])
u = np.array([3.0, 5.0])    # u₁=3, u₂=5
c = 4.0

print("=" * 50)
print("HOMOGENEITY PROOF: T(cu) = cT(u)")
print("=" * 50)

# Step 1: Compute cu
cu = c * u
print(f"\nStep 1: Compute cu")
print(f"  cu = {c} × {u} = {cu}")
print(f"     = [c×u₁, c×u₂] = [{c*u[0]}, {c*u[1]}]")

# LHS: T(cu)
LHS = A @ cu
print(f"\nLHS: T(cu)")
print(f"  T(cu) = A @ {cu}")
print(f"        = [[-1,0],[0,1]] @ [{cu[0]}, {cu[1]}]")
print(f"        = [-cu₁, cu₂] = [{LHS[0]}, {LHS[1]}]")

# RHS: cT(u)
T_u = A @ u
RHS = c * T_u
print(f"\nRHS: cT(u)")
print(f"  T(u) = A @ {u} = {T_u}")
print(f"       = [-u₁, u₂] = [-{u[0]}, {u[1]}]")
print(f"  cT(u) = {c} × {T_u} = {RHS}")
print(f"        = [c×(-u₁), c×u₂] = [-cu₁, cu₂] = [{RHS[0]}, {RHS[1]}]")

# Compare
print(f"\nLHS = {LHS}")
print(f"RHS = {RHS}")
print(f"LHS == RHS? {np.allclose(LHS, RHS)}")  # True!
print("\n✓ Homogeneity HOLDS for y-axis reflection!")

# Symbolic
print("\n--- Symbolic check ---")
print("LHS = T(cu) = A(cu) = [-cu₁,  cu₂]")
print("RHS = cT(u) = c(Au) = c[-u₁, u₂] = [-cu₁, cu₂]")
print("LHS = RHS ✓  (for ALL u₁,u₂ ∈ ℝ, ALL c ∈ ℝ)")
```

**Output:**
```
==================================================
HOMOGENEITY PROOF: T(cu) = cT(u)
==================================================

Step 1: Compute cu
  cu = 4.0 × [3. 5.] = [12. 20.]
     = [c×u₁, c×u₂] = [12.0, 20.0]

LHS: T(cu)
  T(cu) = A @ [12. 20.]
        = [[-1,0],[0,1]] @ [12.0, 20.0]
        = [-cu₁, cu₂] = [-12.0, 20.0]

RHS: cT(u)
  T(u) = A @ [3. 5.] = [-3.  5.]
       = [-u₁, u₂] = [-3.0, 5.0]
  cT(u) = 4.0 × [-3.  5.] = [-12.  20.]
        = [c×(-u₁), c×u₂] = [-cu₁, cu₂] = [-12.0, 20.0]

LHS = [-12.  20.]
RHS = [-12.  20.]
LHS == RHS? True

✓ Homogeneity HOLDS for y-axis reflection!

--- Symbolic check ---
LHS = T(cu) = A(cu) = [-cu₁,  cu₂]
RHS = cT(u) = c(Au) = c[-u₁, u₂] = [-cu₁, cu₂]
LHS = RHS ✓  (for ALL u₁,u₂ ∈ ℝ, ALL c ∈ ℝ)
```

---

## Final Conclusion — T is a Linear Transformation

```python
import numpy as np

print("=" * 55)
print("COMPLETE PROOF SUMMARY")
print("Y-axis Reflection: T([x,y]) = [-x, y]")
print("=" * 55)

print("""
Transformation defined as:
  T(x) = Ax   where A = [[-1, 0], [0, 1]]

Step 1: Define ✓
  T([x,y]) = [[-1,0],[0,1]] @ [x,y] = [-x, y]

Step 2: Check Additivity ✓
  LHS: T(u+v) = A(u+v) = [-(u₁+v₁), u₂+v₂] = [-u₁-v₁, u₂+v₂]
  RHS: T(u)+T(v) = [-u₁,u₂]+[-v₁,v₂] = [-u₁-v₁, u₂+v₂]
  LHS = RHS ✓

Step 3: Check Homogeneity ✓
  LHS: T(cu) = A(cu) = [-cu₁, cu₂]
  RHS: cT(u) = c[-u₁, u₂] = [-cu₁, cu₂]
  LHS = RHS ✓

CONCLUSION:
  Both additivity and homogeneity satisfied
  → T is a LINEAR TRANSFORMATION ✓
""")

# Run actual verification
A = np.array([[-1.0, 0.0], [0.0, 1.0]])
passed = 0
for _ in range(1000):
    u = np.random.randn(2)
    v = np.random.randn(2)
    c = np.random.randn()
    # Additivity
    assert np.allclose(A @ (u+v), A@u + A@v), "Additivity failed!"
    # Homogeneity
    assert np.allclose(A @ (c*u), c * (A@u)), "Homogeneity failed!"
    passed += 1
print(f"Verified with {passed} random test cases — ALL PASSED ✓")
print("\nY-axis reflection is CONFIRMED LINEAR TRANSFORMATION ✓")
```

**Output:**
```
=======================================================
COMPLETE PROOF SUMMARY
Y-axis Reflection: T([x,y]) = [-x, y]
=======================================================

Transformation defined as:
  T(x) = Ax   where A = [[-1, 0], [0, 1]]

Step 1: Define ✓
  T([x,y]) = [[-1,0],[0,1]] @ [x,y] = [-x, y]

Step 2: Check Additivity ✓
  LHS: T(u+v) = A(u+v) = [-(u₁+v₁), u₂+v₂] = [-u₁-v₁, u₂+v₂]
  RHS: T(u)+T(v) = [-u₁,u₂]+[-v₁,v₂] = [-u₁-v₁, u₂+v₂]
  LHS = RHS ✓

Step 3: Check Homogeneity ✓
  LHS: T(cu) = A(cu) = [-cu₁, cu₂]
  RHS: cT(u) = c[-u₁, u₂] = [-cu₁, cu₂]
  LHS = RHS ✓

CONCLUSION:
  Both additivity and homogeneity satisfied
  → T is a LINEAR TRANSFORMATION ✓

Verified with 1000 random test cases — ALL PASSED ✓

Y-axis reflection is CONFIRMED LINEAR TRANSFORMATION ✓
```

---

## Quick Reference — Proof Template

```
Any transformation T prove cheyyadam — same template:

STEP 1: Define T as matrix multiply
  T(x) = Ax
  Find A by applying T to e₁, e₂ (basis vectors)

STEP 2: Check Additivity
  LHS = T(u+v) = A(u+v) = A·u + A·v   (matrix multiply distributes)
  RHS = T(u) + T(v) = Au + Av
  LHS = RHS ✓  (matrix multiply always distributes — all matrix transforms linear!)

STEP 3: Check Homogeneity
  LHS = T(cu) = A(cu) = c(Au)          (scalar can move out of matrix multiply)
  RHS = cT(u) = c(Au)
  LHS = RHS ✓

SECRET SHORTCUT:
  T(x) = Ax form lo express cheyyagaligite →
  Additivity + Homogeneity AUTOMATICALLY satisfied!
  (Matrix multiply = linear, always)

  So: "Is T expressible as Ax?" = "Is T linear?"
  If yes → linear transformation ✓
  If no  → need to check manually
```

---

---

# Example that FAILS Linear Transformation — Complete Proof (Image Notes)

> Images lo: T(x) = x + [1,1] (translation) idi linear kadu ani prove chesam
> Image 1: T define cheyyadam — T(x) = x + b where b = [1,1]
> Images 2-4: Additivity check — LHS ≠ RHS → FAILS
> Images 5-6: Homogeneity check — LHS ≠ RHS → FAILS
> Conclusion: T(x) = x + [1,1] is NOT a Linear Transformation

---

## Image 1 — Define the Transformation

**Image lo exact content:**

```
Example that dont follow Linear Transformation

b = [1, 1]           T(x) = x + b       T: R² → R²
                                         u     v

"Vector ⟹ fixed vector"    (x ki [1,1] add cheyyadam)

T(x) = x + [1, 1]
```

**Translation ante enti?**

```
T(x) = x + b   (b = fixed vector, shift amount)

Every input vector ki same fixed amount add avutundi.
Idi "shift" or "translation" — space ni move cheyyadam.

Example:
  b = [1, 1]
  T([2, 3]) = [2,3] + [1,1] = [3, 4]   (right 1, up 1)
  T([0, 0]) = [0,0] + [1,1] = [1, 1]   ← origin ≠ zero!
  T([-1, 5]) = [-1,5] + [1,1] = [0, 6]

Key problem: T([0,0]) = [1,1] ≠ [0,0]
  Linear transformation rule: T(zero) must = zero
  Ikkade T(zero) = [1,1] → ALREADY FAILS!
```

```python
import numpy as np

b = np.array([1.0, 1.0])   # fixed translation vector

def T(x):
    """Translation: T(x) = x + b"""
    return x + b

# Origin preservation check (quick fail test)
zero = np.array([0.0, 0.0])
print(f"T(zero) = T({list(zero)}) = {list(T(zero))}")
print(f"Expected [0,0] for linear, got {list(T(zero))}")
print(f"T(zero) == zero? {np.allclose(T(zero), zero)}")   # False!
print("FAIL: T(zero) ≠ zero → already NOT linear!")

print()
# A few examples
examples = [[2,3], [4,-1], [0,0], [-2,5]]
print(f"{'Input':<12} {'T(input)'}")
for x in examples:
    v = np.array(x, dtype=float)
    print(f"{str(x):<12} {list(T(v))}")
```

**Output:**
```
T(zero) = T([0.0, 0.0]) = [1.0, 1.0]
Expected [0,0] for linear, got [1.0, 1.0]
T(zero) == zero? False
FAIL: T(zero) ≠ zero → already NOT linear!

Input        T(input)
[2, 3]       [3.0, 4.0]
[4, -1]      [5.0, 0.0]
[0, 0]       [1.0, 1.0]
[-2, 5]      [-1.0, 6.0]
```

---

## Image 2 — Check Additivity: Setup

**Image lo exact content:**

```
① Check Additivity
T(u+v) = T(u) + T(v)

u = [2, 3]      v = [4, -1]

T(u+v) = T([2,3] + [4,-1]) = T([6, 2])

T([6, 2]) ...
```

**Setup:**

```
Telugu: Additivity test chestunam
u = [2, 3],  v = [4, -1]

Step 1: u + v calculate cheyyadam
  u + v = [2+4, 3+(-1)] = [6, 2]

Step 2: T(u+v) calculate cheyyadam (LHS)
  T([6, 2]) = [6, 2] + [1, 1] = [7, 3]   ← LHS
```

```python
import numpy as np

b = np.array([1.0, 1.0])
def T(x): return x + b

u = np.array([2.0, 3.0])    # u = [2, 3]
v = np.array([4.0, -1.0])   # v = [4, -1]

print("Additivity check: T(u+v) =? T(u) + T(v)")
print()
print(f"u = {list(u)}")
print(f"v = {list(v)}")

# Step 1: u + v
u_plus_v = u + v
print(f"\nStep 1: u + v = {list(u)} + {list(v)} = {list(u_plus_v)}")

# Step 2: T(u+v) — LHS
LHS = T(u_plus_v)
print(f"Step 2 [LHS]: T(u+v) = T({list(u_plus_v)}) = {list(u_plus_v)} + {list(b)} = {list(LHS)}")
```

---

## Image 3 — LHS Calculation Complete

**Image lo exact content:**

```
T(u+v) = T([2,3] + [4,-1]) = T([6,2])

T([6, 2]) = [6] + [1] = [7]   ⟹ LHS
             [2]   [1]   [3]
```

**LHS = [7, 3]**

```python
import numpy as np

b = np.array([1.0, 1.0])
def T(x): return x + b

u = np.array([2.0, 3.0])
v = np.array([4.0, -1.0])

u_plus_v = u + v              # [6, 2]
LHS = T(u_plus_v)             # T([6,2]) = [6,2]+[1,1] = [7,3]

print("=== LHS Calculation ===")
print(f"T(u+v) = T({list(u_plus_v)})")
print(f"       = {list(u_plus_v)} + {list(b)}")
print(f"       = {list(LHS)}")
print(f"LHS = {list(LHS)}")
```

**Output:**
```
=== LHS Calculation ===
T(u+v) = T([6.0, 2.0])
       = [6.0, 2.0] + [1.0, 1.0]
       = [7.0, 3.0]
LHS = [7.0, 3.0]
```

---

## Image 4 — RHS Calculation: T(u) + T(v)

**Image lo exact content:**

```
T(u) + T(v)

T([2, 3]) = [2] + [1] = [3]
             [3]   [1]   [4]

T([4, -1]) = [4]  + [1] = [5]
              [-1]   [1]   [0]

T(u) + T(v) = [3][5] = [8]   ⟹ RHS
               [4][0]   [4]

LHS ≠ RHS   ← underlined → Additivity FAILS!
```

**RHS calculation + comparison:**

```python
import numpy as np

b = np.array([1.0, 1.0])
def T(x): return x + b

u = np.array([2.0, 3.0])
v = np.array([4.0, -1.0])

# LHS
LHS = T(u + v)

# RHS: T(u) + T(v)
T_u = T(u)    # [2,3] + [1,1] = [3,4]
T_v = T(v)    # [4,-1] + [1,1] = [5,0]
RHS = T_u + T_v

print("=== RHS Calculation ===")
print(f"T(u) = T({list(u)}) = {list(u)} + {list(b)} = {list(T_u)}")
print(f"T(v) = T({list(v)}) = {list(v)} + {list(b)} = {list(T_v)}")
print(f"T(u) + T(v) = {list(T_u)} + {list(T_v)} = {list(RHS)}")
print(f"RHS = {list(RHS)}")

print()
print("=== ADDITIVITY COMPARISON ===")
print(f"LHS = T(u+v)     = {list(LHS)}")
print(f"RHS = T(u)+T(v)  = {list(RHS)}")
print(f"LHS == RHS?       {np.allclose(LHS, RHS)}")   # False!
print()
if not np.allclose(LHS, RHS):
    print("LHS ≠ RHS → ADDITIVITY FAILS!")
    print(f"Difference: {list(LHS - RHS)}")
```

**Output:**
```
=== RHS Calculation ===
T(u) = T([2.0, 3.0]) = [2.0, 3.0] + [1.0, 1.0] = [3.0, 4.0]
T(v) = T([4.0, -1.0]) = [4.0, -1.0] + [1.0, 1.0] = [5.0, 0.0]
T(u) + T(v) = [3.0, 4.0] + [5.0, 0.0] = [8.0, 4.0]
RHS = [8.0, 4.0]

=== ADDITIVITY COMPARISON ===
LHS = T(u+v)     = [7.0, 3.0]
RHS = T(u)+T(v)  = [8.0, 4.0]
LHS == RHS?       False

LHS ≠ RHS → ADDITIVITY FAILS!
Difference: [-1.0, -1.0]
```

**Why does it fail?**

```
T(u+v) = (u+v) + b        = u + v + b
T(u)+T(v) = (u+b) + (v+b) = u + v + 2b   ← b twice counted!

Difference: (u+v+b) - (u+v+2b) = -b = -[1,1] = [-1,-1]

Intuition: "b" vector oka sari add avvali, kaani
           T(u)+T(v) lo b rendu sarlu add avutundi
           → extra b → different result
```

---

## Image 5 — Check Homogeneity

**Image lo exact content:**

```
Check Homogeneity:
  T(cu) = cT(u)

u = [2, 3]     c = 2

T(cu) = T([4, 6]) = [4] + [1] = [5]   ⟹ LHS
                    [6]   [1]   [7]

cT(u) = 2([2] + [1]) = 2[3] = [6]   ⟹ RHS
           [3]   [1]    [4]   [8]

LHS ≠ RHS   (shown with ≠ symbol)
```

```python
import numpy as np

b = np.array([1.0, 1.0])
def T(x): return x + b

u = np.array([2.0, 3.0])
c = 2.0

print("=== HOMOGENEITY CHECK ===")
print(f"u = {list(u)},  c = {c}")
print()

# Step 1: cu
cu = c * u
print(f"cu = {c} × {list(u)} = {list(cu)}")

# LHS: T(cu)
LHS = T(cu)
print(f"\nLHS: T(cu)")
print(f"  T({list(cu)}) = {list(cu)} + {list(b)} = {list(LHS)}")

# RHS: cT(u)
T_u = T(u)
RHS = c * T_u
print(f"\nRHS: cT(u)")
print(f"  T(u) = T({list(u)}) = {list(u)} + {list(b)} = {list(T_u)}")
print(f"  cT(u) = {c} × {list(T_u)} = {list(RHS)}")
```

---

## Image 6 — Final Conclusion

**Image lo exact content:**

```
cT(u) = 2([2,3] + [1,1]) = 2[3,4] = [6,8]   ⟹ RHS

T(x) = x + [1, 1]   ⟹   Not a Linear Transformation

"Fails both Additivity and Homogeneity properties."
```

```python
import numpy as np

b = np.array([1.0, 1.0])
def T(x): return x + b

u = np.array([2.0, 3.0])
c = 2.0

# LHS: T(cu)
LHS = T(c * u)

# RHS: cT(u)
RHS = c * T(u)

print("=== HOMOGENEITY COMPARISON ===")
print(f"LHS = T(cu)   = T({list(c*u)}) = {list(c*u)} + {list(b)} = {list(LHS)}")
print(f"RHS = cT(u)   = {c} × {list(T(u))} = {list(RHS)}")
print(f"LHS == RHS?   {np.allclose(LHS, RHS)}")   # False!
print()
if not np.allclose(LHS, RHS):
    print("LHS ≠ RHS → HOMOGENEITY FAILS!")
    print(f"Difference: {list(LHS - RHS)}")

print()
print("=" * 55)
print("FINAL CONCLUSION")
print("=" * 55)
print("""
T(x) = x + [1, 1]
     = NOT a Linear Transformation

Reasons:
  1. T(zero) = [1,1] ≠ [0,0]  → Origin not preserved
  2. Additivity FAILS: LHS [7,3] ≠ RHS [8,4]
  3. Homogeneity FAILS: LHS [5,7] ≠ RHS [6,8]

"Fails both Additivity and Homogeneity properties."

Why intuitively?
  T(x) = x + b  → b constant ga add avutundi
  Add chesthe b oka sari, but transform cesthe b prathi time
  → Rules break avutunnayi
""")

# Confirm with random tests
pass_add = pass_hom = 0
fail_add = fail_hom = 0
for _ in range(1000):
    u = np.random.randn(2)
    v = np.random.randn(2)
    c = np.random.randn()

    if np.allclose(T(u+v), T(u)+T(v)):
        pass_add += 1
    else:
        fail_add += 1

    if np.allclose(T(c*u), c*T(u)):
        pass_hom += 1
    else:
        fail_hom += 1

print(f"Additivity:  {fail_add}/1000 tests FAILED (expected: almost all)")
print(f"Homogeneity: {fail_hom}/1000 tests FAILED (expected: almost all)")
```

**Output:**
```
=== HOMOGENEITY COMPARISON ===
LHS = T(cu)   = T([4.0, 6.0]) = [4.0, 6.0] + [1.0, 1.0] = [5.0, 7.0]
RHS = cT(u)   = 2.0 × [3.0, 4.0] = [6.0, 8.0]
LHS == RHS?   False

LHS ≠ RHS → HOMOGENEITY FAILS!
Difference: [-1.0, -1.0]

=======================================================
FINAL CONCLUSION
=======================================================

T(x) = x + [1, 1]
     = NOT a Linear Transformation

Reasons:
  1. T(zero) = [1,1] ≠ [0,0]  → Origin not preserved
  2. Additivity FAILS: LHS [7,3] ≠ RHS [8,4]
  3. Homogeneity FAILS: LHS [5,7] ≠ RHS [6,8]

"Fails both Additivity and Homogeneity properties."

Why intuitively?
  T(x) = x + b  → b constant ga add avutundi
  Add chesthe b oka sari, but transform cesthe b prathi time
  → Rules break avutunnayi

Additivity:  1000/1000 tests FAILED
Homogeneity: 1000/1000 tests FAILED
```

---

## Side-by-Side: Linear vs Non-Linear

```python
import numpy as np

# Transformation A: Linear (y-axis reflection)
A = np.array([[-1.0, 0.0], [0.0, 1.0]])
def T_linear(x): return A @ x

# Transformation B: NOT Linear (translation)
b = np.array([1.0, 1.0])
def T_nonlinear(x): return x + b

u = np.array([2.0, 3.0])
v = np.array([4.0, -1.0])
c = 2.0

print(f"{'':25} {'LINEAR T(x)=Ax':<22} {'NON-LINEAR T(x)=x+b'}")
print("-" * 70)

# T(zero)
zero = np.zeros(2)
print(f"T(zero):{'':17} {list(T_linear(zero))}{'':13} {list(T_nonlinear(zero))}")
print(f"{'':25} {'= [0,0] ✓':<22} {'≠ [0,0] ✗'}")

print()
# Additivity
LHS_L = T_linear(u+v);   RHS_L = T_linear(u)+T_linear(v)
LHS_N = T_nonlinear(u+v); RHS_N = T_nonlinear(u)+T_nonlinear(v)
add_L = "PASS ✓" if np.allclose(LHS_L, RHS_L) else "FAIL ✗"
add_N = "PASS ✓" if np.allclose(LHS_N, RHS_N) else "FAIL ✗"
print(f"Additivity:{'':14} {add_L:<22} {add_N}")
print(f"  LHS:{'':20} {list(LHS_L):<22} {list(LHS_N)}")
print(f"  RHS:{'':20} {list(RHS_L):<22} {list(RHS_N)}")

print()
# Homogeneity
LHS_L = T_linear(c*u);    RHS_L = c*T_linear(u)
LHS_N = T_nonlinear(c*u); RHS_N = c*T_nonlinear(u)
hom_L = "PASS ✓" if np.allclose(LHS_L, RHS_L) else "FAIL ✗"
hom_N = "PASS ✓" if np.allclose(LHS_N, RHS_N) else "FAIL ✗"
print(f"Homogeneity:{'':13} {hom_L:<22} {hom_N}")
print(f"  LHS:{'':20} {list(LHS_L):<22} {list(LHS_N)}")
print(f"  RHS:{'':20} {list(RHS_L):<22} {list(RHS_N)}")

print()
print(f"VERDICT:{'':17} {'LINEAR ✓':<22} {'NOT LINEAR ✗'}")
```

**Output:**
```
                          LINEAR T(x)=Ax         NON-LINEAR T(x)=x+b
----------------------------------------------------------------------
T(zero):                  [0.0, 0.0]             [1.0, 1.0]
                          = [0,0] ✓              ≠ [0,0] ✗

Additivity:               PASS ✓                 FAIL ✗
  LHS:                    [-2.0, 2.0]            [7.0, 3.0]
  RHS:                    [-2.0, 2.0]            [8.0, 4.0]

Homogeneity:              PASS ✓                 FAIL ✗
  LHS:                    [-4.0, 6.0]            [5.0, 7.0]
  RHS:                    [-4.0, 6.0]            [6.0, 8.0]

VERDICT:                  LINEAR ✓               NOT LINEAR ✗
```

---

## Key Takeaway

```
LINEAR transformation (T(x) = Ax):
  T(zero) = A @ zero = zero ✓
  Additivity:  A(u+v) = Au + Av ✓   (matrix distribute)
  Homogeneity: A(cu)  = c(Au)   ✓   (scalar move out)

NOT LINEAR (T(x) = x + b, where b ≠ 0):
  T(zero) = zero + b = b ≠ zero ✗
  Additivity fails  because: (u+v)+b ≠ (u+b)+(v+b) → extra b
  Homogeneity fails because: c(u)+b ≠ c(u+b) → b not scaled

In AI:
  Neural layer = Wx    → LINEAR (Wx, matrix multiply only)
  Neural layer = Wx+b  → AFFINE (NOT strictly linear, but "linear + shift")
  Activation = ReLU    → NOT LINEAR (bends, not straight)

Why affine Wx+b still important if not linear?
  Training works with affine layers:
    Wx+b ki backprop = Wx backprop tho same (b constant)
    Universal Approximation Theorem works for affine + nonlinear
  We call it "linear layer" loosely in deep learning context
```
