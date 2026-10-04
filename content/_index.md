---
title: 'Vote App'
cascade:
  type: docs
  math: true
  breadcrumbs: false
---
## Overview
Vote App aims to develop an electronic voting system that supports secure, verifiable, and coercion-resistant remote voting.

This work has been developed in the context of a research project partly funded by the Italian national mint (Istituto Poligrafico e Zecca dello Stato) and adapted to the Italian electoral law for Italian citizens voting from abroad.

## Resources

The main components developed within the project are available as open-source software:

- **[Web Bulletin Board](https://github.com/aleph-fbk/wbb_voting)** — implementation of the public bulletin board used to publish and retrieve election data in a verifiable way.
- **[Rust cryptographic primitives](https://github.com/aleph-fbk/pet-crypto-primitives-rs)** — Rust implementation of the cryptographic primitives used by the voting protocol.
- **[evoting-rs](https://github.com/aleph-fbk/evoting-rs)** — Rust implementation of the core e-voting protocol and its main operations.

Additional information about the research project, its goals, and its context is available on the **[iVoting eID project page](https://aleph.fbk.eu/projects/iVoting_eID/)**.

{{< cards >}}
    {{< card link="protocol/" title="Protocol Description" icon="information-circle" >}}
    {{< card link="bulletin_board/" title="Web Bulletin Board" icon="archive" >}}
    {{< card link="performance/" title="Performance Evaluation" icon="chart-bar" >}}
{{< /cards >}}
