import * as anchor from "@project-serum/anchor";
import { Pdas } from "../target/types/pdas";
import { BN } from "bn.js";
import { generateAndSaveKeypair, loadKeypair, requestAirdrop } from "./keypair-utils"; // Adjust the path as needed



/**
 * Returns a shortened version of a public key, useful for displaying or logging.
 * @param key - The public key to shorten.
 * @returns The first 8 characters of the public key as a string.
 */
function shortKey(key: anchor.web3.PublicKey): string {
  return key.toString().substring(0, 8);
}


describe("pdas", () => {
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Pdas as anchor.Program<Pdas>;

  
  /**
   * Derives a program-derived address (PDA) based on the given public key and program ID.
   * @param pubkey - The public key used to derive the PDA.
   * @returns The derived program address.
   */
  async function derivePda(pubkey: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> {
    const [pda, _] = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        pubkey.toBuffer(),
        Buffer.from("_")
      ],
      program.programId
    );
    return pda;
  }


  /**
   * Creates a ledger account by invoking the appropriate program method.
   * @param pda - The program-derived address (PDA) associated with the ledger account.
   * @param wallet - The keypair of the wallet initiating the account creation.
   */
  async function createLedgerAccount(
    pda: anchor.web3.PublicKey,
    wallet: anchor.web3.Keypair
  ): Promise<void> {
    await program.methods.createLedger()
      .accounts({
        ledgerAccount: pda,
        wallet: wallet.publicKey,
      })
      .signers([wallet])
      .rpc();
  }


  /**
   * Deposits a specified amount of tokens into a ledger account associated with the given wallet.
   * If the ledger account does not exist, it is created.
   * @param amount - The amount of tokens to deposit.
   * @param wallet - The keypair of the wallet initiating the deposit.
   */
  async function depositFunds(
    amount: anchor.BN,
    wallet: anchor.web3.Keypair
  ): Promise<void> {
    console.log("\n");
    console.log("--------------------------------------------------");
  
    // Log current wallet public key
    console.log(`Current wallet: ${shortKey(wallet.publicKey)}`);
  
    // Derive the PDA for the wallet
    let currentData;
    let pda = await derivePda(wallet.publicKey);
  
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
      await createLedgerAccount(pda, wallet);
      console.log("Ledger account created.");
    }
  
    // Display the current balance in the source wallet in SOL
    const initialBalance = await provider.connection.getBalance(wallet.publicKey);
    console.log(`Initial balance in source wallet: ${initialBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
  
    // Invoke the depositFunds method of the program
    console.log(`Depositing ${amount.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL tokens...`);
    await program.methods.depositFunds(amount)
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
  

  /**
   * Withdraws a specified amount of funds from the ledger associated with the provided wallet.
   *
   * @param {anchor.BN} amount - The amount of funds to withdraw, in lamports.
   * @param lockIndex - The index of the lock to withdraw from.
   * @param {anchor.web3.Keypair} wallet - The wallet keypair from which to withdraw funds.
   * @returns {Promise<void>} A promise that resolves when the withdrawal is complete.
   */
  async function withdrawFunds(amount: anchor.BN, lockIndex: anchor.BN, wallet: anchor.web3.Keypair) {
    console.log("--------------------------------------------------");

    let currentData;
    let pda = await derivePda(wallet.publicKey);

    // Check if the ledger account associated with the PDA exists
    console.log(`Checking if account ${shortKey(pda)} exists`);
    try {
      currentData = await program.account.ledger.fetch(pda) as LedgerData;
      currentData.locks.forEach((lock, index) => {
        const readableLock = convertLockToReadable(lock);
        console.log(`Lock ${index}: Amount - ${readableLock.amount}, Timestamp - ${readableLock.timestamp}`);
      });
    } catch (e) {
        console.log("Ledger account does NOT exist. Withdrawal not possible.");
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
    console.log(`Withdrawing ${withdrawalAmountSOL} SOL...`);
    await program.methods.withdrawFunds(amount, lockIndex)
        .accounts({
            ledgerAccount: pda,
            wallet: wallet.publicKey,
        })
        .signers([wallet])
        .rpc();

    // Fetch and display updated ledger account data
    const updatedData = await program.account.ledger.fetch(pda) as LedgerData;
    updatedData.locks.forEach((lock, index) => {
      const readableLock = convertLockToReadable(lock);
      console.log(`Lock ${index}: Amount - ${readableLock.amount}, Timestamp - ${readableLock.timestamp}`);
    });


    // Get the current balance of the wallet and display it in SOL
    const endBalance = await provider.connection.getBalance(wallet.publicKey);
    console.log(`Current balance in source wallet: ${endBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
  }


  async function getLocksInformation(wallet: anchor.web3.Keypair) {
    console.log("--------------------------------------------------");

    let data;
    let pda = await derivePda(wallet.publicKey);

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



  function convertLockToReadable(lock: { amount: string; timestamp: string }): { amount: string; timestamp: string } {
    // Convert the hexadecimal string to a BN, then to a decimal string
    const amountInLamports = new anchor.BN(lock.amount, 16);
    
    // Convert the amount from lamports to SOL (as a floating-point number)
    const amountInSol = amountInLamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL;
    
    // Format the SOL amount to a string with decimals
    const formattedAmountInSol = amountInSol.toFixed(9); // Adjust the number of decimal places as needed

    // Convert the timestamp from hexadecimal to a decimal string
    const convertedTimestamp = new anchor.BN(lock.timestamp, 16).toString(5);

    return {
        amount: formattedAmountInSol,
        timestamp: convertedTimestamp
    };
}



  

  it('An example of PDAs in action', async () => {

      // Load or generate keypairs for test accounts
      const testKeypair1 = await loadKeypair('testKeypair1') || await generateAndSaveKeypair('testKeypair1');
      const testKeypair2 = await loadKeypair('testKeypair2') || await generateAndSaveKeypair('testKeypair2');

      // Request SOL from the faucet
      await requestAirdrop(provider, testKeypair1, 2 * anchor.web3.LAMPORTS_PER_SOL); 
      await requestAirdrop(provider, testKeypair2, 2 * anchor.web3.LAMPORTS_PER_SOL);
      await new Promise( resolve => setTimeout(resolve, 3 * 1000) ); // Sleep  

      // Test functions
      //await getLocksInformation(testKeypair1);
      //await getLocksInformation(testKeypair2);
      //await depositFunds(new BN(1350000000), testKeypair1);
      //await depositFunds(new BN(2100000000), testKeypair2);
      await withdrawFunds(new BN(500000000), new BN(1), testKeypair1);
      await withdrawFunds(new BN(10000000), new BN(1), testKeypair2);
  });
});


