import * as anchor from "@project-serum/anchor";
import { convertLockToReadable, derivePda, shortKey } from "../utils/utils";
import { RewardSystem } from "../../target/types/reward_system";

export async function getLocksInformation(program: anchor.Program<RewardSystem>, wallet: anchor.web3.Keypair) {
    console.log("--------------------------------------------------");

    let data;
    let pda = await derivePda(program, wallet.publicKey);
    

    // Check if the lock account associated with the PDA exists
    console.log(`Checking if account ${shortKey(pda)} exists`);
    try {
      data = await program.account.lockAccount.fetch(pda);
      console.log("lock account exists.");
    } catch (e) {
      console.log("lock account does NOT exist.");
      return;
    }

    // Fetch and display updated lock account data
    const updatedData = await program.account.lockAccount.fetch(pda) as LockAccount;
    updatedData.locks.forEach((lock, index) => {
      const readableLock = convertLockToReadable(lock);
      console.log(`Lock ${index}: Amount - ${readableLock.amount}, Timestamp - ${readableLock.timestamp}`);
    });
}


