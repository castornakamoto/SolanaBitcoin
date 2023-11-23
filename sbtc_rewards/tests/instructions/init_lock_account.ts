import * as anchor from "@project-serum/anchor";
import { Pdas } from "../../target/types/pdas";
   
   /**
   * Creates a lock account by invoking the appropriate program method.
   * @param pda - The program-derived address (PDA) associated with the lock account.
   * @param wallet - The keypair of the wallet initiating the account creation.
   */
 export async function initLockAccount(program: anchor.Program<Pdas>, pda: anchor.web3.PublicKey,wallet: anchor.web3.Keypair): Promise<void> {
    await program.methods.initLockAccount()
        .accounts({
            ledgerAccount: pda,
            wallet: wallet.publicKey,
        })
        .signers([wallet])
        .rpc();
}