import * as anchor from "@project-serum/anchor";
import { Pdas } from "../target/types/pdas";
import { BN } from "bn.js";
import { generateAndSaveKeypair, loadKeypair } from "./keypair-utils"; // Adjust the path as needed



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
   * @param amount - The amount of tokens to deposit.
   * @param wallet - The keypair of the wallet initiating the deposit.
   */
  async function depositFunds(
    amount: anchor.BN,
    wallet: anchor.web3.Keypair
  ): Promise<void> {
    console.log("\n");
    console.log("--------------------------------------------------");

    //Log current wallet public key
    console.log(`Current wallet: ${shortKey(wallet.publicKey)}`);

    // Derive the PDA for the wallet
    let pda = await derivePda(wallet.publicKey);

    // Check if the ledger account associated with the PDA exists; otherwise, create it
    console.log(`Checking if account ${shortKey(pda)} exists`);
    try {
      const data = await program.account.ledger.fetch(pda);
      console.log("Ledger account exists.");

      // Display the current balance in the source wallet in SOL
      const initialBalance = await provider.connection.getBalance(wallet.publicKey);
      console.log(`Initial balance in source wallet: ${initialBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);

      const initialData = await program.account.ledger.fetch(pda);
      console.log(`Timestamp: ${initialData.timestamp} Previous locked amount: ${initialData.lockedAmount.toNumber()  / anchor.web3.LAMPORTS_PER_SOL} SOL tokens`);

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
      const updatedData = await program.account.ledger.fetch(pda);
      console.log(`Timestamp: ${updatedData.timestamp}  End locked amount: ${updatedData.lockedAmount.toNumber()  / anchor.web3.LAMPORTS_PER_SOL} SOL tokens`);

      // Get the current balance of the wallet and display it in SOL
      const endBalance = await provider.connection.getBalance(wallet.publicKey);
      console.log(`Current balance in source wallet: ${endBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    } catch (e) {
      console.log("Ledger account does NOT exist. Creating...");

      // Create the ledger account if it doesn't exist
      await createLedgerAccount(pda, wallet);
      console.log("Ledger account created.");

      // Retry the deposit operation
      await depositFunds(amount, wallet);
    }
  }

  async function withdrawFunds(
    amount: anchor.BN,
    wallet: anchor.web3.Keypair
): Promise<void> {
    console.log("--------------------------------------------------");

    let data;
    let pda = await derivePda(wallet.publicKey);

    // Check if the ledger account associated with the PDA exists
    console.log(`Checking if account ${shortKey(pda)} exists`);
    try {
        data = await program.account.ledger.fetch(pda);
        console.log("Ledger account exists.");
    } catch (e) {
        console.log("Ledger account does NOT exist. Withdrawal not possible.");
        return;
    }

    // Convert the withdrawal amount from lamports to SOL for display
    const withdrawalAmountSOL = amount.toNumber() / anchor.web3.LAMPORTS_PER_SOL;
    console.log(`Requesting withdrawal of ${withdrawalAmountSOL} SOL`);

    // Verify if the requested withdrawal amount is valid
    if (amount.toNumber() > data.lockedAmount) {
        console.log("Insufficient funds for withdrawal.");
        return;
    }

    // Get the previous balance of the wallet and display it in SOL
    const prevBalance = await provider.connection.getBalance(wallet.publicKey);
    console.log(`Previous balance in source wallet: ${prevBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);

    const initialData = await program.account.ledger.fetch(pda);
      console.log(`Timestamp: ${initialData.timestamp} Previous locked amount: ${initialData.lockedAmount.toNumber()  / anchor.web3.LAMPORTS_PER_SOL} SOL tokens`);

    // Invoke the withdrawFunds method of the program
    console.log(`Withdrawing ${withdrawalAmountSOL} SOL...`);
    await program.methods.withdrawFunds(amount)
        .accounts({
            ledgerAccount: pda,
            wallet: wallet.publicKey,
        })
        .signers([wallet])
        .rpc();

    // Fetch and display the updated ledger account data after withdrawal
    data = await program.account.ledger.fetch(pda);
    console.log(`Timestamp: ${data.timestamp}   Locked amount: ${data.lockedAmount / anchor.web3.LAMPORTS_PER_SOL} SOL`);

    // Get the current balance of the wallet and display it in SOL
    const endBalance = await provider.connection.getBalance(wallet.publicKey);
    console.log(`Current balance in source wallet: ${endBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
}

  

  it('An example of PDAs in action', async () => {

      // Load or generate keypairs for test accounts
      const testKeypair1 = await loadKeypair('testKeypair1') || await generateAndSaveKeypair('testKeypair1');
      const testKeypair2 = await loadKeypair('testKeypair2') || await generateAndSaveKeypair('testKeypair2');

    /*  // Request SOL from the faucet
      await provider.connection.requestAirdrop(
        testKeypair1.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await new Promise( resolve => setTimeout(resolve, 3 * 1000) ); // Sleep 

      await provider.connection.requestAirdrop(
        testKeypair2.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await new Promise( resolve => setTimeout(resolve, 3 * 1000) ); // Sleep  */

      // Test functions
      await withdrawFunds(new BN(500000000), testKeypair1);
      await withdrawFunds(new BN(10000000), testKeypair2);
  });
});