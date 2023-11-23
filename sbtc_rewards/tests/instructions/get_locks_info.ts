import * as anchor from "@project-serum/anchor";
import { convertLockToReadable, derivePda, shortKey } from "../utils";
import { Pdas } from "../../target/types/pdas";

export async function getLocksInformation(program: anchor.Program<Pdas>, wallet: anchor.web3.Keypair) {
    console.log("--------------------------------------------------");

    let data;
    let pda = await derivePda(program, wallet.publicKey);
    

    // Check if the ledger account associated with the PDA exists
    console.log(`Checking if account ${shortKey(pda)} exists`);
    try {
      data = await program.account.ledger.fetch(pda);
      console.log("Ledger account exists.");
    } catch (e) {
      console.log("Ledger account does NOT exist.");
      return;
    }

    // Fetch and display updated ledger account data
    const updatedData = await program.account.ledger.fetch(pda) as LedgerData;
    updatedData.locks.forEach((lock, index) => {
      const readableLock = convertLockToReadable(lock);
      console.log(`Lock ${index}: Amount - ${readableLock.amount}, Timestamp - ${readableLock.timestamp}`);
    });
}


