import * as anchor from "@project-serum/anchor";
import { convertLockToReadable, derivePda, shortKey } from "../utils/utils";
import { RewardSystem } from "../../target/types/reward_system";
import { initLockAccount } from "./init_lock_account";

/**
 * Deposits a specified amount of tokens into a lock account associated with the given wallet.
 * If the lock account does not exist, it is created.
 * @param wallet - The keypair of the wallet initiating the deposit.
 * @param amount - The amount of tokens to deposit.
 */
export async function lockTokens(program: anchor.Program<RewardSystem>, wallet: anchor.web3.Keypair, amount: anchor.BN, ): Promise<void> {
    console.log("\n");
    console.log("--------------------------------------------------");
    console.log(`Current wallet: ${shortKey(wallet.publicKey)}`);

    const provider = anchor.AnchorProvider.env();

    // Derive the PDA for the wallet
    let currentData;
    let pda = await derivePda(program, wallet.publicKey);

    // Check if the lock account associated with the PDA exists
    console.log(`Checking if account ${shortKey(pda)} exists`);
    let lockAccountExists = false;

    try {
        currentData = await program.account.lockAccount.fetch(pda);
        currentData.locks.forEach((lock, index) => {
            const readableLock = convertLockToReadable(lock);
            console.log(`Lock ${index}: Amount: ${readableLock.amount} || Timestamp: ${readableLock.timestamp}`);
        });
        lockAccountExists = true;
    } catch (e) {
        console.log("Lock account does NOT exist. Creating...");
    }

    if (!lockAccountExists) {
        // Create the lock account if it doesn't exist
        await initLockAccount(program, pda, wallet);
    }

    // Display the current balance in the source wallet in SOL
    const initialBalance = await provider.connection.getBalance(wallet.publicKey);
    console.log(`Initial balance in source wallet: ${initialBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);

    // Check if the lock amount is available
    if (amount.toNumber() > initialBalance) {
        console.log(`Insufficient balance. Available: ${initialBalance / anchor.web3.LAMPORTS_PER_SOL} SOL, Required: ${amount.toNumber()  / anchor.web3.LAMPORTS_PER_SOL} SOL`);
        return; // Exit the function if insufficient funds
    }

    // Invoke the depositFunds method of the program
    console.log(`Locking ${amount.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL tokens...`);
    await program.methods.lockTokens(amount)
        .accounts({
            lockAccount: pda,
            wallet: wallet.publicKey,
        })
        .signers([wallet])
        .rpc();

    // Fetch and display the updated lock account data after the deposit
    const updatedData = await program.account.lockAccount.fetch(pda) as LockAccount;
    updatedData.locks.forEach((lock, index) => {
        const readableLock = convertLockToReadable(lock);
        console.log(`Lock ${index}: Amount: ${readableLock.amount} || Timestamp: ${readableLock.timestamp}`);
    });

    // Get the current balance of the wallet and display it in SOL
    const endBalance = await provider.connection.getBalance(wallet.publicKey);
    console.log(`Current balance in source wallet: ${endBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
}
