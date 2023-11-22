import * as anchor from "@project-serum/anchor";
import { Pdas } from "../target/types/pdas";



function shortKey(key: anchor.web3.PublicKey) {
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
    await new Promise( resolve => setTimeout(resolve, 3 * 1000) ); // Sleep 3s
    return keypair;
  }

  async function derivePda(pubkey: anchor.web3.PublicKey) {
    let [pda, _] = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        pubkey.toBuffer(),
        Buffer.from("_")
      ],
      program.programId
    );
    return pda;
  }

  async function createLedgerAccount(
    pda: anchor.web3.PublicKey, 
    wallet: anchor.web3.Keypair
  ) {
    await program.methods.createLedger()
      .accounts({
        ledgerAccount: pda,
        wallet: wallet.publicKey,
      })
      .signers([wallet])
      .rpc();
  }

  async function modifyLedger(
    newBalance: number,
    wallet: anchor.web3.Keypair, 
  ) {

    console.log("--------------------------------------------------");
    let data;
    let pda = await derivePda(wallet.publicKey);

    console.log(`Checking if account ${shortKey(pda)} exists`);
    try {

      data = await program.account.ledger.fetch(pda);
      console.log("It does.");
    
    } catch (e) {
    
      console.log("It does NOT. Creating...");
      await createLedgerAccount(pda, wallet);
      data = await program.account.ledger.fetch(pda);
    };

    console.log("Success.");
    console.log("Data:")
    console.log(`    Color: ${data.color}   Balance: ${data.balance}`);
    console.log(`Modifying balance of ${data.color} from ${data.balance} to ${newBalance}`);

    await program.methods.modifyLedger(newBalance)
      .accounts({
        ledgerAccount: pda,
        wallet: wallet.publicKey,
      })
      .signers([wallet])
      .rpc();

    data = await program.account.ledger.fetch(pda);
    console.log("New Data:")
    console.log(`    Timestamp: ${data.timestamp}   Balance: ${data.balance}`);
    console.log("Success.");
  }


  it("An example of PDAs in action", async () => {

    const testKeypair1 = await generateKeypair();
    await modifyLedger(2, testKeypair1);
    await modifyLedger(4, testKeypair1);

    const testKeypair2 = await generateKeypair();
    await modifyLedger(3, testKeypair2);
    await modifyLedger(3, testKeypair2);
  });
});