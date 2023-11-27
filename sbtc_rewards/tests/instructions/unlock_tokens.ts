import * as anchor from "@project-serum/anchor";
import { convertLockToReadable, derivePda, shortKey } from "../utils/utils";
import { RewardSystem } from "../../target/types/reward_system";

/**
 * Withdraws a specified amount of funds from the ledger associated with the provided wallet.
 *
 * @param {anchor.web3.Keypair} wallet - The wallet keypair from which to withdraw funds.
 * @param lockIndex - The index of the lock to withdraw from.
 * @param {anchor.BN} amount - The amount of funds to withdraw, in lamports.
 * @returns {Promise<void>} A promise that resolves when the withdrawal is complete.
 */
export async function unlockTokens(program: anchor.Program<RewardSystem>, wallet: anchor.web3.Keypair, lockIndex: anchor.BN, amount: anchor.BN) {
    console.log("--------------------------------------------------");
    const provider = anchor.AnchorProvider.env();
    let currentData;
    let pda = await derivePda(program, wallet.publicKey);

    // Check if the lock account associated with the PDA exists
    console.log(`Checking if account ${shortKey(pda)} exists`);
    try {
        currentData = await program.account.lockAccount.fetch(pda) as LockAccount;
        currentData.locks.forEach((lock, index) => {
            const readableLock = convertLockToReadable(lock);
            console.log(`Lock ${index}: Amount: ${readableLock.amount} || Timestamp: ${readableLock.timestamp}`);
        });
    } catch (e) {
        console.log("lock account does NOT exist. Withdrawal not possible.");
        return;
    }

    // Convert the withdrawal amount from lamports to SOL for display
    const withdrawalAmountSOL = amount.toNumber() / anchor.web3.LAMPORTS_PER_SOL;
    console.log(`Requesting withdrawal of ${withdrawalAmountSOL} SOL from lock ${lockIndex}...`);

    // Verify if the requested lock index is valid
    if (lockIndex.toNumber() >= currentData.locks.length) {
        console.log(`Invalid lock index: ${lockIndex}. Last lock index: ${currentData.locks.length - 1}`);
        return;
    }

    // Verify if the requested withdrawal amount is valid
    if (amount.toNumber() > currentData.locks[lockIndex.toNumber()].amount) {
        console.log("Insufficient funds for withdrawal.");
        return;
    }

    // Get the previous balance of the wallet and display it in SOL
    const prevBalance = await provider.connection.getBalance(wallet.publicKey);
    console.log(`Previous balance in source wallet: ${prevBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);

    // Invoke the withdrawFunds method of the program
    console.log(`Unlocking ${withdrawalAmountSOL} SOL...`);
    await program.methods.unlockTokens(amount, lockIndex)
        .accounts({
            lockAccount: pda,
            wallet: wallet.publicKey,
        })
        .signers([wallet])
        .rpc();

    // Fetch and display updated lock account data
    const updatedData = await program.account.lockAccount.fetch(pda) as LockAccount;
    updatedData.locks.forEach((lock, index) => {
        const readableLock = convertLockToReadable(lock);
        console.log(`Lock ${index}: Amount: ${readableLock.amount} || Timestamp: ${readableLock.timestamp}`);
    });


    // Get the current balance of the wallet and display it in SOL
    const endBalance = await provider.connection.getBalance(wallet.publicKey);
    console.log(`Current balance in source wallet: ${endBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
}