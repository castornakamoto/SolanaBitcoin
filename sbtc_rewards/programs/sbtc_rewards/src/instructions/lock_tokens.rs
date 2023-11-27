use anchor_lang::prelude::*;
use solana_program::program::invoke;
use solana_program::system_instruction;
use crate::state::lock_account::LockAccount;
use crate::state::lock_entry::LockEntry;


#[derive(Accounts)]
pub struct LockTokens<'info> {
    #[account(mut)]
    pub lock_account: Account<'info, LockAccount>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}


pub fn handler(ctx: Context<LockTokens>, amount: u64) -> Result<()> {

    let lock_account = &mut ctx.accounts.lock_account;
    let wallet = &ctx.accounts.wallet;
    let system_program = &ctx.accounts.system_program;


    // Transfer funds from the wallet to the lock account
    invoke(
        &system_instruction::transfer(
            wallet.to_account_info().key,
            lock_account.to_account_info().key,
            amount,
        ),
        &[
            wallet.to_account_info(),
            lock_account.to_account_info(),
            system_program.to_account_info(),
        ],
    )?;

    // Create and add the new lock to the lock account
    lock_account.locks.push(LockEntry {
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}