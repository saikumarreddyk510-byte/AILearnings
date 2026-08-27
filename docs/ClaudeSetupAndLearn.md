# 🤖 Claude Setup And Learn

![Claude Code](https://img.shields.io/badge/Claude%20Code-CLI-a855f7?style=for-the-badge&logo=anthropic&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-11-0078D6?style=for-the-badge&logo=windows11&logoColor=white)
![Status](https://img.shields.io/badge/Setup-Complete-22c55e?style=for-the-badge)

Claude Code CLI ni setup chesi, terminal lo Claude tho work cheyyadaniki complete guide. Prathi step ni **simple ga (Telugu + English mix)** explain chestham — other notebooks laaga.

## 📑 Contents

| # | Section |
|---|---|
| 1️⃣ | [Installation (CLI)](#1-installation-claude-code-cli-install-cheyyadam) |
| 2️⃣ | [Install via VS Code Extension](#1b-second-way--vs-code-gui-nunchi-install-cheyyadam-extension) |
| 3️⃣ | [PATH Environment Variable](#2-path-environment-variable-set-cheyyadam) |
| 4️⃣ | [Verify Installation](#4-install-ayyaka-verify-cheyyadam-recognising-undaa-ledaa) |
| 5️⃣ | [Start Claude & Login](#5-claude-start-cheyyadam) |
| 6️⃣ | [Basic Usage](#6-basic-usage-common-commands) |
| 7️⃣ | [Troubleshooting](#7-troubleshooting-problems--fixes) |
| ✅ | [Setup Checklist](#-setup-checklist) |
| 💡 | [Learnings](#-learnings) |

---

## 1️⃣ Installation (`Claude Code CLI` install cheyyadam)

### 🖥️ Command (CMD prompt lo run cheyyali)

```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

### ❓ Idi enti? (Simple ga)

Ee oka line lo **3 panulu** okesari jarugutai — `&&` tho connect chesam (mundu command success aithe next run avutundi).

```
curl ... -o install.cmd   →   install.cmd   →   del install.cmd
   (download)                   (run)              (cleanup)
```

### 🔍 Prathi part enduku? (Line by line)

- 🌐 **`curl`**
  - Internet nunchi files download cheyyadaniki tool (Windows lo built-in undi).
  - "Client URL" — oka URL nunchi data teeskuni vachedi.

- 🚩 **`-fsSL`** — ivi 4 flags kalisi unnai:
  - **`-f` (fail)** — server error (404 laanti) vasthe, crash avvakunda silent ga fail avutundi. Broken file save cheyyadu.
  - **`-s` (silent)** — download progress bar chupinchadu, terminal clean ga untundi.
  - **`-S` (show error)** — silent aina, **real error** vasthe matram chupistundi (`-s` tho kalipi vadatam).
  - **`-L` (location)** — URL redirect aithe (link marithe), kotha location ki follow avutundi.

- 🔗 **`https://claude.ai/install.cmd`**
  - Idi **official Claude install script** URL. Ee file download avutundi.

- 💾 **`-o install.cmd`**
  - **`-o` (output)** — download chesina content ni `install.cmd` ane file lo save cheyyi.
  - `-o` lekapothe, curl content ni screen meeda print chestundi (save cheyyadu).

- ▶️ **`&& install.cmd`**
  - **`&&`** — mundu command **success (exit code 0)** aithe matrame next run avutundi.
  - `install.cmd` — download chesina script ni **run** chestundi → idi actual Claude ni install chestundi.

- 🧹 **`&& del install.cmd`**
  - Install ayyaka, **temporary `install.cmd` file ni delete** chestundi (cleanup).
  - `del` = Windows CMD lo file delete command (`rm` laantidi Linux lo).

### 🧸 Kid Analogy

- 📬 `curl -o` = shop nunchi oka **instruction paper** (install.cmd) download chesi intiki teeskuni raavadam.
- 📋 `install.cmd` = aa paper meeda instructions **follow chesi** Claude ni install cheyyadam.
- 🗑️ `del install.cmd` = pani aipoyaka aa **paper ni chettabutta** (dustbin) lo veyadam — avasaram ledu kabatti.

> [!NOTE]
> Idi **CMD prompt** lo run cheyyali (PowerShell lo `&&` older versions lo work avvakapovachu). CMD open cheyyadaniki: `Win + R` → `cmd` → Enter.

---

## 1️⃣🅱️ Second Way — VS Code GUI nunchi install cheyyadam (Extension)

Command line istamledu ante, **VS Code GUI** nunchi kuda Claude Code install cheyyachu — **Extension** ga. Idi easy ga, mouse clicks tho aipoతుంది.

### 🪜 Steps (VS Code lo)

1. VS Code open cheyyi.
2. Left sidebar lo **Extensions** icon click cheyyi (leda **`Ctrl + Shift + X`**).
3. Search box lo type cheyyi: **`Claude Code`**.
4. **"Claude Code for VS Code"** (publisher: **Anthropic** ✅ verified) select cheyyi.
5. **Install** button click cheyyi.
6. Install ayyaka → **Reload** avasaram aithe VS Code reload cheyyi.

### 🧾 Extension details (screenshot lo unnavి)

| Field | Value |
|-------|-------|
| 📛 **Name** | Claude Code for VS Code |
| 🏢 **Publisher** | Anthropic (`anthropic.com` — verified ✅) |
| 🆔 **Identifier** | `anthropic.claude-code` |
| 🔢 **Version** | `2.1.226` |
| 📈 **Installs** | 22M+ (chala popular) |

### ✨ Ee extension emi chestundi? (Features)

- 🧠 **Powerful intelligence** — latest Claude models (mee **Pro / Max / Team** subscription tho, leda pay-as-you-go).
- 🤝 **Works alongside you** — Claude **codebase explore** chesi, code read/write chesi, **terminal commands** run chestundi (mee permission tho).
- 🧩 **Integrated with editor** — Claude ki **current file** and **text selection** telustundi → direct ga **editor lo changes** propose chestundi.
- ⚙️ **Agentic features** — **subagents**, **custom slash commands**, and **MCP** support.

### ⚖️ CLI vs Extension (rendu madhya difference)

| | 🖥️ **Way 1: CLI** (`curl` install) | 🧩 **Way 2: Extension** (VS Code GUI) |
|---|---|---|
| **Ela** | Terminal lo `claude` command | VS Code lo panel/chat |
| **Setup** | Install + PATH + login | Extensions lo Install + login |
| **Best for** | Terminal-first workflow | Editor lo undagane help kaavali |
| **Context** | Folder files | Current file + selection direct ga |

> [!NOTE]
> Rendu **same account/subscription** tho login avuతాయి — okati install chesthe okati kuda work chestundi. CLI + Extension **rendu kalisi** use cheyyachu.

> [!TIP]
> Extension install chesaka, **Auto Update** ✅ on unchi (screenshot lo unnattu) — kotha versions automatic ga vastai.

---

## 2️⃣ PATH Environment Variable set cheyyadam

Install ayyaka, `claude.exe` ikkada untundi:

```
C:\Users\saiku\.local\bin\claude.exe
```

Kani ee **folder ni PATH lo add cheyyakapothe**, `claude` command ni **only aa folder lo matrame** run cheyyagalam. PATH lo add chesthe, **ye folder nunchi ayina** `claude` type chesi run cheyyachu.

### ❓ Enduku PATH kavali? (Simple ga)

- 📖 **PATH** = Windows ki oka **"ekkada programs వెతకాలో"** cheppే list.
- Nuvvu `claude` ani type chesinappudu, Windows ee PATH lo unna anni folders lo `claude.exe` ni వెతుకుతుంది.
- Mana `claude.exe` unna folder (`C:\Users\saiku\.local\bin`) ee list lo unte → **ye chota nunchi ayina** `claude` work avutundi.

### 🪜 Steps (Environment Variables lo add cheyyadam)

1. **`Win + R`** → `sysdm.cpl` type chesi Enter (System Properties open avutundi).
2. **Advanced** tab → **Environment Variables** button click.
3. **User variables** section lo → **`Path`** select chesi → **Edit** click.
4. **New** click → ee path paste cheyyi:
   ```
   C:\Users\saiku\.local\bin
   ```
   > [!WARNING]
   > Folder path matrame add cheyyi (`\claude.exe` **kaadu**) — folder ni add chesthe adi lo unna anni `.exe` files access avutai.
5. **OK** → **OK** → **OK** (anni dialogs close cheyyi).
6. **Terminal restart** cheyyi (kotha PATH load avvadaniki). Open unna terminals ni close chesi malli open cheyyi.

### 🧸 Kid Analogy

- 📞 PATH = oka **phone book** laantidi — "ee peru unte, ee address lo untadu" ani.
- ✍️ `claude.exe` folder ni PATH lo add cheyyadam = phone book lo **Claude address** raayadam.
- 📲 Ippudu `claude` ani "call" chesthe, Windows address telisి direct ga run chestundi — folder ki velladam avasaram ledu.

> [!TIP]
> PATH correct ga add ayindo check cheyyadaniki, **kotha** terminal lo:
> ```cmd
> claude --version
> ```
> Version vasthe → PATH setup **success** ✅

---

## 4️⃣ Install ayyaka verify cheyyadam (recognising undaa ledaa)

Install + PATH setup correct ga ayindo ledo check cheyyadaniki, **kotha CMD prompt** open chesi (`Win + R` → `cmd` → Enter):

### 🔎 Step 1: Version check

```cmd
claude --version
```

- ✅ Version number vasthe (example `1.x.x`) → **install + PATH success**.
- ❌ `'claude' is not recognized...` vasthe → terminal **restart** cheyyi (PATH refresh avutundi), leda system restart.

### 🔎 Step 2: `claude` type chesi recognising undaa ani confirm cheyyadam

CMD prompt lo direct ga:

```cmd
claude
```

- ✅ **Claude interactive session open aithe** → command **recognise avutundi**, setup **complete**.
- ❌ `'claude' is not recognized as an internal or external command...` error vasthe:
  - PATH lo folder correct ga add ayindaa check cheyyi (`C:\Users\saiku\.local\bin`).
  - **Terminal / CMD ni close chesi malli open** cheyyi (kotha PATH aa session ki matrame apply avutundi).
  - Inka work avvakapothe → **system restart** cheyyi.

> [!IMPORTANT]
> PATH change chesaka, **already open unna terminals ki kotha PATH ravadu**. Anduke prathi sari **kotha terminal** open chesi test cheyyali.

---

## 5️⃣ Claude start cheyyadam

Project folder lo Claude ni start cheyyadaniki:

```cmd
cd c:\learnAi
claude
```

- 📂 **`cd c:\learnAi`** — mana project folder loki velladam.
- 🚀 **`claude`** — Claude Code ni aa folder context lo start cheyyadam. Ippudu Claude mee files chusi help cheyyagaladu.

### 🔑 First time login

- Modati sari start chesinappudu, **browser open ai login** adugutundi.
- Claude account tho login cheyyi → terminal ki tirigi vasthe ready.

### 🪪 Login method select cheyyadam (Subscription vs API)

Modati sari `claude` run chesinappudu, **login method** ni select cheyyamani options chupistundi:

| Option | Enduku (What it means) |
|--------|------------------------|
| 💳 **1. Claude subscription (Pro / Max)** | Nenu **subscription konnanu** kabatti **ee first option** select chestunna. Extra API charges undavu — subscription plan lo included. |
| 🔌 **2. Anthropic Console (API key)** | Pay-as-you-go — prathi request ki **API credits** charge avutundi. Subscription lekapothe ee option. |

> [!TIP]
> **Nenu select chesindi:** **Option 1 (Claude subscription)** — enduku ante nenu already **Pro/Max subscription buy chesanu**, so separate API billing avasaram ledu.

### 🪜 Login steps (Option 1 select chesaka)

1. **`1`** press chesi Enter (subscription option).
2. **Browser automatic ga open avutundi** → Claude login page.
3. Mee **Claude account** (subscription unna account) tho login cheyyi.
4. **"Authorize" / "Allow"** click cheyyi (Claude Code ki access ivvadaniki).
5. Browser lo **"success"** message vasthe → **terminal ki tirigi raa**.
6. Terminal lo **ready prompt** kanipistundi → ippudu Claude use cheyyachu ✅.

> [!IMPORTANT]
> Subscription option select chesthe, **same account** lo login avvali — ye account lo subscription unte ade account tho.

### 🎉 Login success — Welcome screen (finally landed here!)

Login complete ayyaka, Claude Code **welcome screen** kanipistundi:

```
──── Claude Code v2.1.226 ────────────────────────────────
   Welcome back Sai kumar Reddy!

   Sonnet 5 · Claude Pro · kskreddy.10@gmail.com's Organization
   C:\Users\saiku
──────────────────────────────────────────────────────────
```

### 🧩 Screen lo emi chupistundi? (Prathi line ardham)

- 🔢 **`Claude Code v2.1.226`** — install ayina **version** (idi latest ani confirm).
- 👋 **`Welcome back Sai kumar Reddy!`** — login **success**, mee name tho greet chestundi ✅.
- 🧠 **`Sonnet 5 · Claude Pro`** — active **model** (Sonnet 5) and mee **plan** (Claude Pro subscription). Subscription option correct ga work ayindi ✅.
- 🏢 **`kskreddy.10@gmail.com's Organization`** — login ayina **account/organization**.
- 📁 **`C:\Users\saiku`** — Claude ippudu **ee folder** (home directory) lo run avutundi.

### 💡 Mukhyamaina 2 tips (welcome screen lo chupinchevi)

1. 📝 **`/init` run cheyyi** → project lo oka **`CLAUDE.md`** file create avutundi — Claude ki mee project gurinchi instructions ivvadaniki (context, rules, conventions).
2. ⚠️ **Home directory warning** — "You have launched claude in your **home directory**" ani vasthe:
   - Nuvvu `C:\Users\saiku` (home) lo start chesav — idi **too broad** (anni files access).
   - **Better:** project folder loki `cd` chesi start cheyyi:
     ```cmd
     cd c:\learnAi
     claude
     ```
   - Ala chesthe Claude **only aa project files** meeda focus chestundi.

### 🔄 Model switch cheyyadam

- Screen lo: *"Tackle your toughest work with Opus 5. Switch anytime with `/model`."*
- **`/model`** type chesi → different model (Sonnet 5 / Opus 5) ki switch cheyyachu.
  - ⚡ **Sonnet 5** — fast, daily coding tasks ki (default).
  - 🧠 **Opus 5** — toughest / complex work ki (deep reasoning).

### ✅ First test

- Prompt lo `hey` type chesi Enter → Claude reply isthe (**"Hey! What are you working on today?"**) → **setup 100% complete** ✅🎉.

---

## 6️⃣ Basic Usage (Common commands)

| Command | Enduku (What it does) |
|---------|----------------------|
| `claude` | 🚀 Interactive session start cheyyadam |
| `claude "your question"` | 💬 Direct ga oka question adagadam |
| `/init` | 📝 Project ki `CLAUDE.md` (instructions file) create cheyyadam |
| `/model` | 🔄 Model switch cheyyadam (Sonnet 5 ↔ Opus 5) |
| `/release-notes` | 🆕 Kotha features / updates chudadam |
| `/help` | ❓ Available commands list chudadam |
| `/clear` | 🧹 Conversation clear cheyyadam (fresh start) |
| `/exit` | 🚪 Claude nunchi bayataki raavadam |

---

## 7️⃣ Troubleshooting (Problems + Fixes)

| ⚠️ Problem | 🛠️ Fix |
|---------|-----|
| `'claude' is not recognized` | Terminal restart cheyyi (PATH reload avvadaniki) |
| `curl not found` | Windows 10/11 lo curl built-in — old Windows aithe update cheyyi |
| Install fail (network) | Internet check cheyyi, malli command run cheyyi |
| `&&` PowerShell lo work avvatledu | **CMD** prompt use cheyyi (PowerShell kaadu) |

---

## ✅ Setup Checklist

- [x] 📦 Claude Code CLI install (`curl` command tho)
- [x] 🧩 (Alternative) VS Code Extension install — `anthropic.claude-code`
- [x] 🛤️ PATH environment variable lo `C:\Users\saiku\.local\bin` add
- [x] 🔍 `claude --version` tho verify
- [x] 💻 CMD lo `claude` type chesi recognising confirm
- [x] 🪪 Login method select (Option 1 — Claude subscription)
- [x] 🔑 Account login complete (Welcome screen — Claude Pro, Sonnet 5)
- [x] 🎉 First `claude` session start (replied to `hey` ✅)

## 💡 Learnings

- 🚩 `curl -fsSL` flags: fail-silent-showError-location combo — clean, safe download ki standard.
- ⛓️ `&&` = chain commands, mundu success aithe matrame next run.
- 🧹 `del` = CMD lo file delete (cleanup step).

## 🔗 References

- 📚 Claude Code docs: https://docs.anthropic.com/claude/docs
- 📥 Install script: https://claude.ai/install.cmd
