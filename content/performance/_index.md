---
title: 'Performance Evaluation'
weight: 300
---
---

We measured how long the Python and Rust versions take to prepare an election, create a ballot and count the votes. All tests ran on the same laptop.

Rust was faster in all five comparison cases. For the baseline election, creating and casting **one ballot** took **12.04 milliseconds in Rust**, compared with **3.91 seconds in Python**. A larger Rust test with 10,000 voters took **12.3 minutes** to count the votes and run the measured result checks. These timings cover computer processing; they do not include the time a voter spends choosing candidates or waiting for the network.

## What we tested

We compared five small elections with different numbers of voters, ballots and candidates. A list is a group of candidates. Submitted ballots include invalid ballots and replacement votes, so their number can exceed the number of voters.

Each test used one authority to issue voting credentials (**RT**, Registration Teller), one to count the votes (**TT**, Tabulation Teller), and one service to receive ballots (**BB**, Ballot Box).

| Case | Enrolled voters | Submitted ballots | Lists | Candidates |
| --- | ---: | ---: | ---: | ---: |
| Referendum | 5 | 6 | 1 | 2 |
| Small | 5 | 6 | 2 | 4 |
| Baseline | 9 | 10 | 2 | 4 |
| Larger ballot | 9 | 10 | 4 | 16 |
| More ballots | 19 | 20 | 2 | 4 |

Most tables use **milliseconds (ms): 1,000 ms = 1 second**. The unit column says whether a time is for one voter, one ballot, one check or the whole election. A dash means the operation was not measured. The larger-election table uses seconds.

Each of the five cases has one measured run. Rust uses an optimized build and runs the workload once before measurement to warm up. Small differences between similar cases may be normal variation.

## Test laptop

Both implementations ran on the same laptop:

| Component | Specification |
| --- | --- |
| Laptop | Lenovo ThinkPad X1 Carbon Gen 8 |
| Processor | Intel Core i5-10310U, x86-64 |
| CPU cores and threads | 4 physical cores, 8 logical threads |
| CPU frequency | 1.70 GHz nominal; reported maximum 4.40 GHz |
| Memory | 7.4 GiB usable RAM reported by Linux |
| Operating system | Fedora Linux 42, Workstation Edition |
| Kernel | Linux 6.19.14-108.fc42.x86_64 |
| Python runtime | Python 3.13.13 |
| Rust compiler and build | rustc 1.97.1; optimized release build |

## Overall cost by phase

The overview covers five phases. Each section below briefly explains what was timed; the [protocol description]({{< relref "protocol" >}}) explains how the phases work.

- **Setup:** create the authorities' keys and a voting credential for each voter.
- **Enrollment:** prepare each voter's app and the information it needs to check the PIN.
- **Credential management:** check each voter's PIN once.
- **Voting:** create and cast one ballot.
- **Tallying and verification:** count the votes and check the result.

Setup, enrollment and PIN-check totals are calculated from the cost per operation and the number of voters. Voting is per ballot; tallying and verification are measured for the whole election. The scope column shows the difference. These are amounts of processing work: voters can use their apps at the same time. Optional checks and requests are shown separately below.

### Python phase costs (ms)

| Phase | Scope | Referendum | Small | Baseline | Larger ballot | More ballots |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Setup | Election | 592.92 | 655.58 | 1,080.28 | 1,243.48 | 2,561.19 |
| Enrollment | Election | 419.54 | 476.44 | 770.41 | 933.11 | 1,969.46 |
| Credential management | Election | 363.02 | 408.60 | 664.87 | 797.83 | 1,664.00 |
| Voting | One ballot | 3,179.53 | 4,297.89 | 3,910.60 | 9,166.39 | 4,655.02 |
| Tallying and verification | Election | 30,811.40 | 37,833.80 | 63,682.11 | 123,638.79 | 136,391.48 |

### Rust phase costs (ms)

| Phase | Scope | Referendum | Small | Baseline | Larger ballot | More ballots |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Setup | Election | 15.04 | 14.96 | 26.81 | 26.55 | 56.61 |
| Enrollment | Election | 1.36 | 1.28 | 2.39 | 2.36 | 4.92 |
| Credential management | Election | 1.38 | 1.30 | 2.37 | 2.30 | 4.86 |
| Voting | One ballot | 8.23 | 11.93 | 12.04 | 27.44 | 11.75 |
| Tallying and verification | Election | 65.56 | 86.67 | 138.01 | 283.18 | 275.94 |

## Why Rust is faster here

An encrypted ballot includes mathematical proofs that it follows the election rules without revealing the vote. Creating and checking these proofs requires many calculations.

Python performs much of this arithmetic in Python code, using MIRACL Core[^MIRACL] and the P-256 curve. Rust uses compiled, optimized code from `curve25519-dalek`[^Dalek] with Ristretto[^Ristretto]. This helps explain the difference in speed.

Both the programming language and the cryptographic tools differ. These results compare the two implementations; they do not measure the effect of changing the language alone.

## Setup

Setup creates the authorities' keys and the public part of each voter's credential, called an **ACC**.

Credential generation accounts for most of this work because it is repeated for every voter. Rust's timing also includes assembling the credential on the voter's side and checking its proofs. Python's TT setup includes a table used for decryption; Rust measures that preparation separately.

### Python timings

| Action | Unit | Referendum | Small | Baseline | Larger ballot | More ballots |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| TT key setup | ms/election | 34.65 | 35.54 | 34.83 | 39.59 | 38.31 |
| RT key setup | ms/election | 9.91 | 9.89 | 9.80 | 10.88 | 10.57 |
| Credential (ACC) generation | ms/credential | 109.67 | 122.03 | 115.07 | 132.56 | 132.23 |

### Rust timings

| Action | Unit | Referendum | Small | Baseline | Larger ballot | More ballots |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| TT key setup | ms/election | 0.22 | 0.24 | 0.23 | 0.23 | 0.22 |
| RT key setup | ms/election | 0.33 | 0.35 | 0.34 | 0.33 | 0.32 |
| Credential (ACC) generation | ms/credential | 2.90 | 2.87 | 2.92 | 2.89 | 2.95 |

## Enrollment

Enrollment prepares the app's keys, recovery information and proof for checking the PIN.

Together, these steps take about **85.6 ms per voter in Python** and **0.27 ms in Rust** for the baseline case. Delivering the PIN and proof is not timed.

### Python timings

| Action | Unit | Referendum | Small | Baseline | Larger ballot | More ballots |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| App setup | ms/voter | 38.15 | 43.70 | 39.21 | 47.23 | 47.92 |
| PIN-proof generation | ms/voter | 45.76 | 51.59 | 46.39 | 56.45 | 55.73 |

### Rust timings

| Action | Unit | Referendum | Small | Baseline | Larger ballot | More ballots |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| App setup | ms/voter | 0.03 | 0.03 | 0.03 | 0.03 | 0.03 |
| PIN-proof generation | ms/voter | 0.24 | 0.23 | 0.24 | 0.23 | 0.23 |

## Credential management

The app checks the voter's PIN. In the baseline case, this takes about **73.9 ms in Python** and **0.26 ms in Rust**.

Only Rust measures creating a ruse (decoy) PIN credential and its proof; delivery is excluded. PIN reminders and device recovery are not measured.

### Python timings

| Action | Unit | Referendum | Small | Baseline | Larger ballot | More ballots |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| PIN verification | ms/check | 72.61 | 81.72 | 73.87 | 88.65 | 87.58 |
| Ruse PIN request | ms/request | — | — | — | — | — |

### Rust timings

| Action | Unit | Referendum | Small | Baseline | Larger ballot | More ballots |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| PIN verification | ms/check | 0.28 | 0.26 | 0.26 | 0.26 | 0.26 |
| Ruse PIN request | ms/request | 0.27 | 0.26 | 0.27 | 0.26 | 0.26 |

## Voting

Voting includes encrypting the choices, creating ballot proofs and checking them at the ballot box. More candidates mean more work per ballot.

The optional individual check helps detect changes to the ballot and checks part of the evidence supplied by the app. It does not confirm publication on the public bulletin board, the public record of ballots and election results.

### Python timings

| Action | Unit | Referendum | Small | Baseline | Larger ballot | More ballots |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Ballot creation | ms/ballot | 1,538.36 | 2,093.45 | 1,901.93 | 4,470.18 | 2,271.32 |
| Casting and confirmation | ms/ballot | 1,641.16 | 2,204.45 | 2,008.67 | 4,696.21 | 2,383.70 |
| Individual verification | ms/check | — | — | — | — | — |

### Rust timings

| Action | Unit | Referendum | Small | Baseline | Larger ballot | More ballots |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Ballot creation | ms/ballot | 4.03 | 5.71 | 5.92 | 13.27 | 5.82 |
| Casting and confirmation | ms/ballot | 4.20 | 6.23 | 6.12 | 14.17 | 5.93 |
| Individual verification | ms/check | 0.50 | 0.63 | 0.62 | 1.25 | 0.62 |

## Tallying and verification

Tallying includes ballot checks, shuffling, removal of invalid and replaced votes, and calculation of the final totals.

Some proof checks are part of tallying itself. The separate verification row measures additional checks by an auditor. In Rust, these check the vote shuffle and the final decryption. This is not a complete election audit.

### Python timings

| Action | Unit | Referendum | Small | Baseline | Larger ballot | More ballots |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Tally | ms/election | 25,868.69 | 31,280.04 | 52,123.27 | 101,610.08 | 114,031.74 |
| Verification | ms/election | 4,942.71 | 6,553.76 | 11,558.84 | 22,028.71 | 22,359.74 |

### Rust timings

| Action | Unit | Referendum | Small | Baseline | Larger ballot | More ballots |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Tally | ms/election | 57.77 | 74.62 | 120.35 | 236.89 | 242.57 |
| Verification | ms/election | 7.80 | 12.06 | 17.66 | 46.29 | 33.37 |

With the same four candidates, increasing the workload from 6 to 10 to 20 submitted ballots raises Rust's tally time from **74.6 to 120.4 to 242.6 ms**. Python takes **31.3, 52.1 and 114.0 seconds**. These cases also have more registered voters and credentials to process.

## Ballot size

This is the size of one encrypted ballot and the information the app reveals to support checking it. It excludes the extra data needed to send it over a network. One kilobyte (kB) is 1,000 bytes.

| Case | Python (kB/ballot) | Rust (kB/ballot) |
| --- | ---: | ---: |
| Referendum | 5.7 | 5.4 |
| Small | 7.5 | 7.1 |
| Baseline | 7.5 | 7.1 |
| Larger ballot | 14.6 | 14.5 |
| More ballots | 7.5 | 7.1 |

More candidates make each ballot larger. More voters increase the number of ballots, rather than the size of each one. The two implementations produce similar ballot sizes.

## A larger election on the same laptop

We also tested Rust with **10,000 voters and 12,000 submitted ballots**, using four lists of ten candidates. As in the small cases, there was one registration authority, one counting authority and one ballot box. It rejected two invalid ballots and discarded 1,998 earlier votes that had been replaced, leaving one valid ballot for each voter. The final result matched the expected vote counts.

The large result comes from one measured run after warm-up. The 100- and 500-voter results below average two measured runs, also with 40 candidates.

| Eligible voters | Submitted ballots | Tally (seconds) | Verification (seconds) | Combined (seconds) |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 120 | 4.89 | 0.98 | 5.86 |
| 500 | 600 | 26.34 | 5.28 | 31.61 |
| 10,000 | 12,000 | 606.58 | 130.62 | 737.20 |

For the full 10,000-voter run, the other measured costs were:

| Work | Measured time | Scope |
| --- | ---: | --- |
| Setup and credential generation | 36.08 seconds | Keys, election settings, decryption preparation and all 10,000 credentials |
| Enrollment | 3.20 seconds | App setup and PIN-proof generation for all 10,000 voters |
| PIN verification | 0.31 ms | One check on the voter's device |
| Ruse PIN request | 0.32 ms | One decoy credential and proof; delivery excluded |
| Ballot creation | 33.87 ms | One sampled ballot on the voter's device |
| Casting and confirmation | 34.04 ms | Ballot-box checks for one sampled ballot |
| Individual verification | 2.38 ms | One optional check by the voter |

Each ballot occupied **26.9 kB**. The selected public results and proofs from tallying occupied **120.2 MB**; this is not a total for network traffic or storage.

Counting the votes and running the measured result checks took **12.3 minutes**. The full test took **39 minutes 56 seconds**, including warm-up and ballot preparation. Its highest memory use was **3.56 GiB** across the full test.

## Limits and next steps

These tests measure cryptographic processing, not a complete voting service. They exclude human input, network delays, persistent storage, identity checks and publication on the public bulletin board. Setting up that board and the voter register is also outside the measurements.

The implementations use different cryptographic tools and different mixes of invalid and replacement ballots. The verification measurements cover only some of the checks needed for a full audit.

All runs used one laptop with a low-power, four-core processor and limited memory. Clock speed varies, and power settings and background activity were not controlled. These timings do not show how fast the app would run on a phone or how much a server could improve performance.

The next step is to test the complete service on servers and voter devices, with more voters and more registration and counting authorities.

## Conclusion

Rust substantially reduced processing time in these tests. Creating and casting one ballot took **8–28 ms** in the five small cases. Counting 12,000 submitted ballots and running the measured result checks took **12.3 minutes**.

These results are a strong starting point for a practical voting service. Even on this laptop, Rust kept the measured voting work to milliseconds and handled an election with 10,000 voters in minutes. This gives us confidence to move forward with testing the complete service on servers and voter devices.

[^MIRACL]: MIRACL. *MIRACL Core Cryptographic Library*. GitHub repository. <https://github.com/miracl/core>

[^Dalek]: The dalek-cryptography contributors. *curve25519-dalek: Group operations on Ristretto and Curve25519*. GitHub repository. <https://github.com/dalek-cryptography/curve25519-dalek>

[^Ristretto]: *The Ristretto Group*. Design and documentation. <https://ristretto.group/>
