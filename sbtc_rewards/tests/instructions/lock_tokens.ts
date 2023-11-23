import * as anchor from "@project-serum/anchor";
import { convertLockToReadable, derivePda, shortKey } from "../utils";
import { Pdas } from "../../target/types/pdas";
import { initLockAccount } from "./init_lock_account";

/**
 * Deposits a specified amount of tokens into a ledger account associated with the given wallet.
 * If the ledger account does not exist, it is created.
 * @param wallet - The keypair of the wallet initiating the deposit.
 * @param amount - The amount of tokens to deposit.
 */
export async function lockTokens(program: anchor.Program<Pdas>, wallet: anchor.web3.Keypair, amount: anchor.BN, ): Promise<void> {
    console.log("\n");
    console.log("--------------------------------------------------");
    console.log(`Current wallet: ${shortKey(wallet.publicKey)}`);

    const provider = anchor.AnchorProvider.env();

    // Derive the PDA for the wallet
    let currentData;
    let pda = await derivePda(program, wallet.publicKey);

    // Check if the ledger account associated with the PDA exists
    console.log(`Checking if account ${shortKey(pda)} exists`);
    let ledgerAccountExists = false;

    try {
        currentData = await program.account.ledger.fetch(pda);
        currentData.locks.forEach((lock, index) => {
            const readableLock = convertLockToReadable(lock);
            console.log(`Lock ${index}: Amount - ${readableLock.amount}, Timestamp - ${readableLock.timestamp}`);
        });
        ledgerAccountExists = true;
    } catch (e) {
        console.log("Ledger account does NOT exist. Creating...");
    }

    if (!ledgerAccountExists) {
        // Create the ledger account if it doesn't exist
        initLockAccount(program, pda, wallet);
        console.log("Ledger account created.");
    }

    // Display the current balance in the source wallet in SOL
    const initialBalance = await provider.connection.getBalance(wallet.publicKey);
    console.log(`Initial balance in source wallet: ${initialBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);

    // Invoke the depositFunds method of the program
    console.log(`Depositing ${amount.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL tokens...`);
    await program.methods.lockTokens(amount)
        .accounts({
            ledgerAccount: pda,
            wallet: wallet.publicKey,
        })
        .signers([wallet])
        .rpc();

    // Fetch and display the updated ledger account data after the deposit
    const updatedData = await program.account.ledger.fetch(pda) as LedgerData;
    updatedData.locks.forEach((lock, index) => {
        const readableLock = convertLockToReadable(lock);
        console.log(`Lock ${index}: Amount - ${readableLock.amount}, Timestamp - ${readableLock.timestamp}`);
    });

    // Get the current balance of the wallet and display it in SOL
    const endBalance = await provider.connection.getBalance(wallet.publicKey);
    console.log(`Current balance in source wallet: ${endBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
}
