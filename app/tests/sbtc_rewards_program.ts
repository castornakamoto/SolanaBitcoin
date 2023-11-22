import * as anchor from "@project-serum/anchor";
import { Pdas } from "../target/types/pdas";

function shortKey(key) {
  return key.toString().substring(0, 8);
}



describe("pdas", () => {
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Pdas as anchor.Program<Pdas>;

  async function generateKeypair() {
    let keypair = anchor.web3.Keypair.generate();
    await provider.connection.requestAirdrop(
      keypair.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise(resolve => setTimeout(resolve, 3000)); // Sleep 3s
    return keypair;
  }

  async function derivePda(walletPubkey) {
    let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
      [
        walletPubkey.toBuffer(),
        Buffer.from("_"),
      ],
      program.programId
    );
    return pda;
  }

  async function createLockDataAccount(pda, wallet) {
    await program.methods.createLockData()
      .accounts({
        lockDataAccount: pda,
        wallet: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();
  }

  async function modifyLockData(amount_locked, wallet) {

    console.log("--------------------------------------------------");
    let data;
    let pda = await derivePda(wallet.publicKey);

    console.log(`Checking if account ${shortKey(pda)} has any token locked`);
    try {

      data = await program.account.lockInfo.fetch(pda);
      console.log("It does.");
    
    } catch (e) {
    
      console.log("It does NOT. Creating...");
      await createLockDataAccount(pda, wallet);
      data = await program.account.lockInfo.fetch(pda);
    };

    console.log("Success.");
    console.log("Data:");
    console.log(`    Locked tokens: ${data.amount_locked}`);
    console.log(`Modifying locked tokens from ${data.amount_locked} to ${amount_locked}`);

    await program.methods.modifyLockData(amount_locked)
      .accounts({
        lockDataAccount: pda,
        wallet: wallet.publicKey,
      })
      .signers([wallet])
      .rpc();

    data = await program.account.lockInfo.fetch(pda);
    console.log("New Data:");
    console.log(`    Balance: ${data.amount_locked}`);
    console.log("Success.");
  }

  // Additional functions (like distributeRewards) go here

  it("An example of lock data manipulation", async () => {
    const testKeypair = await generateKeypair();
    await modifyLockData(1000000, testKeypair);
    // More test cases as needed
  });
});
