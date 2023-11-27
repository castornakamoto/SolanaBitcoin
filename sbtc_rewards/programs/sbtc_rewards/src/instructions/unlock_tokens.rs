use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::lock_account::LockAccount;


#[derive(Accounts)]
pub struct UnlockTokens<'info> {
    #[account(mut, signer)]
    pub wallet: Signer<'info>,
    #[account(mut)]
    pub lock_account: Account<'info, LockAccount>,
    pub system_program: Program<'info, System>,
}


pub fn handler(ctx: Context<UnlockTokens>, amount: u64, lock_index: u64,) -> Result<()> {

    let lock_account = &mut ctx.accounts.lock_account;
    let wallet = &ctx.accounts.wallet;

    let lockindex = lock_index as usize;

    // Check if the lock_index is valid
    if lockindex >= lock_account.locks.len() {
        return Err(ErrorCode::LockIndexOutOfBounds.into());
    }

    // Temporarily remove the lock from the vector for processing
    let mut lock = lock_account.locks.remove(lockindex);

    // Ensure there are sufficient funds in the lock
    if lock.amount < amount {
        // If insufficient funds, add the lock entry back to the lock_account before returning error
        lock_account.locks.insert(lockindex, lock);
        return Err(ErrorCode::InsufficientFundsForUnLocking.into());
    }

    // Perform the fund transfer
    **lock_account.to_account_info().try_borrow_mut_lamports()? -= amount;
    **wallet.to_account_info().try_borrow_mut_lamports()? += amount;

    // Update the amount in the lock and re-insert the lock back into the lock account
    lock.amount -= amount;
    lock_account.locks.insert(lockindex, lock);

    Ok(())
}