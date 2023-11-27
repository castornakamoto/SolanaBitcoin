# SolanaBitcoin Rewards Program

# Overview

This project includes a smart contract for a token reward system targeting long-term holders. It utilizes the Anchor framework for Solana, comprising a client written in JavaScript for interacting with the Solana blockchain, and a smart contract developed in Rust.\

## How does the program work?
TBD

## Smart Contract Functionality
- LockFunds: Lock an amount of funds in the smart contract.
- UnlockFunds: Unlock the funds.
- GetLockInfo: Retrieve information about the locked funds.
- ClaimRewards: Retrieved the obtained tokens 

## Development
- Client (TypeScript)
The client is responsible for sending transactions to the Solana network for debug purposes. It uses the @solana/web3.js library.

- Smart Contract (Rust)
The smart contract processes instructions for locking and unlocking funds. It's written in Rust using the Solana Program Library (SPL).

<br/>

# Getting Started

## Prerequisites

- Node.js and npm
- Rust, Cargo, and Anchor
- Solana CLI tools


## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/castornakamoto/SolanaBitcoin.git
cd [your-repository-directory]
npm install
```


## Setting up Anchor
https://www.anchor-lang.com/docs/installation

<br/>

## Running a Local Solana Testnet
Use Solana CLI to run a local testnet:

```bash
solana-test-validator
```

## Deploying the Smart Contract
Compile and deploy the smart contract:

```bash
cd path/to/your/rust/project
cargo build-bpf 
anchor build
anchor deploy
```

## Test

```bash
anchor test
```

<br/>

# Contributing
Contributions are welcome! Please read our contributing guidelines for details.

# License

This project and all its contents are copyrighted by SolanaBitcoin, © 2023 SolanaBitcoin. All rights reserved.

Any redistribution or reproduction of part or all of the contents in any form is prohibited other than the following:
- You may print or download to a local hard disk extracts for your personal and non-commercial use only.
- You may copy the content to individual third parties for their personal use, but only if you acknowledge the website as the source of the material.

You may not, except with our express written permission, distribute or commercially exploit the content. Nor may you transmit it or store it in any other website or other form of electronic retrieval system.
