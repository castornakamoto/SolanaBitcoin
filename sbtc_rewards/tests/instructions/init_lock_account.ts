import * as anchor from "@project-serum/anchor";
import { RewardSystem } from "../../target/types/reward_system";
   
   /**
   * Creates a lock account by invoking the appropriate program method.
   * @param pda - The program-derived address (PDA) associated with the lock account.
   * @param wallet - The keypair of the wallet initiating the account creation.
   */
 export async function initLockAccount(program: anchor.Program<RewardSystem>, pda: anchor.web3.PublicKey,wallet: anchor.web3.Keypair): Promise<void> {
    await program.methods.initLockAccount()
        .accounts({
            lockAccount: pda,
            wallet: wallet.publicKey,
        })
        .signers([wallet])
        .rpc();

    console.log(`Lock account created at ${pda.toBase58()}`);
    
    // wait for lock account to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
}