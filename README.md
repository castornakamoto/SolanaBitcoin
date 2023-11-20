# SolanaBitcoin Rewards Program

## Overview

This project contains the smart contract that will be used for the token reward system for long term holders. It includes a client written in JavaScript to interact with the Solana blockchain and a smart contract written in Rust.

## Getting Started

### Prerequisites

- Node.js and npm
- Rust and Cargo
- Solana CLI tools

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/castornakamoto/SolanaBitcoin.git
cd [your-repository-directory]
npm install
```


### Running a Local Solana Testnet
Use Solana CLI to run a local testnet:

```bash
solana-test-validator
```

### Deploying the Smart Contract
Compile and deploy the smart contract:

```bash
cd path/to/your/rust/project
cargo build-bpf --bpf-out-dir=dist/program
solana program deploy dist/program/solana_hello_world.so
```

### Usage
Run the client script to interact with the smart contract:

```bash
node client.js
```

### Smart Contract Functionality
- LockFunds: Lock an amount of funds in the smart contract.
- UnlockFunds: Unlock the funds.
- GetLockInfo: Retrieve information about the locked funds.

### Development
- Client (JavaScript)
The client is responsible for sending transactions to the Solana network for debug purposes. It uses the @solana/web3.js library.

- Smart Contract (Rust)
The smart contract processes instructions for locking and unlocking funds. It's written in Rust using the Solana Program Library (SPL).

### Contributing
Contributions are welcome! Please read our contributing guidelines for details.
