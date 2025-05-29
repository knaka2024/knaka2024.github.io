---

# Minesweeper（マインスイーパー） Verilog HDL実装

*DAシンポジウム アルゴリズムデザインコンテスト課題*

---

## 1. 概要

本プロジェクトは、クラシックゲーム「**マインスイーパー**」を**Verilog HDL**で実装したものです。

開発・シミュレーション環境は以下を使用しています：

* **Icarus Verilog**（コンパイル・シミュレーション）
* **GTKWave**（波形表示）
* OS：**Ubuntu 24.04**

---

## 2. プロジェクト構成

### 2.1 `top.v` — トップモジュール

全コンポーネントを接続するトップモジュールです。

* `board.v`（盤面管理）
* `solver.v`（セル選択）
* `counter.v`（セルカウンタ）

各モジュール間の信号を制御し、盤面情報を出力します。

---

### 2.2 `board.v` — 盤面管理モジュール

* 外部ファイルから盤面情報を読み込み初期化
* セル選択や再帰的なセル開放処理を実装
* セルごとに地雷・数字・開放状態を管理
* ゲームの終了を判定

---

### 2.3 `counter.v` — セルカウンタモジュール

* 開かれたセル数のカウント
* 開いたセルの中で地雷が何個あるかカウント（オープンした地雷は`0x1F`）
* 毎クロックごとに状態を更新

---

### 2.4 `solver.v` — セル選択モジュール

* サンプルとしてセルをを順番に選択する簡易アルゴリズムを実装
* セル選択に要したクロック数を計測して出力
* 高度なセル選択アルゴリズムへ更新可能

---

### 2.5 `testbench.v` — シミュレーション用テストベンチ

* クロックとリセットの生成
* 外部ファイルから盤面サイズ・内容を読み込み
* 基本的なセル選択動作を模擬
* 波形ファイル（`wave.vcd`）を生成
* 一定サイクル後にシミュレーション終了

---

## 3. シミュレーション手順

### 3.1 コンパイル

```bash
$ iverilog -o minesweeper_sim top.v board.v counter.v solver.v testbench.v
```

### 3.2 シミュレーション実行

```bash
$ vvp minesweeper_sim
```

### 3.3 波形表示（任意）

```bash
$ gtkwave wave.vcd
```

---

## 4. ファイル一覧

| ファイル名 		| 説明                			|
| ---------------- | ----------------- 				|
| `top.v`          | トップモジュール          			|
| `board.v`        | 盤面管理モジュール         		|
| `counter.v`      | 開いたセル・地雷カウンタ      		|
| `solver.v`       | 自動解答モジュール         		|
| `testbench.v`    | シミュレーション用テストベンチ   		|
| `board.txt`      | 盤面データ（セルの内容）      		|
| `board_size.txt` | 盤面サイズ（行数・列数）      		|
| `wave.vcd`       | 波形データ（シミュレーション出力）	|

---

## 5. 補足

* `solver` モジュールにセル選択アルゴリズムを搭載可能
* 盤面サイズは最大256セル（16×16）まで対応

---



---

# Minesweeper in Verilog HDL

*A project for the Algorithm Design Contest, DA Symposium*

---


## 1. Overview

This project implements the classic **Minesweeper** game using **Verilog HDL**, designed to run in an FPGA-friendly, synthesizable environment. 

All components are verified via simulation using:

* **Icarus Verilog** for compilation/simulation
* **GTKWave** for waveform debugging
* Development environment: **Ubuntu 24.04**

---

## 2. Project Structure

### 2.1 `top.v` — Top Module

This is the main module that connects all subsystems:

* `board.v` (board manager)
* `solver.v` (cell selector)
* `counter.v` (open/bomb cell counter)

It manages global signal routing and outputs the board state for visualization or testing.

---

### 2.2 `board.v` — Board Management

Responsible for:

* Initializing the game board from files (`board.txt`, `board_size.txt`)
* Handling cell selection and opening (both direct and recursive)
* Maintaining per-cell content (number or bomb) and open status
* Detecting game continuation

---

### 2.3 `counter.v` — Open/Bomb Counter

Monitors the board state (`current_board`) and:

* Counts the number of opened cells
* Counts how many opened cells contain bombs (value `0x1F`)

---

### 2.4 `solver.v` — Cell Selector

Implements a simple algorithm to automatically select cells to open:

* Currently selects cells cyclically as a placeholder
* Tracks and outputs the number of **clock cycles** taken for each decision
* Can be implemented with a more advanced solver logic

---

### 2.5 `testbench.v` — Simulation Testbench

Stimulates the system under test:

* Initializes clock and reset
* Loads board layout and size from external files
* Simulates basic cell selection
* Dumps waveform data to `wave.vcd` for GTKWave
* Ends simulation after a fixed period

---

## 3. Simulation Instructions

### 3.1 Compile

```bash
$ iverilog -o minesweeper_sim top.v board.v counter.v solver.v testbench.v
```

### 3.2 Run Simulation

```bash
$ vvp minesweeper_sim
```

### 3.3 View Waveform (Optional)

```bash
$ gtkwave wave.vcd
```

---

## 4. File List

| File             | Description                     |
| ---------------- | ------------------------------- |
| `top.v`          | Top-level system module         |
| `board.v`        | Minesweeper board manager       |
| `counter.v`      | Opened/bomb cell counter        |
| `solver.v`       | Automatic solver logic          |
| `testbench.v`    | Simulation testbench            |
| `board.txt`      | Board layout (cell values)      |
| `board_size.txt` | Board size (rows and columns)   |
| `wave.vcd`       | Simulation waveform (generated) |

---

## 5. Notes

* The `solver` module can be replaced with an intelligent algorithm .
* The file format for boards supports up to 256 cells (16x16).

---


