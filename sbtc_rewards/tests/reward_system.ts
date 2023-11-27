import * as anchor from "@project-serum/anchor";
import { RewardSystem } from "../target/types/reward_system";
import { BN } from "bn.js";
import { generateAndSaveKeypair, loadKeypair, requestAirdrop } from "./utils/utils"; // Adjust the path as needed
import { getLocksInformation } from "./instructions/get_locks_info";
import { lockTokens } from "./instructions/lock_tokens";
import { unlockTokens } from "./instructions/unlock_tokens";



describe("RewardSystem", () => {
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.RewardSystem as anchor.Program<RewardSystem>;

  // Load or generate keypairs for test accounts
  let testKeypair1, testKeypair2;

  before(async () => {
    testKeypair1 = await loadKeypair('testKeypair1') || await generateAndSaveKeypair('testKeypair1');
    testKeypair2 = await loadKeypair('testKeypair2') || await generateAndSaveKeypair('testKeypair2');
  });

  /* t('Full test', async () => {

    // Request SOL from the faucet
    await requestAirdrop(testKeypair1, 2 * anchor.web3.LAMPORTS_PER_SOL); 
    //await requestAirdrop(testKeypair2, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await new Promise( resolve => setTimeout(resolve, 3 * 1000) ); // Sleep  

    // Test functions
    await getLocksInformation(program, testKeypair1);
    //await getLocksInformation(program, testKeypair2);
    await lockTokens(program, testKeypair1, new BN(1350000000));
    //await lockTokens(program, testKeypair2, new BN(2100000000));
    await unlockTokens(program, testKeypair1, new BN(1), new BN(500000000));
    //await unlockTokens(program, testKeypair2, new BN(1), new BN(10000000));
  });*/

  /*it('should request SOL from the faucet for testKeypair1', async () => {
    await requestAirdrop(testKeypair1, 2 * anchor.web3.LAMPORTS_PER_SOL);
  }); */

  /*it('should get locks information for testKeypair1', async () => {
    await getLocksInformation(program, testKeypair1);
  }); */

  /*it('should lock tokens for testKeypair1', async () => {
    await lockTokens(program, testKeypair1, new BN(350000000));
  });*/

  it('should unlock tokens for testKeypair1', async () => {
    await unlockTokens(program, testKeypair1, new BN(1), new BN(350000000));
  });
});

