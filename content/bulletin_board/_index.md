---
title: 'Web Bulletin Board'
weight: 200
---
---

# A Verifiable Bulletin Board for E-Voting

We turned a Certificate Transparency log into the public bulletin board of an end-to-end e-voting system. The board is append-only, signed, implements policy checks such as writing permissions, and it can be audited by parties who do not trust its operator.

## Why a bulletin board

In e-voting, the bulletin board is the single public record everyone checks against. Authorities publish keys and setup data on it. Ballot boxes publish a digest of every ballot they accept. Tellers publish the mix, the proofs and the result. Voters can check that their ballot is there, and auditors recompute the tally from it.

All of this operations work only if the board guarantees:
- **Append-only:** nothing published is ever changed or removed.
- **One view for everyone:** every reader sees the same history.
- **Only legitimate writers, at the right time:** a ballot box cannot publish a tally, and nobody can add ballots after the polls close.

## Starting point: transparency logs

Certificate Transparency already solves most of the board's problems, a CT log is an append-only Merkle tree. The operator periodically signs a checkpoint: the tree size and it's root hash. Anyone can then check two things with short proofs:
- **Inclusion:** an entry is in the tree that a checkpoint commits to.
- **Consistency:** a later checkpoint extends an earlier one, so nothing was rewritten.

Independent witnesses co-sign checkpoints, so a log that shows different trees to different readers is caught. Witnesses take accountability for the inclusion and consistency property of the Web Bulletin Board (WBB).

A first deviation from the original code (Sunlight[^Val26]) added three things:
- **A general-purpose log:** Sunlight only accepts X.509 certificates, the fork removes that dependency.
- **Aggregate witness signatures:** the log keeps its Ed25519 key, so existing tooling still verifies it. Witnesses sign with BLS, and their signatures aggregate into on signature per checkpoint instead of one Ed25519 signature per witness. The standard `note` format cannot carry an aggregate, so a custom note format was written.
- **Role-based write policy:** listing which voting authority may publish which entry type.

## What the board does

The board[^PB26] is the sunlight fork extended with four mechanisms. Each one of them turns a property the protocol assumes into something a reader can check.

### Signed entries from know authorities

Every entry carries the Ed25519 signature of the authority that wrote it, over the data, its identity and a timestamp. The board knows each authority's public key from setup and refuses anything else. It also refuses timestamps more than a preset threshold off its own clock.

### A write policy by phase and role

The fork supports several execution phases and precise policies that restrict who may write what, and when. Each entry type is bound to a role, a phase and a minimum number of co-signers, and the board refuses any write which violates these rules. Moving to the next phase is itself an entry, which only a designated role may write. For e-voting we configure three phases: setup, voting and tallying, and only the phase manager can advance them.

### Threshold entries

Besides entries signed by a single authority, the board supports entries that are not valid until a threshold of authorities has endorsed them. Such an entry, like the teller's tally result, is collected server-side until enough signatures have been collected. A short grace period then lets late co-signers join the same leaf. A co-signature arriving after publication becomes a new leaf that points to the original, so nothing is lost or rewritten.

### Independent validators

Separate validator processes fetch the signed checkpoint, rebuild the Merkle tree from the published leaves, and check the root and every inclusion proof. Each validator then signs with BLS every leaf it verified. The board serves the per-leaf signatures and their aggregate, so a reader checks one signature, the aggregate, even with many validators.

## How we integrated the WBB in the voting protocol

Every authority writes to the board. Entries, the current phase and the checkpoint are public, so the voter app, the public board page, the auditor and the tally all read back the same record.
A voter's app finds the digest of its own ballot and the confirmation it sent. Anyone can do the same on the public page. The tally reads the released ballots and posts its result back as a threshold entry. The auditor re-runs every check from the raw entries. Validators reads as well as writes, their leaf signatures go back on the board.


## What the WBB does not

It does not judge content it only checks who wrote an entry, when, and of what type. Whether a proof inside it is valid is for the tally and the auditor to check. That split is deliberate: the board stays simple, and every check of meaning is rerun by anyone. It also does not stop the possibility of a split view but makes it detectable, provided readers compare checkpoints through the validators. Finally availability is not guaranteed, due to its paramount functions in the voting operations, redundancy solutions are required.

## Limits and next steps

This is a research prototype run as a referendum proof of concept, not a production board, the main open points:
- **Fork detection depends on readers comparing checkpoints:** the validators sign what they saw requiring accountability of their checks.
- **Post-quantum signatures:** the implementation supports crypto agility making the upgrade trivial, one notable exception are aggregate signatures which are still an open topic in PQC field without a convincing post-quantum alternative for this use-case.
- **Distributed deployment:** to enhance availability a distributed approach could be considered.

[^Val26]: Valsorda, F. (2026). Sunlight: A Certificate Transparency log implementation and monitoring API designed for scalability, ease of operation, and reduced cost. *GitHub Repository*. <https://github.com/FiloSottile/sunlight>

[^PB26]:Perez, A., and Bortolameotti, E. (2026). Sunlight (fork): A Certificate Transparency log implementation and monitoring API designed for scalability, ease of operation, and reduced cost. *GitHub Repository*. <https://github.com/aleph-fbk/wbb_voting>
