import * as anchor from "@project-serum/anchor";
import fs from 'fs';
import { RewardSystem } from "../../target/types/reward_system";

const keypairDir = 'keypairs/';

export async function generateAndSaveKeypair(name: string): Promise<anchor.web3.Keypair> {
    const keypair = anchor.web3.Keypair.generate();
    const keypairFilePath = `${keypairDir}${name}.json`;

    // Save the secret key as a Uint8Array (binary format)
    const secretKeyBytes = keypair.secretKey;
    
    // Save the generated secret key to a file as a binary array
    fs.writeFileSync(keypairFilePath, Buffer.from(secretKeyBytes).toString('base64'));

    //console.log(`Generated and saved keypair for ${name} to ${keypairFilePath}`);
    return keypair;
}

export async function loadKeypair(name: string): Promise<anchor.web3.Keypair | undefined> {
    const keypairFilePath = `${keypairDir}${name}.json`;
  
    try {
        // Read the secret key from the file as a base64 encoded string
        const secretKeyBase64 = fs.readFileSync(keypairFilePath, 'utf8');

        // Decode the base64 string into a Uint8Array
        const secretKeyBytes = Buffer.from(secretKeyBase64, 'base64');
      
        // Create a Keypair from the decoded secret key
        const keypair = anchor.web3.Keypair.fromSecretKey(secretKeyBytes);
  
        console.log(`Loaded keypair for ${name} from ${keypairFilePath}`);
        return keypair;
    } catch (err) {
        // Log the error for debugging purposes
        console.error(`Failed to load keypair for ${name} from ${keypairFilePath}:`, err);
        return undefined; // Return undefined on failure
    }
}

/**
 * Requests an airdrop of a specified amount of lamports to a given test wallet.
 * 
 * @param {anchor.web3.Keypair} testKeypair1 - The test wallet keypair to which the airdrop
*/
export async function requestAirdrop(testKeypair1: anchor.web3.Keypair, amount: number) {
    const provider = anchor.AnchorProvider.env();
    
    console.log(`Requesting airdrop of ${amount / anchor.web3.LAMPORTS_PER_SOL} SOL tokens for ${shortKey(testKeypair1.publicKey)}`);

    // Get and print the balance before the airdrop
    const beforeAirdropBalance = await provider.connection.getBalance(testKeypair1.publicKey);
    console.log(`Balance before airdrop: ${beforeAirdropBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);

    await provider.connection.requestAirdrop(
      testKeypair1.publicKey,
      amount
    );

    // Wait for transaction to be confirmed
    await new Promise( resolve => setTimeout(resolve, 3 * 1000) ); // Sleep

    // Get and print the balance after the airdrop
    const afterAirdropBalance = await provider.connection.getBalance(testKeypair1.publicKey);
    console.log(`Balance after airdrop: ${afterAirdropBalance / anchor.web3.LAMPORTS_PER_SOL} SOL `);
}

  
/**
 * Derives a program-derived address (PDA) based on the given public key and program ID.
 * @param pubkey - The public key used to derive the PDA.
 * @returns The derived program address.
 */
export async function derivePda(program: anchor.Program<RewardSystem>, pubkey: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> {
    const [pda, _] = await anchor.web3.PublicKey.findProgramAddressSync(
        [
            pubkey.toBuffer(),
            Buffer.from("_")
        ],
        program.programId
    );
    return pda;
}

export function convertLockToReadable(lock: { amount: string; timestamp: string }): { amount: string; timestamp: string } {
    
    const amountInLamports = new anchor.BN(lock.amount, 16);
    const amountInSol = amountInLamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL;
    const formattedAmountInSol = amountInSol.toFixed(9);
    const convertedTimestamp = new anchor.BN(lock.timestamp, 16).toString(5);

    return {
        amount: formattedAmountInSol,
        timestamp: convertedTimestamp
    };
}


/**
 * Returns a shortened version of a public key, useful for displaying or logging.
 * @param key - The public key to shorten.
 * @returns The first 8 characters of the public key as a string.
 */
export function shortKey(key: anchor.web3.PublicKey): string {
    return key.toString().substring(0, 8);
}