---
title: 'Protocol Description'
weight: 100
---
---

The e-voting protocol here discussed[^LMST22][^BLMMSST23] is derived from Civitas[^CCM08], improved with the techniques of[^ABRRTY10][^AT13][^dSA08] to have a vote tally linear in the number of votes, with threshold construction of the voting credential derived from[^WZF05] and with coercion-resistant voting credentials[^JCJ10].

## Actors

Authorities are entities which have some degree of trust and are managed by a recognized public institution. In *Vote App* there are four authorities:

- **Registration Teller (RT)**: The RTs are entities that have access to a private database and can communicate with the application and the Tabulation Tellers.  
- **Tabulation Teller (TT)**: The TTs are entities that have access to a private database and can communicate with the Web Bulletin Board (WBB) and the Registration Tellers.
- **Electoral Roll (ER)**: The ER is an entity which checks the eligibility of a user and assigns a pseudonymous identifier, has access to a private database and communicates with the application. Also, it issues the single-use tokens required to cast ballots.
- **Ballot Box (BB)**: The BBs are entities which verify cast IDs, collect encrypted votes, check their formal correctness, and timestamp them via the WBB.
    
A service is an entity that is supposed to work reliably according to the specifications. In *Vote App* the followings are identified as services:

- **Web Bulletin Board (WBB)**: The WBB serves as the authoritative record of the election's true state. It ensures the reliable and consistent publication of public information while verifying the authorship of the data. Only authorized entities are permitted to publish information, which is accessible for anyone to read. However, once published, the data cannot be deleted or altered, safeguarding its integrity.
- **Verification Service (VS)**: The VS is an application which helps the voters verify the correctness of the information given by *Vote App*. Its authenticity is certified by some authority, e.g., the Electoral Roll (ER).
- **Notification Server (NS)**: The NS is a service which mediates the communication from the RTs to *Vote App* by sending notifications when some content is ready to be downloaded. It communicates with the RTs, *Vote App*, and the ER.
- **Digital Identity Provider (DIP)**: The DIP is a previously established service that certifies the identity and personal information of voters. It communicates with the ER and *Vote App*.

We identify with *users* all the other actors interacting with the protocol.

- **Eligible Voter**: An eligible voter is anyone who can cast a vote in the election.
- **Auditors**: The auditors are parties responsible for checking all publicly verifiable information. Auditors are considered to be Anonymous Users, have access to the WBB page, can download the app, but do not necessarily have a valid digital identity or the right to vote.

## Voting phases

![high-level-voting-protocol](/images/high-level-voting-protocol.svg)
*Simplified Diagram of our E-Voting solution. The five phases are represented in different colours: <span style="color:green">1-Setup</span>, <span style="color:blue">2-Enrollment</span>, <span style="color:purple">3-Credential Management</span>, <span style="color:red">4-Voting</span>, and <span style="color:orange">5-Tallying</span>.*

1. **Setup**: The protocol parameters are chosen, and the public keys are generated (1a and 1b) and published (1c).
Given some election parameters (1d), the registration authorities (Registration Tellers) cooperatively generate a voting credential for every eligible voter and publish the public parts (1e).
1. **Enrollment**: Using a voting device updated with the current election parameters (2a), each voter authenticates to the voting platform via their eID (2b), and the Electoral Roll (2c) checks their status as eligible voters. 
Then, the voting device requests to the RTs the voter's credential, which is delivered after a random waiting period (2d).
The authorities also send a DVNIZKP, so that voters can verify the validity of the PIN shown by their device (2e).
1. **Credential Management**: Each voter can set up one or more ruse PINs (3a) and verify them with the decoy DVNIZKP (3c).
Each voter can also request to receive again their valid PIN (3a) and/or verify a PIN with the DVNIZKP (3c) (multiple times).
Both ruse PINs and reminders (3b) are delivered and displayed exactly as in phase 2 (2d, 2e).
1. **Voting**: Each voter expresses their preferences on their voting device and validates them by inserting a PIN (4a).
The device creates an encrypted ballot (4b) and casts it (4c).
For confirmation, a hash is published on a Web Bulletin Board (WBB) (4d).
Each voter can simulate multiple votes by using their decoy PINs or express their real preference with their valid PIN.
Re-voting is allowed; only the last ballot cast with the valid PIN will count in the final tally.
1. **Tallying**: When the voting period ends, the encrypted ballots are released by the Ballot Boxes (5a).
Duplicate, malformed and invalid ballots are set aside after being verifiably mixed by the tallying authorities (Tabulation Tellers).
The remaining ballots are fetched (5b) and counted (5c), and proofs of correct tally execution are published (5d).

## Anti-Coercion Credentials (ACC)

These credentials allow voters under the influence of a coercer to express their true votes while pretending to comply with the coercer's demands.

Each voting credential comprises a private and a public part and will be used to validate cast ballots.
When the voter is, or fears they may be, subject to a coercion attack, they can autonomously create a decoy credential indistinguishable from the real one. This credential will not validate the corresponding ballot when votes are tallied.
The coercer cannot understand if a ballot has been built with a decoy or valid credential, since this distinction emerges only when the votes are tallied after all ballots have been shuffled.

To enhance usability of the scheme, in[^LMST22][^BLMMSST23] the credential is provided to the voter in the form of a six-digit PIN mask. 
When inserted during the voting phase, this PIN unmasks the valid credential needed to cast a valid vote. 
To create a decoy credential, it is sufficient to set up a decoy PIN.
The decoy credential is then delivered to the voter in the same way as the valid one, by a process indistinguishable from the genuine one to the coercer.

The correctness of the PIN can be verified via a Designated Verifier Non-Interactive Zero-Knowledge Proof (DVNIZKP), which proves the correctness of the associated credential.
If a decoy PIN is set up, a forged proof is created to verify the decoy credential.

> [!NOTE]
> The manner in which voters authenticate themselves as entitled to vote to obtain voting credentials to cast valid ballots is out of scope of this library. A candidate for such authentication is an electronic national identification (eID) scheme, such as an eIDAS-notified scheme.


[^LMST22]: Longo, R., Morelli, U., Spadafora, C., and Tomasi, A. (2022). Adaptation
of an i-voting scheme to italian elections for citizens abroad.
*E-Vote-ID 2022*. Seventh international joint conference on electronic
voting. https://doi.org/10.15157/diss/027

[^BLMMSST23]: Bitussi, M., Longo, R., Marino, F. A., Morelli, U., Sharif, A.,
Spadafora, C., and Tomasi, A. (2023). Coercion-resistant i-voting with
short PIN and OAuth 2.0. *E-Vote-ID 2023*. https://doi.org/10.18420/e-vote-id2023_04

[^CCM08]: Clarkson, M. R., Chong, S., and Myers, A. C. (2008). Civitas: Toward a
secure voting system. *2008 IEEE Symposium on Security and Privacy*,
354–368. https://doi.org/10.1109/SP.2008.32

[^ABRRTY10]: Araújo, R., Ben Rajeb, N., Robbana, R., Traoré, J., and Youssfi, S.
(2010). Towards practical and secure coercion-resistant electronic
elections. *Cryptology and Network Security*, 278–297.
https://doi.org/10.1007/978-3-642-17619-7_20

[^AT13]: Araújo, R., and Traoré, J. (2013). A practical coercion resistant voting
scheme revisited. *International Conference on e-Voting and Identity*,
193–209. https://doi.org/10.1007/978-3-642-39185-9_12

[^dSA08]: dos Santos Araújo, R. S. (2008). *On remote and voter-verifiable
voting* PhD thesis. Technische Universität Darmstadt.

[^WZF05]: Wang, H., Zhang, Y., and Feng, D. (2005). Short threshold signature
schemes without random oracles. *Progress in Cryptology - INDOCRYPT
2005*, 297–310. https://doi.org/10.1007/11596219_24

[^JCJ10]: Juels, A., Catalano, D., and Jakobsson, M. (2010). Coercion-resistant
electronic elections. In *Towards trustworthy elections* (Vol. 6000, pp.
37–63). Springer. https://doi.org/10.1007/978-3-642-12980-3_2