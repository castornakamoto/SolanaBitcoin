use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::ledger::Ledger;


#[derive(Accounts)]
pub struct UnlockTokens<'info> {
    #[account(mut, signer)]
    pub wallet: Signer<'info>,
    #[account(mut)]
    pub ledger_account: Account<'info, Ledger>,
    pub system_program: Program<'info, System>,
}


pub fn handler(ctx: Context<UnlockTokens>, amount: u64, lock_index: u64,) -> Result<()> {

    let ledger_account = &mut ctx.accounts.ledger_account;
    let wallet = &ctx.accounts.wallet;

    let lockindex = lock_index as usize;

    // Check if the lock_index is valid
    if lockindex >= ledger_account.locks.len() {
        return Err(ErrorCode::LockIndexOutOfBounds.into());
    }

    // Temporarily remove the lock from the vector for processing
    let mut lock = ledger_account.locks.remove(lockindex);

    // Ensure there are sufficient funds in the lock
    if lock.amount < amount {
        // If insufficient funds, add the lock back to the ledger before returning error
        ledger_account.locks.insert(lockindex, lock);
        return Err(ErrorCode::InsufficientFunds.into());
    }

    // Perform the fund transfer
    **ledger_account.to_account_info().try_borrow_mut_lamports()? -= amount;
    **wallet.to_account_info().try_borrow_mut_lamports()? += amount;

    // Update the amount in the lock and re-insert the lock back into the ledger
    lock.amount -= amount;
    ledger_account.locks.insert(lockindex, lock);

    Ok(())
}